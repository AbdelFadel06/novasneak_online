"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchProducts, fetchSettings } from "@/lib/api";
import { Product, StoreSettings } from "@/lib/types";
import { useCartStore } from "@/lib/cart-store";
import ProductGrid from "@/components/ProductGrid";
import ProductGridSkeleton from "@/components/ProductGridSkeleton";
import FilterDropdown from "@/components/FilterDropdown";
import ProductModal from "@/components/ProductModal";
import CartDrawer from "@/components/CartDrawer";
import { CartIcon } from "@/components/icons";

// docker compose up can take 15-20s before the backend actually answers
// requests (waiting on the db healthcheck, migrations, collectstatic...).
// Retry patiently over ~30s, silently, before bothering the user with an
// error screen — covers a cold start with margin.
async function withRetry<T>(
  fn: () => Promise<T>,
  signal: AbortSignal,
  retries = 20,
  delayMs = 1500
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (signal.aborted || retries <= 0) throw err;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    if (signal.aborted) throw err;
    return withRetry(fn, signal, retries - 1, delayMs);
  }
}

export default function HomePage() {
  // Unfiltered catalogue, fetched once: source of truth for available brands
  // and the price range, so those don't shrink to match the active filter.
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[] | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const cartTotalItems = useCartStore((s) => s.totalItems());
  const [reloadKey, setReloadKey] = useState(0);

  // The cart is persisted to localStorage, which the server can't see, so
  // the first client render must match the server's empty-cart output. Only
  // read the real count after mount, once hydration has settled.
  const [mounted, setMounted] = useState(false);
  // Standard one-shot "has this mounted on the client yet" flag: the
  // documented way to defer client-only state (localStorage-backed Zustand
  // here) past the first hydration pass.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  const totalItems = mounted ? cartTotalItems : 0;

  useEffect(() => {
    const controller = new AbortController();
    withRetry(
      () =>
        Promise.all([
          fetchSettings(controller.signal),
          fetchProducts({}, controller.signal),
        ]),
      controller.signal
    )
      .then(([settingsData, productsData]) => {
        setSettings(settingsData);
        setAllProducts(productsData);
        setError("");
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("Impossible de charger la boutique. Reessayez.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reloadKey]);

  // Re-fetch the filtered view whenever brand/price actually change. Skipping
  // when no filter is active means this never fires on mount (the effect
  // above already loads the unfiltered list) and can't race with, or clobber
  // the error state of, the initial load — a plain function of current
  // filter state, so it's immune to React's dev-mode double effect
  // invocation (unlike the earlier "first run" ref, which broke under it).
  useEffect(() => {
    if (selectedBrands.length === 0 && priceMax === null) return;
    const controller = new AbortController();
    withRetry(
      () =>
        fetchProducts(
          { brands: selectedBrands.length ? selectedBrands : undefined, price_max: priceMax ?? undefined },
          controller.signal
        ),
      controller.signal
    )
      .then(setFilteredProducts)
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("Impossible de charger les produits.");
      });
    return () => controller.abort();
  }, [selectedBrands, priceMax]);

  // No filter active -> always show the full, already-loaded catalogue
  // (never stale). A filter is active -> show its result, falling back to
  // the full list while that fetch is still in flight.
  const displayedProducts =
    selectedBrands.length === 0 && priceMax === null ? allProducts : filteredProducts ?? allProducts;

  const brands = useMemo(
    () => Array.from(new Set(allProducts.map((p) => p.brand))).sort(),
    [allProducts]
  );
  const priceBounds = useMemo(() => {
    if (allProducts.length === 0) return { min: 0, max: 100000 };
    const prices = allProducts.map((p) => p.price);
    return {
      min: Math.floor(Math.min(...prices) / 1000) * 1000,
      max: Math.ceil(Math.max(...prices) / 1000) * 1000,
    };
  }, [allProducts]);

  return (
    <main className="min-h-screen bg-surface">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-surface/90 px-6 py-5 backdrop-blur md:px-10">
        <h1 className="text-lg font-bold uppercase tracking-tight text-neutral-900">
          {settings?.store_name || "NovaSneak"}
        </h1>
        <button
          onClick={() => setCartOpen(true)}
          className="relative flex h-10 items-center gap-2 rounded-full bg-neutral-900 pl-4 pr-5 text-xs font-bold uppercase tracking-widest text-white"
        >
          <CartIcon className="h-4 w-4" />
          Panier
          {totalItems > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-neutral-900">
              {totalItems}
            </span>
          )}
        </button>
      </header>

      <div className="relative overflow-hidden px-6 pb-2 pt-4 md:px-10">
        <span className="pointer-events-none absolute right-6 top-2 select-none text-[13vw] font-bold uppercase leading-none tracking-tight text-neutral-900/5 md:text-7xl">
          Fall Selection
        </span>
        <h2 className="relative text-5xl font-bold uppercase tracking-tight text-neutral-900 md:text-6xl">
          Sneakers
        </h2>
      </div>

      <div className="flex items-start gap-4 px-6 pb-8 pt-4 md:px-10">
        <div className="hidden shrink-0 pt-1 md:block">
          <div className="flex -rotate-90 items-center gap-2 whitespace-nowrap text-xs font-bold uppercase tracking-widest text-neutral-400">
            Filter
          </div>
        </div>

        <div className="flex-1">
          <div className="mb-6 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
              {loading
                ? " "
                : `${displayedProducts.length} paire${displayedProducts.length > 1 ? "s" : ""}`}
            </span>
            <FilterDropdown
              brands={brands}
              selectedBrands={selectedBrands}
              priceMax={priceMax}
              minPrice={priceBounds.min}
              maxPrice={priceBounds.max}
              onChange={(b, p) => {
                setSelectedBrands(b);
                setPriceMax(p);
              }}
            />
          </div>

          {loading && <ProductGridSkeleton />}
          {error && (
            <div className="flex flex-col items-start gap-3 text-red-600">
              <p>{error}</p>
              <button
                onClick={() => {
                  setLoading(true);
                  setError("");
                  setReloadKey((k) => k + 1);
                }}
                className="rounded-full border-2 border-red-600 px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
              >
                Reessayer
              </button>
            </div>
          )}
          {!loading && !error && settings && (
            <ProductGrid products={displayedProducts} currency={settings.currency} onSelect={setSelectedProduct} />
          )}
        </div>
      </div>

      {selectedProduct && settings && (
        <ProductModal
          product={selectedProduct}
          settings={settings}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {cartOpen && settings && <CartDrawer settings={settings} onClose={() => setCartOpen(false)} />}
    </main>
  );
}
