import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import Swal from 'sweetalert2';

import {
  HiOutlineShoppingCart,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineSearch,
  HiOutlineUser,
  HiOutlineShoppingBag,
  HiOutlineHeart,
  HiOutlineLogout,
  HiUser,
  HiOutlineBell
} from 'react-icons/hi';

/* ─── SearchBar ─────────────────────────────────────────────────── */
function SearchBar({ searchTerm, setSearchTerm, onSearch, isMobile = false }) {
  return (
    <div className="relative w-full">
      <form onSubmit={onSearch} className="relative flex items-center">
        <input
          type="text"
          placeholder="Cari produk audio mobil..."
          className={`w-full ${isMobile ? 'pl-4 pr-10 py-2.5' : 'pl-4 pr-10 py-2'}
            rounded-none border border-stone-200 focus:border-blue-500 focus:outline-none
            transition-colors duration-200 bg-stone-50 text-stone-800
            placeholder-stone-400 text-sm font-medium tracking-wide`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          type="submit"
          className="absolute right-3 p-1 text-stone-400 hover:text-blue-600 transition-colors"
        >
          <HiOutlineSearch className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

/* ─── NotificationIcon ──────────────────────────────────────────── */
function NotificationIcon() {
  const [hasUnread, setHasUnread] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const fetchUnreadStatus = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const response = await axios.get(`${API_BASE_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const unreadExists = response.data.notifications.some(
          n => n.read_at === null && n.is_read != 1 && n.is_read !== true
        );
        setHasUnread(unreadExists);
      } catch (error) {
        console.error('Gagal memeriksa status notifikasi:', error);
      }
    };
    fetchUnreadStatus();
  }, [location.pathname]);

  return (
    <Link
      to="/notifications"
      className="relative flex items-center p-2 text-slate-700 hover:text-blue-600 transition-colors"
    >
      <HiOutlineBell className="w-5 h-5" />
      {hasUnread && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
      )}
    </Link>
  );
}

/* ─── CartIcon ──────────────────────────────────────────────────── */
function CartIcon({ itemCount }) {
  return (
    <Link
      to="/cart"
      className="relative flex items-center p-2 text-slate-700 hover:text-blue-600 transition-colors"
    >
      <HiOutlineShoppingCart className="w-5 h-5" />
      {itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-blue-500 text-white text-[9px] font-bold
          min-w-[16px] h-[16px] flex items-center justify-center rounded-full">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  );
}

/* ─── UserDropdown ──────────────────────────────────────────────── */
function UserDropdown({ user, onLogout, isOpen, onToggle }) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onToggle(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onToggle]);

  const menuItems = [
    { icon: HiOutlineUser, label: 'Profil Saya', path: '/profile' },
    { icon: HiOutlineShoppingBag, label: 'Pesanan Saya', path: '/orders' },
    { icon: HiOutlineHeart, label: 'Favorit Saya', path: '/wishlist' },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => onToggle(!isOpen)}
        className="flex items-center gap-2 p-2 text-slate-700 hover:text-blue-600 rounded transition-colors"
      >
        <HiUser className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-4 w-55 bg-white border border-stone-200 shadow-xl z-50">
          <div className="px-5 py-4 border-b border-stone-100 bg-stone-50">
            <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-widest mb-0.5">Selamat Datang</p>
            <p className="font-semibold text-stone-800 text-sm truncate">{user.name}</p>
          </div>
          <div className="py-1.5">
            {menuItems.map((item, idx) => (
              <Link
                key={idx}
                to={item.path}
                className="flex items-center gap-3 px-5 py-2.5 text-sm text-stone-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                onClick={() => onToggle(false)}
              >
                <item.icon className="w-4 h-4 text-stone-400" />
                <span>{item.label}</span>
              </Link>
            ))}
            <div className="my-1 border-t border-stone-100" />
            <button
              onClick={onLogout}
              className="flex w-full items-center gap-3 px-5 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
            >
              <HiOutlineLogout className="w-4 h-4" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Navbar Utama ──────────────────────────────────────────────── */
export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  const { cartItems } = useCart() || { cartItems: [] };
  const displayCartCount = cartItems?.length || 0;
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm)}`);
      setIsMenuOpen(false);
      setSearchTerm('');
    }
  };

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    setIsMenuOpen(false);
    const result = await Swal.fire({
      title: 'Keluar dari Akun?',
      text: 'Anda harus masuk kembali untuk berbelanja.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal',
      buttonsStyling: false,
      customClass: {
        popup: 'rounded-none shadow-xl border border-stone-200',
        confirmButton: 'bg-red-600 text-white px-4 py-2 font-semibold hover:bg-red-700 mx-2',
        cancelButton: 'bg-white border border-stone-200 text-stone-700 px-4 py-2 font-semibold hover:bg-stone-50 mx-2'
      }
    });
    if (result.isConfirmed) {
      logout();
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/';
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      className={`bg-white sticky top-0 z-50 transition-all duration-300 font-sans
        ${isScrolled ? 'shadow-sm border-b border-stone-200' : 'border-b border-stone-100'}`}
      style={{ fontFamily: "'DM Sans', 'Outfit', sans-serif" }}
    >
      {/* Top banner */}
      <div className="bg-stone-900 text-center py-2 px-4 hidden md:block">
        <p className="text-[11px] text-slate-300 tracking-widest uppercase font-medium">
          Spesialis Audio Mobil Premium &nbsp;·&nbsp; Garansi Resmi &nbsp;·&nbsp; Pengiriman Seluruh Indonesia
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-6">

          {/* KELOMPOK KIRI: LOGO & SEARCH BAR */}
          <div className="flex items-center gap-8 flex-1">
            <Link to="/" className="flex items-center gap-3 shrink-0 group">
              <div className="flex items-end gap-[3px] h-6">
                {[3, 5, 7, 5, 3].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-blue-500 rounded-full group-hover:bg-blue-600 transition-colors"
                    style={{ height: `${h * 3}px` }}
                  />
                ))}
              </div>
              <div className="flex flex-col leading-none">
                <span
                  className="text-lg font-black text-stone-900 tracking-tight"
                  style={{ letterSpacing: '-0.03em' }}
                >
                  KHAIRUL<span className="text-blue-500">AUDIO</span>
                </span>
                <span className="text-[9px] text-stone-400 tracking-[0.2em] uppercase font-medium">
                  Car Audio Specialist
                </span>
              </div>
            </Link>

            <div className="hidden md:block flex-1 max-w-md">
              <SearchBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onSearch={handleSearch}
              />
            </div>
          </div>

          {/* KELOMPOK KANAN: MENU & ACTIONS */}
          <div className="flex items-center gap-4 md:gap-8 shrink-0">
            <div className="hidden md:flex items-center gap-7">
              {[
                { label: 'Beranda', path: '/' },
                { label: 'Katalog', path: '/products' },
                { label: 'Tentang', path: '/tentang' },
              ].map(({ label, path }) => (
                <Link
                  key={path}
                  to={path}
                  className={`text-[13px] font-semibold tracking-wide transition-colors relative pb-0.5
                    ${isActive(path)
                      ? 'text-blue-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-blue-500'
                      : 'text-slate-700 hover:text-blue-600'
                    }`}
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <NotificationIcon />
              <CartIcon itemCount={displayCartCount} />

              {/* Tampilan Desktop untuk User Dropdown */}
              <div className="hidden md:block">
                {user ? (
                  <UserDropdown
                    user={user}
                    onLogout={handleLogout}
                    isOpen={isDropdownOpen}
                    onToggle={setIsDropdownOpen}
                  />
                ) : (
                  <div className="flex items-center gap-3 ml-2 border-l border-stone-200 pl-4">
                    <Link to="/login" className="text-[13px] font-semibold text-slate-700 hover:text-blue-600 transition-colors">
                      Masuk
                    </Link>
                    <Link to="/register" className="text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 transition-colors">
                      Daftar
                    </Link>
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden text-stone-600 hover:text-blue-600 p-2 transition-colors ml-1"
              >
                {isMenuOpen ? <HiOutlineX className="w-5 h-5" /> : <HiOutlineMenu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-stone-100 shadow-lg absolute w-full left-0 z-50">
          <div className="px-4 pt-4 pb-6 space-y-4">
            <SearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onSearch={handleSearch}
              isMobile
            />

            <div className="flex flex-col space-y-0.5 border-b border-stone-100 pb-4">
              {[
                { label: 'Beranda', path: '/' },
                { label: 'Katalog Produk', path: '/products' },
                { label: 'Tentang Kami', path: '/tentang' },
              ].map(({ label, path }) => (
                <Link
                  key={path}
                  to={path}
                  className={`px-3 py-2.5 text-sm font-semibold rounded transition-colors
                    ${isActive(path)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-700 hover:bg-stone-50'
                    }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </div>

            {user ? (
              <div className="space-y-0.5">
                <div className="px-3 py-2.5 bg-stone-50 border border-stone-100 mb-2">
                  <p className="text-[10px] text-stone-400 uppercase tracking-widest font-medium">Masuk sebagai</p>
                  <p className="font-semibold text-stone-800 text-sm truncate">{user.name}</p>
                </div>

                {[
                  { iconComponent: HiOutlineUser, label: 'Profil Saya', path: '/profile' },
                  { iconComponent: HiOutlineShoppingBag, label: 'Pesanan Saya', path: '/orders' },
                  { iconComponent: HiOutlineHeart, label: 'Favorit Saya', path: '/wishlist' },
                ].map((item, idx) => {
                  const ItemIcon = item.iconComponent;
                  return (
                    <Link
                      key={idx}
                      to={item.path}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-stone-600 hover:bg-blue-50 rounded"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <ItemIcon className="w-4 h-4 text-stone-400" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 rounded mt-1"
                >
                  <HiOutlineLogout className="w-4 h-4" />
                  Keluar
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 pt-1">
                <Link
                  to="/login"
                  className="w-full text-center border border-stone-200 text-stone-700 font-semibold py-2.5 text-sm hover:bg-stone-50 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  className="w-full text-center bg-blue-600 text-white font-semibold py-2.5 text-sm hover:bg-blue-700 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Daftar Sekarang
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}