// Lokasi: src/pages/admin/OrderDetailAdmin.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2'; // Tambahkan Swal untuk notifikasi
import {
  HiArrowLeft,
  HiPrinter,
  HiOutlineUser,
  HiOutlineLocationMarker,
  HiOutlineTruck,
  HiOutlineCurrencyDollar,
  HiCheckCircle,
  HiClock,
  HiXCircle,
  HiOutlineClipboardList,
  HiOutlineShoppingBag,
  HiOutlineCreditCard,
  HiOutlineArchive,
  HiSave // Tambahan icon Save
} from 'react-icons/hi';
import { useReactToPrint } from 'react-to-print';

export default function OrderDetailAdmin() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // === STATE BARU UNTUK UPDATE RESI ===
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isSavingResi, setIsSavingResi] = useState(false);
  
  // Ref untuk Cetak Invoice
  const invoiceRef = useRef(null);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
      const res = await axios.get(
        `http://127.0.0.1:8000/api/admin/orders/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const orderData = res.data.data || res.data;
      setOrder(orderData); 
      // Set nilai awal resi jika sudah ada di database
      setTrackingNumber(orderData.tracking_number || '');
    } catch (err) {
      console.error("Gagal memuat detail pesanan:", err);
    } finally {
      setLoading(false);
    }
  };

  // === FUNGSI BARU UNTUK UPDATE RESI ===
  const handleUpdateResi = async () => {
    if (!trackingNumber.trim()) {
      Swal.fire('Info', 'Nomor resi tidak boleh kosong', 'info');
      return;
    }

    setIsSavingResi(true);
    try {
      const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
      
      // Request update resi (Pastikan endpoint ini ada di Controller Backend kamu nanti)
      await axios.put(
        `http://127.0.0.1:8000/api/admin/orders/${id}/tracking`, 
        { tracking_number: trackingNumber },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Jika sukses, perbarui state lokal dan munculkan notifikasi
      setOrder(prev => ({ ...prev, tracking_number: trackingNumber }));
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Nomor Resi berhasil diperbarui!',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000
      });
    } catch (error) {
      console.error("Gagal update resi:", error);
      Swal.fire('Gagal', 'Terjadi kesalahan saat menyimpan nomor resi.', 'error');
    } finally {
      setIsSavingResi(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice_${order?.invoice_number || order?.id}`,
  });

  const formatIDR = (num) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(num);

  const getStatusConfig = (status) => {
    const map = {
      pending: { label: "Menunggu Pembayaran", color: "bg-amber-50 border-amber-200 text-amber-700", icon: <HiClock className="w-5 h-5" /> },
      processing: { label: "Diproses", color: "bg-blue-50 border-blue-200 text-blue-700", icon: <HiOutlineClipboardList className="w-5 h-5" /> },
      shipped: { label: "Dikirim", color: "bg-indigo-50 border-indigo-200 text-indigo-700", icon: <HiOutlineTruck className="w-5 h-5" /> },
      completed: { label: "Selesai", color: "bg-emerald-50 border-emerald-200 text-emerald-700", icon: <HiCheckCircle className="w-5 h-5" /> },
      cancelled: { label: "Dibatalkan", color: "bg-red-50 border-red-200 text-red-700", icon: <HiXCircle className="w-5 h-5" /> }
    };
    return map[String(status).toLowerCase()] || map.pending;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-sans">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium text-sm">Memuat detail pesanan...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-center font-sans">
        <h2 className="text-xl font-bold text-gray-800">Pesanan tidak ditemukan</h2>
        <Link to="/admin/orders" className="text-blue-600 hover:underline mt-4 inline-block">Kembali ke Daftar Pesanan</Link>
      </div>
    );
  }

  const subtotal = order.items?.reduce((acc, item) => {
      const price = Number(item.price || item.product?.price || 0);
      const qty = Number(item.qty || item.quantity || 1);
      return acc + (price * qty);
  }, 0) || 0;
  
  const shippingCost = Number(order.shipping_cost) || 0;
  const total = subtotal + shippingCost;
  const statusCfg = getStatusConfig(order.status);

  const invNumber = order.invoice_number || order.invoice || `INV-${order.id}`;
  
  let orderDate = 'Tanggal tidak tersedia';
  const rawDate = order.created_at || order.order_date || order.date;
  
  if (rawDate) {
      const d1 = new Date(rawDate);
      if (!isNaN(d1.getTime())) {
          orderDate = d1.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      } else {
          const safeDateStr = String(rawDate).replace(' ', 'T');
          const d2 = new Date(safeDateStr);
          if (!isNaN(d2.getTime())) {
              orderDate = d2.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
          } else {
              orderDate = String(rawDate); 
          }
      }
  }
  
  let customerName = 'Guest';
  if (order.customer_name) customerName = order.customer_name;
  else if (order.user?.name) customerName = order.user.name;
  else if (order.customer) customerName = order.customer;
  else if (order.shipping_address) customerName = order.shipping_address.split('|')[0].trim();

  const paymentMethodName = order.payment_method || order.payment_type || order.payment_channel || order.bank || "Transfer Bank";

  const renderPaymentIcon = (method) => {
      const lowerMethod = String(method).toLowerCase();
      if (lowerMethod.includes('dana') || lowerMethod.includes('gopay') || lowerMethod.includes('ovo') || lowerMethod.includes('e-wallet')) {
          return "📱"; 
      }
      return "🏦"; 
  };

  // Cek apakah resi boleh diedit (hanya jika diproses atau dikirim)
  const canEditResi = order.status === 'processing' || order.status === 'shipped';

  return (
    <div className="max-w-5xl mx-auto pb-12 font-sans text-gray-900 animate-fadeIn relative overflow-x-hidden">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/orders"
            className="p-2 bg-white border border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <HiArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Detail Pesanan</h1>
            <p className="text-sm text-gray-500 mt-0.5">{invNumber} <span className="mx-1">•</span> {orderDate}</p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-blue-600 border border-blue-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
        >
          <HiPrinter className="w-4 h-4 text-blue-100" /> Cetak Invoice
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center gap-2">
              <HiOutlineShoppingBag className="w-5 h-5 text-gray-500" />
              <h2 className="text-base font-semibold text-gray-800">Daftar Produk</h2>
            </div>

            <div className="divide-y divide-gray-100">
              {order.items?.length > 0 ? (
                order.items.map((item, index) => {
                    const actualProduct = item.product || item.produk || item;
                    const itemName = actualProduct?.name || actualProduct?.product_name || "Produk Telah Dihapus";
                    const isDeleted = !actualProduct?.name && !actualProduct?.product_name;
                    const itemPrice = Number(actualProduct?.price || item.price || 0);
                    const itemQty = Number(item.qty || item.quantity || 1);
                    
                    let imgUrl = actualProduct?.image_url || actualProduct?.image || null;
                    if(imgUrl && !imgUrl.startsWith('http')) {
                        let cleanPath = imgUrl.startsWith('/') ? imgUrl.substring(1) : imgUrl;
                        if(!cleanPath.startsWith('storage/')) {
                            cleanPath = `storage/${cleanPath}`; 
                        }
                        imgUrl = `http://127.0.0.1:8000/${cleanPath}`;
                    }

                    return (
                        <div key={index} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50/50 transition-colors">
                            <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                {imgUrl && !isDeleted ? (
                                    <img src={imgUrl} alt={itemName} className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    <HiOutlineArchive className="w-5 h-5 text-gray-400" />
                                )}
                            </div>
                            <div>
                                <p className={`text-sm font-semibold ${isDeleted ? 'text-gray-400 italic' : 'text-gray-900'}`}>{itemName}</p>
                                <p className="text-xs font-medium text-gray-500 mt-0.5">
                                {itemQty} x {formatIDR(itemPrice)}
                                </p>
                            </div>
                            </div>
                            <p className="text-sm font-bold text-gray-900 w-full sm:w-auto text-right">
                            {formatIDR(itemQty * itemPrice)}
                            </p>
                        </div>
                    )
                })
              ) : (
                <div className="p-8 text-center text-sm text-gray-500 italic">
                    <HiOutlineArchive className="mx-auto w-8 h-8 text-gray-300 mb-2" />
                    Data produk dalam pesanan ini tidak tersedia.
                </div>
              )}
            </div>
            
            <div className="px-5 py-4 bg-gray-50/50 border-t border-gray-200 flex justify-between items-center">
               <span className="text-sm font-medium text-gray-600">Subtotal Produk</span>
               <span className="text-sm font-bold text-gray-900">{formatIDR(subtotal)}</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center gap-2">
                <HiOutlineUser className="w-5 h-5 text-gray-500" />
                <h2 className="text-base font-semibold text-gray-800">Pelanggan</h2>
              </div>
              <div className="p-5 flex-1">
                <p className="text-sm font-bold text-gray-900 mb-1">{customerName}</p>
                <p className="text-sm text-gray-600">{order.email || '-'}</p>
                <p className="text-sm text-gray-600 mt-1">{order.phone || order.phone_number || '-'}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center gap-2">
                <HiOutlineLocationMarker className="w-5 h-5 text-gray-500" />
                <h2 className="text-base font-semibold text-gray-800">Alamat Pengiriman</h2>
              </div>
              <div className="p-5 flex-1">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {order.shipping_address || order.address || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
             <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center gap-2">
                <HiOutlineClipboardList className="w-5 h-5 text-gray-500" />
                <h2 className="text-base font-semibold text-gray-800">Status Pesanan</h2>
              </div>
            <div className="p-5">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border font-semibold text-sm ${statusCfg.color}`}>
                {statusCfg.icon}
                {statusCfg.label}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center gap-2">
              <HiOutlineTruck className="w-5 h-5 text-gray-500" />
              <h2 className="text-base font-semibold text-gray-800">Kurir Pengiriman</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Kurir & Layanan</p>
                <p className="text-sm font-bold text-gray-900">{(order.shipping_courier || order.courier || '').toUpperCase()} {(order.shipping_service || order.service || '').toUpperCase()}</p>
              </div>
              
              {/* === FORM UPDATE RESI === */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">No. Resi Pengiriman</p>
                
                {canEditResi ? (
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Masukkan No. Resi"
                      className="w-full text-sm font-mono font-bold text-gray-900 bg-white px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <button 
                      onClick={handleUpdateResi}
                      disabled={isSavingResi}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg flex-shrink-0 transition-colors disabled:opacity-50"
                      title="Simpan Resi"
                    >
                      {isSavingResi ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <HiSave className="w-4 h-4" />}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                     <p className="text-sm font-mono font-bold text-gray-900 bg-gray-100 px-3 py-2 rounded-md border border-gray-200 w-full">
                        {order.tracking_number || "Belum ada resi"}
                     </p>
                  </div>
                )}
                
                {!canEditResi && !order.tracking_number && (
                  <p className="text-[11px] text-amber-600 mt-1 italic">
                    *Input resi hanya bisa dilakukan saat pesanan "Diproses" atau "Dikirim".
                  </p>
                )}
              </div>
              {/* ======================== */}

            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center gap-2">
              <HiOutlineCurrencyDollar className="w-5 h-5 text-gray-500" />
              <h2 className="text-base font-semibold text-gray-800">Pembayaran</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Subtotal Produk</span>
                <span className="font-semibold text-gray-900">{formatIDR(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Ongkos Kirim</span>
                <span className="font-semibold text-gray-900">{formatIDR(shippingCost)}</span>
              </div>
              <div className="pt-4 border-t border-dashed border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-900">Total Harga</span>
                  <span className="text-lg font-bold text-blue-600">{formatIDR(total)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.1em] mb-2">Metode Pembayaran</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded border border-gray-300 bg-gray-50 text-base shadow-sm flex-shrink-0">
                    {renderPaymentIcon(paymentMethodName)}
                  </div>
                  <span className="text-sm font-bold text-slate-900 leading-tight">
                    {paymentMethodName}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ================= INVOICE PRINT TEMPLATE ================= */}
      <div className="absolute -left-[9999px] -top-[9999px]">
        <div ref={invoiceRef} className="p-10 font-sans text-gray-800 w-[210mm] min-h-[297mm] bg-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            
            <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">INVOICE</h1>
                    <p className="text-sm font-bold text-gray-500">{invNumber}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-black text-amber-500 tracking-tighter">Khairul<span className="text-slate-900">Audio.</span></h2>
                    <p className="text-sm text-gray-600 mt-1 font-medium">Jl. T. Amir Hamzah, Sei Agul, Kec. Medan Amplas., Kota Medan</p>
                    <p className="text-sm text-gray-600 font-medium">Sumatera Utara, Indonesia 20224</p>
                    <p className="text-sm text-gray-600 mt-1 font-medium">Email: cs@khairulaudio.com</p>
                </div>
            </div>

            <div className="flex justify-between mb-8">
                <div className="w-1/2 pr-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">DITAGIHKAN KEPADA:</p>
                    <p className="text-base font-bold text-slate-900">{customerName}</p>
                    <p className="text-sm text-gray-600 mt-1 mb-4">{order.phone || order.phone_number || '-'}</p>

                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">ALAMAT PENGIRIMAN</p>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed max-w-sm">
                        {order.shipping_address || order.address || '-'}
                    </p>
                </div>
                <div className="w-1/2 pl-4 text-right">
                    <div className="mb-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">TANGGAL PEMBELIAN</p>
                        <p className="text-sm font-bold text-slate-900">{orderDate}</p>
                    </div>
                    <div className="mb-4">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">METODE PEMBAYARAN</p>
                        <p className="text-sm font-bold text-slate-900 uppercase">{paymentMethodName}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">EKSPEDISI</p>
                        <p className="text-sm font-bold text-slate-900 uppercase">{(order.shipping_courier || '').toUpperCase()} {(order.shipping_service || '').toUpperCase()}</p>
                        
                        {/* Tambahan Nomor Resi di Invoice */}
                        {order.tracking_number && (
                           <>
                             <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-4 mb-1">NO. RESI</p>
                             <p className="text-sm font-bold text-slate-900">{order.tracking_number}</p>
                           </>
                        )}
                    </div>
                </div>
            </div>

            <table className="w-full text-left mb-8 border-collapse">
                <thead>
                    <tr className="bg-slate-800 text-white">
                        <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider rounded-tl-lg">Deskripsi Produk</th>
                        <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-center">Qty</th>
                        <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-right">Harga Satuan</th>
                        <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-right rounded-tr-lg">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {order.items?.map((item, idx) => {
                        const actualProduct = item.product || item.produk || item;
                        const itemName = actualProduct?.name || actualProduct?.product_name || "Produk Telah Dihapus";
                        const isDeleted = !actualProduct?.name && !actualProduct?.product_name;
                        const itemPrice = Number(actualProduct?.price || item.price || 0);
                        const itemQty = Number(item.qty || item.quantity || 1);

                        return (
                            <tr key={idx}>
                                <td className="py-4 px-4 border-b border-gray-100">
                                    <p className={`text-sm font-bold ${isDeleted ? 'text-gray-400 italic' : 'text-slate-900'}`}>{itemName}</p>
                                </td>
                                <td className="py-4 px-4 text-center text-sm font-medium text-gray-700 border-b border-gray-100">{itemQty}</td>
                                <td className="py-4 px-4 text-right text-sm font-medium text-gray-700 border-b border-gray-100">{formatIDR(itemPrice)}</td>
                                <td className="py-4 px-4 text-right text-sm font-bold text-slate-900 border-b border-gray-100">{formatIDR(itemPrice * itemQty)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <div className="flex justify-end mb-10">
                <div className="w-1/2">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-600">Subtotal</span>
                        <span className="text-sm font-bold text-slate-900">{formatIDR(subtotal)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-600">Biaya Pengiriman</span>
                        <span className="text-sm font-bold text-slate-900">{formatIDR(shippingCost)}</span>
                    </div>
                    <div className="flex justify-between py-4 mt-2 bg-gray-50 px-4 rounded-lg">
                        <span className="text-base font-black text-slate-900">TOTAL KESELURUHAN</span>
                        <span className="text-lg font-black text-amber-600">{formatIDR(total)}</span>
                    </div>
                </div>
            </div>

            <div className="border-t-2 border-gray-800 pt-6 mt-16">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Terima Kasih Atas Kepercayaan Anda!</h4>
                <p className="text-xs text-gray-500 font-medium">Jika Anda memiliki pertanyaan mengenai invoice ini, silakan hubungi tim dukungan pelanggan kami di info@khairulaudio.com atau +62 812 3456 7890.</p>
            </div>

        </div>
      </div>

    </div>
  );
}