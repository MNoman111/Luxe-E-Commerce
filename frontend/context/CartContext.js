"use client";
import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);
const KEY = "luxe_cart";
const VKEY = "luxe_voucher";

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [voucher, setVoucher] = useState(null); // { code, discountType, discountValue, description }
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setItems(JSON.parse(saved));
      const v = localStorage.getItem(VKEY);
      if (v) setVoucher(JSON.parse(v));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready]);

  useEffect(() => {
    if (!ready) return;
    if (voucher) localStorage.setItem(VKEY, JSON.stringify(voucher));
    else localStorage.removeItem(VKEY);
  }, [voucher, ready]);

  const lineId = (id, size) => `${id}__${size}`;

  const addItem = (product, size, qty = 1) => {
    const id = lineId(product._id, size);
    setItems((prev) => {
      const found = prev.find((i) => i.lineId === id);
      if (found) {
        return prev.map((i) =>
          i.lineId === id ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [
        ...prev,
        {
          lineId: id,
          product: product._id,
          name: product.name,
          image: product.image,
          price: product.price,
          size,
          qty,
        },
      ];
    });
  };

  const updateQty = (lid, qty) =>
    setItems((prev) =>
      prev.map((i) => (i.lineId === lid ? { ...i, qty: Math.max(1, qty) } : i))
    );

  const removeItem = (lid) =>
    setItems((prev) => prev.filter((i) => i.lineId !== lid));

  const applyVoucher = (v) => setVoucher(v);
  const removeVoucher = () => setVoucher(null);

  const clear = () => {
    setItems([]);
    setVoucher(null);
  };

  const count = items.reduce((a, i) => a + i.qty, 0);
  const subtotal = items.reduce((a, i) => a + i.price * i.qty, 0);

  // Display-only discount (the server recomputes authoritatively at order time).
  let discount = 0;
  if (voucher) {
    discount =
      voucher.discountType === "percent"
        ? (subtotal * voucher.discountValue) / 100
        : Math.min(voucher.discountValue, subtotal);
    discount = +discount.toFixed(2);
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQty,
        removeItem,
        clear,
        count,
        subtotal,
        voucher,
        discount,
        applyVoucher,
        removeVoucher,
        ready,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
