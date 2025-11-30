import { useAuth } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "admin" | "customer";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <NotFound />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <NotFound />;
  }

  return <>{children}</>;
}
