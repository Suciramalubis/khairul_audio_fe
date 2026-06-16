// Lokasi: src/components/Profile/SecurityForm.jsx
import React from 'react';
import { HiLockClosed, HiSave, HiOutlineShieldCheck } from 'react-icons/hi';

export default function SecurityForm({ passwordData, handlePasswordChange, updatePassword, loading }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">Keamanan Akun</h2>
        <p className="text-sm text-gray-500 mt-0.5">Perbarui password Anda secara berkala</p>
      </div>
      <div className="p-6 space-y-5">
        <div className="bg-blue-50 p-3 rounded-md border border-blue-100 text-sm text-blue-800 flex items-center gap-2">
          <HiOutlineShieldCheck className="w-5 h-5 shrink-0" />
          Gunakan password yang kuat dan unik untuk melindungi akun Anda.
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password Saat Ini</label>
          <div className="relative">
            <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="password" name="current_password" value={passwordData.current_password} onChange={handlePasswordChange} placeholder="Masukkan password Anda saat ini" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500" />
          </div>
        </div>
        <hr className="my-4 border-gray-100" />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
          <div className="relative">
            <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="password" name="new_password" value={passwordData.new_password} onChange={handlePasswordChange} placeholder="Minimal 8 karakter" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru</label>
          <div className="relative">
            <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="password" name="new_password_confirmation" value={passwordData.new_password_confirmation} onChange={handlePasswordChange} placeholder="Ulangi password baru" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500" />
          </div>
        </div>
        <div className="pt-3">
          <button type="button" onClick={updatePassword} disabled={loading} className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-medium py-2.5 rounded-md hover:bg-slate-800 transition disabled:opacity-50">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <HiSave className="w-4 h-4" />}
            Ubah Password
          </button>
        </div>
      </div>
    </div>
  );
}