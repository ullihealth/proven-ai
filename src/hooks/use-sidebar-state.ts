import { useState, useEffect, useCallback, useRef } from "react";

const SIDEBAR_GROUP_STATE_KEY = "sidebarGroupState";
const USER_COLLAPSED_KEY = "sidebarUserCollapsed";

interface SidebarGroupState {
  [key: string]: boolean;
}

// Groups that should never auto-expand on navigation
const NEVER_AUTO_EXPAND = ["Start Here"];

const defaultState: SidebarGroupState = {
  "Control Centre": false,
  "Start Here": false,
  "AI Glossary": false,
  "Core Tools": false,
  "Tools Directory": false,
  "Daily Flow": false,
  "Learn": false,
  "Go Deeper": false,
  "Support": false,
  "Admin Console": false,
};

function loadState(): SidebarGroupState {
  // Always start with all groups collapsed on page load
  return { ...defaultState };
}

function saveState(state: SidebarGroupState) {
  try {
    localStorage.setItem(SIDEBAR_GROUP_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

// Track which groups user has explicitly collapsed while active
function loadUserCollapsed(): Set<string> {
  try {
    const stored = localStorage.getItem(USER_COLLAPSED_KEY);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch {
    // Ignore parse errors
  }
  return new Set();
}

function saveUserCollapsed(collapsed: Set<string>) {
  try {
    localStorage.setItem(USER_COLLAPSED_KEY, JSON.stringify([...collapsed]));
  } catch {
    // Ignore storage errors
  }
}

export function useSidebarGroupState(isAdmin: boolean) {
  const [groupState, setGroupState] = useState<SidebarGroupState>(loadState);
  const [userCollapsed, setUserCollapsed] = useState<Set<string>>(loadUserCollapsed);
  const prevActiveGroups = useRef<Set<string>>(new Set());

  // Sync to localStorage on changes
  useEffect(() => {
    const stateToSave = { ...groupState };
    // Don't persist admin state for non-admins
    if (!isAdmin) {
      delete stateToSave["Admin Console"];
    }
    saveState(stateToSave);
  }, [groupState, isAdmin]);

  // Sync user collapsed state to localStorage
  useEffect(() => {
    saveUserCollapsed(userCollapsed);
  }, [userCollapsed]);

  const isGroupOpen = useCallback(
    (label: string, isGroupActive: boolean): boolean => {
      // Never auto-expand certain groups (like "Start Here")
      if (NEVER_AUTO_EXPAND.includes(label)) {
        return groupState[label] ?? defaultState[label] ?? false;
      }
      
      // If user explicitly collapsed this group while active, respect that
      if (userCollapsed.has(label)) {
        return groupState[label] ?? false;
      }
      
      // Auto-expand if navigating into the group
      if (isGroupActive) {
        return true;
      }
      
      // Otherwise use stored state
      return groupState[label] ?? defaultState[label] ?? false;
    },
    [groupState, userCollapsed]
  );

  const toggleGroup = useCallback((label: string, isCurrentlyActive?: boolean) => {
    setGroupState((prev) => {
      const newState = !prev[label];
      
      // If collapsing an active group, mark it as user-collapsed
      if (!newState && isCurrentlyActive) {
        setUserCollapsed((prevCollapsed) => new Set([...prevCollapsed, label]));
      } else if (newState) {
        // If expanding, remove from user-collapsed
        setUserCollapsed((prevCollapsed) => {
          const next = new Set(prevCollapsed);
          next.delete(label);
          return next;
        });
      }
      
      return {
        ...prev,
        [label]: newState,
      };
    });
  }, []);

  const setGroupOpen = useCallback((label: string, open: boolean) => {
    setGroupState((prev) => ({
      ...prev,
      [label]: open,
    }));
    
    // Clear user-collapsed if opening
    if (open) {
      setUserCollapsed((prevCollapsed) => {
        const next = new Set(prevCollapsed);
        next.delete(label);
        return next;
      });
    }
  }, []);

  // Clear user-collapsed state when navigating away from a group
  const clearUserCollapsedForInactiveGroups = useCallback((activeGroups: string[]) => {
    const activeSet = new Set(activeGroups);
    setUserCollapsed((prev) => {
      const next = new Set<string>();
      prev.forEach((label) => {
        // Only keep collapsed state for groups that are still active
        if (activeSet.has(label)) {
          next.add(label);
        }
      });
      return next.size !== prev.size ? next : prev;
    });
  }, []);

  return { isGroupOpen, toggleGroup, setGroupOpen, clearUserCollapsedForInactiveGroups };
}
