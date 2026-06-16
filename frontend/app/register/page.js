"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

function RegisterInner() {
  const { register } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/";
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(form.name, form.email, form.password);
      router.push(redirect);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="font-serif text-4xl mb-2">Create account</h1>
      <p className="text-black/60 mb-8 text-sm">Join LUXE in a few seconds.</p>
      {error && (
        <div className="mb-4 text-sm bg-red-50 text-red-700 px-4 py-2 rounded">{error}</div>
      )}
      <form onSubmit={submit} className="space-y-4">
        <input
          required
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-4 py-3 border border-black/15 rounded-md bg-white"
        />
        <input
          type="email"
          required
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full px-4 py-3 border border-black/15 rounded-md bg-white"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Password (min 6 chars)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full px-4 py-3 border border-black/15 rounded-md bg-white"
        />
        <button
          disabled={busy}
          className="w-full bg-ink text-white py-3 text-sm tracking-wide hover:bg-accent transition disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-sm text-black/60">
        Already have an account?{" "}
        <Link href={`/login?redirect=${redirect}`} className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-16">Loading…</div>}>
      <RegisterInner />
    </Suspense>
  );
}
