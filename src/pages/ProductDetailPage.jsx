import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Swal from 'sweetalert2';
import { addToWishlist, removeFromWishlist, checkWishlistStatus } from '../services/wishlistService';
import { API_BASE_URL as CENTRAL_API_BASE_URL, getImageUrl } from '../config/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  HiOutlineShoppingCart,
  HiOutlineHeart,
  HiOutlineShare,
  HiStar,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineShieldCheck,
  HiOutlineCog,
  HiOutlineShoppingBag,
  HiOutlineZoomIn
} from 'react-icons/hi';

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

export default function ProductDetailPage() {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState('');
  const [activeTab, setActiveTab] = useState('Deskripsi');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [relatedWishlistLoading, setRelatedWishlistLoading] = useState(null);
  const [selectedReviewImage, setSelectedReviewImage] = useState(null);

  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const imgRef = useRef(null);

  const API_URL = `${CENTRAL_API_BASE_URL}/products`;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedReviewImage(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        setQuantity(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        const response = await axios.get(`${API_URL}/${id}`);
        const productData = response.data.data || response.data;

        setProduct(productData);
        setMainImage(getImageUrl(productData.image_url));
        setSelectedImageIndex(0);
      } catch (error) {
        console.error("Gagal mengambil data produk:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  useEffect(() => {
    async function checkWishlist() {
      if (product && localStorage.getItem('token')) {
        const status = await checkWishlistStatus(product.id);
        setIsWishlisted(status);
      } else if (product && !localStorage.getItem('token')) {
        setIsWishlisted(false);
      }
    }
    checkWishlist();
  }, [product]);

  useEffect(() => {
    if (!product) return;
    async function fetchRelated() {
      try {
        const response = await axios.get(API_URL);
        const allProducts = response.data.data || response.data;
        if (Array.isArray(allProducts)) {
          const related = allProducts
            .filter(item => item.category_id === product.category_id && item.id !== product.id)
            .slice(0, 10);
          setRelatedProducts(related);
        }
      } catch (error) {
        console.error("Gagal mengambil produk terkait:", error);
      }
    }
    fetchRelated();
  }, [product]);

  const getAllImages = () => {
    if (!product) return [];
    const imgArray = [];
    if (product.image_url) imgArray.push(getImageUrl(product.image_url));
    const galleries = product.galleries || product.gallery;
    if (galleries && Array.isArray(galleries) && galleries.length > 0) {
      galleries.forEach(gal => {
        const galImg = getImageUrl(gal.image_url);
        if (galImg && !imgArray.includes(galImg)) imgArray.push(galImg);
      });
    }
    return imgArray.filter(Boolean);
  };

  const handleDecrement = () => {
    if (quantity > 1) setQuantity(prev => prev - 1);
  };

  const handleIncrement = () => {
    if (product && product.stock && quantity >= product.stock) {
      Swal.fire({ icon: 'warning', title: 'Stok Habis', text: `Stok maksimal hanya ${product.stock} unit`, confirmButtonColor: '#3b82f6' });
      return;
    }
    setQuantity(prev => prev + 1);
  };

  const handleAddToCart = () => {
    if (addToCart) {
      addToCart(product, quantity);
      Swal.fire({ icon: 'success', title: 'Berhasil!', text: `${quantity} ${product.name} ditambahkan ke keranjang`, showConfirmButton: false, timer: 1500, position: 'top-end', toast: true });
    }
  };

  const handleAddToCartRelated = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(item, 1);
    Swal.fire({ icon: 'success', title: 'Berhasil!', text: `1 ${item.name} ditambahkan ke keranjang`, showConfirmButton: false, timer: 1500, position: 'top-end', toast: true });
  };

  const handleBuyNow = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      Swal.fire({ icon: 'warning', title: 'Belum Login', text: 'Silakan login terlebih dahulu untuk melanjutkan pembelian.', confirmButtonColor: '#3b82f6' }).then(() => navigate('/login'));
      return;
    }
    const directCheckoutItem = { ...product, product_id: product.id, quantity: quantity, price: Number(product.price) };
    sessionStorage.setItem('directCheckoutData', JSON.stringify([directCheckoutItem]));
    navigate('/checkout?type=direct');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product.name, text: `Cek produk keren ini: ${product.name}`, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      Swal.fire({ icon: 'success', title: 'Link Tersalin!', text: 'Tautan produk berhasil disalin', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
    }
  };

  const nextImage = () => {
    const images = getAllImages();
    if (images.length <= 1) return;
    const nextIndex = (selectedImageIndex + 1) % images.length;
    setSelectedImageIndex(nextIndex);
    setMainImage(images[nextIndex]);
  };

  const prevImage = () => {
    const images = getAllImages();
    if (images.length <= 1) return;
    const prevIndex = selectedImageIndex === 0 ? images.length - 1 : selectedImageIndex - 1;
    setSelectedImageIndex(prevIndex);
    setMainImage(images[prevIndex]);
  };

  const handleWishlist = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      Swal.fire({ icon: 'warning', title: 'Belum Login', text: 'Silakan login terlebih dahulu untuk menyimpan ke wishlist', confirmButtonColor: '#3b82f6', showCancelButton: true, cancelButtonText: 'Nanti', confirmButtonText: 'Login Sekarang' }).then((result) => {
        if (result.isConfirmed) navigate('/login');
      });
      return;
    }
    if (wishlistLoading) return;
    setWishlistLoading(true);
    try {
      if (!isWishlisted) {
        await addToWishlist(product.id);
        setIsWishlisted(true);
        Swal.fire({ icon: 'success', title: 'Tersimpan!', text: 'Dimasukkan ke Wishlist', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
      } else {
        await removeFromWishlist(product.id);
        setIsWishlisted(false);
        Swal.fire({ icon: 'success', title: 'Dihapus!', text: 'Dihapus dari Wishlist', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Gagal!', text: error.response?.data?.message || 'Terjadi kesalahan jaringan', confirmButtonColor: '#ef4444' });
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleWishlistRelated = async (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) {
      Swal.fire({ icon: 'warning', title: 'Belum Login', text: 'Silakan login terlebih dahulu untuk menyimpan ke wishlist', confirmButtonColor: '#3b82f6' }).then(() => navigate('/login'));
      return;
    }
    setRelatedWishlistLoading(item.id);
    try {
      await addToWishlist(item.id);
      Swal.fire({ icon: 'success', title: 'Tersimpan!', text: `${item.name} dimasukkan ke Wishlist`, timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Oops...', text: error.response?.data?.message || 'Gagal menyimpan ke Wishlist', timer: 2000, showConfirmButton: false, toast: true, position: 'top-end' });
    } finally {
      setRelatedWishlistLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-40">
          <div className="w-10 h-10 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 mt-4 text-sm">Memuat spesifikasi produk...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-slate-50 min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow text-center py-40">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Produk Tidak Ditemukan</h2>
          <p className="text-gray-500 mb-6">Maaf, produk yang Anda cari tidak tersedia.</p>
          <Link to="/products" className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-800 transition">
            <HiOutlineChevronLeft className="w-5 h-5" /> Kembali ke Katalog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const images = getAllImages();

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-800">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 py-6 md:py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs md:text-sm text-gray-400 mb-6 font-medium">
          <Link to="/" className="hover:text-blue-600 transition">Beranda</Link>
          <HiOutlineChevronRight className="w-3 h-3" />
          <Link to="/products" className="hover:text-blue-600 transition">Produk</Link>
          <HiOutlineChevronRight className="w-3 h-3" />
          {product.category && (
            <>
              <Link to={`/products?category=${product.category.name}`} className="hover:text-blue-600 transition">
                {product.category.name}
              </Link>
              <HiOutlineChevronRight className="w-3 h-3" />
            </>
          )}
          <span className="text-slate-600 font-semibold truncate max-w-[180px] md:max-w-xs">{product.name}</span>
        </nav>

        {/* Detail Produk - Card Utama */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-8 mb-8">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-8 items-start">

            {/* Kiri: Galeri Gambar */}
            <div className="lg:w-4/12">
              <div className="relative w-full rounded-2xl overflow-hidden bg-slate-50 group flex items-center justify-center" style={{ aspectRatio: '1/1' }}>
                <img
                  ref={imgRef}
                  src={mainImage}
                  alt={product.name}
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 p-4"
                />
                {images.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 shadow-sm rounded-full flex items-center justify-center text-slate-700 hover:bg-blue-500 hover:text-white transition opacity-0 group-hover:opacity-100 z-10">
                      <HiOutlineChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 shadow-sm rounded-full flex items-center justify-center text-slate-700 hover:bg-blue-500 hover:text-white transition opacity-0 group-hover:opacity-100 z-10">
                      <HiOutlineChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {images.length > 0 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1 justify-start">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setMainImage(img);
                        setSelectedImageIndex(idx);
                      }}
                      className={`flex-shrink-0 w-14 h-14 bg-slate-50 rounded-lg overflow-hidden border-2 transition p-1 ${selectedImageIndex === idx ? 'border-blue-500 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                    >
                      <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Kanan: Info & Aksi */}
            <div className="lg:w-7/12">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-2 leading-snug tracking-tight">
                {product.name}
              </h1>

              <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 font-medium mb-4">
                <div className="flex items-center gap-0.5 text-amber-500">
                  <HiStar className="w-4 h-4 fill-amber-500" />
                  <span className="font-bold text-slate-800 text-[13px]">4.9</span>
                </div>
                <span className="text-slate-300">|</span>
                <span className="text-slate-600">{product?.reviews ? product.reviews.length : 0} Ulasan</span>
                <span className="text-slate-300">|</span>
                <span>Terjual <span className="text-slate-700 font-semibold">100+</span></span>

                <div className="flex gap-2 ml-auto">
                  <button onClick={handleShare} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-md transition" title="Bagikan">
                    <HiOutlineShare className="w-4 h-4" />
                  </button>
                  <button onClick={handleWishlist} disabled={wishlistLoading} className={`p-1 hover:bg-slate-50 rounded-md transition ${isWishlisted ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`} title="Wishlist">
                    <HiOutlineHeart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-100 my-4"></div>

              {/* Harga dengan diskon */}
              <div className="mb-6">
                {(() => {
                  const priceInfo = getPriceInfo(product);
                  return (
                    <div>
                      <span className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                        Rp {new Intl.NumberFormat('id-ID').format(priceInfo.price)}
                      </span>
                      {priceInfo.hasDiscount && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded">
                            {priceInfo.percent}% OFF
                          </span>
                          <span className="text-sm text-slate-400 line-through">
                            Rp {new Intl.NumberFormat('id-ID').format(priceInfo.originalPrice)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="border-t border-slate-100 my-5"></div>

              {/* Quantity */}
              <div className="mb-6">
                <p className="text-xs font-bold text-slate-500 tracking-wider mb-2">Jumlah</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-slate-300 rounded-lg bg-white h-9 w-[110px] shadow-sm overflow-hidden">
                    <button onClick={handleDecrement} disabled={quantity <= 1 || product.stock < 1} className="w-8 h-full flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition text-lg">
                      −
                    </button>
                    <input type="text" value={product.stock < 1 ? 0 : quantity} readOnly className="flex-1 w-full h-full text-center text-slate-800 font-bold text-sm bg-white outline-none pointer-events-none border-x border-slate-200" />
                    <button onClick={handleIncrement} disabled={product.stock <= quantity || product.stock < 1} className="w-8 h-full flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition text-lg">
                      +
                    </button>
                  </div>
                  <div className="text-xs md:text-sm font-medium">
                    {product.stock > 0 ? (
                      <span className="text-slate-500">
                        Stok: <span className="text-emerald-600 font-bold">{product.stock} unit</span>
                      </span>
                    ) : (
                      <span className="text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded">Stok habis</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tombol Aksi */}
              <div className="flex flex-row gap-3 mb-6">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock < 1}
                  className="w-12 h-12 flex items-center justify-center border border-blue-500 text-blue-600 hover:bg-blue-50 rounded-xl transition disabled:opacity-40"
                  title="Tambah ke Keranjang"
                >
                  <HiOutlineShoppingCart className="w-5 h-5" />
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock < 1}
                  className="flex-1 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition disabled:opacity-40 text-sm py-3"
                >
                  Beli Sekarang
                </button>
              </div>

              {/* Layanan Pendukung */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2.5">
                  <HiOutlineCog className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="font-semibold text-xs text-slate-800">Pemasangan Profesional</p>
                    <p className="text-[11px] text-slate-500">Tersedia layanan instalasi di toko.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <HiOutlineShieldCheck className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="font-semibold text-xs text-slate-800">Garansi Resmi Brand</p>
                    <p className="text-[11px] text-slate-500">Jaminan produk 100% original.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Deskripsi & Ulasan */}
        <div className="bg-white rounded-2xl overflow-hidden mb-10 shadow-sm border border-slate-100">
          <div className="border-b border-slate-100 bg-slate-50/50">
            <div className="flex gap-6 px-4 md:px-6">
              {['Deskripsi', 'Ulasan'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3.5 font-bold text-xs md:text-sm transition-all relative ${activeTab === tab ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  {tab}
                  {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full"></div>}
                </button>
              ))}
            </div>
          </div>
          <div className="p-4 md:p-6 text-slate-600 text-sm md:text-base leading-relaxed">
            {activeTab === 'Deskripsi' && (
              <div className="prose prose-slate max-w-none">
                <p className="whitespace-pre-line text-slate-600">
                  {product.description || "Tingkatkan sistem audio mobil Anda dengan perangkat berkualitas tinggi ini. Dirancang khusus untuk menghasilkan suara jernih dan bass yang mendalam."}
                </p>
              </div>
            )}
            {activeTab === 'Ulasan' && (
              <div>
                {product?.reviews && product.reviews.length > 0 ? (
                  <div className="space-y-6">
                    {/* Ringkasan rating */}
                    <div className="flex items-center gap-4 mb-8 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                      <div className="text-center">
                        <p className="text-3xl font-black text-blue-600">
                          {Number((product.reviews.reduce((acc, curr) => acc + curr.rating, 0) / product.reviews.length).toFixed(1))}
                        </p>
                        <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mt-1">Rata-rata</p>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1 mb-1">
                          {[...Array(5)].map((_, i) => <HiStar key={i} className="w-5 h-5 text-amber-400" />)}
                        </div>
                        <p className="text-xs text-gray-500 font-medium">Berdasarkan {product.reviews.length} ulasan pembeli</p>
                      </div>
                    </div>

                    {product.reviews.map((review, i) => (
                      <div key={i} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                        <div className="flex gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold uppercase shrink-0">
                            {review.user?.name ? review.user.name.charAt(0) : 'U'}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                              <div>
                                <p className="font-bold text-gray-900 text-sm">{review.user?.name || 'Pengguna Anonim'}</p>
                                <div className="flex items-center gap-0.5 mt-1">
                                  {[...Array(5)].map((_, starIdx) => (
                                    <HiStar key={starIdx} className={`w-3.5 h-3.5 ${starIdx < review.rating ? 'text-amber-400' : 'text-gray-200'}`} />
                                  ))}
                                </div>
                              </div>
                              <span className="text-[10px] text-gray-400 font-medium">
                                {new Date(review.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mt-3 whitespace-pre-line leading-relaxed">
                              {review.comment || <span className="italic text-gray-400">Pengguna tidak meninggalkan komentar.</span>}
                            </p>
                            {review.images && review.images.length > 0 && (
                              <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                                {review.images.map((img, imgIdx) => {
                                  let imgPath = img.image_url;
                                  imgPath = getImageUrl(imgPath);
                                  return (
                                    <div
                                      key={imgIdx}
                                      onClick={() => setSelectedReviewImage(imgPath)}
                                      className="relative w-16 h-16 rounded-md border border-gray-200 overflow-hidden shrink-0 cursor-pointer hover:border-blue-400 transition-colors group"
                                    >
                                      <img src={imgPath} alt="Foto Ulasan" className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                                        <HiOutlineZoomIn className="w-5 h-5 text-white" />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="text-4xl mb-3">⭐</div>
                    <h3 className="text-sm font-bold text-slate-800 mb-1">Belum Ada Ulasan</h3>
                    <p className="text-slate-400 text-xs">Produk ini belum memiliki ulasan. Jadilah yang pertama memberikan penilaian!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ================= PRODUK TERKAIT ================= */}
        {relatedProducts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6 border-b-2 border-slate-100 pb-3">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Produk Terkait</h2>
              </div>
              <Link to="/products" className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold text-sm transition-colors">
                Lihat Semua <HiOutlineChevronRight />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {relatedProducts.map((item) => {
                let imgUrl = item.image_url;
                imgUrl = getImageUrl(imgUrl);
                const priceInfo = getPriceInfo(item);

                return (
                  <Link
                    to={`/product/${item.id}`}
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-md hover:border-blue-400 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group relative"
                  >
                    <button
                      onClick={(e) => handleWishlistRelated(e, item)}
                      disabled={relatedWishlistLoading === item.id}
                      className="absolute top-2 right-2 z-20 p-1.5 bg-white/90 backdrop-blur rounded-full text-slate-400 hover:text-red-500 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-all border border-slate-100"
                      title="Simpan ke Wishlist"
                    >
                      {relatedWishlistLoading === item.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <HiOutlineHeart className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <div className="relative w-full bg-gray-100 overflow-hidden" style={{ paddingBottom: '100%' }}>
                      {priceInfo.hasDiscount && (
                        <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-black px-2 py-1 rounded-md shadow-md">
                          {priceInfo.percent}% OFF
                        </div>
                      )}
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={item.name}
                          className="absolute top-0 left-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                          <span className="text-xs text-slate-400">No Image</span>
                        </div>
                      )}
                    </div>

                    <div className="p-2.5 flex flex-col gap-1 border-t border-slate-100">
                      {item.category && (
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">
                          {item.category.name}
                        </span>
                      )}
                      <h4 className="text-[12px] text-slate-800 font-semibold line-clamp-2 leading-snug min-h-[32px] hover:text-blue-600 transition">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-1">
                        <HiStar className="w-3 h-3 text-amber-400 flex-shrink-0" />
                        <span className="text-[10px] text-slate-500 font-medium">4.9</span>
                        <span className="text-slate-300 text-[10px]">·</span>
                        <span className="text-[10px] text-slate-400">100+ terjual</span>
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
                      <button
                        onClick={(e) => handleAddToCartRelated(e, item)}
                        className="mt-2 w-full py-1.5 border text-[11px] font-bold rounded-sm transition-colors flex items-center justify-center gap-1 bg-blue-50 border-blue-400 text-blue-700 hover:bg-blue-500 hover:text-white hover:border-blue-500"
                      >
                        <HiOutlineShoppingBag className="w-3.5 h-3.5" /> Keranjang
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <Footer />

      {selectedReviewImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 transition-opacity duration-300"
          onClick={() => setSelectedReviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex justify-center items-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedReviewImage(null)}
              className="absolute -top-10 right-0 md:-right-12 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-all"
              title="Tutup (Esc)"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedReviewImage}
              alt="Review Full Screen"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.5)] ring-1 ring-white/10 animate-[scale-up_0.2s_ease-out]"
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes scale-up {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}