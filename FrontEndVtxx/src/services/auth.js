/**
 * Serviço de autenticação e cadastro NeoCore.
 */
const API_URL = import.meta.env?.VITE_API_URL ?? '';

export async function fazerLogin(email, senha, mfa) {
  try {
    if (API_URL) {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha, mfa }),
      });
      if (!res.ok) return { success: false, message: 'Credenciais inválidas.' };
      return res.json();
    }
  } catch {
    // fallback para simulação
  }

  await new Promise((resolve) => setTimeout(resolve, 600));
  return { success: true };
}

export async function cadastrarUsuario(payload) {
  try {
    if (API_URL) {
      const res = await fetch(`${API_URL}/api/cadastro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, message: data.message };
      }

      return { success: true };
    }
  } catch {
    // fallback para simulação local se não houver backend ativo
  }

  await new Promise((resolve) => setTimeout(resolve, 600));
  return { success: true };
}
