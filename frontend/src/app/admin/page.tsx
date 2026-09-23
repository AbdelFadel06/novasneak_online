"use client";

import { useEffect, useState } from "react";
import { fetchStats } from "@/lib/adminApi";
import { AdminStats } from "@/lib/types";
import DatePicker from "@/components/admin/DatePicker";

const umamiUrl = (process.env.NEXT_PUBLIC_UMAMI_SRC || "http://localhost:3001/script.js").replace(
  /\/script\.js$/,
  ""
);

const PERIODS = [
  { days: 7, label: "7 jours" },
  { days: 14, label: "14 jours" },
  { days: 30, label: "30 jours" },
  { days: 90, label: "90 jours" },
];

const todayStr = new Date().toISOString().slice(0, 10);

function formatRangeLabel(start: string, end: string) {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const s = new Date(start + "T00:00:00").toLocaleDateString("fr-FR", opts);
  const e = new Date(end + "T00:00:00").toLocaleDateString("fr-FR", opts);
  return start === end ? s : `${s} - ${e}`;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState("");
  const [preset, setPreset] = useState(7);
  const [customRange, setCustomRange] = useState({ start: "", end: "" });

  const hasCustomRange = !!customRange.start && !!customRange.end;
  const rangeInvalid = hasCustomRange && customRange.start > customRange.end;

  useEffect(() => {
    if (hasCustomRange && rangeInvalid) return;
    const range = hasCustomRange
      ? { start: customRange.start, end: customRange.end }
      : { days: preset };
    fetchStats(range)
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur de chargement."));
  }, [preset, hasCustomRange, rangeInvalid, customRange.start, customRange.end]);

  const maxDailyRevenue = stats
    ? Math.max(1, ...stats.period.daily.map((d) => d.revenue))
    : 1;

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold uppercase tracking-tight">Tableau de bord</h1>
        <a
          href={umamiUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block w-fit rounded-full border-2 border-neutral-900 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-neutral-900 hover:text-white"
        >
          Statistiques de trafic (Umami) ↗
        </a>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {stats && (
        <>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-neutral-400">
            Aujourd&apos;hui
          </p>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            <StatCard label="Commandes aujourd'hui" value={stats.orders_today} />
            <StatCard
              label="CA aujourd'hui"
              value={`${stats.revenue_today.toLocaleString("fr-FR")} FCFA`}
            />
            <StatCard label="Commandes au total" value={stats.orders_total} />
            <StatCard
              label="CA total"
              value={`${stats.revenue_total.toLocaleString("fr-FR")} FCFA`}
            />
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            <StatCard
              label="Produits actifs"
              value={`${stats.products_active} / ${stats.products_total}`}
            />
          </div>

          <div className="mb-4 flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
              Sur une periode
            </p>
            <div className="flex flex-wrap gap-2">
              {PERIODS.map((p) => (
                <button
                  key={p.days}
                  onClick={() => {
                    setPreset(p.days);
                    setCustomRange({ start: "", end: "" });
                  }}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                    preset === p.days && !hasCustomRange
                      ? "bg-neutral-900 text-white"
                      : "border border-neutral-200 text-neutral-600 hover:border-neutral-400"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-neutral-500">Du</span>
              <DatePicker
                value={customRange.start}
                max={customRange.end || todayStr}
                onChange={(v) => setCustomRange((prev) => ({ ...prev, start: v }))}
              />
              <span className="text-xs font-semibold text-neutral-500">Au</span>
              <DatePicker
                value={customRange.end}
                min={customRange.start}
                max={todayStr}
                onChange={(v) => setCustomRange((prev) => ({ ...prev, end: v }))}
              />
              {hasCustomRange && (
                <button
                  onClick={() => setCustomRange({ start: "", end: "" })}
                  className="text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-neutral-900"
                >
                  Reinitialiser
                </button>
              )}
            </div>
            {rangeInvalid && (
              <p className="text-xs font-semibold text-red-600">
                La date de debut doit preceder la date de fin.
              </p>
            )}
          </div>

          {!rangeInvalid && (
            <>
              <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <StatCard
                  label={`Commandes (${formatRangeLabel(stats.period.start, stats.period.end)})`}
                  value={stats.period.orders}
                />
                <StatCard
                  label={`CA (${formatRangeLabel(stats.period.start, stats.period.end)})`}
                  value={`${stats.period.revenue.toLocaleString("fr-FR")} FCFA`}
                />
              </div>

              <div className="mb-8 rounded-2xl bg-white p-6 ring-1 ring-neutral-900/10">
                <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-neutral-400">
                  Detail par jour
                </h2>
                {stats.period.daily.every((d) => d.orders === 0) ? (
                  <p className="text-sm text-neutral-500">Aucune commande sur cette periode.</p>
                ) : (
                  <ul className="flex max-h-96 flex-col gap-2.5 overflow-y-auto">
                    {stats.period.daily.map((d) => (
                      <li key={d.date} className="flex items-center gap-3 text-sm">
                        <span className="w-16 flex-shrink-0 text-xs font-semibold text-neutral-500">
                          {new Date(d.date + "T00:00:00").toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                          <span
                            className="block h-full rounded-full bg-neutral-900"
                            style={{ width: `${(d.revenue / maxDailyRevenue) * 100}%` }}
                          />
                        </span>
                        <span className="w-28 flex-shrink-0 text-right text-xs font-semibold text-neutral-700">
                          {d.revenue.toLocaleString("fr-FR")} FCFA
                        </span>
                        <span className="w-16 flex-shrink-0 text-right text-xs text-neutral-400">
                          {d.orders} cmd.
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

          <div className="rounded-2xl bg-white p-6 ring-1 ring-neutral-900/10">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-neutral-400">
              Produits les plus commandes
            </h2>
            {stats.top_products.length === 0 ? (
              <p className="text-sm text-neutral-500">Pas encore de commande.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {stats.top_products.map((p, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="font-semibold">
                      {p.brand} {p.name}
                    </span>
                    <span className="text-neutral-500">{p.total_quantity} vendus</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-900/10">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-neutral-400">
        {label}
      </p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
