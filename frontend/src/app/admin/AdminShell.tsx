"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { logout } from "@/lib/adminApi";
import {
  DashboardIcon,
  LogoutIcon,
  MenuIcon,
  OrdersIcon,
  ProductsIcon,
  SettingsIcon,
} from "@/components/admin/icons";

const navItems = [
  { href: "/admin", label: "Tableau de bord", icon: DashboardIcon },
  { href: "/admin/products", label: "Produits", icon: ProductsIcon },
  { href: "/admin/orders", label: "Commandes", icon: OrdersIcon },
  { href: "/admin/settings", label: "Parametres", icon: SettingsIcon },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const username = useAuthStore((s) => s.username);

  // Zustand's persisted store only rehydrates from localStorage on the
  // client, after the first render — gate the auth check on mount so we
  // never redirect based on a still-empty store during hydration. Same
  // mount-gate also picks a sensible sidebar default: open on desktop,
  // closed on narrow screens (so it doesn't eat the whole viewport).
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (window.matchMedia("(max-width: 767px)").matches) {
      setSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    if (mounted && !accessToken && pathname !== "/admin/login") {
      router.replace("/admin/login");
    }
  }, [mounted, accessToken, pathname, router]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!mounted || !accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-sm text-neutral-500">
        Chargement...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex-shrink-0 border-r border-neutral-200 bg-white transition-all duration-200 md:sticky md:top-0 md:h-screen ${
          sidebarOpen
            ? "w-64 translate-x-0"
            : "w-64 -translate-x-full md:w-0 md:translate-x-0 md:overflow-hidden md:border-r-0"
        }`}
      >
        <div className="flex h-full w-64 flex-col px-4 py-6">
          <div className="mb-8 flex items-center justify-between px-2">
            <span className="text-lg font-bold uppercase tracking-tight">NovaSneak</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 md:hidden"
              aria-label="Fermer le menu"
            >
              <MenuIcon open className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (window.matchMedia("(max-width: 767px)").matches) setSidebarOpen(false);
                  }}
                  className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto flex flex-col gap-3 px-2 pt-6">
            <span className="truncate text-xs text-neutral-400">Connecte en tant que {username}</span>
            <button
              onClick={() => {
                logout();
                router.replace("/admin/login");
              }}
              className="flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              <LogoutIcon className="h-[18px] w-[18px] flex-shrink-0" />
              Deconnexion
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-neutral-200 bg-white/80 px-4 py-3 backdrop-blur">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-700 hover:bg-neutral-100"
            aria-label={sidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            <MenuIcon open={sidebarOpen} className="h-5 w-5" />
          </button>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 md:hidden">
            NovaSneak
          </span>
        </header>
        <main className="flex-1">
          <div className="mx-auto w-full max-w-6xl p-6 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
