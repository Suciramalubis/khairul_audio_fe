// Lokasi: src/components/AdminLayout.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  HiOutlineCube, 
  HiOutlineClipboardList, 
  HiOutlineLogout,
  HiOutlineUserCircle,
  HiOutlineBell,
  HiOutlineExternalLink,
  HiOutlineMenuAlt2,
  HiOutlineChevronDown,
  HiOutlineChartPie,
  HiX // Icon silang untuk menutup menu di mobile
} from 'react-icons/hi';

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State untuk mengontrol sidebar di Desktop (collapsed/expanded)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // State BARU untuk mengontrol sidebar di Mobile (terbuka/tertutup)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [hasUnreadNotif, setHasUnreadNotif] = useState(false); 
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Menutup menu mobile otomatis setiap kali pindah halaman
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const fetchGlobalNotificationStatus = async () => {
      try {
        const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
        if (!token) return;

        const res = await axios.get("/api/admin/notifications", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Memperbaiki potensi error TypeError: res.data.some is not a function
        const notifArray = res.data.data || res.data.notifications || res.data;
        if (Array.isArray(notifArray)) {
           const hasUnread = notifArray.some(n => n.is_read == 0 || n.is_read === false || n.is_read === '0');
           setHasUnreadNotif(hasUnread);
        } else {
           setHasUnreadNotif(false); 
        }

      } catch (error) {
        console.error("Gagal sinkronisasi titik notifikasi:", error);
      }
    };
    
    fetchGlobalNotificationStatus();
  }, [location.pathname]); 

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isUserMenuOpen && !event.target.closest('.user-menu')) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isUserMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebarDesktop = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden relative">
      
      {/* ==============================
          MOBILE OVERLAY (Layar Gelap)
         ============================== */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ==============================
                   SIDEBAR
         ============================== */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50 flex flex-col flex-shrink-0 bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? 'lg:w-20' : 'w-64'}
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Logo & Tombol Close (Mobile) */}
        <div className="h-16 flex items-center justify-between lg:justify-center px-4 lg:px-0 border-b border-slate-800">
          {!isSidebarCollapsed ? (
            <span className="font-bold text-xl tracking-tight text-white">
              Khairul<span className="text-amber-500">Audio</span>
            </span>
          ) : (
            <span className="font-bold text-xl text-amber-500 hidden lg:block">K<span className="text-white">A</span></span>
          )}
          
          {/* Tombol Tutup Sidebar (Hanya terlihat di Mobile saat menu terbuka) */}
          <button 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        {/* Menu List */}
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          
          <MenuLabel label="Overview" collapsed={isSidebarCollapsed} />
          <NavLink to="/admin/dashboard" icon={<HiOutlineChartPie />} label="Dashboard" active={location.pathname === '/admin/dashboard'} collapsed={isSidebarCollapsed} />
          
          <MenuLabel label="Manajemen" collapsed={isSidebarCollapsed} />
          <NavLink to="/admin/products" icon={<HiOutlineCube />} label="Produk" active={location.pathname === '/admin/products'} collapsed={isSidebarCollapsed} />
          <NavLink to="/admin/orders" icon={<HiOutlineClipboardList />} label="Pesanan" active={location.pathname === '/admin/orders'} collapsed={isSidebarCollapsed} />
          
          <MenuLabel label="Akun" collapsed={isSidebarCollapsed} />
          <NavLink to="/admin/profile" icon={<HiOutlineUserCircle />} label="Profil Saya" active={location.pathname === '/admin/profile'} collapsed={isSidebarCollapsed} />
        
        </nav>
      </aside>

      {/* ==============================
         MAIN CONTENT AREA
         ============================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* TOP NAVBAR */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 z-10 sticky top-0">
           
           {/* Left Side: Toggle & Title */}
           <div className="flex items-center gap-4">
             {/* Tombol Toggle Desktop (Tersembunyi di Mobile) */}
             <button
               onClick={toggleSidebarDesktop}
               className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors hidden lg:block"
               title="Toggle Sidebar"
             >
               <HiOutlineMenuAlt2 className="w-5 h-5" />
             </button>
             
             {/* Tombol Toggle Mobile (Tersembunyi di Desktop) */}
             <button
               onClick={() => setIsMobileMenuOpen(true)}
               className="p-2 -ml-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
               title="Buka Menu"
             >
               <HiOutlineMenuAlt2 className="w-6 h-6" />
             </button>

             <h1 className="text-lg font-semibold text-gray-800 line-clamp-1">
               {getPageTitle(location.pathname)}
             </h1>
           </div>

           {/* Right Side Actions */}
           <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">

             <Link 
               to="/" 
               target="_blank" 
               className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
             >
               <HiOutlineExternalLink className="w-4 h-4" />
               Lihat Toko
             </Link>

             <button 
               onClick={() => navigate('/admin/notifications')}
               className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors"
               title="Notifikasi"
             >
               <HiOutlineBell className="w-5 h-5" />
               {hasUnreadNotif && (
                 <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
               )}
             </button>

             <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>

             {/* User Menu */}
             <div className="relative user-menu">
               <button 
                 onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                 className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-50 transition-colors"
               >
                 <img 
                   src={`https://ui-avatars.com/api/?name=${user?.name || 'Admin'}&background=0f172a&color=fff`} 
                   alt="Admin" 
                   className="w-8 h-8 rounded-full object-cover border border-gray-200"
                 />
                 <div className="hidden md:block text-left mr-1">
                   <p className="text-sm font-medium text-gray-700 leading-none">{user?.name || 'Administrator'}</p>
                 </div>
                 <HiOutlineChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
               </button>

               {isUserMenuOpen && (
                 <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                   <div className="px-4 py-2 border-b border-gray-100 md:hidden">
                     <p className="text-sm font-medium text-gray-800">{user?.name || 'Administrator'}</p>
                     <p className="text-xs text-gray-500">Super Admin</p>
                   </div>
                   <button 
                     onClick={() => { handleLogout(); setIsUserMenuOpen(false); }}
                     className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                   >
                     <HiOutlineLogout className="w-4 h-4 text-red-400" />
                     Keluar
                   </button>
                 </div>
               )}
             </div>
           </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
           <div className="max-w-7xl mx-auto">
              <Outlet context={{ setHasUnreadNotif }} />
           </div>
        </main>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
}

