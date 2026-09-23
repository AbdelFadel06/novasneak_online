"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchAdminProducts, updateProduct, deleteProduct } from "@/lib/adminApi";
import { resolveMediaUrl } from "@/lib/api";
import { Product } from "@/lib/types";
import { EditIcon, TrashIcon } from "@/components/admin/icons";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  function load() {
    fetchAdminProducts()
      .then(setProducts)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur de chargement."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function toggleActive(p: Product) {
    await updateProduct(p.id, { active: !p.active });
    load();
  }

  async function confirmDelete() {
    if (!productToDelete) return;
    setDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
      setProductToDelete(null);
      load();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold uppercase tracking-tight">Produits</h1>
        <Link
          href="/admin/products/new"
          className="inline-block w-fit rounded-full bg-neutral-900 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:opacity-90"
        >
          + Ajouter un produit
        </Link>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-neutral-500">Chargement...</p>}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-neutral-900/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                <th className="px-5 py-3"></th>
                <th className="px-5 py-3">Marque</th>
                <th className="px-5 py-3">Nom</th>
                <th className="px-5 py-3">Prix</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-neutral-50 last:border-0">
                  <td className="px-5 py-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-card">
                      {p.images[0] && (
                        <Image
                          src={resolveMediaUrl(p.images[0].image)}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 font-semibold">{p.brand}</td>
                  <td className="px-5 py-3">
                    <Link href={`/admin/products/${p.id}`} className="hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3">{p.price.toLocaleString("fr-FR")}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => toggleActive(p)}
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                        p.active
                          ? "bg-green-100 text-green-700"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {p.active ? "Actif" : "Inactif"}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/products/${p.id}`}
                        aria-label={`Modifier ${p.brand} ${p.name}`}
                        title="Modifier"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                      >
                        <EditIcon className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => setProductToDelete(p)}
                        aria-label={`Supprimer ${p.brand} ${p.name}`}
                        title="Supprimer"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-neutral-500">
                    Aucun produit pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!productToDelete}
        title="Supprimer ce produit ?"
        message={
          productToDelete
            ? `"${productToDelete.brand} ${productToDelete.name}" sera definitivement supprime, avec ses images. Cette action est irreversible.`
            : ""
        }
        confirmLabel="Supprimer"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setProductToDelete(null)}
      />
    </div>
  );
}
