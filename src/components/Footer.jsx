import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  FaFacebook, 
  FaInstagram, 
  FaWhatsapp,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaClock,
  FaChevronUp,
  FaChevronRight
} from "react-icons/fa";

export default function Footer() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  const config = {
    address: "Jl. T. Amir Hamzah, Sei Agul, Kec. Medan Bar., Kota Medan, Sumatera Utara 20235",
    phone: "0853-5944-6034",
    email: "khairulaudioo@gmail.com",
    businessHours: "Senin - Minggu: 09:00 - 20:00",
    whatsappNumber: "6285359446034"
  };

  const socialLinks = [
    { 
      name: "Facebook", 
      url: "https://web.facebook.com/profile.php?id=100083419694345", 
      icon: FaFacebook,
      color: "hover:text-[#1877F2]",
      bgHover: "hover:bg-[#1877F2]/10"
    },
    { 
      name: "Instagram", 
      url: "https://instagram.com/khairul.audio", 
      icon: FaInstagram,
      color: "hover:text-[#E1306C]",
      bgHover: "hover:bg-[#E1306C]/10"
    },
  ];

  const quickLinks = [
    { name: "Beranda", path: "/" },
    { name: "Katalog Produk", path: "/products" },
    { name: "Tentang Kami", path: "/tentang" },
  ];

  const productCategories = [
    { name: "Head Unit", path: `/products?category=${encodeURIComponent("Head Unit")}` },
    { name: "Speaker", path: `/products?category=${encodeURIComponent("Speaker")}` },
    { name: "Subwoofer", path: `/products?category=${encodeURIComponent("Subwoofer")}` },
    { name: "Power & DSP", path: `/products?category=${encodeURIComponent("Power & DSP")}` },
    { name: "Aksesoris", path: `/products?category=${encodeURIComponent("Aksesoris")}` }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.address)}`;

  return (
    <footer className="bg-gray-800 border-t border-gray-700 text-gray-300 pt-16 pb-0 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">

          {/* Column 1 */}
          <div className="space-y-6">
            <Link to="/" className="inline-block">
              <span className="text-2xl font-bold text-white tracking-tight">
                Khairul<span className="text-blue-400">Audio</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed pr-4">
              Solusi aksesoris dan modifikasi audio mobil terbaik di Kota Medan. 
              Menyediakan produk original berkualitas dengan jasa instalasi profesional.
            </p>
            <div className="flex items-center gap-2 pt-2">
              {socialLinks.map((social, index) => (
                <a 
                  key={index}
                  href={social.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`text-gray-400 ${social.color} ${social.bgHover} transition-all duration-200 p-2 rounded-lg`}
                  title={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2 */}
          <div>
            <h3 className="text-sm font-bold text-gray-100 tracking-wider uppercase mb-6">Pintasan</h3>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link to={link.path} className="text-sm text-gray-400 hover:text-blue-400 transition-colors flex items-center group">
                    <FaChevronRight className="w-2.5 h-2.5 mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-blue-400" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h3 className="text-sm font-bold text-gray-100 tracking-wider uppercase mb-6">Kategori Produk</h3>
            <ul className="space-y-3">
              {productCategories.map((category, index) => (
                <li key={index}>
                  <Link to={category.path} className="text-sm text-gray-400 hover:text-blue-400 transition-colors flex items-center group">
                    <FaChevronRight className="w-2.5 h-2.5 mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-blue-400" />
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 */}
          <div>
            <h3 className="text-sm font-bold text-gray-100 tracking-wider uppercase mb-6">Hubungi Kami</h3>
            <div className="space-y-4">
              <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 text-gray-400 hover:text-blue-400 transition-colors group">
                <FaMapMarkerAlt className="w-4 h-4 mt-1 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                <span className="text-sm leading-relaxed">{config.address}</span>
              </a>
              <a href={`tel:${config.phone.replace(/-/g, '')}`} className="flex items-center gap-3 text-gray-400 hover:text-blue-400 transition-colors group">
                <FaPhoneAlt className="w-4 h-4 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                <span className="text-sm">{config.phone}</span>
              </a>
              <a href={`mailto:${config.email}`} className="flex items-center gap-3 text-gray-400 hover:text-blue-400 transition-colors group">
                <FaEnvelope className="w-4 h-4 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                <span className="text-sm">{config.email}</span>
              </a>
              <div className="flex items-center gap-3 text-gray-400">
                <FaClock className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{config.businessHours}</span>
              </div>
              <a href={`https://wa.me/${config.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors mt-4">
                <FaWhatsapp className="w-4 h-4" />
                Chat WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-gray-700 mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-gray-500 text-xs">
            © {new Date().getFullYear()} Khairul Audio. All rights reserved.
          </p>
          <p className="text-gray-500 text-xs">
            Made with ♥ in Medan
          </p>
        </div>
      </div>

      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 bg-gray-700 text-gray-300 border border-gray-600 w-10 h-10 rounded-lg shadow-lg flex items-center justify-center hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300 z-50 ${
          showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        aria-label="Kembali ke atas"
      >
        <FaChevronUp className="w-4 h-4" />
      </button>
    </footer>
  );
}