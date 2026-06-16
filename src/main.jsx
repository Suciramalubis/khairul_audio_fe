// Lokasi: src/main.jsx

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import { CartProvider } from "./context/CartContext"; // ✅ FIX
import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter } from "react-router-dom";

const GOOGLE_CLIENT_ID = "MASUKKAN_CLIENT_ID_ANDA_DISINI";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
  </React.StrictMode>
);
