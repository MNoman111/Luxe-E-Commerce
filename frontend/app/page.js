"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import ProductCard from "@/components/ProductCard";

const categories = [
  { name: "Men", img: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?auto=format&fit=crop&w=700&q=80" },
  { name: "Women", img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=700&q=80" },
  { name: "Accessories", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80" },
  { name: "Footwear", img: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=700&q=80" },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    api.getFeatured().then(setFeatured).catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[72vh] min-h-[460px] flex items-center">
        <img
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80"
          alt="LUXE new season"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative max-w-7xl mx-auto px-4 text-white">
          <p className="uppercase tracking-[0.4em] text-sm mb-4">New Season</p>
          <h1 className="font-serif text-5xl sm:text-6xl max-w-xl leading-tight">
            Elevated essentials, made to last.
          </h1>
          <p className="mt-5 max-w-md text-white/85">
            Timeless pieces crafted from premium materials. Free shipping on orders over $100.
          </p>
          <Link
            href="/products"
            className="inline-block mt-8 bg-white text-ink px-8 py-3 text-sm tracking-wide hover:bg-accent hover:text-white transition"
          >
            Shop the Collection
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((c) => (
            <Link
              key={c.name}
              href={`/products?category=${c.name}`}
              className="relative aspect-[3/4] overflow-hidden rounded-lg group"
            >
              <img
                src={c.img}
                alt={c.name}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/25 flex items-end p-5">
                <span className="text-white font-serif text-xl">{c.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-7xl mx-auto px-4 pb-20">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-serif text-3xl">Featured</h2>
          <Link href="/products" className="text-sm text-accent hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">
          {featured.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
          {featured.length === 0 && (
            <p className="text-black/50 col-span-full">
              No products yet. Run the backend seed script to populate the store.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
