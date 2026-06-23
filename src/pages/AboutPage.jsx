import React, { useRef } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

import heroImage from '../assets/Img_3.png'; 
import storyImage from '../assets/img2.jpg'; 
import gallery1 from '../assets/img3.webp';   
import gallery2 from '../assets/img2.jpg';   
import gallery3 from '../assets/img5.png';   
import gallery4 from '../assets/img4.jpg';   
import mapBgImage from '../assets/img2.jpg'; 

import { 
  HiOutlineBadgeCheck, 
  HiOutlineUserGroup, 
  HiOutlineShieldCheck,
  HiOutlineCog,
  HiArrowRight,
  HiCheck,
  HiLocationMarker,
  HiPhone,
  HiClock
} from 'react-icons/hi';

export default function AboutPage() {
  const contactRef = useRef(null);

  const scrollToContact = () => {
    if (contactRef.current) {
      contactRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const GMAPS_URL = "https://www.google.com/maps/search/?api=1&query=Jl.+T.+Amir+Hamzah,+Sei+Agul,+Kec.+Medan+Bar.,+Kota+Medan,+Sumatera+Utara+20235";

  return (
    <div className="bg-white min-h-screen font-sans text-slate-800 flex flex-col">
      <Navbar />
      <main className="flex-grow">
        
        {/* ================= HERO SECTION ================= */}
        <section className="relative bg-slate-900 py-5 md:py-20">
          <div className="absolute inset-0 z-0">
            <img 
              src={heroImage} 
              alt="Workshop Khairul Audio" 
              className="w-full h-full object-cover opacity-20"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>

          <div className="container mx-auto px-4 md:px-8 relative z-10">
            <div className="max-w-3xl pl-6 md:pl-8">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6">
                Nikmati Setiap Kilometer <br className="hidden md:block"/> dengan Suara yang Sempurna.
              </h1>
              <p className="text-lg text-slate-300 leading-relaxed mb-8 max-w-2xl">
                Kami hadir untuk mengubah kabin mobil Anda menjadi ruang audio premium. 
                Dengan teknologi terkini dan sentuhan ahli, setiap perjalanan akan terasa lebih hidup dan berkesan.
              </p>
              <button 
                onClick={scrollToContact}
                className="bg-blue-600 text-white font-bold px-8 py-3.5 hover:bg-blue-700 transition-colors flex items-center gap-2 group"
              >
                Kunjungi Toko Kami 
                <HiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </section>

        {/* ================= KISAH & STATISTIK ================= */}
        <section className="py-13 bg-white border-b border-slate-100">
          <div className="container mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <div className="lg:col-span-5">
                <div className="relative">
                  <img 
                    src={storyImage} 
                    alt="Teknisi Khairul Audio" 
                    className="w-full h-auto object-cover shadow-lg"
                  />
                  <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-500 -z-10 hidden md:block"></div>
                </div>
              </div>

              <div className="lg:col-span-7 lg:pl-10">
                <h2 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-2">Tentang Khairul Audio</h2>
                <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Lebih dari Sekadar Instalasi Audio</h3>
                <div className="space-y-4 text-slate-600 leading-relaxed mb-10">
                  <p>
                    Berawal dari bengkel modifikasi audio di tahun 2012, Khairul Audio lahir dari dedikasi mendalam terhadap reproduksi suara otomotif yang murni dan berkelas.
                  </p>
                  <p>
                    Kami percaya setiap kabin mobil memiliki karakteristik akustik yang unik. Misi kami adalah mengoptimalkan ruang tersebut melalui pemilihan perangkat keras yang tepat, instalasi kabel yang aman bagi kelistrikan mobil, dan proses tuning yang presisi.
                  </p>
                </div>
                
                <div className="flex gap-8 border-t border-slate-200 pt-8">
                  <div>
                    <h4 className="text-4xl font-black text-slate-900">12+</h4>
                    <p className="text-sm text-slate-500 font-medium mt-1">Tahun Pengalaman</p>
                  </div>
                  <div className="w-px bg-slate-200"></div>
                  <div>
                    <h4 className="text-4xl font-black text-slate-900">5K+</h4>
                    <p className="text-sm text-slate-500 font-medium mt-1">Instalasi Sukses</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= VISI & MISI ================= */}
        <section className="py-16 bg-slate-50">
          <div className="container mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 max-w-5xl mx-auto bg-white shadow-sm border border-slate-200">
              
              <div className="p-10 md:p-14 border-b md:border-b-0 md:border-r border-slate-200">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Visi</h3>
                <p className="text-slate-600 leading-relaxed">
                Menjadi pusat solusi audio mobil premium tepercaya, di mana kualitas suara tingkat tinggi, keamanan kelistrikan, dan estetika interior menyatu dalam harmoni yang sempurna.                </p>
              </div>

              <div className="p-10 md:p-14 bg-slate-900 text-white">
                <h3 className="text-2xl font-bold text-white mb-6">Misi</h3>
                <ul className="space-y-4">
                  {[
                    'Hanya menghadirkan produk audio original dengan jaminan garansi resmi.',
                    'Menerapkan standar instalasi OEM yang rapi, aman, dan tanpa merusak kelistrikan bawaan pabrik.',
                    'Memberikan konsultasi yang jujur agar pelanggan mendapatkan solusi audio yang paling tepat.'
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <HiCheck className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        </section>

        {/* ================= MENGAPA KAMI ================= */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 md:px-8">
            <div className="mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Mengapa Memilih Kami?</h2>
              <div className="w-16 h-1 bg-blue-600"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-slate-50 text-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-200">
                  <HiOutlineUserGroup className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Teknisi Tersertifikasi</h3>
                  <p className="text-slate-600 leading-relaxed">Tim kami memahami betul karakteristik akustik dan kerumitan sistem kelistrikan pada berbagai jenis mobil modern. Pengerjaan dilakukan oleh ahlinya.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-slate-50 text-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-200">
                  <HiOutlineShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">100% Produk Original</h3>
                  <p className="text-slate-600 leading-relaxed">Kami hanya mendistribusikan dan menginstalasi produk dari merk-merk audio premium terpercaya.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-slate-50 text-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-200">
                  <HiOutlineBadgeCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Garansi Instalasi</h3>
                  <p className="text-slate-600 leading-relaxed">Kepercayaan Anda adalah prioritas kami. Setiap hasil instalasi bengkel kami dilindungi oleh garansi pengerjaan.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-slate-50 text-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-200">
                  <HiOutlineCog className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Integrasi OEM Rapi</h3>
                  <p className="text-slate-600 leading-relaxed">Pemasangan dijamin rapi dan profesional tanpa merusak interior bawaan atau mengganggu sistem komputer (ECU) kendaraan Anda.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= GALERI ================= */}
        <section className="py-2 bg-white">
          <div className="container mx-auto px-2 md:px-8 max-w-7xl pb-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              <img 
                src={gallery1} 
                alt="Workshop Area Utama" 
                className="w-full h-64 md:h-full object-cover col-span-2 row-span-2" 
              />
              <img 
                src={gallery2} 
                alt="Tuning Audio" 
                className="w-full h-32 md:h-64 object-cover col-span-1" 
              />
              <img 
                src={gallery3} 
                alt="Speaker Setup" 
                className="w-full h-32 md:h-64 object-cover col-span-1" 
              />
              <img 
                src={gallery4} 
                alt="Instalasi Wiring" 
                className="w-full h-32 md:h-64 object-cover col-span-1" 
              />
              <img 
                src={heroImage} 
                alt="Detail Workshop" 
                className="w-full h-32 md:h-64 object-cover col-span-1" 
              />
            </div>
          </div>
        </section>
        
        {/* ================= KONTAK & LOKASI ================= */}
        <section ref={contactRef} className="border-t border-slate-200 bg-white mb-8">
          <div className="flex flex-col lg:flex-row">
            
            <div className="w-full lg:w-1/2 p-10 md:p-15 lg:p-20 bg-slate-900 text-white">
              <h2 className="text-3xl font-bold mb-4">Mari Wujudkan Audio Impian Anda</h2>
              <p className="text-slate-300 leading-relaxed mb-8">
                Kunjungi workshop kami untuk mendengarkan langsung demo audio, atau konsultasikan kebutuhan mobil Anda kepada tim kami.
              </p>
              
              <div className="space-y-5 mb-8">
                <div className="flex items-start gap-3">
                  <HiLocationMarker className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-lg mb-0.5">Alamat Toko</h4>
                    <p className="text-slate-300 leading-snug">
                      Jl. T. Amir Hamzah, Sei Agul, Kec. Medan Bar.,<br />
                      Kota Medan, Sumatera Utara 20235
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <HiPhone className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-lg mb-0.5">Hubungi Kami</h4>
                    <p className="text-slate-300">0812-6565-9219</p>
                    <span className="inline-block mt-1 text-[11px] font-semibold bg-blue-500 text-white px-2 py-0.5 rounded">WhatsApp Tersedia</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <HiClock className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-lg mb-0.5">Jam Operasional</h4>
                    <p className="text-slate-300">Senin - Minggu: 09.00 - 22.00 WIB</p>
                  </div>
                </div>
              </div>

              <a 
                href={GMAPS_URL}
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border-2 border-blue-400 text-blue-400 font-bold px-6 py-3 hover:bg-blue-500 hover:text-white transition-colors mt-2"
              >
                Buka di Google Maps <HiArrowRight className="w-4 h-4" />
              </a>
            </div>

            <a 
              href={GMAPS_URL}
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full lg:w-1/2 min-h-[400px] bg-slate-200 relative group cursor-pointer block overflow-hidden"
              title="Klik untuk membuka Google Maps"
            >
              <img 
                src={mapBgImage} 
                alt="Peta Lokasi Khairul Audio" 
                className="absolute inset-0 w-full h-full object-cover grayscale transition-transform duration-700 group-hover:scale-105 group-hover:grayscale-0"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/10 group-hover:bg-transparent transition-colors duration-300">
                {/* Efek denyut (Pulse) agar lebih terlihat seperti tombol aktif */}
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-16 h-16 bg-blue-500 rounded-full opacity-40 animate-ping"></div>
                  <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center shadow-2xl border-2 border-white relative z-10 transform transition-transform duration-300 group-hover:scale-110 group-hover:bg-blue-600">
                    <HiLocationMarker className="w-7 h-7 text-white" />
                  </div>
                </div>
              </div>
            </a>

          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}