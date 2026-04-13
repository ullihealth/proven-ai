import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { DirectoryTool, TrustLevel, directoryTools as initialTools } from '@/data/directoryToolsData';

const staticIds = new Set(initialTools.map(t => t.id));

interface ToolsContextValue {
  tools: DirectoryTool[];
  updateToolTrustLevel: (id: string, newLevel: TrustLevel) => Promise<DirectoryTool>;
  updateToolLastReviewed: (id: string, date: string) => Promise<DirectoryTool>;
  getToolById: (id: string) => DirectoryTool | undefined;
  addTool: (tool: DirectoryTool) => void;
}

const ToolsContext = createContext<ToolsContextValue | null>(null);

// D1-backed via app_visual_config key-value
const CONFIG_KEY = 'tool_trust_overrides';

// ---- In-memory cache (module-level so load can happen before React mounts) ----
let overridesCache: Record<string, Partial<DirectoryTool>> = {};
let cacheLoaded = false;

// ---- D1-added tools cache ------------------------------------------------
let d1ToolsCache: DirectoryTool[] = [];
let d1CacheLoaded = false;

/** Load D1-added tools — fetched once on app init */
export async function loadD1Tools(): Promise<void> {
  if (d1CacheLoaded) return;
  try {
    const res = await fetch('/api/tools');
    if (res.ok) {
      const json = (await res.json()) as { success: boolean; tools?: DirectoryTool[] };
      if (json.success && Array.isArray(json.tools)) {
        d1ToolsCache = json.tools;
      }
    }
  } catch (err) {
    console.error('[d1Tools] load failed:', err);
  }
  d1CacheLoaded = true;
}

/** Load from D1 — call once on app init */
export async function loadToolTrustOverrides(): Promise<void> {
  if (cacheLoaded) return;
  try {
    const res = await fetch(`/api/visual-config?key=${CONFIG_KEY}`);
    if (res.ok) {
      const json = (await res.json()) as { ok: boolean; value: Record<string, Partial<DirectoryTool>> | null };
      if (json.ok && json.value && typeof json.value === 'object') {
        overridesCache = json.value;
      }
    }
  } catch (err) {
    console.error('[toolTrustOverrides] load failed:', err);
  }
  cacheLoaded = true;
}

function mergeAll(): DirectoryTool[] {
  const staticWithOverrides = initialTools.map(tool => ({
    ...tool,
    ...overridesCache[tool.id],
  }));
  // Append D1 tools that don't clash with static IDs
  const d1Only = d1ToolsCache.filter(t => !staticIds.has(t.id));
  return [...staticWithOverrides, ...d1Only];
}

/** @deprecated use mergeAll — kept so existing call sites compile */
function mergeOverrides(): DirectoryTool[] {
  return mergeAll();
}

async function persistOverrides(updates: Record<string, Partial<DirectoryTool>>): Promise<void> {
  const prev = overridesCache;
  overridesCache = updates;
  try {
    const res = await fetch('/api/admin/visual-config', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: CONFIG_KEY, value: updates }),
    });
    if (!res.ok) {
      console.error('[toolTrustOverrides] save rejected:', res.status);
      overridesCache = prev;
    }
  } catch (err) {
    console.error('[toolTrustOverrides] save failed:', err);
    overridesCache = prev;
  }
}

export function ToolsProvider({ children }: { children: ReactNode }) {
  const [tools, setTools] = useState<DirectoryTool[]>(() => mergeAll());

  // Re-merge once both caches are loaded (trust overrides + D1 tools)
  useEffect(() => {
    loadD1Tools().then(() => setTools(mergeAll()));
  }, []);

  // Also re-merge if trust overrides cache was loaded after initial render
  useEffect(() => {
    setTools(mergeAll());
  }, []);

  const updateToolTrustLevel = useCallback(async (id: string, newLevel: TrustLevel): Promise<DirectoryTool> => {
    const toolIndex = tools.findIndex(t => t.id === id);
    if (toolIndex === -1) throw new Error(`Tool with id "${id}" not found`);

    const updatedTool = { ...tools[toolIndex], trustLevel: newLevel };
    const newTools = [...tools];
    newTools[toolIndex] = updatedTool;
    setTools(newTools);

    if (staticIds.has(id)) {
      // Static tool — persist via visual_config override
      const updates: Record<string, Partial<DirectoryTool>> = {};
      newTools.forEach(tool => {
        const initial = initialTools.find(t => t.id === tool.id);
        if (initial) {
          const diff: Partial<DirectoryTool> = {};
          if (tool.trustLevel !== initial.trustLevel) diff.trustLevel = tool.trustLevel;
          if (tool.lastReviewed !== initial.lastReviewed) diff.lastReviewed = tool.lastReviewed;
          if (Object.keys(diff).length > 0) updates[tool.id] = diff;
        }
      });
      await persistOverrides(updates);
    } else {
      // D1-added tool — PATCH directly
      await fetch(`/api/admin/tools/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trustLevel: newLevel }),
      });
      // Keep d1ToolsCache in sync
      const idx = d1ToolsCache.findIndex(t => t.id === id);
      if (idx !== -1) d1ToolsCache[idx] = { ...d1ToolsCache[idx], trustLevel: newLevel };
    }

    return updatedTool;
  }, [tools]);

  const updateToolLastReviewed = useCallback(async (id: string, date: string): Promise<DirectoryTool> => {
    const toolIndex = tools.findIndex(t => t.id === id);
    if (toolIndex === -1) throw new Error(`Tool with id "${id}" not found`);

    const updatedTool = { ...tools[toolIndex], lastReviewed: date };
    const newTools = [...tools];
    newTools[toolIndex] = updatedTool;
    setTools(newTools);

    if (staticIds.has(id)) {
      const updates: Record<string, Partial<DirectoryTool>> = {};
      newTools.forEach(tool => {
        const initial = initialTools.find(t => t.id === tool.id);
        if (initial) {
          const diff: Partial<DirectoryTool> = {};
          if (tool.trustLevel !== initial.trustLevel) diff.trustLevel = tool.trustLevel;
          if (tool.lastReviewed !== initial.lastReviewed) diff.lastReviewed = tool.lastReviewed;
          if (Object.keys(diff).length > 0) updates[tool.id] = diff;
        }
      });
      await persistOverrides(updates);
    } else {
      await fetch(`/api/admin/tools/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastReviewed: date }),
      });
      const idx = d1ToolsCache.findIndex(t => t.id === id);
      if (idx !== -1) d1ToolsCache[idx] = { ...d1ToolsCache[idx], lastReviewed: date };
    }

    return updatedTool;
  }, [tools]);

  const getToolById = useCallback((id: string): DirectoryTool | undefined => {
    return tools.find(t => t.id === id);
  }, [tools]);

  /** Optimistically append a newly-saved D1 tool to the live list */
  const addTool = useCallback((tool: DirectoryTool) => {
    if (!staticIds.has(tool.id)) {
      d1ToolsCache = [...d1ToolsCache.filter(t => t.id !== tool.id), tool];
    }
    setTools(prev => {
      if (prev.some(t => t.id === tool.id)) return prev;
      return [...prev, tool];
    });
  }, []);

  return (
    <ToolsContext.Provider value={{ tools, updateToolTrustLevel, updateToolLastReviewed, getToolById, addTool }}>
      {children}
    </ToolsContext.Provider>
  );
}

export function useTools() {
  const context = useContext(ToolsContext);
  if (!context) {
    throw new Error('useTools must be used within a ToolsProvider');
  }
  return context;
}

export function useToolById(id: string) {
  const { getToolById } = useTools();
  return getToolById(id);
}
