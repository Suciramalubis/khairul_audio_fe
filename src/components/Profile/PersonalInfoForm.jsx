// Lokasi: src/components/Profile/PersonalInfoForm.jsx
import React from 'react';
import { 
  HiUser, 
  HiMail, 
  HiPhone, 
  HiSave, 
  HiIdentification, // Untuk username
  HiCalendar // Untuk tanggal lahir
} from 'react-icons/hi';

export default function PersonalInfoForm({ profile, handleProfileChange, updateProfile, loading }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">Informasi Profil</h2>
        <p className="text-sm text-gray-500 mt-0.5">Perbarui data diri Anda di sini</p>
      </div>
      <div className="p-6 space-y-5">
        
        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <div className="relative">
            <HiIdentification className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              name="username" 
              value={profile.username} 
              onChange={handleProfileChange} 
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500" 
              placeholder="Username unik Anda" 
            />
          </div>
        </div>

        {/* Nama Lengkap */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
          <div className="relative">
            <HiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              name="name" 
              value={profile.name} 
              onChange={handleProfileChange} 
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500" 
              placeholder="Nama lengkap Anda" 
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <div className="relative">
            <HiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="email" 
              name="email" 
              value={profile.email} 
              readOnly 
              disabled 
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed" 
            />
          </div>
        </div>

        {/* Nomor Telepon */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
          <div className="relative">
            <HiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="tel" 
              name="phone" 
              value={profile.phone} 
              onChange={handleProfileChange} 
              placeholder="081234567890" 
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500" 
            />
          </div>
        </div>

        {/* Jenis Kelamin & Tanggal Lahir (Grid Layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Jenis Kelamin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="gender" 
                  value="Laki-laki" 
                  checked={profile.gender === 'Laki-laki'} 
                  onChange={handleProfileChange} 
                  className="text-gray-800 focus:ring-gray-500"
                />
                <span className="text-sm text-gray-700">Laki-laki</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="gender" 
                  value="Perempuan" 
                  checked={profile.gender === 'Perempuan'} 
                  onChange={handleProfileChange} 
                  className="text-gray-800 focus:ring-gray-500"
                />
                <span className="text-sm text-gray-700">Perempuan</span>
              </label>
            </div>
          </div>

          {/* Tanggal Lahir */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir</label>
            <div className="relative">
              <HiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="date" 
                name="birth_date" 
                value={profile.birth_date} 
                onChange={handleProfileChange} 
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500" 
              />
            </div>
          </div>
        </div>

        {/* Tombol Simpan */}
        <div className="pt-3">
          <button 
            onClick={updateProfile} 
            disabled={loading} 
            className="w-full flex items-center justify-center gap-2 bg-gray-800 text-white font-medium py-2.5 rounded-md hover:bg-gray-700 transition disabled:opacity-50"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <HiSave className="w-4 h-4" />}
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
}