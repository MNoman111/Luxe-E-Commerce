import nodemailer from "nodemailer";

const FROM = process.env.EMAIL_FROM || "LUXE <onboarding@resend.dev>";

let transporter = null;
const getTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_PASS) return null;
  const port = Number(process.env.SMTP_PORT) || 587;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465, // true for 465, false for 587/2525
    auth: {
      user: process.env.SMTP_USER || "resend",
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
};

export const isEmailEnabled = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_PASS);

const money = (n) => `$${Number(n || 0).toFixed(2)}`;
const shortId = (order) => order._id.toString().slice(-8).toUpperCase();

const itemRows = (order) =>
  order.orderItems
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;">
          ${i.name}<br><span style="color:#888;font-size:12px;">Size ${i.size} · Qty ${i.qty}</span>
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;">
          ${money(i.price * i.qty)}
        </td>
      </tr>`
    )
    .join("");

const totalsBlock = (order) => `
  <table style="width:100%;font-size:14px;margin-top:8px;">
    <tr><td style="padding:2px 0;color:#555;">Items</td><td style="text-align:right;">${money(order.itemsPrice)}</td></tr>
    ${
      order.discountAmount > 0
        ? `<tr><td style="padding:2px 0;color:#1a7f37;">Discount${order.voucherCode ? ` (${order.voucherCode})` : ""}</td><td style="text-align:right;color:#1a7f37;">−${money(order.discountAmount)}</td></tr>`
        : ""
    }
    <tr><td style="padding:2px 0;color:#555;">Shipping</td><td style="text-align:right;">${order.shippingPrice === 0 ? "Free" : money(order.shippingPrice)}</td></tr>
    <tr><td style="padding:2px 0;color:#555;">Tax</td><td style="text-align:right;">${money(order.taxPrice)}</td></tr>
    <tr><td style="padding:8px 0 0;font-weight:600;border-top:1px solid #ddd;">Total</td><td style="padding:8px 0 0;text-align:right;font-weight:600;border-top:1px solid #ddd;">${money(order.totalPrice)}</td></tr>
  </table>`;

const addressBlock = (order) => {
  const a = order.shippingAddress || {};
  return `${a.fullName || ""}<br>${a.address || ""}, ${a.city || ""} ${a.postalCode || ""}<br>${a.country || ""} · ${a.phone || ""}`;
};

const shell = (title, intro, order, footer) => `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;">
    <div style="font-size:22px;letter-spacing:4px;font-weight:bold;padding:16px 0;border-bottom:2px solid #1a1a1a;">LUXE</div>
    <h2 style="font-weight:normal;">${title}</h2>
    <p style="color:#555;font-size:14px;">${intro}</p>
    <p style="font-size:14px;"><strong>Order #${shortId(order)}</strong> · ${new Date(order.createdAt || Date.now()).toLocaleString()}</p>
    <table style="width:100%;font-size:14px;border-collapse:collapse;">${itemRows(order)}</table>
    ${totalsBlock(order)}
    <h3 style="margin-top:24px;font-size:15px;">Shipping to</h3>
    <p style="font-size:14px;color:#555;">${addressBlock(order)}</p>
    <p style="font-size:14px;color:#555;">Payment method: <strong>${order.paymentMethod}</strong> · ${
      order.isPaid
        ? "Paid"
        : order.paymentMethod === "COD"
        ? "Cash on delivery"
        : "Awaiting payment"
    }</p>
    <p style="color:#999;font-size:12px;margin-top:28px;border-top:1px solid #eee;padding-top:12px;">${footer}</p>
  </div>`;

const customerHtml = (order) =>
  shell(
    "Thank you for your order!",
    "We've received your order and it's now being processed. Here are the details:",
    order,
    "You're receiving this because you placed an order at LUXE."
  );

const adminHtml = (order, placedBy) =>
  shell(
    "New order received",
    `A new order was placed by <strong>${placedBy || "unknown"}</strong>.`,
    order,
    "Admin notification — LUXE store."
  );

const STATUS_COPY = {
  Processing: "Good news — we're preparing your order for shipment.",
  Shipped: "Your order is on its way! 📦",
  Delivered: "Your order has been delivered. We hope you love it!",
  Cancelled: "Your order has been cancelled. If this is unexpected, please contact us.",
  Pending: "Your order status has been updated.",
};

const statusHtml = (order) =>
  shell(
    `Order ${order.status.toLowerCase()}`,
    STATUS_COPY[order.status] || "Your order status has been updated.",
    order,
    "You're receiving this because the status of your LUXE order changed."
  );

// Notifies the customer when an admin changes the order status. Never throws.
export const sendStatusUpdateEmail = async (order, customerEmail) => {
  const t = getTransporter();
  if (!t || !customerEmail) {
    if (!t) console.log("Email not configured — skipping status email.");
    return;
  }
  try {
    await t.sendMail({
      from: FROM,
      to: customerEmail,
      subject: `Your LUXE order #${shortId(order)} is now ${order.status}`,
      html: statusHtml(order),
    });
  } catch (err) {
    console.error("Status email failed:", err.message || err);
  }
};

// Sends confirmation to the customer and a notification to the admin.
// customerEmail = where the confirmation goes; accountEmail = registered account (null for guests).
// Never throws: email problems must not break order placement.
export const sendOrderEmails = async (order, { customerEmail, accountEmail } = {}) => {
  const t = getTransporter();
  if (!t) {
    console.log("Email not configured (SMTP_* unset) — skipping order emails.");
    return;
  }
  const id = shortId(order);
  // Admin sees the account email for registered users, or the entered email for guests.
  const placedBy = accountEmail || customerEmail;
  const tasks = [];

  if (customerEmail) {
    tasks.push(
      t.sendMail({
        from: FROM,
        to: customerEmail,
        subject: `Your LUXE order #${id} is confirmed`,
        html: customerHtml(order),
      })
    );
  }
  if (process.env.ADMIN_EMAIL) {
    tasks.push(
      t.sendMail({
        from: FROM,
        to: process.env.ADMIN_EMAIL,
        subject: `New order #${id} — ${money(order.totalPrice)}${order.isGuest ? " (guest)" : ""}`,
        html: adminHtml(order, placedBy),
      })
    );
  }

  const results = await Promise.allSettled(tasks);
  results.forEach((r) => {
    if (r.status === "rejected")
      console.error("Order email failed:", r.reason?.message || r.reason);
  });
};
