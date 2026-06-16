import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { 
  HiOutlineEnvelope, 
  HiOutlineLockClosed, 
  HiArrowLeft,
  HiOutlineEye,
  HiOutlineEyeSlash
} from "react-icons/hi2";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  
  // STATE OTP 
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [filledIdx, setFilledIdx] = useState(null);
  const inputRefs = useRef([]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // STATE SHOW/HIDE PASSWORD
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // STATE BARU UNTUK KIRIM ULANG OTP & TIMER
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  
  const navigate = useNavigate();

  // EFEK UNTUK MENGHITUNG MUNDUR TIMER
  useEffect(() => {
    if (step === 2 && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, step]);

  // ==========================================
  // FUNGSI HANDLE OTP (SPLIT-BOX)
  // ==========================================
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setFilledIdx(value ? index : null);
    if (value && index < 5) inputRefs.current[index + 1].focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    const newOtp = [...otp];
    digits.forEach((d, i) => { if (i < 6) newOtp[i] = d; });
    setOtp(newOtp);
    const last = Math.min(digits.length - 1, 5);
    inputRefs.current[last]?.focus();
  };

  // ==========================================
  // API REQUESTS
  // ==========================================
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post("http://127.0.0.1:8000/api/forgot-password/send-otp", { email });
      Swal.fire({
        icon: "success",
        title: "OTP Terkirim!",
        text: "Silakan cek kotak masuk atau folder spam email Anda.",
        confirmButtonColor: "#f59e0b",
        timer: 3000,
        timerProgressBar: true,
      });
      setStep(2);
      setCountdown(60); // Mulai timer 60 detik
      // Fokus otomatis ke kotak pertama setelah pindah step
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: error.response?.data?.message || "Email tidak ditemukan.",
        confirmButtonColor: "#0f172a", 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) return;

    setIsLoading(true);
    try {
      await axios.post("http://127.0.0.1:8000/api/forgot-password/verify-otp", { email, otp: otpCode });
      setStep(3);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "OTP Salah",
        text: error.response?.data?.message || "Kode OTP tidak valid atau sudah kadaluarsa.",
        confirmButtonColor: "#0f172a",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // FUNGSI RESEND OTP
  const handleResend = async () => {
    if (countdown > 0 || isResending) return;

    setIsResending(true);
    try {
      // Menggunakan endpoint send-otp karena pada forgot password endpoint ini men-generate OTP baru
      await axios.post("http://127.0.0.1:8000/api/forgot-password/send-otp", { email });
      
      Swal.fire({
        html: `
          <div class="flex flex-col items-center">
            <div class="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-5 shadow-lg ring-4 ring-amber-500/30">
              <svg class="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
              </svg>
            </div>
            <h2 class="text-xl font-bold text-slate-900 mb-2">OTP Terkirim!</h2>
            <p class="text-sm text-slate-500 text-center leading-relaxed px-1">
              Kode OTP baru telah dikirim ke email <b>${email}</b>.
            </p>
          </div>
        `,
        backdrop: `rgba(15, 23, 42, 0.8)`,
        buttonsStyling: false,
        confirmButtonText: "Mengerti",
        width: '22em',
        padding: '2rem 1.5rem',
        customClass: {
          popup: "rounded-3xl shadow-2xl bg-white border border-slate-100",
          confirmButton: "w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl mt-6 transition-all active:scale-[0.98] shadow-sm",
          htmlContainer: "m-0 p-0"
        }
      });

      setCountdown(60); // Reset timer ke 60 detik
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Gagal Mengirim Ulang",
        text: error.response?.data?.message || "Terjadi kesalahan sistem.",
        confirmButtonColor: "#0f172a",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      Swal.fire({ icon: "warning", title: "Peringatan", text: "Password minimal 8 karakter.", confirmButtonColor: "#f59e0b" });
      return;
    }
    if (newPassword !== confirmPassword) {
      Swal.fire({ icon: "error", title: "Peringatan", text: "Konfirmasi password tidak cocok.", confirmButtonColor: "#0f172a" });
      return;
    }
    
    setIsLoading(true);
    const otpCode = otp.join("");
    
    try {
      await axios.post("http://127.0.0.1:8000/api/forgot-password/reset", { 
        email, 
        otp: otpCode, 
        password: newPassword 
      });
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Password Anda telah berhasil diubah. Silakan login kembali.",
        confirmButtonColor: "#f59e0b",
      }).then(() => navigate("/login"));
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: error.response?.data?.message || "Terjadi kesalahan sistem.",
        confirmButtonColor: "#0f172a",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-6">
      <div className="w-full max-w-md">
        {/* Card dengan efek glassmorphism halus */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50 transition-all duration-300">
          
          {/* Branding */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-end gap-[3px] h-8 mb-3">
              {[8, 14, 20, 14, 8].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-amber-500 rounded-full"
                  style={{
                    height: `${h}px`,
                    animation: `barBounce 0.9s ${[0, 0.15, 0.3, 0.15, 0][i]}s ease-in-out infinite`,
                    transformOrigin: "bottom",
                  }}
                />
              ))}
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                KHAIRUL<span className="text-amber-500">AUDIO</span>
              </h1>
              <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase mt-0.5">
                Car Audio Specialist
              </p>
            </div>
          </div>

          {/* Header judul step */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-slate-800">
              {step === 1 && "Reset Password"}
              {step === 2 && "Verifikasi Kode OTP"}
              {step === 3 && "Buat Password Baru"}
            </h2>
            
            {step === 1 && (
              <p className="text-sm text-slate-500 mt-1 px-4">
                Kami akan mengirimkan kode pemulihan ke email Anda
              </p>
            )}

            {step === 2 && (
              <div className="mt-2">
                <p className="text-sm text-slate-500">Kode 6 digit telah dikirim ke</p>
                {/* Desain UI/UX Baru: Email dan tombol Edit disatukan di dalam badge */}
                <div className="flex items-center justify-center gap-2 mt-1.5">
                  <span className="text-sm font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                    {email}
                  </span>
                  <button 
                    type="button" 
                    onClick={() => { setStep(1); setOtp(["", "", "", "", "", ""]); }}
                    className="text-sm text-amber-600 hover:text-amber-700 font-bold underline decoration-2 underline-offset-4 transition-colors"
                  >
                    Ubah
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <p className="text-sm text-slate-500 mt-1 px-4">
                Gunakan minimal 8 karakter untuk keamanan akun Anda
              </p>
            )}
          </div>

          {/* ============================== */}
          {/* STEP 1: FORM EMAIL             */}
          {/* ============================== */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Alamat Email</label>
                <div className="relative">
                  <HiOutlineEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan email yang terdaftar"
                    className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 bg-white/80 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none transition-all duration-200 text-slate-800 placeholder:text-slate-400"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full h-12 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-md mt-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Kirim Kode OTP"
                )}
              </button>
            </form>
          )}

          {/* ============================== */}
          {/* STEP 2: FORM OTP               */}
          {/* ============================== */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp}>
              <div className="flex justify-center gap-2 mb-6">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={idx === 0 ? handleOtpPaste : undefined}
                    className={`
                      w-12 h-14 text-center text-2xl font-bold text-slate-800
                      bg-white/80 border-2 rounded-xl outline-none
                      focus:border-amber-400 focus:ring-2 focus:ring-amber-200
                      transition-all duration-150
                      ${digit ? "border-amber-400" : "border-slate-200"}
                      ${filledIdx === idx ? "scale-110" : ""}
                    `}
                    style={
                      filledIdx === idx
                        ? { animation: "popIn 0.22s ease both" }
                        : {}
                    }
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.some((d) => !d)}
                className="w-full h-12 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Verifikasi OTP"
                )}
              </button>

              {/* TOMBOL RESEND OTP DENGAN COUNTDOWN */}
              <div className="text-center mt-5 text-sm text-slate-500 font-medium">
                Belum menerima kode?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={countdown > 0 || isResending}
                  className={`font-bold transition-colors ml-1 ${
                    countdown > 0 
                      ? "text-slate-400 cursor-not-allowed" 
                      : "text-slate-900 hover:text-amber-600 underline decoration-2 underline-offset-4"
                  }`}
                >
                  {isResending ? "Mengirim..." : countdown > 0 ? `Kirim ulang dalam ${countdown}s` : "Kirim Ulang"}
                </button>
              </div>
            </form>
          )}

          {/* ============================== */}
          {/* STEP 3: FORM PASSWORD BARU     */}
          {/* ============================== */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password Baru</label>
                <div className="relative">
                  <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="w-full h-12 pl-12 pr-12 rounded-xl border border-slate-200 bg-white/80 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none transition-all duration-200"
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
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Konfirmasi Password</label>
                <div className="relative">
                  <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    className="w-full h-12 pl-12 pr-12 rounded-xl border border-slate-200 bg-white/80 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  >
                    {showConfirmPassword ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 mt-2 rounded-xl bg-amber-500 text-slate-900 font-bold hover:bg-amber-400 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Simpan Password Baru"
                )}
              </button>
            </form>
          )}

          {/* Link kembali ke login yang sudah dirapikan dengan garis batas tipis */}
          <div className="mt-8 pt-5 border-t border-slate-200 flex justify-center">
            <Link
              to="/login"
              className="text-sm text-slate-500 hover:text-slate-900 font-semibold transition-colors inline-flex items-center gap-2"
            >
              <HiArrowLeft className="w-4 h-4" /> Kembali ke halaman Login
            </Link>
          </div>

        </div>
      </div>

      {/* Global Animations */}
      <style>{`
        @keyframes popIn {
          0%   { transform: scale(0.75); opacity: 0; }
          60%  { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes barBounce {
          0%,100% { transform: scaleY(0.4); }
          50%     { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}