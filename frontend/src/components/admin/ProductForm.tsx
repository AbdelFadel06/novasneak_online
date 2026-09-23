"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  createProduct,
  deleteProductImage,
  updateProduct,
  uploadProductImage,
  type ProductInput,
} from "@/lib/adminApi";
import { resolveMediaUrl } from "@/lib/api";
import { Product, ProductImage } from "@/lib/types";

interface ProductFormProps {
  product?: Product;
}

export default function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!product;
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [active, setActive] = useState(product?.active ?? true);
  const [images, setImages] = useState<ProductImage[]>(product?.images ?? []);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const input: ProductInput = { brand, name, price: Number(price), active };
    try {
      if (isEdit) {
        await updateProduct(product.id, input);
        router.push("/admin/products");
      } else {
        const created = await createProduct(input);
        router.push(`/admin/products/${created.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    if (!product || !e.target.files?.length) return;
    setUploading(true);
    setError("");
    try {
      for (const file of Array.from(e.target.files)) {
        const img = await uploadProductImage(product.id, file, images.length);
        setImages((prev) => [...prev, img]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleImageDelete(imageId: number) {
    await deleteProductImage(imageId);
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl">
      <div className="mb-5">
        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-neutral-400">
          Marque
        </label>
        <input
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          required
          className="w-full rounded-full border border-neutral-200 px-4 py-2 text-sm"
        />
      </div>

      <div className="mb-5">
        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-neutral-400">
          Nom
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-full border border-neutral-200 px-4 py-2 text-sm"
        />
      </div>

      <div className="mb-5">
        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-neutral-400">
          Prix (avec coffret)
        </label>
        <input
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          className="w-full rounded-full border border-neutral-200 px-4 py-2 text-sm"
        />
      </div>

      <label className="mb-6 flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Actif (visible sur le site)
      </label>

      {isEdit ? (
        <div className="mb-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-neutral-400">
            Images
          </p>
          <div className="flex flex-wrap gap-3">
            {images.map((img) => (
              <div key={img.id} className="relative h-20 w-20 overflow-hidden rounded-lg bg-card">
                <Image src={resolveMediaUrl(img.image)} alt="" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => handleImageDelete(img.id)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-[10px] text-white"
                >
                  x
                </button>
              </div>
            ))}
            <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 text-xs font-bold text-neutral-400 hover:border-neutral-500">
              {uploading ? "..." : "+"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
          </div>
        </div>
      ) : (
        <p className="mb-6 text-xs text-neutral-500">
          Enregistrez d&apos;abord le produit pour pouvoir ajouter des images.
        </p>
      )}

      {error && <p className="mb-4 text-xs font-semibold text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
