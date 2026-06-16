"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import api from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { currency } from "@/lib/format";
import StripeForm from "./StripeForm";

const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = pk ? loadStripe(pk) : null;

export default function CheckoutPage() {
  const { items, subtotal, clear, ready } = useCart();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [address, setAddress] = useState({
    fullName: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    phone: "",
  });
  const [method, setMethod] = useState("Stripe");
  const [stage, setStage] = useState("form"); // form | pay
  const [order, setOrder] = useState(null);
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const shipping = subtotal >= 100 || subtotal === 0 ? 0 : 9.99;
  const tax = useMemo(() => +(subtotal * 0.08).toFixed(2), [subtotal]);
  const total = +(subtotal + shipping + tax).toFixed(2);

  useEffect(() => {
    if (!loading && !user) router.push("/login?redirect=/checkout");
  }, [loading, user, router]);

  useEffect(() => {
    if (ready && items.length === 0 && stage === "form") router.push("/cart");
  }, [ready, items, stage, router]);

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
      });
      setOrder(created);

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

  if (loading || !user)
    return <div className="max-w-5xl mx-auto px-4 py-20">Loading…</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="font-serif text-4xl mb-8">Checkout</h1>
      {error && (
        <div className="mb-6 text-sm bg-red-50 text-red-700 px-4 py-2 rounded">{error}</div>
      )}

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          {stage === "form" ? (
            <form onSubmit={placeOrder} className="space-y-8">
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
          <div className="border-t border-black/10 pt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{currency(subtotal)}</span></div>
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
