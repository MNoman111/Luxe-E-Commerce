"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { currency, FALLBACK_IMG } from "@/lib/format";

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [src, setSrc] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    api
      .getProduct(id)
      .then((p) => {
        setProduct(p);
        setSize(p.sizes?.[0] || "One Size");
        setSrc(p.image);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error)
    return <div className="max-w-7xl mx-auto px-4 py-20">Product not found.</div>;
  if (!product)
    return <div className="max-w-7xl mx-auto px-4 py-20">Loading…</div>;

  const inStock = product.countInStock > 0;

  const handleAdd = () => {
    addItem(product, size, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <button onClick={() => router.back()} className="text-sm text-accent mb-6">
        ← Back
      </button>
      <div className="grid md:grid-cols-2 gap-10">
        <div className="aspect-[4/5] overflow-hidden rounded-lg bg-black/5">
          <img
            src={src}
            alt={product.name}
            onError={() => setSrc(FALLBACK_IMG)}
            className="h-full w-full object-cover"
          />
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-accent">
            {product.category}
          </p>
          <h1 className="font-serif text-4xl mt-1">{product.name}</h1>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-2xl font-semibold">{currency(product.price)}</span>
            <span className="text-sm text-black/50">
              ★ {product.rating?.toFixed(1)} ({product.numReviews})
            </span>
          </div>

          <p className="mt-5 text-black/70 leading-relaxed">{product.description}</p>

          {product.sizes?.length > 0 && (
            <div className="mt-7">
              <p className="text-sm font-medium mb-2">Size</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`min-w-[3rem] px-3 py-2 text-sm border rounded-md transition ${
                      size === s
                        ? "bg-ink text-white border-ink"
                        : "border-black/15 hover:border-black/40"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center border border-black/15 rounded-md">
              <button className="px-3 py-2" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                −
              </button>
              <span className="px-4">{qty}</span>
              <button className="px-3 py-2" onClick={() => setQty((q) => q + 1)}>
                +
              </button>
            </div>
            <button
              onClick={handleAdd}
              disabled={!inStock}
              className="flex-1 bg-ink text-white py-3 text-sm tracking-wide hover:bg-accent transition disabled:opacity-40"
            >
              {inStock ? (added ? "Added ✓" : "Add to Cart") : "Out of Stock"}
            </button>
          </div>

          <p className="mt-3 text-sm text-black/50">
            {inStock ? `${product.countInStock} in stock` : "Currently unavailable"} ·
            Free shipping over $100
          </p>
        </div>
      </div>
    </div>
  );
}
