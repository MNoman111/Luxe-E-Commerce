"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import ProductForm from "@/components/admin/ProductForm";

export default function EditProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getProduct(id).then(setProduct).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="text-red-700">{error}</p>;
  if (!product) return <p className="text-black/50">Loading…</p>;

  return (
    <div>
      <h1 className="font-serif text-3xl mb-6">Edit product</h1>
      <ProductForm mode="edit" initial={product} />
    </div>
  );
}
