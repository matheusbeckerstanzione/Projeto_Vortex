import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { userService } from '../services/userService';
import '../styles/cadastro.css';

export default function AtivarContaNeocore() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [token, setToken] = useState(searchParams.get('token') || '');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [activatedUser, setActivatedUser] = useState(null);

  useEffect(() => {
    document.body.classList.remove('dark-bg');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    setError('');

    if (!token.trim()) {
      setError('Informe o token de convite recebido do administrador.');
      return;
    }
    if (senha.length < 8 || senha.length > 72) {
      setError('A senha deve ter entre 8 e 72 caracteres.');
      return;
    }
    if (senha !== confirmarSenha) {
      setError('As senhas não conferem.');
      return;
    }

    setSaving(true);
    try {
      const resp = await userService.ativarConta({ token, senha });
      setActivatedUser(resp || { email: 'sua conta' });
    } catch (err) {
      setError(err?.message || 'Não foi possível ativar a conta. Verifique se o token é válido e não expirou.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card cad-card">
      {!activatedUser ? (
        <form onSubmit={handleSubmit} noValidate>
          <div className="cad-head">
            <h2>Ativar Conta</h2>
            <p className="cad-sub">
              Informe o token de convite enviado pelo administrador e defina sua senha de acesso.
            </p>
          </div>

          <div className="cad-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="field">
              <label htmlFor="ativar-token">Token de Convite</label>
              <input
                id="ativar-token"
                type="text"
                placeholder="Cole aqui o token do convite"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="ativar-senha">Nova Senha (mín. 8 caracteres)</label>
              <input
                id="ativar-senha"
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="ativar-confirmar">Confirmar Senha</label>
              <input
                id="ativar-confirmar"
                type="password"
                placeholder="••••••••"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <div className="cad-error" style={{ marginTop: '12px' }}>
              {error}
            </div>
          )}

          <button type="submit" className="cad-btn" disabled={saving} style={{ marginTop: '16px' }}>
            {saving ? 'Ativando conta...' : 'Ativar minha conta'}
          </button>

          <p className="cad-footer">
            Já ativou sua conta?{' '}
            <a
              href="/login"
              onClick={(e) => {
                e.preventDefault();
                navigate('/login');
              }}
            >
              Voltar ao login
            </a>
          </p>
        </form>
      ) : (
        <div className="cad-success">
          <div className="cad-success-icon">✓</div>
          <h2>Conta ativada com sucesso!</h2>
          <p>
            Sua senha foi definida. Agora faça login e configure o Google Authenticator no primeiro acesso.
          </p>
          <button
            type="button"
            className="cad-btn"
            onClick={() => navigate('/login')}
          >
            Ir para o Login
          </button>
        </div>
      )}
    </div>
  );
}
