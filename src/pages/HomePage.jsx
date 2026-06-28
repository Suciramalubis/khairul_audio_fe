import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Swal from 'sweetalert2';
import {
  HiOutlineShieldCheck,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiVolumeUp,
  HiOutlineAdjustments,
  HiOutlineTemplate,
  HiOutlineLightningBolt,
  HiOutlineViewGrid,
  HiArrowNarrowRight,
  HiStar,
  HiOutlineHeart,
  HiChevronRight
} from 'react-icons/hi';
import heroImage from '../assets/Img_3.png';
import { API_BASE_URL, getImageUrl } from '../config/api';

const API_URL = `${API_BASE_URL}/products`;
const heroSlides = [
  {
    id: 1,
    eyebrow: 'Spesialis Audio Mobil Premium',
    title: 'Tingkatkan Kualitas Audio Kendaraan Anda',
    desc: 'Hadirkan pengalaman berkendara yang lebih hidup. Kami menyediakan instalasi audio presisi dengan kejernihan suara dan dentuman bass yang maksimal untuk setiap jenis mobil.',
    cta: { label: 'Lihat Katalog', href: '/products' },
    ctaSecondary: { label: 'Profil Toko', href: '/tentang' },
    align: 'left',
    stats: null
  },
  {
    id: 2,
    eyebrow: 'Pusat Komponen Audio Original',
    title: 'Suara Jernih di Setiap Frekuensi',
    desc: 'Temukan pilihan speaker dan subwoofer dari merek terkemuka. Direkayasa khusus untuk memberikan detail vokal yang tajam tanpa distorsi, bahkan pada volume tinggi.',
    cta: { label: 'Cari Speaker', href: '/products?category=Speaker' },
    ctaSecondary: { label: 'Semua Kategori', href: '/products' },
    align: 'right',
    stats: null
  },
  {
    id: 3,
    eyebrow: 'Sistem Multimedia Cerdas',
    title: 'Kendali Penuh di Ujung Jari Anda',
    desc: 'Perbarui panel dasbor mobil Anda dengan Head Unit Android cerdas. Dilengkapi layar sentuh responsif, navigasi GPS, dan konektivitas nirkabel tanpa batas.',
    cta: { label: 'Lihat Head Unit', href: '/products?category=Head+Unit' },
    ctaSecondary: { label: 'Jelajahi Koleksi', href: '/products' },
    align: 'left',
    stats: null
  },
];

// --- FUNGSI HELPER CEK DISKON ---
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
      percent: product.discount_percent
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

