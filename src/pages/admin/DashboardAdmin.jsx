// Lokasi: src/pages/admin/DashboardAdmin.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  HiOutlineCurrencyDollar,
  HiOutlineShoppingBag,
  HiOutlineCube,
  HiOutlineExclamation,
  HiOutlineCheckCircle,
  HiOutlineArrowRight,
  HiTrendingUp
} from "react-icons/hi";

export default function DashboardAdmin() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [lowStockList, setLowStockList] = useState([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  
  // State untuk Data Pesanan Asli
  const [orders, setOrders] = useState([]);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  
  const [loading, setLoading] = useState(true);
  
  // --- CHART STATE ---
  const [chartMode, setChartMode] = useState("minggu");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [chartData, setChartData] = useState([]);

  const YEAR_OPTIONS = [
    new Date().getFullYear(),
    new Date().getFullYear() - 1,
    new Date().getFullYear() - 2,
  ];

  const BULAN_LABELS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  const HARI_LABELS  = ["Sen","Sel","Rab","Kam","Jum","Sab","Min"];

  // Helper untuk ambil token
  const getToken = () => localStorage.getItem("admin_token") || localStorage.getItem("token");

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (orders.length >= 0) {
      generateChartData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, chartMode, selectedYear]);

  const fetchDashboardData = async () => {
    setLoading(true);
    const token = getToken();
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      // 1. Mengambil data Produk
      try {
        const resProducts = await axios.get("http://127.0.0.1:8000/api/admin/products", config);
        const allProducts = resProducts.data;
        setProducts(allProducts);
        const allLowStock = allProducts.filter((p) => p.stock < 5);
        setLowStockCount(allLowStock.length);
        setLowStockList([...allLowStock].sort((a, b) => a.stock - b.stock).slice(0, 5)); 
      } catch (err) {
        console.warn("Gagal load produk:", err);
      }

      // 2. Mengambil data Pesanan
      try {
        const resOrders = await axios.get("http://127.0.0.1:8000/api/admin/orders", config);
        const allOrders = resOrders.data.data ? resOrders.data.data : resOrders.data;
        setOrders(allOrders);
        
        // Hitung pesanan pending
        const pending = allOrders.filter(o => o.status === 'pending');
        setPendingOrdersCount(pending.length);

        // Hitung total pendapatan (Hanya yang proses, dikirim, dan selesai)
        const validOrders = allOrders.filter(o => ['processing', 'shipped', 'completed'].includes(o.status));
        const total = validOrders.reduce((sum, o) => sum + Number(o.total_price || o.total || 0), 0);
        setTotalRevenue(total);

      } catch (err) {
        console.warn("Gagal load pesanan:", err);
      }

    } catch (error) {
      console.error("Gagal mengambil data dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = () => {
    const validOrders = orders.filter(o => ['processing', 'shipped', 'completed'].includes(o.status));
    let newData = [];
    const now = new Date();

    if (chartMode === "minggu") {
      const currentDay = now.getDay() === 0 ? 7 : now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - currentDay + 1);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      let weekTotals = Array(7).fill(0);

      validOrders.forEach(o => {
        const rawDate = o.created_at || o.order_date || o.date;
        if (!rawDate) return;
        
        const safeDateStr = String(rawDate).replace(/-/g, '/').split('.')[0]; 
        const d = new Date(safeDateStr);
        
        if (d >= startOfWeek && d <= endOfWeek) {
          const dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;
          weekTotals[dayIdx] += Number(o.total_price || o.total || 0);
        }
      });

      const maxVal = Math.max(...weekTotals, 1);
      const todayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1;

      newData = weekTotals.map((val, idx) => ({
        label: HARI_LABELS[idx],
        height: Math.round((val / maxVal) * 90) + 5,
        active: idx === todayIdx,
        value: val
      }));

    } else if (chartMode === "bulan") {
      const targetMonth = now.getMonth();
      const daysInMonth = new Date(selectedYear, targetMonth + 1, 0).getDate();
      let monthTotals = Array(daysInMonth).fill(0);

      validOrders.forEach(o => {
        const rawDate = o.created_at || o.order_date || o.date;
        if (!rawDate) return;
        const safeDateStr = String(rawDate).replace(/-/g, '/').split('.')[0]; 
        const d = new Date(safeDateStr);
        
        if (d.getFullYear() === selectedYear && d.getMonth() === targetMonth) {
          monthTotals[d.getDate() - 1] += Number(o.total_price || o.total || 0);
        }
      });

      const maxVal = Math.max(...monthTotals, 1);
      const todayDate = now.getDate();
      const isCurrentYearAndMonth = selectedYear === now.getFullYear();

      newData = monthTotals.map((val, idx) => ({
        label: `${idx + 1}`,
        height: Math.round((val / maxVal) * 90) + 5,
        active: (idx + 1) === todayDate && isCurrentYearAndMonth,
        value: val
      }));

    } else if (chartMode === "tahun") {
      let yearTotals = Array(12).fill(0);

      validOrders.forEach(o => {
        const rawDate = o.created_at || o.order_date || o.date;
        if (!rawDate) return;
        const safeDateStr = String(rawDate).replace(/-/g, '/').split('.')[0]; 
        const d = new Date(safeDateStr);
        
        if (d.getFullYear() === selectedYear) {
          yearTotals[d.getMonth()] += Number(o.total_price || o.total || 0);
        }
      });

      const maxVal = Math.max(...yearTotals, 1);
      const curMonth = now.getMonth();
      const isCurrentYear = selectedYear === now.getFullYear();

      newData = yearTotals.map((val, idx) => ({
        label: BULAN_LABELS[idx],
        height: Math.round((val / maxVal) * 90) + 5,
        active: idx === curMonth && isCurrentYear,
        value: val
      }));
    }

    setChartData(newData);
  };

  const chartSubtitle = chartMode === "minggu"
    ? "Pendapatan harian minggu ini"
    : chartMode === "bulan"
    ? `Pendapatan harian bulan ${new Date().toLocaleString("id-ID", {month:"long"})} ${selectedYear}`
    : `Pendapatan bulanan tahun ${selectedYear}`;

  const validRecentOrders = orders.filter(o => o && (o.id || o.invoice || o.invoice_number));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .dashboard-root { font-family: 'Plus Jakarta Sans', sans-serif; }
        .scrollbar-hidden::-webkit-scrollbar { display: none; }
        .scrollbar-hidden { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="dashboard-root space-y-2 p-2 lg:p-1 text-slate-800">
        
        {/* HEADER */}
        <div className="animate-[fadeIn_0.4s_ease-out] flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 pb-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 lg:text-3xl">
              Dashboard Admin
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Ringkasan aktivitas toko <span className="font-semibold text-blue-600">Khairul Audio</span>
            </p>
          </div>
        </div>

        {/* STAT STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card Pendapatan */}
          <div className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-6 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pendapatan</p>
                <h3 className="text-2xl font-black text-slate-900 mt-2 tracking-tight group-hover:text-emerald-700 transition-colors">
                  {loading ? "..." : `Rp ${new Intl.NumberFormat('id-ID').format(totalRevenue)}`}
                </h3>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-100 transition-colors">
                <HiOutlineCurrencyDollar className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs font-semibold text-emerald-600 mt-4 flex items-center gap-1">
              <HiTrendingUp className="w-3.5 h-3.5" /> Estimasi sukses / dikirim
            </p>
          </div>

          {/* Card Pesanan */}
          <div className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-6 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500"></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pesanan</p>
                <h3 className="text-2xl font-black text-slate-900 mt-2 tracking-tight group-hover:text-indigo-700 transition-colors">
                  {loading ? "..." : `${orders.length} Transaksi`}
                </h3>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors">
                <HiOutlineShoppingBag className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-4">
              <span className="font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{pendingOrdersCount}</span> pesanan baru (menunggu)
            </p>
          </div>

          {/* Card Produk */}
          <div className={`bg-white border rounded-2xl p-6 relative overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 group ${!loading && lowStockCount > 0 ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200 hover:border-amber-300'}`}>
            <div className={`absolute top-0 left-0 right-0 h-1 ${!loading && lowStockCount > 0 ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Produk</p>
                <h3 className={`text-2xl font-black mt-2 tracking-tight ${!loading && lowStockCount > 0 ? 'text-rose-700' : 'text-slate-900 group-hover:text-amber-700'}`}>
                  {loading ? "..." : `${products.length} Item`}
                </h3>
              </div>
              <div className={`p-3 rounded-xl transition-colors ${!loading && lowStockCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-amber-50 text-amber-600 group-hover:bg-amber-100'}`}>
                <HiOutlineCube className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              {!loading && lowStockCount > 0 ? (
                <span className="text-xs font-bold text-rose-600 bg-rose-100/80 px-2 py-0.5 rounded-md animate-pulse inline-flex items-center gap-1">
                  ⚠ {lowStockCount} produk memerlukan restock
                </span>
              ) : (
                <span className="text-xs font-semibold text-emerald-600 inline-flex items-center gap-1">
                  ✓ Semua sistem inventaris aman
                </span>
              )}
            </div>
          </div>
        </div>

        {/* DATA MANAGEMENT WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Diagram Grafik Batang */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 lg:p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Statistik Penjualan</h3>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">{chartSubtitle}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200/60">
                  {[
                    { key: "minggu", label: "Minggu" },
                    { key: "bulan",  label: "Bulan" },
                    { key: "tahun",  label: "Tahun" },
                  ].map(item => (
                    <button
                      key={item.key}
                      onClick={() => setChartMode(item.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chartMode === item.key ? 'bg-white text-blue-600 shadow-sm border border-slate-200/40' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {chartMode === "tahun" && (
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="border border-slate-200 bg-slate-50 text-slate-600 text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    {YEAR_OPTIONS.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Area Komponen Chart Canvas */}
            <div className="h-56 border-b-2 border-l-2 border-slate-200 px-2 flex items-end gap-1 sm:gap-2 relative select-none overflow-x-auto scrollbar-hidden">
              {/* Garis Grid Penanda */}
              {[25, 50, 75].map(p => (
                <div key={p} className="absolute left-0 right-0 border-t border-dashed border-slate-100 pointer-events-none" style={{ bottom: `${p}%` }} />
              ))}

              {loading ? (
                <div className="w-full flex items-end gap-2 h-full pb-1">
                  {Array.from({ length: chartMode === "tahun" ? 12 : 7 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="flex-1 bg-slate-100 rounded-t animate-pulse" 
                      style={{ height: `${[40,60,30,75,50,85,55,45,65,35,70,55][i % 12]}%` }}
                    />
                  ))}
                </div>
              ) : (
                chartData.map((d, i) => (
                  <div key={i} className="flex-1 h-full flex flex-col justify-end items-center group/bar min-w-[24px]">
                    <div
                      className={`w-full rounded-t transition-all duration-500 relative cursor-pointer ${d.active ? 'bg-gradient-to-t from-indigo-600 to-blue-500 shadow-sm' : 'bg-slate-200 hover:bg-blue-300'}`}
                      style={{ height: `${d.height}%` }}
                    >
                      {/* Tooltip Hover Modern */}
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md opacity-0 group-hover/bar:opacity-100 transition-opacity z-20 whitespace-nowrap pointer-events-none">
                        Rp {new Intl.NumberFormat('id-ID').format(d.value)}
                      </div>
                    </div>
                    
                    {(chartMode !== "bulan" || (i % 5 === 0 || i === chartData.length - 1)) && (
                      <span className={`text-[10px] font-bold mt-2 ${d.active ? 'text-blue-600' : 'text-slate-400'}`}>
                        {d.label}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-4 mt-4 border-t border-slate-50 pt-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-indigo-500 to-blue-500 inline-block" />
                Periode Aktif / Tertinggi
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-200 inline-block" />
                Periode Lainnya
              </div>
            </div>
          </div>

          {/* Sidebar Panel - Peringatan Menipisnya Stok */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 lg:p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-rose-50 text-rose-500 rounded-lg border border-rose-100">
                    <HiOutlineExclamation className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Peringatan Stok</h3>
                </div>
                {!loading && lowStockCount > 0 && (
                  <span className="bg-rose-500 text-white text-xs font-extrabold px-2 py-0.5 rounded-full">
                    {lowStockCount}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {loading ? (
                  <p className="text-xs text-slate-400 font-medium py-2">Memuat parameter inventaris...</p>
                ) : lowStockList.length > 0 ? (
                  lowStockList.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                      className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 hover:bg-slate-100/70 hover:border-slate-300 transition-all cursor-pointer group"
                    >
                      <span className="text-xs font-bold text-slate-600 truncate max-w-[150px] group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </span>
                      <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md ${product.stock <= 2 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                        Sisa {product.stock}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="bg-emerald-50/50 border border-dashed border-emerald-200 text-emerald-700 rounded-xl p-5 text-center flex flex-col items-center">
                    <HiOutlineCheckCircle className="w-8 h-8 text-emerald-500 mb-1.5" />
                    <p className="text-xs font-bold">Semua Aman!</p>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">Seluruh gudang produk memiliki kapasitas stok di atas batas minimum.</p>
                  </div>
                )}

                {!loading && lowStockCount > 5 && (
                  <p className="text-[11px] text-center text-slate-400 font-semibold pt-1">
                    + {lowStockCount - 5} item kritis lainnya
                  </p>
                )}
              </div>
            </div>

            <Link
              to="/admin/products"
              className="mt-5 w-full bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs py-3 rounded-xl text-center flex items-center justify-center gap-1.5 transition-colors"
            >
              Kelola Inventaris <HiOutlineArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>

        {/* DATATABLE DATA TRANSAKSI TERBARU */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-slate-50/40">
            <div>
              <h3 className="text-base font-bold text-slate-900">Pesanan Terkini</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">5 log transaksi terakhir sistem e-commerce</p>
            </div>
            <Link 
              to="/admin/orders" 
              className="bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 font-bold text-xs px-4 py-2 rounded-xl transition-colors w-fit"
            >
              Lihat Seluruh Pesanan
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  {["Nomor Invoice", "Pelanggan", "Total Pembayaran", "Pengiriman", "Status Transaksi", "Tanggal Masuk"].map(h => (
                    <th key={h} className="px-6 py-3.5 font-bold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-slate-400 font-medium">
                      Mengintegrasikan log data terbaru...
                    </td>
                  </tr>
                ) : validRecentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-slate-400 font-medium">
                      Belum ada entri transaksi masuk.
                    </td>
                  </tr>
                ) : (
                  validRecentOrders.slice(0, 5).map((order, index) => {
                    let customerName = 'Guest';
                    if (order.customer_name) customerName = order.customer_name;
                    else if (order.user?.name) customerName = order.user.name;
                    else if (order.name) customerName = order.name;
                    else if (order.shipping_address) {
                      const parts = order.shipping_address.split('|');
                      customerName = parts[0] ? parts[0].trim() : 'Guest';
                    }
                    
                    const price = Number(order.total_price || order.total || 0);
                    
                    let formattedDate = '-';
                    if (order.created_at) {
                      formattedDate = new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                    } else if (order.date) {
                      formattedDate = order.date;
                    }

                    const invoiceStr = order.invoice_number || order.invoice || `INV-${order.id}`;
                    const courierStr = order.shipping_courier || order.courier || '-';
                    
                    return (
                      <TableRow 
                        key={order.id || index} 
                        invoice={invoiceStr}
                        name={customerName}
                        total={`Rp ${new Intl.NumberFormat('id-ID').format(price)}`}
                        courier={String(courierStr).toUpperCase()}
                        status={order.status || 'pending'}
                        date={formattedDate}
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                      />
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}

/* ===== SUB COMPONENT ROW DATA LIST ===== */
function TableRow({ invoice, name, total, courier, status, date, onClick }) {
  const statusConfig = {
    pending:     { label: "Menunggu", bg: "bg-amber-50 border-amber-200 text-amber-800", dot: "bg-amber-500" },
    processing: { label: "Diproses", bg: "bg-blue-50 border-blue-200 text-blue-800", dot: "bg-blue-500" },
    shipped:    { label: "Dikirim",  bg: "bg-purple-50 border-purple-200 text-purple-800", dot: "bg-purple-500" },
    completed:  { label: "Selesai",  bg: "bg-emerald-50 border-emerald-200 text-emerald-800", dot: "bg-emerald-500" },
    cancelled:  { label: "Dibatalkan", bg: "bg-rose-50 border-rose-200 text-rose-800", dot: "bg-rose-500" }
  };
  
  const s = statusConfig[String(status).toLowerCase()] || { label: status, bg: "bg-slate-50 border-slate-200 text-slate-800", dot: "bg-slate-400" };

  return (
    <tr 
      onClick={onClick}
      className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
    >
      <td className="px-6 py-4 font-bold text-blue-600 group-hover:text-blue-800 transition-colors">{invoice}</td>
      <td className="px-6 py-4 text-slate-600 font-semibold">{name}</td>
      <td className="px-6 py-4 font-bold text-slate-900">{total}</td>
      <td className="px-6 py-4">
        <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
          {courier}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1.5 border px-2.5 py-0.5 rounded-full text-[11px] font-bold ${s.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full inline-block ${s.dot}`} />
          {s.label}
        </span>
      </td>
      <td className="px-6 py-4 text-slate-400 font-medium">{date}</td>
    </tr>
  );
}