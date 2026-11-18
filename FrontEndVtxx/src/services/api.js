/**
 * Cliente HTTP centralizado para a API do NeoCore (Spring Boot).
 * Endereço base: https://neocore-homologacao.onrender.com (configurável via VITE_API_URL).
 */
const API_BASE_URL = import.meta.env?.VITE_API_URL || 'https://neocore-homologacao.onrender.com';

export function getAuthToken() {
  try {
    return localStorage.getItem('neocore_token') || sessionStorage.getItem('neocore_token') || '';
  } catch {
    return '';
  }
}

export function setAuthToken(token, persist = true) {
  try {
    if (token) {
      if (persist) localStorage.setItem('neocore_token', token);
      else sessionStorage.setItem('neocore_token', token);
    } else {
      localStorage.removeItem('neocore_token');
      sessionStorage.removeItem('neocore_token');
    }
  } catch {
    // ignore local storage errors
  }
}

export async function apiRequest(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/contatos?pagina=0&tamanho=1`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.status !== 0;
  } catch {
    return false;
  }
}

