import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";

interface FeedPost {
  id: number;
  title: string;
  body: string;
  created_at: string;
}

interface MemberQuestion {
  id: number;
  user_id: string;
  question: string;
  created_at: string;
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function BusinessFeedManagement() {
  // New post form
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Posts list
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  // Questions list
  const [questions, setQuestions] = useState<MemberQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setPostsLoading(true);
    try {
      const res = await fetch("/api/admin/business-feed", { credentials: "include" });
      const data = (await res.json()) as { ok: boolean; posts?: FeedPost[] };
      if (data.ok) setPosts(data.posts ?? []);
    } catch {
      // silent
    } finally {
      setPostsLoading(false);
    }
  }, []);

  const fetchQuestions = useCallback(async () => {
    setQuestionsLoading(true);
    try {
      const res = await fetch("/api/admin/business-questions", { credentials: "include" });
      const data = (await res.json()) as { ok: boolean; questions?: MemberQuestion[] };
      if (data.ok) setQuestions(data.questions ?? []);
    } catch {
      // silent
    } finally {
      setQuestionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchQuestions();
  }, [fetchPosts, fetchQuestions]);

  async function handlePublish() {
    const trimTitle = title.trim();
    const trimBody = body.trim();
    if (!trimTitle || !trimBody) return;
    setPublishLoading(true);
    setPublishError(null);
    setPublishSuccess(false);
    try {
      const res = await fetch("/api/admin/business-feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: trimTitle, body: trimBody }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        setPublishSuccess(true);
        setTitle("");
        setBody("");
        fetchPosts();
      } else {
        setPublishError(data.error ?? "Something went wrong.");
      }
    } catch {
      setPublishError("Something went wrong.");
    } finally {
      setPublishLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    try {
      await fetch(`/api/admin/business-feed/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchPosts();
    } catch {
      // silent
    }
  }

  const inputStyle = {
    background: "#ffffff",
    border: "1px solid #E5E7EB",
    borderRadius: "0.5rem",
    color: "#111827",
    padding: "0.5rem 0.75rem",
    width: "100%",
    fontSize: "0.875rem",
  } as React.CSSProperties;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Business Feed</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Manage the Business Feed posts visible to all members.
          </p>
        </div>

        {/* Section 1: New post form */}
        <div
          className="rounded-lg p-6 space-y-4"
          style={{ background: "#ffffff", border: "1px solid #E5E7EB" }}
        >
          <h2 className="text-base font-semibold text-[#111827]">Add Post to Business Feed</h2>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Post title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
            />
            <textarea
              rows={8}
              placeholder="Write your post..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePublish}
              disabled={publishLoading || !title.trim() || !body.trim()}
              className="rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
              style={{ background: "#00bcd4", color: "#0d1117" }}
            >
              {publishLoading ? "Publishing..." : "Publish Post"}
            </button>
            {publishSuccess && (
              <p className="text-xs" style={{ color: "#00bcd4" }}>
                Post published.
              </p>
            )}
            {publishError && (
              <p className="text-xs text-red-500">{publishError}</p>
            )}
          </div>
        </div>

        {/* Section 2: Existing posts */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-[#111827]">Published Posts</h2>

          {postsLoading ? (
            <p className="text-sm text-[#9CA3AF]">Loading...</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-[#9CA3AF]">No posts yet.</p>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-lg p-4 flex items-start justify-between gap-4"
                  style={{ background: "#ffffff", border: "1px solid #E5E7EB" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#111827] truncate">{post.title}</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      {post.body.slice(0, 100)}{post.body.length > 100 ? "…" : ""}
                    </p>
                    <p className="text-xs text-[#9CA3AF] mt-1">{formatDate(post.created_at)}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-xs text-red-500 hover:text-red-700 whitespace-nowrap flex-shrink-0"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Member questions */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-[#111827]">Member Questions</h2>

          {questionsLoading ? (
            <p className="text-sm text-[#9CA3AF]">Loading...</p>
          ) : questions.length === 0 ? (
            <p className="text-sm text-[#9CA3AF]">No questions submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="rounded-lg p-4"
                  style={{ background: "#ffffff", border: "1px solid #E5E7EB" }}
                >
                  <p className="text-sm text-[#111827] leading-relaxed">{q.question}</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">{formatDate(q.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
