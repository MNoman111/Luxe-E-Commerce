"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import ProductCard from "@/components/ProductCard";

const CATEGORIES = ["All", "Men", "Women", "Accessories", "Footwear"];
const SORTS = [
  { value: "", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

function ProductsInner() {
  const params = useSearchParams();
  const router = useRouter();
  const category = params.get("category") || "All";
  const sort = params.get("sort") || "";
  const search = params.get("search") || "";

  const [data, setData] = useState({ products: [] });
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState(search);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (category && category !== "All") qs.set("category", category);
    if (sort) qs.set("sort", sort);
    if (search) qs.set("search", search);
    api
      .getProducts(`?${qs.toString()}`)
      .then(setData)
      .catch(() => setData({ products: [] }))
      .finally(() => setLoading(false));
  }, [category, sort, search]);

  const setParam = (key, value) => {
    const qs = new URLSearchParams(params.toString());
    if (value) qs.set(key, value);
    else qs.delete(key);
    router.push(`/products?${qs.toString()}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="font-serif text-4xl mb-6">
        {category === "All" ? "Shop All" : category}
      </h1>

      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between mb-8">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setParam("category", c === "All" ? "" : c)}
              className={`px-4 py-1.5 text-sm rounded-full border transition ${
                category === c
                  ? "bg-ink text-white border-ink"
                  : "border-black/15 hover:border-black/40"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setParam("search", term);
            }}
          >
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search…"
              className="px-3 py-1.5 text-sm border border-black/15 rounded-md bg-white"
            />
          </form>
          <select
            value={sort}
            onChange={(e) => setParam("sort", e.target.value)}
            className="px-3 py-1.5 text-sm border border-black/15 rounded-md bg-white"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-black/50">Loading…</p>
      ) : data.products.length === 0 ? (
        <p className="text-black/50">No products found.</p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">
          {data.products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-10">Loading…</div>}>
      <ProductsInner />
    </Suspense>
  );
}
