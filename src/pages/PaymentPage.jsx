import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import QRCode from "react-qr-code";
import {
  HiOutlineClock,
  HiOutlineChevronRight,
  HiOutlineDuplicate,
  HiCheckCircle,
} from "react-icons/hi";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { API_BASE_URL } from "../config/api";

const formatNumber = (num) => String(num).replace(/(.{4})/g, "$1 ").trim();

// ========== KOMPONEN SUKSES (MODERN, MINIMALIS, TIDAK NORAK) ==========
function PaymentSuccessCard({ order, bankName }) {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-8 md:p-10 max-w-xl mx-auto">
      {/* Ikon centang hijau soft */}
      <div className="flex justify-center mb-5">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
          <HiCheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
      </div>

      <h2 className="text-xl font-semibold text-slate-800 text-center mb-1">
        Pembayaran Berhasil
      </h2>
      <p className="text-slate-500 text-center text-sm mb-6">
        Pesanan {order.invoice_number || `#${order.id}`} telah dikonfirmasi
      </p>

      <div className="border-t border-slate-100 pt-4 space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">Total Dibayar</span>
          <span className="font-semibold text-slate-800">
            Rp {new Intl.NumberFormat("id-ID").format(order.total_price)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Metode Pembayaran</span>
          <span className="font-medium text-slate-700">
            {order.payment_method === "QRIS" ? "QRIS" : bankName}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Tanggal</span>
          <span className="text-slate-700">
            {new Date(order.updated_at || order.created_at).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })} WIB
          </span>
        </div>
      </div>

      <button
        onClick={() => navigate(`/orders/${order.id}`)}
        className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition shadow-sm"
      >
        Lihat Detail Pesanan
      </button>
    </div>
  );
}

