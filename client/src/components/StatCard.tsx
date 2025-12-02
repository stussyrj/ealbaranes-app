import { Card, CardContent } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({ title, value, subtitle, icon: Icon, trend }: StatCardProps) {
  return (
    <button className="group relative overflow-hidden rounded-md border border-muted-foreground/10 bg-slate-50 dark:bg-slate-900/30 p-3 sm:p-4 text-left transition-all hover-elevate shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="text-base sm:text-lg md:text-xl font-bold mt-1" data-testid={`stat-${String(title || "").toLowerCase().replace(/\s/g, "-")}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && (
            <p className={`text-xs font-medium mt-1 ${trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {trend.isPositive ? "+" : ""}{trend.value}% vs mes anterior
            </p>
          )}
        </div>
        <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-blue-500 opacity-70" />
        </div>
      </div>
    </button>
  );
}
