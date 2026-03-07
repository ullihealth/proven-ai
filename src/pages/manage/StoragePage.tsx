import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchFolders, fetchFolderFiles, createFolder, updateFolder, deleteFolder,
  uploadStorageFile, updateFile, deleteFile,
  type StorageFolder, type StorageFile,
} from "@/lib/manager/storageApi";
import { addAttachment } from "@/lib/manager/managerApi";
import { cn } from "@/lib/utils";
import {
  FolderOpen, FolderClosed, ChevronRight, ChevronDown, Plus, Upload, Loader2,
  FileText, Image as ImageIcon, FileSpreadsheet, Trash2, Pencil, Copy, Link, Move,
  X, File as FileIcon, Download,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

function formatBytes(b: number) {
  if (b < 1024) return `${b}B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)}KB`;
  return `${(b / (1024 * 1024)).toFixed(1)}MB`;
}

function getFileIcon(type: string) {
  if (IMAGE_TYPES.includes(type)) return <ImageIcon className="h-4 w-4 text-[#00bcd4]" />;
  if (type.includes("spreadsheet") || type.includes("excel")) return <FileSpreadsheet className="h-4 w-4 text-[#3fb950]" />;
  if (type.includes("pdf")) return <FileText className="h-4 w-4 text-[#f85149]" />;
  return <FileIcon className="h-4 w-4 text-[#a0aab8]" />;
}

// --- Folder Tree ---
function FolderTreeItem({
  folder, folders, level, selectedId, onSelect, onContextMenu, expanded, onToggle,
}: {
  folder: StorageFolder; folders: StorageFolder[]; level: number;
  selectedId: string | null; onSelect: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, f: StorageFolder) => void;
  expanded: Set<string>; onToggle: (id: string) => void;
}) {
  const children = folders.filter((f) => f.parent_id === folder.id).sort((a, b) => a.position - b.position);
  const isExpanded = expanded.has(folder.id);
  const isSelected = selectedId === folder.id;

  return (
    <div>
      <button
        onClick={() => { onSelect(folder.id); if (!isExpanded && children.length > 0) onToggle(folder.id); }}
        onContextMenu={(e) => onContextMenu(e, folder)}
        className={cn(
          "flex items-center gap-1.5 w-full text-left px-2 py-1.5 rounded text-sm transition-colors",
          isSelected ? "bg-[#1c2128] text-[#00bcd4]" : "text-[#a0aab8] hover:bg-[#242b35] hover:text-[#e0e7ef]"
        )}
        style={{ paddingLeft: `${8 + level * 16}px` }}
      >
        {children.length > 0 ? (
          <button onClick={(e) => { e.stopPropagation(); onToggle(folder.id); }} className="flex-shrink-0">
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : <span className="w-3.5" />}
        {isExpanded ? <FolderOpen className="h-4 w-4 flex-shrink-0" /> : <FolderClosed className="h-4 w-4 flex-shrink-0" />}
        <span className="truncate">{folder.name}</span>
      </button>
      {isExpanded && children.map((c) => (
        <FolderTreeItem key={c.id} folder={c} folders={folders} level={level + 1}
          selectedId={selectedId} onSelect={onSelect} onContextMenu={onContextMenu}
          expanded={expanded} onToggle={onToggle} />
      ))}
    </div>
  );
}

// --- Context Menu ---
function ContextMenu({ x, y, items, onClose }: { x: number; y: number; items: { label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean }[]; onClose: () => void }) {
  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [onClose]);

  return (
    <div className="fixed z-[80] bg-[#242b35] border border-[#30363d] rounded-md shadow-xl py-1 min-w-[180px]" style={{ left: x, top: y }} onClick={(e) => e.stopPropagation()}>
      {items.map((item, i) => (
        <button key={i} onClick={() => { item.onClick(); onClose(); }}
          className={cn("flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left transition-colors",
            item.danger ? "text-[#f85149] hover:bg-[#f85149]/10" : "text-[#e0e7ef] hover:bg-[#1c2128]"
          )}>
          {item.icon}{item.label}
        </button>
      ))}
    </div>
  );
}

