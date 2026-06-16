import axios from 'axios';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2'; 
import { 
    HiOutlineUser, 
    HiOutlineLockClosed, 
    HiOutlineBell, 
    HiCheckCircle
} from 'react-icons/hi';

export default function ProfileAdmin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); 

  return (
    <div className="max-w-5xl mx-auto font-sans text-gray-900 pb-12 animate-fadeIn">
      
      {/* Header Halaman */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Akun</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola informasi profil, keamanan akun.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* === SIDEBAR KIRI (KARTU PROFIL & MENU) === */}
        <div className="lg:col-span-4 space-y-6">
            
            {/* Kartu Profil Utama */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 flex flex-col items-center text-center">
                    
                    <div className="relative mb-4 group">
                        <div className="w-24 h-24 rounded-full border border-gray-200 shadow-sm overflow-hidden bg-gray-50">
                            <img 
                                src={`https://ui-avatars.com/api/?name=${user?.name || 'Admin'}&background=0f172a&color=fff&size=256`} 
                                alt="Profile" 
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900">{user?.name || 'Administrator'}</h3>
                    <p className="text-gray-500 text-sm mb-4">{user?.email}</p>
                    
                    <div className="flex gap-2">
                        <span className="px-2.5 py-0.5 bg-gray-100 border border-gray-200 text-gray-600 text-[10px] font-bold rounded-md uppercase tracking-wider">
                            Super Admin
                        </span>
                        <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold rounded-md uppercase tracking-wider">
                            Verified
                        </span>
                    </div>
                </div>

                {/* Menu Tab Navigasi */}
                <div className="border-t border-gray-100">
                    <button 
                        onClick={() => setActiveTab('profile')}
                        className={`w-full flex items-center gap-3 px-6 py-3.5 text-sm font-medium transition-colors border-l-2 ${activeTab === 'profile' ? 'bg-blue-50/50 text-blue-700 border-blue-600' : 'text-gray-600 hover:bg-gray-50 border-transparent'}`}
                    >
                        <HiOutlineUser className="w-5 h-5" /> Edit Profil
                    </button>
                    <button 
                        onClick={() => setActiveTab('security')}
                        className={`w-full flex items-center gap-3 px-6 py-3.5 text-sm font-medium transition-colors border-l-2 ${activeTab === 'security' ? 'bg-blue-50/50 text-blue-700 border-blue-600' : 'text-gray-600 hover:bg-gray-50 border-transparent'}`}
                    >
                        <HiOutlineLockClosed className="w-5 h-5" /> Keamanan
                    </button>
                    {/* <button 
                        onClick={() => setActiveTab('notifications')}
                        className={`w-full flex items-center gap-3 px-6 py-3.5 text-sm font-medium transition-colors border-l-2 ${activeTab === 'notifications' ? 'bg-blue-50/50 text-blue-700 border-blue-600' : 'text-gray-600 hover:bg-gray-50 border-transparent'}`}
                    >
                        <HiOutlineBell className="w-5 h-5" /> Notifikasi
                    </button> */}
                </div>
            </div>
        </div>

        {/* === KONTEN KANAN (Dynamic Form) === */}
        <div className="lg:col-span-8">
            {activeTab === 'profile' && <TabProfile user={user} />}
            {activeTab === 'security' && <TabSecurity />}
            {activeTab === 'notifications' && <TabNotifications />}
        </div>

      </div>
    </div>
  );
}

// ==========================================
// SUB COMPONENTS (ISI TAB)
// ==========================================

