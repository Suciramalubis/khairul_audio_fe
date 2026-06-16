// Lokasi: src/components/Profile/AddressFormTab.jsx
import React from 'react';
import { 
  HiLocationMarker, 
  HiPlus, 
  HiPencilAlt, 
  HiTrash, 
  HiSearch 
} from 'react-icons/hi';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Map Components 
function MapUpdater({ center }) {
  const map = useMap();
  React.useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, map.getZoom() < 14 ? 15 : map.getZoom(), { animate: true, duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

function LocationPicker({ markerPosition, setMarkerPosition, setAddressForm, setMapCenter, Swal }) {
  useMapEvents({
    click(e) {
      setMarkerPosition(e.latlng);
      setMapCenter([e.latlng.lat, e.latlng.lng]);
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}&addressdetails=1`)
        .then(res => res.json())
        .then(data => {
          if (data && data.display_name) {
            const postCode = data.address?.postcode || '';
            setAddressForm(prev => ({ 
                ...prev, 
                address: data.display_name ? data.display_name.replace(/,\s*Sumatra\s*(?=,|$)/gi, '').replace(/,\s*Sumatera\s*(?=,|$)/gi, '') : '',
                postal_code: postCode
            }));
            Swal.fire({
              icon: 'success',
              title: 'Titik Dipilih!',
              text: postCode ? 'Alamat & Kode Pos otomatis diisi.' : 'Alamat otomatis diisi.',
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 1500
            });
          }
        })
        .catch(err => console.error("Error reverse geocoding:", err));
    },
  });
  return markerPosition === null ? null : <Marker position={markerPosition}></Marker>;
}


export default function AddressFormTab({
  addresses, editingAddress, showAddressForm, loading,
  openAddressForm, editAddress, deleteAddress, setDefaultAddress, saveAddress,
  addressForm, handleAddressChange, handleDetailAddressInput,
  searchKeyword, setSearchKeyword, handleSearchLocation, isSearching,
  showResults, searchResults, selectLocation,
  showAddressSuggestions, addressSuggestions, selectAddressSuggestion,
  mapCenter, setMapCenter, markerPosition, setMarkerPosition,
  setAddressForm, setShowAddressForm, setEditingAddress, Swal
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-md font-bold text-gray-800 mb-1">{editingAddress ? 'Edit Alamat' : 'Tambah Alamat Baru'}</h3>
          <p className="text-sm text-gray-500 mt-0.5">Kelola alamat pengiriman Anda</p>
        </div>
        {!showAddressForm && (
          <button onClick={openAddressForm} className="inline-flex items-center gap-1 bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-700 transition">
            <HiPlus className="w-4 h-4" /> Tambah Alamat
          </button>
        )}
      </div>

      <div className="p-6">
        {addresses.length === 0 && !showAddressForm ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-200">
              <HiLocationMarker className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-md font-semibold text-gray-800 mb-1">Belum ada alamat</h3>
            <p className="text-sm text-gray-500 mb-5">Tambahkan alamat pengiriman agar belanja lebih mudah.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {!showAddressForm && addresses.map((address) => (
              <div key={address.id} className={`border rounded-md p-4 relative ${address.is_default ? 'border-blue-400 bg-blue-50/20' : 'border-gray-200'}`}>
                {address.is_default ? <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-md">Utama</div> : null}                            
                <div className="flex flex-wrap justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-gray-800">{address.recipient_name}</h3>
                      {address.label && <span className="bg-gray-100 text-gray-600 text-[10px] font-semibold px-2 py-0.5 rounded">{address.label}</span>}
                    </div>
                    <p className="text-sm text-gray-600">{address.phone}</p>
                    <p className="text-sm text-gray-600 mt-1">{address.address}</p>
                    {address.city_name && <p className="text-sm text-gray-500 mt-1">{address.subdistrict_name}, {address.city_name}, {address.province_name} {address.postal_code}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => editAddress(address)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-md transition" title="Edit">
                      <HiPencilAlt className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteAddress(address.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition" title="Hapus">
                      <HiTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {!address.is_default && (
                  <button onClick={() => setDefaultAddress(address.id)} className="mt-3 text-xs text-gray-600 hover:text-gray-800 font-medium border border-gray-200 bg-white px-3 py-1 rounded-md transition">
                    Jadikan Utama
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* FORM ALAMAT BARU / EDIT */}
        {showAddressForm && (
          <div className="mt-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Penerima <span className="text-red-500">*</span></label>
                <input type="text" name="recipient_name" value={addressForm.recipient_name} onChange={handleAddressChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon <span className="text-red-500">*</span></label>
                <input type="tel" name="phone" value={addressForm.phone} onChange={handleAddressChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Label <span className="text-gray-400 text-xs">(Opsional)</span></label>
                <input type="text" name="label" value={addressForm.label} onChange={handleAddressChange} placeholder="Contoh: Rumah, Kantor" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>

              <div className="md:col-span-2 relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="address" 
                  value={addressForm.address} 
                  onChange={handleDetailAddressInput} 
                  placeholder="Ketik nama jalan atau gedung, lalu pilih dari saran" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" 
                />
                {showAddressSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full bg-white border border-gray-200 shadow-lg max-h-48 overflow-y-auto custom-scrollbar rounded-b-md">
                    {addressSuggestions.map((sug, idx) => (
                      <div key={idx} onClick={() => selectAddressSuggestion(sug)} className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 text-xs text-gray-700 transition">
                        <HiLocationMarker className="inline-block mr-2 text-blue-500" />
                        {sug.display_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Detail Alamat (No. Rumah, Blok, Warna Rumah, dll)</label>
                <input
                  type="text"
                  name="detail_address"
                  value={addressForm.detail_address}
                  onChange={handleAddressChange}
                  placeholder="Contoh: No. 12, Blok A, Rumah Warna Biru"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tandai Lokasi di Peta</label>
                <div className="w-full border border-gray-300 rounded-md overflow-hidden relative" style={{ height: '250px' }}>
                  <MapContainer center={mapCenter} zoom={15} scrollWheelZoom={true} className="h-full w-full">
                    <MapUpdater center={mapCenter} />
                    <TileLayer
                      attribution='&copy; Google Maps'
                      url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                    />
                    <LocationPicker 
                      markerPosition={markerPosition}
                      setMarkerPosition={setMarkerPosition}
                      setAddressForm={setAddressForm}
                      setMapCenter={setMapCenter}
                      Swal={Swal}
                    />
                  </MapContainer>
                </div>
                <p className="text-[11px] text-gray-500 mt-1 italic">Klik pada peta untuk menandai lokasi tepat Anda. Alamat akan terisi otomatis.</p>
              </div>

              <div className="md:col-span-2 relative z-20">
                <label className="block text-sm font-medium text-gray-700 mb-1">Kecamatan / Kelurahan <span className="text-red-500">*</span></label>
                {addressForm.subdistrict_id ? (
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-200 px-4 py-2.5 rounded-lg">
                    <span className="font-semibold text-blue-800 text-sm">{searchKeyword}</span>
                    <button type="button" onClick={() => {
                      setAddressForm(prev => ({...prev, subdistrict_id: "", city_id: "", province_id: "", city_name: "", province_name: ""}));
                      setSearchKeyword("");
                    }} className="text-xs text-blue-600 font-bold hover:underline">Ubah</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        value={searchKeyword} 
                        onChange={(e) => setSearchKeyword(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()} 
                        placeholder="Ketik nama kecamatan..." 
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none text-sm" 
                      />
                    </div>
                    <button type="button" onClick={handleSearchLocation} disabled={isSearching} className="px-5 py-2.5 bg-slate-800 text-white font-medium text-sm rounded-lg hover:bg-slate-900 transition">
                      {isSearching ? "..." : "Cari"}
                    </button>
                  </div>
                )}
                {showResults && !addressForm.subdistrict_id && (
                  <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                    {isSearching ? (
                      <div className="px-4 py-3 text-sm text-gray-500 italic">Mencari wilayah...</div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((loc, idx) => {
                        const locId = loc.id || loc.subdistrict_id || loc.value || idx;
                        let locName = loc.name || loc.label || loc.text || (loc.subdistrict_name ? `${loc.subdistrict_name}, ${loc.city_name}` : "Lokasi Tidak Terbaca");
                        if (typeof locName === 'string') locName = locName.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
                        return (
                          <div key={locId} onClick={() => selectLocation(loc)} className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-gray-50 text-sm font-medium text-gray-700 transition">
                            {locName}
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500 italic">Pencarian tidak ditemukan. Coba gunakan kata kunci lain.</div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 italic">Provinsi (Otomatis)</label>
                <input type="text" readOnly value={addressForm.province_name} placeholder="Terisi dari pencarian" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-600 cursor-not-allowed font-medium" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 italic">Kota / Kabupaten (Otomatis)</label>
                <input type="text" readOnly value={addressForm.city_name} placeholder="Terisi dari pencarian" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-600 cursor-not-allowed font-medium" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kode Pos</label>
                <input type="text" name="postal_code" value={addressForm.postal_code} onChange={handleAddressChange} maxLength={6} placeholder="Masukan kode pos" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer w-max">
                  <input type="checkbox" name="is_default" checked={addressForm.is_default} onChange={handleAddressChange} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700 font-bold">Jadikan sebagai alamat utama</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button type="button" onClick={saveAddress} disabled={loading} className="flex items-center gap-1 bg-blue-600 text-white font-bold px-8 py-2.5 rounded-md hover:bg-blue-700 transition disabled:opacity-50">
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                Simpan
              </button>
              <button type="button" onClick={() => { setShowAddressForm(false); setEditingAddress(null); }} className="border border-gray-300 text-gray-700 font-medium px-8 py-2.5 rounded-md hover:bg-gray-50 transition">
                Batal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}