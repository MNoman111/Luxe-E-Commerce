"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

const empty = {
  code: "",
  description: "",
  discountType: "percent",
  discountValue: "",
  minOrder: "",
  expiresAt: "",
  usageLimit: "",
};

function isExpired(v) {
  return v.expiresAt && new Date(v.expiresAt).getTime() < Date.now();
}

export default function AdminVouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .adminVouchers()
      .then(setVouchers)
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const create = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const created = await api.adminCreateVoucher({
        code: form.code,
        description: form.description,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrder: Number(form.minOrder) || 0,
        usageLimit: Number(form.usageLimit) || 0,
        expiresAt: form.expiresAt || undefined,
      });
      setVouchers((v) => [created, ...v]);
      setForm(empty);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this voucher?")) return;
    try {
      await api.adminDeleteVoucher(id);
      setVouchers((v) => v.filter((x) => x._id !== id));
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div>
      <h1 className="font-serif text-3xl mb-6">Vouchers</h1>

      <form onSubmit={create} className="bg-white border border-black/5 rounded-lg p-5 mb-8 grid sm:grid-cols-2 gap-4">
        <h2 className="font-serif text-lg sm:col-span-2">Create a voucher</h2>
        {error && (
          <div className="sm:col-span-2 text-sm bg-red-50 text-red-700 px-4 py-2 rounded">{error}</div>
        )}
        <div>
          <label className="block text-sm mb-1">Code</label>
          <input className="vinp uppercase" required value={form.code}
            onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="SUMMER25" />
        </div>
        <div>
          <label className="block text-sm mb-1">Description</label>
          <input className="vinp" value={form.description}
            onChange={(e) => set("description", e.target.value)} placeholder="25% off summer promo" />
        </div>
        <div>
          <label className="block text-sm mb-1">Type</label>
          <select className="vinp" value={form.discountType}
            onChange={(e) => set("discountType", e.target.value)}>
            <option value="percent">Percentage (%)</option>
            <option value="fixed">Fixed amount ($)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">
            Value {form.discountType === "percent" ? "(%)" : "($)"}
          </label>
          <input className="vinp" type="number" step="0.01" required value={form.discountValue}
            onChange={(e) => set("discountValue", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Min order ($)</label>
          <input className="vinp" type="number" value={form.minOrder}
            onChange={(e) => set("minOrder", e.target.value)} placeholder="0" />
        </div>
        <div>
          <label className="block text-sm mb-1">Usage limit (0 = unlimited)</label>
          <input className="vinp" type="number" value={form.usageLimit}
            onChange={(e) => set("usageLimit", e.target.value)} placeholder="0" />
        </div>
        <div>
          <label className="block text-sm mb-1">Expires at</label>
          <input className="vinp" type="date" value={form.expiresAt}
            onChange={(e) => set("expiresAt", e.target.value)} />
        </div>
        <div className="flex items-end">
          <button disabled={busy}
            className="bg-ink text-white px-6 py-2.5 text-sm hover:bg-accent transition disabled:opacity-50">
            {busy ? "Creating…" : "Create voucher"}
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-black/50">Loading…</p>
      ) : (
        <div className="bg-white border border-black/5 rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-black/5 text-left">
              <tr>
                <th className="p-3">Code</th>
                <th className="p-3">Discount</th>
                <th className="p-3">Min</th>
                <th className="p-3">Used</th>
                <th className="p-3">Expires</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {vouchers.length === 0 && (
                <tr><td colSpan={6} className="p-5 text-black/50">No vouchers yet.</td></tr>
              )}
              {vouchers.map((v) => (
                <tr key={v._id}>
                  <td className="p-3">
                    <div className="font-medium">{v.code}</div>
                    <div className="text-xs text-black/50">{v.description}</div>
                  </td>
                  <td className="p-3">
                    {v.discountType === "percent" ? `${v.discountValue}%` : `$${v.discountValue}`}
                  </td>
                  <td className="p-3 text-black/60">{v.minOrder ? `$${v.minOrder}` : "—"}</td>
                  <td className="p-3 text-black/60">
                    {v.usedCount}{v.usageLimit ? ` / ${v.usageLimit}` : ""}
                  </td>
                  <td className="p-3">
                    {v.expiresAt ? (
                      <span className={isExpired(v) ? "text-red-600" : "text-black/60"}>
                        {new Date(v.expiresAt).toLocaleDateString()}
                        {isExpired(v) ? " (expired)" : ""}
                      </span>
                    ) : (
                      <span className="text-black/40">Never</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => remove(v._id)} className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx global>{`
        .vinp {
          width: 100%;
          padding: 0.6rem 0.75rem;
          border: 1px solid rgba(0, 0, 0, 0.15);
          border-radius: 0.375rem;
          background: #fff;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}
