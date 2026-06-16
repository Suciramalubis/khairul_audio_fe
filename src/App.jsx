// Lokasi: src/App.jsx

import React from "react";
import { Routes, Route } from "react-router-dom";

// --- PAGES USER ---
import HomePage from "./pages/HomePage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import AboutPage from "./pages/AboutPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotificationPage from "./pages/NotificationPage"; // Halaman Notifikasi User
import EditProfilePage from "./pages/EditProfilePage"; 
import MyOrdersPage from "./pages/MyOrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import WishlistPage from './pages/WishlistPage';
import ProductsPage from './pages/ProductsPage';
import PaymentPage from './pages/PaymentPage'; // ✅ <--- IMPORT HALAMAN PAYMENT BARU
import OrderReviewPage from "./pages/OrderReviewPage";
import VerifyOtpPage from './pages/VerifyOtpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

// --- PAGES ADMIN ---
import AdminLoginPage from './pages/AdminLoginPage';
import AdminLayout from "./components/AdminLayout"; 
import DashboardAdmin from "./pages/admin/DashboardAdmin"; 
import AdminRoute from "./routes/AdminRoute"; 
import ProductListAdmin from "./pages/admin/ProductListAdmin";
import ProductFormAdmin from "./pages/admin/ProductFormAdmin";
import ProductEditAdmin from "./pages/admin/ProductEditAdmin"; 
import OrderListAdmin from "./pages/admin/OrderListAdmin";
import OrderDetailAdmin from "./pages/admin/OrderDetailAdmin";
import NotificationAdmin from "./pages/admin/NotificationAdmin"; // Halaman Notifikasi Admin
import ProfileAdmin from "./pages/admin/ProfileAdmin";
import SettingsAdmin from "./pages/admin/SettingsAdmin"; 

// --- COMPONENTS & UTILS ---
import ProtectedRoute from "./routes/ProtectedRoute"; 

function App() {
  return (
    <>
      
      <Routes>
        {/* ==============================
            1. PUBLIC ROUTES (User Biasa)
           ============================== */}
        <Route path="/" element={<HomePage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/tentang" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />

        {/* ==============================
            2. PROTECTED USER ROUTE (Harus Login)
           ============================== */}
        {/* Checkout */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        
        {/* ✅ ROUTE HALAMAN PEMBAYARAN BARU */}
        <Route
          path="/payment/:id"
          element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          }
        />
        
        {/* Notifikasi User */}
        <Route 
          path="/notifications" 
          element={
            <ProtectedRoute>
                <NotificationPage />
            </ProtectedRoute>
          } 
        />

        {/* Route Edit Profil */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <EditProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Route Pesanan Saya */}
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <MyOrdersPage />
            </ProtectedRoute>
          }
        />

        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetailPage />
            </ProtectedRoute>
          }
        />

        <Route path="/orders/:id/review" element={<OrderReviewPage />} />

        {/* ==============================
            3. ADMIN ROUTES (Backoffice)
           ============================== */}
        <Route path="/admin" element={
            <AdminRoute>
                <AdminLayout />
            </AdminRoute>
        }>
            {/* Dashboard */}
            <Route index element={<DashboardAdmin />} />
            <Route path="dashboard" element={<DashboardAdmin />} />
            <Route path="notifications" element={<NotificationAdmin />} />
            <Route path="profile" element={<ProfileAdmin />} />
            
            {/* Manajemen Produk */}
            <Route path="products" element={<ProductListAdmin />} />
            <Route path="products/create" element={<ProductFormAdmin />} />
            <Route path="products/edit/:id" element={<ProductEditAdmin />} />

            {/* Manajemen Pesanan */}
            <Route path="orders" element={<OrderListAdmin />} />
            <Route path="orders/:id" element={<OrderDetailAdmin />} /> 
            
            {/* Pengaturan */}
            <Route path="settings" element={<SettingsAdmin />} /> 
        </Route>

      </Routes>
    </>
  );
}

export default App;