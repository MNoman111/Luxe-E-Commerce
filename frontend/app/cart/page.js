"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { currency, FALLBACK_IMG } from "@/lib/format";
import VoucherInput from "@/components/VoucherInput";

export default function CartPage() {
  const { items, updateQty, removeItem, subtotal, discount } = useCart();
  const router = useRouter();
  const shipping = subtotal >= 100 || subtotal === 0 ? 0 : 9.99;
  const tax = +((subtotal - discount) * 0.08).toFixed(2);
  const total = +(subtotal - discount + shipping + tax).toFixed(2);

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
          {discount > 0 && (
            <div className="flex justify-between text-sm mb-2 text-green-700">
              <span>Discount</span>
              <span>−{currency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm mb-2 text-black/60">
            <span>Shipping</span>
            <span>{shipping === 0 ? "Free" : currency(shipping)}</span>
          </div>
          <div className="flex justify-between text-sm mb-4 text-black/60">
            <span>Tax (8%)</span>
            <span>{currency(tax)}</span>
          </div>
          <div className="flex justify-between font-semibold border-t border-black/10 pt-3 mb-4">
            <span>Estimated total</span>
            <span>{currency(total)}</span>
          </div>

          <div className="mb-4">
            <VoucherInput />
          </div>

          <button
            onClick={() => router.push("/checkout")}
            className="w-full bg-ink text-white py-3 text-sm tracking-wide hover:bg-accent transition"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
