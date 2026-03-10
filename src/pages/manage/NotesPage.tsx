import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Plus, Sparkles, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface Note {
  id: string;
  date: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

function getTodayDateStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function formatDateTitle(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  return `${days[date.getDay()]} ${d} ${months[date.getMonth()]} ${y}`;
}

function getCurrentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const titleRef = useRef(title);
  const contentValRef = useRef(content);
  titleRef.current = title;
  contentValRef.current = content;

  const todayStr = getTodayDateStr();
  const selectedNote = notes.find((n) => n.id === selectedId) ?? null;
  const isToday = selectedNote?.date === todayStr;

  // Load notes and auto-create today's note on mount
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/manage/notes");
      const data = await res.json() as { notes: Note[] };
      const loaded: Note[] = data.notes ?? [];

      let todayNote = loaded.find((n) => n.date === todayStr);
      if (!todayNote) {
        const defaultTitle = formatDateTitle(todayStr);
        const createRes = await fetch("/api/manage/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: todayStr, title: defaultTitle, content: "" }),
        });
        if (createRes.ok) {
          const createData = await createRes.json() as { note: Note };
          todayNote = createData.note;
          loaded.unshift(todayNote);
        }
      }

      setNotes(loaded);
      if (todayNote) {
        setSelectedId(todayNote.id);
        setTitle(todayNote.title);
        setContent(todayNote.content);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveNote = useCallback(async (noteId: string, noteTitle: string, noteContent: string) => {
    await fetch(`/api/manage/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: noteTitle, content: noteContent }),
    });
    setNotes((prev) => prev.map((n) => n.id === noteId ? { ...n, title: noteTitle, content: noteContent } : n));
  }, []);

  const debounceSave = useCallback((noteId: string, noteTitle: string, noteContent: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveNote(noteId, noteTitle, noteContent), 2000);
  }, [saveNote]);

  const handleContentChange = (val: string) => {
    setContent(val);
    if (selectedId) debounceSave(selectedId, titleRef.current, val);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (selectedId) debounceSave(selectedId, val, contentValRef.current);
  };

  const handleBlur = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (selectedId) saveNote(selectedId, titleRef.current, contentValRef.current);
  };

  const selectNote = async (note: Note) => {
    // Flush pending save before switching
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      if (selectedId) await saveNote(selectedId, titleRef.current, contentValRef.current);
    }
    setSelectedId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setAiResponse("");
  };

  const handleAddSection = () => {
    const time = getCurrentTime();
    const section = `\n\n## ${time}\n`;
    const newContent = contentValRef.current + section;
    setContent(newContent);
    if (selectedId) debounceSave(selectedId, titleRef.current, newContent);
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.focus();
        contentRef.current.setSelectionRange(newContent.length, newContent.length);
      }
    }, 10);
  };

  const filteredNotes = search
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.content.toLowerCase().includes(search.toLowerCase())
      )
    : notes;

  const handleAiSend = async () => {
    if (!aiInput.trim() || aiLoading) return;
    const apiKey = localStorage.getItem("provenai_anthropic_key") ?? "";
    if (!apiKey) return;

    const query = aiInput.trim();
    setAiInput("");
    setAiLoading(true);
    setAiResponse("");

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const systemPrompt = `You are Jeff Thompson's personal AI assistant in his ProvenAI Manager notes interface. The user's current note is titled "${titleRef.current}" (${selectedNote?.date ?? todayStr}) and contains:

---
${contentValRef.current || "(no content yet)"}
---

Answer the user's question based on this note context. Be concise and direct.`;

    try {
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
          system: systemPrompt,
          messages: [{ role: "user", content: query }],
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const event = JSON.parse(jsonStr);
            if (event.type === "content_block_delta" && event.delta?.text) {
              text += event.delta.text;
              setAiResponse(text);
            }
          } catch {}
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setAiResponse(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#30363d] bg-[#161b22] flex-shrink-0">
        <h1 className="text-xl font-bold text-[#e0e7ef]">Notes</h1>
        <button
          onClick={() => setAiOpen((v) => !v)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border",
            aiOpen
              ? "bg-[#e91e8c]/20 text-[#e91e8c] border-[#e91e8c]/30"
              : "bg-[#242b35] text-[#a0aab8] hover:text-[#e0e7ef] border-[#30363d]"
          )}
        >
          <Sparkles className="h-4 w-4" />
          Ask AI
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar */}
        <aside className="w-[250px] flex-shrink-0 flex flex-col border-r border-[#30363d] bg-[#161b22]">
          <div className="p-3 border-b border-[#30363d]">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#a0aab8]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notes..."
                className="w-full bg-[#1c2128] border border-[#30363d] rounded-md pl-8 pr-3 py-1.5 text-sm text-[#e0e7ef] placeholder-[#a0aab8] focus:outline-none focus:border-[#00bcd4] transition-colors"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {filteredNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => selectNote(note)}
                className={cn(
                  "w-full text-left px-4 py-2.5 transition-colors border-l-2",
                  selectedId === note.id
                    ? "bg-[#1c2128] border-[#00bcd4]"
                    : "border-transparent hover:bg-[#1c2128]"
                )}
              >
                <div
                  className={cn(
                    "text-sm font-medium truncate",
                    selectedId === note.id ? "text-[#e0e7ef]" : "text-[#a0aab8]"
                  )}
                >
                  {note.date === todayStr ? (
                    <span className="text-[#00bcd4]">Today</span>
                  ) : (
                    note.title
                  )}
                </div>
                <div className="text-xs text-[#a0aab8] mt-0.5">{note.date}</div>
              </button>
            ))}
          </div>
        </aside>

        {/* Main editor */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#13181f]">
          {selectedNote ? (
            <>
              <div className="px-8 pt-6 pb-3 border-b border-[#30363d] flex items-center justify-between gap-4 flex-shrink-0">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  onBlur={handleBlur}
                  className="flex-1 bg-transparent text-2xl font-bold text-[#e0e7ef] placeholder-[#a0aab8] focus:outline-none"
                  placeholder="Note title..."
                />
                <button
                  onClick={handleAddSection}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#242b35] border border-[#30363d] text-sm text-[#a0aab8] hover:text-[#e0e7ef] hover:border-[#00bcd4] transition-colors flex-shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Section
                </button>
              </div>
              <div className="flex-1 min-h-0 px-8 py-4 overflow-y-auto">
                {isToday ? (
                  <textarea
                    ref={contentRef}
                    value={content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    onBlur={handleBlur}
                    placeholder="Start writing..."
                    className="w-full h-full min-h-[500px] bg-transparent text-[#e0e7ef] placeholder-[#a0aab8] text-sm leading-relaxed focus:outline-none resize-none"
                  />
                ) : (
                  <div className="text-[#e0e7ef] text-sm leading-relaxed whitespace-pre-wrap">
                    {content || <span className="text-[#a0aab8] italic">No content</span>}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#a0aab8] text-sm">
              Select a note
            </div>
          )}
        </main>

        {/* Right AI panel */}
        {aiOpen && (
          <aside className="w-[300px] flex-shrink-0 flex flex-col border-l border-[#30363d] bg-[#161b22]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d] flex-shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#e91e8c]" />
                <span className="text-sm font-semibold text-[#e0e7ef]">Ask AI</span>
              </div>
              <button
                onClick={() => setAiOpen(false)}
                className="text-[#a0aab8] hover:text-[#e0e7ef] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {aiLoading && !aiResponse && (
                <div className="text-[#a0aab8] text-sm animate-pulse">Thinking...</div>
              )}
              {aiResponse && (
                <div className="text-sm text-[#e0e7ef] prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{aiResponse}</ReactMarkdown>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-[#30363d] flex-shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAiSend();
                    }
                  }}
                  placeholder="Ask about this note..."
                  className="flex-1 bg-[#1c2128] border border-[#30363d] rounded-md px-3 py-2 text-sm text-[#e0e7ef] placeholder-[#a0aab8] focus:outline-none focus:border-[#00bcd4] transition-colors"
                />
                <button
                  onClick={handleAiSend}
                  disabled={!aiInput.trim() || aiLoading}
                  className="p-2 rounded-md bg-[#e91e8c] text-white disabled:opacity-40 hover:bg-[#d4187d] transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
