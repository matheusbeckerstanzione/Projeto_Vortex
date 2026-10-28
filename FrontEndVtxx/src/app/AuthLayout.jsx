import React, { useRef, useCallback, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import OrbScene from './OrbScene';
import { useAuthTransition } from './App';
import '../styles/authLayout.css';

export default function AuthLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const orbRef = useRef(null);
  const orbSlotRef = useRef(null);
  const authTrans = useAuthTransition();

  const isCadastro = location.pathname.includes('cadastro');

  // Dispara a transição de viagem ao planeta com tela branca para o dashboard
  const startLoginTransition = useCallback(() => {
    if (authTrans?.triggerLoginTransition) {
      authTrans.triggerLoginTransition(orbSlotRef.current, orbRef);
    } else {
      navigate('/dashboard');
    }
  }, [authTrans, navigate]);

  useEffect(() => {
    document.body.classList.remove('dark-bg');
    document.documentElement.classList.add('auth-no-scroll');
    document.body.classList.add('auth-no-scroll');
    return () => {
      document.documentElement.classList.remove('auth-no-scroll');
      document.body.classList.remove('auth-no-scroll');
    };
  }, []);

  return (
    <div className="auth-page">

      {/* Coluna Esquerda: Hero & Globo 3D Fixo */}
      <aside className="auth-left-col">
        <div className="auth-hero-content">
          <h1 className="auth-hero-title">
            {isCadastro ? (
              <>
                Cadastro e <br />
                consentimento
              </>
            ) : (
              'O Futuro Do Marketing'
            )}
          </h1>
          <p className="auth-hero-desc">
            {isCadastro
              ? 'Preencha seus dados e revise como vamos utilizá-los. Você pode alterar suas permissões a qualquer momento.'
              : 'Criamos experiências digitais na interseção entre design e tecnologia, ajudando nossos clientes a imaginar o futuro.'}
          </p>
        </div>

        {/* Container do Globo Three.js (com ref para animar para o centro da tela na transição) */}
        <div ref={orbSlotRef} className="auth-orb-slot">
          <OrbScene ref={orbRef} />
        </div>
      </aside>

      {/* Coluna Direita: Área do Formulário */}
      <main className="auth-right-col">
        <div className="auth-card-container">
          <Outlet context={{ startLoginTransition }} />
        </div>
      </main>
    </div>
  );
}
