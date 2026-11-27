import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import OrbScene from './OrbScene';
import '../styles/acessoNegado.css';

export default function AcessoNegado() {
  const navigate = useNavigate();
  const location = useLocation();
  const [toast, setToast] = useState('');

  // Validação: a tela de acesso negado só funciona se o código MFA foi 000000
  const isAuthorizedDenied =
    location.state?.fromMfaDenied ||
    sessionStorage.getItem('mfa_denied') === 'true';

  useEffect(() => {
    // Se não veio do MFA 000000, redireciona de volta para o login
    if (!isAuthorizedDenied) {
      navigate('/login', { replace: true });
    }
  }, [isAuthorizedDenied, navigate]);

  useEffect(() => {
    document.body.classList.remove('dark-bg', 'auth-no-scroll');
    document.documentElement.classList.remove('auth-no-scroll');
  }, []);

  const handleVoltar = () => {
    sessionStorage.removeItem('mfa_denied');
    navigate('/login');
  };

  const handleSolicitarAcesso = (e) => {
    e.preventDefault();
    setToast('Solicitação de acesso enviada ao administrador!');
    setTimeout(() => setToast(''), 4000);
  };

  if (!isAuthorizedDenied) {
    return null;
  }

  return (
    <main className="acesso-pagina">
      {toast && (
        <div className="acesso-toast">
          {toast}
        </div>
      )}

      <section className="acesso-esquerda">
        <div className="acesso-mensagem">
          <h1>Acesso negado</h1>
          <p>
            Sua conta não tem permissão para visualizar este conteúdo.
            <br />
            Fale com o administrador ou entre com outra conta.
          </p>
        </div>

        {/* Globo 3D do Planeta com Cadeado de Segurança na frente bloqueando interação */}
        <div className="acesso-orb-slot">
          <OrbScene locked={true} />

          {/* Cadeado de Bloqueio em frente ao Mundo */}
          <div
            className="acesso-lock-overlay"
            onClick={() => {
              setToast('Acesso negado: a visualização e interação com os territórios está bloqueada.');
              setTimeout(() => setToast(''), 4000);
            }}
            title="Acesso negado: interação com o mapa e países bloqueada"
          >
            <div className="acesso-lock-card">
              <div className="acesso-lock-icon-halo">
                <svg
                  className="acesso-lock-icon-svg"
                  width="42"
                  height="42"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2.5" ry="2.5" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  <circle cx="12" cy="16" r="1.5" />
                  <path d="M12 17.5V19" />
                </svg>
              </div>

              <div className="acesso-lock-label-wrap">
                <span className="acesso-lock-status-dot" />
                <span className="acesso-lock-title">ACESSO BLOQUEADO</span>
              </div>
              <p className="acesso-lock-caption">Navegação e territórios protegidos</p>
            </div>
          </div>
        </div>
      </section>

      <section className="acesso-direita">
        <div className="acesso-cartao">
          <div className="acesso-logo">
            <img src="/logo-n.png" alt="Logo Neocore" />
            <h2>NEOCORE</h2>
            <span>A EMPRESA MAIS TOP DO MUNDO</span>
          </div>

          <div className="acesso-divider" />

          <div className="acesso-conteudo">
            <h3>Acesso negado</h3>
            <p className="acesso-descricao">
              Você não tem permissão para acessar esta página.
            </p>

            <div className="acesso-erro">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#dc2626"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="acesso-erro-icon"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div className="acesso-erro-info">
                <span>ERRO</span>
                <p>Permissão insuficiente</p>
              </div>
            </div>

            <div className="acesso-botoes">
              <button
                className="acesso-voltar"
                type="button"
                onClick={handleVoltar}
              >
                Voltar
              </button>

              <button
                className="acesso-trocar"
                type="button"
                onClick={handleVoltar}
              >
                Trocar de conta
              </button>
            </div>

            <p className="acesso-ajuda">
              Precisa de acesso?{' '}
              <a href="#solicitar" onClick={handleSolicitarAcesso}>
                Solicitar acesso
              </a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
