// Lokasi: src/pages/OrderReviewPage.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { HiStar, HiOutlineChevronLeft, HiCheckCircle, HiOutlineArchive, HiOutlineCamera, HiX } from "react-icons/hi";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { API_BASE_URL, getImageUrl } from "../config/api";

export default function OrderReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // State reviews: { [product_id]: { rating: 5, comment: "", images: [], imagePreviews: [] } }
  const [reviews, setReviews] = useState({});

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_BASE_URL}/user/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const orderData = response.data.data || response.data;
        setOrder(orderData);

        // AMAN DARI ERROR: Inisialisasi state review HANYA jika data valid
        if (orderData && Array.isArray(orderData.items)) {
          const initialReviews = {};
          orderData.items.forEach(item => {
            const pId = item.product_id || item.product?.id || item.produk?.id;
            if (pId) {
              initialReviews[pId] = {
                rating: 5,
                comment: "",
                images: [],
                imagePreviews: []
              };
            }
          });
          setReviews(initialReviews);
        }
      } catch (error) {
        console.error("Gagal memuat data pesanan:", error);
        Swal.fire("Error", "Gagal memuat data pesanan.", "error");
        navigate("/orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [id, navigate]);

  const handleRatingChange = (productId, ratingValue) => {
    setReviews(prev => {
      const currentData = prev[productId] || { rating: 5, comment: "", images: [], imagePreviews: [] };
      return {
        ...prev,
        [productId]: { ...currentData, rating: ratingValue }
      };
    });
  };

  const handleCommentChange = (productId, commentValue) => {
    setReviews(prev => {
      const currentData = prev[productId] || { rating: 5, comment: "", images: [], imagePreviews: [] };
      return {
        ...prev,
        [productId]: { ...currentData, comment: commentValue }
      };
    });
  };

  const handleImageUpload = (productId, e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setReviews(prev => {
      const currentData = prev[productId] || { rating: 5, comment: "", images: [], imagePreviews: [] };

      // Sesuaikan Sisa Ruang Menjadi Maksimal 2 Foto Saja
      const spaceLeft = 2 - (currentData.images?.length || 0);

      if (spaceLeft <= 0) {
        Swal.fire("Peringatan", "Maksimal 2 foto untuk setiap produk.", "warning");
        return prev;
      }

      if (files.length > spaceLeft) {
        Swal.fire("Peringatan", `Hanya ${spaceLeft} foto yang ditambahkan untuk memenuhi batas maksimal 2 foto.`, "info");
      }

      const allowedFiles = files.slice(0, spaceLeft);
      const newPreviews = allowedFiles.map(file => URL.createObjectURL(file));

      return {
        ...prev,
        [productId]: {
          ...currentData,
          images: [...(currentData.images || []), ...allowedFiles],
          imagePreviews: [...(currentData.imagePreviews || []), ...newPreviews]
        }
      };
    });

    e.target.value = null;
  };

  const handleRemoveImage = (productId, imgIndex) => {
    setReviews(prev => {
      const currentData = prev[productId];
      if (!currentData) return prev;

      const updatedImages = [...(currentData.images || [])];
      const updatedPreviews = [...(currentData.imagePreviews || [])];

      updatedImages.splice(imgIndex, 1);
      updatedPreviews.splice(imgIndex, 1);

      return {
        ...prev,
        [productId]: { ...currentData, images: updatedImages, imagePreviews: updatedPreviews }
      };
    });
  };

  const handleSubmitReviews = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      formData.append('order_id', order.id);

      Object.keys(reviews).forEach((productId, index) => {
        const reviewData = reviews[productId];

        formData.append(`reviews[${index}][product_id]`, productId);
        formData.append(`reviews[${index}][rating]`, reviewData.rating);
        formData.append(`reviews[${index}][comment]`, reviewData.comment);

        if (reviewData.images && reviewData.images.length > 0) {
          reviewData.images.forEach((file, imgIndex) => {
            formData.append(`reviews[${index}][images][${imgIndex}]`, file);
          });
        }
      });

      await axios.post(`${API_BASE_URL}/user/reviews`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      Swal.fire({
        icon: "success",
        title: "Ulasan Terkirim!",
        text: "Terima kasih telah memberikan ulasan.",
        confirmButtonColor: "#2563eb"
      }).then(() => {
        navigate(`/orders/${order.id}`);
      });
    } catch (error) {
      console.error("Gagal mengirim ulasan:", error);
      const msg = error.response?.data?.message || "Terjadi kesalahan saat menyimpan ulasan. Pastikan Anda belum pernah memberikan ulasan untuk pesanan ini.";
      Swal.fire("Gagal", msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      <div className="flex-grow flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
      <Footer />
    </div>
  );

  if (!order || !order.items || order.items.length === 0) return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      <div className="flex-grow flex flex-col items-center justify-center">
        <HiOutlineArchive className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-gray-500 font-medium">Tidak ada produk yang perlu diulas.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 font-semibold hover:underline">
          Kembali
        </button>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-slate-800">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 sm:px-6 py-8 max-w-3xl">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium transition">
          <HiOutlineChevronLeft className="w-5 h-5" /> Kembali
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="p-5 border-b border-blue-100 bg-blue-600 text-white">
            <h1 className="text-lg font-bold">Penilaian Produk</h1>
            <p className="text-sm opacity-90 font-medium mt-1">Invoice: {order.invoice_number || `INV-${order.id}`}</p>
          </div>
        </div>

        <form onSubmit={handleSubmitReviews} className="space-y-6">
          {order.items.map((item, index) => {

            const productId = item.product_id || item.product?.id || item.produk?.id;
            const actualProduct = item.product || item.produk || item;

            if (!productId) return null;

            const itemName = actualProduct?.name || actualProduct?.product_name || item.product_name || "Produk Audio";

            let imgUrl = getImageUrl(item.product_image || actualProduct?.image_url);

            const currentReview = reviews[productId] || { rating: 5, comment: "", images: [], imagePreviews: [] };

            return (
              <div key={productId || index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md">

                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex gap-4 items-center">
                  <div className="w-16 h-16 bg-white rounded-lg border border-gray-200 flex items-center justify-center p-1 relative overflow-hidden flex-shrink-0">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={itemName}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                      />
                    ) : null}
                    <HiOutlineArchive className="text-gray-300 w-6 h-6 absolute" style={{ display: imgUrl ? 'none' : 'block' }} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm md:text-base line-clamp-1">{itemName}</h4>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">Beli {item.quantity || item.qty || 1} item</p>
                  </div>
                </div>

                <div className="p-5 md:p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 select-none border-b border-gray-50 pb-5">
                    <span className="text-sm font-bold text-gray-700 w-32">Kualitas Produk</span>
                    <div className="flex gap-1.5 items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <HiStar
                          key={star}
                          onClick={() => handleRatingChange(productId, star)}
                          className={`w-9 h-9 cursor-pointer transition-all hover:scale-110 active:scale-95 ${star <= currentReview.rating ? "text-amber-400 drop-shadow-sm" : "text-gray-200"
                            }`}
                        />
                      ))}
                      <span className="text-sm font-black text-amber-500 ml-3 uppercase tracking-wider">
                        {currentReview.rating === 5 ? "Sangat Baik" : currentReview.rating === 4 ? "Baik" : currentReview.rating === 3 ? "Cukup" : currentReview.rating === 2 ? "Buruk" : "Sangat Buruk"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Tulis Ulasan Anda</label>
                    <textarea
                      rows="4"
                      value={currentReview.comment}
                      onChange={(e) => handleCommentChange(productId, e.target.value)}
                      placeholder="Bagaimana kualitas produk ini? Apakah sesuai deskripsi? Bagikan pengalaman Anda..."
                      className="w-full p-4 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none transition-all placeholder:text-gray-400"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Tambahkan Foto <span className="text-xs text-gray-400 font-normal">(Maksimal 2 Foto)</span></label>
                    <div className="flex flex-wrap gap-3">

                      {Array.isArray(currentReview.imagePreviews) && currentReview.imagePreviews.map((url, imgIndex) => (
                        <div key={imgIndex} className="relative w-20 h-20 md:w-24 md:h-24 rounded-lg border border-gray-200 overflow-hidden group shadow-sm bg-gray-100">
                          <img
                            src={url}
                            alt={`Preview ${imgIndex}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(productId, imgIndex)}
                            className="absolute top-1 right-1 bg-white/90 text-red-500 p-1.5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
                          >
                            <HiX className="w-4 h-4" />
                          </button>
                        </div>
                      ))}

                      {(!currentReview.images || currentReview.images.length < 2) && (
                        <label className="w-20 h-20 md:w-24 md:h-24 flex flex-col items-center justify-center border-2 border-dashed border-blue-300 bg-blue-50/50 rounded-lg cursor-pointer hover:bg-blue-100 hover:border-blue-400 transition-colors text-blue-600 group">
                          <HiOutlineCamera className="w-6 h-6 mb-1.5 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] md:text-xs font-bold">Tambah Foto</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(productId, e)}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="flex justify-end gap-3 pt-6 pb-12">
            <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 bg-white border border-gray-300 rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-50 transition">
              Batal
            </button>
            <button type="submit" disabled={submitting} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 active:scale-95 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 min-w-[160px]">
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>Kirim Ulasan</>
              )}
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}