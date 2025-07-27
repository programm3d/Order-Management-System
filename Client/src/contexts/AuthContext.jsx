import React, { createContext, useState, useEffect } from "react";
import authService from "../services/auth.service";
import socketService from "../services/socket.service";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      authService
        .getCurrentUser()
        .then((userData) => {
          setUser(userData);
          socketService.connect(token);
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem("token", response.token);
    socketService.connect(response.token);
    return response;
  };

  const register = async (userData) => {
    const response = await authService.register(userData);
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem("token", response.token);
    socketService.connect(response.token);
    return response;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    socketService.disconnect();
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div
        className="loading-container"
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="loader"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
