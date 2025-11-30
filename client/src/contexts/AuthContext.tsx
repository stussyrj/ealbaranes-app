import { createContext, useContext, useState, type ReactNode } from "react";

interface User {
  id: string;
  username: string;
  email?: string;
  isAdmin: boolean;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_USER: User = {
  id: "1",
  username: "Carlos Admin",
  email: "carlos@transporte.com",
  isAdmin: true,
  profileImage: undefined,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user] = useState<User | null>(DEFAULT_USER);
  const [isLoading] = useState(false);

  const login = () => {
    // todo: remove mock functionality - implement actual login
  };

  const logout = () => {
    // todo: remove mock functionality - implement actual logout
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: DEFAULT_USER,
      isLoading: false,
      login: () => {},
      logout: () => {},
    };
  }
  return context;
}
