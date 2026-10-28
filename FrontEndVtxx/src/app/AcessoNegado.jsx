import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#0b4f80',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            zIndex: 9999,
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
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

        {/* Ilustração 3D estilizada do cadeado */}
        <div className="acesso-ilustracao" aria-hidden="true">
          <div className="acesso-base">
            <div className="acesso-base-topo" />
          </div>

          <div className="acesso-cadeado">
            <div className="acesso-arco" />
            <div className="acesso-corpo">
              <div className="acesso-fechadura" />
            </div>
          </div>

          <span className="acesso-bolinha bolinha-azul" />
          <span className="acesso-bolinha bolinha-roxa" />
          <span className="acesso-bolinha bolinha-verde" />

          <div className="acesso-alerta-ilustracao">!</div>
        </div>
      </section>

      <section className="acesso-direita">
        <div className="acesso-cartao">
          <div className="acesso-logo">
            <img src="/logo-n.png" alt="Logo Neocore" />
            <h2>NEOCORE</h2>
            <span>A EMPRESA MAIS TOP DO MUNDO</span>
          </div>

          <div className="acesso-conteudo">
            <h3>Acesso negado</h3>
            <p className="acesso-descricao">
              Você não tem permissão para acessar esta página.
            </p>

            <div className="acesso-erro">
              <img src="/lock.svg" alt="" />
              <div>
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
