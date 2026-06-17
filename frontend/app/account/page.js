"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const emptyAddress = {
  fullName: "",
  address: "",
  city: "",
  postalCode: "",
  country: "",
  phone: "",
};

export default function AccountPage() {
  const { user, loading, updateProfile } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [notifyEmail, setNotifyEmail] = useState("");
  const [address, setAddress] = useState(emptyAddress);
  const [status, setStatus] = useState(""); // "", "saved", error message
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login?redirect=/account");
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setNotifyEmail(user.notificationEmail || user.email || "");
      setAddress({ ...emptyAddress, ...(user.savedAddress || {}) });
    }
  }, [user]);

  if (loading || !user)
    return <div className="max-w-2xl mx-auto px-4 py-20">Loading…</div>;

  const set = (k, v) => setAddress((a) => ({ ...a, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    setStatus("");
    setBusy(true);
    try {
      await updateProfile({ name, notificationEmail: notifyEmail, savedAddress: address });
      setStatus("saved");
      setTimeout(() => setStatus(""), 2500);
    } catch (err) {
      setStatus(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="font-serif text-4xl mb-2">My Account</h1>
      <p className="text-sm text-black/60 mb-8">
        Signed in as <strong>{user.email}</strong> ·{" "}
        <Link href="/orders" className="text-accent hover:underline">
          View orders
        </Link>
      </p>

      {status === "saved" && (
        <div className="mb-4 text-sm bg-green-50 text-green-800 px-4 py-2 rounded">
          Your details have been saved.
        </div>
      )}
      {status && status !== "saved" && (
        <div className="mb-4 text-sm bg-red-50 text-red-700 px-4 py-2 rounded">{status}</div>
      )}

      <form onSubmit={save} className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input className="acc-input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1">Order confirmation email</label>
            <input
              type="email"
              className="acc-input"
              value={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.value)}
            />
            <p className="text-xs text-black/50 mt-1">
              Where we send order details. Your login email ({user.email}) stays the same.
            </p>
          </div>
        </div>

        <div>
          <h2 className="font-serif text-xl mb-3">Default shipping address</h2>
          <p className="text-sm text-black/50 mb-4">
            We'll use this to pre-fill your details at checkout.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <input className="acc-input" placeholder="Full name" value={address.fullName}
              onChange={(e) => set("fullName", e.target.value)} />
            <input className="acc-input" placeholder="Phone" value={address.phone}
              onChange={(e) => set("phone", e.target.value)} />
            <input className="acc-input sm:col-span-2" placeholder="Address" value={address.address}
              onChange={(e) => set("address", e.target.value)} />
            <input className="acc-input" placeholder="City" value={address.city}
              onChange={(e) => set("city", e.target.value)} />
            <input className="acc-input" placeholder="Postal code" value={address.postalCode}
              onChange={(e) => set("postalCode", e.target.value)} />
            <input className="acc-input sm:col-span-2" placeholder="Country" value={address.country}
              onChange={(e) => set("country", e.target.value)} />
          </div>
        </div>

        <button disabled={busy}
          className="bg-ink text-white px-6 py-3 text-sm tracking-wide hover:bg-accent transition disabled:opacity-50">
          {busy ? "Saving…" : "Save changes"}
        </button>
      </form>

      <style jsx global>{`
        .acc-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid rgba(0, 0, 0, 0.15);
          border-radius: 0.375rem;
          background: #fff;
          font-size: 0.95rem;
        }
      `}</style>
    </div>
  );
}