// --- File Preview ---
function FilePreview({ file, onClose }: { file: StorageFile; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const isImage = IMAGE_TYPES.includes(file.file_type);
  const isPdf = file.file_type === "application/pdf";
  const isOffice = /\.(docx?|xlsx?|pptx?)$/i.test(file.filename);
  const fullUrl = `${window.location.origin}${file.file_url}`;

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white z-10"><X className="h-6 w-6" /></button>
      <div className="w-full max-w-4xl max-h-[90vh] mx-4" onClick={(e) => e.stopPropagation()}>
        {isImage ? (
          <img src={file.file_url} alt={file.filename} className="max-w-full max-h-[90vh] rounded-lg mx-auto" />
        ) : isPdf ? (
          <iframe src={file.file_url} className="w-full h-[85vh] rounded-lg bg-white" />
        ) : isOffice ? (
          <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(fullUrl)}&embedded=true`} className="w-full h-[85vh] rounded-lg bg-white" />
        ) : (
          <div className="bg-[#242b35] rounded-lg p-8 text-center border border-[#30363d]">
            <FileIcon className="h-16 w-16 text-[#a0aab8] mx-auto mb-4" />
            <p className="text-lg font-semibold text-[#e0e7ef] mb-1">{file.filename}</p>
            <p className="text-sm text-[#a0aab8] mb-1">{file.file_type} · {formatBytes(file.size)}</p>
            <a href={file.file_url} download={file.filename} className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-md bg-[#00bcd4] text-[#0d1117] text-sm font-semibold hover:bg-[#00bcd4]/90">
              <Download className="h-4 w-4" /> Download
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Card Search Picker ---
function CardSearchPicker({ fileUrl, filename, fileType, onClose }: { fileUrl: string; filename: string; fileType: string; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; title: string; board_name?: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/manage/cards?q=${encodeURIComponent(q)}`, { credentials: "include" });
      const data = await res.json();
      setResults(data.cards ?? []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { const t = setTimeout(() => search(query), 300); return () => clearTimeout(t); }, [query, search]);

  const handleAttach = async (cardId: string) => {
    try {
      // Create attachment linking to existing R2 URL (no re-upload)
      await fetch(`/api/manage/cards/${cardId}/attachments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, file_type: fileType, file_url: fileUrl, from_storage: true }),
      });
      toast({ title: "Attached to card" });
      onClose();
    } catch {
      toast({ title: "Failed to attach", variant: "destructive" });
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center" onClick={onClose}>
      <div className="bg-[#242b35] border border-[#30363d] rounded-lg w-full max-w-md mx-4 p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-[#e0e7ef]">Attach to Card</span>
          <button onClick={onClose} className="text-[#a0aab8] hover:text-[#e0e7ef]"><X className="h-4 w-4" /></button>
        </div>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search cards..." autoFocus
          className="w-full px-3 py-2 rounded-md bg-[#0d1117] border border-[#30363d] text-sm text-[#e0e7ef] placeholder-[#a0aab8] focus:border-[#00bcd4] focus:outline-none mb-2" />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-[#a0aab8] mx-auto my-2" />}
        <div className="max-h-60 overflow-y-auto space-y-1">
          {results.map((c) => (
            <button key={c.id} onClick={() => handleAttach(c.id)}
              className="flex items-center justify-between w-full px-3 py-2 rounded text-sm text-[#e0e7ef] hover:bg-[#1c2128] transition-colors text-left">
              <span className="truncate">{c.title}</span>
              {c.board_name && <span className="text-[10px] text-[#8b949e] ml-2 flex-shrink-0">{c.board_name}</span>}
            </button>
          ))}
          {!loading && query && results.length === 0 && <p className="text-xs text-[#8b949e] text-center py-2">No cards found</p>}
        </div>
      </div>
    </div>
  );
}

// --- Move to Folder Picker ---
function FolderPicker({ folders, currentFolderId, onSelect, onClose }: { folders: StorageFolder[]; currentFolderId: string | null; onSelect: (id: string) => void; onClose: () => void }) {
  const roots = folders.filter((f) => !f.parent_id);

  const renderFolder = (f: StorageFolder, level: number): React.ReactNode => {
    const children = folders.filter((c) => c.parent_id === f.id);
    return (
      <div key={f.id}>
        <button onClick={() => { if (f.id !== currentFolderId) onSelect(f.id); }}
          disabled={f.id === currentFolderId}
          className={cn("flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left transition-colors rounded",
            f.id === currentFolderId ? "text-[#8b949e] cursor-not-allowed" : "text-[#e0e7ef] hover:bg-[#1c2128]"
          )} style={{ paddingLeft: `${12 + level * 16}px` }}>
          <FolderClosed className="h-3.5 w-3.5" />{f.name}
        </button>
        {children.map((c) => renderFolder(c, level + 1))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center" onClick={onClose}>
      <div className="bg-[#242b35] border border-[#30363d] rounded-lg w-full max-w-sm mx-4 p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-[#e0e7ef]">Move to Folder</span>
          <button onClick={onClose} className="text-[#a0aab8] hover:text-[#e0e7ef]"><X className="h-4 w-4" /></button>
        </div>
        <div className="max-h-60 overflow-y-auto">{roots.map((f) => renderFolder(f, 0))}</div>
      </div>
    </div>
  );
}

// ===================== MAIN PAGE =====================
export default function StoragePage() {
  const qc = useQueryClient();
  const { data: foldersData, isLoading: loadingFolders } = useQuery({ queryKey: ["storage-folders"], queryFn: fetchFolders });
  const folders = foldersData?.folders ?? [];

  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<StorageFile | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Context menus
  const [folderCtx, setFolderCtx] = useState<{ x: number; y: number; folder: StorageFolder } | null>(null);
  const [fileCtx, setFileCtx] = useState<{ x: number; y: number; file: StorageFile } | null>(null);

  // Pickers
  const [cardPicker, setCardPicker] = useState<StorageFile | null>(null);
  const [movePicker, setMovePicker] = useState<StorageFile | null>(null);

  // Rename state
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [renameFileValue, setRenameFileValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleExpanded = (id: string) => setExpanded((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  // Load files when folder selected
  useEffect(() => {
    if (!selectedFolder) { setFiles([]); return; }
    setLoadingFiles(true);
    fetchFolderFiles(selectedFolder)
      .then((d) => setFiles(d.files))
      .catch(() => setFiles([]))
      .finally(() => setLoadingFiles(false));
  }, [selectedFolder]);

  const handleCreateFolder = async (parentId?: string | null) => {
    const name = prompt("Folder name:");
    if (!name?.trim()) return;
    try {
      await createFolder(name.trim(), parentId);
      qc.invalidateQueries({ queryKey: ["storage-folders"] });
      if (parentId) setExpanded((prev) => new Set(prev).add(parentId));
    } catch { toast({ title: "Failed to create folder", variant: "destructive" }); }
  };

  const handleRenameFolder = async (id: string) => {
    if (!renameValue.trim()) { setRenamingFolder(null); return; }
    try {
      await updateFolder(id, { name: renameValue.trim() });
      qc.invalidateQueries({ queryKey: ["storage-folders"] });
    } catch {} finally { setRenamingFolder(null); }
  };

  const handleDeleteFolder = async (folder: StorageFolder) => {
    // Count files recursively
    const countFiles = (fid: string): number => {
      const childFolders = folders.filter((f) => f.parent_id === fid);
      return files.filter((f) => f.folder_id === fid).length + childFolders.reduce((sum, cf) => sum + countFiles(cf.id), 0);
    };
    const count = countFiles(folder.id);
    const msg = count > 0
      ? `This folder has files. Deleting it will permanently remove all contents. Are you sure?`
      : `Delete folder "${folder.name}"?`;
    if (!confirm(msg)) return;
    try {
      await deleteFolder(folder.id);
      if (selectedFolder === folder.id) setSelectedFolder(null);
      qc.invalidateQueries({ queryKey: ["storage-folders"] });
    } catch { toast({ title: "Failed to delete folder", variant: "destructive" }); }
  };

  const handleUpload = async (fileList: FileList) => {
    if (!selectedFolder) { toast({ title: "Select a folder first" }); return; }
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const result = await uploadStorageFile(selectedFolder, file);
        if (result.file) setFiles((prev) => [...prev, result.file]);
      }
    } catch { toast({ title: "Upload failed", variant: "destructive" }); }
    finally { setUploading(false); }
  };

  const handleDeleteFile = async (file: StorageFile) => {
    if (!confirm(`Delete "${file.filename}"?`)) return;
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
    try { await deleteFile(file.id); }
    catch { if (selectedFolder) fetchFolderFiles(selectedFolder).then((d) => setFiles(d.files)); }
  };

  const handleRenameFile = async (id: string) => {
    if (!renameFileValue.trim()) { setRenamingFile(null); return; }
    try {
      await updateFile(id, { filename: renameFileValue.trim() });
      setFiles((prev) => prev.map((f) => f.id === id ? { ...f, filename: renameFileValue.trim() } : f));
    } catch {} finally { setRenamingFile(null); }
  };

  const handleMoveFile = async (file: StorageFile, newFolderId: string) => {
    try {
      await updateFile(file.id, { folder_id: newFolderId });
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      toast({ title: "File moved" });
    } catch { toast({ title: "Failed to move", variant: "destructive" }); }
    finally { setMovePicker(null); }
  };

  const copyLink = (file: StorageFile) => {
    const url = `${window.location.origin}${file.file_url}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied" });
  };

  // Drag & drop from outside browser
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) handleUpload(e.dataTransfer.files);
  };

  const rootFolders = folders.filter((f) => !f.parent_id).sort((a, b) => a.position - b.position);
  const selectedFolderObj = folders.find((f) => f.id === selectedFolder);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#30363d]">
        <h1 className="text-xl font-bold text-[#e0e7ef] font-mono">Storage</h1>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Folder tree */}
        <div className="w-64 border-r border-[#30363d] flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#30363d]">
            <span className="text-xs font-semibold text-[#a0aab8] uppercase tracking-wider">Folders</span>
            <button onClick={() => handleCreateFolder(null)} className="text-[#00bcd4] hover:text-[#00bcd4]/80 transition-colors" title="New folder">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {loadingFolders ? (
              <div className="flex items-center gap-2 text-[#a0aab8] text-sm px-3 py-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
            ) : rootFolders.length === 0 ? (
              <p className="text-xs text-[#8b949e] px-3 py-4 text-center">No folders yet. Click + to create one.</p>
            ) : rootFolders.map((f) => (
              renamingFolder === f.id ? (
                <div key={f.id} className="px-2 py-1">
                  <input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => handleRenameFolder(f.id)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleRenameFolder(f.id); if (e.key === "Escape") setRenamingFolder(null); }}
                    className="w-full px-2 py-1 bg-[#0d1117] border border-[#00bcd4] rounded text-sm text-[#e0e7ef] focus:outline-none" />
                </div>
              ) : (
                <FolderTreeItem key={f.id} folder={f} folders={folders} level={0}
                  selectedId={selectedFolder} onSelect={setSelectedFolder}
                  onContextMenu={(e, folder) => { e.preventDefault(); setFolderCtx({ x: e.clientX, y: e.clientY, folder }); }}
                  expanded={expanded} onToggle={toggleExpanded} />
              )
            ))}
          </div>
        </div>

        {/* File list */}
        <div className="flex-1 flex flex-col min-w-0"
          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
          {selectedFolder ? (
            <>
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#30363d]">
                <span className="text-sm font-semibold text-[#e0e7ef] truncate">{selectedFolderObj?.name ?? "Folder"}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleCreateFolder(selectedFolder)} className="text-xs text-[#00bcd4] hover:text-[#00bcd4]/80 font-mono">+ Subfolder</button>
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    className="flex items-center gap-1 text-xs text-[#00bcd4] hover:text-[#00bcd4]/80 font-mono disabled:opacity-50">
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Upload
                  </button>
                  <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => { if (e.target.files) handleUpload(e.target.files); e.target.value = ""; }} />
                </div>
              </div>
              <div className={cn("flex-1 overflow-y-auto", dragOver && "bg-[#00bcd4]/5 ring-2 ring-[#00bcd4]/30 ring-inset")}>
                {loadingFiles ? (
                  <div className="flex items-center gap-2 text-[#a0aab8] text-sm px-4 py-8 justify-center"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
                ) : files.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-[#8b949e]">
                    <Upload className="h-8 w-8 mb-2" />
                    <p className="text-sm">Drop files here or click Upload</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#30363d] text-[#8b949e] text-xs font-mono uppercase tracking-wider">
                        <th className="text-left px-4 py-2">Name</th>
                        <th className="text-left px-4 py-2 w-20">Size</th>
                        <th className="text-left px-4 py-2 w-28">Date</th>
                        <th className="text-left px-4 py-2 w-16">By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((file) => (
                        <tr key={file.id}
                          onContextMenu={(e) => { e.preventDefault(); setFileCtx({ x: e.clientX, y: e.clientY, file }); }}
                          draggable={selectedFile === file.id}
                          onDragStart={(e) => {
                            if (selectedFile !== file.id) { e.preventDefault(); return; }
                            e.dataTransfer.setData("application/x-move-file", JSON.stringify({ id: file.id, filename: file.filename }));
                            e.dataTransfer.effectAllowed = "move";
                          }}
                          className={cn(
                            "border-b border-[#30363d]/50 transition-colors",
                            selectedFile === file.id ? "bg-[#00bcd4]/10 ring-1 ring-inset ring-[#00bcd4]/30" : "hover:bg-[#1c2128]"
                          )}>
                          <td className="px-4 py-2 flex items-center gap-2">
                            {/* Icon click = select for drag */}
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedFile(selectedFile === file.id ? null : file.id); }}
                              className="flex-shrink-0 cursor-grab"
                            >
                              {getFileIcon(file.file_type)}
                            </button>
                            {renamingFile === file.id ? (
                              <input autoFocus value={renameFileValue} onChange={(e) => setRenameFileValue(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                onBlur={() => handleRenameFile(file.id)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleRenameFile(file.id); if (e.key === "Escape") setRenamingFile(null); }}
                                className="px-1 py-0.5 bg-[#0d1117] border border-[#00bcd4] rounded text-sm text-[#e0e7ef] focus:outline-none flex-1 min-w-0" />
                            ) : (
                              <span
                                className="text-[#e0e7ef] truncate cursor-text"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRenamingFile(file.id);
                                  setRenameFileValue(file.filename);
                                }}
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  setRenamingFile(null);
                                  setPreview(file);
                                }}
                              >{file.filename}</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-[#8b949e] text-xs">{formatBytes(file.size)}</td>
                          <td className="px-4 py-2 text-[#8b949e] text-xs">{file.created_at ? format(new Date(file.created_at), "MMM d, yyyy") : "—"}</td>
                          <td className="px-4 py-2 text-[#8b949e] text-xs">{file.uploaded_by}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#8b949e]">
              <p className="text-sm">Select a folder from the tree</p>
            </div>
          )}
        </div>
      </div>

      {/* Context Menus */}
      {folderCtx && (
        <ContextMenu x={folderCtx.x} y={folderCtx.y} onClose={() => setFolderCtx(null)} items={[
          { label: "New Subfolder", icon: <Plus className="h-3.5 w-3.5" />, onClick: () => handleCreateFolder(folderCtx.folder.id) },
          { label: "Rename", icon: <Pencil className="h-3.5 w-3.5" />, onClick: () => { setRenamingFolder(folderCtx.folder.id); setRenameValue(folderCtx.folder.name); } },
          { label: "Delete", icon: <Trash2 className="h-3.5 w-3.5" />, onClick: () => handleDeleteFolder(folderCtx.folder), danger: true },
        ]} />
      )}

      {fileCtx && (
        <ContextMenu x={fileCtx.x} y={fileCtx.y} onClose={() => setFileCtx(null)} items={[
          { label: "Preview", icon: <FileIcon className="h-3.5 w-3.5" />, onClick: () => setPreview(fileCtx.file) },
          { label: "Copy public link", icon: <Copy className="h-3.5 w-3.5" />, onClick: () => copyLink(fileCtx.file) },
          { label: "Add to card", icon: <Link className="h-3.5 w-3.5" />, onClick: () => setCardPicker(fileCtx.file) },
          { label: "Rename", icon: <Pencil className="h-3.5 w-3.5" />, onClick: () => { setRenamingFile(fileCtx.file.id); setRenameFileValue(fileCtx.file.filename); } },
          { label: "Move to folder", icon: <Move className="h-3.5 w-3.5" />, onClick: () => setMovePicker(fileCtx.file) },
          { label: "Delete", icon: <Trash2 className="h-3.5 w-3.5" />, onClick: () => handleDeleteFile(fileCtx.file), danger: true },
        ]} />
      )}

      {/* Overlays */}
      {preview && <FilePreview file={preview} onClose={() => setPreview(null)} />}
      {cardPicker && <CardSearchPicker fileUrl={cardPicker.file_url} filename={cardPicker.filename} fileType={cardPicker.file_type} onClose={() => setCardPicker(null)} />}
      {movePicker && <FolderPicker folders={folders} currentFolderId={movePicker.folder_id} onSelect={(fid) => handleMoveFile(movePicker, fid)} onClose={() => setMovePicker(null)} />}
    </div>
  );
}
