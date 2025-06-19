// src/common/context/AuthContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, UserCredential } from "firebase/auth";
import {
  listenAuth,
  login as fbLogin,
  logout as fbLogout,
} from "../services/firebase";

interface AuthCtx {
  user: User | null;
  /** log-in zwraca UserCredential */
  login: (e: string, p: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthCtx | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ↙ aktualizuj stan przy każdej zmianie auth
  useEffect(
    () =>
      listenAuth((u) => {
        setUser(u);
        setLoading(false);
      }),
    []
  );

  /** aliasy – żeby nie wyciekały szczegóły Firebase */
  const login = (e: string, p: string) => fbLogin(e, p);
  const logout = () => fbLogout();

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
