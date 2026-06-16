import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeSlash,
} from "react-icons/hi2";
import Swal from "sweetalert2";
import axios from "axios";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // STATE BARU: Untuk kontrol show/hide password
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    // ==========================================
    // 1. ALERT: VALIDASI PASSWORD PENDEK
    // ==========================================
    if (password.length < 8) {
      Swal.fire({
        html: `
          <div class="flex flex-col items-center">
            <div class="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-5 ring-4 ring-amber-500/20">
              <svg class="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <h2 class="text-xl font-bold text-slate-900 mb-2">Password Terlalu Pendek</h2>
            <p class="text-sm text-slate-500 text-center leading-relaxed">Minimal harus terdiri dari 8 karakter ya.</p>
          </div>
        `,
        buttonsStyling: false,
        confirmButtonText: "Mengerti",
        width: '22em', // Lebar popup dikompres agar elegan
        padding: '2rem 1.5rem',
        backdrop: `rgba(15, 23, 42, 0.7)`,
        customClass: {
          popup: "rounded-3xl shadow-2xl bg-white border border-slate-100",
          confirmButton: "w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl mt-6 transition-all active:scale-[0.98]",
          htmlContainer: "m-0 p-0" // Reset margin bawaan Swal
        }
      });
      return;
    }

    // ==========================================
    // 2. ALERT: VALIDASI PASSWORD TIDAK COCOK
    // ==========================================
    if (password !== passwordConfirm) {
      Swal.fire({
        html: `
          <div class="flex flex-col items-center">
            <div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-5 ring-4 ring-red-500/20">
              <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 class="text-xl font-bold text-slate-900 mb-2">Password Tidak Cocok</h2>
            <p class="text-sm text-slate-500 text-center leading-relaxed">Pastikan konfirmasi password sama persis.</p>
          </div>
        `,
        buttonsStyling: false,
        confirmButtonText: "Perbaiki",
        width: '22em',
        padding: '2rem 1.5rem',
        backdrop: `rgba(15, 23, 42, 0.7)`,
        customClass: {
          popup: "rounded-3xl shadow-2xl bg-white border border-slate-100",
          confirmButton: "w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl mt-6 transition-all active:scale-[0.98]",
          htmlContainer: "m-0 p-0"
        }
      });
      return;
    }

    setIsLoading(true);

    try {
      await axios.post("http://127.0.0.1:8000/api/register", {
        name,
        email,
        password
      });

      // ==========================================
      // 3. ALERT: REGISTRASI SUKSES
      // ==========================================
      Swal.fire({
        html: `
          <div class="flex flex-col items-center">
            <div class="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-5 shadow-lg ring-4 ring-amber-500/30">
              <svg class="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 class="text-xl font-bold text-slate-900 mb-2">Registrasi Berhasil!</h2>
            <p class="text-sm text-slate-500 text-center leading-relaxed px-1">
              Kami telah mengirimkan kode OTP ke email Anda. Silakan cek Inbox atau folder Spam.
            </p>
          </div>
        `,
        backdrop: `rgba(15, 23, 42, 0.8)`, // Latar lebih gelap agar fokus
        buttonsStyling: false,
        confirmButtonText: "Verifikasi Sekarang",
        allowOutsideClick: false,
        width: '22em',
        padding: '2rem 1.5rem',
        customClass: {
          popup: "rounded-3xl shadow-2xl bg-white border border-slate-100",
          confirmButton: "w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl mt-6 transition-all active:scale-[0.98] shadow-sm",
          htmlContainer: "m-0 p-0"
        }
      }).then(() => {
        navigate("/verify-otp", { state: { email: email } });
      });

    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message || err.response?.data?.email 
        ? "Email ini sudah terdaftar di sistem kami." 
        : "Terjadi kesalahan sistem, silakan coba lagi nanti.";

      // ==========================================
      // 4. ALERT: REGISTRASI GAGAL / ERROR
      // ==========================================
      Swal.fire({
        html: `
          <div class="flex flex-col items-center">
            <div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-5 ring-4 ring-red-500/20">
              <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h2 class="text-xl font-bold text-slate-900 mb-2">Registrasi Gagal</h2>
            <p class="text-sm text-slate-500 text-center leading-relaxed px-2">${errorMessage}</p>
          </div>
        `,
        backdrop: `rgba(15, 23, 42, 0.7)`,
        buttonsStyling: false,
        confirmButtonText: "Coba Lagi",
        width: '22em',
        padding: '2rem 1.5rem',
        customClass: {
          popup: "rounded-3xl shadow-2xl bg-white border border-slate-100",
          confirmButton: "w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl mt-6 transition-all active:scale-[0.98]",
          htmlContainer: "m-0 p-0"
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* LEFT SIDE - BRANDING DENGAN BAR AUDIO */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1489824904134-891ab64532f1?q=80&w=2070&auto=format&fit=crop')" }}>
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo dengan bar audio dan teks KHAIRULAUDIO */}
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
            <p className="text-[10px] text-slate-200 tracking-[0.25em] uppercase font-medium ml-9 -mt-1">
              CAR AUDIO SPECIALIST
            </p>
          </div>

          <div className="max-w-md">
            <h2 className="text-4xl font-bold leading-tight mb-4">Daftar dan mulai upgrade audio mobil Anda.</h2>
            <p className="text-slate-200 leading-relaxed">Nikmati pengalaman belanja audio mobil yang lebih mudah, cepat, dan terpercaya.</p>
          </div>
          <div className="text-sm text-slate-300">© 2026 Khairul Audio</div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10">
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
                Car Audio Specialist
              </p>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Buat Akun Baru</h2>
            <p className="text-slate-500">Isi data berikut untuk mulai berbelanja.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* INPUT NAMA */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nama lengkap</label>
              <div className="relative">
                <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input type="text" placeholder="Masukkan nama lengkap" value={name} onChange={(e) => setName(e.target.value)} required className="w-full h-12 rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none transition" />
              </div>
            </div>

            {/* INPUT EMAIL */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <div className="relative">
                <HiOutlineEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input type="email" placeholder="Masukkan email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full h-12 rounded-xl border border-slate-300 bg-white pl-12 pr-4 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none transition" />
              </div>
            </div>

            {/* INPUT PASSWORD */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Minimal 8 karakter" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="w-full h-12 rounded-xl border border-slate-300 bg-white pl-12 pr-12 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none transition" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                >
                  {showPassword ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* INPUT KONFIRMASI PASSWORD */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Konfirmasi password</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type={showPasswordConfirm ? "text" : "password"} 
                  placeholder="Ulangi password" 
                  value={passwordConfirm} 
                  onChange={(e) => setPasswordConfirm(e.target.value)} 
                  required 
                  className="w-full h-12 rounded-xl border border-slate-300 bg-white pl-12 pr-12 text-slate-800 placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none transition" 
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                >
                  {showPasswordConfirm ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full h-12 mt-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition active:scale-[0.99] disabled:opacity-70">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Memproses...
                </div>
              ) : (
                "Daftar Sekarang"
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            Sudah punya akun? <Link to="/login" className="font-semibold text-amber-600 hover:text-amber-500 underline decoration-2 underline-offset-4 transition-colors">Masuk sekarang</Link>
          </div>
        </div>
      </div>
    </div>
  );
}