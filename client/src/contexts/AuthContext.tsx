import { createContext, useContext, useState, type ReactNode } from "react";

type UserRole = "admin" | "customer";

interface User {
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>({
    id: "1",
    username: "Carlos Admin",
    email: "carlos@transporte.com",
    role: "admin",
  });

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
