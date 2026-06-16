// Lokasi: src/context/CartContext.jsx

import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { useAuth } from './AuthContext'; // ✅ 1. Import useAuth untuk membaca siapa yang sedang login

const CartContext = createContext();

export function CartProvider({ children }) {
  const { user } = useAuth(); // ✅ 2. Ambil data user

  // ✅ 3. Membuat "Kunci Loker" dinamis. 
  const cartKey = user ? `khairul_audio_cart_${user.id}` : 'khairul_audio_cart_guest';

  // State awal: baca dari localStorage menggunakan kunci yang aktif
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem(cartKey);
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // ✅ 4. EFEK PERGANTIAN AKUN: 
  useEffect(() => {
    const savedCart = localStorage.getItem(cartKey);
    setCartItems(savedCart ? JSON.parse(savedCart) : []);
  }, [cartKey]);

  // ✅ 5. EFEK SIMPAN: 
  useEffect(() => {
    localStorage.setItem(cartKey, JSON.stringify(cartItems));
  }, [cartItems, cartKey]);


  // --- FUNGSI KERANJANG ---
  
  const addToCart = (productToAdd, quantityToAdd = 1) => {
    // PERBAIKAN: Gunakan prevItems agar data sinkron jika ditambahkan beruntun
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.id === productToAdd.id);
      
      if (existingItem) {
        return prevItems.map((item) =>
          item.product.id === productToAdd.id
            ? { ...item, quantity: item.quantity + quantityToAdd } 
            : item
        );
      } else {
        return [...prevItems, { product: productToAdd, quantity: quantityToAdd }];
      }
    });
    
    console.log(`${quantityToAdd} x ${productToAdd.name} ditambahkan ke keranjang.`);
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      // PERBAIKAN: Gunakan prevItems
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.product.id === productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  const removeFromCart = (productId) => {
    // 🔥 PERBAIKAN UTAMA: Menggunakan functional update (prevItems) 
    // Ini mencegah "State Basi" (Stale State) saat penghapusan massal!
    setCartItems((prevItems) => 
      prevItems.filter((item) => item.product.id !== productId)
    );
  };
  
  const clearCart = () => {
    setCartItems([]);
  };
  
  const totalItemCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const value = {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItemCount,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  return useContext(CartContext);
}