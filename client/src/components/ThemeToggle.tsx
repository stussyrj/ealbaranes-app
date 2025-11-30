import { Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  return (
    <Button variant="ghost" size="icon" data-testid="button-theme-toggle">
      <Sun className="h-5 w-5" />
    </Button>
  );
}
