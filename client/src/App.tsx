import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppSidebar } from "@/components/AppSidebar";

import NotFound from "@/pages/not-found";
import DashboardPage from "@/pages/DashboardPage";
import AdminPricingPage from "@/pages/AdminPricingPage";
import AdminVehiclesPage from "@/pages/AdminVehiclesPage";
import WorkerDashboard from "@/pages/WorkerDashboard.tsx";
import WorkerSelection from "@/pages/WorkerSelection";

function Router() {
  const { user } = useAuth();
  
  if (!user) {
    return <NotFound />;
  }

  if (user.role === "admin") {
    return (
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/admin/pricing" component={AdminPricingPage} />
        <Route path="/admin/vehicles" component={AdminVehiclesPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  if (user.role === "worker") {
    // If no workerId selected yet, show selection page
    if (!user.workerId) {
      return (
        <Switch>
          <Route path="/" component={WorkerSelection} />
          <Route component={NotFound} />
        </Switch>
      );
    }
    // Otherwise show worker dashboard
    return (
      <Switch>
        <Route path="/" component={WorkerDashboard} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return <NotFound />;
}

function MainLayout() {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-4 border-b bg-background px-4">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Router />
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
