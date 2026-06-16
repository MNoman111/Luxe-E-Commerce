"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { currency } from "@/lib/format";

function Stat({ label, value }) {
  return (
    <div className="bg-white border border-black/5 rounded-lg p-5">
      <p className="text-sm text-black/50">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.adminStats().then(setStats).catch(() => {});
    api.adminAllOrders().then((o) => setOrders(o.slice(0, 6))).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="font-serif text-3xl mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Stat label="Revenue (paid)" value={currency(stats?.revenue || 0)} />
        <Stat label="Total orders" value={stats?.totalOrders ?? "—"} />
        <Stat label="Paid orders" value={stats?.paidOrders ?? "—"} />
        <Stat
          label="Awaiting"
          value={stats ? (stats.byStatus?.Pending || 0) + (stats.byStatus?.Processing || 0) : "—"}
        />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl">Recent orders</h2>
        <Link href="/admin/orders" className="text-sm text-accent hover:underline">
          View all →
        </Link>
      </div>
      <div className="bg-white border border-black/5 rounded-lg divide-y divide-black/10">
        {orders.length === 0 && (
          <p className="p-5 text-sm text-black/50">No orders yet.</p>
        )}
        {orders.map((o) => (
          <div key={o._id} className="p-4 flex justify-between text-sm">
            <span>
              #{o._id.slice(-8)} · {o.user?.name || "—"} · {o.paymentMethod}
            </span>
            <span className="flex items-center gap-3">
              <span className="text-black/50">{o.status}</span>
              <span className="font-semibold">{currency(o.totalPrice)}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
