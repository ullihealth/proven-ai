-- Storage: folders and files for ProvenAI Manager

CREATE TABLE IF NOT EXISTS pm_storage_folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id TEXT,
  position INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pm_storage_files (
  id TEXT PRIMARY KEY,
  folder_id TEXT REFERENCES pm_storage_folders(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  size INTEGER DEFAULT 0,
  uploaded_by TEXT DEFAULT 'Jeff',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pm_storage_folders_parent ON pm_storage_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_pm_storage_files_folder ON pm_storage_files(folder_id);
