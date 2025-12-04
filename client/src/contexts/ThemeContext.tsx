import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Theme = "light" | "spooky";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme") as Theme | null;
      if (stored === "light" || stored === "spooky") return stored;
      // Migrate old 'dark' theme to 'spooky'
      if (stored === "dark") return "spooky";
    }
    // Spooky theme is default
    return "spooky";
  });

  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (theme === "spooky") {
        root.classList.add("spooky");
      } else {
        root.classList.remove("spooky");
      }
      try {
        localStorage.setItem("theme", theme);
      } catch (e) {
        console.error("Failed to save theme:", e);
      }
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "spooky" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  return context || { theme: "spooky" as Theme, toggleTheme: () => {} };
}
