"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/adminApi";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl ring-1 ring-neutral-900/10"
      >
        <h1 className="mb-1 text-xl font-bold uppercase tracking-tight">NovaSneak</h1>
        <p className="mb-6 text-sm text-neutral-500">Administration</p>

        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-neutral-400">
          Nom d&apos;utilisateur
        </label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mb-4 w-full rounded-full border border-neutral-200 px-4 py-2 text-sm"
          autoFocus
        />

        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-neutral-400">
          Mot de passe
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-full border border-neutral-200 px-4 py-2 text-sm"
        />

        {error && <p className="mb-4 text-xs font-semibold text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-neutral-900 px-4 py-3 text-sm font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
