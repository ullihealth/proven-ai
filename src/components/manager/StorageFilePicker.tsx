import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchFolders, fetchFolderFiles, type StorageFolder, type StorageFile } from "@/lib/manager/storageApi";
import { cn } from "@/lib/utils";
import { FolderClosed, FolderOpen, ChevronRight, ChevronDown, X, FileText, Image as ImageIcon, FileSpreadsheet, File as FileIcon } from "lucide-react";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

function formatBytes(b: number) {
  if (b < 1024) return `${b}B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)}KB`;
  return `${(b / (1024 * 1024)).toFixed(1)}MB`;
}

function getFileIcon(type: string) {
  if (IMAGE_TYPES.includes(type)) return <ImageIcon className="h-3.5 w-3.5 text-[#00bcd4]" />;
  if (type.includes("spreadsheet") || type.includes("excel")) return <FileSpreadsheet className="h-3.5 w-3.5 text-[#3fb950]" />;
  if (type.includes("pdf")) return <FileText className="h-3.5 w-3.5 text-[#f85149]" />;
  return <FileIcon className="h-3.5 w-3.5 text-[#a0aab8]" />;
}

interface Props {
  onSelect: (file: { filename: string; file_type: string; file_url: string }) => void;
  onClose: () => void;
}

export default function StorageFilePicker({ onSelect, onClose }: Props) {
  const { data: foldersData } = useQuery({ queryKey: ["storage-folders"], queryFn: fetchFolders });
  const folders = foldersData?.folders ?? [];

  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  useEffect(() => {
    if (!selectedFolder) { setFiles([]); return; }
    setLoadingFiles(true);
    fetchFolderFiles(selectedFolder).then((d) => setFiles(d.files)).catch(() => setFiles([])).finally(() => setLoadingFiles(false));
  }, [selectedFolder]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const toggleExpanded = (id: string) => setExpanded((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const roots = folders.filter((f) => !f.parent_id).sort((a, b) => a.position - b.position);

  const renderFolder = (f: StorageFolder, level: number): React.ReactNode => {
    const children = folders.filter((c) => c.parent_id === f.id);
    const isExp = expanded.has(f.id);
    return (
      <div key={f.id}>
        <button onClick={() => { setSelectedFolder(f.id); if (!isExp && children.length) toggleExpanded(f.id); }}
          className={cn("flex items-center gap-1 w-full text-left px-2 py-1 rounded text-xs transition-colors",
            selectedFolder === f.id ? "bg-[#1c2128] text-[#00bcd4]" : "text-[#a0aab8] hover:bg-[#242b35]"
          )} style={{ paddingLeft: `${4 + level * 12}px` }}>
          {children.length > 0 ? (
            <span onClick={(e) => { e.stopPropagation(); toggleExpanded(f.id); }}>
              {isExp ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </span>
          ) : <span className="w-3" />}
          {isExp ? <FolderOpen className="h-3.5 w-3.5" /> : <FolderClosed className="h-3.5 w-3.5" />}
          <span className="truncate">{f.name}</span>
        </button>
        {isExp && children.map((c) => renderFolder(c, level + 1))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-[#242b35] border border-[#30363d] rounded-lg flex flex-col mx-4 resize overflow-auto"
        style={{ width: "min(700px, 80vw)", height: "min(500px, 70vh)", minWidth: 340, minHeight: 260 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d] flex-shrink-0">
          <span className="text-sm font-semibold text-[#e0e7ef]">Browse Storage</span>
          <button onClick={onClose} className="text-[#a0aab8] hover:text-[#e0e7ef]"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex flex-1 min-h-0">
          <div className="w-48 border-r border-[#30363d] overflow-y-auto py-1 flex-shrink-0">
            {roots.map((f) => renderFolder(f, 0))}
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {!selectedFolder ? (
              <p className="text-xs text-[#8b949e] text-center py-8">Select a folder</p>
            ) : loadingFiles ? (
              <p className="text-xs text-[#8b949e] text-center py-8">Loading...</p>
            ) : files.length === 0 ? (
              <p className="text-xs text-[#8b949e] text-center py-8">No files</p>
            ) : files.map((file) => (
              <button key={file.id} onClick={() => onSelect({ filename: file.filename, file_type: file.file_type, file_url: file.file_url })}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs text-[#e0e7ef] hover:bg-[#1c2128] transition-colors text-left">
                {getFileIcon(file.file_type)}
                <span className="truncate flex-1">{file.filename}</span>
                <span className="text-[10px] text-[#8b949e]">{formatBytes(file.size)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
