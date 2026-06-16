"use client";
import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);
const KEY = "luxe_cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready]);

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

  const clear = () => setItems([]);

  const count = items.reduce((a, i) => a + i.qty, 0);
  const subtotal = items.reduce((a, i) => a + i.price * i.qty, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQty, removeItem, clear, count, subtotal, ready }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
