import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Plus, Sparkles, X, Send, ChevronLeft, ChevronRight, ImageIcon, Download, Printer, Palette, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
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
  const { user } = useAuth();
  const firstName = user?.name ? user.name.split(" ")[0] : null;
  const pageTitle = firstName ? `${firstName}'s Notes` : "Notes";
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [search, setSearch] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try { return parseInt(localStorage.getItem("notes_sidebar_width") || "250", 10) || 250; } catch { return 250; }
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem("notes_sidebar_collapsed") === "true"; } catch { return false; }
  });
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartWidthRef = useRef(0);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef(title);
  const contentValRef = useRef(content);
  titleRef.current = title;

  const handleDragHandleMouseDown = (e: React.MouseEvent) => {
    if (sidebarCollapsed) return;
    e.preventDefault();
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartWidthRef.current = sidebarWidth;
    const onMove = (ev: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const delta = ev.clientX - dragStartXRef.current;
      const newWidth = Math.min(480, Math.max(160, dragStartWidthRef.current + delta));
      setSidebarWidth(newWidth);
      try { localStorage.setItem("notes_sidebar_width", String(newWidth)); } catch {}
    };
    const onUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem("notes_sidebar_collapsed", String(next)); } catch {}
      return next;
    });
  };

  const todayStr = getTodayDateStr();
  const selectedNote = notes.find((n) => n.id === selectedId) ?? null;
  const isToday = selectedNote?.date === todayStr;

  // Load notes and auto-create today's note on mount
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/manage/notes", { credentials: "include" });
      const data = await res.json() as { notes: Note[] };
      const loaded: Note[] = data.notes ?? [];

      // Log yesterday's focus time from the API (if minutes > 0 and not yet appended)
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yd = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
        const logRes = await fetch(`/api/manage/focus-log`, { credentials: "include" });
        if (logRes.ok) {
          const logData = await logRes.json() as { entries: { date: string; minutes: number }[] };
          const ydEntry = (logData.entries ?? []).find((e) => e.date === yd);
          if (ydEntry && ydEntry.minutes > 0) {
            const yNote = loaded.find((n) => n.date === yd);
            if (yNote && !yNote.content.includes("Focus time logged:")) {
              const h = Math.floor(ydEntry.minutes / 60);
              const m = ydEntry.minutes % 60;
              const label = h > 0 ? `${h} hour${h !== 1 ? "s" : ""} ${m} minute${m !== 1 ? "s" : ""}` : `${m} minute${m !== 1 ? "s" : ""}`;
              const newContent = yNote.content + `\n\nFocus time logged: ${label}`;
              await fetch(`/api/manage/notes/${yNote.id}`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newContent }),
              });
              yNote.content = newContent;
            }
          }
        }
      } catch {}

      let todayNote = loaded.find((n) => n.date === todayStr);
      if (!todayNote) {
        const defaultTitle = formatDateTitle(todayStr);
        const createRes = await fetch("/api/manage/notes", {
          method: "POST",
          credentials: "include",
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
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: noteTitle, content: noteContent }),
    });
    setNotes((prev) => prev.map((n) => n.id === noteId ? { ...n, title: noteTitle, content: noteContent } : n));
  }, []);

  const debounceSave = useCallback((noteId: string, noteTitle: string, noteContent: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveNote(noteId, noteTitle, noteContent), 2000);
  }, [saveNote]);

  const handleInput = () => {
    const html = contentRef.current?.innerHTML ?? "";
    contentValRef.current = html;
    if (selectedId) debounceSave(selectedId, titleRef.current, html);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (selectedId) debounceSave(selectedId, val, contentValRef.current);
  };

  const handleBlur = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const html = contentRef.current?.innerHTML ?? contentValRef.current;
    contentValRef.current = html;
    if (selectedId) saveNote(selectedId, titleRef.current, html);
  };

  const handleImageInsert = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      contentRef.current?.focus();
      document.execCommand("insertHTML", false, `<img src="${dataUrl}" style="max-width:100%" />`);
      const html = contentRef.current?.innerHTML ?? "";
      contentValRef.current = html;
      if (selectedId) debounceSave(selectedId, titleRef.current, html);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleExport = () => {
    const text = contentRef.current?.innerText ?? contentValRef.current;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${titleRef.current || "note"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  // Sync contenteditable innerHTML when the selected note changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!contentRef.current) return;
    const note = notes.find(n => n.id === selectedId);
    const html = note?.content ?? "";
    contentRef.current.innerHTML = html;
    contentValRef.current = html;
  }, [selectedId]);

  const handleAddSection = () => {
    const time = getCurrentTime();
    if (contentRef.current) {
      contentRef.current.focus();
      document.execCommand("insertHTML", false, `<br><h2 style="font-size:1.1em;font-weight:600;margin:0.5em 0 0">${time}</h2>`);
      const html = contentRef.current.innerHTML;
      contentValRef.current = html;
      if (selectedId) debounceSave(selectedId, titleRef.current, html);
    }
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
    <>
    <style>{`
      .notes-editor:empty::before {
        content: attr(data-placeholder);
        color: #8b949e;
        pointer-events: none;
        float: left;
        height: 0;
      }
      .notes-editor:focus { outline: none; }
      @media print {
        body * { visibility: hidden; }
        #notes-print-area, #notes-print-area * { visibility: visible; }
        .notes-toolbar { display: none !important; }
        #notes-print-area {
          position: absolute;
          top: 0; left: 0; right: 0;
          padding: 24px;
          font-family: system-ui, -apple-system, sans-serif;
        }
      }
    `}</style>
    <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageInsert} />
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="notes-no-print flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-sidebar)] flex-shrink-0">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">{pageTitle}</h1>
        <button
          onClick={() => setAiOpen((v) => !v)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border",
            aiOpen
              ? "bg-[#e91e8c]/20 text-[#e91e8c] border-[#e91e8c]/30"
              : "bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border-[var(--border)]"
          )}
        >
          <Sparkles className="h-4 w-4" />
          Ask AI
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar */}
        {!sidebarCollapsed && (
          <aside
            className="notes-no-print flex-shrink-0 flex flex-col border-r border-[var(--border)] bg-[var(--bg-sidebar)]"
            style={{ width: sidebarWidth }}
          >
            <div className="p-3 border-b border-[var(--border)]">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search notes..."
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-md pl-8 pr-3 py-1.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#00bcd4] transition-colors"
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
                      ? "bg-[var(--bg-card)] border-[#00bcd4]"
                      : "border-transparent hover:bg-[var(--bg-card)]"
                  )}
                >
                  <div
                    className={cn(
                      "text-sm font-medium truncate",
                      selectedId === note.id ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                    )}
                  >
                    {note.date === todayStr ? (
                      <span className="text-[#00bcd4]">Today</span>
                    ) : (
                      note.title
                    )}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">{note.date}</div>
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Drag handle + collapse toggle */}
        <div
          className="notes-no-print relative flex-shrink-0 flex items-center justify-center group"
          style={{ width: 12 }}
        >
          {/* Drag target (only when expanded) */}
          {!sidebarCollapsed && (
            <div
              onMouseDown={handleDragHandleMouseDown}
              className="absolute inset-0 cursor-col-resize"
            />
          )}
          {/* Visible divider line */}
          <div className="w-px h-full bg-[var(--bg-hover)] group-hover:bg-[#00bcd4]/40 transition-colors" />
          {/* Collapse button */}
          <button
            onClick={toggleSidebar}
            className="absolute z-10 flex items-center justify-center w-5 h-5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[#00bcd4] hover:border-[#00bcd4] transition-colors shadow"
            style={{ top: "50%", transform: "translateY(-50%)" }}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed
              ? <ChevronRight className="h-3 w-3" />
              : <ChevronLeft className="h-3 w-3" />}
          </button>
        </div>

        {/* Main editor */}
        <main id="notes-print-area" className="flex-1 flex flex-col min-w-0 bg-[var(--bg-primary)]">
          {selectedNote ? (
            <>
              <div className="px-8 pt-6 pb-3 border-b border-[var(--border)] flex items-center justify-between gap-4 flex-shrink-0">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  onBlur={handleBlur}
                  className="flex-1 bg-transparent text-2xl font-bold text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
                  placeholder="Note title..."
                />
                <button
                  onClick={handleAddSection}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[#00bcd4] transition-colors flex-shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Section
                </button>
              </div>
              {/* Formatting toolbar */}
              <div className="notes-toolbar px-6 py-1.5 border-b border-[var(--border)] flex items-center gap-1 flex-shrink-0 bg-[var(--bg-sidebar)] select-none flex-wrap">
                {isToday && (
                  <>
                    <button
                      onMouseDown={(e) => { e.preventDefault(); contentRef.current?.focus(); document.execCommand("bold"); }}
                      title="Bold"
                      className="px-2 py-1 rounded text-sm font-bold leading-none text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
                    >B</button>
                    <button
                      onMouseDown={(e) => { e.preventDefault(); contentRef.current?.focus(); document.execCommand("italic"); }}
                      title="Italic"
                      className="px-2 py-1 rounded text-sm italic leading-none text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
                    >I</button>
                    <button
                      onMouseDown={(e) => { e.preventDefault(); contentRef.current?.focus(); document.execCommand("underline"); }}
                      title="Underline"
                      className="px-2 py-1 rounded text-sm underline leading-none text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
                    >U</button>
                    <button
                      onMouseDown={(e) => { e.preventDefault(); contentRef.current?.focus(); document.execCommand("insertUnorderedList"); }}
                      title="Bullet list"
                      className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
                    >
                      <List className="h-3.5 w-3.5" />
                    </button>
                    <div className="w-px h-4 bg-[var(--border)] mx-0.5" />
                    <select
                      onChange={(e) => {
                        const v = e.target.value;
                        if (!v) return;
                        contentRef.current?.focus();
                        document.execCommand("fontSize", false, v);
                        e.target.value = "";
                      }}
                      defaultValue=""
                      title="Font size"
                      className="px-1.5 py-1 rounded text-[11px] bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] focus:outline-none focus:border-[#00bcd4] transition-colors"
                    >
                      <option value="" disabled>Size</option>
                      <option value="1">Small</option>
                      <option value="3">Normal</option>
                      <option value="5">Large</option>
                      <option value="7">X-Large</option>
                    </select>
                    <label
                      title="Text colour"
                      className="flex items-center p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors cursor-pointer"
                    >
                      <Palette className="h-3.5 w-3.5" />
                      <input
                        type="color"
                        className="sr-only"
                        onChange={(e) => { contentRef.current?.focus(); document.execCommand("foreColor", false, e.target.value); }}
                      />
                    </label>
                    <button
                      title="Insert image"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => imgInputRef.current?.click()}
                      className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                    </button>
                    <div className="w-px h-4 bg-[var(--border)] mx-0.5" />
                  </>
                )}
                <button
                  title="Export as .txt"
                  onClick={handleExport}
                  className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  title="Print note"
                  onClick={() => window.print()}
                  className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
                >
                  <Printer className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex-1 min-h-0 px-8 py-4 overflow-y-auto">
                {isToday ? (
                  <div
                    ref={contentRef}
                    contentEditable="true"
                    suppressContentEditableWarning={true}
                    onInput={handleInput}
                    onBlur={handleBlur}
                    data-placeholder="Start writing..."
                    className="notes-editor w-full min-h-[500px] h-full bg-transparent text-[var(--text-primary)] text-base leading-relaxed outline-none"
                    style={{ boxShadow: "none" }}
                  />
                ) : (
                  <div
                    className="text-[var(--text-primary)] text-base leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: selectedNote?.content || "<em style='opacity:0.5'>No content</em>" }}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm">
              Select a note
            </div>
          )}
        </main>

        {/* Right AI panel */}
        {aiOpen && (
          <aside className="notes-no-print w-[300px] flex-shrink-0 flex flex-col border-l border-[var(--border)] bg-[var(--bg-sidebar)]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] flex-shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#e91e8c]" />
                <span className="text-sm font-semibold text-[var(--text-primary)]">Ask AI</span>
              </div>
              <button
                onClick={() => setAiOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {aiLoading && !aiResponse && (
                <div className="text-[var(--text-muted)] text-sm animate-pulse">Thinking...</div>
              )}
              {aiResponse && (
                <div className="text-sm text-[var(--text-primary)] prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{aiResponse}</ReactMarkdown>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-[var(--border)] flex-shrink-0">
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
                  className="flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#00bcd4] transition-colors"
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
    </>
  );
}
