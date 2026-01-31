// Auth API client - connects to your Cloudflare Workers backend
// Replace AUTH_API_URL with your actual endpoint when deploying

import type { AuthResponse, AuthError, Session, User } from "./types";

// This should be replaced with your actual Cloudflare Workers URL
const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || "/api/auth";

// Storage keys
const SESSION_KEY = "proven_ai_session";
const USER_KEY = "proven_ai_user";

// Mock mode for development (will be replaced by real API calls)
const MOCK_MODE = !import.meta.env.VITE_AUTH_API_URL;

// Mock admin emails for v1 (move to env var in production)
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "admin@provenai.com").split(",");

class AuthAPI {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
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

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<{ data?: AuthResponse; error?: AuthError }> {
    if (MOCK_MODE) {
      return this.mockSignIn(email, password);
    }

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

      const data: AuthResponse = await response.json();
      this.storeSession(data.session, data.user);
      return { data };
    } catch (error) {
      return { error: { message: "Network error. Please try again." } };
    }
  }

  // Sign up with email and password
  async signUp(email: string, password: string, name?: string): Promise<{ data?: AuthResponse; error?: AuthError }> {
    if (MOCK_MODE) {
      return this.mockSignUp(email, password, name);
    }

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

      const data: AuthResponse = await response.json();
      this.storeSession(data.session, data.user);
      return { data };
    } catch (error) {
      return { error: { message: "Network error. Please try again." } };
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    if (!MOCK_MODE) {
      try {
        await fetch(`${this.baseUrl}/sign-out`, {
          method: "POST",
          credentials: "include",
        });
      } catch {
        // Continue with local sign out even if API fails
      }
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

    if (MOCK_MODE) {
      return { error: { message: "No session" } };
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

      const data: AuthResponse = await response.json();
      this.storeSession(data.session, data.user);
      return { data };
    } catch {
      return { error: { message: "Network error" } };
    }
  }

  // Mock implementations for development
  private mockSignIn(email: string, password: string): Promise<{ data?: AuthResponse; error?: AuthError }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Basic validation
        if (!email || !password) {
          resolve({ error: { message: "Email and password are required" } });
          return;
        }

        if (password.length < 6) {
          resolve({ error: { message: "Invalid credentials" } });
          return;
        }

        const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase().trim());
        const user: User = {
          id: `user_${Date.now()}`,
          email: email.toLowerCase().trim(),
          name: email.split("@")[0],
          role: isAdmin ? "admin" : "member",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const session: Session = {
          user,
          token: `mock_token_${Date.now()}`,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        };

        this.storeSession(session, user);
        resolve({ data: { user, session } });
      }, 500);
    });
  }

  private mockSignUp(email: string, password: string, name?: string): Promise<{ data?: AuthResponse; error?: AuthError }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Basic validation
        if (!email || !password) {
          resolve({ error: { message: "Email and password are required" } });
          return;
        }

        if (password.length < 6) {
          resolve({ error: { message: "Password must be at least 6 characters" } });
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          resolve({ error: { message: "Please enter a valid email address" } });
          return;
        }

        const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase().trim());
        const user: User = {
          id: `user_${Date.now()}`,
          email: email.toLowerCase().trim(),
          name: name || email.split("@")[0],
          role: isAdmin ? "admin" : "member",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const session: Session = {
          user,
          token: `mock_token_${Date.now()}`,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };

        this.storeSession(session, user);
        resolve({ data: { user, session } });
      }, 500);
    });
  }
}

export const authAPI = new AuthAPI(AUTH_API_URL);
