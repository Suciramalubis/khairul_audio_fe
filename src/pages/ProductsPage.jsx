import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HiSearch,
  HiChevronDown,
  HiStar,
  HiOutlineHeart,
  HiOutlineShoppingBag,
  HiCheck,
  HiX
} from 'react-icons/hi';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { addToWishlist } from '../services/wishlistService';
import Swal from 'sweetalert2';
import { API_BASE_URL, getImageUrl } from '../config/api';

// Helper diskon
const getPriceInfo = (product) => {
  if (!product) return { hasDiscount: false, price: 0, originalPrice: 0 };
  const originalPrice = Number(product.price);
  if (product.discount_percent) {
    if (product.discount_end_date) {
      const endDate = new Date(product.discount_end_date);
      if (new Date() > endDate) {
        return { hasDiscount: false, price: originalPrice, originalPrice };
      }
    }
    const discountAmount = originalPrice * (Number(product.discount_percent) / 100);
    return {
      hasDiscount: true,
      price: originalPrice - discountAmount,
      originalPrice: originalPrice,
      percent: product.discount_percent,
    };
  }
  return { hasDiscount: false, price: originalPrice, originalPrice };
};

// --- Fungsi untuk menghitung rata-rata rating ---
const getAverageRating = (reviews) => {
  if (!reviews || reviews.length === 0) return 0;
  const total = reviews.reduce((acc, r) => acc + r.rating, 0);
  return total / reviews.length;
};

