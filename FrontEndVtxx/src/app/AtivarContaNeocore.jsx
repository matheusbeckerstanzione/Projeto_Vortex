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
            <p>
              Informe o token de convite enviado pelo administrador e defina sua senha de acesso.
            </p>
          </div>

          {error && (
            <div className="login-error" role="alert" style={{ marginTop: '12px' }}>
              {error}
            </div>
          )}

          <div className="cad-field" style={{ marginTop: '12px' }}>
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

          <div className="cad-field" style={{ marginTop: '10px' }}>
            <label htmlFor="ativar-senha">Nova Senha (mín. 8 caracteres)</label>
            <input
              id="ativar-senha"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          <div className="cad-field" style={{ marginTop: '10px' }}>
            <label htmlFor="ativar-confirmar">Confirmar Senha</label>
            <input
              id="ativar-confirmar"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="submit cad-submit" disabled={saving} style={{ marginTop: '14px' }}>
            {saving ? 'ATIVANDO CONTA...' : 'Ativar minha conta'}
          </button>

          <p className="signup" style={{ marginTop: '12px' }}>
            Já ativou sua conta?{' '}
            <a
              href="/login"
              className="link"
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
        <div style={{ textAlign: 'center', padding: '12px 4px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#dcfce7',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' }}>
            Conta ativada com sucesso!
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: '0 0 20px' }}>
            Sua senha foi definida. Agora faça login e configure o Google Authenticator no primeiro acesso.
          </p>
          <button
            type="button"
            className="submit cad-submit"
            onClick={() => navigate('/login')}
          >
            IR PARA O LOGIN
          </button>
        </div>
      )}
    </div>
  );
}
