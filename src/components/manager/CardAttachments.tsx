import { useState, useEffect, useCallback } from "react";
import { Paperclip, X, Trash2, Loader2, FileText, Image as ImageIcon, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchAttachments, addAttachment, deleteAttachment } from "@/lib/manager/managerApi";
import type { CardAttachment } from "@/lib/manager/types";

const ACCEPTED = ".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx";
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

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

  const load = useCallback(() => {
    setLoading(true);
    fetchAttachments(cardId)
      .then((d) => setItems(d.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [cardId]);

  useEffect(() => { load(); }, [load]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const { item } = await addAttachment(cardId, file.name, file.type, base64);
      setItems((prev) => [...prev, item]);
    } catch {} finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((a) => a.id !== id));
    try { await deleteAttachment(cardId, id); } catch { load(); }
  };

  const isImage = (ft: string) => IMAGE_TYPES.includes(ft);

  const inputClass = "w-full px-3 py-2 rounded-md bg-[#0d1117] border border-[#30363d] text-sm text-[#c9d1d9] placeholder-[#8b949e] focus:border-[#00bcd4] focus:outline-none";

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
