// Lokasi: src/pages/AdminLoginPage.jsx

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";
import {
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineShieldCheck
} from "react-icons/hi2";

// Import gambar lokal (ganti dengan asset yang sesuai)
import heroImage from "../assets/img1.jpg"; 

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userData = await login(email, password);

      if (userData.role === "admin") {
        Swal.fire({
          html: `
            <div class="flex flex-col items-center pt-4 pb-2 font-sans">
              <div class="w-16 h-16 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
                <svg class="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <h2 class="text-xl font-bold text-slate-900 mb-1 tracking-tight">Login Berhasil</h2>
              <p class="text-sm text-slate-500">Membuka akses dashboard administrator...</p>
            </div>
          `,
          showConfirmButton: false,
          timer: 1500,
          customClass: {
            popup: "rounded-lg border border-slate-200 shadow-xl",
          },
        });

        setTimeout(() => {
          navigate("/admin/dashboard", { replace: true });
        }, 1500);
      } else {
        Swal.fire({
          icon: "error",
          title: "Akses Terbatas",
          text: "Maaf, akun Anda tidak memiliki izin administrator.",
          confirmButtonColor: "#0f172a",
        });
        localStorage.clear();
        navigate("/login");
      }
    } catch {
      setError("Kredensial tidak valid. Silakan periksa kembali email dan password Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-100 font-sans">
      
      {/* LEFT SIDE - BRANDING (Tema Admin - Overlay Lebih Gelap/Sistematis) */}
      <div
        className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center"
        style={{
          backgroundImage: `url(${heroImage})`,
        }}
      >
        {/* Pembeda: Overlay warna Slate Gelap, bukan hitam transparan biasa */}
        <div className="absolute inset-0 bg-slate-900/85"></div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <div className="flex flex-col gap-1">
            <div className="flex items-end gap-2">
              <div className="flex items-end gap-[3px] h-7">
                {[3, 5, 7, 5, 3].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-amber-500 rounded-full"
                    style={{ height: `${h * 2.5}px` }}
                  />
                ))}
              </div>
              <span className="text-xl font-black tracking-tight">
                KHAIRUL<span className="text-amber-500">AUDIO</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-[0.25em] uppercase font-medium ml-9 -mt-1">
              Store Management System
            </p>
          </div>

          <div className="max-w-md">
            <h2 className="text-4xl font-bold leading-tight mb-4 tracking-tight">
              Kelola Toko Anda.
            </h2>
            <p className="text-slate-300 leading-relaxed font-medium">
              Kelola inventaris, pantau pesanan secara real-time, dan optimalkan penjualan dari satu dashboard terpusat.
            </p>
          </div>

          <div className="text-sm font-semibold text-slate-400 flex items-center gap-2">©khairulaudio2026
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 bg-white border-l border-slate-200">
        
        <div className="w-full max-w-md">
          
          {/* MOBILE LOGO (Muncul hanya di HP) */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="flex items-end gap-[3px] h-7">
              {[3, 5, 7, 5, 3].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-amber-500 rounded-full"
                  style={{ height: `${h * 2.5}px` }}
                />
              ))}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  KHAIRUL<span className="text-amber-500">AUDIO</span>
                </h1>
              </div>
              <p className="text-xs font-medium text-slate-500 tracking-wide flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Portal Administrator
              </p>
            </div>
          </div>

          {/* TITLE */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
              Akses Admin
            </h2>
            <p className="text-slate-500 font-medium">
              Gunakan kredensial resmi untuk masuk ke sistem.
            </p>
          </div>

          {/* ERROR ALERT */}
          {error && (
            <div className="mb-5 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleAdminLogin} className="space-y-5">
            
            {/* EMAIL */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Email Terdaftar
              </label>
              <div className="relative">
                <HiOutlineEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-12 rounded-sm border border-slate-300 bg-white pl-12 pr-4 text-slate-900 placeholder:text-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-colors font-medium text-sm"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Kata Sandi
              </label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-12 rounded-sm border border-slate-300 bg-white pl-12 pr-12 text-slate-900 placeholder:text-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-colors font-medium text-sm"
                />
                
                {/* TOMBOL SHOW/HIDE PASSWORD */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? (
                    <HiOutlineEyeSlash className="w-5 h-5" />
                  ) : (
                    <HiOutlineEye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* RESET AKSES */}
            <div className="flex justify-end">
              <button
                type="button"
                className="text-xs text-amber-600 hover:text-amber-700 font-bold transition-colors"
                onClick={() => Swal.fire('Info', 'Hubungi Super Admin atau IT Support untuk mereset kata sandi Anda.', 'info')}
              >
                Lupa kata sandi?
              </button>
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-sm bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors active:scale-[0.99] disabled:opacity-70 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                  Memproses...
                </>
              ) : (
                <>
                  <HiOutlineShieldCheck className="w-5 h-5 text-amber-500" />
                  Login Administrator
                </>
              )}
            </button>
          </form>

          {/* BACK TO USER LOGIN */}
          <div className="mt-8 text-center text-sm text-slate-500 font-medium">
            Bukan Admin?{" "}
            <Link
              to="/login"
              className="font-bold text-slate-900 hover:text-amber-600 transition-colors underline decoration-2 underline-offset-4"
            >
              Login User
            </Link>
          </div>
          
        </div>
      </div>
    </div>
  );
}