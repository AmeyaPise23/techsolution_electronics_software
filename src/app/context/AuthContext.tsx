import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authService, User, LoginRequest, CompanyRegistrationRequest, CompanyRegistrationResponse } from "../services/authService";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  registerCompany: (request: CompanyRegistrationRequest) => Promise<CompanyRegistrationResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      if (authService.isAuthenticated()) {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginRequest) => {
    const response = await authService.login(credentials);
    setUser({
      username: response.username,
      role: response.role,
      companyId: response.companyId,
      companyName: response.companyName,
      companyCode: response.companyCode,
    });
  };

  const registerCompany = async (request: CompanyRegistrationRequest) => {
    const response = await authService.registerCompany(request);
    setUser({
      username: response.username,
      role: response.role,
      companyId: response.companyId,
      companyName: response.companyName,
      companyCode: response.companyCode,
    });
    return response;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    registerCompany,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
