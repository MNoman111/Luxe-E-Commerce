"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { currency } from "@/lib/format";

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login?redirect=/orders");
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      api
        .getMyOrders()
        .then(setOrders)
        .catch(() => {})
        .finally(() => setFetching(false));
    }
  }, [user]);

  if (loading || fetching)
    return <div className="max-w-4xl mx-auto px-4 py-20">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-serif text-4xl mb-8">My Orders</h1>
      {orders.length === 0 ? (
        <div className="text-black/60">
          You have no orders yet.{" "}
          <Link href="/products" className="text-accent hover:underline">
            Start shopping →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <Link
              key={o._id}
              href={`/orders/${o._id}`}
              className="block bg-white border border-black/5 rounded-lg p-5 hover:border-black/20 transition"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="text-sm text-black/50">Order #{o._id.slice(-8)}</p>
                  <p className="text-sm">
                    {new Date(o.createdAt).toLocaleDateString()} ·{" "}
                    {o.orderItems.length} item(s) · {o.paymentMethod}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{currency(o.totalPrice)}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      o.isPaid
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {o.isPaid ? "Paid" : o.paymentMethod === "COD" ? "COD — Pending" : "Unpaid"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
