// Lokasi: src/pages/EditProfilePage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import {
  HiUser,
  HiOutlineShieldCheck,
  HiLocationMarker
} from 'react-icons/hi';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Impor ke-3 Komponen yang sudah dipecah
import PersonalInfoForm from '../components/Profile/PersonalInfoForm';
import SecurityForm from '../components/Profile/SecurityForm';
import AddressFormTab from '../components/Profile/AddressFormTab';

export default function EditProfilePage() {
  // === STATE PROFIL ===
  const [profile, setProfile] = useState({
    name: '', email: '', phone: '', username: '', gender: '', birth_date: ''
  });

  // === STATE KEAMANAN ===
  const [passwordData, setPasswordData] = useState({
    current_password: '', new_password: '', new_password_confirmation: ''
  });

  // === STATE ALAMAT ===
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    label: '', recipient_name: '', phone: '', address: '', detail_address: '',
    province_id: '', province_name: '', city_id: '', city_name: '',
    subdistrict_id: '', subdistrict_name: '', postal_code: '', is_default: false,
  });

  // === STATE MAPS & PENCARIAN ALAMAT ===
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [mapCenter, setMapCenter] = useState([-0.9471, 100.4172]);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [addressSearchTimeout, setAddressSearchTimeout] = useState(null);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Load awal data dari Local Storage dan tarik daftar alamat dari Backend
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setProfile({
        name: storedUser.name || '', email: storedUser.email || '', phone: storedUser.phone || '',
        username: storedUser.username || '', gender: storedUser.gender || '', birth_date: storedUser.birth_date || ''
      });
    }
    fetchAddresses();
  }, []);

  // --- KUMPULAN FUNGSI ALAMAT (Dikirim ke AddressFormTab) ---
  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/user/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddresses(response.data);
    } catch { console.error('Error fetching addresses'); }
  };

  const handleSearchLocation = async () => {
    if (searchKeyword.length < 3) {
      Swal.fire("Pencarian", "Ketik minimal 3 huruf kecamatan/kota tujuan.", "info");
      return;
    }
    setIsSearching(true);
    setShowResults(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/shipping/search?keyword=${searchKeyword}`);
      const data = res.data.data || res.data;
      setSearchResults(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length === 0) {
        Swal.fire("Tidak Ditemukan", "Lokasi tidak ditemukan.", "warning");
      }
    } catch (error) {
      console.error("Gagal mencari lokasi:", error);
      setSearchResults([]);
    } finally { setIsSearching(false); }
  };

  const selectLocation = (loc) => {
    let rawName = loc.name || loc.label || loc.text || '';
    if (typeof rawName === 'string') {
      rawName = rawName.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    }
    const parts = rawName.split(',').map(p => p.trim());
    let pName = '-', cName = '-', sName = rawName;
    if (parts.length >= 4) {
      pName = parts[parts.length - 1]; cName = parts[parts.length - 2]; sName = parts[parts.length - 3];
    } else if (parts.length === 3) {
      pName = parts[2]; cName = parts[1]; sName = parts[0];
    } else if (parts.length === 2) {
      pName = '-'; cName = parts[1]; sName = parts[0];
    }
    if (loc.province_name || loc.province) pName = loc.province_name || loc.province;
    if (loc.city_name || loc.city) cName = loc.city_name || loc.city;
    if (loc.subdistrict_name || loc.district_name) sName = loc.subdistrict_name || loc.district_name;
    const locId = loc.id || loc.subdistrict_id || loc.value || '';
    const fullString = `${sName}, ${cName}, ${pName}`;

    setAddressForm({
      ...addressForm,
      province_id: String(loc.province_id || locId), province_name: pName,
      city_id: String(loc.city_id || locId), city_name: cName,
      subdistrict_id: String(locId), subdistrict_name: sName,
    });
    setSearchKeyword(fullString);
    setShowResults(false);

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullString)}&limit=1`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setMapCenter([lat, lon]);
        }
      })
      .catch(err => console.error("Gagal geser peta", err));
  };

  const handleDetailAddressInput = (e) => {
    const val = e.target.value;
    setAddressForm(prev => ({ ...prev, address: val }));
    if (val.length < 4) {
      setShowAddressSuggestions(false);
      return;
    }
    if (addressSearchTimeout) clearTimeout(addressSearchTimeout);
    const timeout = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&addressdetails=1&limit=5`)
        .then(res => res.json())
        .then(data => {
          setAddressSuggestions(data);
          setShowAddressSuggestions(true);
        })
        .catch(err => console.error("Error mencari alamat", err));
    }, 1500);
    setAddressSearchTimeout(timeout);
  };

  const selectAddressSuggestion = async (suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);
    const postCode = suggestion.address?.postcode || addressForm.postal_code;
    const addressDetails = suggestion.address || {};

    let province = addressDetails.state || addressDetails.province || addressDetails.region || '';
    let city = addressDetails.city || addressDetails.town || addressDetails.village || addressDetails.county || addressDetails.municipality || '';
    let district = addressDetails.suburb || addressDetails.neighbourhood || addressDetails.hamlet || addressDetails.village || addressDetails.district || '';

    const display = suggestion.display_name ? suggestion.display_name.replace(/,\s*Sumatra\s*(?=,|$)/gi, '').replace(/,\s*Sumatera\s*(?=,|$)/gi, '') : '';
    const parts = display.split(',').map(p => p.trim());
    if (!district && parts.length >= 3) {
      if (parts.length >= 4) district = parts[parts.length - 3];
      else if (parts.length === 3) district = parts[0];
    }
    if (!city && parts.length >= 2) {
      city = parts[parts.length - 2];
    }
    if (!province && parts.length >= 1) {
      province = parts[parts.length - 1];
    }

    const clean = (str) => str?.replace(/\d+/g, '').trim() || '';
    province = clean(province);
    city = clean(city);
    district = clean(district);

    setMapCenter([lat, lon]);
    setMarkerPosition({ lat, lng: lon });

    setAddressForm(prev => ({
      ...prev, address: display, postal_code: postCode, province_name: province,
      city_name: city, subdistrict_name: district, subdistrict_id: '', city_id: '', province_id: ''
    }));
    setSearchKeyword(district ? `${district}, ${city}, ${province}` : '');

    if (district && city) {
      try {
        const searchRes = await axios.get(`${API_BASE_URL}/shipping/search?keyword=${district} ${city}`);
        const data = searchRes.data.data || searchRes.data;
        if (Array.isArray(data) && data.length > 0) {
          const matched = data.find(loc => loc.subdistrict_name?.toLowerCase().includes(district.toLowerCase()) && loc.city_name?.toLowerCase().includes(city.toLowerCase())) || data[0];

          if (matched && (matched.id || matched.subdistrict_id)) {
            const resolvedSubdistrictId = matched.id || matched.subdistrict_id;
            const resolvedCityId = matched.city_id || resolvedSubdistrictId;
            const resolvedProvinceId = matched.province_id || resolvedSubdistrictId;
            setAddressForm(prev => ({
              ...prev,
              subdistrict_id: String(resolvedSubdistrictId), city_id: String(resolvedCityId), province_id: String(resolvedProvinceId),
              subdistrict_name: matched.subdistrict_name || district, city_name: matched.city_name || city, province_name: matched.province_name || province
            }));
            setSearchKeyword(`${matched.subdistrict_name}, ${matched.city_name}, ${matched.province_name}`);
          }
        }
      } catch (err) { console.error("Gagal mencari ID", err); }
    }
    setShowAddressSuggestions(false);
  };

  const saveAddress = async () => {
    let finalAddress = addressForm.address;
    if (addressForm.detail_address && addressForm.detail_address.trim() !== '') {
      finalAddress = `${addressForm.address} (${addressForm.detail_address.trim()})`;
    }
    if (!addressForm.recipient_name || !addressForm.phone || !finalAddress) {
      Swal.fire({ icon: 'error', title: 'Data Belum Lengkap', text: 'Mohon lengkapi Nama Penerima, Nomor Telepon, dan Alamat Lengkap.' }); return;
    }
    if (!addressForm.subdistrict_id || !addressForm.city_id || !addressForm.province_id) {
      Swal.fire({ icon: 'error', title: 'Wilayah Tidak Valid', text: 'Sistem membutuhkan ID Provinsi, Kota, dan Kecamatan.' }); return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const dataToSend = {
        ...addressForm, address: finalAddress, phone: String(addressForm.phone), postal_code: String(addressForm.postal_code || '00000'), is_default: Boolean(addressForm.is_default)
      };
      delete dataToSend.detail_address;

      if (editingAddress) {
        await axios.put(`${API_BASE_URL}/user/addresses/${editingAddress.id}`, dataToSend, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API_BASE_URL}/user/addresses`, dataToSend, { headers: { Authorization: `Bearer ${token}` } });
      }

      await fetchAddresses();
      setShowAddressForm(false); setEditingAddress(null); setSearchKeyword(''); setMarkerPosition(null);
      setAddressForm({ label: '', recipient_name: '', phone: '', address: '', detail_address: '', province_id: '', province_name: '', city_id: '', city_name: '', subdistrict_id: '', subdistrict_name: '', postal_code: '', is_default: false });
      Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Alamat berhasil disimpan', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
    } catch (err) { Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan saat menyimpan', 'error'); }
    finally { setLoading(false); }
  };

  const deleteAddress = async (id) => {
    const result = await Swal.fire({ title: 'Hapus Alamat?', text: 'Alamat akan dihapus permanen', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Ya', cancelButtonText: 'Batal' });
    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_BASE_URL}/user/addresses/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        await fetchAddresses();
        Swal.fire({ icon: 'success', title: 'Terhapus!', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
      } catch { Swal.fire('Gagal', 'Terjadi kesalahan', 'error'); }
    }
  };

  const setDefaultAddress = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/user/addresses/${id}/default`, {}, { headers: { Authorization: `Bearer ${token}` } });
      await fetchAddresses();
      Swal.fire({ icon: 'success', title: 'Utama Diubah', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
    } catch { Swal.fire('Gagal', 'Terjadi kesalahan', 'error'); }
  };

  const editAddress = (address) => {
    setEditingAddress(address);
    setAddressForm({
      label: address.label || '', recipient_name: address.recipient_name, phone: address.phone, address: address.address, detail_address: '',
      province_id: address.province_id || '', province_name: address.province_name || '', city_id: address.city_id || '', city_name: address.city_name || '',
      subdistrict_id: address.subdistrict_id || '', subdistrict_name: address.subdistrict_name || '', postal_code: address.postal_code || '', is_default: address.is_default || false,
    });
    setSearchKeyword(`${address.subdistrict_name}, ${address.city_name}, ${address.province_name}`);
    setShowAddressForm(true); setMarkerPosition(null);
  };

  const openAddressForm = () => {
    setEditingAddress(null); setSearchKeyword(''); setShowResults(false); setMarkerPosition(null); setMapCenter([-0.9471, 100.4172]);
    setAddressForm({ label: '', recipient_name: '', phone: '', address: '', detail_address: '', province_id: '', province_name: '', city_id: '', city_name: '', subdistrict_id: '', subdistrict_name: '', postal_code: '', is_default: false });
    setShowAddressForm(true);
  };


  // --- FUNGSI UPDATE STATE & API ---
  const handleProfileChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm({ ...addressForm, [name]: type === 'checkbox' ? checked : value });
  };

  const updateProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_BASE_URL}/user/profile`, profile, { headers: { Authorization: `Bearer ${token}` } });
      localStorage.setItem('user', JSON.stringify(response.data.user));
      Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Profil diperbarui', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
    } catch (err) { Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan. Coba username lain.', 'error'); }
    finally { setLoading(false); }
  };

  const updatePassword = async () => {
    if (!passwordData.current_password) { Swal.fire('Error', 'Masukkan password saat ini', 'warning'); return; }
    if (passwordData.new_password !== passwordData.new_password_confirmation) { Swal.fire('Error', 'Konfirmasi password tidak cocok', 'error'); return; }
    if (passwordData.new_password && passwordData.new_password.length < 8) { Swal.fire('Error', 'Password minimal 8 karakter', 'error'); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/user/profile`, {
        current_password: passwordData.current_password,
        password: passwordData.new_password,
        password_confirmation: passwordData.new_password_confirmation
      }, { headers: { Authorization: `Bearer ${token}` } });
      Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Password diubah', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
      setPasswordData({ current_password: '', new_password: '', new_password_confirmation: '' });
    } catch (e) { Swal.fire('Gagal', e.response?.data?.message || 'Error', 'error'); }
    finally { setLoading(false); }
  };

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : 'U';

  return (
    <>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="mb-6 text-sm text-gray-500">
            <Link to="/" className="hover:text-gray-800 transition">Beranda</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-800 font-semibold">Pengaturan Akun</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <div className="lg:w-80 flex-shrink-0">
              <div className="bg-white rounded-lg border border-gray-200 p-5 sticky top-24 shadow-sm">
                <div className="text-center mb-5 pb-5 border-b border-gray-200">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 mx-auto mb-3">
                    <span className="text-3xl font-bold text-gray-700">{getInitial(profile.name)}</span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg">{profile.name || 'Pengguna'}</h3>
                  <p className="text-sm text-gray-500">{profile.email}</p>
                </div>
                <div className="space-y-1 mt-4">
                  {[
                    { id: 'profile', label: 'Informasi Profil', icon: HiUser },
                    { id: 'address', label: 'Alamat Saya', icon: HiLocationMarker },
                    { id: 'security', label: 'Keamanan Akun', icon: HiOutlineShieldCheck },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition ${activeTab === tab.id ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                        }`}
                    >
                      <tab.icon className="w-4 h-4" /> <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Area Konten Utama Tab */}
            <div className="flex-1">

              {activeTab === 'profile' && (
                <PersonalInfoForm
                  profile={profile}
                  handleProfileChange={handleProfileChange}
                  updateProfile={updateProfile}
                  loading={loading}
                />
              )}

              {activeTab === 'security' && (
                <SecurityForm
                  passwordData={passwordData}
                  handlePasswordChange={handlePasswordChange}
                  updatePassword={updatePassword}
                  loading={loading}
                />
              )}

              {activeTab === 'address' && (
                <AddressFormTab
                  addresses={addresses} editingAddress={editingAddress} showAddressForm={showAddressForm} loading={loading}
                  openAddressForm={openAddressForm} editAddress={editAddress} deleteAddress={deleteAddress} setDefaultAddress={setDefaultAddress} saveAddress={saveAddress}
                  addressForm={addressForm} handleAddressChange={handleAddressChange} handleDetailAddressInput={handleDetailAddressInput}
                  searchKeyword={searchKeyword} setSearchKeyword={setSearchKeyword} handleSearchLocation={handleSearchLocation} isSearching={isSearching}
                  showResults={showResults} searchResults={searchResults} selectLocation={selectLocation}
                  showAddressSuggestions={showAddressSuggestions} addressSuggestions={addressSuggestions} selectAddressSuggestion={selectAddressSuggestion}
                  mapCenter={mapCenter} setMapCenter={setMapCenter} markerPosition={markerPosition} setMarkerPosition={setMarkerPosition}
                  setAddressForm={setAddressForm} setShowAddressForm={setShowAddressForm} setEditingAddress={setEditingAddress} Swal={Swal}
                />
              )}

            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}