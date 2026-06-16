"use client";
import { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

export default function StripeForm({ onPaid }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setError("");

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message);
      setBusy(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message);
      setBusy(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      await onPaid({ id: paymentIntent.id, status: paymentIntent.status });
    } else {
      setError("Payment was not completed. Please try again.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <PaymentElement />
      {error && (
        <div className="text-sm bg-red-50 text-red-700 px-4 py-2 rounded">{error}</div>
      )}
      <button
        disabled={!stripe || busy}
        className="w-full bg-ink text-white py-3 text-sm tracking-wide hover:bg-accent transition disabled:opacity-50"
      >
        {busy ? "Processing…" : "Pay now"}
      </button>
      <p className="text-xs text-black/50 text-center">
        Test card: 4242 4242 4242 4242 · any future date · any CVC.
      </p>
    </form>
  );
}
