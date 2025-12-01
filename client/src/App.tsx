import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import DashboardPage from "@/pages/DashboardPage";
import WorkerDashboard from "@/pages/WorkerDashboard";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";

function MainLayout() {
  const { user } = useAuth();
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (!user) {
    return <div className="p-8">Cargando...</div>;
  }

  const currentPage = user.role === "admin" ? <DashboardPage /> : <WorkerDashboard />;

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="sticky top-0 z-50 flex h-12 sm:h-14 items-center justify-between gap-2 sm:gap-4 border-b bg-background px-2 sm:px-4">
            <SidebarTrigger data-testid="button-sidebar-toggle" className="h-8 w-8 sm:h-10 sm:w-10" />
            <div className="flex items-center gap-1 sm:gap-2">
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto pb-4 sm:pb-6">
            {currentPage}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppContent() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MainLayout />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
