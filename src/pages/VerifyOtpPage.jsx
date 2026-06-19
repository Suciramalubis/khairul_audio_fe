// src/pages/VerifyOtpPage.jsx
import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import Swal from "sweetalert2";

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [filledIdx, setFilledIdx] = useState(null);
  const inputRefs = useRef([]);

  // STATE BARU UNTUK KIRIM ULANG OTP & TIMER
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60); // 60 detik waktu tunggu

  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // EFEK UNTUK MENGHITUNG MUNDUR TIMER
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  if (!email) {
    navigate("/register");
    return null;
  }

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setFilledIdx(value ? index : null);
    setErrorMsg("");
    if (value && index < 5) inputRefs.current[index + 1].focus();
  };

  const handleKeyDown = (index, e) => {
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

  const handlePaste = (e) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    const newOtp = [...otp];
    digits.forEach((d, i) => { if (i < 6) newOtp[i] = d; });
    setOtp(newOtp);
    const last = Math.min(digits.length - 1, 5);
    inputRefs.current[last]?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) return;

    setIsLoading(true);
    setErrorMsg("");
    try {
      const response = await axios.post(`${API_BASE_URL}/verify-otp`, {
        email,
        otp: otpCode,
      });

      localStorage.setItem("token", response.data.token);
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      setIsSuccess(true);
      setTimeout(() => {
        navigate("/");
        window.location.reload();
      }, 2000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Kode OTP salah atau sudah kadaluarsa.");
    } finally {
      setIsLoading(false);
    }
  };

  // FUNGSI HANDLE RESEND DIPERBARUI DENGAN TIMER & UI/UX MODERN
  const handleResend = async () => {
    if (countdown > 0 || isResending) return;

    setIsResending(true);
    try {
      await axios.post(`${API_BASE_URL}/resend-otp`, { email });

      // Alert Sukses Kirim Ulang OTP
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
        html: `
          <div class="flex flex-col items-center">
            <div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-5 ring-4 ring-red-500/20">
              <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h2 class="text-xl font-bold text-slate-900 mb-2">Gagal Mengirim Ulang</h2>
            <p class="text-sm text-slate-500 text-center leading-relaxed px-2">${error.response?.data?.message || "Terjadi kesalahan sistem."}</p>
          </div>
        `,
        backdrop: `rgba(15, 23, 42, 0.7)`,
        buttonsStyling: false,
        confirmButtonText: "Tutup",
        width: '22em',
        padding: '2rem 1.5rem',
        customClass: {
          popup: "rounded-3xl shadow-2xl bg-white border border-slate-100",
          confirmButton: "w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl mt-6 transition-all active:scale-[0.98]",
          htmlContainer: "m-0 p-0"
        }
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-6">
      <div className="w-full max-w-md">
        <div
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50"
          style={{ animation: "fadeSlideUp 0.4s ease both" }}
        >
          {/* Branding */}
          <div className="flex flex-col items-center mb-6">
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              KHAIRUL<span className="text-amber-500">AUDIO</span>
            </h1>
            <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase mt-0.5">
              Car Audio Specialist
            </p>
          </div>

          {isSuccess ? (
            /* ── State Sukses ── */
            <div
              className="flex flex-col items-center py-6"
              style={{ animation: "successFade 0.4s ease both" }}
            >
              <div
                className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4"
                style={{ animation: "checkPop 0.45s cubic-bezier(0.34,1.56,0.64,1) both" }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                  stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-lg font-bold text-slate-800">Verifikasi berhasil!</p>
              <p className="text-sm text-slate-500 mt-1">Akun Anda berhasil dibuat.</p>
              <p className="text-xs text-slate-400 mt-3">Mengalihkan halaman...</p>
            </div>
          ) : (
            /* ── Form OTP ── */
            <>
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-slate-800">Verifikasi email</h2>
                <p className="text-sm text-slate-500 mt-1">Kode OTP dikirim ke</p>
                <span className="text-sm font-semibold text-amber-700 bg-amber-50 inline-block px-3 py-1 rounded-full mt-1">
                  {email}
                </span>
              </div>

              <form onSubmit={handleVerify}>
                <div className="flex justify-center gap-2 mb-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (inputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      onPaste={idx === 0 ? handlePaste : undefined}
                      className={`
                        w-12 h-14 text-center text-2xl font-bold text-slate-800
                        bg-slate-50 border-2 rounded-xl outline-none
                        focus:border-amber-400 focus:ring-2 focus:ring-amber-200
                        transition-all duration-150
                        ${digit ? "border-amber-400" : "border-slate-200"}
                        ${filledIdx === idx ? "scale-110" : ""}
                        ${errorMsg ? "border-red-400" : ""}
                      `}
                      style={
                        filledIdx === idx
                          ? { animation: "popIn 0.22s ease both" }
                          : {}
                      }
                    />
                  ))}
                </div>

                {errorMsg && (
                  <p
                    className="text-center text-sm text-red-500 mb-4 mt-2"
                    style={{ animation: "fadeSlideUp 0.2s ease both" }}
                  >
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading || otp.some((d) => !d)}
                  className="w-full h-12 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2 mt-6"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Memverifikasi...
                    </>
                  ) : (
                    "Verifikasi akun"
                  )}
                </button>
              </form>

              {/* TOMBOL RESEND OTP DENGAN COUNTDOWN */}
              <div className="text-center mt-5 text-sm text-slate-500 font-medium">
                Belum menerima kode?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={countdown > 0 || isResending}
                  className={`font-bold transition-colors ml-1 ${countdown > 0
                      ? "text-slate-400 cursor-not-allowed"
                      : "text-slate-900 hover:text-amber-600 underline decoration-2 underline-offset-4"
                    }`}
                >
                  {isResending ? "Mengirim..." : countdown > 0 ? `Kirim ulang dalam ${countdown}s` : "Kirim Ulang"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Keyframes global */}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          0%   { transform: scale(0.75); opacity: 0; }
          60%  { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes barBounce {
          0%,100% { transform: scaleY(0.4); }
          50%     { transform: scaleY(1); }
        }
        @keyframes checkPop {
          0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
          60%  { transform: scale(1.25) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes successFade {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}