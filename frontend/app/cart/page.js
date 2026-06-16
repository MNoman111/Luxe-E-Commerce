"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { currency, FALLBACK_IMG } from "@/lib/format";

export default function CartPage() {
  const { items, updateQty, removeItem, subtotal } = useCart();
  const router = useRouter();

  if (items.length === 0)
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 className="font-serif text-4xl mb-4">Your cart is empty</h1>
        <Link href="/products" className="text-accent hover:underline">
          Continue shopping →
        </Link>
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="font-serif text-4xl mb-8">Shopping Cart</h1>
      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 divide-y divide-black/10">
          {items.map((i) => (
            <div key={i.lineId} className="py-5 flex gap-4">
              <img
                src={i.image}
                alt={i.name}
                onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
                className="w-24 h-28 object-cover rounded-md bg-black/5"
              />
              <div className="flex-1">
                <div className="flex justify-between">
                  <h3 className="font-medium">{i.name}</h3>
                  <span className="font-semibold">{currency(i.price * i.qty)}</span>
                </div>
                <p className="text-sm text-black/50">Size: {i.size}</p>
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex items-center border border-black/15 rounded-md text-sm">
                    <button className="px-2.5 py-1" onClick={() => updateQty(i.lineId, i.qty - 1)}>
                      −
                    </button>
                    <span className="px-3">{i.qty}</span>
                    <button className="px-2.5 py-1" onClick={() => updateQty(i.lineId, i.qty + 1)}>
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(i.lineId)}
                    className="text-sm text-black/50 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg p-6 h-fit border border-black/5">
          <h2 className="font-serif text-xl mb-4">Order Summary</h2>
          <div className="flex justify-between text-sm mb-2">
            <span>Subtotal</span>
            <span>{currency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm mb-2 text-black/60">
            <span>Shipping</span>
            <span>{subtotal >= 100 ? "Free" : currency(9.99)}</span>
          </div>
          <div className="flex justify-between text-sm mb-4 text-black/60">
            <span>Tax (8%)</span>
            <span>{currency(subtotal * 0.08)}</span>
          </div>
          <div className="flex justify-between font-semibold border-t border-black/10 pt-3">
            <span>Estimated total</span>
            <span>
              {currency(subtotal + (subtotal >= 100 ? 0 : 9.99) + subtotal * 0.08)}
            </span>
          </div>
          <button
            onClick={() => router.push("/checkout")}
            className="w-full mt-5 bg-ink text-white py-3 text-sm tracking-wide hover:bg-accent transition"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
