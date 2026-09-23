"use client";

import { Product } from "@/lib/types";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  currency: string;
  onSelect: (product: Product) => void;
}

export default function ProductGrid({ products, currency, onSelect }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-neutral-500">
        Aucun produit ne correspond a ces filtres.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} currency={currency} onSelect={onSelect} />
      ))}
    </div>
  );
}
