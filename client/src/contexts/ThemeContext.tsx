import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      root.classList.remove("dark");
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}
