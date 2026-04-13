/**
 * POST /api/prompt-generator/generate
 *
 * Core generation endpoint — handles Claude, Groq, and Gemini.
 */

import type { LessonApiEnv } from "../admin/lessons/_helpers";
import { JSON_HEADERS } from "../admin/lessons/_helpers";

type PgModel = "claude" | "groq" | "gemini";
type UserType = "paid_member" | "free_subscriber";

interface GenerateRequest {
  token?: string | null;
  model: PgModel;
  subject: string;
  topic: string;
  tone: string;
  output_length: "short" | "medium" | "detailed";
  include_role?: boolean;
  audience?: string;
  platform?: string;
  user_profile?: string;
  prompt_type?: "standard" | "image" | "video" | "music";
  detail_level?: "standard" | "detailed";
}

type PagesFunction<Env = unknown> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

async function resolveUser(
  request: Request,
  env: LessonApiEnv,
  token: string | null | undefined
): Promise<{ identifier: string; userType: UserType } | null> {
  // 1. Try Better Auth session
  try {
    const sessionUrl = new URL("/api/auth/get-session", request.url);
    const res = await fetch(sessionUrl.toString(), {
      method: "GET",
      headers: request.headers,
      credentials: "include",
    });
    if (res.ok) {
      const data = (await res.json()) as { user?: { id?: string } };
      if (data.user?.id) {
        const userId = data.user.id;
        // Check actual role — only paid_member and admin get paid limits
        const row = await env.PROVENAI_DB
          .prepare("SELECT role FROM user WHERE id = ?")
          .bind(userId)
          .first<{ role: string }>();
        const role = row?.role ?? "member";
        const userType: UserType =
          role === "paid_member" || role === "admin"
            ? "paid_member"
            : "free_subscriber";
        return { identifier: userId, userType };
      }
    }
  } catch { /* fall through */ }

  // 2. Try guest token
  if (token) {
    const nowIso = new Date().toISOString();
    const row = await env.PROVENAI_DB
      .prepare(
        "SELECT email FROM pg_guest_tokens WHERE token = ? AND expires_at > ? LIMIT 1"
      )
      .bind(token, nowIso)
      .first<{ email: string }>();
    if (row) {
      return { identifier: row.email, userType: "free_subscriber" };
    }
  }

  return null;
}

async function getSetting(db: LessonApiEnv["PROVENAI_DB"], key: string): Promise<string> {
  const row = await db
    .prepare("SELECT value FROM site_settings WHERE key = ?")
    .bind(key)
    .first<{ value: string }>();
  return row?.value ?? "";
}

function buildSystemPrompt(req: GenerateRequest): string {
  const detailed = req.detail_level === "detailed";

  if (req.prompt_type === "image") {
    const instruction = detailed
      ? `You are an expert at writing AI image generation prompts. Write a rich, comprehensive image prompt based on the user's description. Include subject, visual style, lighting, composition, colour palette, mood, camera angle, and any relevant artistic references. Suitable for Midjourney, DALL-E, or Stable Diffusion.`
      : `You are an expert at writing AI image generation prompts. Write a clear, focused image prompt based on the user's description. Include subject, style, and mood. Keep it concise. Suitable for Midjourney, DALL-E, or Stable Diffusion.`;
    let p = `${instruction}\n\nOutput only the image prompt itself, with no preamble, explanation, or meta-commentary.\n\nUser description: ${req.topic}`;
    if (req.user_profile) p += `\n\nUser context (incorporate naturally where relevant):\n${req.user_profile}`;
    return p;
  }

  if (req.prompt_type === "video") {
    const instruction = detailed
      ? `You are an expert at writing AI video generation prompts. Write a comprehensive video prompt based on the user's description. Include scene description, visual style, camera movement, pacing, lighting, colour tone, and atmosphere. Suitable for Sora, Runway, or Kling.`
      : `You are an expert at writing AI video generation prompts. Write a clear, focused video prompt based on the user's description. Include scene, visual style, and atmosphere. Keep it concise. Suitable for Sora, Runway, or Kling.`;
    let p = `${instruction}\n\nOutput only the video prompt itself, with no preamble, explanation, or meta-commentary.\n\nUser description: ${req.topic}`;
    if (req.user_profile) p += `\n\nUser context (incorporate naturally where relevant):\n${req.user_profile}`;
    return p;
  }

  if (req.prompt_type === "music") {
    const instruction = detailed
      ? `You are an expert at writing AI music generation prompts. Write a comprehensive music prompt based on the user's description. Include genre, tempo, instrumentation, mood, energy, vocal style, and any lyrical direction. Suitable for Suno or Udio.`
      : `You are an expert at writing AI music generation prompts. Write a clear, focused music prompt based on the user's description. Include genre, tempo, and mood. Keep it concise. Suitable for Suno or Udio.`;
    let p = `${instruction}\n\nOutput only the music prompt itself, with no preamble, explanation, or meta-commentary.\n\nUser description: ${req.topic}`;
    if (req.user_profile) p += `\n\nUser context (incorporate naturally where relevant):\n${req.user_profile}`;
    return p;
  }

  // Standard prompt — detailed expert prompt engineer behaviour
  let prompt = `You are an expert prompt engineer. Take the user's description and write a clear, detailed, well-structured prompt they can use with any AI assistant to get high-quality output on their topic.

The prompt must:
- Begin with a clear expert role assignment (e.g. "You are an expert financial advisor...")
- Be specific, actionable, and complete — the user should be able to paste it directly into any AI tool
- Be written in second person, addressing the AI being prompted
- Match the requested tone and output length
- Include any relevant constraints or output format instructions
- NOT include meta-commentary, explanations, or preamble — output only the prompt itself

Topic: ${req.topic}
Tone: ${req.tone}
Output length: ${req.output_length} — short means concise single output, medium means structured with a few sections, detailed means comprehensive with examples and multiple sections
Target audience: ${req.audience || "general adult audience"}
Platform: ${req.platform || "any AI tool (ChatGPT, Claude, Gemini, etc.)"}`;

  if (req.user_profile) {
    prompt += `\n\nUser context (incorporate naturally where relevant, do not reference it explicitly unless it adds value):\n${req.user_profile}`;
  }

  return prompt;
}

