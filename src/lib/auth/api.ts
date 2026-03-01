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

  private async fetchSessionFromApi(): Promise<AuthResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/get-session`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) return null;

      const data = this.normalizeAuthResponse(await response.json());
      return data;
    } catch {
      return null;
    }
  }

  private async attachReferralIfPresent(): Promise<void> {
    try {
      await fetch("/api/ref/attach", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // non-blocking
    }
  }

  // Get stored session from sessionStorage (tab-scoped, not accessible to other origins)
  getStoredSession(): Session | null {
    try {
      const sessionStr = sessionStorage.getItem(SESSION_KEY);
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

  // Get stored user from sessionStorage
  getStoredUser(): User | null {
    try {
      const userStr = sessionStorage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  // Store session and user in sessionStorage (clears on tab close, not accessible cross-origin)
  private storeSession(session: Session, user: User): void {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  // Clear stored session
  clearStoredSession(): void {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(USER_KEY);
  }

  getCurrentUserId(): string | null {
    return this.getStoredUser()?.id ?? null;
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<{ data?: AuthResponse; error?: AuthError }> {
    try {
      const response = await fetch(`${this.baseUrl}/sign-in/email`, {
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
      const fallback = data ?? (await this.fetchSessionFromApi());
      if (!fallback) {
        return { error: { message: "Unexpected auth response" } };
      }

      this.storeSession(fallback.session, fallback.user);
      await this.attachReferralIfPresent();
      return { data: fallback };
    } catch (error) {
      return { error: { message: "Network error. Please try again." } };
    }
  }

  // Sign up with email and password
  async signUp(email: string, password: string, name?: string): Promise<{ data?: AuthResponse; error?: AuthError }> {
    try {
      const response = await fetch(`${this.baseUrl}/sign-up/email`, {
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
      const fallback = data ?? (await this.fetchSessionFromApi());
      if (!fallback) {
        return { error: { message: "Unexpected auth response" } };
      }

      this.storeSession(fallback.session, fallback.user);
      await this.attachReferralIfPresent();
      return { data: fallback };
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
      const response = await fetch(`${this.baseUrl}/get-session`, {
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
