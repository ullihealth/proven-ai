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
} from "lucide-react";
import AboutMePanel from "../components/promptGenerator/AboutMePanel";
import { getProfile, profileToText } from "../utils/promptGeneratorProfile";

type PgModel = "claude" | "groq" | "gemini";
type OutputLength = "short" | "medium" | "detailed";

interface ModelUsage {
  used_today: number;
  daily_limit: number;
  remaining: number;
}

interface PromptGeneratorPageProps {
  userType: "paid_member" | "free_subscriber";
  userEmail: string;
  guestToken?: string;
}

const SUBJECTS = [
  "Career & Work",
  "Health & Lifestyle",
  "Money & Finance",
  "Family & Relationships",
  "Learning & Education",
  "Business & Side Hustles",
  "Tech & AI Tools",
  "Creativity & Hobbies",
];

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

const PromptGeneratorPage = ({ userType, userEmail, guestToken }: PromptGeneratorPageProps) => {
  const [subject, setSubject] = useState("");
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

  const [usage, setUsage] = useState<Record<PgModel, ModelUsage>>({
    claude: { used_today: 0, daily_limit: 0, remaining: 0 },
    groq:   { used_today: 0, daily_limit: 0, remaining: 0 },
    gemini: { used_today: 0, daily_limit: 0, remaining: 0 },
  });

  const isFree = userType === "free_subscriber";

  const fetchUsage = useCallback(async () => {
    try {
      const params = guestToken ? `?token=${encodeURIComponent(guestToken)}` : "";
      const res = await fetch(`/api/prompt-generator/usage${params}`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        usage?: Record<PgModel, ModelUsage>;
      };
      if (data.usage) setUsage(data.usage);
    } catch { /* silent */ }
  }, [guestToken]);

  useEffect(() => { fetchUsage(); }, [fetchUsage]);

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
          token: guestToken ?? null,
          model: selectedModel,
          subject,
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
        usage?: ModelUsage;
        error?: string;
        limit?: number;
      };

      if (!res.ok) {
        if (res.status === 429) {
          setError(
            `You've used all your ${selectedModel} prompts for today. Resets at midnight. Try Groq or Gemini, or upgrade to Proven AI for more.`
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
        setUsage(prev => ({ ...prev, [selectedModel]: data.usage! }));
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

  const canGenerate = subject && topic && !(isFree && selectedModel === "claude");

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
            {isFree && (
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
            className="rounded-2xl p-6 space-y-6"
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

            {/* Subject */}
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: "#c9d1d9" }}>
                What's the subject? <span style={{ color: "#e91e8c" }}>*</span>
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: subject ? "#c9d1d9" : "rgba(201,209,217,0.4)",
                  appearance: "none" as const,
                }}
              >
                <option value="">Select a subject…</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s} style={{ backgroundColor: "#1c2128" }}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic */}
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: "#c9d1d9" }}>
                What specifically do you want help with? <span style={{ color: "#e91e8c" }}>*</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value.slice(0, 200))}
                placeholder="e.g. writing a CV summary, planning a budget, learning a new skill"
                maxLength={200}
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#c9d1d9",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#00bcd4")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
              />
              <p className="text-xs text-right" style={{ color: "rgba(201,209,217,0.35)" }}>
                {topic.length}/200
              </p>
            </div>

            {/* Tone */}
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: "#c9d1d9" }}>Tone</label>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTone(t.value)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
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

            {/* Output length */}
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: "#c9d1d9" }}>Prompt depth</label>
              <div className="grid grid-cols-3 gap-2">
                {LENGTHS.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setOutputLength(l.value)}
                    className="rounded-lg px-3 py-2 text-center transition-colors"
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

            {/* Optional extras */}
            <div>
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
            <div className="space-y-3">
              <label className="block text-sm font-medium" style={{ color: "#c9d1d9" }}>AI Model</label>
              <div className="grid grid-cols-3 gap-2">
                {MODELS.map((m) => {
                  const isClaudeLocked = isFree && m.id === "claude";
                  const modelUsage = usage[m.id];
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
                      <div className="text-[10px] mb-1.5" style={{ color: "#c9d1d9" }}>
                        {isClaudeLocked ? "Paid members only" : m.tagline}
                      </div>
                      {!isClaudeLocked && modelUsage.daily_limit > 0 && (
                        <div className="text-[10px]" style={{ color: isSelected ? "rgba(0,188,212,0.7)" : "#c9d1d9" }}>
                          {modelUsage.remaining} left today
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Free user upgrade nudge */}
              {isFree && (
                <div
                  className="rounded-lg px-3 py-2 text-xs flex items-center justify-between gap-2"
                  style={{
                    backgroundColor: "rgba(233,30,140,0.06)",
                    border: "1px solid rgba(233,30,140,0.2)",
                    color: "rgba(233,30,140,0.8)",
                  }}
                >
                  <span>Proven AI members get Claude access + higher daily limits.</span>
                  <Link
                    to="/auth"
                    className="flex items-center gap-1 font-medium flex-shrink-0"
                    style={{ color: "#e91e8c" }}
                  >
                    Upgrade <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>

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
                  {(error.includes("limit") || error.includes("upgrade") || error.includes("members")) && (
                    <div className="mt-3">
                      <Link
                        to="/auth"
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

            {/* Empty state */}
            {!loading && !error && !generatedPrompt && (
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
                  {usedModel && usage[usedModel].daily_limit > 0 && (
                    <span className="text-xs" style={{ color: "rgba(201,209,217,0.4)" }}>
                      {usage[usedModel].remaining} prompts remaining today on {usedModel}
                    </span>
                  )}
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
