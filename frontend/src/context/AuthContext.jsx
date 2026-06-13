import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    const savedToken = localStorage.getItem('token');
    return savedToken ? decodeJWT(savedToken) : null;
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      const decodedUser = decodeJWT(token);
      if (decodedUser) {
        setUser(decodedUser);
      } else {
        // Token inválido
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  const login = (newToken, userData) => {
    // userData from backend already has role, but we also decode it from token on refresh
    setToken(newToken);
    setUser(userData || decodeJWT(newToken));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
