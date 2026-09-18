const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function apiFetch(
  path,
  { method = "GET", body, headers = {}, ...rest } = {},
) {
  const token = localStorage.getItem("docucamp_token");

  const config = {
    method,
    headers: {
      ...(body && !(body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...rest,
  };

  if (body) {
    config.body = body instanceof FormData ? body : JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}${path}`, config);

  let data = null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await res.json().catch(() => null);
  }

  if (!res.ok) {
    const error = new Error(data?.message || `Erreur ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}
