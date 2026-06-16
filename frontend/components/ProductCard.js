"use client";
import Link from "next/link";
import { useState } from "react";
import { currency, FALLBACK_IMG } from "@/lib/format";

export default function ProductCard({ product }) {
  const [src, setSrc] = useState(product.image);
  return (
    <Link href={`/products/${product._id}`} className="group block">
      <div className="aspect-[4/5] overflow-hidden rounded-lg bg-black/5">
        <img
          src={src}
          alt={product.name}
          onError={() => setSrc(FALLBACK_IMG)}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wider text-accent">
            {product.category}
          </p>
          <h3 className="text-sm font-medium leading-snug">{product.name}</h3>
        </div>
        <span className="text-sm font-semibold whitespace-nowrap">
          {currency(product.price)}
        </span>
      </div>
    </Link>
  );
}
