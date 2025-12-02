import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

export type UserRole = "admin" | "worker";

export interface AuthUser {
  id: string;
  username: string;
  displayName?: string | null;
  email?: string;
  role: UserRole;
  workerId?: string | null;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  login: (username: string, password: string) => void;
  logout: () => void;
  isLoginPending: boolean;
  isLogoutPending: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  const { data: serverUser, isLoading } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const user: AuthUser | null = serverUser ? {
    id: serverUser.id,
    username: serverUser.username,
    displayName: serverUser.displayName,
    role: serverUser.isAdmin ? "admin" : "worker",
    workerId: serverUser.workerId,
    isAdmin: serverUser.isAdmin ?? false,
  } : null;

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/login", { username, password });
      return await res.json();
    },
    onSuccess: (userData: User) => {
      queryClient.setQueryData(["/api/user"], userData);
      toast({
        title: "Bienvenido",
        description: `Sesión iniciada como ${userData.displayName || userData.username}`,
      });
    },
    onError: () => {
      toast({
        title: "Error de acceso",
        description: "Usuario o contraseña incorrectos",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
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

  const login = (username: string, password: string) => {
    loginMutation.mutate({ username, password });
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
        isLoginPending: loginMutation.isPending,
        isLogoutPending: logoutMutation.isPending,
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
      isLoginPending: false,
      isLogoutPending: false,
    };
  }
  return context;
}
