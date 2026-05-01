import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Copy,
  Download,
  RefreshCw,
  Loader2,
  Lock,
  ChevronDown,
  ChevronUp,
  Crown,
  ArrowUpRight,
  User,
  Mail,
} from "lucide-react";
import AboutMePanel from "../components/promptGenerator/AboutMePanel";
import { getProfile, profileToText } from "../utils/promptGeneratorProfile";

type PgModel = "claude" | "groq" | "gemini";
type OutputLength = "short" | "medium" | "detailed";

interface CreditBalance {
  credits_used: number;
  credits_total: number;
  credits_remaining: number;
  tier: number;
  tier_name: string;
}

interface PromptGeneratorPageProps {
  userType: "paid_member" | "free_subscriber";
  userEmail: string;
  guestToken?: string;
  isAnonymous?: boolean;
}

const PROMPT_TYPES = [
  { id: "standard", label: "Standard Prompt" },
  { id: "image",    label: "Image Prompt" },
  { id: "video",    label: "Video Prompt" },
  { id: "music",    label: "Music Prompt" },
] as const;

type PromptTypeId = typeof PROMPT_TYPES[number]["id"];

const TONES = [
  { value: "Formal / Professional",      label: "Formal" },
  { value: "Friendly & Conversational",  label: "Friendly" },
  { value: "Step-by-step / Structured",  label: "Step-by-step" },
  { value: "Short & Punchy",             label: "Punchy" },
  { value: "Detailed & Thorough",        label: "Thorough" },
];

const LENGTHS: { value: OutputLength; label: string; desc: string }[] = [
  { value: "short",    label: "Quick",        desc: "Concise single output" },
  { value: "medium",   label: "Balanced",     desc: "A few sections" },
  { value: "detailed", label: "Comprehensive", desc: "In-depth with examples" },
];

const MODELS: { id: PgModel; name: string; tagline: string }[] = [
  { id: "groq",   name: "Groq",   tagline: "Fast & Free" },
  { id: "gemini", name: "Gemini", tagline: "Google AI" },
  { id: "claude", name: "Claude", tagline: "Most Powerful" },
];

const EXAMPLE_CHIPS = [
  "Help me update my CV",
  "Plan a weekly budget",
  "Write a meal plan",
];

const DETAIL_LEVELS = [
  { value: "standard" as const, label: "Standard" },
  { value: "detailed" as const, label: "Detailed" },
];

type DetailLevel = "standard" | "detailed";

