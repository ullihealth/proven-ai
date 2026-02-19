import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { DirectoryTool, TrustLevel, directoryTools as initialTools } from '@/data/directoryToolsData';

interface ToolsContextValue {
  tools: DirectoryTool[];
  updateToolTrustLevel: (id: string, newLevel: TrustLevel) => Promise<DirectoryTool>;
  updateToolLastReviewed: (id: string, date: string) => Promise<DirectoryTool>;
  getToolById: (id: string) => DirectoryTool | undefined;
}

const ToolsContext = createContext<ToolsContextValue | null>(null);

// D1-backed via app_visual_config key-value
const CONFIG_KEY = 'tool_trust_overrides';

// ---- In-memory cache (module-level so load can happen before React mounts) ----
let overridesCache: Record<string, Partial<DirectoryTool>> = {};
let cacheLoaded = false;

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

function mergeOverrides(): DirectoryTool[] {
  return initialTools.map(tool => ({
    ...tool,
    ...overridesCache[tool.id],
  }));
}

async function persistOverrides(updates: Record<string, Partial<DirectoryTool>>): Promise<void> {
  overridesCache = updates;
  try {
    await fetch('/api/admin/visual-config', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: CONFIG_KEY, value: updates }),
    });
  } catch (err) {
    console.error('[toolTrustOverrides] save failed:', err);
  }
}

export function ToolsProvider({ children }: { children: ReactNode }) {
  const [tools, setTools] = useState<DirectoryTool[]>(() => mergeOverrides());

  // Re-merge if cache was loaded after initial render
  useEffect(() => {
    setTools(mergeOverrides());
  }, []);

  const updateToolTrustLevel = useCallback(async (id: string, newLevel: TrustLevel): Promise<DirectoryTool> => {
    const toolIndex = tools.findIndex(t => t.id === id);
    if (toolIndex === -1) throw new Error(`Tool with id "${id}" not found`);

    const updatedTool = { ...tools[toolIndex], trustLevel: newLevel };
    const newTools = [...tools];
    newTools[toolIndex] = updatedTool;
    setTools(newTools);

    // Build diffs from initial
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
    return updatedTool;
  }, [tools]);

  const updateToolLastReviewed = useCallback(async (id: string, date: string): Promise<DirectoryTool> => {
    const toolIndex = tools.findIndex(t => t.id === id);
    if (toolIndex === -1) throw new Error(`Tool with id "${id}" not found`);

    const updatedTool = { ...tools[toolIndex], lastReviewed: date };
    const newTools = [...tools];
    newTools[toolIndex] = updatedTool;
    setTools(newTools);

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
    return updatedTool;
  }, [tools]);

  const getToolById = useCallback((id: string): DirectoryTool | undefined => {
    return tools.find(t => t.id === id);
  }, [tools]);

  return (
    <ToolsContext.Provider value={{ tools, updateToolTrustLevel, updateToolLastReviewed, getToolById }}>
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
