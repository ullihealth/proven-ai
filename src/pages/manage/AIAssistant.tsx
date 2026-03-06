import { useState, useRef, useEffect } from "react";
import { fetchAllCards, type Card } from "@/lib/manager";
import { Send, Loader2, AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are the ProvenAI Business Agent for Jeff Thompson, an AI education entrepreneur building a business for adults over 40. You have full knowledge of his business architecture:

- Personal Facebook profile (1,500 followers, top of funnel)
- Facebook group "AI For Over 40s" (mid-funnel, hidden until launch)
- ProvenAI (provenai.app) — paid educational membership platform with courses
- Book "Using AI After 40" — free lead magnet via email capture
- HeyGen AI avatar — used for all video content, "reporting" style not "talking"
- Email CRM via Sender.net with evergreen + broadcast hybrid

Business workstreams: Content Pipeline, ProvenAI Platform, Funnel & Email, Business Development, Strategy & Horizon.

Jeff's style: direct, no-nonsense, authority-led. Not a salesperson. A correspondent reporting AI intelligence for his generation.

You will receive the current state of Jeff's project boards followed by his question. Answer concisely and specifically. Prioritise ruthlessly. Never give generic advice — always reference his actual tasks and context. When he asks "what's next" give him 3 specific actions maximum.`;

function buildBoardContext(cards: Card[]): string {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const in7days = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);
  const twoDaysAgo = new Date(now.getTime() - 2 * 86400000).toISOString();

  const boardNames: Record<string, string> = {
    content: "Content Pipeline",
    platform: "ProvenAI Platform",
    funnel: "Funnel & Email",
    bizdev: "Business Dev",
    strategy: "Strategy & Horizon",
  };

  const doneColumns = ["content-published", "platform-live", "funnel-active", "funnel-archived", "bizdev-active", "strategy-decided", "strategy-archived"];
  const active = cards.filter((c) => !doneColumns.includes(c.column_id));

  const overdue = active.filter((c) => c.due_date && c.due_date < todayStr);
  const dueThisWeek = active.filter((c) => c.due_date && c.due_date >= todayStr && c.due_date <= in7days);
  const critical = active.filter((c) => c.priority === "critical");
  const thisWeekPri = active.filter((c) => c.priority === "this_week");
  const recent = cards.filter((c) => c.created_at >= twoDaysAgo);

  const lines: string[] = ["CURRENT BOARD STATE:"];

  if (overdue.length) {
    lines.push("\n[Overdue]:");
    overdue.forEach((c) => lines.push(`  ${boardNames[c.board_id]} - ${c.title} - Due ${c.due_date}`));
  }
  if (dueThisWeek.length) {
    lines.push("\n[Due this week]:");
    dueThisWeek.forEach((c) => lines.push(`  ${boardNames[c.board_id]} - ${c.title} - Due ${c.due_date}`));
  }
  if (critical.length) {
    lines.push("\n[Critical priority]:");
    critical.forEach((c) => lines.push(`  ${boardNames[c.board_id]} - ${c.title}`));
  }
  if (thisWeekPri.length) {
    lines.push("\n[This Week priority]:");
    thisWeekPri.forEach((c) => lines.push(`  ${boardNames[c.board_id]} - ${c.title}`));
  }
  if (recent.length) {
    lines.push("\n[Recently added]:");
    recent.forEach((c) => lines.push(`  ${boardNames[c.board_id]} - ${c.title}`));
  }

  return lines.join("\n");
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const apiKey = localStorage.getItem("provenai_anthropic_key") || "";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    if (!apiKey) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Fetch live board data
      const { cards } = await fetchAllCards();
      const boardContext = buildBoardContext(cards);

      const fullUserMessage = `${boardContext}\n\n---\n\nUser question: ${userMsg.content}`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: fullUserMessage },
          ],
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`API error ${res.status}: ${err}`);
      }

      const data = await res.json();
      const assistantContent = data.content?.[0]?.text || "No response received.";

      setMessages((prev) => [...prev, { role: "assistant", content: assistantContent }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${err instanceof Error ? err.message : "Unknown error"}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-[#30363d] flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-[#e91e8c]" />
        <h1 className="text-xl font-bold font-mono text-[#c9d1d9]">AI Assistant</h1>
      </div>

      {/* API key warning */}
      {!apiKey && (
        <div className="mx-6 mt-4 p-4 rounded-lg bg-[#d29922]/10 border border-[#d29922]/30 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-[#d29922] flex-shrink-0" />
          <div>
            <p className="text-sm text-[#c9d1d9]">No API key configured</p>
            <p className="text-xs text-[#8b949e]">Go to Settings to add your Anthropic API key.</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && apiKey && (
          <div className="text-center py-20">
            <Sparkles className="h-12 w-12 text-[#e91e8c]/30 mx-auto mb-4" />
            <p className="text-[#8b949e]">Ask me anything about your business. I'll check your boards for context.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                msg.role === "user"
                  ? "bg-[#00bcd4]/20 text-[#c9d1d9] border border-[#00bcd4]/30"
                  : "bg-[#1c2128] text-[#c9d1d9] border border-[#30363d]"
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#1c2128] border border-[#30363d] rounded-lg px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-[#e91e8c]" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#30363d]">
        <div className="flex gap-3 max-w-3xl mx-auto">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={apiKey ? "Ask about your business..." : "Set your API key in Settings first"}
            disabled={!apiKey || loading}
            className="flex-1 px-4 py-3 rounded-lg bg-[#0d1117] border border-[#30363d] text-sm text-[#c9d1d9] placeholder-[#8b949e] focus:border-[#00bcd4] focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!apiKey || !input.trim() || loading}
            className="px-4 py-3 rounded-lg bg-[#00bcd4] text-[#0d1117] font-semibold hover:bg-[#00bcd4]/90 disabled:opacity-50 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function cn(...args: (string | false | undefined)[]) {
  return args.filter(Boolean).join(" ");
}
