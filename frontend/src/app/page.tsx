"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fetchProducts, fetchSettings } from "@/lib/api";
import { Product, StoreSettings } from "@/lib/types";
import { useCartStore } from "@/lib/cart-store";
import ProductGrid from "@/components/ProductGrid";
import ProductGridSkeleton from "@/components/ProductGridSkeleton";
import FilterDropdown from "@/components/FilterDropdown";
import ProductModal from "@/components/ProductModal";
import CartDrawer from "@/components/CartDrawer";
import {
  CartIcon,
  CloseIcon,
  InstagramIcon,
  SearchIcon,
  TikTokIcon,
  WhatsAppIcon,
} from "@/components/icons";

const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/novasneak.shop.bj",
  tiktok: "https://www.tiktok.com/@novasneak.shop.bj",
  whatsapp: "https://wa.me/message/E6ZBK3RS73RAJ1",
};

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
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const cartTotalItems = useCartStore((s) => s.totalItems());
  const [reloadKey, setReloadKey] = useState(0);

  // Wait for the user to pause typing before hitting the API, so every
  // keystroke doesn't fire a request.
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  function closeSearch() {
    setSearchOpen(false);
    setSearch("");
  }

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
  const hasActiveFilter = selectedBrands.length > 0 || priceMax !== null || debouncedSearch !== "";

  useEffect(() => {
    if (!hasActiveFilter) return;
    const controller = new AbortController();
    withRetry(
      () =>
        fetchProducts(
          {
            brands: selectedBrands.length ? selectedBrands : undefined,
            price_max: priceMax ?? undefined,
            search: debouncedSearch || undefined,
          },
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
  }, [selectedBrands, priceMax, debouncedSearch, hasActiveFilter]);

  // No filter active -> always show the full, already-loaded catalogue
  // (never stale). A filter is active -> show its result, falling back to
  // the full list while that fetch is still in flight.
  const displayedProducts = hasActiveFilter ? filteredProducts ?? allProducts : allProducts;

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
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-surface/90 px-6 py-5 backdrop-blur md:px-10">
        {searchOpen ? (
          <div className="flex flex-1 items-center gap-2">
            <SearchIcon className="h-4 w-4 shrink-0 text-neutral-400" />
            <input
              ref={searchInputRef}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou marque..."
              aria-label="Rechercher un produit par nom ou marque"
              className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
            />
            <button
              onClick={closeSearch}
              aria-label="Fermer la recherche"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-900/5"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <h1 className="text-lg font-bold uppercase tracking-tight text-neutral-900">
            {settings?.store_name || "NovaSneak"}
          </h1>
        )}

        {!searchOpen && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Rechercher un produit"
              className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-900 transition-colors hover:bg-neutral-900/5"
            >
              <SearchIcon className="h-4 w-4" />
            </button>
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
          </div>
        )}
      </header>

      <div className="relative overflow-hidden px-6 pb-2 pt-4 md:px-10">
        <span className="pointer-events-none absolute right-6 top-2 select-none text-[13vw] font-bold uppercase leading-none tracking-tight text-neutral-900/5 md:text-7xl">
          Fall Selection
        </span>
        <h2 className="relative text-5xl font-bold uppercase tracking-tight text-neutral-900 md:text-6xl">
          Sneakers
        </h2>
        <p className="relative mt-2 max-w-xl text-sm text-neutral-500">
          Vente de sneakers et baskets a Cotonou et Calavi, livraison partout au Benin.
          Commande directe via WhatsApp.
        </p>
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

      <footer className="border-t border-neutral-200 px-6 py-8 md:px-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-md">
            <p className="text-xs text-neutral-500">
              NovaSneak - Vente en ligne de sneakers et baskets, livraison a Cotonou, Calavi
              et partout au Benin. Nike, Adidas, New Balance, Jordan, Puma, Converse.
            </p>
            <p className="mt-1 text-[11px] text-neutral-400">
              Points de retrait : Missebo &amp; Akpakpa (Cotonou)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="NovaSneak sur Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition-colors hover:border-neutral-900 hover:text-neutral-900"
            >
              <InstagramIcon className="h-4 w-4" />
            </a>
            <a
              href={SOCIAL_LINKS.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="NovaSneak sur TikTok"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition-colors hover:border-neutral-900 hover:text-neutral-900"
            >
              <TikTokIcon className="h-4 w-4" />
            </a>
            <a
              href={SOCIAL_LINKS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="NovaSneak sur WhatsApp"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition-colors hover:border-neutral-900 hover:text-neutral-900"
            >
              <WhatsAppIcon className="h-4 w-4" />
            </a>
          </div>
        </div>
      </footer>

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
