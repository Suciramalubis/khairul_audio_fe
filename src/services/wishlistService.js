// src/services/wishlistService.js
import axios from 'axios';

const API_BASE_URL = '/api';

// Helper untuk mendapatkan token (sesuaikan dengan cara Anda menyimpan token)
const getToken = () => localStorage.getItem('token');

// Axios instance dengan auth header
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Ambil semua wishlist user
export const getWishlist = async () => {
  try {
    const response = await apiClient.get('/wishlist');
    // Sesuaikan dengan struktur response: data.data
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    throw error;
  }
};

// Tambah produk ke wishlist
export const addToWishlist = async (productId) => {
  try {
    const response = await apiClient.post(`/wishlist/add/${productId}`);
    return response.data;
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    throw error;
  }
};

// Hapus produk dari wishlist
export const removeFromWishlist = async (productId) => {
  try {
    const response = await apiClient.delete(`/wishlist/remove/${productId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    throw error;
  }
};

// Cek status wishlist
export const checkWishlistStatus = async (productId) => {
  try {
    const response = await apiClient.get(`/wishlist/check/${productId}`);
    return response.data.is_wishlisted;
  } catch (err) { // <- ganti 'error' dengan 'err' atau '_error' untuk menghindari unused variable
    console.error('Error checking wishlist status:', err);
    return false;
  }
};
