// Lokasi: src/pages/admin/ProductListAdmin.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiSearch,
  HiOutlineCube,
  HiOutlineEmojiSad,
  HiOutlineFilter,
  HiX,
  HiViewGrid,
  HiViewList,
} from 'react-icons/hi';
import Swal from 'sweetalert2'; // ✅ Tambahkan import SweetAlert2

const catEmoji = {
  Headphones: '🎧',
  Earphones: '🎵',
  Speaker: '🔊',
  Aksesoris: '🎒',
};

function fmtPrice(n) {
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(n);
}

function fmtId(id) {
  return 'PD' + String(id).padStart(3, '0');
}

// Utility untuk styling Tailwind berdasarkan stok
function getStockStatus(stock) {
  if (stock === 0) return { label: 'Habis', color: 'text-red-700 bg-red-50 ring-red-600/20', bar: 'bg-red-500' };
  if (stock < 5) return { label: 'Menipis', color: 'text-amber-700 bg-amber-50 ring-amber-600/20', bar: 'bg-amber-500' };
  return { label: 'Tersedia', color: 'text-green-700 bg-green-50 ring-green-600/20', bar: 'bg-green-500' };
}

function stockPct(s) {
  return Math.min(100, Math.round((s / 20) * 100));
}

export default function ProductListAdmin() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // Default 'list' lebih standar untuk admin

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStock, setFilterStock] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [categories, setCategories] = useState([]);

  const API_URL = 'http://127.0.0.1:8000/api/admin/products';

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(API_URL);
      setProducts(response.data);
      const uniqueCats = [
        ...new Set(response.data.map((item) => item.category?.name || 'Uncategorized')),
      ];
      setCategories(uniqueCats);
    } catch (error) {
      console.error('Gagal ambil produk', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ PERBAIKAN: Menggunakan SweetAlert2 dengan gaya Enterprise Custom Tailwind
  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Hapus Produk?',
      text: 'Tindakan ini akan menghapus produk secara permanen.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      buttonsStyling: false, // Matikan style bawaan swal agar bisa pakai Tailwind murni
      customClass: {
        popup: 'rounded-xl shadow-lg border border-gray-100',
        title: 'text-lg font-bold text-gray-900',
        htmlContainer: 'text-sm text-gray-500',
        actions: 'gap-3 mt-6',
        confirmButton: 'bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors',
        cancelButton: 'bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors'
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${API_URL}/${id}`);
          setProducts((prev) => prev.filter((p) => p.id !== id));
          
          // Toast sukses ringan di pojok
          Swal.fire({
            title: "Terhapus!",
            text: "Produk telah dihapus dari katalog.",
            icon: "success",
            toast: true,
            position: "top-end",
            timer: 2500,
            showConfirmButton: false,
            customClass: {
              popup: 'rounded-lg border border-gray-100 shadow-md'
            }
          });
        } catch (error) {
          console.error('Error deleting product:', error);
          Swal.fire({
            title: 'Gagal',
            text: 'Gagal menghapus produk. Silakan coba lagi.',
            icon: 'error',
            buttonsStyling: false,
            customClass: {
              confirmButton: 'bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors'
            }
          });
        }
      }
    });
  };

  const filteredProducts = products.filter((product) => {
    const term = searchTerm.toLowerCase();
    const formattedId = fmtId(product.id).toLowerCase();
    const matchSearch =
      product.name.toLowerCase().includes(term) || formattedId.includes(term);

    const categoryName = product.category?.name || 'Uncategorized';
    const matchCategory = filterCategory === 'All' || categoryName === filterCategory;

    let matchStock = true;
    if (filterStock === 'Available') matchStock = product.stock >= 5;
    if (filterStock === 'Low') matchStock = product.stock > 0 && product.stock < 5;
    if (filterStock === 'Empty') matchStock = product.stock === 0;

    return matchSearch && matchCategory && matchStock;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price_low': return a.price - b.price;
      case 'price_high': return b.price - a.price;
      case 'stock_low': return a.stock - b.stock;
      case 'name_asc': return a.name.localeCompare(b.name);
      case 'newest':
      default: return b.id - a.id;
    }
  });

  const resetFilters = () => {
    setSearchTerm('');
    setFilterCategory('All');
    setFilterStock('All');
    setSortBy('newest');
    setShowFilter(false);
  };

  // Stats
  const statAvail = filteredProducts.filter((p) => p.stock >= 5).length;
  const statLow = filteredProducts.filter((p) => p.stock > 0 && p.stock < 5).length;
  const statEmpty = filteredProducts.filter((p) => p.stock === 0).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Katalog Produk</h2>
          <p className="text-sm text-gray-500 mt-1">Kelola dan pantau inventaris Khairul Audio.</p>
        </div>
        <Link 
          to="/admin/products/create" 
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <HiPlus className="w-5 h-5" />
          Tambah Produk
        </Link>
      </div>

      {/* STATS SECTION */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Produk', val: filteredProducts.length, textClass: 'text-gray-900' },
          { label: 'Tersedia', val: statAvail, textClass: 'text-green-600' },
          { label: 'Menipis', val: statLow, textClass: 'text-amber-600' },
          { label: 'Habis', val: statEmpty, textClass: 'text-red-600' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.textClass}`}>{stat.val}</p>
          </div>
        ))}
      </div>

      {/* TOOLBAR SECTION */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          
          {/* Search */}
          <div className="relative w-full md:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <HiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cari ID atau nama produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
            />
          </div>

          {/* Actions & Toggles */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                title="Grid View"
              >
                <HiViewGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                title="List View"
              >
                <HiViewList className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${showFilter ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              {showFilter ? <HiX className="w-4 h-4" /> : <HiOutlineFilter className="w-4 h-4" />}
              Filter
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-lg"
            >
              <option value="newest">Terbaru</option>
              <option value="name_asc">Nama A–Z</option>
              <option value="price_low">Termurah</option>
              <option value="price_high">Termahal</option>
              <option value="stock_low">Stok Terkecil</option>
            </select>
          </div>
        </div>

        {/* Expandable Filter Panel */}
        {showFilter && (
          <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Kategori</label>
              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-lg"
              >
                <option value="All">Semua Kategori</option>
                {categories.map((cat, i) => (
                  <option key={i} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Status Stok</label>
              <select 
                value={filterStock} 
                onChange={(e) => setFilterStock(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-lg"
              >
                <option value="All">Semua Status</option>
                <option value="Available">✓ Tersedia (≥5)</option>
                <option value="Low">⚠ Menipis (&lt;5)</option>
                <option value="Empty">✕ Habis (0)</option>
              </select>
            </div>
            <div>
              <button 
                onClick={resetFilters}
                className="w-full sm:w-auto px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
              >
                Reset Filter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CONTENT AREA */}
      <div>
        {loading ? (
          // Skeleton Loading Standar
          <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" : "space-y-4"}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`animate-pulse bg-gray-200 rounded-xl ${viewMode === 'grid' ? 'h-72' : 'h-20'}`}></div>
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          // Empty State
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <HiOutlineCube className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak Ada Produk</h3>
            <p className="text-gray-500 text-sm mb-6">Coba sesuaikan filter atau kata kunci pencarian Anda.</p>
            <button onClick={resetFilters} className="text-blue-600 font-medium hover:text-blue-700">Bersihkan Filter</button>
          </div>
        ) : viewMode === 'grid' ? (
          // ================= GRID VIEW =================
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedProducts.map((item) => {
              const catName = item.category?.name || 'Uncategorized';
              const stockStat = getStockStatus(item.stock);
              
              return (
                <div key={item.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                  {/* Image Container */}
                  <div className="relative aspect-square bg-gray-50 flex items-center justify-center border-b border-gray-100 overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">{catEmoji[catName] || '📦'}</span>
                    )}
                    
                    {/* Hover Actions */}
                    <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link to={`/admin/products/edit/${item.id}`} className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <HiPencil className="w-4 h-4" />
                      </Link>
                      <button onClick={() => handleDelete(item.id)} className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{catName}</span>
                      <span className="text-[10px] font-mono text-gray-400">{fmtId(item.id)}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">{item.name}</h3>
                    <p className="text-base font-bold text-gray-900 mt-auto mb-3">{fmtPrice(item.price)}</p>
                    
                    {/* Stock Indicator */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-md ring-1 ring-inset ${stockStat.color}`}>
                          {stockStat.label} ({item.stock})
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${stockStat.bar}`} style={{ width: `${stockPct(item.stock)}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // ================= LIST VIEW (TABLE) =================
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Produk</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kategori</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Harga</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stok</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedProducts.map((item) => {
                    const catName = item.category?.name || 'Uncategorized';
                    const stockStat = getStockStatus(item.stock);

                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 overflow-hidden">
                              {item.image_url ? (
                                <img className="h-10 w-10 object-cover" src={item.image_url} alt="" />
                              ) : (
                                <span className="text-xl">{catEmoji[catName] || '📦'}</span>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                              <div className="text-xs font-mono text-gray-500">{fmtId(item.id)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                            {catName}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {fmtPrice(item.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ring-1 ring-inset ${stockStat.color}`}>
                            {item.stock} — {stockStat.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Link to={`/admin/products/edit/${item.id}`} className="text-gray-400 hover:text-blue-600 transition-colors p-1" title="Edit">
                              <HiPencil className="w-5 h-5" />
                            </Link>
                            <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-600 transition-colors p-1" title="Hapus">
                              <HiTrash className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}