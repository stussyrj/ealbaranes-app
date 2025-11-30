import { createContext, useContext, useState, type ReactNode } from "react";

interface User {
  id: string;
  username: string;
  email?: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEFAULT_USER: User = {
  id: "1",
  username: "Carlos Admin",
  email: "carlos@transporte.com",
  isAdmin: true,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user] = useState<User | null>(DEFAULT_USER);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: false,
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
      user: DEFAULT_USER,
      isLoading: false,
      login: () => {},
      logout: () => {},
    };
  }
  return context;
}
