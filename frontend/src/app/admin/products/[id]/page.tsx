"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchAdminProduct } from "@/lib/adminApi";
import { Product } from "@/lib/types";
import ProductForm from "@/components/admin/ProductForm";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAdminProduct(Number(params.id))
      .then(setProduct)
      .catch((err) => setError(err instanceof Error ? err.message : "Produit introuvable."));
  }, [params.id]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!product) return <p className="text-sm text-neutral-500">Chargement...</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold uppercase tracking-tight">
        Modifier {product.brand} {product.name}
      </h1>
      <ProductForm product={product} />
    </div>
  );
}
