export const currency = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(n || 0));

export const FALLBACK_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='750'><rect width='100%' height='100%' fill='#e9e3d9'/><text x='50%' y='50%' font-family='Georgia' font-size='28' fill='#b08968' text-anchor='middle' dominant-baseline='middle'>LUXE</text></svg>`
  );
