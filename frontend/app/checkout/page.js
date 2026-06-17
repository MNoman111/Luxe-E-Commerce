"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import api from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { currency } from "@/lib/format";
import VoucherInput from "@/components/VoucherInput";
import StripeForm from "./StripeForm";

const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = pk ? loadStripe(pk) : null;

export default function CheckoutPage() {
  const { items, subtotal, discount, voucher, clear, ready } = useCart();
  const { user, loading, updateProfile } = useAuth();
  const router = useRouter();

  const [guestEmail, setGuestEmail] = useState("");
  const [address, setAddress] = useState({
    fullName: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    phone: "",
  });
  const [saveAddress, setSaveAddress] = useState(false);
  const [method, setMethod] = useState("Stripe");
  const [stage, setStage] = useState("form"); // form | pay
  const [order, setOrder] = useState(null);
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const shipping = subtotal >= 100 || subtotal === 0 ? 0 : 9.99;
  const tax = useMemo(
    () => +((subtotal - discount) * 0.08).toFixed(2),
    [subtotal, discount]
  );
  const total = +(subtotal - discount + shipping + tax).toFixed(2);

  useEffect(() => {
    // Only bounce to the cart if it's empty AND no order has been placed yet —
    // otherwise clearing the cart after checkout would hijack the redirect.
    if (ready && items.length === 0 && stage === "form" && !order)
      router.push("/cart");
  }, [ready, items, stage, order, router]);

  // Pre-fill from the user's saved address (only fills fields left blank).
  useEffect(() => {
    if (!user?.savedAddress) return;
    setAddress((prev) => {
      const next = { ...prev };
      ["fullName", "address", "city", "postalCode", "country", "phone"].forEach(
        (k) => {
          if (!next[k] && user.savedAddress[k]) next[k] = user.savedAddress[k];
        }
      );
      return next;
    });
  }, [user]);

  const persistAddressIfRequested = async () => {
    if (user && saveAddress) {
      try {
        await updateProfile({ savedAddress: address });
      } catch (err) {
        console.error("Could not save address:", err.message);
      }
    }
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const created = await api.createOrder({
        orderItems: items.map((i) => ({
          product: i.product,
          qty: i.qty,
          size: i.size,
        })),
        shippingAddress: address,
        paymentMethod: method,
        voucherCode: user && voucher ? voucher.code : undefined,
        guestEmail: user ? undefined : guestEmail,
      });
      setOrder(created);
      await persistAddressIfRequested();

      if (method === "COD") {
        clear();
        router.push(`/orders/${created._id}?placed=1`);
        return;
      }

      const intent = await api.createPaymentIntent(created._id);
      setClientSecret(intent.clientSecret);
      setStage("pay");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handlePaid = async (result) => {
    await api.markPaid(order._id, result);
    clear();
    router.push(`/orders/${order._id}?placed=1`);
  };

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-20">Loading…</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="font-serif text-4xl mb-2">Checkout</h1>
      {!user && (
        <p className="text-sm text-black/60 mb-6">
          Checking out as a guest.{" "}
          <Link href="/login?redirect=/checkout" className="text-accent hover:underline">
            Sign in
          </Link>{" "}
          to save your order history.
        </p>
      )}
      {error && (
        <div className="mb-6 text-sm bg-red-50 text-red-700 px-4 py-2 rounded">{error}</div>
      )}

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          {stage === "form" ? (
            <form onSubmit={placeOrder} className="space-y-8">
              <section>
                <h2 className="font-serif text-xl mb-4">Contact</h2>
                {user ? (
                  <p className="text-sm text-black/70 bg-black/[0.03] border border-black/10 rounded-md px-4 py-3">
                    Your order confirmation will be sent to{" "}
                    <strong>{user.email}</strong>.
                  </p>
                ) : (
                  <input
                    type="email"
                    required
                    placeholder="Email address (for your order confirmation)"
                    className="input"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                  />
                )}
              </section>

              <section>
                <h2 className="font-serif text-xl mb-4">Shipping address</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input required placeholder="Full name" className="input"
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })} />
                  <input required placeholder="Phone" className="input"
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })} />
                  <input required placeholder="Address" className="input sm:col-span-2"
                    value={address.address}
                    onChange={(e) => setAddress({ ...address, address: e.target.value })} />
                  <input required placeholder="City" className="input"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                  <input required placeholder="Postal code" className="input"
                    value={address.postalCode}
                    onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} />
                  <input required placeholder="Country" className="input sm:col-span-2"
                    value={address.country}
                    onChange={(e) => setAddress({ ...address, country: e.target.value })} />
                </div>
                {user && (
                  <label className="flex items-center gap-2 text-sm mt-4 text-black/70">
                    <input
                      type="checkbox"
                      checked={saveAddress}
                      onChange={(e) => setSaveAddress(e.target.checked)}
                    />
                    Save this address to my account for next time
                  </label>
                )}
              </section>

              <section>
                <h2 className="font-serif text-xl mb-4">Payment method</h2>
                <div className="space-y-3">
                  <label className={`flex items-center gap-3 border rounded-md px-4 py-3 cursor-pointer ${method === "Stripe" ? "border-ink" : "border-black/15"}`}>
                    <input type="radio" checked={method === "Stripe"}
                      onChange={() => setMethod("Stripe")} />
                    <span>Pay by card (Stripe)</span>
                  </label>
                  <label className={`flex items-center gap-3 border rounded-md px-4 py-3 cursor-pointer ${method === "COD" ? "border-ink" : "border-black/15"}`}>
                    <input type="radio" checked={method === "COD"}
                      onChange={() => setMethod("COD")} />
                    <span>Cash on Delivery</span>
                  </label>
                </div>
              </section>

              <button disabled={busy}
                className="w-full bg-ink text-white py-3 text-sm tracking-wide hover:bg-accent transition disabled:opacity-50">
                {busy
                  ? "Placing order…"
                  : method === "COD"
                  ? "Place order (Cash on Delivery)"
                  : "Continue to payment"}
              </button>
            </form>
          ) : (
            <section>
              <h2 className="font-serif text-xl mb-4">Card payment</h2>
              {stripePromise && clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <StripeForm onPaid={handlePaid} />
                </Elements>
              ) : (
                <p className="text-sm text-red-700">
                  Stripe publishable key is missing. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to .env.local.
                </p>
              )}
            </section>
          )}
        </div>

        <aside className="bg-white rounded-lg p-6 h-fit border border-black/5">
          <h2 className="font-serif text-xl mb-4">Order summary</h2>
          <div className="space-y-3 mb-4 max-h-64 overflow-auto">
            {items.map((i) => (
              <div key={i.lineId} className="flex justify-between text-sm">
                <span className="text-black/70">
                  {i.name} <span className="text-black/40">×{i.qty}</span>
                </span>
                <span>{currency(i.price * i.qty)}</span>
              </div>
            ))}
          </div>

          {stage === "form" && (
            <div className="mb-4">
              <VoucherInput />
            </div>
          )}

          <div className="border-t border-black/10 pt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{currency(subtotal)}</span></div>
            {discount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Discount{voucher ? ` (${voucher.code})` : ""}</span>
                <span>−{currency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-black/60"><span>Shipping</span><span>{shipping === 0 ? "Free" : currency(shipping)}</span></div>
            <div className="flex justify-between text-black/60"><span>Tax</span><span>{currency(tax)}</span></div>
            <div className="flex justify-between font-semibold pt-2 border-t border-black/10">
              <span>Total</span><span>{currency(total)}</span>
            </div>
          </div>
        </aside>
      </div>

      <style jsx global>{`
        .input {
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
