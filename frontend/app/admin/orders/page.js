"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { currency } from "@/lib/format";

const STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");

  useEffect(() => {
    api
      .adminAllOrders()
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const changeStatus = async (id, status) => {
    setSaving(id);
    try {
      const updated = await api.adminUpdateOrderStatus(id, status);
      setOrders((list) => list.map((o) => (o._id === id ? { ...o, ...updated } : o)));
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving("");
    }
  };

  if (loading) return <p className="text-black/50">Loading…</p>;

  return (
    <div>
      <h1 className="font-serif text-3xl mb-6">Orders</h1>
      <div className="bg-white border border-black/5 rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-black/5 text-left">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Total</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="p-5 text-black/50">No orders yet.</td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o._id}>
                <td className="p-3">
                  <div className="font-medium">#{o._id.slice(-8)}</div>
                  <div className="text-xs text-black/50">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="p-3 text-black/70">{o.user?.name || "—"}</td>
                <td className="p-3">{currency(o.totalPrice)}</td>
                <td className="p-3">
                  <span className="text-black/70">{o.paymentMethod}</span>{" "}
                  <span className={o.isPaid ? "text-green-600" : "text-amber-600"}>
                    {o.isPaid ? "· Paid" : "· Unpaid"}
                  </span>
                </td>
                <td className="p-3">
                  <select
                    value={o.status}
                    disabled={saving === o._id}
                    onChange={(e) => changeStatus(o._id, e.target.value)}
                    className="border border-black/15 rounded-md px-2 py-1 bg-white"
                  >
                    {STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