// ========== HERO SLIDER (background putih gradasi langit) ==========
function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState('next');
  const [visible, setVisible] = useState(true);
  const autoplayRef = useRef(null);
  const total = heroSlides.length;

  const goTo = useCallback((idx, dir = 'next') => {
    if (animating) return;
    setAnimating(true);
    setDirection(dir);
    setVisible(false);
    setTimeout(() => {
      setCurrent(idx);
      setVisible(true);
      setAnimating(false);
    }, 400);
  }, [animating]);

  const next = useCallback(() => goTo((current + 1) % total, 'next'), [current, total, goTo]);

  useEffect(() => {
    autoplayRef.current = setInterval(() => { next(); }, 6000);
    return () => clearInterval(autoplayRef.current);
  }, [next]);

  const slide = heroSlides[current];

  const fadeStyle = {
    transition: 'opacity 0.45s ease, transform 0.45s ease',
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : direction === 'next' ? 'translateY(14px)' : 'translateY(-14px)',
  };

  const renderTextContent = () => (
    <div style={fadeStyle}>
      <div className={`flex items-center gap-2 mb-2 ${slide.align === 'right' ? 'justify-end' : ''}`}>
        <span className="block w-6 h-px bg-blue-500" />
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-blue-600">{slide.eyebrow}</span>
      </div>
      <h1 className={`text-2xl md:text-3xl lg:text-4xl font-black leading-tight text-slate-900 mb-3 ${slide.align === 'right' ? 'text-right' : 'text-left'}`}>
        {slide.title}
      </h1>
      <div className={`w-12 h-0.5 bg-blue-500 mb-4 ${slide.align === 'right' ? 'ml-auto' : ''}`} />
      <p className={`text-slate-700 text-sm md:text-base leading-relaxed mb-4 ${slide.align === 'right' ? 'text-right' : 'text-left'}`}>
        {slide.desc}
      </p>
      {slide.stats && (
        <div className={`flex gap-5 mb-5 ${slide.align === 'right' ? 'justify-end' : ''}`}>
          <div className="text-center">
            <p className="text-xl md:text-2xl font-black text-slate-900">{slide.stats.brands}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Brand</p>
          </div>
          <div className="w-px bg-slate-300" />
          <div className="text-center">
            <p className="text-xl md:text-2xl font-black text-slate-900">{slide.stats.products}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Produk</p>
          </div>
          <div className="w-px bg-slate-300" />
          <div className="text-center">
            <p className="text-xl md:text-2xl font-black text-slate-900">{slide.stats.customers}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Pelanggan</p>
          </div>
        </div>
      )}
      <div className={`flex flex-wrap gap-3 ${slide.align === 'right' ? 'justify-end' : ''}`}>
        <Link to={slide.cta.href} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 text-xs uppercase tracking-wider transition-colors">
          {slide.cta.label} <HiArrowNarrowRight />
        </Link>
        <Link to={slide.ctaSecondary.href} className="inline-flex items-center border border-slate-300 hover:border-blue-500 hover:text-blue-600 text-slate-700 font-bold py-2.5 px-5 text-xs uppercase tracking-wider transition-colors">
          {slide.ctaSecondary.label}
        </Link>
      </div>
    </div>
  );

  return (
    // Background gradien langit: dari sky-100 ke white (bisa juga dari sky-50 ke white)
    <div className="relative overflow-hidden bg-gradient-to-b from-sky-100 to-white">
      <div className="flex flex-col md:flex-row items-stretch">
        <div className={`w-full md:w-1/2 flex items-center px-6 md:px-12 py-15 md:py-17 ${slide.align === 'right' ? 'md:order-2 bg-transparent' : 'bg-transparent'
          }`}>
          <div className="max-w-md mx-auto md:mx-0 w-full">
            {renderTextContent()}
          </div>
        </div>

        <div className="w-full md:w-1/2 relative min-h-[250px] md:min-h-0">
          <img
            src={heroImage}
            alt="hero visual"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'brightness(0.95) saturate(1.05)' }}
          />
          {/* Overlay gradien transparan agar gambar menyatu dengan background langit */}
          <div className={`absolute inset-0 ${slide.align === 'right' ? 'bg-gradient-to-r' : 'bg-gradient-to-l'} from-white/60 via-transparent to-transparent md:from-white/40 pointer-events-none`} />
        </div>
      </div>

      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-blue-600 hover:border-blue-600 transition-colors"
        aria-label="Next slide"
      >
        <HiChevronRight className="w-5 h-5" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i, i > current ? 'next' : 'prev')}
            className="transition-all duration-300 rounded-full"
            style={{
              width: i === current ? '28px' : '8px',
              height: '3px',
              background: i === current ? '#3b82f6' : 'rgba(0,0,0,0.2)',
            }}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [newProducts, setNewProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlistLoading, setWishlistLoading] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchNewProducts() {
      try {
        setLoading(true);
        const response = await axios.get(API_URL);
        let dataArray = response.data.data || response.data;
        if (Array.isArray(dataArray)) {
          // Opsional: Filter stok > 0 agar yang stok habis tidak tampil di beranda
          dataArray = dataArray.filter(p => Number(p.stock) > 0);
          setNewProducts(dataArray.slice(0, 10));
        }
      } catch (error) {
        console.error("Gagal mengambil data produk:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchNewProducts();
  }, []);

  const handleAddToWishlist = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) {
      Swal.fire({
        icon: 'warning',
        title: 'Gagal',
        text: 'Harap Login terlebih dahulu untuk menyimpan ke Wishlist',
        confirmButtonColor: '#3b82f6'
      }).then(() => navigate('/login'));
      return;
    }
    setWishlistLoading(product.id);
    try {
      await axios.post(
        `${API_BASE_URL}/wishlist/add/${product.id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Swal.fire({
        icon: 'success',
        title: 'Disimpan!',
        text: `${product.name} ditambahkan ke Wishlist.`,
        toast: true,
        position: 'top-end',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      const msg = error.response?.data?.message || 'Gagal menyimpan ke Wishlist';
      Swal.fire({ icon: 'error', title: 'Oops...', text: msg, toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
    } finally {
      setWishlistLoading(null);
    }
  };

  const categoryLink = (catName) => `/products?category=${encodeURIComponent(catName)}`;

  return (
    <div className="bg-slate-50 min-h-screen font-sans flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <HeroSlider />

        {/* FEATURES BANNER */}
        <section className="bg-white border-b border-slate-200 shadow-sm relative z-10">
          <div className="container mx-auto px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              <div className="flex items-center gap-4 px-4">
                <HiOutlineShieldCheck className="w-7 h-7 text-blue-500 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-slate-900 text-[13px] uppercase tracking-wide">Transaksi Aman</h3>
                  <p className="text-[12px] text-slate-500 mt-0.5">Sistem pembayaran 100% terenkripsi</p>
                </div>
              </div>
              <div className="flex items-center gap-4 px-4">
                <HiOutlineTruck className="w-7 h-7 text-blue-500 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-slate-900 text-[13px] uppercase tracking-wide">Pengiriman Cepat</h3>
                  <p className="text-[12px] text-slate-500 mt-0.5">Jangkauan kurir ke seluruh Indonesia</p>
                </div>
              </div>
              <div className="flex items-center gap-4 px-4">
                <HiOutlineCheckCircle className="w-7 h-7 text-blue-500 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-slate-900 text-[13px] uppercase tracking-wide">Produk Resmi</h3>
                  <p className="text-[12px] text-slate-500 mt-0.5">Garansi distributor brand terkemuka</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* KATEGORI SECTION */}
        <section className="py-12 bg-slate-50">
          <div className="container mx-auto px-6 max-w-6xl">
            <h2 className="text-xl font-black text-slate-900 mb-6">Jelajahi Kategori</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
              <Link to={categoryLink("Head Unit")} className="bg-white border border-slate-200 p-6 rounded-md hover:border-blue-400 hover:shadow-sm transition-all flex flex-col items-center justify-center gap-3 group">
                <HiOutlineTemplate className="w-8 h-8 text-slate-600 group-hover:text-blue-500 transition-colors" />
                <span className="font-bold text-slate-800 text-[13px] uppercase tracking-wide">Head Unit</span>
              </Link>
              <Link to={categoryLink("Speaker")} className="bg-white border border-slate-200 p-6 rounded-md hover:border-blue-400 hover:shadow-sm transition-all flex flex-col items-center justify-center gap-3 group">
                <HiVolumeUp className="w-8 h-8 text-slate-600 group-hover:text-blue-500 transition-colors" />
                <span className="font-bold text-slate-800 text-[13px] uppercase tracking-wide">Speaker</span>
              </Link>
              <Link to={categoryLink("Subwoofer")} className="bg-white border border-slate-200 p-6 rounded-md hover:border-blue-400 hover:shadow-sm transition-all flex flex-col items-center justify-center gap-3 group">
                <HiOutlineViewGrid className="w-8 h-8 text-slate-600 group-hover:text-blue-500 transition-colors" />
                <span className="font-bold text-slate-800 text-[13px] uppercase tracking-wide">Subwoofer</span>
              </Link>
              <Link to={categoryLink("Power & DSP")} className="bg-white border border-slate-200 p-6 rounded-md hover:border-blue-400 hover:shadow-sm transition-all flex flex-col items-center justify-center gap-3 group">
                <HiOutlineLightningBolt className="w-8 h-8 text-slate-600 group-hover:text-blue-500 transition-colors" />
                <span className="font-bold text-slate-800 text-[13px] uppercase tracking-wide whitespace-nowrap">Power & DSP</span>
              </Link>
              <Link to={categoryLink("Aksesoris")} className="col-span-2 md:col-span-1 bg-white border border-slate-200 p-6 rounded-md hover:border-blue-400 hover:shadow-sm transition-all flex flex-col items-center justify-center gap-3 group">
                <HiOutlineAdjustments className="w-8 h-8 text-slate-600 group-hover:text-blue-500 transition-colors" />
                <span className="font-bold text-slate-800 text-[13px] uppercase tracking-wide">Aksesoris</span>
              </Link>
            </div>
          </div>
        </section>

        {/* PRODUK TERBARU */}
        <section className="py-10 bg-white border-t border-slate-200">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="flex justify-between items-end mb-6 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-xl font-black text-slate-900">Produk Terbaru</h2>
                <p className="text-slate-500 mt-0.5 text-[13px]">Koleksi audio terkini yang baru tiba di toko kami.</p>
              </div>
              <Link to="/products" className="hidden sm:flex items-center gap-1 text-blue-600 font-bold hover:text-blue-700 text-[13px] transition-colors">
                Lihat Semua <HiArrowNarrowRight />
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-blue-500"></div>
              </div>
            ) : newProducts.length === 0 ? (
              <div className="text-center py-10 text-slate-500 border border-dashed border-slate-300 rounded-md">Belum ada produk untuk ditampilkan.</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {newProducts.map(product => {
                  let imgUrl = product.image_url || product.image || product.gambar || null;
                  imgUrl = getImageUrl(imgUrl);

                  const priceInfo = getPriceInfo(product);
                  
                  // --- LOGIC PERHITUNGAN RATING & TERJUAL (Sama dengan Halaman Produk & Detail) ---
                  const reviews = product.reviews || [];
                  
                  let averageRating = 0;
                  if (product.rating !== undefined && product.rating !== null) {
                    averageRating = Number(product.rating);
                  } else if (product.average_rating !== undefined && product.average_rating !== null) {
                    averageRating = Number(product.average_rating);
                  } else {
                    averageRating = getAverageRating(reviews);
                  }

                  let soldCount = Number(product.total_sold || product.sold_count || product.sold || 0);
                  if (soldCount === 0 && reviews.length > 0) {
                    soldCount = reviews.length;
                  }

                  return (
                    <div
                      key={product.id}
                      className="bg-white border border-slate-200 rounded-md hover:border-blue-400 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group relative"
                    >
                      <button
                        onClick={(e) => handleAddToWishlist(e, product)}
                        disabled={wishlistLoading === product.id}
                        className="absolute top-2 right-2 z-20 p-1.5 bg-white/90 backdrop-blur rounded-full text-slate-400 hover:text-red-500 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-all border border-slate-100"
                        title="Simpan ke Wishlist"
                      >
                        {wishlistLoading === product.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <HiOutlineHeart className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <Link to={`/product/${product.id}`} className="relative w-full bg-gray-100 overflow-hidden block" style={{ paddingBottom: '100%' }}>
                        {priceInfo.hasDiscount && (
                          <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-black px-2 py-1 rounded-md shadow-md">
                            {priceInfo.percent}% OFF
                          </div>
                        )}
                        {!priceInfo.hasDiscount && (
                          <div className="absolute top-2 left-2 z-10 bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-md">
                            NEW
                          </div>
                        )}
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={product.name}
                            className="absolute top-0 left-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-slate-100">
                            <span className="text-xs text-slate-400">No Image</span>
                          </div>
                        )}
                      </Link>

                      <div className="p-2.5 flex flex-col gap-1 border-t border-slate-100 flex-grow justify-between">
                        <Link to={`/product/${product.id}`}>
                          {product.category && (
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">
                              {product.category.name}
                            </span>
                          )}
                          <h4 className="text-[12px] text-slate-800 font-semibold line-clamp-2 leading-snug min-h-[32px]">
                            {product.name}
                          </h4>

                          {/* --- DATA RATING & TERJUAL (DINAMIS) --- */}
                          <div className="flex items-center gap-1 mt-1">
                            <HiStar className="w-3 h-3 text-amber-400 flex-shrink-0" />
                            <span className="text-[10px] text-slate-500 font-medium">
                              {averageRating > 0 ? averageRating.toFixed(1) : '0'}
                            </span>
                            <span className="text-slate-300 text-[10px]">·</span>
                            <span className="text-[10px] text-slate-400">
                              {soldCount > 0 ? `${soldCount} terjual` : 'Baru rilis'}
                            </span>
                          </div>

                          <div className="flex items-baseline gap-1.5 flex-wrap mt-0.5">
                            <span className="text-[14px] font-extrabold text-slate-900 leading-none">
                              Rp {new Intl.NumberFormat('id-ID').format(priceInfo.price)}
                            </span>
                            {priceInfo.hasDiscount && (
                              <span className="text-[10px] text-slate-400 line-through leading-none">
                                Rp {new Intl.NumberFormat('id-ID').format(priceInfo.originalPrice)}
                              </span>
                            )}
                          </div>
                        </Link>

                        <button
                          onClick={() => navigate(`/product/${product.id}`)}
                          className="mt-3 w-full py-1.5 bg-blue-50 border border-blue-400 text-blue-700 text-[11px] font-bold rounded-sm hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-colors flex items-center justify-center"
                        >
                          Lihat Produk
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-5 sm:hidden text-center">
              <Link to="/products" className="inline-block px-6 py-2 border border-slate-300 rounded text-slate-700 text-sm font-bold">
                Lihat Semua Produk
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}