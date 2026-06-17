"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { currency, FALLBACK_IMG } from "@/lib/format";

function OrderInner() {
  const { id } = useParams();
  const params = useSearchParams();
  const placed = params.get("placed");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getOrder(id).then(setOrder).catch((e) => setError(e.message));
  }, [id]);

  if (error)
    return (
      <div className="max-w-3xl mx-auto px-4 py-20">
        {error} ·{" "}
        <Link href="/orders" className="text-accent">
          Back to orders
        </Link>
      </div>
    );
  if (!order) return <div className="max-w-3xl mx-auto px-4 py-20">Loading…</div>;

  const a = order.shippingAddress || {};

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {placed && (
        <div className="mb-8 text-center bg-green-50 border border-green-200 rounded-xl px-6 py-10">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-green-600 text-white flex items-center justify-center text-3xl">
            ✓
          </div>
          <h2 className="font-serif text-3xl text-green-900 mb-2">
            Thank you for your order!
          </h2>
          <p className="text-green-800">
            Your order <strong>#{order._id.slice(-8)}</strong> has been placed
            successfully.
          </p>
          <p className="text-sm text-green-700 mt-1">
            {order.paymentMethod === "COD"
              ? "You'll pay in cash on delivery. "
              : "Payment received. "}
            A confirmation email is on its way to{" "}
            {order.user?.email || order.guestEmail || "your inbox"}.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Link
              href="/products"
              className="bg-ink text-white px-6 py-2.5 text-sm tracking-wide hover:bg-accent transition"
            >
              Continue shopping
            </Link>
            <a
              href="#order-details"
              className="px-6 py-2.5 text-sm border border-green-300 rounded-md text-green-800 hover:bg-green-100 transition"
            >
              View order details
            </a>
          </div>
        </div>
      )}

      <h1 id="order-details" className="font-serif text-3xl mb-1 scroll-mt-20">
        Order #{order._id.slice(-8)}
      </h1>
      <p className="text-sm text-black/50 mb-6">
        Placed {new Date(order.createdAt).toLocaleString()}
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-8 text-sm">
        <div className="bg-white border border-black/5 rounded-lg p-5">
          <p className="font-medium mb-1">Shipping to</p>
          <p className="text-black/70">
            {a.fullName}
            <br />
            {a.address}, {a.city} {a.postalCode}
            <br />
            {a.country} · {a.phone}
          </p>
        </div>
        <div className="bg-white border border-black/5 rounded-lg p-5">
          <p className="font-medium mb-1">Payment</p>
          <p className="text-black/70">
            Method: {order.paymentMethod}
            <br />
            Status: {order.isPaid ? "Paid" : "Pending"}
            <br />
            Order status: {order.status}
          </p>
        </div>
      </div>

      <div className="bg-white border border-black/5 rounded-lg p-5">
        <h2 className="font-serif text-xl mb-4">Items</h2>
        <div className="divide-y divide-black/10">
          {order.orderItems.map((i, idx) => (
            <div key={idx} className="py-3 flex gap-4 items-center">
              <img
                src={i.image}
                alt={i.name}
                onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
                className="w-14 h-16 object-cover rounded bg-black/5"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{i.name}</p>
                <p className="text-xs text-black/50">
                  Size {i.size} · Qty {i.qty}
                </p>
              </div>
              <span className="text-sm">{currency(i.price * i.qty)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-black/10 mt-4 pt-4 space-y-2 text-sm">
          <div className="flex justify-between"><span>Items</span><span>{currency(order.itemsPrice)}</span></div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-green-700">
              <span>Discount{order.voucherCode ? ` (${order.voucherCode})` : ""}</span>
              <span>−{currency(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-black/60"><span>Shipping</span><span>{order.shippingPrice === 0 ? "Free" : currency(order.shippingPrice)}</span></div>
          <div className="flex justify-between text-black/60"><span>Tax</span><span>{currency(order.taxPrice)}</span></div>
          <div className="flex justify-between font-semibold pt-2 border-t border-black/10">
            <span>Total</span><span>{currency(order.totalPrice)}</span>
          </div>
        </div>
      </div>

      <Link href="/orders" className="inline-block mt-6 text-sm text-accent hover:underline">
        ← All orders
      </Link>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto px-4 py-20">Loading…</div>}>
      <OrderInner />
    </Suspense>
  );
}
