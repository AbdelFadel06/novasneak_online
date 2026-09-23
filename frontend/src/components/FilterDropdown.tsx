"use client";

import { useEffect, useRef, useState } from "react";

interface FilterDropdownProps {
  brands: string[];
  selectedBrands: string[];
  priceMax: number | null;
  minPrice: number;
  maxPrice: number;
  onChange: (brands: string[], priceMax: number | null) => void;
}

export default function FilterDropdown({
  brands,
  selectedBrands,
  priceMax,
  minPrice,
  maxPrice,
  onChange,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeCount = selectedBrands.length + (priceMax !== null ? 1 : 0);
  const hasActiveFilters = activeCount > 0;
  const sliderValue = priceMax ?? maxPrice;

  function toggleBrand(b: string) {
    const next = selectedBrands.includes(b)
      ? selectedBrands.filter((x) => x !== b)
      : [...selectedBrands, b];
    onChange(next, priceMax);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex h-10 items-center gap-2 rounded-full px-4 text-xs font-bold uppercase tracking-widest transition-colors ${
          hasActiveFilters
            ? "bg-neutral-900 text-white"
            : "bg-transparent text-neutral-900 hover:bg-neutral-900/5"
        }`}
      >
        <span className="text-sm leading-none">＋</span>
        Filtre
        {hasActiveFilters && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-neutral-900">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-3 w-80 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-neutral-900/10">
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-900">
              Filtrer
            </span>
            {hasActiveFilters && (
              <button
                onClick={() => onChange([], null)}
                className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 hover:text-neutral-900"
              >
                Reinitialiser
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
            <div className="mb-6">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                Marque
              </p>
              <div className="flex flex-wrap gap-2">
                {brands.map((b) => {
                  const selected = selectedBrands.includes(b);
                  return (
                    <button
                      key={b}
                      onClick={() => toggleBrand(b)}
                      className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                        selected
                          ? "border-neutral-900 bg-neutral-900 text-white"
                          : "border-neutral-200 text-neutral-700 hover:border-neutral-400"
                      }`}
                    >
                      {b}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                <span>Budget max</span>
                <span className="text-neutral-900">
                  {priceMax === null ? "Illimite" : `${sliderValue.toLocaleString("fr-FR")}`}
                </span>
              </p>
              <input
                type="range"
                min={minPrice}
                max={maxPrice}
                step={1000}
                value={sliderValue}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  onChange(selectedBrands, value === maxPrice ? null : value);
                }}
                className="w-full accent-neutral-900"
              />
              <div className="mt-1 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                <span>{minPrice.toLocaleString("fr-FR")}</span>
                <span>{maxPrice.toLocaleString("fr-FR")}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
