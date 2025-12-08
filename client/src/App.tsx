import { lazy, Suspense } from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Spinner } from "@/components/Spinner";
import { Switch, Route } from "wouter";
import LandingPage from "@/pages/LandingPage";

const AuthenticatedShell = lazy(() => import("@/components/AuthenticatedShell"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const VerifyEmailPage = lazy(() => import("@/pages/VerifyEmailPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const TermsPage = lazy(() => import("@/pages/TermsPage"));
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage"));
const BlogPage = lazy(() => import("@/pages/BlogPage"));
const BlogPostPage = lazy(() => import("@/pages/BlogPostPage"));
const AdminBlogPage = lazy(() => import("@/pages/AdminBlogPage"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

function AuthenticatedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return <LandingPage />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <AuthenticatedShell />
    </Suspense>
  );
}

function MainLayout() {
  return (
    <Switch>
      <Route path="/register">
        <Suspense fallback={<PageLoader />}>
          <RegisterPage />
        </Suspense>
      </Route>
      <Route path="/verify-email">
        <Suspense fallback={<PageLoader />}>
          <VerifyEmailPage />
        </Suspense>
      </Route>
      <Route path="/forgot-password">
        <Suspense fallback={<PageLoader />}>
          <ForgotPasswordPage />
        </Suspense>
      </Route>
      <Route path="/reset-password">
        <Suspense fallback={<PageLoader />}>
          <ResetPasswordPage />
        </Suspense>
      </Route>
      <Route path="/login">
        <Suspense fallback={<PageLoader />}>
          <AuthPage />
        </Suspense>
      </Route>
      <Route path="/terms">
        <Suspense fallback={<PageLoader />}>
          <TermsPage />
        </Suspense>
      </Route>
      <Route path="/privacy">
        <Suspense fallback={<PageLoader />}>
          <PrivacyPage />
        </Suspense>
      </Route>
      <Route path="/blog">
        <Suspense fallback={<PageLoader />}>
          <BlogPage />
        </Suspense>
      </Route>
      <Route path="/blog/:slug">
        <Suspense fallback={<PageLoader />}>
          <BlogPostPage />
        </Suspense>
      </Route>
      <Route path="/admin-blog">
        <Suspense fallback={<PageLoader />}>
          <AdminBlogPage />
        </Suspense>
      </Route>
      <Route>
        <AuthenticatedRoute />
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
