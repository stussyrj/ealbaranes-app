import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type UserRole = "admin" | "customer";

export interface User {
  id: string;
  username: string;
  email?: string;
  role: UserRole;
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
  // Try to get saved user from localStorage
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved user:", e);
      }
    }
  }
  // Default to customer
  return {
    id: "2",
    username: "Cliente Demo",
    email: "cliente@demo.com",
    role: "customer",
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize user from localStorage on mount
  useEffect(() => {
    const initialUser = getInitialUser();
    setUserState(initialUser);
    setIsInitialized(true);
  }, []);

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
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

  if (!isInitialized) {
    return null;
  }

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
