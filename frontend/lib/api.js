const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("luxe_token");
};

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message = (data && data.message) || res.statusText || "Request failed";
    throw new Error(message);
  }
  return data;
}

export const api = {
  // auth
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  logout: () => request("/auth/logout", { method: "POST", auth: true }),
  me: () => request("/auth/me", { auth: true }),

  // products
  getProducts: (qs = "") => request(`/products${qs}`),
  getFeatured: () => request("/products/featured"),
  getProduct: (id) => request(`/products/${id}`),
  addReview: (id, payload) =>
    request(`/products/${id}/reviews`, { method: "POST", body: payload, auth: true }),

  // orders
  createOrder: (payload) =>
    request("/orders", { method: "POST", body: payload, auth: true }),
  getMyOrders: () => request("/orders/mine", { auth: true }),
  getOrder: (id) => request(`/orders/${id}`, { auth: true }),
  markPaid: (id, payload) =>
    request(`/orders/${id}/pay`, { method: "PUT", body: payload, auth: true }),

  // payment
  createPaymentIntent: (orderId) =>
    request("/payment/create-intent", {
      method: "POST",
      body: { orderId },
      auth: true,
    }),

  // admin
  adminStats: () => request("/orders/admin/stats", { auth: true }),
  adminAllOrders: () => request("/orders", { auth: true }),
  adminUpdateOrderStatus: (id, status) =>
    request(`/orders/${id}/status`, { method: "PUT", body: { status }, auth: true }),
  adminCreateProduct: (payload) =>
    request("/products", { method: "POST", body: payload, auth: true }),
  adminUpdateProduct: (id, payload) =>
    request(`/products/${id}`, { method: "PUT", body: payload, auth: true }),
  adminDeleteProduct: (id) =>
    request(`/products/${id}`, { method: "DELETE", auth: true }),
};

export default api;
