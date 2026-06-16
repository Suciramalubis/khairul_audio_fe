import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import {
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeSlash,
} from "react-icons/hi2";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  // ===== FUNGSI LUPA PASSWORD =====
  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  // ===== LOGIN EMAIL =====
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const userData = await login(email, password);

      if (userData.role === "admin") {
        // --- ALERT LOGIN ADMIN 
        Swal.fire({
          html: `
            <div class="flex flex-col items-center pt-6 pb-2">
              <div class="w-16 h-16 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
                <svg class="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <h2 class="text-2xl font-bold text-slate-900 mb-1 tracking-tight">Akses Admin</h2>
              <p class="text-slate-500 font-medium text-sm">Mengalihkan ke portal manajemen...</p>
            </div>
          `,
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          buttonsStyling: false,
          backdrop: `rgba(15, 23, 42, 0.6)`, 
          width: '26em',
          customClass: {
            popup: "rounded-xl border border-slate-200 shadow-2xl bg-white",
            timerProgressBar: "bg-amber-500" 
          }
        }).then(() => {
          navigate("/admin/login", { replace: true });
        });
      } else {
        // --- ALERT LOGIN USER 
        Swal.fire({
          html: `
            <div class="flex flex-col items-center pt-6 pb-2">
              <div class="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 shadow-md ring-4 ring-slate-100">
                <svg class="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 class="text-2xl font-bold text-slate-900 mb-1 tracking-tight">Login Berhasil</h2>
              <p class="text-slate-500 font-medium text-sm">Selamat datang kembali di Khairul Audio.</p>
            </div>
          `,
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          buttonsStyling: false,
          backdrop: `rgba(15, 23, 42, 0.6)`,
          width: '26em',
          customClass: {
            popup: "rounded-xl border border-slate-200 shadow-2xl bg-white",
            timerProgressBar: "bg-slate-900" 
          }
        }).then(() => {
          navigate(from, { replace: true });
        });
      }
    } catch (err) {
      setError(err.message || "Email atau password salah");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-100">
      
      {/* LEFT SIDE - BRANDING DENGAN BAR AUDIO */}
      <div
        className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2070&auto=format&fit=crop')",
        }}
      >
        <div className="absolute inset-0 bg-black/45"></div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo dengan bar audio (batang amber) dan teks KHAIRULAUDIO */}
          <div className="flex flex-col gap-1">
            <div className="flex items-end gap-2">
              {/* Bar audio (garis vertikal) */}
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
            <p className="text-[10px] text-slate-200 tracking-[0.25em] uppercase font-medium ml-9 -mt-1">
              Audio Mobil dan Aksesoris Premium
            </p>
          </div>

          <div className="max-w-md">
            <h2 className="text-4xl font-bold leading-tight mb-4 tracking-tight">
              Upgrade audio mobil anda.
            </h2>

            <p className="text-slate-200 leading-relaxed font-medium">
              Temukan berbagai produk audio mobil berkualitas dengan pelayanan
              terpercaya dan pengiriman cepat.
            </p>
          </div>

          <div className="text-sm font-semibold text-slate-300">
            © 2026 Khairul Audio
          </div>
        </div>
      </div>

      {/* RIGHT SIDE  */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 bg-white">
        
        <div className="w-full max-w-md">
          
          {/* MOBILE LOGO */}
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
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                KHAIRUL<span className="text-amber-500">AUDIO</span>
              </h1>
              <p className="text-xs font-medium text-slate-500 tracking-wide">
                Audio Mobil dan Aksesoris Premium
              </p>
            </div>
          </div>

          {/* TITLE */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
              Masuk ke Akun
            </h2>

            <p className="text-slate-500 font-medium">
              Silakan login untuk melanjutkan belanja.
            </p>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mb-5 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleEmailLogin} className="space-y-5">
            
            {/* EMAIL */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Email
              </label>

              <div className="relative">
                <HiOutlineEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />

                <input
                  type="email"
                  placeholder="Masukkan email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-12 rounded-sm border border-slate-300 bg-white pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-colors font-medium text-sm"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                Password
              </label>

              <div className="relative">
                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-12 rounded-sm border border-slate-300 bg-white pl-12 pr-12 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-colors font-medium text-sm"
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

            {/* FORGOT PASSWORD */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-amber-600 hover:text-amber-700 font-bold transition-colors"
              >
                Lupa password?
              </button>
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-sm bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors active:scale-[0.99] disabled:opacity-70 mt-2 flex items-center justify-center"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Memproses...
                </div>
              ) : (
                "Masuk"
              )}
            </button>
          </form>

          {/* REGISTER */}
          <div className="mt-8 text-center text-sm text-slate-500 font-medium">
            Belum punya akun?{" "}
            <Link
              to="/register"
              className="font-bold text-slate-900 hover:text-amber-600 transition-colors underline decoration-2 underline-offset-4"
            >
              Daftar sekarang
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}