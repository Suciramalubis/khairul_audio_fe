// Lokasi: src/pages/admin/NotificationAdmin.jsx

import React, { useState, useEffect } from 'react';
import {
  HiOutlineShoppingBag,
  HiOutlineExclamation,
  HiOutlineInformationCircle,
  HiOutlineTrash,
  HiArrowRight
} from 'react-icons/hi';
import { useOutletContext, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../../config/api';

export default function NotificationAdmin() {
  const context = useOutletContext();
  const setHasUnreadNotif = context?.setHasUnreadNotif;
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // MENGAMBIL DATA DARI DATABASE (LARAVEL)
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/admin/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const formattedData = res.data
        .filter(n => new Date(n.created_at) >= sevenDaysAgo)
        .map(n => ({
          ...n,
          // ✅ PERBAIKAN: Memastikan semua tipe data (int, string, boolean) terbaca benar
          isRead: n.is_read == 1 || n.is_read === true || n.is_read === '1',
          time: new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        }));

      setNotifications(formattedData);
    } catch (error) {
      console.error("Gagal memuat notifikasi:", error);
      Swal.fire({
        icon: 'error',
        title: 'Oops!',
        text: 'Gagal memuat notifikasi. Pastikan server Laravel sudah nyala ya!',
        confirmButtonColor: '#2563eb'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (setHasUnreadNotif) {
      const hasUnread = notifications.some(notif => notif.isRead === false);
      setHasUnreadNotif(hasUnread);
    }
  }, [notifications, setHasUnreadNotif]);

  // FUNGSI HANDLE KLIK NOTIFIKASI
  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
        await axios.put(`${API_BASE_URL}/admin/notifications/${notif.id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(notifications.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      } catch (error) {
        console.error("Gagal menandai baca:", error);
      }
    }

    if (notif.order_id) {
      navigate(`/admin/orders/${notif.order_id}`);
    } else {
      console.warn("Notifikasi ini tidak memiliki ID Pesanan.");
    }
  };

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
      await axios.put(`${API_BASE_URL}/admin/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Gagal menandai semua:", error);
    }
  };

  // FUNGSI HAPUS NOTIFIKASI (SATUAN)
  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Mencegah event klik menjalar

    Swal.fire({
      title: 'Hapus Notifikasi?',
      text: "Notifikasi ini akan dihapus permanen.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#e5e7eb',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: '<span style="color: #374151">Batal</span>'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
          await axios.delete(`${API_BASE_URL}/admin/notifications/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          // Hilangkan dari tampilan UI
          setNotifications(notifications.filter(n => n.id !== id));

          Swal.fire({
            title: "Terhapus!",
            text: "Notifikasi telah dibuang.",
            icon: "success",
            toast: true,
            position: "top-end",
            timer: 2000,
            showConfirmButton: false
          });
        } catch (error) {
          console.error("Gagal menghapus:", error);
          Swal.fire("Error", "Gagal menghapus notifikasi.", "error");
        }
      }
    });
  };

  // Helper Ikon Enterprise Style
  const getIcon = (title) => {
    const t = String(title).toLowerCase();
    if (t.includes('pesanan') || t.includes('pembayaran') || t.includes('order')) {
      return <div className="p-2.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg"><HiOutlineShoppingBag className="w-5 h-5" /></div>;
    }
    if (t.includes('stok') || t.includes('batal') || t.includes('gagal')) {
      return <div className="p-2.5 bg-red-50 border border-red-100 text-red-600 rounded-lg"><HiOutlineExclamation className="w-5 h-5" /></div>;
    }
    return <div className="p-2.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg"><HiOutlineInformationCircle className="w-5 h-5" /></div>;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium text-sm">Memuat notifikasi...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-10 font-sans text-gray-900 animate-fadeIn">

      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notifikasi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Menampilkan aktivitas 7 hari terakhir</p>
        </div>
        <button
          onClick={markAllRead}
          className="text-sm font-medium text-gray-700 bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
        >
          Tandai semua dibaca
        </button>
      </div>

      {/* List Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {notifications.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`relative p-5 flex gap-4 transition-colors cursor-pointer group ${!notif.isRead ? 'bg-blue-50/30' : 'bg-white hover:bg-gray-50'
                  }`}
              >
                {/* Indikator Unread Line Kiri (Enterprise Style) */}
                {!notif.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                )}

                {/* Ikon Kiri */}
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(notif.title)}
                </div>

                {/* Konten Tengah */}
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`text-sm truncate pr-4 ${!notif.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                      {notif.time}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 line-clamp-2">
                    {notif.message}
                  </p>

                  {/* Tautan Detail */}
                  {notif.order_id && (
                    <div className="mt-2 flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">
                      Lihat Detail Pesanan <HiArrowRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Kolom Kanan: Tombol Hapus & Titik Unread (Mobile) */}
                <div className="flex flex-col items-end justify-start gap-2 flex-shrink-0">
                  <button
                    onClick={(e) => handleDelete(e, notif.id)}
                    title="Hapus Notifikasi"
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <HiOutlineTrash className="w-5 h-5" />
                  </button>

                  {/* Titik indikator cadangan untuk unread jika diperlukan tambahan visual */}
                  {!notif.isRead && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full sm:hidden mt-2 mr-1"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mb-4">
              <HiOutlineInformationCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-1">Tidak ada notifikasi</h3>
            <p className="text-sm text-gray-500">
              Belum ada notifikasi baru dalam 7 hari terakhir.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}