import { useState, useRef, useEffect } from "react";
import { fetchAllCards, type Card } from "@/lib/manager";
import { Send, AlertTriangle, Sparkles, Settings, Square, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { TypingIndicator } from "@/components/manager/Skeletons";

interface Message {
  role: "user" | "assistant";
  content: string;
  error?: boolean;
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

You will receive the current state of Jeff's project boards followed by his question. Answer concisely and specifically. Prioritise ruthlessly. Never give generic advice — always reference his actual tasks and context. When he asks "what's next" give him 3 specific actions maximum. Use markdown formatting: bold for emphasis, bullet lists for actions, headers for sections.`;

function buildBoardContext(cards: Card[]): string {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const in7days = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);
  const twoDaysAgo = new Date(now.getTime() - 2 * 86400000).toISOString();

  const boardNames: Record<string, string> = {
    content: "Content Pipeline", platform: "ProvenAI Platform",
    funnel: "Funnel & Email", bizdev: "Business Dev", strategy: "Strategy & Horizon",
  };

  const doneColumns = ["content-published", "platform-live", "funnel-active", "funnel-archived", "bizdev-active", "strategy-decided", "strategy-archived"];
  const active = cards.filter((c) => !doneColumns.includes(c.column_id));
  const overdue = active.filter((c) => c.due_date && c.due_date < todayStr);
  const dueThisWeek = active.filter((c) => c.due_date && c.due_date >= todayStr && c.due_date <= in7days);
  const critical = active.filter((c) => c.priority === "critical");
  const thisWeekPri = active.filter((c) => c.priority === "this_week");
  const recent = cards.filter((c) => c.created_at >= twoDaysAgo);

  const lines: string[] = ["CURRENT BOARD STATE:"];
  if (overdue.length) { lines.push("\n[Overdue]:"); overdue.forEach((c) => lines.push(`  ${boardNames[c.board_id]} - ${c.title} - Due ${c.due_date}`)); }
  if (dueThisWeek.length) { lines.push("\n[Due this week]:"); dueThisWeek.forEach((c) => lines.push(`  ${boardNames[c.board_id]} - ${c.title} - Due ${c.due_date}`)); }
  if (critical.length) { lines.push("\n[Priority]:"); critical.forEach((c) => lines.push(`  ${boardNames[c.board_id]} - ${c.title}`)); }
  if (thisWeekPri.length) { lines.push("\n[This Week priority]:"); thisWeekPri.forEach((c) => lines.push(`  ${boardNames[c.board_id]} - ${c.title}`)); }
  if (recent.length) { lines.push("\n[Recently added]:"); recent.forEach((c) => lines.push(`  ${boardNames[c.board_id]} - ${c.title}`)); }
  return lines.join("\n");
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [abortCtrl, setAbortCtrl] = useState<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const apiKey = localStorage.getItem("provenai_anthropic_key") || "";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleStop = () => { abortCtrl?.abort(); setAbortCtrl(null); setLoading(false); };

  const handleRetry = (idx: number) => {
    // Find the user message before this error and resend
    const userMsg = messages.slice(0, idx).reverse().find((m) => m.role === "user");
    if (!userMsg) return;
    setMessages((prev) => prev.filter((_, i) => i !== idx));
    setInput(userMsg.content);
    setTimeout(() => handleSend(), 50);
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !apiKey) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const controller = new AbortController();
    setAbortCtrl(controller);

    try {
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
          stream: true,
          system: SYSTEM_PROMPT,
          messages: [
            ...messages.filter((m) => !m.error).map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: fullUserMessage },
          ],
        }),
        signal: controller.signal,
      });

      if (!res.ok) { const err = await res.text(); throw new Error(`API error ${res.status}: ${err}`); }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const event = JSON.parse(jsonStr);
            if (event.type === "content_block_delta" && event.delta?.text) {
              assistantText += event.delta.text;
              const finalText = assistantText;
              setMessages((prev) => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: finalText } : m));
            }
          } catch {}
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        // User cancelled
      } else {
        setMessages((prev) => [
          ...prev.filter((m) => m.content !== ""),
          { role: "assistant", content: `${err instanceof Error ? err.message : "Unknown error"}`, error: true },
        ]);
      }
    } finally {
      setLoading(false);
      setAbortCtrl(null);
    }
  };

  const quickPrompts = [
    "What should I focus on today?",
    "What's overdue?",
    "Summarise my priority tasks",
    "What content should I create next?",
  ];

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-[#30363d] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-[#e91e8c]" />
          <h1 className="text-xl font-bold font-mono text-[#e0e7ef]">AI Assistant</h1>
        </div>
        {apiKey && (
          <span className="text-[10px] font-mono text-[#3fb950] bg-[#3fb950]/10 px-2 py-1 rounded border border-[#3fb950]/20">
            CONNECTED
          </span>
        )}
      </div>

      {/* API key warning */}
      {!apiKey && (
        <div className="mx-6 mt-4 p-4 rounded-lg bg-[#d29922]/10 border border-[#d29922]/30 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-[#d29922] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#e0e7ef]">No API key configured</p>
            <p className="text-xs text-[#a0aab8] mt-1">Add your Anthropic API key in Settings to get started.</p>
            <Link to="/manage/settings" className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-md bg-[#d29922]/20 text-[#d29922] text-xs font-semibold hover:bg-[#d29922]/30 transition-colors">
              <Settings className="h-3.5 w-3.5" /> Go to Settings
            </Link>
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && apiKey && (
          <div className="text-center py-16">
            <Sparkles className="h-12 w-12 text-[#e91e8c]/30 mx-auto mb-4" />
            <p className="text-[#a0aab8] mb-6">Ask me anything about your business. I'll check your boards for context.</p>
            <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
              {quickPrompts.map((q) => (
                <button key={q} onClick={() => setInput(q)} className="text-xs px-3 py-1.5 rounded-full border border-[#30363d] text-[#a0aab8] hover:text-[#e0e7ef] hover:border-[#00bcd4]/40 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed",
                msg.error
                  ? "bg-[#f85149]/10 border border-[#f85149]/30 text-[#f85149]"
                  : msg.role === "user"
                    ? "bg-[#00bcd4]/20 text-[#e0e7ef] border border-[#00bcd4]/30"
                    : "bg-[#242b35] text-[#e0e7ef] border border-[#30363d]"
              )}
            >
              {msg.error ? (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1">{msg.content}</span>
                  <button onClick={() => handleRetry(i)} className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-[#f85149]/20 hover:bg-[#f85149]/30 transition-colors">
                    <RefreshCw className="h-3 w-3" /> Try again
                  </button>
                </div>
              ) : msg.role === "assistant" ? (
                <div className="prose prose-sm prose-invert max-w-none prose-headings:text-[#e0e7ef] prose-headings:font-mono prose-strong:text-[#e0e7ef] prose-a:text-[#00bcd4] prose-li:text-[#e0e7ef] prose-p:text-[#e0e7ef] prose-code:text-[#e91e8c] prose-code:bg-[#0d1117] prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <span className="whitespace-pre-wrap">{msg.content}</span>
              )}
            </div>
          </div>
        ))}
        {loading && messages[messages.length - 1]?.content === "" && <TypingIndicator />}
        {loading && messages[messages.length - 1]?.role !== "assistant" && <TypingIndicator />}
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
            className="flex-1 px-4 py-3 rounded-lg bg-[#0d1117] border border-[#30363d] text-sm text-[#e0e7ef] placeholder-[#a0aab8] focus:border-[#00bcd4] focus:outline-none disabled:opacity-50"
          />
          {loading ? (
            <button onClick={handleStop} className="px-4 py-3 rounded-lg bg-[#f85149]/20 text-[#f85149] font-semibold hover:bg-[#f85149]/30 transition-colors" title="Stop generating">
              <Square className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={handleSend} disabled={!apiKey || !input.trim()} className="px-4 py-3 rounded-lg bg-[#00bcd4] text-[#0d1117] font-semibold hover:bg-[#00bcd4]/90 disabled:opacity-50 transition-colors">
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