const PromptGeneratorPage = ({ userType, userEmail, guestToken, isAnonymous = false }: PromptGeneratorPageProps) => {
  const [subject, setSubject] = useState<PromptTypeId>("standard");
  const [detailLevel, setDetailLevel] = useState<DetailLevel>("standard");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Friendly & Conversational");
  const [outputLength, setOutputLength] = useState<OutputLength>("medium");
  const [audience, setAudience] = useState("");
  const [platform, setPlatform] = useState("");
  const [showExtras, setShowExtras] = useState(false);
  const [selectedModel, setSelectedModel] = useState<PgModel>("groq");

  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [usedModel, setUsedModel] = useState<PgModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [aboutMeOpen, setAboutMeOpen] = useState(false);
  const [includeProfile, setIncludeProfile] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [profileVersion, setProfileVersion] = useState(0);

  const [credits, setCredits] = useState<CreditBalance | null>(null);

  const [anonId] = useState<string>(() => {
    let id = localStorage.getItem("pg_anon_id");
    if (!id) { id = crypto.randomUUID(); localStorage.setItem("pg_anon_id", id); }
    return id;
  });
  const [currentToken, setCurrentToken] = useState<string | undefined>(guestToken);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [signupSuccessMsg, setSignupSuccessMsg] = useState("");

  const isFree = userType === "free_subscriber";

  const fetchCredits = useCallback(async (overrideToken?: string) => {
    try {
      const tokenToUse = overrideToken ?? currentToken;
      let params = "";
      if (tokenToUse) params = `?token=${encodeURIComponent(tokenToUse)}`;
      else if (isAnonymous) params = `?anon_id=${encodeURIComponent(anonId)}`;
      const res = await fetch(`/api/pg-credits${params}`, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json() as CreditBalance;
      setCredits(data);
    } catch { /* silent */ }
  }, [currentToken, isAnonymous, anonId]);

  useEffect(() => { fetchCredits(); }, [fetchCredits]);

  useEffect(() => { fetch("/api/pg-pageview", { method: "POST" }).catch(() => {}); }, []);

  useEffect(() => {
    const p = getProfile();
    const exists = !!p && Object.values(p).some(v => v !== "");
    setProfileExists(exists);
    if (!exists) setIncludeProfile(false);
  }, [profileVersion]);

  const handleCloseAboutMe = () => {
    setAboutMeOpen(false);
  };

  const handleProfileChange = () => {
    setProfileVersion(v => v + 1);
  };

  const handleGenerate = async () => {
    if (!subject || !topic) return;
    setLoading(true);
    setError("");
    setGeneratedPrompt("");

    try {
      const res = await fetch("/api/prompt-generator/generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: currentToken ?? null,
          anon_id: !currentToken && isAnonymous ? anonId : undefined,
          model: selectedModel,
          subject,
          prompt_type: subject || "standard",
          detail_level: subject !== "standard" ? detailLevel : undefined,
          topic,
          tone,
          output_length: outputLength,
          audience: audience || undefined,
          platform: platform || undefined,
          user_profile: includeProfile && profileExists ? profileToText(getProfile()!) : undefined,
        }),
      });

      const data = (await res.json()) as {
        prompt?: string;
        model?: PgModel;
        usage?: CreditBalance;
        error?: string;
        credits_used?: number;
        credits_total?: number;
        tier_name?: string;
      };

      if (!res.ok) {
        if (res.status === 429 && data.error === "guest_limit_reached") {
          setShowEmailCapture(true);
          return;
        }
        if (res.status === 429) {
          const total = data.credits_total;
          const tier = data.tier_name ?? "current";
          setError(
            `You've used all your monthly credits${total ? ` (${total})` : ""} on the ${tier} plan. Upgrade your Proven AI membership to continue.`
          );
        } else if (res.status === 403) {
          setError("Claude is available to Proven AI members. Upgrade for full access.");
        } else {
          setError(data.error || "Something went wrong. Please try again.");
        }
        return;
      }

      if (data.prompt) {
        setGeneratedPrompt(data.prompt);
        setUsedModel(data.model ?? selectedModel);
      }
      if (data.usage) {
        setCredits(data.usage);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  const handleDownload = () => {
    const blob = new Blob([generatedPrompt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prompt.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEmailSignup = async () => {
    setSignupLoading(true);
    setSignupError("");
    try {
      const res = await fetch("/api/pg-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signupEmail.trim().toLowerCase(), anon_id: anonId }),
      });
      const data = await res.json() as { ok?: boolean; status?: string; token?: string; error?: string };
      if (!res.ok || !data.ok) { setSignupError(data.error ?? "Something went wrong."); return; }
      setCurrentToken(data.token);
      setSignupSuccessMsg("You're in. You now have 15 credits per month. Keep generating.");
      setShowEmailCapture(false);
      await fetchCredits(data.token);
      setTimeout(() => setSignupSuccessMsg(""), 2000);
    } catch {
      setSignupError("Something went wrong. Please try again.");
    } finally {
      setSignupLoading(false);
    }
  };

  const MODEL_WEIGHTS: Record<PgModel, number> = { groq: 1, gemini: 2, claude: 3 };
  const currentWeight = MODEL_WEIGHTS[selectedModel];
  const hasEnoughCredits = !credits || credits.credits_remaining >= currentWeight;

  const canGenerate = !!topic && !(isFree && selectedModel === "claude") && hasEnoughCredits && !showEmailCapture;

  return (
    <div
      style={{ backgroundColor: "#0d1117", minHeight: "100vh", color: "#c9d1d9" }}
      className="px-4 py-8 md:py-12"
    >
      <div className="max-w-5xl mx-auto">

        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#00bcd4" }}
            >
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-lg" style={{ color: "#c9d1d9" }}>
              Prompt Generator
            </span>
          </div>
          <div className="flex items-center gap-3">
            {!isFree && (
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5"
                style={{
                  backgroundColor: "rgba(0,188,212,0.1)",
                  color: "#00bcd4",
                  border: "1px solid rgba(0,188,212,0.25)",
                }}
              >
                <Crown className="h-3 w-3" /> Member
              </span>
            )}
            {isFree && !isAnonymous && (
              <span className="text-xs" style={{ color: "rgba(201,209,217,0.45)" }}>
                {userEmail}{" "}
                <Link
                  to="/auth"
                  className="underline"
                  style={{ color: "rgba(201,209,217,0.6)" }}
                >
                  Not you?
                </Link>
              </span>
            )}
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* ── Left: Form ── */}
          <div
            className="rounded-2xl p-6 space-y-3"
            style={{ backgroundColor: "#1c2128", border: "1px solid rgba(255,255,255,0.07)" }}
          >

            {/* About Me button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setAboutMeOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid rgba(0,188,212,0.4)",
                  color: "#00bcd4",
                }}
              >
                <User className="h-3.5 w-3.5" />
                About Me
              </button>
            </div>

            {/* Prompt type */}
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: "#c9d1d9" }}>
                What type of prompt? <span style={{ color: "#e91e8c" }}>*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {PROMPT_TYPES.map((pt) => (
                  <button
                    key={pt.id}
                    type="button"
                    onClick={() => {
                      setSubject(pt.id);
                      if (pt.id !== "standard") setDetailLevel("standard");
                    }}
                    className="rounded-lg px-3 py-2.5 text-xs font-medium text-center transition-colors"
                    style={{
                      backgroundColor: subject === pt.id ? "rgba(0,188,212,0.15)" : "rgba(255,255,255,0.05)",
                      border: subject === pt.id ? "1px solid rgba(0,188,212,0.4)" : "1px solid rgba(255,255,255,0.1)",
                      color: subject === pt.id ? "#00bcd4" : "rgba(201,209,217,0.7)",
                    }}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic */}
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: "#c9d1d9" }}>
                What specifically do you want help with? <span style={{ color: "#e91e8c" }}>*</span>
              </label>
              <textarea
                rows={4}
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value.slice(0, 1000));
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = `${el.scrollHeight}px`;
                }}
                placeholder="e.g. writing a CV summary, planning a budget, learning a new skill"
                maxLength={1000}
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#c9d1d9",
                  resize: "none",
                  overflow: "hidden",
                  fontFamily: "inherit",
                  lineHeight: "1.5",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#00bcd4")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
              />
              <p className="text-xs text-right" style={{ color: "rgba(201,209,217,0.35)" }}>
                {topic.length}/1000
              </p>
            </div>

            {/* Tone — Standard only */}
            {subject === "standard" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium" style={{ color: "#c9d1d9" }}>Tone</label>
                <div className="flex flex-wrap gap-2">
                  {TONES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTone(t.value)}
                    className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: tone === t.value ? "rgba(0,188,212,0.15)" : "rgba(255,255,255,0.05)",
                        border: tone === t.value ? "1px solid rgba(0,188,212,0.4)" : "1px solid rgba(255,255,255,0.1)",
                        color: tone === t.value ? "#00bcd4" : "rgba(201,209,217,0.7)",
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt depth — Standard only */}
            {subject === "standard" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium" style={{ color: "#c9d1d9" }}>Prompt depth</label>
                <div className="grid grid-cols-3 gap-2">
                  {LENGTHS.map((l) => (
                    <button
                      key={l.value}
                      type="button"
                      onClick={() => setOutputLength(l.value)}
                    className="rounded-lg px-3 py-1.5 text-center transition-colors"
                      style={{
                        backgroundColor: outputLength === l.value ? "rgba(0,188,212,0.15)" : "rgba(255,255,255,0.05)",
                        border: outputLength === l.value ? "1px solid rgba(0,188,212,0.4)" : "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <div
                        className="text-xs font-medium"
                        style={{ color: outputLength === l.value ? "#00bcd4" : "#c9d1d9" }}
                      >
                        {l.label}
                      </div>
                      <div className="text-[10px] mt-0.5" style={{ color: "rgba(201,209,217,0.45)" }}>
                        {l.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Detail Level — Image, Video, Music only */}
            {subject !== "standard" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium" style={{ color: "#c9d1d9" }}>Detail Level</label>
                <div className="flex gap-2">
                  {DETAIL_LEVELS.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setDetailLevel(d.value)}
                      className="px-4 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: detailLevel === d.value ? "rgba(0,188,212,0.15)" : "rgba(255,255,255,0.05)",
                        border: detailLevel === d.value ? "1px solid rgba(0,188,212,0.4)" : "1px solid rgba(255,255,255,0.1)",
                        color: detailLevel === d.value ? "#00bcd4" : "rgba(201,209,217,0.7)",
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Optional extras */}
            <div style={{ marginTop: "8px" }}>
              <button
                type="button"
                onClick={() => setShowExtras(!showExtras)}
                className="flex items-center gap-1.5 text-sm transition-colors"
                style={{ color: "rgba(201,209,217,0.55)" }}
              >
                {showExtras ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                Optional extras
              </button>
              {showExtras && (
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-medium" style={{ color: "rgba(201,209,217,0.7)" }}>
                      Which AI tool will you use this in?
                    </label>
                    <input
                      type="text"
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      placeholder="e.g. ChatGPT, Claude, Gemini — or leave blank for any"
                      className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "#c9d1d9",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#00bcd4")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Profile toggle */}
            {profileExists ? (
              <div className="space-y-1.5">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setIncludeProfile(p => !p)}
                    style={{
                      width: "36px",
                      height: "20px",
                      borderRadius: "10px",
                      backgroundColor: includeProfile ? "#00bcd4" : "rgba(255,255,255,0.15)",
                      position: "relative",
                      cursor: "pointer",
                      transition: "background-color 0.2s ease",
                      flexShrink: 0,
                    }}
                  >
                    <div style={{
                      position: "absolute",
                      top: "2px",
                      left: includeProfile ? "18px" : "2px",
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      backgroundColor: "#fff",
                      transition: "left 0.2s ease",
                    }} />
                  </div>
                  <span className="text-sm" style={{ color: "rgba(201,209,217,0.8)" }}>
                    Include my profile in this prompt
                  </span>
                </label>
                <p className="text-xs" style={{ color: "#c9d1d9", paddingLeft: "48px" }}>
                  Your profile is stored in your browser and sent to the AI when enabled.
                </p>
              </div>
            ) : (
              <p className="text-xs" style={{ color: "rgba(201,209,217,0.4)" }}>
                <button
                  type="button"
                  onClick={() => setAboutMeOpen(true)}
                  className="underline"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(201,209,217,0.4)", fontSize: "inherit", padding: 0 }}
                >
                  Set up your profile
                </button>{" "}
                to personalise prompts
              </p>
            )}

            {/* Model selector */}
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: "#c9d1d9" }}>AI Model</label>
              <div className="grid grid-cols-3 gap-2">
                {MODELS.map((m) => {
                  const isClaudeLocked = isFree && m.id === "claude";
                  const isSelected = selectedModel === m.id;

                  return (
                    <button
                      key={m.id}
                      type="button"
                      disabled={isClaudeLocked}
                      onClick={() => !isClaudeLocked && setSelectedModel(m.id)}
                      className="rounded-xl px-3 py-3 text-center transition-colors relative"
                      style={{
                        backgroundColor: isSelected ? "rgba(0,188,212,0.12)" : "rgba(255,255,255,0.04)",
                        border: isSelected ? "1px solid rgba(0,188,212,0.4)" : "1px solid rgba(255,255,255,0.1)",
                        opacity: isClaudeLocked ? 0.5 : 1,
                        cursor: isClaudeLocked ? "not-allowed" : "pointer",
                      }}
                    >
                      {isClaudeLocked && (
                        <Lock className="h-3 w-3 absolute top-2 right-2" style={{ color: "rgba(201,209,217,0.3)" }} />
                      )}
                      <div className="text-xs font-semibold mb-0.5" style={{ color: isSelected ? "#00bcd4" : "#c9d1d9" }}>
                        {m.name}
                      </div>
                      <div className="text-[10px]" style={{ color: "#c9d1d9" }}>
                        {isClaudeLocked ? "Paid members only" : m.tagline}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Credit balance */}
              {credits && (
                <div
                  className="rounded-lg px-3 py-2 text-xs flex items-center justify-between gap-2"
                  style={{
                    backgroundColor: "rgba(0,188,212,0.05)",
                    border: "1px solid rgba(0,188,212,0.15)",
                  }}
                >
                  <span style={{ color: "rgba(201,209,217,0.6)" }}>
                    Monthly credits · {credits.tier_name}
                  </span>
                  <span
                    style={{
                      fontWeight: 600,
                      color: credits.credits_remaining > 0 ? "#00bcd4" : "#e91e8c",
                    }}
                  >
                    {Math.round(credits.credits_remaining * 10) / 10} / {credits.credits_total} remaining
                  </span>
                </div>
              )}

              {/* Free user upgrade nudge */}
              {isFree && !isAnonymous && (
                <div
                  className="rounded-lg px-3 py-2 text-xs flex items-center justify-between gap-2"
                  style={{
                    backgroundColor: "rgba(233,30,140,0.06)",
                    border: "1px solid rgba(233,30,140,0.2)",
                    color: "rgba(233,30,140,0.8)",
                  }}
                >
                  <span>Proven AI members get Claude access + higher monthly credit allowances.</span>
                  <Link
                    to="/membership"
                    className="flex items-center gap-1 font-medium flex-shrink-0"
                    style={{ color: "#e91e8c" }}
                  >
                    Upgrade <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>

            {/* Credit cost indicator */}
            {!loading && (
              <p
                className="text-xs text-center"
                style={{ color: "#e91e8c", marginTop: "6px" }}
              >
                {!hasEnoughCredits
                  ? `Not enough credits for ${MODELS.find(m => m.id === selectedModel)?.name} — ${Math.round((credits?.credits_remaining ?? 0) * 10) / 10} credit${(credits?.credits_remaining ?? 0) === 1 ? "" : "s"} remaining`
                  : `This prompt will use ${currentWeight} credit${currentWeight === 1 ? "" : "s"} · ${MODELS.find(m => m.id === selectedModel)?.name}`
                }
              </p>
            )}

            {/* Generate button */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate || loading}
              className="w-full rounded-xl py-3.5 text-sm font-semibold transition-all flex items-center justify-center gap-2"
              style={{
                backgroundColor: canGenerate && !loading ? "#00bcd4" : "rgba(0,188,212,0.25)",
                color: canGenerate && !loading ? "#fff" : "rgba(255,255,255,0.4)",
                cursor: canGenerate && !loading ? "pointer" : "not-allowed",
                marginTop: "10px",
              }}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Building your prompt…" : "Build My Prompt"}
            </button>
          </div>

          {/* ── Right: Output ── */}
          <div
            className="rounded-2xl p-6 flex flex-col"
            style={{ backgroundColor: "#1c2128", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            {/* Loading state */}
            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div
                  className="h-12 w-12 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: "rgba(0,188,212,0.3)", borderTopColor: "#00bcd4" }}
                />
                <p className="text-sm" style={{ color: "rgba(201,209,217,0.55)" }}>
                  Building your prompt…
                </p>
              </div>
            )}

            {/* Error state */}
            {!loading && error && (
              <div className="space-y-4">
                <div
                  className="rounded-xl px-4 py-4 text-sm"
                  style={{
                    backgroundColor: "rgba(233,30,140,0.08)",
                    border: "1px solid rgba(233,30,140,0.2)",
                    color: "rgba(233,30,140,0.9)",
                  }}
                >
                  {error}
                  {(error.includes("limit") || error.includes("upgrade") || error.includes("Upgrade") || error.includes("members")) && (
                    <div className="mt-3">
                      <Link
                        to="/membership"
                        className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
                        style={{ backgroundColor: "#e91e8c", color: "#fff" }}
                      >
                        Upgrade to Proven AI <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Email capture state */}
            {!loading && showEmailCapture && !signupSuccessMsg && (
              <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
                <div
                  className="rounded-xl p-8 w-full space-y-5"
                  style={{ border: "1.5px solid rgba(0,188,212,0.2)", backgroundColor: "rgba(0,188,212,0.04)" }}
                >
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center mx-auto"
                    style={{ backgroundColor: "rgba(0,188,212,0.15)" }}
                  >
                    <Mail className="h-5 w-5" style={{ color: "#00bcd4" }} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold mb-2" style={{ color: "#c9d1d9" }}>
                      Get 15 free credits every month
                    </h3>
                    <p className="text-sm" style={{ color: "rgba(201,209,217,0.6)" }}>
                      You've used your free preview prompts. Enter your email to unlock 15 credits every month — no payment needed.
                    </p>
                    <p className="text-xs mt-2" style={{ color: "rgba(201,209,217,0.4)" }}>
                      No spam. Just prompts.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !signupLoading && signupEmail.trim() && handleEmailSignup()}
                      placeholder="your@email.com"
                      className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "#c9d1d9",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#00bcd4")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
                    />
                    {signupError && (
                      <p className="text-xs" style={{ color: "#e91e8c" }}>{signupError}</p>
                    )}
                    <button
                      type="button"
                      onClick={handleEmailSignup}
                      disabled={signupLoading || !signupEmail.trim()}
                      className="w-full rounded-xl py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: signupLoading || !signupEmail.trim() ? "rgba(0,188,212,0.25)" : "#00bcd4",
                        color: signupLoading || !signupEmail.trim() ? "rgba(255,255,255,0.4)" : "#fff",
                        cursor: signupLoading || !signupEmail.trim() ? "not-allowed" : "pointer",
                      }}
                    >
                      {signupLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      Claim my free credits
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Signup success */}
            {!loading && !!signupSuccessMsg && (
              <div className="flex-1 flex items-center justify-center">
                <div
                  className="rounded-xl px-6 py-5 text-sm text-center"
                  style={{
                    backgroundColor: "rgba(76,175,80,0.08)",
                    border: "1px solid rgba(76,175,80,0.25)",
                    color: "rgba(76,175,80,0.9)",
                  }}
                >
                  {signupSuccessMsg}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && !generatedPrompt && !showEmailCapture && !signupSuccessMsg && (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
                <div
                  className="rounded-xl p-8 w-full"
                  style={{ border: "1.5px dashed rgba(255,255,255,0.1)" }}
                >
                  <p className="text-sm" style={{ color: "rgba(201,209,217,0.35)" }}>
                    Your prompt will appear here
                  </p>
                </div>

                <div className="w-full space-y-2">
                  <p className="text-xs" style={{ color: "rgba(201,209,217,0.35)" }}>
                    Try one of these:
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {EXAMPLE_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setTopic(chip)}
                        className="px-3 py-1.5 rounded-full text-xs transition-colors"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: "rgba(201,209,217,0.6)",
                        }}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Generated prompt */}
            {!loading && !error && generatedPrompt && (
              <div className="flex flex-col gap-4 h-full">
                {/* Model badge */}
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: "rgba(0,188,212,0.1)",
                      border: "1px solid rgba(0,188,212,0.25)",
                      color: "#00bcd4",
                    }}
                  >
                    Generated with {usedModel}
                  </span>
                </div>

                {/* Prompt text area */}
                <textarea
                  readOnly
                  value={generatedPrompt}
                  className="flex-1 min-h-[280px] w-full rounded-xl px-4 py-4 text-sm resize-none outline-none"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#c9d1d9",
                    lineHeight: "1.7",
                    fontFamily: "inherit",
                  }}
                />

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: copied ? "rgba(76,175,80,0.15)" : "rgba(0,188,212,0.12)",
                      border: "1px solid " + (copied ? "rgba(76,175,80,0.3)" : "rgba(0,188,212,0.3)"),
                      color: copied ? "#4caf50" : "#00bcd4",
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied ? "Copied!" : "Copy"}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "rgba(201,209,217,0.7)",
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "rgba(201,209,217,0.7)",
                    }}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Try a different version
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AboutMePanel isOpen={aboutMeOpen} onClose={handleCloseAboutMe} onProfileChange={handleProfileChange} />
    </div>
  );
};

export default PromptGeneratorPage;
