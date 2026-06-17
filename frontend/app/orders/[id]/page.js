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
        <div className="mb-6 bg-green-50 text-green-800 px-5 py-4 rounded-lg">
          <p className="font-medium">Thank you! Your order has been placed.</p>
          <p className="text-sm">
            {order.paymentMethod === "COD"
              ? "You'll pay in cash on delivery."
              : "Payment received."}
          </p>
        </div>
      )}

      <h1 className="font-serif text-3xl mb-1">Order #{order._id.slice(-8)}</h1>
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