// 1. TAB PROFIL
function TabProfile({ user }) {
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '', 
        bio: user?.bio || ''    
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name) {
            Swal.fire({
              title: "Peringatan",
              text: "Nama lengkap tidak boleh kosong!",
              icon: "warning",
              buttonsStyling: false,
              customClass: {
                popup: 'rounded-xl border border-gray-200 shadow-sm',
                confirmButton: 'bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700'
              }
            });
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            
            await axios.put('http://127.0.0.1:8000/api/admin/profile/info', {
                name: formData.name,
                phone: formData.phone,
                bio: formData.bio
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update memori browser
            const currentUserStr = localStorage.getItem('user');
            if (currentUserStr) {
                let currentUserObj = JSON.parse(currentUserStr);
                currentUserObj.name = formData.name;
                currentUserObj.phone = formData.phone;
                currentUserObj.bio = formData.bio;
                localStorage.setItem('user', JSON.stringify(currentUserObj));
            }

            // Notifikasi Enterprise Style
            Swal.fire({
                icon: 'success',
                title: 'Profil Diperbarui',
                text: 'Perubahan informasi pribadi Anda berhasil disimpan.',
                buttonsStyling: false,
                showConfirmButton: true,
                confirmButtonText: 'Tutup',
                customClass: {
                  popup: 'rounded-xl shadow-lg border border-gray-100',
                  title: 'text-lg font-bold text-gray-900',
                  htmlContainer: 'text-sm text-gray-500',
                  confirmButton: 'mt-4 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.reload(); 
                }
            });
            
        } catch (error) {
            console.error("Gagal update profil", error);
            Swal.fire({
                icon: 'error',
                title: 'Gagal Menyimpan',
                text: error.response?.data?.message || 'Terjadi kesalahan pada server.',
                buttonsStyling: false,
                customClass: {
                  popup: 'rounded-xl shadow-lg border border-gray-100',
                  confirmButton: 'bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700'
                }
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fadeIn">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                    <HiOutlineUser className="w-5 h-5 text-gray-500" /> Informasi Pribadi
                </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
                        <input 
                            type="text" 
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Role / Hak Akses</label>
                        <input 
                            type="text" 
                            value="Super Administrator" 
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-sm cursor-not-allowed" 
                            disabled 
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Alamat Email</label>
                        <input 
                            type="email" 
                            value={user?.email} 
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-sm cursor-not-allowed" 
                            disabled 
                            title="Email terikat pada akun dan tidak dapat diubah"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor Telepon</label>
                        <input 
                            type="text" 
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Contoh: 08123456789" 
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors" 
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio Singkat</label>
                    <textarea 
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        rows="3" 
                        placeholder="Tulis deskripsi singkat..." 
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors resize-y"
                    ></textarea>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors
                            ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
                        `}
                    >
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <HiCheckCircle className="w-4 h-4" />
                        )}
                        {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>
            </form>
        </div>
    )
}

// 2. TAB SECURITY
function TabSecurity() {
    const [loading, setLoading] = useState(false);
    const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });

    const handleChange = (e) => {
        setPassData({ ...passData, [e.target.name]: e.target.value });
    };

    const handleUpdatePassword = async (e) => { 
        e.preventDefault();

        // Custom styling for standard alerts
        const swalConfig = {
          buttonsStyling: false,
          customClass: {
            popup: 'rounded-xl shadow-lg border border-gray-100',
            confirmButton: 'bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors mt-4'
          }
        };

        if (!passData.current || !passData.new || !passData.confirm) {
            Swal.fire({ ...swalConfig, icon: "warning", title: "Peringatan", text: "Harap lengkapi semua bidang." }); return;
        }
        if (passData.new !== passData.confirm) {
            Swal.fire({ ...swalConfig, icon: "error", title: "Gagal", text: "Konfirmasi password baru tidak cocok." }); return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token'); 

            await axios.put('http://127.0.0.1:8000/api/admin/profile/password', {
                current_password: passData.current,
                new_password: passData.new,
                new_password_confirmation: passData.confirm
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Swal.fire({
                ...swalConfig,
                icon: 'success',
                title: 'Password Diperbarui!',
                text: 'Gunakan password baru ini untuk sesi login Anda berikutnya.',
                confirmButtonText: 'Tutup',
                customClass: {
                  ...swalConfig.customClass,
                  confirmButton: 'bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 mt-4'
                }
            });
            setPassData({ current: '', new: '', confirm: '' }); 
            
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || "Gagal mengganti password.";
            Swal.fire({ ...swalConfig, icon: "error", title: "Gagal", text: msg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fadeIn">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                    <HiOutlineLockClosed className="w-5 h-5 text-gray-500" /> Ubah Password
                </h3>
            </div>
            
            <form onSubmit={handleUpdatePassword} className="p-6 space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password Saat Ini</label>
                    <input 
                        type="password" name="current"
                        value={passData.current} onChange={handleChange}
                        className="w-full md:w-1/2 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors" 
                    />
                </div>
                <hr className="border-gray-100" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Password Baru</label>
                        <input 
                            type="password" name="new"
                            value={passData.new} onChange={handleChange}
                            placeholder="Minimal 8 karakter" 
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Konfirmasi Password Baru</label>
                        <input 
                            type="password" name="confirm"
                            value={passData.confirm} onChange={handleChange}
                            placeholder="Ulangi password baru" 
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors" 
                        />
                    </div>
                </div>
                <div className="pt-4 flex justify-end">
                    <button 
                        type="submit" disabled={loading}
                        className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors
                            ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
                        `}
                    >
                        {loading ? 'Memproses...' : 'Perbarui Password'}
                    </button>
                </div>
            </form>
        </div>
    )
}