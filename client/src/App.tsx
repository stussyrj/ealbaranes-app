import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import DashboardPage from "@/pages/DashboardPage";
import WorkerDashboard from "@/pages/WorkerDashboard";
import UserManagement from "@/pages/admin/UserManagement";
import MessagesPage from "@/pages/MessagesPage";
import AuthPage from "@/pages/auth-page";
import RegisterPage from "@/pages/RegisterPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import LandingPage from "@/pages/LandingPage";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Loader2 } from "lucide-react";
import { Switch, Route } from "wouter";

function AdminRoutes() {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/admin/messages" component={MessagesPage} />
      <Route path="/admin/users" component={UserManagement} />
      <Route component={DashboardPage} />
    </Switch>
  );
}

function WorkerRoutes() {
  return (
    <Switch>
      <Route path="/" component={WorkerDashboard} />
      <Route component={WorkerDashboard} />
    </Switch>
  );
}

function PublicRoutes() {
  return (
    <Switch>
      <Route path="/register" component={RegisterPage} />
      <Route path="/verify-email" component={VerifyEmailPage} />
    </Switch>
  );
}

function MainLayout() {
  const { user, isLoading } = useAuth();
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/register" component={RegisterPage} />
      <Route path="/verify-email" component={VerifyEmailPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/login" component={AuthPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route>
        {!user ? (
          <LandingPage />
        ) : (
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
                  {user.role === "admin" ? <AdminRoutes /> : <WorkerRoutes />}
                </main>
              </div>
            </div>
          </SidebarProvider>
        )}
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <MainLayout />
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
