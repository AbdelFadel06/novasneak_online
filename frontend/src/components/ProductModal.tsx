"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Product, StoreSettings } from "@/lib/types";
import { resolveMediaUrl } from "@/lib/api";
import { useCartStore } from "@/lib/cart-store";
import { trackEvent } from "@/lib/analytics";

interface ProductModalProps {
  product: Product;
  settings: StoreSettings;
  onClose: () => void;
}

export default function ProductModal({ product, settings, onClose }: ProductModalProps) {
  const [activeImage, setActiveImage] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [size, setSize] = useState<number | null>(null);
  const [withBox, setWithBox] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [colorNote, setColorNote] = useState("");
  const [error, setError] = useState("");
  const addItem = useCartStore((s) => s.addItem);

  const sizes = useMemo(() => {
    const list: number[] = [];
    for (let s = settings.size_min; s <= settings.size_max; s++) list.push(s);
    return list;
  }, [settings.size_min, settings.size_max]);

  const unitPrice = withBox ? product.price : product.price - settings.box_discount;
  const images = product.images;

  function handleAddToCart() {
    if (!size) {
      setError("Merci de choisir une pointure.");
      return;
    }
    addItem({
      productId: product.id,
      brand: product.brand,
      name: product.name,
      unitPrice,
      size,
      withBox,
      quantity,
      colorNote,
      image: images[0] ? resolveMediaUrl(images[0].image) : null,
    });
    trackEvent("add_to_cart", { brand: product.brand, name: product.name, size, withBox });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative flex max-h-[85vh] w-full max-w-4xl flex-col overflow-y-auto rounded-2xl bg-white md:max-h-[80vh] md:flex-row">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-bold shadow"
        >
          x
        </button>

        <div className="flex w-full flex-col gap-2 bg-card p-5 md:w-1/2">
          <div className="relative h-72 w-full overflow-hidden rounded-xl bg-card sm:h-80 md:h-[26rem]">
            {images[activeImage] && !failedImages.has(images[activeImage].id) ? (
              <Image
                src={resolveMediaUrl(images[activeImage].image)}
                alt={`${product.brand} ${product.name}`}
                fill
                className="object-cover"
                sizes="50vw"
                onError={() =>
                  setFailedImages((prev) => new Set(prev).add(images[activeImage].id))
                }
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-neutral-400">
                Pas d&apos;image
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(idx)}
                  className={`relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border-2 ${
                    idx === activeImage ? "border-neutral-900" : "border-transparent"
                  }`}
                >
                  <Image src={resolveMediaUrl(img.image)} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex w-full flex-col gap-3 p-5 md:w-1/2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wide text-neutral-500">
              {product.brand}
            </span>
            <h2 className="text-xl font-bold text-neutral-900">{product.name}</h2>
            <p className="mt-0.5 text-base font-semibold text-neutral-700">
              {unitPrice.toLocaleString("fr-FR")} {settings.currency}
            </p>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-neutral-500">
              Pointure
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sizes.map((s) => (
                <label key={s}>
                  <input
                    type="radio"
                    name="size"
                    value={s}
                    checked={size === s}
                    onChange={() => {
                      setSize(s);
                      setError("");
                    }}
                    className="peer hidden"
                  />
                  <span className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-neutral-200 text-sm font-semibold text-neutral-700 peer-checked:border-neutral-900 peer-checked:bg-neutral-900 peer-checked:text-white">
                    {s}
                  </span>
                </label>
              ))}
            </div>
            {error && <p className="mt-1.5 text-xs font-semibold text-red-600">{error}</p>}
          </div>

          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-neutral-500">
              Coffret
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setWithBox(true)}
                className={`flex-1 rounded-full border-2 px-3 py-2 text-sm font-semibold ${
                  withBox ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 text-neutral-700"
                }`}
              >
                Avec coffret
              </button>
              <button
                onClick={() => setWithBox(false)}
                className={`flex-1 rounded-full border-2 px-3 py-2 text-sm font-semibold ${
                  !withBox ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 text-neutral-700"
                }`}
              >
                Sans coffret (-{settings.box_discount.toLocaleString("fr-FR")})
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-neutral-500">
                Quantite
              </p>
              <div className="flex h-9 w-fit items-center rounded-full border-2 border-neutral-200 px-1">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-neutral-700 hover:bg-neutral-100"
                >
                  -
                </button>
                <span className="w-6 text-center text-sm font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-neutral-700 hover:bg-neutral-100"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-neutral-500">
                Couleur (optionnel)
              </label>
              <input
                type="text"
                value={colorNote}
                onChange={(e) => setColorNote(e.target.value)}
                placeholder="Ex : noir et blanc"
                className="w-full rounded-full border border-neutral-200 px-4 py-1.5 text-sm"
              />
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className="mt-1 flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-4 py-3 text-sm font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90"
          >
            Ajouter au panier
          </button>
        </div>
      </div>
    </div>
  );
}
