// Lokasi: src/pages/CheckoutPage.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useCart } from "../context/CartContext";
import {
  HiLocationMarker, HiTruck, HiCheckCircle,
  HiArrowLeft, HiCreditCard, HiSearch, HiOutlineShieldCheck,
  HiOutlineShoppingBag, HiOutlineClipboardCheck, HiPencilAlt,
  HiOutlineQrcode
} from "react-icons/hi";
import Swal from "sweetalert2";
import { API_BASE_URL, getImageUrl } from "../config/api";

// --- FUNGSI HELPER CEK DISKON (PRODUK) ---
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
  
  // === STATE UNTUK KODE PROMO ===
  const [promoCode, setPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [calculatingOngkir, setCalculatingOngkir] = useState(false);

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [isEditingMode, setIsEditingMode] = useState(false);

  const fetchSavedAddresses = async () => {
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
  };

  useEffect(() => {
    if (isDirectCheckout) {
      const directData = sessionStorage.getItem('directCheckoutData');
      if (directData) {
        setCheckoutItems(JSON.parse(directData));
        setAppliedDiscount(0);
      } else {
        navigate('/cart');
      }
    }
    else {
      const cartData = sessionStorage.getItem('cartCheckoutData');
      if (cartData) {
        const parsedData = JSON.parse(cartData);
        if (parsedData.items) {
          setCheckoutItems(parsedData.items);
          
          // Memeriksa apakah user sudah memasukkan diskon dari halaman Cart
          if (parsedData.appliedDiscount && parsedData.appliedDiscount > 0) {
            setAppliedDiscount(parsedData.appliedDiscount);
            setPromoCode("WELCOME10"); // Menampilkan kode statis agar user tahu
          } else {
            setAppliedDiscount(0);
          }
        } else {
          setCheckoutItems(parsedData);
          setAppliedDiscount(0);
        }
      } else {
        navigate('/cart');
      }
    }
    fetchSavedAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirectCheckout, navigate]);

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

  const [addressForm, setAddressForm] = useState({
    name: "", phone: "", destinationId: "", destinationName: "", addressDetail: "",
    province_id: "", city_id: "", postal_code: ""
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
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

  // === FUNGSI APLIKASIKAN KODE PROMO (Di Halaman Checkout) ===
  const handleApplyPromo = () => {
    const code = promoCode.toUpperCase().trim();
    if (!code) {
      Swal.fire({ icon: "info", title: "Kode Kosong", text: "Silakan masukkan kode promo Anda." });
      return;
    }

    if (code === "WELCOME10") {
      setAppliedDiscount(subTotalKotor * 0.1); // Diskon 10% dari Subtotal
      Swal.fire({ icon: "success", title: "Berhasil!", text: "Diskon 10% diterapkan pada pesanan Anda.", timer: 1500, showConfirmButton: false });
    } else {
      setAppliedDiscount(0);
      Swal.fire({ icon: "error", title: "Tidak Valid", text: "Kode promo tidak ditemukan atau sudah kadaluarsa.", confirmButtonColor: "#ef4444" });
    }
  };

  const toggleAddressMode = (isSavedMode) => {
    setUseSavedAddress(isSavedMode);
    setShippingOptions([]);
    setSelectedShipping(null);
    setIsEditingMode(false);
    setEditingAddressId(null);
    if (!isSavedMode) {
      setAddressForm({ name: "", phone: "", destinationId: "", destinationName: "", addressDetail: "", province_id: "", city_id: "", postal_code: "" });
      setSearchQuery("");
    } else {
      if (savedAddresses.length > 0) {
        const defaultAddress = savedAddresses.find(addr => addr.is_default) || savedAddresses[0];
        handleSelectSavedAddress(defaultAddress);
      }
    }
  };

  const handleSelectSavedAddress = (address) => {
    setAddressForm({
      name: address.recipient_name,
      phone: address.phone,
      destinationId: String(address.subdistrict_id),
      destinationName: `${address.subdistrict_name}, ${address.city_name}, ${address.province_name}`,
      addressDetail: `${address.address}`,
      postal_code: address.postal_code || '',
      province_id: address.province_id || '',
      city_id: address.city_id || ''
    });
    fetchRealOngkir(address.subdistrict_id);
  };

  const handleEditAddress = (address) => {
    setIsEditingMode(true);
    setUseSavedAddress(false);
    setEditingAddressId(address.id);
    setAddressForm({
      name: address.recipient_name,
      phone: address.phone,
      destinationId: String(address.subdistrict_id),
      destinationName: `${address.subdistrict_name}, ${address.city_name}, ${address.province_name}`,
      addressDetail: address.address,
      postal_code: address.postal_code || '',
      province_id: address.province_id || '',
      city_id: address.city_id || ''
    });
    setSearchQuery(`${address.subdistrict_name}, ${address.city_name}`);
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddressForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSearchLocation = async () => {
    if (searchQuery.length < 3) {
      Swal.fire("Pencarian", "Ketik minimal 3 huruf kecamatan/kota tujuan.", "info");
      return;
    }
    setIsSearching(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/shipping/search?keyword=${searchQuery}`);
      const data = res.data.data || res.data;
      setSearchResults(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length === 0) {
        Swal.fire("Tidak Ditemukan", "Lokasi tidak ditemukan.", "warning");
      }
    } catch (error) {
      console.error("Gagal mencari lokasi:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLocation = (loc) => {
    let rawName = loc.name || loc.label || loc.text || '';
    if (typeof rawName === 'string') {
      rawName = rawName.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    }
    const parts = rawName.split(',').map(p => p.trim());
    let pName = '-'; let cName = '-'; let sName = rawName;
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
    setAddressForm(prev => ({
      ...prev,
      destinationId: String(locId),
      destinationName: `${sName}, ${cName}, ${pName}`,
      province_id: String(loc.province_id || locId),
      city_id: String(loc.city_id || locId)
    }));
    setSearchResults([]);
    setSearchQuery("");
    fetchRealOngkir(locId);
  };

  const handleSaveEditedAddress = async () => {
    if (!addressForm.name || !addressForm.phone || !addressForm.addressDetail || !addressForm.destinationId) {
      Swal.fire("Data Belum Lengkap", "Mohon lengkapi semua kolom alamat.", "warning");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const parts = addressForm.destinationName.split(',').map(p => p.trim());
      const subdistrict = parts[0] || '';
      const city = parts[1] || '';
      const province = parts[2] || '';
      const dataToSend = {
        recipient_name: addressForm.name,
        phone: addressForm.phone,
        address: addressForm.addressDetail,
        province_id: addressForm.province_id || addressForm.destinationId,
        province_name: province,
        city_id: addressForm.city_id || addressForm.destinationId,
        city_name: city,
        subdistrict_id: addressForm.destinationId,
        subdistrict_name: subdistrict,
        postal_code: addressForm.postal_code || '00000',
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
    let fastestOpt = null;
    let cheapestOpt = null;
    let bestOpt = null;
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

  const handleCheckout = async () => {
    const { name, phone, destinationId, destinationName, addressDetail } = addressForm;
    if (!name || !phone || !destinationId || !addressDetail) {
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
      const postalCodeString = addressForm.postal_code ? ` (Kode Pos: ${addressForm.postal_code})` : '';
      const fullAddress = `${name} | ${phone} | ${destinationName} | ${addressDetail}${postalCodeString}`;
      
      const orderData = {
        shipping_address: fullAddress,
        shipping_courier: selectedShipping.courier,
        shipping_service: selectedShipping.service,
        shipping_cost: selectedShipping.cost,
        total_price: subTotal + selectedShipping.cost, // Menggunakan subTotal yang sudah dipotong diskon promo
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

  if (!checkoutItems || checkoutItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-gray-800">Tidak ada produk untuk dicheckout</h2>
        <button onClick={() => navigate("/")} className="mt-4 text-blue-600 font-bold hover:underline">Kembali Belanja</button>
      </div>
    )
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

        {/* Stepper Modern */}
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
            {/* ================= KOLOM KIRI (7 kolom) ================= */}
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
                      const isSelected = String(addressForm.destinationId) === String(addr.subdistrict_id);
                      return (
                        <div key={addr.id} onClick={() => handleSelectSavedAddress(addr)} className={`cursor-pointer p-4 rounded-xl border transition-all ${isSelected ? 'border-blue-400 bg-blue-50/40 shadow-sm' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-slate-800">{addr.recipient_name}</span>
                              {addr.label && <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-600 font-semibold">{addr.label}</span>}
                            </div>
                            <div className="flex items-center gap-2">
                              {addr.is_default && <span className="text-[10px] bg-blue-200 text-blue-800 font-bold px-2 py-0.5 rounded">Utama</span>}
                              {isSelected && (
                                <button onClick={(e) => { e.stopPropagation(); handleEditAddress(addr); }} className="text-blue-600 hover:text-blue-800 bg-white border border-blue-200 px-2 py-1 rounded-md shadow-sm flex items-center gap-1 transition">
                                  <HiPencilAlt className="w-3 h-3" /> <span className="text-[10px] font-semibold">Edit</span>
                                </button>
                              )}
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
                    {/* INFO MODE EDIT */}
                    {isEditingMode && (
                      <div className="flex items-center gap-2 bg-blue-50 text-blue-800 px-4 py-3 rounded-xl text-xs font-semibold border border-blue-200">
                        <HiPencilAlt className="w-4 h-4" /> Sedang memperbarui alamat tersimpan...
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Nama Lengkap</label>
                        <input type="text" name="name" value={addressForm.name} onChange={handleAddressChange} placeholder="Masukkan nama" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Nomor Telepon</label>
                        <input type="tel" name="phone" value={addressForm.phone} onChange={handleAddressChange} placeholder="0812xxxx" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition text-sm" />
                      </div>
                    </div>
                    <div className="relative">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Kecamatan / Kelurahan</label>
                      {addressForm.destinationName ? (
                        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 px-4 py-2.5 rounded-xl">
                          <span className="font-medium text-blue-800 text-sm">{addressForm.destinationName}</span>
                          <button onClick={() => setAddressForm(prev => ({ ...prev, destinationId: "", destinationName: "" }))} className="text-xs text-blue-600 font-bold hover:underline">Ubah</button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()} placeholder="Ketik nama kecamatan..." className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none text-sm" />
                          </div>
                          <button onClick={handleSearchLocation} disabled={isSearching} className="px-5 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-900 transition">Cari</button>
                        </div>
                      )}
                      {searchResults.length > 0 && !addressForm.destinationName && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto custom-scrollbar">
                          {searchResults.map((loc, idx) => {
                            const locId = loc.id || loc.subdistrict_id || loc.value || idx;
                            let locName = loc.name || loc.label || loc.text || (loc.subdistrict_name ? `${loc.subdistrict_name}, ${loc.city_name}` : "Lokasi Tidak Terbaca");
                            if (typeof locName === 'string') locName = locName.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
                            return (
                              <div key={locId} onClick={() => handleSelectLocation(loc)} className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 text-sm font-medium text-slate-700 transition">
                                {locName}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Kode Pos (Opsional)</label>
                      <input type="text" name="postal_code" value={addressForm.postal_code} onChange={handleAddressChange} maxLength={6} placeholder="Contoh: 20222" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Alamat Lengkap</label>
                      <textarea name="addressDetail" value={addressForm.addressDetail} onChange={handleAddressChange} rows="2" placeholder="Nama jalan, nomor rumah, RT/RW" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none resize-none text-sm"></textarea>
                    </div>

                    {/* BAGIAN TOMBOL SIMPAN & BATAL */}
                    <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100 mt-2">
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

              {/* 2. DAFTAR PRODUK (DETAIL PESANAN) */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-sm font-bold text-slate-500 tracking-wider mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <HiOutlineShoppingBag className="w-4 h-4" /> Detail Pesanan {isDirectCheckout ? "(Beli Langsung)" : ""}
                </h2>
                <div className="space-y-4">
                  {checkoutItems.map((item, index) => {
                    const actualProduct = item.product || item.produk || item;
                    const itemName = actualProduct.name || actualProduct.nama_produk || actualProduct.nama || "Produk";
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
                {!addressForm.destinationId ? (
                  <div className="text-xs text-slate-500 text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    {useSavedAddress ? 'Pilih alamat di atas untuk melihat ongkos kirim.' : 'Lengkapi alamat untuk melihat ongkos kirim.'}
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
                  {/* Bank Transfer - accordion */}
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

                  {/* QRIS */}
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

            {/* ================= KOLOM KANAN (5 kolom) - RINGKASAN BELANJA STICKY ================= */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 sticky top-24">
                <h2 className="text-lg font-bold text-slate-800 mb-5">Ringkasan Belanja</h2>
                
                {/* === KOLOM INPUT PROMO BARU === */}
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
                <button onClick={handleCheckout} disabled={loading || !addressForm.destinationId || !addressForm.addressDetail || !selectedShipping || !selectedPayment} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/20">
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