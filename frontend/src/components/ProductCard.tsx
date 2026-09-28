"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Product } from "@/lib/types";
import { resolveMediaUrl } from "@/lib/api";

const HOVER_CYCLE_MS = 1500;

interface ProductCardProps {
  product: Product;
  currency: string;
  onSelect: (product: Product) => void;
}

export default function ProductCard({ product, currency, onSelect }: ProductCardProps) {
  const images = product.images;
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!hovered || images.length < 2) return;
    const interval = setInterval(() => {
      setActiveIndex((i) => (i + 1) % images.length);
    }, HOVER_CYCLE_MS);
    return () => clearInterval(interval);
  }, [hovered, images.length]);

  // Reset to the cover image once the pointer leaves, so every card starts
  // from the same frame next time it's hovered.
  function handleLeave() {
    setHovered(false);
    setActiveIndex(0);
  }

  const image = images[activeIndex];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(product)}
      onKeyDown={(e) => e.key === "Enter" && onSelect(product)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleLeave}
      className="group flex w-full cursor-pointer flex-col text-left"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-card">
        {image && !imageFailed ? (
          <Image
            key={image.id}
            src={resolveMediaUrl(image.image)}
            alt={`${product.brand} ${product.name}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
            Pas d&apos;image
          </div>
        )}
        {images.length > 1 && (
          <div className="absolute left-1/2 top-3 flex -translate-x-1/2 gap-1">
            {images.map((img, idx) => (
              <span
                key={img.id}
                className={`h-1 rounded-full transition-all duration-300 ${
                  idx === activeIndex ? "w-4 bg-white" : "w-1 bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
        <span
          onClick={(e) => {
            e.stopPropagation();
            onSelect(product);
          }}
          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-base font-bold text-white shadow-md transition-transform group-hover:scale-110"
        >
          +
        </span>
      </div>
      <div className="flex flex-col gap-0.5 px-1 pt-4">
        <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">
          {product.brand}
        </span>
        <span className="text-base font-bold leading-tight text-neutral-900">
          {product.name}
        </span>
        <span className="mt-1 text-sm font-semibold text-neutral-500">
          {product.price.toLocaleString("fr-FR")} {currency}
        </span>
      </div>
    </div>
  );
}
