"use client";

import { useEffect, useState } from "react";
import { fetchOrders } from "@/lib/adminApi";
import { Order } from "@/lib/types";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrders()
      .then(setOrders)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur de chargement."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold uppercase tracking-tight">Commandes</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-neutral-500">Chargement...</p>}
      {!loading && !error && orders.length === 0 && (
        <p className="text-sm text-neutral-500">Aucune commande pour le moment.</p>
      )}
      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <div key={order.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-900/10">
            <div className="flex flex-col gap-1 border-b border-neutral-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-bold">Commande #{order.id}</span>
              <span className="text-xs text-neutral-500">
                {new Date(order.created_at).toLocaleString("fr-FR")}
              </span>
            </div>

            <ul className="divide-y divide-neutral-50 px-5">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-start gap-3 py-3">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-neutral-900" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-900">
                      {item.brand} {item.name}
                      {item.quantity > 1 && (
                        <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-bold text-neutral-600">
                          x{item.quantity}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      Pointure {item.size} · {item.with_box ? "Avec coffret" : "Sans coffret"}
                      {item.color_note && ` · ${item.color_note}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between bg-neutral-50 px-5 py-3">
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                Total
              </span>
              <span className="text-sm font-bold">
                {order.total.toLocaleString("fr-FR")} {order.currency}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
