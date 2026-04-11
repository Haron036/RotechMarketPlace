const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api`;

const getToken = () => localStorage.getItem("jwt_token");

// Authenticated fetch helper
export const authFetch = (endpoint, options = {}) => {
  const token = getToken();
  return fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
};

// ─── Product API calls ──────────────────────────────────────

export const fetchProducts = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return authFetch(`/products${query ? `?${query}` : ""}`);
};

export const fetchProduct = (id) => authFetch(`/products/${id}`);

export const fetchMyProducts = () => authFetch("/products/my-products");

export const createProduct = (product) =>
  authFetch("/products", {
    method: "POST",
    body: JSON.stringify(product),
  });

export const updateProduct = (id, product) =>
  authFetch(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(product),
  });

export const deleteProduct = (id) =>
  authFetch(`/products/${id}`, { method: "DELETE" });