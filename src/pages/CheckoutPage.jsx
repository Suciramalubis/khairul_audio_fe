import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useCart } from "../context/CartContext";
import {
  HiLocationMarker, HiTruck, HiCheckCircle,
  HiArrowLeft, HiCreditCard, HiSearch,
  HiOutlineShoppingBag, HiPencilAlt,
  HiOutlineQrcode
} from "react-icons/hi";
import Swal from "sweetalert2";
import { API_BASE_URL, getImageUrl } from "../config/api";

// --- IMPORT LEAFLET ---
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// --- KOMPONEN PETA ---
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || 15, { animate: true, duration: 1.2 });
    }
  }, [center, map, zoom]);
  return null;
}

function LocationPicker({ markerPosition, setMarkerPosition, setMapCenter, onLocationSelect }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setMarkerPosition({ lat, lng });
      setMapCenter([lat, lng]);

      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`)
        .then(res => res.json())
        .then(data => {
          if (data && data.display_name) {
            data.lat = lat;
            data.lon = lng;
            if (onLocationSelect) onLocationSelect(data);
          }
        })
        .catch(err => console.error("Error reverse geocoding:", err));
    },
  });
  return markerPosition === null ? null : <Marker position={markerPosition} />;
}

// --- FUNGSI HELPER DISKON ---
const getPriceInfo = (product) => {
  if (!product) return { hasDiscount: false, price: 0, originalPrice: 0 };
  const originalPrice = Number(product.price || product.harga || 0);
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

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isDirectCheckout = searchParams.get('type') === 'direct';
  const { removeFromCart } = useCart() || {};

  const [checkoutItems, setCheckoutItems] = useState([]);
  const [promoCode, setPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [calculatingOngkir, setCalculatingOngkir] = useState(false);

  // === ALAMAT ===
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [isEditingMode, setIsEditingMode] = useState(false);

  const [addressForm, setAddressForm] = useState({
    label: '', recipient_name: '', phone: '', address: '', detail_address: '',
    province_id: '', province_name: '', city_id: '', city_name: '',
    subdistrict_id: '', subdistrict_name: '', postal_code: '', is_default: false,
  });

  // === MAPS & PENCARIAN ===
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [mapCenter, setMapCenter] = useState([3.5952, 98.6722]);
  const [markerPosition, setMarkerPosition] = useState(null);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [addressSearchTimeout, setAddressSearchTimeout] = useState(null);

  // === PENGIRIMAN & PEMBAYARAN ===
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [expandedPayment, setExpandedPayment] = useState("");

  const bankOptions = [
    { id: "VA_BCA", name: "Bank Central Asia (BCA)" },
    { id: "VA_BNI", name: "Bank Negara Indonesia (BNI)" },
    { id: "VA_BRI", name: "Bank Rakyat Indonesia (BRI)" },
    { id: "VA_MANDIRI", name: "Bank Mandiri (Mandiri)" },
    { id: "VA_BSI", name: "Bank Syariah Indonesia (BSI)" }
  ];

  // --- FETCH ALAMAT TERSIMPAN (dibungkus useCallback) ---
  const fetchSavedAddresses = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/user/addresses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data;
      setSavedAddresses(data);
      if (data && data.length > 0) {
        const defaultAddress = data.find(addr => addr.is_default) || data[0];
        handleSelectSavedAddress(defaultAddress);
      } else {
        setUseSavedAddress(false);
      }
    } catch (error) {
      console.error("Gagal mengambil alamat tersimpan:", error);
    }
  }, []);

  // --- INISIALISASI ---
  useEffect(() => {
    if (isDirectCheckout) {
      const directData = sessionStorage.getItem('directCheckoutData');
      if (directData) {
        setCheckoutItems(JSON.parse(directData));
        setAppliedDiscount(0);
      } else {
        navigate('/cart');
      }
    } else {
      const cartData = sessionStorage.getItem('cartCheckoutData');
      if (cartData) {
        const parsedData = JSON.parse(cartData);
        if (parsedData.items) {
          setCheckoutItems(parsedData.items);
          setAppliedDiscount(parsedData.appliedDiscount || 0);
          if (parsedData.appliedDiscount > 0) setPromoCode("WELCOME10");
        } else {
          setCheckoutItems(parsedData);
          setAppliedDiscount(0);
        }
      } else {
        navigate('/cart');
      }
    }
    fetchSavedAddresses();
  }, [isDirectCheckout, navigate, fetchSavedAddresses]);

  // --- HITUNG SUBTOTAL ---
  const subTotalKotor = checkoutItems.reduce((total, item) => {
    const actualProduct = item.product || item.produk || item;
    const priceInfo = getPriceInfo(actualProduct);
    const harga = priceInfo.price;
    const jumlah = Number(item.qty || item.jumlah || item.quantity || 1);
    return total + (harga * jumlah);
  }, 0);

  const subTotal = subTotalKotor - appliedDiscount;

  const totalWeight = checkoutItems.reduce((total, item) => {
    const actualProduct = item.product || item.produk || item;
    const berat = Number(actualProduct.weight || actualProduct.berat || actualProduct.berat_produk || 1000);
    const jumlah = Number(item.qty || item.jumlah || item.quantity || 1);
    return total + (berat * jumlah);
  }, 0);
  const shippingWeight = Math.max(1000, totalWeight);

  // --- PROMO ---
  const handleApplyPromo = () => {
    const code = promoCode.toUpperCase().trim();
    if (!code) {
      Swal.fire({ icon: "info", title: "Kode Kosong", text: "Masukkan kode promo." });
      return;
    }
    if (code === "WELCOME10") {
      setAppliedDiscount(subTotalKotor * 0.1);
      Swal.fire({ icon: "success", title: "Berhasil!", text: "Diskon 10% diterapkan.", timer: 1500, showConfirmButton: false });
    } else {
      setAppliedDiscount(0);
      Swal.fire({ icon: "error", title: "Tidak Valid", text: "Kode promo tidak ditemukan.", confirmButtonColor: "#ef4444" });
    }
  };

  // --- ALAMAT: Toggle, Pilih, Edit ---
  const toggleAddressMode = (isSavedMode) => {
    setUseSavedAddress(isSavedMode);
    setShippingOptions([]);
    setSelectedShipping(null);
    setIsEditingMode(false);
    setEditingAddressId(null);
    if (!isSavedMode) {
      setAddressForm({ label: '', recipient_name: '', phone: '', address: '', detail_address: '', province_id: '', province_name: '', city_id: '', city_name: '', subdistrict_id: '', subdistrict_name: '', postal_code: '', is_default: false });
      setSearchKeyword('');
      setShowResults(false);
      setMarkerPosition(null);
      setMapCenter([3.5952, 98.6722]);
    } else {
      if (savedAddresses.length > 0) {
        const defaultAddress = savedAddresses.find(addr => addr.is_default) || savedAddresses[0];
        handleSelectSavedAddress(defaultAddress);
      }
    }
  };

  const handleSelectSavedAddress = (address) => {
    setAddressForm({
      label: address.label || '',
      recipient_name: address.recipient_name,
      phone: address.phone,
      address: address.address || '',
      detail_address: '',
      province_id: address.province_id || '',
      province_name: address.province_name || '',
      city_id: address.city_id || '',
      city_name: address.city_name || '',
      subdistrict_id: address.subdistrict_id || '',
      subdistrict_name: address.subdistrict_name || '',
      postal_code: address.postal_code || '',
      is_default: address.is_default || false,
    });
    setSearchKeyword(`${address.subdistrict_name}, ${address.city_name}, ${address.province_name}`);
    if (address.subdistrict_name) {
      fetchCoordinatesFromName(`${address.subdistrict_name}, ${address.city_name}, ${address.province_name}`);
    }
    fetchRealOngkir(address.subdistrict_id);
  };

  const handleEditAddress = (address) => {
    setIsEditingMode(true);
    setUseSavedAddress(false);
    setEditingAddressId(address.id);
    setSelectedShipping(null);
    setShippingOptions([]);
    setAddressForm({
      label: address.label || '',
      recipient_name: address.recipient_name,
      phone: address.phone,
      address: address.address || '',
      detail_address: '',
      province_id: address.province_id || '',
      province_name: address.province_name || '',
      city_id: address.city_id || '',
      city_name: address.city_name || '',
      subdistrict_id: address.subdistrict_id || '',
      subdistrict_name: address.subdistrict_name || '',
      postal_code: address.postal_code || '',
      is_default: address.is_default || false,
    });
    setSearchKeyword(`${address.subdistrict_name}, ${address.city_name}, ${address.province_name}`);
    setMarkerPosition(null);
    if (address.subdistrict_name) {
      fetchCoordinatesFromName(`${address.subdistrict_name}, ${address.city_name}, ${address.province_name}`);
    }
  };

  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // --- FUNGSI BANTU: Ambil koordinat dari nama wilayah ---
  const fetchCoordinatesFromName = async (query) => {
    if (!query) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setMapCenter([lat, lon]);
        setMarkerPosition({ lat, lng: lon });
      }
    } catch (err) {
      console.error("Gagal mengambil koordinat:", err);
    }
  };

  // --- PENCARIAN KECAMATAN (Dropdown) ---
  const handleSearchLocation = async () => {
    if (searchKeyword.length < 3) {
      Swal.fire("Pencarian", "Ketik minimal 3 huruf kecamatan/kota.", "info");
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

  // --- PILIH KECAMATAN DARI DROPDOWN ---
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

    setAddressForm(prev => ({
      ...prev,
      province_id: String(loc.province_id || locId), province_name: pName,
      city_id: String(loc.city_id || locId), city_name: cName,
      subdistrict_id: String(locId), subdistrict_name: sName,
    }));
    setSearchKeyword(fullString);
    setShowResults(false);

    // PETA LANGSUNG BERGERAK KE KECAMATAN TERSEBUT
    fetchCoordinatesFromName(fullString);
    fetchRealOngkir(locId);
  };

  // --- INPUT ALAMAT LENGKAP (Saran dari Nominatim) ---
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

  // --- PILIH SARAN ALAMAT (dari dropdown) ---
  const selectAddressSuggestion = async (suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);
    const postCode = suggestion.address?.postcode || addressForm.postal_code;
    const addressDetails = suggestion.address || {};

    let province = addressDetails.state || addressDetails.province || addressDetails.region || '';
    let city = addressDetails.city || addressDetails.county || addressDetails.town || addressDetails.municipality || '';
    let district = addressDetails.city_district || addressDetails.suburb || addressDetails.district || addressDetails.village || addressDetails.neighbourhood || '';

    const display = suggestion.display_name ? suggestion.display_name.replace(/,\s*Sumatra\s*(?=,|$)/gi, '').replace(/,\s*Sumatera\s*(?=,|$)/gi, '') : '';
    const parts = display.split(',').map(p => p.trim());
    if (!district && parts.length >= 3) {
      if (parts.length >= 4) district = parts[parts.length - 3];
      else if (parts.length === 3) district = parts[0];
    }
    if (!city && parts.length >= 2) city = parts[parts.length - 2];
    if (!province && parts.length >= 1) province = parts[parts.length - 1];

    const cleanForSearch = (str) => str?.replace(/Kota|Kabupaten|Kab\.|Kecamatan|Kec\./gi, '').trim() || '';
    let searchDistrict = cleanForSearch(district);
    let searchCity = cleanForSearch(city);

    setMapCenter([lat, lon]);
    setMarkerPosition({ lat, lng: lon });

    setAddressForm(prev => ({
      ...prev,
      address: display,
      postal_code: postCode,
      province_name: province,
      city_name: city,
      subdistrict_name: district,
    }));

    setSearchKeyword(searchDistrict ? `${searchDistrict}, ${searchCity}, ${cleanForSearch(province)}` : '');

    if (searchDistrict) {
      try {
        const searchRes = await axios.get(`${API_BASE_URL}/shipping/search?keyword=${searchDistrict}`);
        const data = searchRes.data.data || searchRes.data;
        if (Array.isArray(data) && data.length > 0) {
          let matched = data.find(loc => loc.city_name?.toLowerCase().includes(searchCity.toLowerCase()));
          if (!matched) matched = data[0];
          if (matched && (matched.id || matched.subdistrict_id)) {
            const resolvedSubdistrictId = matched.id || matched.subdistrict_id;
            const resolvedCityId = matched.city_id || resolvedSubdistrictId;
            const resolvedProvinceId = matched.province_id || resolvedSubdistrictId;
            setAddressForm(prev => ({
              ...prev,
              subdistrict_id: String(resolvedSubdistrictId),
              city_id: String(resolvedCityId),
              province_id: String(resolvedProvinceId),
              subdistrict_name: matched.subdistrict_name || district,
              city_name: matched.city_name || city,
              province_name: matched.province_name || province
            }));
            setSearchKeyword(`${matched.subdistrict_name}, ${matched.city_name}, ${matched.province_name}`);
            fetchRealOngkir(resolvedSubdistrictId);
          }
        }
      } catch (err) {
        console.error("Gagal sinkron ID wilayah dengan peta", err);
      }
    }
    setShowAddressSuggestions(false);
  };

  // --- SIMPAN ALAMAT (Edit / Baru) ---
  const handleSaveEditedAddress = async () => {
    let finalAddress = addressForm.address;
    if (addressForm.detail_address && addressForm.detail_address.trim() !== '') {
      finalAddress = `${addressForm.address} (${addressForm.detail_address.trim()})`;
    }

    if (!addressForm.recipient_name || !addressForm.phone || !finalAddress) {
      Swal.fire("Data Belum Lengkap", "Mohon lengkapi Nama Penerima, Nomor Telepon, dan Alamat Lengkap.", "warning");
      return;
    }
    if (!addressForm.subdistrict_id || !addressForm.city_id || !addressForm.province_id) {
      Swal.fire("Wilayah Tidak Valid", "Sistem membutuhkan data Kecamatan, Kota, dan Provinsi dari pencarian.", "warning");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const dataToSend = {
        label: addressForm.label,
        recipient_name: addressForm.recipient_name,
        phone: String(addressForm.phone),
        address: finalAddress,
        province_id: addressForm.province_id,
        province_name: addressForm.province_name,
        city_id: addressForm.city_id,
        city_name: addressForm.city_name,
        subdistrict_id: addressForm.subdistrict_id,
        subdistrict_name: addressForm.subdistrict_name,
        postal_code: String(addressForm.postal_code || '00000'),
        is_default: true
      };

      if (editingAddressId) {
        await axios.put(`${API_BASE_URL}/user/addresses/${editingAddressId}`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Alamat berhasil diperbarui.', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
      } else {
        await axios.post(`${API_BASE_URL}/user/addresses`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Alamat baru berhasil disimpan.', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
      }

      await fetchSavedAddresses();
      setIsEditingMode(false);
      setEditingAddressId(null);
      setUseSavedAddress(true);
    } catch (err) {
      console.error("Gagal menyimpan alamat:", err);
      Swal.fire('Gagal Menyimpan', 'Terjadi kesalahan saat memperbarui alamat', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- HITUNG ONGKIR ---
  const fetchRealOngkir = async (destinationId) => {
    if (!destinationId) return;
    setCalculatingOngkir(true);
    setSelectedShipping(null);
    setShippingOptions([]);
    try {
      const token = localStorage.getItem("token");
      const couriers = ["jne", "tiki", "pos", "sicepat", "ninja", "sap"];
      let apiOptions = [];
      for (const c of couriers) {
        try {
          const res = await axios.post(`${API_BASE_URL}/shipping/cost`, {
            destination: destinationId,
            weight: shippingWeight,
            courier: c
          }, { headers: { Authorization: `Bearer ${token}` } });
          const data = res.data;
          const resultsArray = data.data || data.rajaongkir?.results || [];
          if (Array.isArray(resultsArray)) {
            resultsArray.forEach(item => {
              if (item.price !== undefined || item.cost !== undefined || item.value !== undefined) {
                apiOptions.push({
                  courier: (item.courier || item.courier_code || item.code || c).toUpperCase(),
                  service: item.service || item.name || "REG",
                  name: item.description || item.service_name || "Layanan Pengiriman",
                  cost: item.price || item.cost || item.value || 0,
                  etd: item.etd || item.estimation ? String(item.etd || item.estimation).replace(/HARI/i, '').trim() + " Hari" : "-",
                  recommendationType: null
                });
              } else if (item.costs && Array.isArray(item.costs)) {
                const courierCode = (item.code || item.courier || c).toUpperCase();
                item.costs.forEach(costItem => {
                  let price = 0;
                  let etdStr = "-";
                  if (Array.isArray(costItem.cost) && costItem.cost.length > 0) {
                    price = costItem.cost[0].value || 0;
                    etdStr = costItem.cost[0].etd ? String(costItem.cost[0].etd).replace(/HARI/i, '').trim() + " Hari" : "-";
                  }
                  apiOptions.push({
                    courier: courierCode,
                    service: costItem.service || "REG",
                    name: costItem.description || "Layanan Pengiriman",
                    cost: price,
                    etd: etdStr,
                    recommendationType: null
                  });
                });
              }
            });
          }
        } catch (err) {
          console.warn(`Kurir ${c} gagal diload:`, err.message);
        }
      }
      if (apiOptions.length === 0) {
        Swal.fire("Informasi", "Layanan pengiriman ke daerah tersebut tidak tersedia.", "info");
        setCalculatingOngkir(false);
        return;
      }
      const processedOptions = processRecommendation(apiOptions, shippingWeight);
      setShippingOptions(processedOptions);
      if (processedOptions.length > 0) setSelectedShipping(processedOptions[0]);
    } catch (error) {
      console.error("Gagal improvised ongkir:", error);
    } finally {
      setCalculatingOngkir(false);
    }
  };

  const processRecommendation = (options, weightInGrams) => {
    let filteredOptions = options;
    if (weightInGrams < 10000) {
      filteredOptions = options.filter(opt => {
        const serviceName = String(opt.service + " " + opt.name).toUpperCase();
        return !(serviceName.includes("JTR") || serviceName.includes("TRUCK") || serviceName.includes("CARGO") || serviceName.includes("KARGO") || serviceName.includes("T15") || serviceName.includes("T25") || serviceName.includes("T60") || serviceName.includes("MOTOR"));
      });
    }
    if (filteredOptions.length === 0) filteredOptions = options;
    let fastestOpt = null, cheapestOpt = null, bestOpt = null;
    const fastServices = ["YES", "ONS", "BEST", "SAMEDAY", "NEXTDAY", "SPS"];
    fastestOpt = filteredOptions.find(opt => fastServices.some(s => String(opt.service).toUpperCase().includes(s)) || String(opt.etd).includes("1 Hari") || String(opt.etd).includes("0 day") || String(opt.etd) === "1");
    if (fastestOpt) fastestOpt.recommendationType = "fastest";
    const remainingForCheap = filteredOptions.filter(opt => opt !== fastestOpt);
    if (remainingForCheap.length > 0) {
      cheapestOpt = remainingForCheap.reduce((prev, curr) => (prev.cost < curr.cost ? prev : curr));
      cheapestOpt.recommendationType = "cheapest";
    }
    const remainingForBest = filteredOptions.filter(opt => opt !== fastestOpt && opt !== cheapestOpt);
    if (remainingForBest.length > 0) {
      bestOpt = remainingForBest.reduce((prev, curr) => (prev.cost < curr.cost ? prev : curr));
      bestOpt.recommendationType = "best";
    }
    let finalRecommendations = [];
    if (fastestOpt) finalRecommendations.push(fastestOpt);
    if (cheapestOpt) finalRecommendations.push(cheapestOpt);
    if (bestOpt) finalRecommendations.push(bestOpt);
    finalRecommendations.sort((a, b) => {
      if (a.recommendationType === "fastest") return -1;
      if (b.recommendationType === "fastest") return 1;
      if (a.recommendationType === "cheapest") return -1;
      if (b.recommendationType === "cheapest") return 1;
      return a.cost - b.cost;
    });
    return finalRecommendations;
  };

  // --- CHECKOUT ---
  const handleCheckout = async () => {
    const { recipient_name, phone, subdistrict_id, subdistrict_name, city_name, province_name, address, detail_address, postal_code } = addressForm;
    if (!recipient_name || !phone || !subdistrict_id || !address) {
      Swal.fire("Lengkapi Data", "Mohon lengkapi seluruh form alamat.", "warning");
      return;
    }
    if (!selectedShipping) {
      Swal.fire("Pilih Pengiriman", "Mohon pilih jasa pengiriman.", "warning");
      return;
    }
    if (!selectedPayment) {
      Swal.fire("Pilih Pembayaran", "Mohon pilih metode pembayaran.", "warning");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const destinationName = `${subdistrict_name}, ${city_name}, ${province_name}`;
      const fullAddressString = detail_address ? `${address} (${detail_address})` : address;
      const fullAddress = `${recipient_name} | ${phone} | ${destinationName} | ${fullAddressString}${postal_code ? ` (Kode Pos: ${postal_code})` : ''}`;

      const orderData = {
        shipping_address: fullAddress,
        shipping_courier: selectedShipping.courier,
        shipping_service: selectedShipping.service,
        shipping_cost: selectedShipping.cost,
        total_price: subTotal + selectedShipping.cost,
        payment_method: selectedPayment,
        items: checkoutItems.map(item => {
          const actualProduct = item.product || item.produk || item;
          const priceInfo = getPriceInfo(actualProduct);
          return {
            product_id: actualProduct.id || item.product_id || item.id,
            quantity: item.quantity || item.qty || 1,
            price: priceInfo.price
          };
        })
      };

      const response = await axios.post(`${API_BASE_URL}/user/orders/checkout`, orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        Swal.fire({
          icon: "success",
          title: "Pesanan Berhasil Dibuat!",
          text: "Satu langkah lagi! Silakan selesaikan pembayaran Anda.",
          confirmButtonColor: "#3b82f6"
        }).then(() => {
          if (isDirectCheckout) {
            sessionStorage.removeItem('directCheckoutData');
          } else {
            sessionStorage.removeItem('cartCheckoutData');
            if (removeFromCart) {
              checkoutItems.forEach(item => {
                const productId = item.product?.id || item.product_id || item.id;
                removeFromCart(productId);
              });
            }
          }
          const newOrderId = response.data.data ? response.data.data.id : response.data.id;
          navigate(`/payment/${newOrderId}`);
        });
      }
    } catch (error) {
      console.error("Error Checkout:", error);
      const errorMsg = error.response?.data?.message || "Terjadi kesalahan saat memproses pesanan di server.";
      Swal.fire("Checkout Gagal", errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER ---
  if (!checkoutItems || checkoutItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-gray-800">Tidak ada produk untuk dicheckout</h2>
        <button onClick={() => navigate("/")} className="mt-4 text-blue-600 font-bold hover:underline">Kembali Belanja</button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      <div className="min-h-screen bg-slate-50 pb-20 font-sans">
        {/* Stepper */}
        <div className="max-w-7xl mx-auto pt-8 pb-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 md:gap-6">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">1</div>
              <span className="text-xs font-semibold text-slate-600 mt-1">Keranjang</span>
            </div>
            <div className="w-12 md:w-24 h-[2px] bg-slate-300"></div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">2</div>
              <span className="text-xs font-semibold text-blue-600 mt-1">Pengiriman</span>
            </div>
            <div className="w-12 md:w-24 h-[2px] bg-slate-200"></div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-500 flex items-center justify-center text-sm font-bold">3</div>
              <span className="text-xs font-semibold text-slate-400 mt-1">Pembayaran</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-slate-500 hover:text-blue-600 text-sm font-medium transition">
            <HiArrowLeft className="w-4 h-4" /> Kembali
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* KOLOM KIRI */}
            <div className="lg:col-span-7 space-y-6">
              {/* 1. ALAMAT PENGIRIMAN */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <HiLocationMarker className="text-blue-600 w-5 h-5" /> Alamat Pengiriman
                  </h2>
                  {savedAddresses.length > 0 && !isEditingMode && (
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                      <button onClick={() => toggleAddressMode(true)} className={`px-4 py-1.5 text-xs font-semibold rounded-md transition ${useSavedAddress ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                        Tersimpan
                      </button>
                      <button onClick={() => toggleAddressMode(false)} className={`px-4 py-1.5 text-xs font-semibold rounded-md transition ${!useSavedAddress ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                        Alamat Baru
                      </button>
                    </div>
                  )}
                </div>

                {useSavedAddress && savedAddresses.length > 0 && !isEditingMode ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                    {savedAddresses.map((addr) => {
                      const isSelected = String(addressForm.subdistrict_id) === String(addr.subdistrict_id) && String(addressForm.address) === String(addr.address);
                      return (
                        <div key={addr.id} onClick={() => handleSelectSavedAddress(addr)} className={`cursor-pointer p-4 rounded-xl border transition-all ${isSelected ? 'border-blue-400 bg-blue-50/40 shadow-sm' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-slate-800">{addr.recipient_name}</span>
                              {addr.label && <span className="bg-gray-100 text-gray-600 text-[10px] font-semibold px-2 py-0.5 rounded">{addr.label}</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              {addr.is_default ? <span className="text-[10px] bg-blue-200 text-blue-800 font-bold px-2 py-0.5 rounded">Utama</span> : null}
                              {isSelected ? (
                                <button onClick={(e) => { e.stopPropagation(); handleEditAddress(addr); }} className="text-blue-600 hover:text-blue-800 bg-white border border-blue-200 px-2 py-1 rounded-md shadow-sm flex items-center gap-1 transition">
                                  <HiPencilAlt className="w-3 h-3" /> <span className="text-[10px] font-semibold">Edit</span>
                                </button>
                              ) : null}
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 mb-1">{addr.phone}</p>
                          <p className="text-xs text-slate-600 mb-1 line-clamp-2">{addr.address}</p>
                          <p className="text-xs text-slate-500">{addr.subdistrict_name}, {addr.city_name}, {addr.province_name} {addr.postal_code}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {isEditingMode && (
                      <div className="flex items-center gap-2 bg-blue-50 text-blue-800 px-4 py-3 rounded-xl text-xs font-semibold border border-blue-200">
                        <HiPencilAlt className="w-4 h-4" /> Sedang memperbarui alamat tersimpan...
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Nama Penerima <span className="text-red-500">*</span></label>
                        <input type="text" name="recipient_name" value={addressForm.recipient_name} onChange={handleAddressChange} placeholder="Masukkan nama" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Nomor Telepon <span className="text-red-500">*</span></label>
                        <input type="tel" name="phone" value={addressForm.phone} onChange={handleAddressChange} placeholder="0812xxxx" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition text-sm" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Label <span className="text-gray-400 font-normal">(Opsional)</span></label>
                        <input type="text" name="label" value={addressForm.label} onChange={handleAddressChange} placeholder="Contoh: Rumah, Kantor" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition text-sm" />
                      </div>
                    </div>

                    <div className="md:col-span-2 relative">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Alamat Lengkap <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        name="address" 
                        value={addressForm.address} 
                        onChange={handleDetailAddressInput} 
                        placeholder="Ketik nama jalan atau gedung, lalu pilih dari saran" 
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition text-sm" 
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
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Detail Tambahan Patokan (Opsional)</label>
                      <input
                        type="text"
                        name="detail_address"
                        value={addressForm.detail_address}
                        onChange={handleAddressChange}
                        placeholder="Contoh: No. 12, Blok A, Rumah Warna Biru"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition text-sm"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Tandai Lokasi di Peta</label>
                      <div className="w-full border border-gray-300 rounded-xl overflow-hidden relative" style={{ height: '250px' }}>
                        <MapContainer center={mapCenter} zoom={15} scrollWheelZoom={true} className="h-full w-full" style={{ zIndex: 5 }}>
                          <MapController center={mapCenter} zoom={15} />
                          <TileLayer
                            attribution='&copy; Google Maps'
                            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                          />
                          <LocationPicker 
                            markerPosition={markerPosition}
                            setMarkerPosition={setMarkerPosition}
                            setMapCenter={setMapCenter}
                            onLocationSelect={async (data) => {
                              await selectAddressSuggestion(data);
                              Swal.fire({
                                icon: 'success',
                                title: 'Titik Dipilih!',
                                text: 'Data alamat dan wilayah telah diperbarui.',
                                toast: true,
                                position: 'top-end',
                                showConfirmButton: false,
                                timer: 2000
                              });
                            }}
                          />
                        </MapContainer>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1.5 italic">Ketuk pada peta untuk menandai lokasi tepat Anda secara manual.</p>
                    </div>

                    <div className="md:col-span-2 relative z-20 pt-2 border-t border-slate-100">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Kecamatan / Kelurahan (Untuk Ongkos Kirim) <span className="text-red-500">*</span></label>
                      {addressForm.subdistrict_id ? (
                        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 px-4 py-2.5 rounded-xl">
                          <span className="font-medium text-blue-800 text-sm">{searchKeyword}</span>
                          <button type="button" onClick={() => {
                            setAddressForm(prev => ({...prev, subdistrict_id: "", city_id: "", province_id: "", city_name: "", province_name: ""}));
                            setSearchKeyword("");
                          }} className="text-xs text-blue-600 font-bold hover:underline">Ubah</button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                              type="text" 
                              value={searchKeyword} 
                              onChange={(e) => setSearchKeyword(e.target.value)} 
                              onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()} 
                              placeholder="Ketik nama kecamatan..." 
                              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none text-sm" 
                            />
                          </div>
                          <button type="button" onClick={handleSearchLocation} disabled={isSearching} className="px-5 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-900 transition">
                            {isSearching ? "..." : "Cari"}
                          </button>
                        </div>
                      )}
                      
                      {showResults && !addressForm.subdistrict_id && (
                        <div className="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto custom-scrollbar">
                          {isSearching ? (
                            <div className="px-4 py-3 text-sm text-gray-500 italic">Mencari wilayah...</div>
                          ) : searchResults.length > 0 ? (
                            searchResults.map((loc, idx) => {
                              const locId = loc.id || loc.subdistrict_id || loc.value || idx;
                              let locName = loc.name || loc.label || loc.text || (loc.subdistrict_name ? `${loc.subdistrict_name}, ${loc.city_name}` : "Lokasi Tidak Terbaca");
                              if (typeof locName === 'string') locName = locName.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
                              return (
                                <div key={locId} onClick={() => selectLocation(loc)} className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 text-sm font-medium text-slate-700 transition">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 italic">Provinsi (Otomatis)</label>
                        <input type="text" readOnly value={addressForm.province_name} placeholder="Terisi dari pencarian" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 cursor-not-allowed text-sm font-medium" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1 italic">Kota / Kabupaten (Otomatis)</label>
                        <input type="text" readOnly value={addressForm.city_name} placeholder="Terisi dari pencarian" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 cursor-not-allowed text-sm font-medium" />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Kode Pos (Opsional)</label>
                      <input type="text" name="postal_code" value={addressForm.postal_code} onChange={handleAddressChange} maxLength={6} placeholder="Contoh: 20222" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition text-sm" />
                    </div>

                    <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100 mt-2 md:col-span-2">
                      {(savedAddresses.length > 0 || isEditingMode) && (
                        <button
                          onClick={() => toggleAddressMode(true)}
                          className="px-5 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                          Batal
                        </button>
                      )}
                      <button
                        onClick={handleSaveEditedAddress}
                        disabled={loading}
                        className="bg-slate-800 text-white font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-slate-900 transition-all flex items-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed shadow-sm"
                      >
                        {loading ? "Menyimpan..." : (isEditingMode ? "Simpan Perubahan" : "Simpan Alamat")}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. DAFTAR PRODUK */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-sm font-bold text-slate-500 tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <HiOutlineShoppingBag className="w-4 h-4" /> Detail Pesanan {isDirectCheckout ? "(Beli Langsung)" : ""}
                </h2>
                <div className="space-y-4">
                  {checkoutItems.map((item, index) => {
                    const actualProduct = item.product || item.produk || item;
                    const itemName = actualProduct.name || actualProduct.nama_produkt || actualProduct.nama || "Produk";
                    const priceInfo = getPriceInfo(actualProduct);
                    const itemQty = Number(item.quantity || item.qty || item.jumlah || 1);
                    let itemImg = getImageUrl(actualProduct.image_url || actualProduct.image || actualProduct.gambar);
                    return (
                      <div key={item.id || index} className="flex gap-4 items-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200">
                          {itemImg ? <img src={itemImg} alt={itemName} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-200"></div>}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-800 text-sm line-clamp-1">{itemName}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{itemQty}x Item</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-blue-600 text-sm">Rp {new Intl.NumberFormat("id-ID").format(priceInfo.price * itemQty)}</span>
                          {priceInfo.hasDiscount && (
                            <div className="text-[10px] text-slate-400 line-through">Rp {new Intl.NumberFormat("id-ID").format(priceInfo.originalPrice * itemQty)}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. REKOMENDASI PENGIRIMAN */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <HiTruck className="text-slate-700 w-5 h-5" /> Rekomendasi Pengiriman
                </h2>
                {(!useSavedAddress || isEditingMode) ? (
                  <div className="text-xs text-slate-500 text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Silakan lengkapi dan simpan alamat Anda terlebih dahulu untuk melihat ongkos kirim.
                  </div>
                ) : !addressForm.subdistrict_id ? (
                  <div className="text-xs text-slate-500 text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Pilih alamat pengiriman di atas untuk melihat ongkos kirim.
                  </div>
                ) : calculatingOngkir ? (
                  <div className="text-xs text-blue-600 text-center py-6 animate-pulse font-semibold">MENGHITUNG ONGKOS KIRIM...</div>
                ) : shippingOptions.length === 0 ? (
                  <div className="text-xs text-red-500 text-center py-6">Layanan pengiriman tidak tersedia di area ini.</div>
                ) : (
                  <div className="space-y-3">
                    {shippingOptions.map((opt, idx) => (
                      <label key={idx} onClick={() => setSelectedShipping(opt)} className={`relative block cursor-pointer p-4 rounded-xl border transition-all ${selectedShipping?.service === opt.service && selectedShipping?.courier === opt.courier ? 'border-blue-400 bg-blue-50/30 shadow-sm' : 'border-slate-200 hover:border-blue-300'}`}>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-sm text-slate-800 uppercase">{opt.courier} <span className="font-normal text-slate-600 capitalize">({opt.service})</span></p>
                            {opt.recommendationType === "fastest" && <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">Express</span>}
                            {opt.recommendationType === "cheapest" && <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Hemat</span>}
                            {opt.recommendationType === "best" && <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">Reguler</span>}
                          </div>
                          <p className="font-bold text-sm text-slate-900">Rp {new Intl.NumberFormat("id-ID").format(opt.cost)}</p>
                        </div>
                        <p className="text-xs text-slate-500">Estimasi Tiba: {opt.etd}</p>
                        {selectedShipping?.service === opt.service && selectedShipping?.courier === opt.courier && (
                          <HiCheckCircle className="absolute top-1/2 -right-2.5 -translate-y-1/2 text-blue-500 w-5 h-5 bg-white rounded-full" />
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. METODE PEMBAYARAN */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                  <HiCreditCard className="text-slate-700 w-5 h-5" /> Metode Pembayaran
                </h2>
                <div className="space-y-3">
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <button onClick={() => setExpandedPayment(expandedPayment === 'bank' ? '' : 'bank')} className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🏦</span>
                        <span className="font-semibold text-slate-800 text-sm">Transfer Bank</span>
                      </div>
                      <svg className={`w-5 h-5 text-slate-500 transition-transform ${expandedPayment === 'bank' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {expandedPayment === 'bank' && (
                      <div className="bg-white p-3 space-y-1 border-t border-slate-200">
                        {bankOptions.map((bank) => (
                          <label key={bank.id} onClick={() => setSelectedPayment(bank.id)} className={`flex items-center p-3 rounded-lg cursor-pointer transition ${selectedPayment === bank.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50 border border-transparent'}`}>
                            <div className="flex items-center gap-3 w-full">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedPayment === bank.id ? 'border-blue-500' : 'border-slate-300'}`}>
                                {selectedPayment === bank.id && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                              </div>
                              <span className={`text-sm font-medium ${selectedPayment === bank.id ? 'text-blue-700' : 'text-slate-700'}`}>{bank.name}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <label onClick={() => setSelectedPayment("QRIS")} className={`w-full flex items-center gap-3 p-4 cursor-pointer transition ${selectedPayment === "QRIS" ? 'bg-blue-50 border-blue-200' : 'bg-white hover:bg-slate-50'}`}>
                      <HiOutlineQrcode className="w-5 h-5 text-slate-600" />
                      <span className="font-semibold text-slate-800 text-sm">QRIS</span>
                      <div className="ml-auto">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedPayment === "QRIS" ? 'border-blue-500' : 'border-slate-300'}`}>
                          {selectedPayment === "QRIS" && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* KOLOM KANAN - RINGKASAN */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 sticky top-24">
                <h2 className="text-lg font-bold text-slate-800 mb-5">Ringkasan Belanja</h2>
                <div className="mb-5">
                  <p className="text-[12px] font-semibold text-slate-700 mb-2">Makin hemat pakai promo</p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={promoCode} 
                      onChange={(e) => setPromoCode(e.target.value)} 
                      placeholder="Masukkan Kode..." 
                      className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-500 text-[13px] font-medium uppercase transition-colors" 
                    />
                    <button 
                      onClick={handleApplyPromo} 
                      className="px-4 py-2 bg-slate-900 text-white text-[13px] font-bold rounded hover:bg-slate-800 transition-colors"
                    >
                      Terapkan
                    </button>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-slate-600 border-t border-slate-100 pt-4">
                  <div className="flex justify-between">
                    <span>Total Harga Produk</span>
                    <span>Rp {new Intl.NumberFormat("id-ID").format(subTotalKotor)}</span>
                  </div>
                  {appliedDiscount > 0 && (
                    <div className="flex justify-between font-semibold text-emerald-600">
                      <span>Diskon Promo</span>
                      <span>- Rp {new Intl.NumberFormat("id-ID").format(appliedDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Ongkos Kirim</span>
                    <span>{selectedShipping ? `Rp ${new Intl.NumberFormat("id-ID").format(selectedShipping.cost)}` : '-'}</span>
                  </div>
                </div>
                <div className="border-t border-slate-200 my-5"></div>
                <div className="flex justify-between items-center mb-6">
                  <span className="font-bold text-slate-800">Total Tagihan</span>
                  <span className="text-2xl font-black text-blue-600">Rp {new Intl.NumberFormat("id-ID").format(subTotal + (selectedShipping ? selectedShipping.cost : 0))}</span>
                </div>
                <button onClick={handleCheckout} disabled={!useSavedAddress || loading || !addressForm.subdistrict_id || !addressForm.address || !selectedShipping || !selectedPayment} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/20">
                  {loading ? "Memproses..." : "Bayar Sekarang"}
                </button>
                <p className="text-[11px] text-center text-slate-400 mt-4 font-medium">Dengan menekan tombol, Anda menyetujui Syarat & Ketentuan kami.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}