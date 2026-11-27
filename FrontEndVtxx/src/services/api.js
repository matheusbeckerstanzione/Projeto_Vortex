/**
 * Cliente HTTP centralizado para comunicação com a API Spring Boot (NeoCore).
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const TOKEN_KEY = 'neocore_token';
const USER_KEY = 'neocore_user';
const EXPIRES_AT_KEY = 'neocore_expires_at';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getExpiresAt: () => Number(localStorage.getItem(EXPIRES_AT_KEY)) || null,
  getUser: () => {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setSession: (token, user, expiresInSeconds) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (Number.isFinite(expiresInSeconds) && expiresInSeconds > 0) {
      localStorage.setItem(EXPIRES_AT_KEY, String(Date.now() + expiresInSeconds * 1000));
    } else {
      localStorage.removeItem(EXPIRES_AT_KEY);
    }
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
  },
};

export class ApiError extends Error {
  constructor(status, message, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Função genérica de requisição HTTP com injeção automática de Token Bearer.
 */
async function request(endpoint, { authenticated = true, ...options } = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const token = authenticated ? authStorage.getToken() : null;

  const headers = {
    'Accept': 'application/json',
    ...options.headers,
  };

  // Define Content-Type JSON caso não seja FormData
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Anexa o Bearer token se presente
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (networkError) {
    if (options.signal?.reason?.name === 'TimeoutError') {
      throw new ApiError(408, 'O servidor demorou para responder. Tente novamente.');
    }
    throw new ApiError(0, 'Não foi possível conectar ao servidor. Verifique se o backend está em execução.');
  }

  // Uma resposta antiga pode chegar depois de uma nova autenticação.
  if (response.status === 401 && token && headers.Authorization === `Bearer ${token}`
      && authStorage.getToken() === token) {
    const expiresAt = authStorage.getExpiresAt();
    const reason = expiresAt && Date.now() >= expiresAt ? 'expired' : 'invalid';
    authStorage.clear();
    window.dispatchEvent(new CustomEvent('neocore:session-expired', { detail: { reason } }));
  }

  if (response.status === 403) {
    throw new ApiError(403, 'Acesso negado: você não tem permissão para realizar esta operação.');
  }

  // 204 No Content
  if (response.status === 204) {
    return null;
  }

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMessage =
      (typeof data === 'object' && (data?.mensagem || data?.message || data?.error)) ||
      `Erro na requisição (${response.status})`;
    throw new ApiError(response.status, errorMessage, data);
  }

  return data;
}

export const api = {
  get: (endpoint, headers) => request(endpoint, { method: 'GET', headers }),
  post: (endpoint, body, headers) => request(endpoint, { method: 'POST', body, headers }),
  put: (endpoint, body, headers) => request(endpoint, { method: 'PUT', body, headers }),
  patch: (endpoint, body, headers) => request(endpoint, { method: 'PATCH', body, headers }),
  delete: (endpoint, headers) => request(endpoint, { method: 'DELETE', headers }),
  request,
  BASE_URL,
};

export default api;

