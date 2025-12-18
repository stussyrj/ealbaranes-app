import { createContext, useContext, useState, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn, setAuthToken, clearAuthToken } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export type UserRole = "admin" | "worker";

export interface SubscriptionInfo {
  status: string;
  isInGrace?: boolean;
  isReadOnly?: boolean;
}

interface ServerUser {
  id: string;
  username: string;
  displayName?: string | null;
  email?: string | null;
  isAdmin?: boolean;
  workerId?: string | null;
  tenantId?: string | null;
  createdAt?: string;
  subscription?: SubscriptionInfo | null;
  hasCompletedOnboarding?: boolean;
  setupRequired?: boolean;
  token?: string;
}

export interface AuthUser {
  id: string;
  username: string;
  displayName?: string | null;
  email?: string | null;
  role: UserRole;
  workerId?: string | null;
  isAdmin?: boolean;
  subscription?: SubscriptionInfo;
  hasCompletedOnboarding?: boolean;
  setupRequired?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  login: (username: string, password: string, userType?: "company" | "worker") => void;
  logout: () => void;
  refetchUser: () => Promise<void>;
  isLoginPending: boolean;
  isLogoutPending: boolean;
  loginError: { code?: string; message: string } | null;
  clearLoginError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [loginError, setLoginError] = useState<{ code?: string; message: string } | null>(null);

  const { data: serverUser, isLoading, refetch } = useQuery<ServerUser | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const refetchUser = async () => {
    await refetch();
  };

  const clearLoginError = () => {
    setLoginError(null);
  };

  const user: AuthUser | null = serverUser ? {
    id: serverUser.id,
    username: serverUser.username,
    displayName: serverUser.displayName,
    email: serverUser.email,
    role: serverUser.isAdmin ? "admin" : "worker",
    workerId: serverUser.workerId,
    isAdmin: serverUser.isAdmin ?? false,
    subscription: serverUser.subscription ? {
      status: serverUser.subscription.status,
      isInGrace: serverUser.subscription.isInGrace,
      isReadOnly: serverUser.subscription.isReadOnly,
    } : undefined,
    hasCompletedOnboarding: serverUser.hasCompletedOnboarding ?? false,
    setupRequired: serverUser.setupRequired ?? false,
  } : null;

  const loginMutation = useMutation({
    mutationFn: async ({ username, password, userType = "company" }: { username: string; password: string; userType?: "company" | "worker" }) => {
      const endpoint = userType === "worker" ? "/api/worker-login" : "/api/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        throw data;
      }
      return data;
    },
    onSuccess: (userData: ServerUser) => {
      setLoginError(null);
      
      if (userData.token) {
        setAuthToken(userData.token);
      }
      
      queryClient.setQueryData(["/api/user"], userData);
      
      console.log("User logged in, refetching data...");
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      const errorCode = error?.code;
      const errorMessage = error?.error || "Usuario o contraseña incorrectos";
      
      setLoginError({ code: errorCode, message: errorMessage });
      
      if (errorCode !== "EMAIL_NOT_VERIFIED") {
        toast({
          title: "Error de acceso",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      clearAuthToken();
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
    },
  });

  const setUser = (newUser: AuthUser | null) => {
    if (newUser) {
      queryClient.setQueryData(["/api/user"], newUser);
    } else {
      logoutMutation.mutate();
    }
  };

  const login = (username: string, password: string, userType: "company" | "worker" = "company") => {
    loginMutation.mutate({ username, password, userType });
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        setUser,
        login,
        logout,
        refetchUser,
        isLoginPending: loginMutation.isPending,
        isLogoutPending: logoutMutation.isPending,
        loginError,
        clearLoginError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      isLoading: false,
      setUser: () => {},
      login: () => {},
      logout: () => {},
      refetchUser: async () => {},
      isLoginPending: false,
      isLogoutPending: false,
      loginError: null,
      clearLoginError: () => {},
    };
  }
  return context;
}
