"use client";
import ProductForm from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div>
      <h1 className="font-serif text-3xl mb-6">New product</h1>
      <ProductForm mode="create" />
    </div>
  );
}
