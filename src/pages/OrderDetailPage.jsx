import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import {
  HiOutlineLocationMarker,
  HiOutlineShoppingBag,
  HiOutlineCheckCircle,
  HiOutlineTruck,
  HiOutlineChevronRight,
  HiOutlineChat,
  HiOutlineClipboardCopy,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlineArchive,
  HiOutlineCreditCard,
  HiOutlineCog,
  HiQrcode
} from "react-icons/hi";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { API_BASE_URL as CENTRAL_API_BASE_URL, getImageUrl } from "../config/api";

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReviewed, setIsReviewed] = useState(false);
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState("");
  const [expandedPayment, setExpandedPayment] = useState("");

  const bankOptions = [
    { id: "VA_BCA", name: "Bank Central Asia (BCA)" },
    { id: "VA_BNI", name: "Bank Negara Indonesia (BNI)" },
    { id: "VA_BRI", name: "Bank Rakyat Indonesia (BRI)" },
    { id: "VA_MANDIRI", name: "Bank Mandiri (Mandiri)" },
    { id: "VA_BSI", name: "Bank Syariah Indonesia (BSI)" }
  ];

  useEffect(() => {
    const fetchOrderDetail = async () => {
      setLoading(true);
      window.scrollTo(0, 0);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${CENTRAL_API_BASE_URL}/user/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const orderData = response.data.data || response.data;
        setOrder(orderData);
        if (orderData.is_reviewed || (orderData.reviews && orderData.reviews.length > 0)) {
          setIsReviewed(true);
        }
      } catch (error) {
        console.error("Gagal mengambil detail pesanan:", error);
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Gagal memuat detail pesanan. Pastikan Anda sudah login.'
        }).then(() => navigate('/orders'));
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetail();
  }, [id, navigate]);

  const copyResi = () => {
    if (!order.tracking_number) return;
    navigator.clipboard.writeText(order.tracking_number);
    Swal.fire({
      title: "Disalin!",
      text: "Nomor resi berhasil disalin.",
      icon: "success",
      toast: true,
      position: "top-end",
      timer: 1500,
      showConfirmButton: false
    });
  };

  const updatePaymentMethod = async (method) => {
    if (!method) return;
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${CENTRAL_API_BASE_URL}/user/orders/${id}/payment-method`, {
        payment_method: method
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrder({ ...order, payment_method: method });
      setIsEditingPayment(false);
      setExpandedPayment("");
      Swal.fire({
        title: "Berhasil!",
        text: "Metode pembayaran telah diperbarui.",
        icon: "success",
        toast: true,
        position: "top-end",
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error("Gagal ubah metode pembayaran:", error);
      Swal.fire("Gagal", "Gagal memperbarui metode pembayaran.", "error");
    }
  };

  const handleSelectBank = (bankId) => {
    setNewPaymentMethod(bankId);
    updatePaymentMethod(bankId);
  };

  const handleSelectQRIS = () => {
    setNewPaymentMethod("QRIS");
    updatePaymentMethod("QRIS");
  };

  const handleCancelOrder = () => {
    Swal.fire({
      title: 'Batalkan Pesanan?',
      text: "Apakah Anda yakin ingin membatalkan pesanan ini? Aksi ini tidak dapat dikembalikan.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Batalkan!',
      cancelButtonText: 'Tidak'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("token");
          await axios.put(`${CENTRAL_API_BASE_URL}/user/orders/${id}/cancel`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setOrder({ ...order, status: 'cancelled' });
          Swal.fire('Dibatalkan!', 'Pesanan Anda berhasil dibatalkan.', 'success');
        } catch (error) {
          console.error("Gagal membatalkan pesanan:", error);
          Swal.fire('Gagal', 'Terjadi kesalahan saat membatalkan pesanan.', 'error');
        }
      }
    });
  };

  const handleWhatsAppChat = () => {
    if (!order) return;
    const adminPhoneNumber = "6289686310270";
    const invoiceNum = order.invoice_number || `INV-${order.id}`;
    const statusText = getStatusDisplay(order.status).text;
    const formattedTotal = new Intl.NumberFormat('id-ID').format(order.total_price);
    const productList = order.items && order.items.length > 0
      ? order.items.map(item => {
        const actualProduct = item.product || item.produk || item;
        const itemName = actualProduct?.name || actualProduct?.product_name || item.product_name || "Produk Audio";
        const qty = item.quantity || item.qty || 1;
        return `- ${itemName} (${qty}x)`;
      }).join("\n")
      : "- (Data produk kosong)";
    const messageTemplate = `Halo Admin Khairul Audio, saya butuh bantuan untuk pesanan saya.

*Rincian Transaksi:*
• No. Invoice: *${invoiceNum}*
• Total Tagihan: *Rp ${formattedTotal}*
• Status Pesanan: *${statusText}*

*Daftar Produk:*
${productList}

Mohon bantuannya untuk memproses kendala/pertanyaan saya. Terima kasih!`;
    const encodedMessage = encodeURIComponent(messageTemplate);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${adminPhoneNumber}&text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  const getTimelineStatus = (currentStatus) => {
    const status = String(currentStatus).toLowerCase();
    const statuses = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
    const currentIndex = statuses.indexOf(status);
    return {
      created: currentIndex >= 0,
      paid: currentIndex >= 1,
      processed: currentIndex >= 1,
      shipped: currentIndex >= 2,
      completed: currentIndex === 3,
      cancelled: currentIndex === 4
    };
  };

  const getStatusDisplay = (currentStatus) => {
    const status = String(currentStatus).toLowerCase();
    switch (status) {
      case 'pending':
        return { text: 'Menunggu Pembayaran', color: 'bg-blue-100 text-blue-700', icon: <HiOutlineClock className="w-4 h-4" /> };
      case 'processing':
        return { text: 'Diproses', color: 'bg-blue-100 text-blue-700', icon: <HiOutlineCog className="w-4 h-4" /> };
      case 'shipped':
        return { text: 'Dikirim', color: 'bg-indigo-100 text-indigo-700', icon: <HiOutlineTruck className="w-4 h-4" /> };
      case 'completed':
        return { text: 'Selesai', color: 'bg-emerald-100 text-emerald-700', icon: <HiOutlineCheckCircle className="w-4 h-4" /> };
      case 'cancelled':
        return { text: 'Dibatalkan', color: 'bg-red-100 text-red-700', icon: <HiOutlineXCircle className="w-4 h-4" /> };
      default:
        return { text: currentStatus, color: 'bg-gray-100 text-gray-700', icon: <HiOutlineCheckCircle className="w-4 h-4" /> };
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      <div className="flex-grow flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
      <Footer />
    </div>
  );

  if (!order) return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow flex items-center justify-center text-gray-500">Data pesanan tidak ditemukan.</div>
      <Footer />
    </div>
  );

  const t = getTimelineStatus(order.status);
  const statusInfo = getStatusDisplay(order.status);
  const addressParts = order.shipping_address ? order.shipping_address.split('|').map(s => s.trim()) : [];
  const custName = addressParts[0] || 'Nama Penerima Tidak Tersedia';
  const custPhone = addressParts[1] || '-';
  const custCity = addressParts[2] || '';
  const custDetail = addressParts[3] || '';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 sm:px-6 py-8 max-w-7xl">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-blue-600 transition">Beranda</Link>
          <HiOutlineChevronRight className="w-4 h-4 text-gray-400" />
          <Link to="/profile" className="hover:text-blue-600 transition">Profil</Link>
          <HiOutlineChevronRight className="w-4 h-4 text-gray-400" />
          <Link to="/orders" className="hover:text-blue-600 transition">Riwayat Pesanan</Link>
          <HiOutlineChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 font-medium">Detail Pesanan</span>
        </nav>

        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">Pesanan {order.invoice_number || `INV-${order.id}`}</h1>
              <div className={`${statusInfo.color} px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5`}>
                {statusInfo.icon} {statusInfo.text}
              </div>
            </div>
            <p className="text-gray-500 text-sm">Tanggal Transaksi: {new Date(order.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* Kolom Kiri (Detail Info) */}
          <div className="flex-1 space-y-6">

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Nomor Resi Pengiriman</p>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-900">
                      {order.tracking_number ? order.tracking_number : "Belum ada resi"}
                    </span>
                    {order.tracking_number && (
                      <button onClick={copyResi} className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition">
                        <HiOutlineClipboardCopy className="w-4 h-4" /> Salin
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="text-gray-500 mb-0.5">Kurir</p>
                  <p className="font-semibold text-gray-900 uppercase">{order.shipping_courier || "-"} - {order.shipping_service || "-"}</p>
                </div>
              </div>

              {/* Timeline Stepper */}
              <div className="p-5 md:p-8">
                {t.cancelled ? (
                  <div className="p-4 bg-red-50 text-red-700 font-medium text-center rounded-lg border border-red-100">
                    Pesanan ini telah dibatalkan.
                  </div>
                ) : (
                  <div className="relative grid grid-cols-5 max-w-2xl mx-auto z-0">
                    <div className="absolute top-5 left-[10%] right-[10%] h-1 bg-gray-200 -z-10"></div>
                    <div className="absolute top-5 left-[10%] h-1 bg-blue-500 -z-10 transition-all duration-500 ease-in-out"
                      style={{ width: t.completed ? '80%' : t.shipped ? '60%' : t.processed ? '40%' : t.paid ? '20%' : '0%' }}>
                    </div>

                    {[
                      { state: t.created, icon: HiOutlineShoppingBag, label: "Dibuat" },
                      { state: t.paid, icon: HiOutlineCreditCard, label: "Dibayar" },
                      { state: t.processed, icon: HiOutlineCog, label: "Diproses" },
                      { state: t.shipped, icon: HiOutlineTruck, label: "Dikirim" },
                      { state: t.completed, icon: HiOutlineCheckCircle, label: "Selesai" }
                    ].map((step, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-[3px] transition-colors bg-white
                                    ${step.state ? 'border-blue-500 text-blue-600' : 'border-gray-200 text-gray-300'}`}>
                          <step.icon className="w-5 h-5 bg-white" />
                        </div>
                        <span className={`text-xs md:text-sm font-medium text-center ${step.state ? 'text-gray-900' : 'text-gray-400'}`}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Kartu Alamat Pengiriman */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <HiOutlineLocationMarker className="text-gray-400 w-5 h-5" /> Alamat Pengiriman
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-y-3 gap-x-4 text-sm">
                <div className="text-gray-500">Nama Penerima</div>
                <div className="font-medium text-gray-900">{custName}</div>

                <div className="text-gray-500">No. Telepon</div>
                <div className="font-medium text-gray-900">{custPhone}</div>

                <div className="text-gray-500">Alamat Lengkap</div>
                <div className="text-gray-900 leading-relaxed">
                  {custDetail} <br />
                  {custCity && <span className="text-gray-600">{custCity}</span>}
                </div>
              </div>
            </div>

            {/* Kartu Rincian Produk */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <HiOutlineShoppingBag className="text-gray-400 w-5 h-5" /> Rincian Produk
              </h3>
              <div className="space-y-4">
                {(!order.items || order.items.length === 0) ? (
                  <div className="p-6 text-center rounded-lg bg-gray-50 text-gray-500 text-sm">
                    Daftar produk kosong
                  </div>
                ) : (
                  order.items.map((item, index) => {
                    const actualProduct = item.product || item.produk || item;
                    const productLinkID = actualProduct?.product_id || actualProduct?.id || item.product_id;
                    const itemName = actualProduct?.name || actualProduct?.product_name || actualProduct?.nama_produk || item.product_name || "Produk Audio";
                    const itemPrice = Number(item.price || actualProduct?.price || 0);
                    const itemQty = Number(item.quantity || item.qty || 1);

                    let imgUrl = item.product_image || actualProduct?.image_url || actualProduct?.image || actualProduct?.foto || null;

                    imgUrl = getImageUrl(imgUrl);

                    return (
                      <Link
                        to={productLinkID ? `/product/${productLinkID}` : '#'}
                        key={item.id || index}
                        className="group flex gap-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 hover:shadow-sm transition cursor-pointer"
                      >
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-md border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={itemName}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            />
                          ) : null}
                          <HiOutlineArchive className="text-gray-300 w-6 h-6 absolute" style={{ display: imgUrl ? 'none' : 'block' }} />
                        </div>

                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm sm:text-base line-clamp-2 group-hover:text-blue-600 transition-colors">
                              {itemName}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">{itemQty} x Rp {new Intl.NumberFormat('id-ID').format(itemPrice)}</p>
                          </div>
                          <div className="text-right mt-2 sm:mt-0 font-bold text-gray-900 text-sm sm:text-base">
                            Rp {new Intl.NumberFormat('id-ID').format(itemPrice * itemQty)}
                          </div>
                        </div>
                      </Link>
                    )
                  })
                )}
              </div>
            </div>

          </div>

          {/* Kolom Kanan (Ringkasan Pembayaran) */}
          <div className="w-full lg:w-96 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 lg:sticky lg:top-24">
              <h3 className="font-bold text-gray-900 mb-5">Ringkasan Pembayaran</h3>

              <div className="space-y-3 text-sm mb-5 pb-5 border-b border-gray-100">
                <div className="flex justify-between text-gray-600">
                  <span>Total Harga Produk</span>
                  <span className="font-medium text-gray-900">Rp {new Intl.NumberFormat('id-ID').format(order.total_price - order.shipping_cost)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Total Ongkos Kirim</span>
                  <span className="font-medium text-gray-900">Rp {new Intl.NumberFormat('id-ID').format(order.shipping_cost)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-gray-900">Total Belanja</span>
                <span className="text-lg font-black text-blue-600">Rp {new Intl.NumberFormat('id-ID').format(order.total_price)}</span>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Metode Pembayaran</p>
                  {String(order.status).toLowerCase() === 'pending' && !isEditingPayment && (
                    <button
                      onClick={() => {
                        setIsEditingPayment(true);
                        setNewPaymentMethod(order.payment_method);
                      }}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Ubah
                    </button>
                  )}
                </div>

                {isEditingPayment ? (
                  <div className="mt-3 space-y-3">

                    {/* Opsi 1: QRIS */}
                    <label
                      onClick={handleSelectQRIS}
                      className={`flex items-center justify-between p-3.5 rounded-lg cursor-pointer border transition-all ${newPaymentMethod === 'QRIS' ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <HiQrcode className="text-slate-700 w-5 h-5" />
                        <span className="font-semibold text-gray-800 text-sm">QRIS</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${newPaymentMethod === 'QRIS' ? 'border-blue-600' : 'border-gray-300'
                        }`}>
                        {newPaymentMethod === 'QRIS' && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                      </div>
                    </label>

                    {/* Opsi 2: Transfer Bank */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                      <button
                        onClick={() => setExpandedPayment(expandedPayment === 'bank' ? '' : 'bank')}
                        className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-gray-50 transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">🏦</span>
                          <span className="font-semibold text-gray-800 text-sm">Transfer Bank</span>
                        </div>
                        <HiOutlineChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expandedPayment === 'bank' ? 'rotate-90' : ''}`} />
                      </button>
                      {expandedPayment === 'bank' && (
                        <div className="p-3 space-y-1.5 border-t border-gray-100 bg-gray-50/50">
                          {bankOptions.map(bank => (
                            <label
                              key={bank.id}
                              onClick={() => handleSelectBank(bank.id)}
                              className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition ${newPaymentMethod === bank.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-white border border-transparent'}`}
                            >
                              <div className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0 ${newPaymentMethod === bank.id ? 'border-blue-600' : 'border-gray-300'}`}>
                                {newPaymentMethod === bank.id && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                              </div>
                              <span className="text-sm font-medium text-gray-700">{bank.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                ) : (
                  <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    {order.payment_method === 'QRIS' && <HiQrcode className="w-5 h-5 text-gray-700" />}
                    {String(order.payment_method).startsWith('VA_') && <span className="text-lg">🏦</span>}
                    {order.payment_method || 'Pilih Metode Pembayaran'}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {String(order.status).toLowerCase() === 'pending' ? (
                  <>
                    <button onClick={() => navigate(`/payment/${order.id}`)} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition shadow-sm">
                      Bayar Sekarang
                    </button>
                    <button onClick={handleCancelOrder} className="w-full bg-white border border-red-200 text-red-600 font-bold py-3 rounded-lg hover:bg-red-50 transition">
                      Batalkan Pesanan
                    </button>
                  </>
                ) : (
                  <>
                    {isReviewed ? (
                      <button
                        disabled
                        className="w-full flex justify-center items-center gap-2 py-3 rounded-lg font-bold bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed transition"
                      > Beri Ulasan
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/orders/${order.id}/review`)}
                        disabled={!t.completed}
                        className={`w-full py-3 rounded-lg font-bold transition text-center ${t.completed
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm cursor-pointer'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                      >
                        Beri Ulasan
                      </button>
                    )}

                    <button
                      onClick={handleWhatsAppChat}
                      className="w-full flex justify-center items-center gap-2 bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 hover:scale-[1.01] transition duration-200 active:scale-100 shadow-sm"
                    >
                      <HiOutlineChat className="w-5 h-5" /> Hubungi Bantuan (WA)
                    </button>

                    {!t.completed && (
                      <p className="text-xs text-center text-gray-500 mt-2">
                        Ulasan dapat diberikan setelah pesanan Selesai.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}