import { useState, useEffect, useCallback } from "react";
import { Paperclip, X, Trash2, Loader2, FileText, Image as ImageIcon, FileSpreadsheet, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchAttachments, addAttachment, deleteAttachment } from "@/lib/manager/managerApi";
import type { CardAttachment } from "@/lib/manager/types";

const ACCEPTED = ".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx";
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const IMAGE_MAX = 500 * 1024;   // 500 KB
const DOC_MAX   = 2 * 1024 * 1024; // 2 MB

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

/** Compress an image file on a canvas, return { dataUrl, compressedSize } */
async function compressImage(file: File): Promise<{ dataUrl: string; compressedSize: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX_DIM = 1200;
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("No canvas context")); return; }
      ctx.drawImage(img, 0, 0, width, height);
      // Use JPEG unless PNG (possible transparency)
      const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
      const quality = mime === "image/jpeg" ? 0.7 : 0.8;
      const dataUrl = canvas.toDataURL(mime, quality);
      // Estimate compressed size from base64 length
      const compressedSize = Math.round((dataUrl.length - dataUrl.indexOf(",") - 1) * 0.75);
      resolve({ dataUrl, compressedSize });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image decode failed")); };
    img.src = url;
  });
}

interface Props { cardId: string }

export default function CardAttachments({ cardId }: Props) {
  const [items, setItems] = useState<CardAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sizeInfo, setSizeInfo] = useState<string | null>(null);

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
    setSizeInfo(null);

    const isImage = IMAGE_TYPES.includes(file.type);
    const maxSize = isImage ? IMAGE_MAX : DOC_MAX;

    // For non-images, enforce size limit immediately
    if (!isImage && file.size > maxSize) {
      setError("File too large. Documents must be under 2MB.");
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      let base64: string;
      let compressedSize: number;
      const originalSize = file.size;

      if (isImage) {
        // Compress image client-side
        const result = await compressImage(file);
        base64 = result.dataUrl;
        compressedSize = result.compressedSize;

        // Check compressed size against limit
        if (compressedSize > IMAGE_MAX) {
          setError("File too large. Images must be under 500KB after compression.");
          setUploading(false);
          e.target.value = "";
          return;
        }
        setSizeInfo(`${formatBytes(originalSize)} → ${formatBytes(compressedSize)}`);
      } else {
        // Read document as base64
        const reader = new FileReader();
        base64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        compressedSize = file.size;
        setSizeInfo(formatBytes(compressedSize));
      }

      const result = await addAttachment(cardId, file.name, file.type, base64);
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
        <label className="text-xs font-mono text-[#8b949e] uppercase tracking-wider flex items-center gap-1.5">
          <Paperclip className="h-3.5 w-3.5" />
          Attachments
          {items.length > 0 && <span className="text-[#c9d1d9]">({items.length})</span>}
        </label>
        <label className={cn("cursor-pointer px-2 py-1 rounded text-xs font-mono text-[#00bcd4] hover:bg-[#00bcd4]/10 transition-colors", uploading && "opacity-50 pointer-events-none")}>
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin inline" /> : "+ Add"}
          <input type="file" accept={ACCEPTED} onChange={handleFile} className="hidden" />
        </label>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-1.5 text-[#f85149] text-xs mb-2 px-2 py-1.5 rounded bg-[#f85149]/10 border border-[#f85149]/20">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Size info after last upload */}
      {sizeInfo && !error && (
        <p className="text-[10px] text-[#8b949e] mb-2">{sizeInfo}</p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-[#8b949e] text-sm py-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading...
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs text-[#8b949e]">No attachments yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {items.map((att) => (
            <div key={att.id} className="relative group rounded-md border border-[#30363d] bg-[#0d1117] overflow-hidden">
              {isImage(att.file_type) ? (
                <button onClick={() => setPreview(att.file_data)} className="w-full">
                  <img src={att.file_data} alt={att.filename} className="w-full h-20 object-cover" />
                </button>
              ) : (
                <a href={att.file_data} download={att.filename} className="flex flex-col items-center justify-center h-20 gap-1 text-[#8b949e] hover:text-[#c9d1d9] transition-colors">
                  {fileIcon(att.file_type)}
                  <span className="text-[10px] truncate max-w-[80%]">{att.filename}</span>
                </a>
              )}
              <button
                onClick={() => handleDelete(att.id)}
                className="absolute top-1 right-1 p-0.5 rounded bg-[#0d1117]/80 text-[#f85149] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen image preview */}
      {preview && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center" onClick={() => setPreview(null)}>
          <button onClick={() => setPreview(null)} className="absolute top-4 right-4 text-white"><X className="h-6 w-6" /></button>
          <img src={preview} alt="Preview" className="max-w-[90vw] max-h-[90vh] rounded-lg" />
        </div>
      )}
    </div>
  );
}
