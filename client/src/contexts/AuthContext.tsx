import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type UserRole = "admin" | "worker";

export interface User {
  id: string;
  username: string;
  email?: string;
  role: UserRole;
  workerId?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const getInitialUser = (): User => {
  try {
    if (typeof window !== "undefined") {
      const saved = localStorage?.getItem("user");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to get initial user:", e);
  }
  return {
    id: "1",
    username: "Daniel",
    email: "daniel@directtransports.com",
    role: "admin",
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(() => getInitialUser());

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    sessionStorage.removeItem("hasSeenClientAnimation");
    sessionStorage.removeItem("hasSeenAdminAnimation");
    if (newUser) {
      try {
        localStorage.setItem("user", JSON.stringify(newUser));
      } catch (e) {
        console.error("Failed to save user:", e);
      }
    } else {
      try {
        localStorage.removeItem("user");
      } catch (e) {
        console.error("Failed to remove user:", e);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: false,
        setUser,
        login: () => {},
        logout: () => {},
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
    };
  }
  return context;
}
