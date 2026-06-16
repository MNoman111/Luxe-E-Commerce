"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const CATEGORIES = ["Men", "Women", "Accessories", "Footwear"];
const empty = {
  name: "",
  category: "Men",
  description: "",
  price: "",
  image: "",
  countInStock: "",
  sizes: "S, M, L, XL",
  colors: "",
  featured: false,
};

export default function ProductForm({ initial, mode = "create" }) {
  const router = useRouter();
  const [form, setForm] = useState(
    initial
      ? {
          ...initial,
          sizes: (initial.sizes || []).join(", "),
          colors: (initial.colors || []).join(", "),
        }
      : empty
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const payload = {
      name: form.name,
      category: form.category,
      description: form.description,
      price: Number(form.price),
      image: form.image,
      countInStock: Number(form.countInStock),
      featured: !!form.featured,
      sizes: form.sizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      colors: form.colors
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    try {
      if (mode === "edit") await api.adminUpdateProduct(initial._id, payload);
      else await api.adminCreateProduct(payload);
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-4">
      {error && (
        <div className="text-sm bg-red-50 text-red-700 px-4 py-2 rounded">{error}</div>
      )}
      <div>
        <label className="block text-sm mb-1">Name</label>
        <input className="adm-input" required value={form.name}
          onChange={(e) => set("name", e.target.value)} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Category</label>
          <select className="adm-input" value={form.category}
            onChange={(e) => set("category", e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Price (USD)</label>
          <input className="adm-input" type="number" step="0.01" required value={form.price}
            onChange={(e) => set("price", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="block text-sm mb-1">Image URL</label>
        <input className="adm-input" required value={form.image}
          onChange={(e) => set("image", e.target.value)} placeholder="https://…" />
      </div>
      <div>
        <label className="block text-sm mb-1">Description</label>
        <textarea className="adm-input" rows={3} required value={form.description}
          onChange={(e) => set("description", e.target.value)} />
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm mb-1">Stock</label>
          <input className="adm-input" type="number" required value={form.countInStock}
            onChange={(e) => set("countInStock", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Sizes (comma)</label>
          <input className="adm-input" value={form.sizes}
            onChange={(e) => set("sizes", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Colors (comma)</label>
          <input className="adm-input" value={form.colors}
            onChange={(e) => set("colors", e.target.value)} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={!!form.featured}
          onChange={(e) => set("featured", e.target.checked)} />
        Featured on home page
      </label>

      <div className="flex gap-3 pt-2">
        <button disabled={busy}
          className="bg-ink text-white px-6 py-2.5 text-sm hover:bg-accent transition disabled:opacity-50">
          {busy ? "Saving…" : mode === "edit" ? "Save changes" : "Create product"}
        </button>
        <button type="button" onClick={() => router.push("/admin/products")}
          className="px-6 py-2.5 text-sm border border-black/15 hover:border-black/40">
          Cancel
        </button>
      </div>

      <style jsx global>{`
        .adm-input {
          width: 100%;
          padding: 0.6rem 0.75rem;
          border: 1px solid rgba(0, 0, 0, 0.15);
          border-radius: 0.375rem;
          background: #fff;
          font-size: 0.9rem;
        }
      `}</style>
    </form>
  );
}