// ========== KOMPONEN UTAMA PAYMENT PAGE ==========
export default function PaymentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [expireDateObj, setExpireDateObj] = useState(null);
  const [expandedGuide, setExpandedPayment] = useState("");
  const [copied, setCopied] = useState(false);
  const [paymentNumber, setPaymentNumber] = useState("");
  const [isBankTransfer, setIsBankTransfer] = useState(false);

  // Fungsi ambil data order
  const fetchOrder = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE_URL}/user/orders/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const orderData = response.data;
      setOrder(orderData);

      const method = String(orderData.payment_method || "").toUpperCase();
      if (
        method.includes("VA_") ||
        method.includes("BNI") ||
        method.includes("BRI") ||
        method.includes("BCA") ||
        method.includes("BSI")
      ) {
        setIsBankTransfer(true);
        setPaymentNumber(orderData.qris_url || orderData.payment_code || "Menunggu VA...");
      } else {
        setIsBankTransfer(false);
        setPaymentNumber(orderData.qris_url || orderData.payment_code || "00000000");
      }

      // Timer hanya saat pending
      if (orderData.status === "pending" && orderData.created_at) {
        const createdTime = new Date(orderData.created_at).getTime();
        const duration = method === "QRIS" ? 15 * 60 * 1000 : 24 * 60 * 60 * 1000;
        const expireTime = createdTime + duration;
        setExpireDateObj(new Date(expireTime));
        const calculateTimeLeft = () => {
          const now = new Date().getTime();
          const diff = expireTime - now;
          setTimeLeft(diff > 0 ? Math.floor(diff / 1000) : 0);
        };
        calculateTimeLeft();
        if (window.paymentTimerId) clearInterval(window.paymentTimerId);
        window.paymentTimerId = setInterval(calculateTimeLeft, 1000);
      } else {
        if (window.paymentTimerId) clearInterval(window.paymentTimerId);
        setTimeLeft(0);
      }
    } catch (error) {
      console.error("Gagal mengambil data pesanan:", error);
      navigate("/orders");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  // Auto polling setiap 3 detik jika masih pending
  useEffect(() => {
    fetchOrder();
    const pollingInterval = setInterval(() => {
      if (order?.status === "pending") {
        fetchOrder(false);
      }
    }, 3000);
    return () => {
      if (window.paymentTimerId) clearInterval(window.paymentTimerId);
      clearInterval(pollingInterval);
    };
  }, [fetchOrder, order?.status]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const copyVA = () => {
    navigator.clipboard.writeText(paymentNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    Swal.fire({
      title: "Disalin!",
      text: "Nomor pembayaran berhasil disalin.",
      icon: "success",
      toast: true,
      position: "top-end",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const isUrgent = timeLeft < 3600 && timeLeft > 0;

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );

  if (!order) return null;

  const bankName = order.payment_method ? order.payment_method.replace("VA_", "") : "Bank";
  const formatExpireDate = (dateObj) => {
    if (!dateObj) return "-";
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isToday = dateObj.toDateString() === today.toDateString();
    const isTomorrow = dateObj.toDateString() === tomorrow.toDateString();
    const timeString = dateObj.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    if (isToday) return `Hari ini, ${timeString} WIB`;
    if (isTomorrow) return `Besok, ${timeString} WIB`;
    return `${dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}, ${timeString} WIB`;
  };

  // Jika sudah lunas / tidak pending
  const isPaid = order.status !== "pending";

  if (isPaid) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center py-12 px-4">
          <PaymentSuccessCard order={order} bankName={bankName} />
        </main>
        <Footer />
      </div>
    );
  }

  // ========== TAMPILAN PENDING ==========
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Stepper */}
        <div className="max-w-3xl mx-auto mb-10">
          <div className="flex items-center justify-center gap-2 md:gap-6">
            {[
              { label: "Keranjang", active: true, completed: true },
              { label: "Pengiriman", active: true, completed: true },
              { label: "Pembayaran", active: true, completed: false },
            ].map((step, idx) => (
              <div key={idx} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step.completed
                        ? "bg-blue-600 text-white"
                        : "bg-slate-200 text-slate-500"
                      }`}
                  >
                    {step.completed ? <HiCheckCircle className="w-5 h-5" /> : idx + 1}
                  </div>
                  <span
                    className={`text-xs font-semibold mt-1 ${step.active ? "text-blue-600" : "text-slate-400"
                      }`}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < 2 && <div className="w-12 md:w-24 h-[2px] bg-slate-200 mx-2" />}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* KIRI - Detail Pembayaran */}
            <div className="lg:col-span-8 space-y-6">
              {/* Timer Banner */}
              <div
                className={`rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border ${timeLeft === 0
                    ? "bg-red-50 border-red-200"
                    : isUrgent
                      ? "bg-blue-50 border-blue-200"
                      : "bg-blue-50 border-blue-200"
                  }`}
              >
                <div>
                  <p
                    className={`text-sm font-bold mb-1 ${timeLeft === 0
                        ? "text-red-700"
                        : isUrgent
                          ? "text-blue-700"
                          : "text-blue-800"
                      }`}
                  >
                    {timeLeft === 0 ? "Waktu Pembayaran Habis" : "Selesaikan Pembayaran Dalam"}
                  </p>
                  <p
                    className={`text-xs ${timeLeft === 0
                        ? "text-red-600"
                        : isUrgent
                          ? "text-blue-600"
                          : "text-blue-700"
                      }`}
                  >
                    Batas Akhir: <span className="font-semibold">{formatExpireDate(expireDateObj)}</span>
                  </p>
                </div>
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xl font-bold tracking-widest ${timeLeft === 0
                      ? "bg-red-100 text-red-700"
                      : isUrgent
                        ? "bg-blue-100 text-blue-700"
                        : "bg-white text-blue-600"
                    }`}
                >
                  <HiOutlineClock className="w-5 h-5" />
                  {formatTime(timeLeft)}
                </div>
              </div>

              {/* Card Metode & Detail Pembayaran */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100">
                  <p className="text-sm text-slate-500 font-medium mb-1">Metode Pembayaran</p>
                  <p className="font-bold text-slate-900 text-xl">
                    {order.payment_method === "QRIS" ? "QRIS" : bankName}
                  </p>
                </div>

                <div className="p-6">
                  {!isBankTransfer ? (
                    <div className="flex flex-col items-center text-center">
                      <p className="text-sm font-semibold text-slate-700 mb-4">
                        Scan QR Code di Bawah Ini
                      </p>
                      <div className="bg-white p-4 border-2 border-slate-100 rounded-xl shadow-sm mb-3">
                        {paymentNumber ? (
                          <QRCode value={paymentNumber} size={200} />
                        ) : (
                          <div className="w-[200px] h-[200px] bg-slate-100 flex items-center justify-center text-sm text-slate-400 rounded">
                            Loading QR...
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        Gunakan aplikasi e-wallet (OVO, Dana, GoPay) atau M-Banking.
                      </p>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-slate-500 mb-2">
                        Nomor Virtual Account
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl">
                        <p className="text-2xl font-bold font-mono tracking-wider text-slate-900">
                          {paymentNumber ? formatNumber(paymentNumber) : "Loading..."}
                        </p>
                        <button
                          onClick={copyVA}
                          className="flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors w-fit"
                        >
                          {copied ? (
                            <><HiCheckCircle className="w-5 h-5 text-green-500" /> Tersalin</>
                          ) : (
                            <><HiOutlineDuplicate className="w-5 h-5" /> Salin Nomor</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-100 mt-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Atas Nama Penerima</p>
                      <p className="font-semibold text-slate-800">KHAIRUL AUDIO</p>
                    </div>
                    <div className="hidden sm:block w-px h-8 bg-slate-200"></div>
                    <div className="sm:text-right">
                      <p className="text-xs text-slate-500 mb-1">Total Pembayaran</p>
                      <p className="font-black text-blue-600 text-xl">
                        Rp {new Intl.NumberFormat("id-ID").format(order.total_price)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Panduan Pembayaran Accordion */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900">Panduan Pembayaran</h3>
                </div>

                {isBankTransfer ? (
                  <>
                    <AccordionItem
                      id="atm"
                      title={`Melalui ATM ${bankName}`}
                      expanded={expandedGuide}
                      setExpanded={setExpandedPayment}
                      steps={[
                        "Masukkan Kartu ATM & PIN Anda.",
                        "Pilih menu Transaksi Lainnya › Transfer › Ke Rekening Bank.",
                        `Masukkan nomor VA ${paymentNumber}.`,
                        "Pastikan nama penerima adalah KHAIRUL AUDIO.",
                        `Masukkan nominal transfer tepat Rp ${new Intl.NumberFormat("id-ID").format(order.total_price)}.`,
                        "Jika benar, pilih Ya / Benar dan simpan struk pembayaran.",
                      ]}
                    />
                    <AccordionItem
                      id="mbanking"
                      title={`Melalui Mobile Banking ${bankName}`}
                      expanded={expandedGuide}
                      setExpanded={setExpandedPayment}
                      steps={[
                        "Log In pada aplikasi Mobile Banking Anda.",
                        "Pilih menu Transfer › Virtual Account.",
                        `Masukkan nomor VA ${paymentNumber}.`,
                        "Pastikan nama penerima adalah KHAIRUL AUDIO.",
                        `Tagihan sebesar Rp ${new Intl.NumberFormat("id-ID").format(order.total_price)} akan muncul.`,
                        "Masukkan PIN Mobile Banking untuk menyelesaikan pembayaran.",
                      ]}
                    />
                  </>
                ) : (
                  <AccordionItem
                    id="qris"
                    title="Melalui Aplikasi E-Wallet / M-Banking"
                    expanded={expandedGuide}
                    setExpanded={setExpandedPayment}
                    steps={[
                      "Buka aplikasi e-wallet atau M-Banking di handphone Anda.",
                      "Pilih menu Pay / Scan QRIS.",
                      "Scan QR Code yang tertera pada halaman ini.",
                      "Pastikan nama merchant adalah KHAIRUL AUDIO.",
                      `Masukkan/pastikan nominal transfer tepat Rp ${new Intl.NumberFormat("id-ID").format(order.total_price)}.`,
                      "Konfirmasi pembayaran dengan memasukkan PIN aplikasi Anda.",
                    ]}
                  />
                )}
              </div>
            </div>

            {/* KANAN - Ringkasan & Aksi */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24">
                <h3 className="font-bold text-slate-900 text-lg mb-5">Ringkasan Pembayaran</h3>
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                  <span className="text-slate-600">Total Tagihan</span>
                  <span className="font-bold text-slate-900 text-xl">
                    Rp {new Intl.NumberFormat("id-ID").format(order.total_price)}
                  </span>
                </div>

                <button
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition mb-3 shadow-sm"
                >
                  Cek Status Pesanan
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Komponen Accordion
function AccordionItem({ id, title, expanded, setExpanded, steps }) {
  const isOpen = expanded === id;
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        onClick={() => setExpanded(isOpen ? "" : id)}
        className="w-full flex justify-between items-center px-6 py-4 hover:bg-slate-50 transition group"
      >
        <span
          className={`font-semibold text-sm transition ${isOpen ? "text-blue-600" : "text-slate-700 group-hover:text-blue-600"
            }`}
        >
          {title}
        </span>
        <HiOutlineChevronRight
          className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-90" : ""
            }`}
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-6">
          <ol className="space-y-3 list-decimal list-inside text-sm text-slate-600">
            {steps.map((step, idx) => (
              <li key={idx} className="leading-relaxed">
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}