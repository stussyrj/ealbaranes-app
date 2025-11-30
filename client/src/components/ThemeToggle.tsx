import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle() {
  try {
    const { theme, toggleTheme } = useTheme();
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        data-testid="button-theme-toggle"
      >
        {theme === "light" ? (
          <Moon className="h-5 w-5" />
        ) : (
          <Sun className="h-5 w-5" />
        )}
      </Button>
    );
  } catch (e) {
    console.warn("ThemeToggle error:", e);
    return (
      <Button variant="ghost" size="icon" data-testid="button-theme-toggle">
        <Sun className="h-5 w-5" />
      </Button>
    );
  }
}
