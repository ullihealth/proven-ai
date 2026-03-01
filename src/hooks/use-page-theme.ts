import { useState, useEffect } from "react";

export type PageTheme = "light" | "dark";
const STORAGE_KEY = "provenai-page-theme";

function getInitialTheme(): PageTheme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // localStorage unavailable
  }
  return "dark";
}

// Apply synchronously on module load to avoid flash of wrong theme
const _initial = getInitialTheme();
if (_initial === "dark") {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

export function usePageTheme() {
  const [theme, setTheme] = useState<PageTheme>(getInitialTheme);

  // Sync dark class to <html> so Tailwind dark: variants activate
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => {
      const next = t === "light" ? "dark" : "light";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  };

  return { theme, toggleTheme };
}
