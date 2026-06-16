// Lokasi: src/pages/WishlistPage.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineHeart,
  HiOutlineTrash,
  HiArrowRight,
  HiStar,
  HiOutlineShoppingBag
} from 'react-icons/hi';
import Swal from 'sweetalert2';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useCart } from '../context/CartContext';
import { getWishlist, removeFromWishlist } from '../services/wishlistService';

// Helper harga & diskon
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

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const { addToCart } = useCart();

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const data = await getWishlist();
      const extractedProducts = data.map(item => item.product ? item.product : item);
      setItems(extractedProducts);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        Swal.fire({
          title: 'Session Expired',
          text: 'Silakan login kembali',
          icon: 'warning',
          confirmButtonColor: '#3b82f6'
        }).then(() => {
          window.location.href = '/login';
        });
      } else {
        Swal.fire({ title: 'Error', text: 'Gagal memuat produk favorit', icon: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  useEffect(() => {
    setSelectAll(items.length > 0 && selectedItems.length === items.length);
  }, [selectedItems, items]);

  const handleSelectItem = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) setSelectedItems([]);
    else setSelectedItems(items.map((i) => i.id));
  };

  const handleRemove = async (id, name, e) => {
    if (e) e.preventDefault();
    const result = await Swal.fire({
      title: 'Hapus dari favorit?',
      text: `"${name}" akan dihapus.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });
    if (result.isConfirmed) {
      try {
        await removeFromWishlist(id);
        setItems((prev) => prev.filter((i) => i.id !== id));
        setSelectedItems((prev) => prev.filter((i) => i !== id));
        Swal.fire({ title: 'Terhapus!', icon: 'success', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
      } catch {
        Swal.fire('Gagal!', 'Terjadi kesalahan', 'error');
      }
    }
  };

  const handleRemoveSelected = async () => {
    if (selectedItems.length === 0) return;
    const result = await Swal.fire({
      title: 'Hapus Produk?',
      text: `${selectedItems.length} produk akan dihapus.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    });
    if (result.isConfirmed) {
      try {
        for (const id of selectedItems) {
          await removeFromWishlist(id);
        }
        setItems((prev) => prev.filter((i) => !selectedItems.includes(i.id)));
        setSelectedItems([]);
        Swal.fire({ title: 'Terhapus!', icon: 'success', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
      } catch {
        Swal.fire('Gagal!', 'Terjadi kesalahan', 'error');
      }
    }
  };

  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    if (product.stock === 0) return;
    
    addToCart(product, 1);
    
    try {
      await removeFromWishlist(product.id);
      setItems((prev) => prev.filter((i) => i.id !== product.id));
      setSelectedItems((prev) => prev.filter((i) => i !== product.id));
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: `${product.name} dipindah ke keranjang`,
        toast: true,
        timer: 2000,
        showConfirmButton: false,
        position: 'top-end',
      });
    } catch (error) {
      console.error("Gagal menghapus dari wishlist:", error);
      Swal.fire('Peringatan', 'Produk masuk keranjang, tapi gagal dihapus dari tampilan Favorit', 'warning');
    }
  };

  const handleAddSelectedToCart = async () => {
    const available = items.filter((i) => selectedItems.includes(i.id) && i.stock > 0);
    if (available.length === 0) {
      Swal.fire('Info', 'Tidak ada produk yang tersedia', 'info');
      return;
    }

    try {
      available.forEach((p) => addToCart(p, 1));
      for (const product of available) {
        await removeFromWishlist(product.id);
      }
      const availableIds = available.map(p => p.id);
      setItems((prev) => prev.filter((i) => !availableIds.includes(i.id)));
      setSelectedItems((prev) => prev.filter((i) => !availableIds.includes(i.id)));
      Swal.fire({ 
        title: 'Berhasil!', 
        text: `${available.length} produk dipindah ke keranjang`, 
        icon: 'success',
        toast: true,
        timer: 2000,
        position: 'top-end',
        showConfirmButton: false
      });
    } catch (error) {
      console.error("Gagal memindah batch:", error);
      Swal.fire('Gagal!', 'Terjadi kesalahan saat memindahkan semua produk', 'error');
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center py-40">
          <div className="w-10 h-10 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 mt-4 text-sm">Memuat produk favorit...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 md:py-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 pb-3 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Favorit Saya</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {items.length === 0
                ? 'Simpan produk impian Anda dan beli nanti.'
                : `${items.length} produk tersimpan.`}
            </p>
          </div>
          {items.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={handleRemoveSelected}
                disabled={selectedItems.length === 0}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none disabled:opacity-50 transition"
              >
                Hapus ({selectedItems.length})
              </button>
              <button
                onClick={handleAddSelectedToCart}
                disabled={selectedItems.length === 0 || !items.some(i => selectedItems.includes(i.id) && i.stock > 0)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none disabled:opacity-50 transition"
              >
                + Tambah ke Keranjang
              </button>
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 py-16 px-4 text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
              <HiOutlineHeart className="w-full h-full" />
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Produk Favorit kosong</h2>
            <p className="text-gray-500 max-w-md mx-auto text-sm mb-6">
              Anda belum menyimpan produk apapun. Temukan produk audio favorit Anda sekarang.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition"
            >
              Mulai Belanja <HiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Toolbar seleksi */}
            <div className="flex items-center gap-4 mb-5 pb-2 border-b border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                Pilih Semua
              </label>
            </div>

            {/* Grid Produk */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {items.map((item) => {
                const priceInfo = getPriceInfo(item);
                const isSelected = selectedItems.includes(item.id);
                let imgUrl = item.image_url;
                if (imgUrl && !imgUrl.startsWith('http') && !imgUrl.startsWith('data:image')) {
                  let cleanPath = imgUrl.replace(/^\/+/, '');
                  if (cleanPath.startsWith('public/')) cleanPath = cleanPath.replace('public/', 'storage/');
                  else if (!cleanPath.startsWith('storage/')) cleanPath = `storage/${cleanPath}`;
                  imgUrl = `http://127.0.0.1/khairul_audio_ecommerce/khairul_audio_be/public/${cleanPath}`;
                }

                return (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-md hover:border-blue-400 hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group relative"
                  >
                    {/* Checkbox pilih */}
                    <div className="absolute top-2 left-2 z-20">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectItem(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 bg-white/90 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>

                    {/* Tombol hapus */}
                    <button
                      onClick={(e) => handleRemove(item.id, item.name, e)}
                      className="absolute top-2 right-2 z-20 p-1.5 bg-white/90 backdrop-blur rounded-full text-slate-400 hover:text-red-500 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-all border border-slate-100"
                      title="Hapus dari favorit"
                    >
                      <HiOutlineTrash className="w-3.5 h-3.5" />
                    </button>

                    {/* Container gambar */}
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
                      {item.stock === 0 && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                          <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">Habis</span>
                        </div>
                      )}
                    </div>

                    {/* Informasi produk */}
                    <div className="p-2.5 flex flex-col gap-1 border-t border-slate-100">
                      {item.category && (
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">
                          {item.category.name}
                        </span>
                      )}
                      <Link to={`/product/${item.id}`}>
                        <h4 className="text-[12px] text-slate-800 font-semibold line-clamp-2 leading-snug min-h-[32px] hover:text-blue-600 transition">
                          {item.name}
                        </h4>
                      </Link>
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
                      
                      {/* Tombol Tambah ke Keranjang */}
                      <button
                        onClick={(e) => handleAddToCart(e, item)}
                        disabled={item.stock === 0}
                        className={`mt-2 w-full py-1.5 border text-[11px] font-bold rounded-sm transition-colors flex items-center justify-center gap-1 ${
                          item.stock > 0
                            ? 'bg-blue-50 border-blue-400 text-blue-700 hover:bg-blue-500 hover:text-white hover:border-blue-500'
                            : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <HiOutlineShoppingBag className="w-3.5 h-3.5" /> {item.stock > 0 ? 'Tambah' : 'Habis'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}