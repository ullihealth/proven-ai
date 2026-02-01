import { useState, useEffect, useCallback } from "react";

const SIDEBAR_GROUP_STATE_KEY = "sidebarGroupState";

interface SidebarGroupState {
  [key: string]: boolean;
}

const defaultState: SidebarGroupState = {
  "Start Here": true,
  "AI Glossary": true,
  "Core Tools": true,
  "Tools Directory": false,
  "Daily Flow": false,
  "Learn": false,
  "Go Deeper": false,
  "Support": false,
  "Admin Console": false,
};

function loadState(): SidebarGroupState {
  try {
    const stored = localStorage.getItem(SIDEBAR_GROUP_STATE_KEY);
    if (stored) {
      return { ...defaultState, ...JSON.parse(stored) };
    }
  } catch {
    // Ignore parse errors
  }
  return defaultState;
}

function saveState(state: SidebarGroupState) {
  try {
    localStorage.setItem(SIDEBAR_GROUP_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

export function useSidebarGroupState(isAdmin: boolean) {
  const [groupState, setGroupState] = useState<SidebarGroupState>(loadState);

  // Sync to localStorage on changes
  useEffect(() => {
    const stateToSave = { ...groupState };
    // Don't persist admin state for non-admins
    if (!isAdmin) {
      delete stateToSave["Admin Console"];
    }
    saveState(stateToSave);
  }, [groupState, isAdmin]);

  const isGroupOpen = useCallback(
    (label: string, isGroupActive: boolean): boolean => {
      // Auto-expand if navigating into the group
      if (isGroupActive) {
        return true;
      }
      // Otherwise use stored state
      return groupState[label] ?? defaultState[label] ?? false;
    },
    [groupState]
  );

  const toggleGroup = useCallback((label: string) => {
    setGroupState((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  }, []);

  const setGroupOpen = useCallback((label: string, open: boolean) => {
    setGroupState((prev) => ({
      ...prev,
      [label]: open,
    }));
  }, []);

  return { isGroupOpen, toggleGroup, setGroupOpen };
}
