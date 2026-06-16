import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  HiOutlineBell, 
  HiCheck, 
  HiArrowLeft, 
  HiOutlineShoppingBag,
  HiOutlineTag,
  HiOutlineTruck,
  HiDotsVertical,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiVolumeUp,
  HiArrowRight
} from 'react-icons/hi';
import { Link, useNavigate } from 'react-router-dom';

export default function NotificationPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMenu, setActionMenu] = useState(null);
  const [activeTab, setActiveTab] = useState('Semua');
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://127.0.0.1:8000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const formattedData = response.data.notifications
        .filter(n => new Date(n.created_at) >= sevenDaysAgo)
        .map(n => ({
          ...n,
          isRead: n.read_at !== null || n.is_read == 1 || n.is_read === true, 
          time: new Date(n.created_at).toLocaleDateString('id-ID', { 
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
          }),
          safeTitle: n.title || 'Informasi',
          safeMessage: n.message || 'Ada pembaruan dari sistem.'
        }));

      setNotifications(formattedData);
    } catch (error) {
      console.error("Error fetching notifications", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://127.0.0.1:8000/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, isRead: true, read_at: new Date().toISOString() } : notif
        )
      );
    } catch (error) {
      console.error("Error marking as read", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://127.0.0.1:8000/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true, read_at: new Date().toISOString() }))
      );
    } catch (error) {
      console.error("Error marking all as read", error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://127.0.0.1:8000/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      setActionMenu(null);
    } catch (error) {
      console.error("Error deleting notification", error);
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      markAsRead(notif.id);
    }
    if (notif.order_id) {
      navigate(`/orders/${notif.order_id}`);
    }
  };

  const getNotificationStyle = (titleStr) => {
    const t = String(titleStr).toLowerCase();
    if (t.includes('pesanan') || t.includes('bayar') || t.includes('order')) {
      return { icon: <HiOutlineShoppingBag className="w-5 h-5" />, bg: 'bg-emerald-50 text-emerald-600' };
    }
    if (t.includes('stok') || t.includes('batal') || t.includes('gagal')) {
      return { icon: <HiOutlineTag className="w-5 h-5" />, bg: 'bg-rose-50 text-rose-600' };
    }
    if (t.includes('kirim') || t.includes('resi') || t.includes('kurir')) {
      return { icon: <HiOutlineTruck className="w-5 h-5" />, bg: 'bg-blue-50 text-blue-600' };
    }
    return { icon: <HiOutlineCheckCircle className="w-5 h-5" />, bg: 'bg-slate-100 text-slate-600' };
  };

  const filteredNotifications = notifications.filter(notif => {
    if (activeTab === 'Semua') return true;
    const t = String(notif.safeTitle).toLowerCase();
    if (activeTab === 'Pesanan' && (t.includes('pesanan') || t.includes('bayar'))) return true;
    if (activeTab === 'Promo' && t.includes('promo')) return true;
    return false;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white font-sans pb-12">
      
      {/* Header Modern */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              to="/" 
              className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all"
            >
              <HiArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                Notifikasi
                {unreadCount > 0 && (
                  <span className="bg-blue-500 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    {unreadCount} baru
                  </span>
                )}
              </h1>
            </div>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              <HiCheck className="w-4 h-4" />
              Tandai semua dibaca
            </button>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto mt-5 px-4 sm:px-5">
        
        {/* Tabs bergaya modern */}
        {notifications.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-1 mb-5">
            <div className="flex gap-1">
              {['Semua', 'Pesanan', 'Promo'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                    activeTab === tab 
                      ? 'bg-slate-900 text-white shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* List Notifikasi */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-white rounded-xl border border-slate-200 p-4 flex gap-3 animate-pulse">
                <div className="w-10 h-10 bg-slate-200 rounded-full flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                  <div className="h-3 bg-slate-200 rounded w-full"></div>
                  <div className="h-3 bg-slate-200 rounded w-4/5"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            {filteredNotifications.map((notif) => {
              const style = getNotificationStyle(notif.safeTitle);
              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`relative bg-white rounded-xl border transition-all duration-200 cursor-pointer group overflow-hidden ${
                    !notif.isRead 
                      ? 'border-l-4 border-l-blue-500 shadow-sm hover:shadow-md' 
                      : 'border border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="p-4 flex gap-3.5">
                    {/* Icon Area */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                      {style.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <h4 className={`text-[15px] ${!notif.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                            {notif.safeTitle}
                          </h4>
                          <p className={`text-[13px] mt-1 leading-relaxed ${!notif.isRead ? 'text-slate-700' : 'text-slate-500'}`}>
                            {notif.safeMessage}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-2.5">
                            <span className="text-[11px] text-slate-400 font-medium">
                              {notif.time}
                            </span>
                            {notif.order_id && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 group-hover:text-blue-700">
                                Lihat pesanan <HiArrowRight className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Menu Tiga Titik */}
                        <div className="relative flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenu(actionMenu === notif.id ? null : notif.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                          >
                            <HiDotsVertical className="w-4 h-4" />
                          </button>
                          {actionMenu === notif.id && (
                            <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                              {!notif.isRead && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notif.id);
                                    setActionMenu(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <HiCheck className="w-4 h-4 text-blue-500" />
                                  Tandai dibaca
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notif.id);
                                }}
                                className="w-full px-3 py-2 text-left text-[13px] font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <HiOutlineTrash className="w-4 h-4" />
                                Hapus
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State Modern */
          <div className="bg-white rounded-xl border border-slate-200 py-16 px-6 text-center mt-8">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <HiVolumeUp className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Tidak ada notifikasi</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
              Belum ada pemberitahuan baru. Status pesanan, promo menarik, dan informasi instalasi audio akan muncul di sini.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-all active:scale-95"
            >
              Jelajahi produk <HiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}