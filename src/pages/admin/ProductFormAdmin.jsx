// Lokasi: src/pages/admin/ProductFormAdmin.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import {
  HiArrowLeft,
  HiCloudUpload,
  HiX,
  HiCheckCircle,
  HiPlus,
  HiOutlineInformationCircle,
  HiOutlineTag,
  HiOutlinePhotograph,
  HiOutlineCube,
  HiOutlineTruck,
  HiOutlineTicket
} from 'react-icons/hi';
import Swal from 'sweetalert2';

export default function ProductFormAdmin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    price: '',
    displayPrice: '',
    stock: '',
    description: '',
    weight: '',
    dimensions: '',
    discount_percent: '',
    discount_end_date: ''
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePriceChange = (e) => {
    let rawValue = e.target.value;
    let numericValue = rawValue.replace(/[^0-9]/g, '');
    let displayValue = numericValue ? Number(numericValue).toLocaleString('id-ID') : '';
    setFormData({
      ...formData,
      price: numericValue,
      displayPrice: displayValue
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire('Error', 'Ukuran file maksimal 10MB', 'error');
        return;
      }
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire('Error', 'Ukuran file maksimal 10MB', 'error');
        return;
      }
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Hanya memproses file gambar
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    // Saring file yang ukurannya di bawah 10MB
    const validFiles = imageFiles.filter(file => file.size <= 10 * 1024 * 1024);
    
    if (validFiles.length !== imageFiles.length) {
      Swal.fire('Peringatan', 'Beberapa file melebihi 10MB dan tidak disertakan', 'warning');
    }

    // Hitung berapa sisa slot foto yang masih kosong (Maksimal 2)
    const spaceLeft = 2 - galleryPreviews.length;
    
    if (spaceLeft <= 0) {
        Swal.fire('Peringatan', 'Kapasitas penuh! Maksimal 2 foto tambahan.', 'warning');
        return;
    }

    // Ambil file yang valid sesuai jumlah slot yang tersisa saja (mencegah kelebihan kuota)
    const allowedFiles = validFiles.slice(0, spaceLeft);

    if (allowedFiles.length > 0) {
      setGalleryImages(prev => [...prev, ...allowedFiles]);
      const newPreviews = allowedFiles.map(file => URL.createObjectURL(file));
      setGalleryPreviews(prev => [...prev, ...newPreviews]);
      
      // Jika pengguna memasukkan terlalu banyak file, beri tahu bahwa sebagian terpotong
      if(validFiles.length > spaceLeft) {
          Swal.fire('Peringatan', `Hanya ${spaceLeft} foto yang ditambahkan untuk memenuhi batas maksimal (2).`, 'info');
      }
    }
  };

  const removeGalleryImage = (indexToRemove) => {
    setGalleryImages(prev => prev.filter((_, index) => index !== indexToRemove));
    setGalleryPreviews(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.discount_percent && !formData.discount_end_date) {
      setLoading(false);
      return Swal.fire('Perhatian', 'Jika memasukkan persentase diskon, batas waktu berakhir diskon juga harus diisi.', 'warning');
    }
    if (formData.discount_end_date && !formData.discount_percent) {
      setLoading(false);
      return Swal.fire('Perhatian', 'Masukkan persentase diskon (1-99) jika Anda menyetel tanggal diskon.', 'warning');
    }

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('category_id', formData.category_id);
      data.append('price', formData.price);
      data.append('stock', formData.stock);
      data.append('description', formData.description);
      data.append('weight', formData.weight);
      data.append('dimensions', formData.dimensions);

      if (formData.discount_percent) data.append('discount_percent', formData.discount_percent);
      if (formData.discount_end_date) data.append('discount_end_date', formData.discount_end_date);

      if (image) data.append('image', image);
      if (galleryImages.length > 0) {
        galleryImages.forEach((file) => data.append('gallery[]', file));
      }

      await axios.post(`${API_BASE_URL}/admin/products`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Produk berhasil ditambahkan',
        confirmButtonColor: '#2563eb',
        timer: 2000
      }).then(() => {
        navigate('/admin/products');
      });

    } catch (error) {
      console.error('❌ Gagal simpan produk:', error.response);
      Swal.fire({
        icon: 'error',
        title: 'Gagal!',
        text: error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data',
        confirmButtonColor: '#2563eb'
      });
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 1, label: 'Head Unit', icon: '📻' },
    { id: 2, label: 'Speaker', icon: '🔊' },
    { id: 3, label: 'Subwoofer', icon: '🔉' },
    { id: 4, label: 'Power & DSP', icon: '⚡' },
    { id: 5, label: 'Aksesoris', icon: '🔧' },
  ];

  const isFormValid = formData.name && formData.category_id && formData.price && formData.stock && image;

  const calculateDiscount = () => {
    if (!formData.price || !formData.discount_percent) return null;
    const price = Number(formData.price);
    const disc = Number(formData.discount_percent);
    if (disc <= 0 || disc >= 100) return null;
    return price - (price * (disc / 100));
  };
  const discountedPrice = calculateDiscount();

  return (
    <div className="max-w-5xl mx-auto pb-8 font-sans text-gray-900 animate-fadeIn">
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/admin/products"
          className="p-2 bg-white border border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <HiArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tambah Produk</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6 items-start">

        <div className="flex-1 w-full space-y-6">

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50">
              <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <HiOutlineInformationCircle className="w-5 h-5 text-gray-500" />
                Informasi Dasar
              </h2>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nama Produk <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
                  onChange={handleChange}
                  value={formData.name}
                  placeholder="Contoh: Speaker JBL Stage 3 6x9 inch"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Deskripsi Produk
                </label>
                <textarea
                  name="description"
                  rows="4"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors resize-y"
                  onChange={handleChange}
                  value={formData.description}
                  placeholder="Jelaskan spesifikasi, keunggulan, dan detail produk..."
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50">
              <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <HiOutlinePhotograph className="w-5 h-5 text-gray-500" />
                Media
              </h2>
            </div>
            <div className="p-5 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto Utama <span className="text-red-500">*</span>
                </label>
                {preview ? (
                  <div className="relative rounded-lg overflow-hidden border border-gray-200 w-48 h-48 bg-gray-50 group">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-2">
                      <label className="bg-white text-gray-800 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer hover:bg-gray-100">
                        Ganti
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                      </label>
                      <button type="button" onClick={() => { setPreview(null); setImage(null); }} className="bg-red-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-red-600">
                        Hapus
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors w-full sm:w-64 h-48 ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'
                      }`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                  >
                    <HiCloudUpload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-blue-600 mb-1">Klik untuk upload</p>
                    <p className="text-xs text-gray-500">atau drag and drop (Max 10MB)</p>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} required />
                  </label>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto Tambahan (Opsional) <span className="text-gray-400 font-normal ml-1">Maks 2</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {galleryPreviews.map((url, index) => (
                    <div key={index} className="relative w-24 h-24 rounded-lg border border-gray-200 overflow-hidden group">
                      <img src={url} alt="Gallery" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeGalleryImage(index)} className="absolute top-1 right-1 bg-white/90 text-red-600 rounded-md p-1 shadow-sm opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all">
                        <HiX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {galleryPreviews.length < 2 && (
                    <label className="flex flex-col items-center justify-center w-24 h-24 border border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      <HiPlus className="w-5 h-5 text-gray-400" />
                      <span className="text-[10px] text-gray-500 font-medium mt-1">Tambah</span>
                      <input type="file" className="hidden" accept="image/*" multiple onChange={handleGalleryChange} />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50">
              <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <HiOutlineCube className="w-5 h-5 text-gray-500" />
                Harga & Inventaris
              </h2>
            </div>
            <div className="p-5 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Harga Normal <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">Rp</span>
                    <input
                      type="text"
                      required
                      className={`w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors ${discountedPrice ? 'text-gray-400 line-through' : 'text-gray-900'}`}
                      onChange={handlePriceChange}
                      value={formData.displayPrice}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Stok <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="stock"
                    required
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors"
                    onChange={handleChange}
                    value={formData.stock}
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-800 flex items-center gap-2 mb-4">
                  <HiOutlineTicket className="w-4 h-4" /> Atur Diskon (Opsional)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Potongan Harga (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="discount_percent"
                        className="w-full pl-3 pr-8 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        onChange={handleChange}
                        value={formData.discount_percent}
                        min="1" max="99"
                        placeholder="Misal: 15"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Berlaku Sampai
                    </label>
                    <input
                      type="datetime-local"
                      name="discount_end_date"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      onChange={handleChange}
                      value={formData.discount_end_date}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                </div>

                {discountedPrice && (
                  <div className="mt-4 pt-3 border-t border-blue-200/60 flex justify-between items-center">
                    <span className="text-xs text-blue-600 font-medium">Harga setelah diskon:</span>
                    <span className="text-lg font-bold text-red-600">Rp {discountedPrice.toLocaleString('id-ID')}</span>
                  </div>
                )}
                {formData.discount_percent && formData.discount_end_date && (
                  <p className="text-[10px] text-gray-500 mt-3 text-center">
                    Kosongkan kedua kolom di atas jika ingin menonaktifkan diskon.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50">
              <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <HiOutlineTruck className="w-5 h-5 text-gray-500" />
                Pengiriman
              </h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Berat (Gram)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="weight"
                    className="w-full pl-3 pr-10 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors"
                    onChange={handleChange}
                    value={formData.weight}
                    placeholder="1000"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">g</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Dimensi PxLxT (Opsional)
                </label>
                <input
                  type="text"
                  name="dimensions"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors"
                  onChange={handleChange}
                  value={formData.dimensions}
                  placeholder="Contoh: 30x20x15"
                />
              </div>
            </div>
          </div>

        </div>

        <div className="w-full lg:w-80 space-y-6 lg:sticky lg:top-6">

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Aksi</h2>
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-blue-700 focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-3"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <HiCheckCircle className="w-5 h-5" />
              )}
              Simpan Produk
            </button>
            <Link
              to="/admin/products"
              className="w-full block text-center py-2.5 px-4 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50">
              <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <HiOutlineTag className="w-5 h-5 text-gray-500" />
                Kategori
              </h2>
            </div>
            <div className="p-2 space-y-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, category_id: String(cat.id) })}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-sm ${formData.category_id === String(cat.id)
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg grayscale opacity-70">{cat.icon}</span>
                    <span>{cat.label}</span>
                  </div>
                  {formData.category_id === String(cat.id) && (
                    <HiCheckCircle className="w-5 h-5 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}