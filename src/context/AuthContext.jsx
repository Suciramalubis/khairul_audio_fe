// Lokasi: src/context/AuthContext.jsx

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Pastikan Backend Laravel berjalan
const API_URL = "/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const navigate = useNavigate();

  // 1. STATE USER
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  // 2. STATE TOKEN
  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });

  // 3. SETUP HEADER & LOCAL STORAGE OTOMATIS
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("token", token);
    } else {
      delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem("token");
    }

    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [token, user]);

  // 4. LOGIN
  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/login`, {
        email,
        password,
      });

      setUser(res.data.user);
      setToken(res.data.access_token);

      return res.data.user; 
    } catch (err) {
      throw new Error(
        err.response?.data?.message || "Login gagal, periksa email dan password Anda"
      );
    }
  };

  // 5. REGISTER (DIPERBAIKI)
  const register = async (name, email, password, password_confirmation) => {
    try {
      // FIX 1: Hapus 'const res =' karena response-nya tidak kita pakai disini
      await axios.post(`${API_URL}/register`, {
        name,
        email,
        password,
        password_confirmation,
      });

      navigate("/login"); 
    } catch (err) {
      throw new Error(
        err.response?.data?.message || "Registrasi gagal"
      );
    }
  };

  // 6. LOGOUT (DIPERBAIKI)
  const logout = async () => {
    try {
        if (token) {
            await axios.post(`${API_URL}/logout`);
        }
    } catch (error) { 
        // FIX 2: Gunakan variabel 'error' agar tidak dianggap unused
        console.error("Logout server error:", error);
    }

    setUser(null);
    setToken(null);
    localStorage.clear();
    
    navigate("/login");
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
