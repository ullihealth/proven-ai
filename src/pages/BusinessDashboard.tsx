import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface FeedPost {
  id: number;
  title: string;
  body: string;
  created_at: string;
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function BusinessDashboard() {
  const { isAuthenticated } = useAuth();

  const [question, setQuestion] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);

  useEffect(() => {
    fetch("/api/business/feed")
      .then((r) => r.json())
      .then((d: { ok: boolean; posts?: FeedPost[] }) => {
        if (d.ok) setPosts(d.posts ?? []);
      })
      .catch(console.error)
      .finally(() => setFeedLoading(false));
  }, []);

  async function handleSubmitQuestion() {
    const trimmed = question.trim();
    if (!trimmed) return;
    setSubmitLoading(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      const res = await fetch("/api/business/submit-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ question: trimmed }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        setSubmitSuccess(true);
        setQuestion("");
      } else {
        setSubmitError(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">

        {/* Page heading */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold" style={{ color: "#ffffff" }}>
            Business Feed
          </h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            Curated by Jeff. Updated regularly.
          </p>
        </div>

        {/* Ask Jeff section */}
        <div
          className="rounded-xl p-6 space-y-4"
          style={{ background: "#1c2128", border: "1px solid #30363d" }}
        >
          <div className="space-y-1">
            <h2 className="text-base font-semibold" style={{ color: "#ffffff" }}>
              Ask Jeff
            </h2>
            <p className="text-sm" style={{ color: "#8b949e" }}>
              Submit your business AI question. The best ones answered here each month for all members.
            </p>
          </div>

          {isAuthenticated ? (
            <div className="space-y-3">
              <textarea
                rows={4}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What's your business AI question this month?"
                className="w-full rounded-lg p-3 text-sm leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-[#00bcd4]"
                style={{
                  background: "#0d1117",
                  border: "1px solid #30363d",
                  color: "#c9d1d9",
                }}
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSubmitQuestion}
                  disabled={submitLoading || !question.trim()}
                  className="rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
                  style={{ background: "#00bcd4", color: "#0d1117" }}
                >
                  {submitLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin inline" />
                  ) : (
                    "Submit question"
                  )}
                </button>
                {submitSuccess && (
                  <p className="text-xs" style={{ color: "#00bcd4" }}>
                    Question submitted. Jeff reviews all submissions monthly.
                  </p>
                )}
                {submitError && (
                  <p className="text-xs" style={{ color: "#f85149" }}>
                    {submitError}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: "#8b949e" }}>
              Sign in to submit a question.
            </p>
          )}
        </div>

        {/* Divider */}
        <hr style={{ borderColor: "#30363d" }} />

        {/* Feed section */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold" style={{ color: "#ffffff" }}>
            Latest from Jeff
          </h2>

          {feedLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#00bcd4" }} />
            </div>
          ) : posts.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: "#8b949e" }}>
              Nothing here yet. Check back soon.
            </p>
          ) : (
            <div>
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-xl p-5 mb-4"
                  style={{ background: "#1c2128", border: "1px solid #30363d" }}
                >
                  <p className="font-semibold text-base mb-2" style={{ color: "#ffffff" }}>
                    {post.title}
                  </p>
                  <p
                    className="text-sm leading-relaxed whitespace-pre-wrap"
                    style={{ color: "#c9d1d9" }}
                  >
                    {post.body}
                  </p>
                  <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {formatDate(post.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
