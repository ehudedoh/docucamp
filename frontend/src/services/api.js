const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const NETWORK_ERROR_MSG =
  "Impossible de joindre le serveur. Vérifiez votre connexion internet.";

function buildError(message, status, data) {
  const error = new Error(message);
  error.status = status;
  error.data = data;
  return error;
}

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

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, config);
  } catch {
    // Réseau coupé, CORS, serveur éteint…
    throw buildError(NETWORK_ERROR_MSG, 0, null);
  }

  let data = null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await res.json().catch(() => null);
  }

  if (!res.ok) {
    throw buildError(data?.message || `Erreur ${res.status}`, res.status, data);
  }

  return data;
}

/**
 * Envoi de fichier avec progression réelle (fetch ne sait pas la mesurer).
 *
 * @param {string} path            ex: "/uploads/document"
 * @param {FormData} formData
 * @param {object} [opts]
 * @param {(p: {loaded:number,total:number,percent:number}) => void} [opts.onProgress]
 * @param {AbortSignal} [opts.signal]
 */
export function apiUpload(path, formData, { onProgress, signal } = {}) {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem("docucamp_token");
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}${path}`);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (e) => {
        if (!e.lengthComputable) return;
        onProgress({
          loaded: e.loaded,
          total: e.total,
          percent: Math.round((e.loaded / e.total) * 100),
        });
      };
    }

    xhr.onload = () => {
      let data = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        /* réponse non JSON */
      }
      if (xhr.status >= 200 && xhr.status < 300) return resolve(data);
      reject(buildError(data?.message || `Erreur ${xhr.status}`, xhr.status, data));
    };
    xhr.onerror = () => reject(buildError(NETWORK_ERROR_MSG, 0, null));
    xhr.ontimeout = () => reject(buildError("Le serveur met trop de temps à répondre.", 0, null));
    xhr.onabort = () => reject(buildError("Envoi annulé.", 0, null));

    if (signal) {
      if (signal.aborted) return reject(buildError("Envoi annulé.", 0, null));
      signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }

    xhr.send(formData);
  });
}
