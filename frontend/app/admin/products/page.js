"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { currency, FALLBACK_IMG } from "@/lib/format";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .getProducts("?limit=200")
      .then((d) => setProducts(d.products))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const remove = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      await api.adminDeleteProduct(id);
      setProducts((p) => p.filter((x) => x._id !== id));
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl">Products</h1>
        <Link href="/admin/products/new"
          className="bg-ink text-white px-5 py-2.5 text-sm hover:bg-accent transition">
          + New product
        </Link>
      </div>

      {loading ? (
        <p className="text-black/50">Loading…</p>
      ) : (
        <div className="bg-white border border-black/5 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-black/5 text-left">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3 hidden sm:table-cell">Category</th>
                <th className="p-3">Price</th>
                <th className="p-3 hidden sm:table-cell">Stock</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {products.map((p) => (
                <tr key={p._id}>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt={p.name}
                        onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
                        className="w-10 h-12 object-cover rounded bg-black/5" />
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-3 hidden sm:table-cell text-black/60">{p.category}</td>
                  <td className="p-3">{currency(p.price)}</td>
                  <td className="p-3 hidden sm:table-cell">{p.countInStock}</td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <Link href={`/admin/products/${p._id}`} className="text-accent hover:underline mr-4">
                      Edit
                    </Link>
                    <button onClick={() => remove(p._id)} className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
