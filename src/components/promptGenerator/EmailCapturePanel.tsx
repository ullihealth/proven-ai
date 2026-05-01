import { Mail, Loader2 } from "lucide-react";

interface EmailCapturePanelProps {
  email: string;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string;
}

const EmailCapturePanel = ({ email, onEmailChange, onSubmit, loading, error }: EmailCapturePanelProps) => {
  return (
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
            This tool costs real money to run. I'm happy to give you free access — I just need to set a fair limit so one person doesn't burn through my API budget. No spam. No sales pitch. Just more prompts.
          </p>
        </div>
        <div className="space-y-2">
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && email.trim() && onSubmit()}
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
          {error && (
            <p className="text-xs" style={{ color: "#e91e8c" }}>{error}</p>
          )}
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading || !email.trim()}
            className="w-full rounded-xl py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2"
            style={{
              backgroundColor: loading || !email.trim() ? "rgba(0,188,212,0.25)" : "#00bcd4",
              color: loading || !email.trim() ? "rgba(255,255,255,0.4)" : "#fff",
              cursor: loading || !email.trim() ? "not-allowed" : "pointer",
            }}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Claim my free credits
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailCapturePanel;
