// Lokasi: src/pages/CartPage.jsx

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Swal from "sweetalert2";
import { addToWishlist } from '../services/wishlistService';
import { API_BASE_URL, getImageUrl } from "../config/api";

import {
  HiOutlineTrash,
  HiPlus,
  HiMinus,
  HiOutlineShoppingBag,
  HiOutlineChevronRight,
  HiOutlineShieldCheck,
  HiStar,
  HiOutlineHeart
} from "react-icons/hi";

const API_URL = `${API_BASE_URL}/products`;

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

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, addToCart, loading: cartLoading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(null);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const response = await axios.get(API_URL);
        const allProducts = response.data.data || response.data;

        if (Array.isArray(allProducts)) {
          const shuffled = allProducts.sort(() => 0.10 - Math.random());
          setRecommendedProducts(shuffled.slice(0, 10));
        }
      } catch (err) {
        console.error("Gagal mengambil produk rekomendasi:", err);
      }
    }
    fetchRecommendations();
  }, []);

  const selectedCartItems = cartItems.filter((item) =>
    selectedItems.includes(item.product.id)
  );

  // Subtotal menggunakan harga diskon
  const subtotal = selectedCartItems.reduce((total, item) => {
    const priceInfo = getPriceInfo(item.product);
    return total + (priceInfo.price * item.quantity);
  }, 0);

  const total = subtotal - discount;

  useEffect(() => {
    if (cartItems.length > 0 && selectedItems.length === cartItems.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedItems, cartItems.length]);

  const handleSelectItem = (productId) => {
    if (selectedItems.includes(productId)) {
      setSelectedItems(selectedItems.filter((id) => id !== productId));
    } else {
      setSelectedItems([...selectedItems, productId]);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map((item) => item.product.id));
    }
    setSelectAll(!selectAll);
  };

  const handleUpdateQuantity = (productId, newQuantity, productStock) => {
    if (newQuantity > productStock) {
      Swal.fire({
        icon: "warning",
        title: "Stok Tidak Cukup",
        text: `Stok tersedia hanya ${productStock} unit`,
        confirmButtonColor: "#3b82f6",
      });
      return;
    }
    updateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = async (productId, productName) => {
    const result = await Swal.fire({
      title: "Hapus produk?",
      text: `Yakin ingin menghapus ${productName} dari keranjang?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      removeFromCart(productId);
      setSelectedItems(selectedItems.filter((id) => id !== productId));
      Swal.fire({
        icon: "success",
        title: "Terhapus!",
        text: `${productName} dihapus`,
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    }
  };

  const handleRemoveSelected = async () => {
    if (selectedItems.length === 0) return;

    const result = await Swal.fire({
      title: "Hapus produk terpilih?",
      text: `Yakin ingin menghapus ${selectedItems.length} produk dari keranjang?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: 'Memproses...',
        text: 'Menghapus produk yang dipilih...',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      try {
        const deletePromises = selectedItems.map((productId) => removeFromCart(productId));
        await Promise.all(deletePromises);

        setSelectedItems([]);
        setSelectAll(false);

        Swal.fire({
          icon: "success",
          title: "Terhapus!",
          text: `${selectedItems.length} produk berhasil dihapus`,
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        }).then(() => {
          window.location.reload();
        });

      } catch (err) {
        console.error("Error bulk delete produk:", err);
        Swal.fire({
          icon: "error",
          title: "Gagal",
          text: "Terjadi kesalahan saat menghapus produk.",
        });
      }
    }
  };

  const handleApplyPromo = () => {
    if (selectedCartItems.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Pilih Produk",
        text: "Pilih produk sebelum memakai promo",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    const code = promoCode.toUpperCase().trim();
    if (code === "WELCOME10") {
      setDiscount(subtotal * 0.1);
      Swal.fire({ icon: "success", title: "Berhasil!", text: "Diskon 10% diterapkan", timer: 1500, showConfirmButton: false });
    } else {
      Swal.fire({ icon: "error", title: "Invalid", text: "Kode promo salah", confirmButtonColor: "#ef4444" });
    }
  };

  const handleCheckout = async () => {
    if (selectedCartItems.length === 0) return;
    if (!user) {
      Swal.fire({
        icon: "info",
        title: "Login Diperlukan",
        text: "Silakan login terlebih dahulu untuk checkout",
        showCancelButton: true,
        confirmButtonColor: "#3b82f6",
        confirmButtonText: "Login Sekarang",
      }).then((result) => {
        if (result.isConfirmed) navigate("/login", { state: { redirectTo: "/cart" } });
      });
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);

      const checkoutDataPayload = {
        items: selectedCartItems,
        appliedDiscount: discount
      };

      sessionStorage.setItem('cartCheckoutData', JSON.stringify(checkoutDataPayload));
      navigate("/checkout");
    }, 1000);
  };

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
      }).then(() => {
        navigate('/login');
      });
      return;
    }

    setWishlistLoading(product.id);

    try {
      await addToWishlist(product.id);

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
      const msg = error.response?.data?.message || 'Gagal menyimpan ke Wishlist (Produk mungkin sudah ada)';
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: msg,
        toast: true,
        position: 'top-end',
        timer: 2000,
        showConfirmButton: false,
      });
    } finally {
      setWishlistLoading(null);
    }
  };

  if (cartLoading) return (
    <div className="bg-slate-50 min-h-screen flex flex-col"><Navbar /><div className="flex-grow flex justify-center items-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div></div><Footer /></div>
  );

  if (cartItems.length === 0) return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow container mx-auto px-4 py-20 flex items-center justify-center">
        <div className="text-center bg-white p-10 md:p-14 border border-slate-200 w-full max-w-lg shadow-sm rounded-lg">
          <HiOutlineShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-5" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Keranjang Belanja Kosong</h2>
          <p className="text-slate-500 mb-8">Penuhi keranjangmu dengan sistem audio mobil terbaik sekarang.</p>
          <Link to="/products" className="inline-block bg-blue-600 text-white font-bold px-8 py-3 rounded hover:bg-blue-700 transition-colors">
            Mulai Belanja
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen font-sans flex flex-col pb-32 lg:pb-0">
      <Navbar />
      <main className="flex-grow container mx-auto px-0 sm:px-6 py-4 sm:py-6">
        <h1 className="hidden sm:block md:text-2xl font-black text-slate-900 mb-5">Keranjang Belanja</h1>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">

          {/* KOLOM KIRI: DAFTAR PRODUK KERANJANG & PRODUK TERKAIT */}
          <div className="flex-1 space-y-4 sm:space-y-6">

            {/* KOTAK DAFTAR KERANJANG */}
            <div className="bg-white border-y sm:border border-slate-200 sm:shadow-sm sm:rounded-md overflow-hidden">

              {/* HEADER DAFTAR KERANJANG (Pilih Semua) */}
              <div className="border-b border-slate-200 p-3 sm:p-4 bg-slate-50 flex justify-between items-center h-[50px] sm:h-[60px]">
                <label className="flex items-center gap-3 cursor-pointer text-[13px] sm:text-[14px] font-bold text-slate-700 select-none">
                  <input type="checkbox" checked={selectAll} onChange={handleSelectAll} className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 rounded border-slate-300 focus:ring-blue-500 cursor-pointer" />
                  <span>Pilih Semua <span className="text-slate-500 font-normal">({cartItems.length})</span></span>
                </label>

                {selectedItems.length > 0 && (
                  <button
                    onClick={handleRemoveSelected}
                    className="text-[12px] sm:text-[13px] font-bold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50"
                  >
                    Hapus
                  </button>
                )}
              </div>

              {/* LIST ITEM KERANJANG */}
              <div className="divide-y divide-slate-100">
                {cartItems.map((item) => {
                  const isSelected = selectedItems.includes(item.product.id);
                  const priceInfo = getPriceInfo(item.product);

                  return (
                    <div key={item.product.id} className={`p-3 sm:p-5 transition-colors flex gap-3 sm:gap-4 items-center sm:items-start ${isSelected ? 'bg-blue-50/20' : 'bg-white hover:bg-slate-50/50'}`}>

                      {/* Checkbox Individual */}
                      <div className="flex-shrink-0 flex items-center h-full sm:pt-4">
                        <input type="checkbox" checked={isSelected} onChange={() => handleSelectItem(item.product.id)} className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 rounded border-slate-300 focus:ring-blue-500 cursor-pointer" />
                      </div>

                      {/* Gambar Produk */}
                      <Link to={`/product/${item.product.id}`} className="flex-shrink-0">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-50 border border-slate-200 rounded p-1 flex items-center justify-center">
                          <img src={getImageUrl(item.product.image_url)} alt={item.product.name} className="max-w-full max-h-full object-contain" />
                        </div>
                      </Link>

                      {/* Detail Produk */}
                      <div className="flex-1 flex flex-col min-w-0 h-20 sm:h-24 justify-between py-0.5">
                        <div className="flex justify-between items-start gap-2">
                          <Link to={`/product/${item.product.id}`} className="flex-1">
                            <h3 className="font-medium text-slate-800 text-[13px] sm:text-[15px] leading-snug line-clamp-2 sm:hover:text-blue-600 transition-colors">{item.product.name}</h3>
                          </Link>
                          {/* Tombol Delete per item */}
                          <button onClick={() => handleRemoveItem(item.product.id, item.product.name)} className="text-slate-400 hover:text-red-500 p-1 -mr-1" title="Hapus">
                            <HiOutlineTrash className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>

                        <div className="flex justify-between items-end mt-auto">
                          <div>
                            <p className="font-bold text-blue-600 text-[14px] sm:text-[16px] leading-none mb-1">
                              Rp {new Intl.NumberFormat("id-ID").format(priceInfo.price)}
                            </p>
                            {priceInfo.hasDiscount && (
                              <p className="text-[10px] sm:text-[12px] text-slate-400 line-through leading-none">
                                Rp {new Intl.NumberFormat("id-ID").format(priceInfo.originalPrice)}
                              </p>
                            )}
                          </div>

                          {/* Input Qty */}
                          <div className="flex items-center border border-slate-300 rounded h-7 sm:h-8 bg-white">
                            <button onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1, item.product.stock)} disabled={item.quantity <= 1} className="w-7 sm:w-8 h-full flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition">
                              <HiMinus className="w-3 h-3" />
                            </button>
                            <span className="w-8 sm:w-10 text-center font-semibold text-slate-800 text-[12px] sm:text-[13px] border-x border-slate-300 h-full flex items-center justify-center">{item.quantity}</span>
                            <button onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1, item.product.stock)} className="w-7 sm:w-8 h-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition">
                              <HiPlus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* ================= PRODUK TERKAIT ================= */}
            {recommendedProducts.length > 0 && (
              <div className="pt-2 sm:pt-5 px-4 sm:px-0">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">Mungkin Anda Suka</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {recommendedProducts.map((product) => {
                    let imgUrl = getImageUrl(product.image_url || product.image || product.gambar);

                    const priceInfo = getPriceInfo(product);
                    const isWishlistLoading = wishlistLoading === product.id;

                    return (
                      <div key={product.id} className="bg-white border border-slate-200 rounded-md hover:border-blue-400 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group relative">
                        {/* Tombol wishlist */}
                        <button
                          onClick={(e) => handleAddToWishlist(e, product)}
                          disabled={isWishlistLoading}
                          className="absolute top-2 right-2 z-20 p-1.5 bg-white/90 backdrop-blur rounded-full text-slate-400 hover:text-red-500 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-all border border-slate-100"
                          title="Simpan ke Wishlist"
                        >
                          {isWishlistLoading ? (
                            <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <HiOutlineHeart className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Container gambar */}
                        <div className="relative w-full bg-gray-100 overflow-hidden" style={{ paddingBottom: '100%' }}>
                          {priceInfo.hasDiscount && (
                            <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] sm:text-xs font-black px-2 py-1 rounded-sm shadow-md">
                              {priceInfo.percent}% OFF
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
                            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                              <span className="text-xs text-slate-400">No Image</span>
                            </div>
                          )}
                        </div>

                        {/* Info produk */}
                        <div className="p-2.5 flex flex-col gap-1 border-t border-slate-100">
                          {product.category && (
                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">
                              {product.category.name}
                            </span>
                          )}
                          <h4 className="text-[11px] sm:text-[12px] text-slate-800 font-semibold line-clamp-2 leading-snug min-h-[32px] hover:text-blue-600 transition">
                            {product.name}
                          </h4>
                          <div className="flex items-center gap-1">
                            <HiStar className="w-3 h-3 text-amber-400 flex-shrink-0" />
                            <span className="text-[10px] text-slate-500 font-medium">4.9</span>
                            <span className="text-slate-300 text-[10px]">·</span>
                            <span className="text-[10px] text-slate-400">100+ terjual</span>
                          </div>
                          <div className="flex items-baseline gap-1.5 flex-wrap mt-0.5">
                            <span className="text-[13px] sm:text-[14px] font-extrabold text-slate-900 leading-none">
                              Rp {new Intl.NumberFormat('id-ID').format(priceInfo.price)}
                            </span>
                            {priceInfo.hasDiscount && (
                              <span className="text-[9px] sm:text-[10px] text-slate-400 line-through leading-none">
                                Rp {new Intl.NumberFormat('id-ID').format(priceInfo.originalPrice)}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (product.stock > 0) {
                                addToCart(product, 1);
                                Swal.fire({
                                  icon: 'success',
                                  title: 'Ditambahkan!',
                                  toast: true,
                                  position: 'top-end',
                                  timer: 1500,
                                  showConfirmButton: false,
                                });
                              }
                            }}
                            disabled={product.stock <= 0}
                            className={`mt-2 w-full py-1.5 border text-[10px] sm:text-[11px] font-bold rounded-sm transition-colors flex items-center justify-center gap-1 ${product.stock <= 0
                                ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-50 border-blue-400 text-blue-700 hover:bg-blue-500 hover:text-white hover:border-blue-500'
                              }`}
                          >
                            <HiOutlineShoppingBag className="w-3.5 h-3.5" /> {product.stock > 0 ? 'Tambah' : 'Habis'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* KOLOM KANAN: SIDEBAR RINGKASAN (BENAR-BENAR DI HIDE DI MOBILE!)   */}
          {/* ================================================================= */}
          <div className="hidden lg:block lg:w-[340px] flex-shrink-0 px-4 sm:px-0">
            <div className="bg-white rounded-md shadow-sm border border-slate-200 p-4 sm:p-5 lg:sticky lg:top-24">
              <h3 className="text-[15px] sm:text-[16px] font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">Ringkasan Belanja</h3>

              <div className="mb-5">
                <p className="text-[12px] font-semibold text-slate-700 mb-2">Makin hemat pakai promo</p>
                <div className="flex gap-2">
                  <input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="Masukkan Kode..." className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-500 text-[13px] font-medium uppercase transition-colors" />
                  <button onClick={handleApplyPromo} className="px-4 py-2 bg-slate-900 text-white text-[13px] font-bold rounded hover:bg-slate-800 transition-colors">Terapkan</button>
                </div>
              </div>

              <div className="space-y-3 mb-5 text-[13px] sm:text-[14px]">
                <div className="flex justify-between text-slate-600">
                  <span>Total Harga ({selectedCartItems.length} Barang)</span>
                  <span>Rp {new Intl.NumberFormat("id-ID").format(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between font-medium text-emerald-600">
                    <span>Total Diskon</span>
                    <span>- Rp {new Intl.NumberFormat("id-ID").format(discount)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 text-[15px]">Total Belanja</span>
                  <span className="text-xl font-black text-blue-600">
                    Rp {new Intl.NumberFormat("id-ID").format(selectedCartItems.length === 0 ? 0 : total)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isProcessing || selectedCartItems.length === 0}
                className={`w-full font-bold py-3 text-[15px] rounded transition-all duration-200 shadow-sm ${selectedCartItems.length === 0
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
                  }`}
              >
                {isProcessing ? "Memproses..." : `Beli (${selectedCartItems.length})`}
              </button>

              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-4 flex items-center justify-center gap-1.5 font-medium">
                <HiOutlineShieldCheck className="w-4 h-4" /> Transaksi Aman & Terpercaya
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* ========================================================== */}
      {/* FIXED BOTTOM BAR MOBILE (Shopee Style Checkout Navbar)     */}
      {/* ========================================================== */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 shadow-[0_-4px_15px_rgba(0,0,0,0.08)] pb-safe">

        {/* TINGKAT 1: VOUCHER / PROMO */}
        <div className="bg-blue-50/95 backdrop-blur-md border-t border-blue-200 px-3 py-2 flex items-center gap-2">
          {/* Ikon Tiket/Voucher */}
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="Gunakan Kode Promo"
            className="flex-1 px-2 py-1.5 bg-white border border-blue-200 rounded text-[12px] font-medium uppercase outline-none focus:border-blue-500 shadow-sm transition-colors"
          />
          <button onClick={handleApplyPromo} className="bg-slate-900 text-white px-4 py-1.5 rounded text-[12px] font-bold hover:bg-slate-800 active:scale-95 transition-transform">
            Pakai
          </button>
        </div>

        {/* TINGKAT 2: CHECKOUT */}
        <div className="bg-white border-t border-slate-200 px-3 py-2.5 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer pl-1">
            <input type="checkbox" checked={selectAll} onChange={handleSelectAll} className="w-5 h-5 text-blue-500 rounded border-slate-300 focus:ring-blue-500" />
            <span className="text-[12px] text-slate-600 font-medium select-none">Semua</span>
          </label>

          <div className="flex items-center gap-3">
            <div className="text-right flex flex-col justify-center">
              <span className="text-[10px] text-slate-500 font-medium">Total Tagihan</span>
              <span className="text-[15px] font-bold text-blue-600 leading-none mt-0.5">
                Rp {new Intl.NumberFormat("id-ID").format(selectedCartItems.length === 0 ? 0 : total)}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={isProcessing || selectedCartItems.length === 0}
              className={`px-5 py-2.5 text-[13px] font-bold rounded transition-all shadow-sm ${selectedCartItems.length === 0
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-blue-600 text-white active:bg-blue-700 active:scale-95"
                }`}
            >
              {isProcessing ? "Proses..." : `Checkout (${selectedCartItems.length})`}
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}