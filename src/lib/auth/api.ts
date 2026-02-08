// Auth API client - connects to BetterAuth running on Cloudflare Pages/Workers

import type { AuthResponse, AuthError, Session, User } from "./types";

const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || "/api/auth";

// Storage keys
const SESSION_KEY = "proven_ai_session";
const USER_KEY = "proven_ai_user";

class AuthAPI {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private normalizeAuthResponse(payload: unknown): AuthResponse | null {
    if (!payload || typeof payload !== "object") return null;

    const raw = payload as { data?: AuthResponse } & AuthResponse;
    const response = raw.data ?? raw;

    if (!response.user || !response.session) return null;
    return response;
  }

  // Get stored session from localStorage
  getStoredSession(): Session | null {
    try {
      const sessionStr = localStorage.getItem(SESSION_KEY);
      if (!sessionStr) return null;
      
      const session: Session = JSON.parse(sessionStr);
      
      // Check if session is expired
      if (new Date(session.expiresAt) < new Date()) {
        this.clearStoredSession();
        return null;
      }
      
      return session;
    } catch {
      return null;
    }
  }

  // Get stored user from localStorage
  getStoredUser(): User | null {
    try {
      const userStr = localStorage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  // Store session and user
  private storeSession(session: Session, user: User): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  // Clear stored session
  clearStoredSession(): void {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(USER_KEY);
  }

  getCurrentUserId(): string | null {
    return this.getStoredUser()?.id ?? null;
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<{ data?: AuthResponse; error?: AuthError }> {
    try {
      const response = await fetch(`${this.baseUrl}/sign-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        return { error: { message: error.message || "Sign in failed" } };
      }

      const data = this.normalizeAuthResponse(await response.json());
      if (!data) {
        return { error: { message: "Unexpected auth response" } };
      }

      this.storeSession(data.session, data.user);
      return { data };
    } catch (error) {
      return { error: { message: "Network error. Please try again." } };
    }
  }

  // Sign up with email and password
  async signUp(email: string, password: string, name?: string): Promise<{ data?: AuthResponse; error?: AuthError }> {
    try {
      const response = await fetch(`${this.baseUrl}/sign-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        return { error: { message: error.message || "Sign up failed" } };
      }

      const data = this.normalizeAuthResponse(await response.json());
      if (!data) {
        return { error: { message: "Unexpected auth response" } };
      }

      this.storeSession(data.session, data.user);
      return { data };
    } catch (error) {
      return { error: { message: "Network error. Please try again." } };
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/sign-out`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Continue with local sign out even if API fails
    }
    
    this.clearStoredSession();
  }

  // Refresh session
  async refreshSession(): Promise<{ data?: AuthResponse; error?: AuthError }> {
    const storedSession = this.getStoredSession();
    const storedUser = this.getStoredUser();
    
    if (storedSession && storedUser) {
      return { data: { session: storedSession, user: storedUser } };
    }

    try {
      const response = await fetch(`${this.baseUrl}/session`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        this.clearStoredSession();
        return { error: { message: "Session expired" } };
      }

      const data = this.normalizeAuthResponse(await response.json());
      if (!data) {
        return { error: { message: "Unexpected auth response" } };
      }

      this.storeSession(data.session, data.user);
      return { data };
    } catch {
      return { error: { message: "Network error" } };
    }
  }

  // Keep a minimal client-side cache for synchronous access
}

export const authAPI = new AuthAPI(AUTH_API_URL);
