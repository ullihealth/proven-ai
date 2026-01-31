import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { AuthContextValue, AuthState, User, Session } from "./types";
import { authAPI } from "./api";

const initialState: AuthState = {
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,
  isMember: false,
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);

  // Update state helper
  const updateState = useCallback((user: User | null, session: Session | null, isLoading = false) => {
    setState({
      user,
      session,
      isLoading,
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin",
      isMember: user?.role === "member" || user?.role === "admin",
    });
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const { data } = await authAPI.refreshSession();
      if (data) {
        updateState(data.user, data.session, false);
      } else {
        updateState(null, null, false);
      }
    };

    initAuth();
  }, [updateState]);

  // Sign in
  const signIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    const { data, error } = await authAPI.signIn(email, password);
    
    if (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      return { error: error.message };
    }

    if (data) {
      updateState(data.user, data.session, false);
    }

    return {};
  }, [updateState]);

  // Sign up
  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    const { data, error } = await authAPI.signUp(email, password, name);
    
    if (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      return { error: error.message };
    }

    if (data) {
      updateState(data.user, data.session, false);
    }

    return {};
  }, [updateState]);

  // Sign out
  const signOut = useCallback(async () => {
    await authAPI.signOut();
    updateState(null, null, false);
  }, [updateState]);

  // Refresh session
  const refreshSession = useCallback(async () => {
    const { data } = await authAPI.refreshSession();
    if (data) {
      updateState(data.user, data.session, false);
    } else {
      updateState(null, null, false);
    }
  }, [updateState]);

  const value: AuthContextValue = {
    ...state,
    signIn,
    signUp,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Convenience hooks
export function useUser() {
  const { user } = useAuth();
  return user;
}

export function useIsAdmin() {
  const { isAdmin } = useAuth();
  return isAdmin;
}

export function useIsMember() {
  const { isMember } = useAuth();
  return isMember;
}
