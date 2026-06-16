// Lokasi: src/pages/admin/SettingsAdmin.jsx

import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { 
    HiOutlineOfficeBuilding,
    HiOutlinePhone, 
    HiSave, 
    HiOutlineLocationMarker,
    HiOutlineAdjustments,
    HiOutlineLibrary
} from 'react-icons/hi';

export default function SettingsAdmin() {
    const [activeTab, setActiveTab] = useState('store');
    const [loading, setLoading] = useState(false);

    const [storeData, setStoreData] = useState({
        storeName: 'Khairul Audio',
        description: 'Toko aksesoris dan modifikasi audio mobil terlengkap dan terpercaya di Medan. Menyediakan berbagai produk audio berkualitas dengan harga terbaik.',
        originId: '41053',
        originName: 'Medan Barat, Medan, Sumatera Utara'
    });

    const [contactData, setContactData] = useState({
        whatsapp: '85359446034',
        instagram: 'khairul.audio',
        facebook: 'Khairul Audio',
        email: 'cs@khairulaudio.com'
    });

    const [systemData, setSystemData] = useState({
        paymentTimeout: '24', // dalam satuan jam
        lowStockThreshold: '5', // batas stok kritis untuk memicu alert dashboard
        bankName: 'Bank BCA',
        bankAccountNumber: '8295142341',
        bankAccountName: 'Khairul Anwar'
    });

    const handleStoreChange = (e) => setStoreData({ ...storeData, [e.target.name]: e.target.value });
    const handleContactChange = (e) => setContactData({ ...contactData, [e.target.name]: e.target.value });
    const handleSystemChange = (e) => setSystemData({ ...systemData, [e.target.name]: e.target.value });

    // Konfigurasi Standar SweetAlert untuk Enterprise Design
    const swalConfig = {
        buttonsStyling: false,
        customClass: {
            popup: 'rounded-xl shadow-lg border border-gray-200',
            title: 'text-lg font-bold text-gray-900',
            htmlContainer: 'text-sm text-gray-500',
            confirmButton: 'bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors mt-4'
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        setLoading(true);

        setTimeout(() => {
            setLoading(false);
            Swal.fire({
                ...swalConfig,
                icon: 'success',
                title: 'Pengaturan Tersimpan',
                text: 'Seluruh konfigurasi sistem berhasil diperbarui.',
                showConfirmButton: false,
                timer: 2000
            });
        }, 1200);
    };

    const tabs = [
        { id: 'store', label: 'Informasi Toko', icon: HiOutlineOfficeBuilding },
        { id: 'system', label: 'Sistem & Rekening', icon: HiOutlineAdjustments },
        { id: 'contact', label: 'Kontak & Sosial', icon: HiOutlinePhone }
    ];

    return (
        <div className="max-w-5xl mx-auto pb-12 font-sans text-gray-900 animate-fadeIn">
            
            {/* HEADER */}
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Pengaturan Sistem</h1>
                    <p className="text-sm text-gray-500 mt-1">Kelola informasi dasar toko, data rekening pembayaran, dan kontak.</p>
                </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex gap-8 overflow-x-auto custom-scrollbar">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                type="button"
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 py-4 px-1 relative text-sm font-medium transition-colors whitespace-nowrap ${
                                    isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
                                }`}
                            >
                                <Icon className="w-5 h-5" />
                                {tab.label}
                                {isActive && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* MAIN CONTENT FORM */}
            <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                
                {/* === TAB: STORE INFORMATION === */}
                {activeTab === 'store' && (
                    <div className="p-6 md:p-8 space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <HiOutlineOfficeBuilding className="w-5 h-5 text-gray-500" />
                                Identitas Toko
                            </h3>
                        </div>
                        
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Nama Toko <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    name="storeName" 
                                    value={storeData.storeName} 
                                    onChange={handleStoreChange} 
                                    required
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Deskripsi Toko <span className="text-red-500">*</span>
                                </label>
                                <textarea 
                                    name="description" 
                                    value={storeData.description} 
                                    onChange={handleStoreChange} 
                                    rows="4" 
                                    required
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors resize-y"
                                />
                                <p className="text-xs text-gray-500 mt-1.5">
                                    {storeData.description.length} / 500 karakter
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <HiOutlineLocationMarker className="w-5 h-5 text-gray-500" />
                                Lokasi Pengiriman Asal (Gudang Utama)
                            </h3>
                            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Kecamatan & Kota Asal</p>
                                    <p className="font-bold text-gray-900">{storeData.originName}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">ID Wilayah Pengiriman: {storeData.originId}</p>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => Swal.fire({...swalConfig, icon: 'info', title: 'Fitur Terkunci', text: 'Perubahan lokasi asal saat ini dikunci dari sistem.'})}
                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
                                >
                                    Ubah Lokasi Asal
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* === TAB: TRANSAKSI & KEBIJAKAN SISTEM === */}
                {activeTab === 'system' && (
                    <div className="p-6 md:p-8 space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <HiOutlineAdjustments className="w-5 h-5 text-gray-500" />
                                Aturan Transaksi & Inventaris Toko
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Batas Kedaluwarsa Pembayaran (Jam) <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="number" 
                                    name="paymentTimeout" 
                                    value={systemData.paymentTimeout} 
                                    onChange={handleSystemChange} 
                                    min="1"
                                    required
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors font-semibold"
                                />
                                <p className="text-xs text-slate-400 mt-1">Batas waktu tunggu pembeli melunasi pesanan sebelum dibatalkan otomatis oleh sistem.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Batas Minimum Peringatan Stok Kritis <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="number" 
                                    name="lowStockThreshold" 
                                    value={systemData.lowStockThreshold} 
                                    onChange={handleSystemChange} 
                                    min="0"
                                    required
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors font-semibold"
                                />
                                <p className="text-xs text-slate-400 mt-1">Jika stok barang di bawah nominal ini, sistem dashboard admin akan memicu alarm peringatan.</p>
                            </div>
                        </div>

                        {/* Pengaturan Nomor Rekening Toko */}
                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <HiOutlineLibrary className="w-4 h-4 text-slate-500" /> Informasi Data Rekening Bank Toko
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nama Bank</label>
                                    <input 
                                        type="text" 
                                        name="bankName"
                                        value={systemData.bankName}
                                        onChange={handleSystemChange}
                                        placeholder="Contoh: Bank BCA"
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nomor Rekening</label>
                                    <input 
                                        type="text" 
                                        name="bankAccountNumber"
                                        value={systemData.bankAccountNumber}
                                        onChange={handleSystemChange}
                                        placeholder="Contoh: 8295xxxx"
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nama Pemilik Rekening</label>
                                    <input 
                                        type="text" 
                                        name="bankAccountName"
                                        value={systemData.bankAccountName}
                                        onChange={handleSystemChange}
                                        placeholder="Nama Pemilik"
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">Data ini otomatis disematkan dan dimuat di invoice pemesanan pembeli untuk instruksi pembayaran transfer bank.</p>
                        </div>
                    </div>
                )}

                {/* === TAB: CONTACT & SOCIAL === */}
                {activeTab === 'contact' && (
                    <div className="p-6 md:p-8 space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-2">
                            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <HiOutlinePhone className="w-5 h-5 text-gray-500" />
                                Layanan Pelanggan & Media Sosial
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ContactInput
                                label="WhatsApp Admin Utama"
                                name="whatsapp"
                                value={contactData.whatsapp}
                                onChange={handleContactChange}
                                prefix="+62"
                            />
                            <ContactInput
                                label="Alamat Email Customer Service"
                                name="email"
                                value={contactData.email}
                                onChange={handleContactChange}
                                type="email"
                            />
                            <ContactInput
                                label="Instagram Username Toko"
                                name="instagram"
                                value={contactData.instagram}
                                onChange={handleContactChange}
                                prefix="@"
                            />
                            <ContactInput
                                label="URL Halaman Facebook"
                                name="facebook"
                                value={contactData.facebook}
                                onChange={handleContactChange}
                                prefix="fb.com/"
                            />
                        </div>
                    </div>
                )}

                {/* === FOOTER BUTTON === */}
                <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-200 flex justify-end">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium text-white transition-colors shadow-sm ${
                            loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <HiSave className="w-4 h-4" />
                        )}
                        {loading ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                    </button>
                </div>

            </form>
        </div>
    );
}

// ============================================
// SUB COMPONENTS
// ============================================

const ContactInput = ({ label, name, value, onChange, prefix, type = "text" }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {label}
            </label>
            <div className="flex">
                {prefix && (
                    <span className="inline-flex items-center px-3 text-sm font-medium text-gray-500 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg select-none">
                        {prefix}
                    </span>
                )}
                <input 
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    className={`px-3 py-2 bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-sm transition-colors ${prefix ? 'flex-1 rounded-r-lg' : 'w-full rounded-lg'}`}
                />
            </div>
        </div>
    );
};