import { useState, useEffect, useCallback } from "react";
import { Paperclip, X, Trash2, Loader2, FileText, Image as ImageIcon, FileSpreadsheet, AlertCircle, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchAttachments, addAttachment, deleteAttachment } from "@/lib/manager/managerApi";
import type { CardAttachment } from "@/lib/manager/types";
import StorageFilePicker from "./StorageFilePicker";

const ACCEPTED = ".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx";
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

function formatBytes(b: number) {
  if (b < 1024) return `${b}B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)}KB`;
  return `${(b / (1024 * 1024)).toFixed(1)}MB`;
}

function fileIcon(type: string) {
  if (IMAGE_TYPES.includes(type)) return <ImageIcon className="h-4 w-4" />;
  if (type.includes("spreadsheet") || type.includes("excel") || type.includes(".xls")) return <FileSpreadsheet className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

interface Props { cardId: string }

export default function CardAttachments({ cardId }: Props) {
  const [items, setItems] = useState<CardAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSize, setLastSize] = useState<string | null>(null);
  const [showStorage, setShowStorage] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchAttachments(cardId)
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [cardId]);

  useEffect(() => { load(); }, [load]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLastSize(null);

    if (file.size > MAX_SIZE) {
      setError("File too large. Maximum size is 50MB.");
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      setLastSize(formatBytes(file.size));
      const result = await addAttachment(cardId, file);
      if (result.item) {
        setItems((prev) => [...prev, result.item]);
      } else {
        load();
      }
    } catch (err) {
      console.error("[Attachments] Upload error:", err);
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((a) => a.id !== id));
    try { await deleteAttachment(cardId, id); } catch { load(); }
  };

  const isImage = (ft: string) => IMAGE_TYPES.includes(ft);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
          <Paperclip className="h-3.5 w-3.5" />
          Attachments
          {items.length > 0 && <span className="text-[var(--text-primary)]">({items.length})</span>}
        </label>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowStorage(true)} className="px-2 py-1 rounded text-xs font-mono text-[var(--text-muted)] hover:text-[#00bcd4] hover:bg-[#00bcd4]/10 transition-colors flex items-center gap-1">
            <FolderOpen className="h-3 w-3" /> Storage
          </button>
          <label className={cn("cursor-pointer px-2 py-1 rounded text-xs font-mono text-[#00bcd4] hover:bg-[#00bcd4]/10 transition-colors", uploading && "opacity-50 pointer-events-none")}>
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin inline" /> : "+ Add"}
            <input type="file" accept={ACCEPTED} onChange={handleFile} className="hidden" />
          </label>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-[#f85149] text-xs mb-2 px-2 py-1.5 rounded bg-[#f85149]/10 border border-[#f85149]/20">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {lastSize && !error && (
        <p className="text-[10px] text-[var(--text-muted)] mb-2">Uploaded: {lastSize}</p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm py-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading...
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)]">No attachments yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {items.map((att) => (
            <div key={att.id} className="relative group rounded-md border border-[var(--border)] bg-[var(--bg-primary)] overflow-hidden">
              {isImage(att.file_type) ? (
                <button onClick={() => setPreview(att.file_url)} className="w-full">
                  <img src={att.file_url} alt={att.filename} className="w-full h-20 object-cover" />
                </button>
              ) : (
                <a href={att.file_url} download={att.filename} className="flex flex-col items-center justify-center h-20 gap-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                  {fileIcon(att.file_type)}
                  <span className="text-[10px] truncate max-w-[80%]">{att.filename}</span>
                </a>
              )}
              <button
                onClick={() => handleDelete(att.id)}
                className="absolute top-1 right-1 p-0.5 rounded bg-[var(--bg-primary)]/80 text-[#f85149] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center" onClick={() => setPreview(null)}>
          <button onClick={() => setPreview(null)} className="absolute top-4 right-4 text-white"><X className="h-6 w-6" /></button>
          <img src={preview} alt="Preview" className="max-w-[90vw] max-h-[90vh] rounded-lg" />
        </div>
      )}

      {showStorage && (
        <StorageFilePicker
          onClose={() => setShowStorage(false)}
          onSelect={async (file) => {
            setShowStorage(false);
            try {
              const res = await fetch(`/api/manage/cards/${cardId}/attachments`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename: file.filename, file_type: file.file_type, file_url: file.file_url, from_storage: true }),
              });
              const data = await res.json();
              if (data.item) setItems((prev) => [...prev, data.item]);
              else load();
            } catch { load(); }
          }}
        />
      )}
    </div>
  );
}
