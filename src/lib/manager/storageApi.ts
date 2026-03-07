const BASE = "/api/manage/storage";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

export interface StorageFolder {
  id: string;
  name: string;
  parent_id: string | null;
  position: number;
  created_at: string;
}

export interface StorageFile {
  id: string;
  folder_id: string | null;
  filename: string;
  file_type: string;
  file_url: string;
  r2_key: string;
  size: number;
  uploaded_by: string;
  created_at: string;
}

// Folders
export const fetchFolders = () => apiFetch<{ folders: StorageFolder[] }>("/folders");

export const createFolder = (name: string, parent_id?: string | null) =>
  apiFetch<{ folder: StorageFolder }>("/folders", { method: "POST", body: JSON.stringify({ name, parent_id: parent_id ?? null }) });

export const updateFolder = (id: string, updates: { name?: string; parent_id?: string | null; position?: number }) =>
  apiFetch<{ ok: boolean }>(`/folders/${id}`, { method: "PATCH", body: JSON.stringify(updates) });

export const deleteFolder = (id: string) =>
  apiFetch<{ ok: boolean }>(`/folders/${id}`, { method: "DELETE" });

// Files
export const fetchFolderFiles = (folderId: string) =>
  apiFetch<{ files: StorageFile[] }>(`/folders/${folderId}/files`);

export const fetchAllFiles = () =>
  apiFetch<{ files: StorageFile[] }>("/files");

export const uploadStorageFile = async (folderId: string, file: File, uploadedBy = "Jeff"): Promise<{ file: StorageFile }> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("uploaded_by", uploadedBy);
  const res = await fetch(`${BASE}/folders/${folderId}/files`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
};

export const updateFile = (id: string, updates: { filename?: string; folder_id?: string | null }) =>
  apiFetch<{ ok: boolean }>(`/files/${id}`, { method: "PATCH", body: JSON.stringify(updates) });

export const deleteFile = (id: string) =>
  apiFetch<{ ok: boolean }>(`/files/${id}`, { method: "DELETE" });
