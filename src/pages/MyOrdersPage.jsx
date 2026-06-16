import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  HiOutlineShoppingBag,
  HiOutlineArchive,
  HiOutlineClock,
  HiOutlineCog,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiArrowRight,
  HiOutlineSearch
} from "react-icons/hi";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://127.0.0.1:8000/api/user/orders",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setOrders(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Gagal ambil pesanan", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMyOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "processing") {
      return order.status === "pending" || order.status === "processing";
    }
    return order.status === activeFilter;
  });

  const getStatusConfig = (status) => {
    const s = String(status).toLowerCase();
    switch (s) {
      case "pending":
        return { label: "Menunggu Pembayaran", icon: HiOutlineClock, color: "text-blue-700", bg: "bg-blue-50", borderColor: "border-blue-200" };
      case "processing":
        return { label: "Diproses", icon: HiOutlineCog, color: "text-blue-700", bg: "bg-blue-50", borderColor: "border-blue-200" };
      case "shipped":
        return { label: "Dikirim", icon: HiOutlineTruck, color: "text-indigo-700", bg: "bg-indigo-50", borderColor: "border-indigo-200" };
      case "completed":
        return { label: "Selesai", icon: HiOutlineCheckCircle, color: "text-emerald-700", bg: "bg-emerald-50", borderColor: "border-emerald-200" };
      case "cancelled":
        return { label: "Dibatalkan", icon: HiOutlineXCircle, color: "text-red-700", bg: "bg-red-50", borderColor: "border-red-200" };
      default:
        return { label: s, icon: HiOutlineCheckCircle, color: "text-gray-700", bg: "bg-gray-50", borderColor: "border-gray-200" };
    }
  };

  const tabs = [
    { id: "all", label: "Semua" },
    { id: "processing", label: "Diproses" },
    { id: "shipped", label: "Dikirim" },
    { id: "completed", label: "Selesai" },
    { id: "cancelled", label: "Dibatalkan" },
  ];

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 animate-pulse">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <div className="h-4 bg-slate-200 rounded w-32"></div>
            <div className="h-6 bg-slate-200 rounded-full w-24"></div>
          </div>
          <div className="flex gap-4">
            <div className="w-16 h-16 bg-slate-100 rounded-xl"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-2/3"></div>
              <div className="h-3 bg-slate-100 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-5 max-w-7xl">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Riwayat Pesanan</h1>
          <p className="text-slate-500 mt-1 text-sm">Pantau status dan detail setiap transaksi audio mobil Anda.</p>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar border-b border-slate-200 mb-6">
          <div className="flex space-x-6 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`pb-3 text-sm font-semibold transition-all duration-200 relative whitespace-nowrap ${
                  activeFilter === tab.id
                    ? "text-blue-600"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
                {activeFilter === tab.id && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-full"></span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <LoadingSkeleton />
        ) : filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;
              const productName = order.product_name || "Produk Telah Dihapus";
              const isDeleted = !order.product_name;
              const imageUrl = order.product_image
                ? order.product_image.startsWith("http")
                  ? order.product_image
                  : `http://127.0.0.1:8000${order.product_image}`
                : null;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  {/* Header Card */}
                  <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3 bg-slate-50/30">
                    <div className="flex items-center gap-3 text-sm">
                      <HiOutlineShoppingBag className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-700">{order.date}</span>
                      <span className="hidden sm:inline-block w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span className="text-slate-500 font-mono text-xs">
                        {order.invoice || order.invoice_number || `INV-${order.id}`}
                      </span>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.borderColor}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span className="text-xs font-semibold">{statusConfig.label}</span>
                    </div>
                  </div>

                  {/* Body Card */}
                  <div className="p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
                    <div className="flex gap-4 items-center flex-1 w-full">
                      <div className="w-16 h-16 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {imageUrl ? (
                          <img src={imageUrl} alt={productName} className="w-full h-full object-cover" />
                        ) : (
                          <HiOutlineArchive className="text-slate-400 w-6 h-6" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-slate-800 text-base truncate ${isDeleted ? "line-through text-slate-400" : ""}`}>
                          {productName}
                        </h3>
                        <p className="text-sm text-slate-500 mt-0.5">{order.items_count} Barang</p>
                      </div>
                    </div>

                    <div className="flex flex-col w-full sm:w-auto sm:text-right sm:border-l sm:border-slate-100 sm:pl-6">
                      <span className="text-xs text-slate-500 mb-0.5">Total Belanja</span>
                      <span className="font-bold text-slate-900 text-lg">
                        Rp {new Intl.NumberFormat("id-ID").format(order.total || order.total_price)}
                      </span>
                    </div>
                  </div>

                  {/* Footer Card */}
                  <div className="px-5 py-4 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all duration-200"
                    >
                      Lihat Detail
                      <HiArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 py-16 px-6 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <HiOutlineSearch className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Belum Ada Pesanan</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Anda belum memiliki pesanan. Mulai belanja perlengkapan audio mobil terbaik sekarang.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all"
            >
              Mulai Belanja <HiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}