// ==============================
// HELPER FUNCTIONS
// ==============================

function getPageTitle(pathname) {
  const titles = {
    '/admin/dashboard': 'Dashboard',
    '/admin/products': 'Manajemen Produk',
    '/admin/orders': 'Daftar Pesanan',
    '/admin/notifications': 'Notifikasi',
    '/admin/profile': 'Profil Saya'
  };
  return titles[pathname] || 'Admin Panel';
}

// ==============================
// SUB COMPONENTS
// ==============================

function MenuLabel({ label, collapsed }) {
  if (collapsed) {
    return <div className="h-4 hidden lg:block"></div>; 
  }
  
  return (
    <p className="px-6 mt-6 mb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
      {label}
    </p>
  );
}

function NavLink({ to, icon, label, active, badge, collapsed }) {
  return (
    <Link 
      to={to} 
      className={`
        group relative flex items-center justify-between py-2.5 transition-colors duration-200 text-sm font-medium
        ${active 
          ? 'bg-slate-800 text-white border-l-4 border-blue-500' 
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-l-4 border-transparent'
        }
        ${collapsed ? 'lg:px-0 lg:justify-center px-5' : 'px-5'}
      `}
      title={collapsed ? label : ''}
    >
      <div className={`flex items-center gap-3 ${collapsed ? 'lg:justify-center lg:w-full' : ''}`}>
        <span className={`text-lg ${active ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
          {icon}
        </span>
        
        {/* Teks label selalu muncul di HP, tapi bisa tersembunyi di Desktop jika collapsed */}
        <span className={collapsed ? 'lg:hidden block' : 'block'}>
          {label}
        </span>
      </div>
      
      {!collapsed && badge && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
          {badge}
        </span>
      )}

      {/* Tooltip for collapsed mode (Hanya tampil di Desktop) */}
      {collapsed && (
        <div className="hidden lg:block absolute left-full ml-3 px-2.5 py-1.5 bg-gray-800 text-white text-xs font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-md">
          {label}
        </div>
      )}
    </Link>
  );
}