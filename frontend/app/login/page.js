"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

function LoginInner() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/";
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(form.email, form.password);
      router.push(redirect);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="font-serif text-4xl mb-2">Sign in</h1>
      <p className="text-black/60 mb-8 text-sm">
        Welcome back. Demo: customer@luxe.test / customer123
      </p>
      {error && (
        <div className="mb-4 text-sm bg-red-50 text-red-700 px-4 py-2 rounded">{error}</div>
      )}
      <form onSubmit={submit} className="space-y-4">
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
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full px-4 py-3 border border-black/15 rounded-md bg-white"
        />
        <button
          disabled={busy}
          className="w-full bg-ink text-white py-3 text-sm tracking-wide hover:bg-accent transition disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-sm text-black/60">
        New here?{" "}
        <Link href={`/register?redirect=${redirect}`} className="text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-16">Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}
