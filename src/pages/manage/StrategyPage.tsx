import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchStrategyPulls,
  createStrategyPull,
  generateOutstandingSummary,
  generateSuggestedCards,
  type StrategyPull,
  type SuggestedCard,
} from "@/lib/manager/strategyApi";
import { fetchAllCards, fetchBoards, fetchBoard, createCard } from "@/lib/manager/managerApi";
import type { Board, Column, Card } from "@/lib/manager/types";
import {
  FileText, ChevronDown, ChevronRight, Loader2, Sparkles,
  Plus, Check, X, AlertTriangle, Clock, Upload
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const ACCEPTED_EXTENSIONS = [".md", ".txt"];

function isAcceptedFile(file: File): boolean {
  return ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const priorityLabel: Record<string, { label: string; color: string }> = {
  critical: { label: "Critical", color: "bg-[#f85149]/20 text-[#f85149]" },
  this_week: { label: "This Week", color: "bg-[#d29922]/20 text-[#d29922]" },
  backlog: { label: "Backlog", color: "bg-[#8b949e]/20 text-[#8b949e]" },
};

export default function StrategyPage() {
  const queryClient = useQueryClient();
  const [pasteContent, setPasteContent] = useState("");
  const [expandedPulls, setExpandedPulls] = useState<Record<string, boolean>>({});
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [generatingCards, setGeneratingCards] = useState<string | null>(null);
  const [suggestedCards, setSuggestedCards] = useState<SuggestedCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<Record<number, boolean>>({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [creatingCards, setCreatingCards] = useState(false);
  const [activePullId, setActivePullId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  // Board/column data for reassignment
  const [allBoards, setAllBoards] = useState<Board[]>([]);
  const [allColumns, setAllColumns] = useState<Column[]>([]);
  // Per-card overrides: idx -> { board_id, column_id }
  const [cardOverrides, setCardOverrides] = useState<Record<number, { board_id: string; column_id: string }>>({});

  const { data: pullsData, isLoading } = useQuery({
    queryKey: ["strategy-pulls"],
    queryFn: fetchStrategyPulls,
  });
  const pulls = pullsData?.pulls ?? [];

  const apiKey = localStorage.getItem("provenai_anthropic_key") || "";

  const handleFileLoad = useCallback(async (file: File) => {
    if (!isAcceptedFile(file)) {
      toast.error("Only .md and .txt files are accepted.");
      return;
    }
    try {
      const text = await readFileAsText(file);
      setPasteContent(text);
      toast.success(`Loaded ${file.name}`);
    } catch {
      toast.error("Failed to read file.");
    }
  }, []);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileLoad(file);
    e.target.value = "";
  };

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setIsDragOver(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragOver(false);
  };
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileLoad(file);
  };

  const toggleExpand = (id: string) =>
    setExpandedPulls((prev) => ({ ...prev, [id]: !prev[id] }));

  const handlePaste = async () => {
    if (!pasteContent.trim()) return;
    if (!apiKey) {
      toast.error("Add your Anthropic API key in Manager Settings first.");
      return;
    }

    setGeneratingSummary(true);
    try {
      const { cards } = await fetchAllCards();
      const summary = await generateOutstandingSummary(pasteContent, cards);
      await createStrategyPull(pasteContent, summary);
      queryClient.invalidateQueries({ queryKey: ["strategy-pulls"] });
      setPasteContent("");
      toast.success("Strategy pull saved with AI summary.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save strategy pull.");
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleGenerateCards = async (pull: StrategyPull) => {
    if (!apiKey) {
      toast.error("Add your Anthropic API key in Manager Settings first.");
      return;
    }

    setGeneratingCards(pull.id);
    setActivePullId(pull.id);
    try {
      const [{ cards }, { boards }] = await Promise.all([fetchAllCards(), fetchBoards()]);
      // Fetch columns for all boards
      const allColumns: Column[] = [];
      for (const board of boards) {
        const boardData = await fetchBoard(board.id);
        allColumns.push(...boardData.columns);
      }
      const suggested = await generateSuggestedCards(
        pull.content,
        cards,
        boards.map((b) => ({ id: b.id, name: b.name })),
        allColumns.map((c) => ({ id: c.id, board_id: c.board_id, name: c.name }))
      );
      setSuggestedCards(suggested);
      setSelectedCards(Object.fromEntries(suggested.map((_, i) => [i, true])));
      setShowConfirmation(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate cards.");
    } finally {
      setGeneratingCards(null);
    }
  };

  const handleCreateCards = async () => {
    setCreatingCards(true);
    try {
      const toCreate = suggestedCards.filter((_, i) => selectedCards[i]);
      for (const card of toCreate) {
        await createCard({
          title: card.title,
          board_id: card.board_id,
          column_id: card.column_id,
          priority: card.priority,
          assignee: "jeff",
          sort_order: 0,
        } as any);
      }
      toast.success(`Created ${toCreate.length} cards.`);
      setShowConfirmation(false);
      setSuggestedCards([]);
      setSelectedCards({});
      queryClient.invalidateQueries({ queryKey: ["all-cards"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create cards.");
    } finally {
      setCreatingCards(false);
    }
  };

  const toggleCard = (idx: number) =>
    setSelectedCards((prev) => ({ ...prev, [idx]: !prev[idx] }));

  const selectedCount = Object.values(selectedCards).filter(Boolean).length;

  // Card creation confirmation overlay
  if (showConfirmation) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-6 border-b border-[#30363d]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-[#00bcd4]" />
              <h1 className="text-xl font-bold font-mono text-[#e0e7ef]">
                Suggested Cards ({suggestedCards.length})
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setShowConfirmation(false); setSuggestedCards([]); }}
                className="px-3 py-1.5 text-sm rounded-md border border-[#30363d] text-[#a0aab8] hover:text-[#e0e7ef] hover:border-[#8b949e] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCards}
                disabled={creatingCards || selectedCount === 0}
                className="px-4 py-1.5 text-sm rounded-md bg-[#00bcd4] text-[#13181f] font-medium hover:bg-[#00bcd4]/90 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {creatingCards ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Create {selectedCount} Card{selectedCount !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          {suggestedCards.map((card, idx) => {
            const pri = priorityLabel[card.priority] || priorityLabel.backlog;
            return (
              <label
                key={idx}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
                  selectedCards[idx]
                    ? "border-[#00bcd4]/40 bg-[#00bcd4]/5"
                    : "border-[#30363d] bg-[#161b22] opacity-60"
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedCards[idx] ?? false}
                  onChange={() => toggleCard(idx)}
                  className="rounded border-[#30363d] text-[#00bcd4] focus:ring-[#00bcd4]"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#e0e7ef] truncate">{card.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[#8b949e]">{card.board_id}</span>
                    <span className="text-xs text-[#8b949e]">→</span>
                    <span className="text-xs text-[#8b949e]">{card.column_id}</span>
                  </div>
                </div>
                <span className={cn("px-2 py-0.5 rounded text-xs font-medium", pri.color)}>
                  {pri.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-[#30363d]">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-[#00bcd4]" />
          <h1 className="text-xl font-bold font-mono text-[#e0e7ef]">Strategy Intelligence</h1>
        </div>
        <p className="text-sm text-[#8b949e] mt-1">
          Paste strategy documents to identify missing tasks and auto-create cards.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Input zone */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[#e0e7ef]">New Strategy Pull</label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-md border border-[#30363d] text-xs font-medium text-[#a0aab8] hover:text-[#e0e7ef] hover:border-[#8b949e] transition-colors flex items-center gap-1.5"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload .md / .txt
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt"
              onChange={handleFilePick}
              className="hidden"
            />
          </div>
          <div
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className={cn(
              "relative rounded-lg border-2 transition-colors",
              isDragOver
                ? "border-dashed border-[#00bcd4] bg-[#00bcd4]/5"
                : "border-solid border-[#30363d]"
            )}
          >
            {isDragOver && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-[#00bcd4]/10 z-10 pointer-events-none">
                <span className="text-sm font-medium text-[#00bcd4]">Drop .md or .txt file here</span>
              </div>
            )}
            <textarea
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder="Paste, type, or drag & drop a .md / .txt file here..."
              rows={8}
              className="w-full rounded-lg border-0 bg-[#0d1117] text-[#e0e7ef] text-sm p-4 placeholder:text-[#484f58] focus:outline-none resize-y"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#484f58]">
              {pasteContent.length > 0
                ? `${pasteContent.split(/\s+/).filter(Boolean).length} words`
                : "Paste, upload, or drag a strategy document"}
            </span>
            <button
              onClick={handlePaste}
              disabled={!pasteContent.trim() || generatingSummary}
              className="px-4 py-2 rounded-md bg-[#00bcd4] text-[#13181f] text-sm font-medium hover:bg-[#00bcd4]/90 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {generatingSummary ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analysing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Save & Analyse
                </>
              )}
            </button>
          </div>
        </div>

        {/* API key warning */}
        {!apiKey && (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-[#d29922]/30 bg-[#d29922]/5">
            <AlertTriangle className="h-4 w-4 text-[#d29922] flex-shrink-0" />
            <p className="text-sm text-[#d29922]">
              Add your Anthropic API key in{" "}
              <a href="/manage/settings" className="underline">Manager Settings</a>{" "}
              to enable AI features.
            </p>
          </div>
        )}

        {/* Pulls history */}
        <div>
          <h2 className="text-sm font-semibold text-[#e0e7ef] uppercase tracking-wider mb-3">
            Pull History
          </h2>

          {isLoading ? (
            <div className="flex items-center gap-2 text-[#8b949e] text-sm py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : pulls.length === 0 ? (
            <p className="text-sm text-[#484f58] text-center py-8">
              No strategy pulls yet. Paste a document above to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {pulls.map((pull) => (
                <div
                  key={pull.id}
                  className="border border-[#30363d] rounded-lg bg-[#161b22] overflow-hidden"
                >
                  {/* Pull header */}
                  <button
                    onClick={() => toggleExpand(pull.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-[#1c2128] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {expandedPulls[pull.id] ? (
                        <ChevronDown className="h-4 w-4 text-[#8b949e]" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-[#8b949e]" />
                      )}
                      <Clock className="h-4 w-4 text-[#00bcd4]" />
                      <span className="text-sm font-medium text-[#e0e7ef]">
                        {formatDate(pull.created_at)}
                      </span>
                      <span className="text-xs text-[#484f58]">
                        ({pull.content.split(/\s+/).filter(Boolean).length} words)
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateCards(pull);
                      }}
                      disabled={generatingCards === pull.id}
                      className="px-3 py-1 rounded-md border border-[#30363d] text-xs font-medium text-[#00bcd4] hover:bg-[#00bcd4]/10 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {generatingCards === pull.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Plus className="h-3 w-3" />
                      )}
                      Create suggested cards
                    </button>
                  </button>

                  {/* Summary (always visible when present) */}
                  {pull.summary && (
                    <div className="px-4 pb-4 border-t border-[#30363d]/50">
                      <div className="mt-3 p-3 rounded-md bg-[#00bcd4]/5 border border-[#00bcd4]/20">
                        <p className="text-xs font-semibold text-[#00bcd4] uppercase tracking-wider mb-2">
                          Outstanding Items (AI Summary)
                        </p>
                        <div className="prose prose-sm prose-invert max-w-none text-[#c9d1d9] text-sm">
                          <ReactMarkdown>{pull.summary}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Expanded full content */}
                  {expandedPulls[pull.id] && (
                    <div className="px-4 pb-4 border-t border-[#30363d]/50">
                      <p className="text-xs font-semibold text-[#8b949e] uppercase tracking-wider mt-3 mb-2">
                        Full Document
                      </p>
                      <pre className="text-sm text-[#8b949e] whitespace-pre-wrap font-sans leading-relaxed bg-[#0d1117] p-4 rounded-md max-h-96 overflow-y-auto">
                        {pull.content}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
