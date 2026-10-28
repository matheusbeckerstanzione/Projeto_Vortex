import React, { useState, useCallback, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import LoginNeocore from './LoginNeocore';
import CadastroNeocore from './CadastroNeocore';
import Dashboard from './Dashboard';
import AcessoNegado from './AcessoNegado';
import '../styles/authLayout.css';

export const AuthTransitionContext = createContext(null);

export function useAuthTransition() {
  return useContext(AuthTransitionContext);
}

function AppInner() {
  const navigate = useNavigate();
  const [whiteOverlayActive, setWhiteOverlayActive] = useState(false);
  const [whiteOverlayOpacity, setWhiteOverlayOpacity] = useState(0);

  /**
   * Transição cinematográfica solicitada:
   * 1. Cartão e hero desvanecem suavemente.
   * 2. O planeta viaja suavemente da coluna esquerda até o centro da tela.
   * 3. O planeta se expande vindo em direção à câmera (sensação de entrar no planeta).
   * 4. A tela se preenche com uma névoa branca celestial suave (fade para branco).
   * 5. Sob o branco puro, troca de rota para /dashboard.
   * 6. O branco dissolve gradualmente (fade-out), revelando o painel pronto e nítido.
   */
  const triggerLoginTransition = useCallback((orbSlotEl, orbRef) => {
    // 1. Ativa estado de transição global (libera overflow e eleva o z-index)
    const authPage = document.querySelector('.auth-page');
    if (authPage) authPage.classList.add('auth-transitioning');

    // Esconde hero e formulário suavemente
    const heroContent = document.querySelector('.auth-hero-content');
    const rightCol = document.querySelector('.auth-right-col');
    if (heroContent) heroContent.style.opacity = '0';
    if (rightCol) rightCol.style.opacity = '0';

    // 2. Animação simétrica do planeta inteiro em direção ao centro da viewport
    if (orbSlotEl) {
      const rect = orbSlotEl.getBoundingClientRect();
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const orbCenterX = rect.left + rect.width / 2;
      const orbCenterY = rect.top + rect.height / 2;
      const dx = cx - orbCenterX;
      const dy = cy - orbCenterY;

      orbSlotEl.style.transformOrigin = 'center center';
      orbSlotEl.style.transition = 'transform 1.15s cubic-bezier(0.22, 1, 0.36, 1)';
      orbSlotEl.style.transform = `translate(${dx}px, ${dy}px) scale(3.5)`;
    }

    // 3. Mergulho de câmera e rotação no Three.js (sem pegmen gigantes)
    if (orbRef?.current?.diveIn) {
      orbRef.current.diveIn(1100);
    }

    // 4. Fade-in do branco total (inicia aos ~500ms e completa em ~1050ms)
    setWhiteOverlayActive(true);
    setTimeout(() => {
      setWhiteOverlayOpacity(1);
    }, 450);

    // 5. No ápice da tela branca (~1150ms), muda de página
    setTimeout(() => {
      navigate('/dashboard');

      // 6. Fade-out da tela branca revelando o dashboard com suavidade
      setTimeout(() => {
        setWhiteOverlayOpacity(0);
        setTimeout(() => {
          setWhiteOverlayActive(false);
        }, 550);
      }, 150);
    }, 1150);
  }, [navigate]);

  return (
    <AuthTransitionContext.Provider value={{ triggerLoginTransition }}>
      {/* Overlay branco que conecta a transição do planeta ao dashboard */}
      <div
        className="auth-white-overlay"
        style={{
          display: whiteOverlayActive ? 'block' : 'none',
          opacity: whiteOverlayOpacity,
        }}
      />

      <Routes>
        {/* Rotas de Autenticação com Layout Compartilhado (Globo) */}
        <Route element={<AuthLayout />}>
          <Route path="/" element={<LoginNeocore />} />
          <Route path="/login" element={<LoginNeocore />} />
          <Route path="/cadastro" element={<CadastroNeocore />} />
        </Route>

        {/* Rotas Autenticadas (sem o globo) */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/contatos" element={<Dashboard initialMenu="todos-contatos" />} />
        <Route path="/importar" element={<Dashboard initialMenu="importar" />} />
        <Route path="/governanca" element={<Dashboard initialMenu="governanca" />} />
        <Route path="/logs" element={<Dashboard initialMenu="logs" />} />
        <Route path="/logs-auditoria" element={<Dashboard initialMenu="logs" />} />
        <Route path="/segmentos" element={<Dashboard initialMenu="segmentos" />} />

        {/* Rota Acesso Negado (liberada somente com código MFA 000000) */}
        <Route path="/acesso-negado" element={<AcessoNegado />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthTransitionContext.Provider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
