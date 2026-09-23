"use client";

import { useEffect, useState, type FormEvent } from "react";
import { fetchAdminSettings, updateAdminSettings } from "@/lib/adminApi";
import { StoreSettings } from "@/lib/types";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAdminSettings()
      .then(setSettings)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur de chargement."));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateAdminSettings(settings);
      setSettings(updated);
      setMessage("Parametres enregistres.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  if (error && !settings) return <p className="text-sm text-red-600">{error}</p>;
  if (!settings) return <p className="text-sm text-neutral-500">Chargement...</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold uppercase tracking-tight">
        Parametres de la boutique
      </h1>
      <form onSubmit={handleSubmit} className="max-w-xl">
        <Field
          label="Nom de la boutique"
          value={settings.store_name}
          onChange={(v) => setSettings({ ...settings, store_name: v })}
        />
        <Field
          label="Numero WhatsApp (format international, sans +)"
          value={settings.whatsapp_number}
          onChange={(v) => setSettings({ ...settings, whatsapp_number: v })}
        />
        <Field
          label="Devise"
          value={settings.currency}
          onChange={(v) => setSettings({ ...settings, currency: v })}
        />

        <div className="mb-5">
          <NumField
            label="Remise sans coffret"
            value={settings.box_discount}
            onChange={(v) => setSettings({ ...settings, box_discount: v })}
          />
        </div>

        <div className="mb-5 grid grid-cols-2 gap-4">
          <NumField
            label="Pointure minimum"
            value={settings.size_min}
            onChange={(v) => setSettings({ ...settings, size_min: v })}
          />
          <NumField
            label="Pointure maximum"
            value={settings.size_max}
            onChange={(v) => setSettings({ ...settings, size_max: v })}
          />
        </div>

        {message && <p className="mb-4 text-xs font-semibold text-green-600">{message}</p>}
        {error && <p className="mb-4 text-xs font-semibold text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-5">
      <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-neutral-400">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-full border border-neutral-200 px-4 py-2 text-sm"
      />
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-neutral-400">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-full border border-neutral-200 px-4 py-2 text-sm"
      />
    </div>
  );
}
