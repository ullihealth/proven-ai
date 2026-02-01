import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { DirectoryTool, TrustLevel, directoryTools as initialTools } from '@/data/directoryToolsData';

interface ToolsContextValue {
  tools: DirectoryTool[];
  updateToolTrustLevel: (id: string, newLevel: TrustLevel) => Promise<DirectoryTool>;
  updateToolLastReviewed: (id: string, date: string) => Promise<DirectoryTool>;
  getToolById: (id: string) => DirectoryTool | undefined;
}

const ToolsContext = createContext<ToolsContextValue | null>(null);

// Mock persistence using localStorage
const STORAGE_KEY = 'provenai_tools_state';

function loadPersistedTools(): DirectoryTool[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const updates = JSON.parse(stored) as Record<string, Partial<DirectoryTool>>;
      // Merge stored updates with initial tools
      return initialTools.map(tool => ({
        ...tool,
        ...updates[tool.id],
      }));
    }
  } catch (e) {
    console.error('Failed to load persisted tools:', e);
  }
  return [...initialTools];
}

function persistToolUpdates(tools: DirectoryTool[]) {
  try {
    // Only store the diffs from initial state
    const updates: Record<string, Partial<DirectoryTool>> = {};
    tools.forEach(tool => {
      const initial = initialTools.find(t => t.id === tool.id);
      if (initial) {
        const diff: Partial<DirectoryTool> = {};
        if (tool.trustLevel !== initial.trustLevel) diff.trustLevel = tool.trustLevel;
        if (tool.lastReviewed !== initial.lastReviewed) diff.lastReviewed = tool.lastReviewed;
        if (Object.keys(diff).length > 0) {
          updates[tool.id] = diff;
        }
      }
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updates));
  } catch (e) {
    console.error('Failed to persist tools:', e);
  }
}

export function ToolsProvider({ children }: { children: ReactNode }) {
  const [tools, setTools] = useState<DirectoryTool[]>(() => loadPersistedTools());

  const updateToolTrustLevel = useCallback(async (id: string, newLevel: TrustLevel): Promise<DirectoryTool> => {
    return new Promise((resolve, reject) => {
      // Simulate API call delay
      setTimeout(() => {
        setTools(prevTools => {
          const toolIndex = prevTools.findIndex(t => t.id === id);
          if (toolIndex === -1) {
            reject(new Error(`Tool with id "${id}" not found`));
            return prevTools;
          }

          const updatedTool = { ...prevTools[toolIndex], trustLevel: newLevel };
          const newTools = [...prevTools];
          newTools[toolIndex] = updatedTool;
          
          // Persist to localStorage
          persistToolUpdates(newTools);
          
          resolve(updatedTool);
          return newTools;
        });
      }, 100);
    });
  }, []);

  const updateToolLastReviewed = useCallback(async (id: string, date: string): Promise<DirectoryTool> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        setTools(prevTools => {
          const toolIndex = prevTools.findIndex(t => t.id === id);
          if (toolIndex === -1) {
            reject(new Error(`Tool with id "${id}" not found`));
            return prevTools;
          }

          const updatedTool = { ...prevTools[toolIndex], lastReviewed: date };
          const newTools = [...prevTools];
          newTools[toolIndex] = updatedTool;
          
          persistToolUpdates(newTools);
          
          resolve(updatedTool);
          return newTools;
        });
      }, 100);
    });
  }, []);

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
