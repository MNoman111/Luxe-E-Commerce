"use client";
import { useState } from "react";
import api from "@/lib/api";
import { useCart } from "@/context/CartContext";

export default function VoucherInput() {
  const { subtotal, voucher, applyVoucher, removeVoucher } = useCart();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const apply = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setError("");
    setBusy(true);
    try {
      const res = await api.validateVoucher(code.trim(), subtotal);
      applyVoucher({
        code: res.code,
        description: res.description,
        discountType: res.discountType,
        discountValue: res.discountValue,
      });
      setCode("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (voucher) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-3 py-2 text-sm">
        <span className="text-green-800">
          <strong>{voucher.code}</strong> applied
          {voucher.description ? ` — ${voucher.description}` : ""}
        </span>
        <button
          onClick={removeVoucher}
          className="text-green-700 hover:underline ml-3"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={apply} className="space-y-1">
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Voucher code"
          className="flex-1 px-3 py-2 text-sm border border-black/15 rounded-md bg-white uppercase"
        />
        <button
          disabled={busy}
          className="px-4 py-2 text-sm border border-ink rounded-md hover:bg-ink hover:text-white transition disabled:opacity-50"
        >
          {busy ? "…" : "Apply"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