async function callGroq(
  db: LessonApiEnv["PROVENAI_DB"],
  systemPrompt: string
): Promise<string> {
  const apiKey = await getSetting(db, "pg_groq_api_key");
  const model = await getSetting(db, "pg_groq_model") || "llama-3.3-70b-versatile";

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate the prompt now." },
      ],
      max_tokens: 800,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error: ${err}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty response from Groq");
  return text;
}

async function callGemini(
  db: LessonApiEnv["PROVENAI_DB"],
  systemPrompt: string
): Promise<string> {
  const apiKey = await getSetting(db, "pg_gemini_api_key");
  const model = await getSetting(db, "pg_gemini_model") || "gemini-2.0-flash-001";

  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: `${systemPrompt}\n\nGenerate the prompt now.` }],
        },
      ],
      generationConfig: { maxOutputTokens: 800 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${err}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error("Empty response from Gemini");
  return text;
}

async function callClaude(
  db: LessonApiEnv["PROVENAI_DB"],
  systemPrompt: string
): Promise<string> {
  const apiKey = await getSetting(db, "pg_claude_api_key");
  const model = await getSetting(db, "pg_claude_model") || "claude-sonnet-4-20250514";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      system: systemPrompt,
      messages: [{ role: "user", content: "Generate the prompt now." }],
      max_tokens: 800,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error: ${err}`);
  }

  const data = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const text = data.content?.find((c) => c.type === "text")?.text?.trim();
  if (!text) throw new Error("Empty response from Claude");
  return text;
}

export const onRequestPost: PagesFunction<LessonApiEnv> = async ({ request, env }) => {
  try {
    const body = (await request.json()) as GenerateRequest;
    const { model, subject, topic, tone, output_length, audience, platform, token, user_profile, prompt_type, detail_level } = body;

    if (!model || !subject || !topic || !tone || !output_length) {
      return new Response(
        JSON.stringify({ error: "model, subject, topic, tone, and output_length are required" }),
        { status: 400, headers: JSON_HEADERS }
      );
    }

    if (!["claude", "groq", "gemini"].includes(model)) {
      return new Response(
        JSON.stringify({ error: "Invalid model" }),
        { status: 400, headers: JSON_HEADERS }
      );
    }

    const db = env.PROVENAI_DB;

    // 1. Resolve user identity
    const user = await resolveUser(request, env, token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: JSON_HEADERS,
      });
    }

    // 2. Special case: free subscribers cannot use Claude
    if (model === "claude" && user.userType === "free_subscriber") {
      return new Response(
        JSON.stringify({ error: "Claude is available to Proven AI paid members only" }),
        { status: 403, headers: JSON_HEADERS }
      );
    }

    // 3. Check if model is enabled
    const enabledVal = await getSetting(db, `pg_${model}_enabled`);
    if (enabledVal === "false") {
      return new Response(
        JSON.stringify({ error: `${model} is currently disabled` }),
        { status: 503, headers: JSON_HEADERS }
      );
    }

    // 4. Check daily usage limit
    const dateBucket = new Date().toISOString().slice(0, 10);
    const countRow = await db
      .prepare(
        "SELECT COUNT(*) as cnt FROM pg_usage WHERE user_identifier = ? AND model = ? AND date_bucket = ?"
      )
      .bind(user.identifier, model, dateBucket)
      .first<{ cnt: number }>();

    const usedToday = countRow?.cnt ?? 0;
    const limitKey = user.userType === "paid_member"
      ? `pg_${model}_paid_daily_limit`
      : `pg_${model}_free_daily_limit`;
    const limitVal = await getSetting(db, limitKey);
    const dailyLimit = parseInt(limitVal || "0", 10);

    if (usedToday >= dailyLimit) {
      return new Response(
        JSON.stringify({
          error: "Daily limit reached",
          model,
          limit: dailyLimit,
          resets: "tomorrow",
        }),
        { status: 429, headers: JSON_HEADERS }
      );
    }

    // 5. Build system prompt and call model
    const systemPrompt = buildSystemPrompt({ model, subject, topic, tone, output_length, audience, platform, user_profile, prompt_type, detail_level });

    let generatedPrompt: string;
    if (model === "groq") {
      generatedPrompt = await callGroq(db, systemPrompt);
    } else if (model === "gemini") {
      generatedPrompt = await callGemini(db, systemPrompt);
    } else {
      generatedPrompt = await callClaude(db, systemPrompt);
    }

    // 6. Record usage
    await db
      .prepare(
        `INSERT INTO pg_usage (id, user_identifier, user_type, model, used_at, date_bucket)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(
        crypto.randomUUID(),
        user.identifier,
        user.userType,
        model,
        new Date().toISOString(),
        dateBucket
      )
      .run();

    const newUsedToday = usedToday + 1;

    return new Response(
      JSON.stringify({
        prompt: generatedPrompt,
        model,
        usage: {
          used_today: newUsedToday,
          daily_limit: dailyLimit,
          remaining: Math.max(0, dailyLimit - newUsedToday),
        },
      }),
      { headers: JSON_HEADERS }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
};