// =====================================================================
// KOMPONEN TOAST PREMIUM (Modern E-commerce Style)
// =====================================================================
const PremiumToast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] flex items-center justify-center animate-fade-up">
      <div className="bg-stone-900/95 backdrop-blur-md px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10">
        {type === 'success' ? (
          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
            <HiCheck className="w-3.5 h-3.5 text-white" />
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center">
            <HiX className="w-3.5 h-3.5 text-white" />
          </div>
        )}
        <span className="text-[13px] font-semibold tracking-wide text-white pr-1">
          {message}
        </span>
      </div>
    </div>
  );
};

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlistLoading, setWishlistLoading] = useState(null);
  const [cartLoading, setCartLoading] = useState(null);

  const [toast, setToast] = useState(null);

  const { addToCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('search') || '';
  const categoryQuery = searchParams.get('category') || '';

  const [selectedCategory, setSelectedCategory] = useState(categoryQuery);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const [sortBy, setSortBy] = useState('terbaru');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef(null);

  const categories = ['Head Unit', 'Speaker', 'Subwoofer', 'Power & DSP', 'Aksesoris'];

  const sortOptions = [
    { value: 'terbaru', label: 'Produk Terbaru' },
    { value: 'termurah', label: 'Harga Terendah' },
    { value: 'termahal', label: 'Harga Tertinggi' },
  ];

  useEffect(() => {
    function handleClickOutside(event) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setIsSortDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (categoryQuery) setSelectedCategory(categoryQuery);
  }, [categoryQuery]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    let result = [...products];

    if (searchQuery) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedCategory) {
      result = result.filter(
        (p) => p.category && p.category.name.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    if (minPrice) result = result.filter((p) => p.price >= parseInt(minPrice));
    if (maxPrice) result = result.filter((p) => p.price <= parseInt(maxPrice));

    if (sortBy === 'termurah') {
      result.sort((a, b) => getPriceInfo(a).price - getPriceInfo(b).price);
    } else if (sortBy === 'termahal') {
      result.sort((a, b) => getPriceInfo(b).price - getPriceInfo(a).price);
    } else {
      result.sort((a, b) => b.id - a.id);
    }

    setFilteredProducts(result);
  }, [products, searchQuery, selectedCategory, minPrice, maxPrice, sortBy]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/products`
      );
      let dataArray = res.data.data || res.data;
      setProducts(Array.isArray(dataArray) ? dataArray : []);
    } catch (error) {
      console.error('Gagal memuat produk:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    setCartLoading(product.id);
    addToCart(product, 1);
    showToast(`${product.name} masuk keranjang`, 'success');
    setTimeout(() => setCartLoading(null), 500);
  };

  const handleAddToWishlist = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem('token');

    if (!token) {
      Swal.fire({
        icon: 'warning',
        title: 'Harap Login',
        text: 'Silakan login terlebih dahulu untuk menyimpan ke Favorit.',
        confirmButtonColor: '#3b82f6',
        confirmButtonText: 'Menuju Login',
        customClass: {
          popup: 'rounded-2xl',
          confirmButton: 'rounded-xl font-bold px-6 py-2'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/login');
        }
      });
      return;
    }

    setWishlistLoading(product.id);
    try {
      await addToWishlist(product.id);
      showToast(`${product.name} disimpan ke favorit`, 'success');
    } catch (error) {
      const msg = error.response?.data?.message || 'Gagal menyimpan ke wishlist';
      showToast(msg, 'error');
    } finally {
      setWishlistLoading(null);
    }
  };

  const resetFilters = () => {
    navigate('/products');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('terbaru');
  };

  const navigateToCategory = (cat) => {
    if (cat === '') {
      navigate('/products');
      setSelectedCategory('');
    } else {
      navigate(`/products?category=${encodeURIComponent(cat)}`);
      setSelectedCategory(cat);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col relative overflow-hidden">
      <Navbar />
      <main className="flex-grow max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-6 md:py-6">

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {searchQuery ? `Hasil Pencarian "${searchQuery}"` : 'Katalog Produk'}
            </h1>
            <p className="text-gray-500 mt-2">
              Menampilkan {filteredProducts.length} produk audio mobil terbaik untuk kendaraan Anda.
            </p>
          </div>

          {/* Custom Dropdown Urutkan */}
          <div className="relative z-30" ref={sortDropdownRef}>
            <button
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
              className="flex items-center justify-between w-full lg:w-56 bg-white border border-gray-200 hover:border-blue-400 rounded-xl px-4 py-3 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-medium">Urutkan:</span>
                <span className="text-sm font-bold text-gray-900">
                  {sortOptions.find(opt => opt.value === sortBy)?.label}
                </span>
              </div>
              <HiChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isSortDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Menu Options */}
            {isSortDropdownOpen && (
              <div className="absolute right-0 mt-2 w-full lg:w-56 bg-white border border-gray-100 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden animate-slide-down origin-top">
                <div className="py-1">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setIsSortDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${sortBy === option.value
                          ? 'bg-blue-50 text-blue-700 font-bold border-l-2 border-blue-500'
                          : 'text-gray-600 hover:bg-gray-50 font-medium border-l-2 border-transparent'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Kategori */}
        <div className="mb-6 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-3 min-w-max">
            <button
              onClick={() => navigateToCategory('')}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition whitespace-nowrap ${selectedCategory === ''
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-500 hover:text-blue-600 hover:shadow-sm'
                }`}
            >
              Semua Produk
            </button>
            {categories.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => navigateToCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition whitespace-nowrap ${selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-500 hover:text-blue-600 hover:shadow-sm'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Loading atau Produk */}
        {loading ? (
          <div className="flex justify-center items-center h-72">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-14 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
              <HiSearch className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Produk Tidak Ditemukan</h2>
            <p className="text-gray-500 mt-2 mb-6">Coba gunakan kata kunci lain atau ubah filter pencarian.</p>
            <button onClick={resetFilters} className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition shadow-md shadow-blue-600/20">
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {filteredProducts.map((product) => {
              let imgUrl = product.image_url || product.image || product.gambar || null;
              imgUrl = getImageUrl(imgUrl);

              const priceInfo = getPriceInfo(product);
              const isCartLoading = cartLoading === product.id;
              const isWishlistLoading = wishlistLoading === product.id;

              // --- LOGIC PERHITUNGAN RATING & TERJUAL ---
              const reviews = product.reviews || [];
              const averageRating = getAverageRating(reviews);
              const reviewCount = reviews.length;

              let soldCount = Number(product.total_sold || product.sold_count || 0);
              if (soldCount === 0 && reviewCount > 0) {
                soldCount = reviewCount;
              }

              return (
                <div
                  key={product.id}
                  className="bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden group relative"
                >
                  {/* Tombol Wishlist */}
                  <button
                    onClick={(e) => handleAddToWishlist(e, product)}
                    disabled={isWishlistLoading}
                    className="absolute top-2 right-2 z-20 p-2 bg-white/90 backdrop-blur rounded-full text-slate-400 hover:text-rose-500 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-all border border-slate-100"
                    title="Simpan ke Wishlist"
                  >
                    {isWishlistLoading ? (
                      <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <HiOutlineHeart className="w-4 h-4" />
                    )}
                  </button>

                  {/* Gambar */}
                  <Link to={`/product/${product.id}`} className="relative w-full bg-gray-50 overflow-hidden block" style={{ paddingBottom: '100%' }}>
                    {priceInfo.hasDiscount && (
                      <div className="absolute top-2 left-2 z-10 bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded shadow-md">
                        {priceInfo.percent}% OFF
                      </div>
                    )}
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={product.name}
                        className="absolute top-0 left-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                        <span className="text-xs text-slate-400">No Image</span>
                      </div>
                    )}
                  </Link>

                  {/* Info Produk */}
                  <div className="p-3 flex flex-col gap-1.5 border-t border-slate-50 flex-grow justify-between">
                    <Link to={`/product/${product.id}`} className="flex flex-col h-full">
                      {product.category && (
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">
                          {product.category.name}
                        </span>
                      )}
                      <h4 className="text-[13px] text-slate-800 font-bold line-clamp-2 leading-snug mt-1">
                        {product.name}
                      </h4>
                      
                      {/* --- TAMPILAN RATING & TERJUAL (ASLI) --- */}
                      <div className="flex items-center gap-1 mt-1.5">
                        <HiStar className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span className="text-[11px] text-slate-600 font-medium">
                          {averageRating > 0 ? averageRating.toFixed(1) : '0'}
                        </span>
                        <span className="text-slate-300 text-[10px] mx-0.5">•</span>
                        <span className="text-[11px] text-slate-500">{soldCount} terjual</span>
                      </div>

                      <div className="mt-2 mb-1">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-[15px] font-black text-slate-900 leading-none">
                            Rp {new Intl.NumberFormat('id-ID').format(priceInfo.price)}
                          </span>
                          {priceInfo.hasDiscount && (
                            <span className="text-[11px] text-slate-400 line-through leading-none">
                              Rp {new Intl.NumberFormat('id-ID').format(priceInfo.originalPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>

                    <button
                      onClick={(e) => handleAddToCart(e, product)}
                      disabled={isCartLoading}
                      className={`mt-auto w-full py-2 border text-[12px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${isCartLoading
                          ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-wait'
                          : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-500 hover:text-white hover:border-blue-500 hover:shadow-md'
                        }`}
                    >
                      {isCartLoading ? (
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <HiOutlineShoppingBag className="w-4 h-4" /> Keranjang
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />

      {/* Render Custom Premium Toast */}
      {toast && (
        <PremiumToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Animasi CSS */}
      <style jsx>{`
        @keyframes slideDown {
          from { opacity: 0; transform: scaleY(0.95); }
          to { opacity: 1; transform: scaleY(1); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translate(-50%, 20px) scale(0.95); }
          to { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
        .animate-slide-down {
          animation: slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-fade-up {
          animation: fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}