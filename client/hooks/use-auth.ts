import { useState, useEffect, createContext, useContext } from "react";

interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Simple hook for checking authentication without context
export const useAuthCheck = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    loading: true,
    error: null,
  });

  const checkAuth = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch("/api/auth/session", {
        credentials: "include",
      });

      const data = await response.json();

      setAuthState({
        isAuthenticated: data.authenticated || false,
        loading: false,
        error: data.authenticated ? null : data.error,
      });

      return data.authenticated || false;
    } catch (error) {
      console.error("Auth check error:", error);
      setAuthState({
        isAuthenticated: false,
        loading: false,
        error: "Failed to check authentication",
      });
      return false;
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setAuthState({
          isAuthenticated: true,
          loading: false,
          error: null,
        });
        return true;
      } else {
        setAuthState({
          isAuthenticated: false,
          loading: false,
          error: data.error || "Login failed",
        });
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      setAuthState({
        isAuthenticated: false,
        loading: false,
        error: "Network error",
      });
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setAuthState({
        isAuthenticated: false,
        loading: false,
        error: null,
      });
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return {
    ...authState,
    checkAuth,
    login,
    logout,
  };
};
