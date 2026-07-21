import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../api/services";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    authApi
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };
  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
