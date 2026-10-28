import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { fazerLogin } from '../services/auth';
import '../styles/login.css';

export default function LoginNeocore() {
  const navigate = useNavigate();
  const outlet = useOutletContext();
  const startLoginTransition = outlet?.startLoginTransition;

  const cardRef = useRef(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfa, setMfa] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [logging, setLogging] = useState(false);
  const [navigating, setNavigating] = useState(false);

  // Modal Esqueci minha senha
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const mfaRefs = useRef([]);

  useEffect(() => {
    document.body.classList.remove('dark-bg');
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isForgotOpen) {
        setIsForgotOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isForgotOpen]);

  /* ---------- MFA input handlers ---------- */
  const handleMfaInput = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...mfa];
    next[index] = digit;
    setMfa(next);

    if (digit && index < 5) {
      mfaRefs.current[index + 1]?.focus();
    }
  };

  const handleMfaKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !mfa[index] && index > 0) {
      mfaRefs.current[index - 1]?.focus();
    }
  };

  const handleMfaPaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!paste) return;
    const next = [...mfa];
    for (let i = 0; i < paste.length; i++) next[i] = paste[i];
    setMfa(next);
    const focusIdx = Math.min(paste.length, 5);
    mfaRefs.current[focusIdx]?.focus();
  };

  /* ---------- Submit → Transição Suave para Dashboard (Modo MVP direto) ---------- */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (logging) return;

    // Acesso negado só funciona se o CÓDIGO MFA for 000000
    const mfaCode = mfa.join('');
    if (mfaCode === '000000') {
      sessionStorage.setItem('mfa_denied', 'true');
      navigate('/acesso-negado', { state: { fromMfaDenied: true } });
      return;
    }

    setLogging(true);

    if (startLoginTransition) {
      startLoginTransition();
    } else {
      navigate('/dashboard');
    }
  };

  /* ---------- Navegação para Cadastro ---------- */
  const handleGoToCadastro = () => {
    if (navigating) return;
    setNavigating(true);

    const cardEl = cardRef.current;
    if (cardEl && cardEl.animate) {
      const anim = cardEl.animate(
        [
          { opacity: 1, transform: 'translateX(0)' },
          { opacity: 0, transform: 'translateX(-16px)' },
        ],
        { duration: 200, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' }
      );
      anim.onfinish = () => navigate('/cadastro');
    } else {
      navigate('/cadastro');
    }
  };

  return (
    <form className="card" ref={cardRef} onSubmit={handleSubmit}>
      {/* Header com Logo */}
      <header className="brand">
        <img src="/logo-n.png" alt="Logo NEOCORE" />
        <span className="name">NEOCORE</span>
        <span className="tag">A EMPRESA MAIS TECH DO MUNDO</span>
      </header>

      <div className="divider" />

      {/* Boas-vindas */}
      <div className="welcome">
        <h2>Bem-vindo de volta</h2>
        <p>Faça login para continuar</p>
      </div>

      {error && <div className="login-error">{error}</div>}

      {/* Campo E-mail */}
      <label className="l" htmlFor="email">
        E-MAIL
      </label>
      <div className="input">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
        <input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {/* Campo Senha */}
      <label className="l" htmlFor="password">
        SENHA
      </label>
      <div className="input">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <button
        type="button"
        className="link forgot"
        onClick={(e) => {
          e.preventDefault();
          setForgotEmail(email || '');
          setForgotSubmitted(false);
          setIsForgotOpen(true);
        }}
      >
        Esqueceu a senha?
      </button>

      {/* Código MFA */}
      <div className="mfa-wrap">
        <span className="mfa-label">CÓDIGO MFA</span>
        <div className="mfa" onPaste={handleMfaPaste}>
          {mfa.map((val, idx) => (
            <input
              key={idx}
              ref={(el) => (mfaRefs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={val}
              onChange={(e) => handleMfaInput(idx, e.target.value)}
              onKeyDown={(e) => handleMfaKeyDown(idx, e)}
              aria-label={`Dígito MFA ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Botão Submit */}
      <button type="submit" className="submit" disabled={logging}>
        {logging ? 'ENTRANDO...' : 'ENTRAR'}
      </button>

      {/* Divisor "ou" */}
      <div className="or">
        <span>ou</span>
      </div>

      {/* Rodapé Cadastre-se */}
      <p className="signup">
        Não tem uma conta?{' '}
        <button
          type="button"
          onClick={handleGoToCadastro}
          className="link"
          disabled={navigating}
        >
          Cadastre-se
        </button>
      </p>

      {/* Modal Esqueci Minha Senha */}
      {isForgotOpen && (
        <div
          className="forgot-modal-backdrop"
          onClick={() => setIsForgotOpen(false)}
        >
          <div
            className="forgot-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-modal-title"
          >
            <button
              type="button"
              className="forgot-modal-close"
              onClick={() => setIsForgotOpen(false)}
              aria-label="Fechar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {!forgotSubmitted ? (
              <div
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setForgotLoading(true);
                    setTimeout(() => {
                      setForgotLoading(false);
                      setForgotSubmitted(true);
                    }, 400);
                  }
                }}
              >
                <div className="forgot-icon-wrap">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>

                <h3 id="forgot-modal-title" className="forgot-title">Esqueceu sua senha?</h3>
                <p className="forgot-subtitle">
                  Não se preocupe! Informe seu e-mail cadastrado ou CPF para receber o link com instruções de redefinição imediata.
                </p>

                <label className="forgot-label" htmlFor="forgot-email">
                  E-MAIL OU CPF
                </label>
                <div className="forgot-input-box">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <input
                    id="forgot-email"
                    type="text"
                    className="forgot-input"
                    placeholder="ex: carlos@neocore.tech"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="forgot-actions">
                  <button
                    type="button"
                    className="forgot-btn-submit"
                    disabled={forgotLoading}
                    onClick={() => {
                      setForgotLoading(true);
                      setTimeout(() => {
                        setForgotLoading(false);
                        setForgotSubmitted(true);
                      }, 400);
                    }}
                  >
                    {forgotLoading ? (
                      'ENVIANDO...'
                    ) : (
                      <>
                        <span>ENVIAR LINK DE RECUPERAÇÃO</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="forgot-btn-cancel"
                    onClick={() => setIsForgotOpen(false)}
                  >
                    Voltar ao login
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="forgot-icon-wrap success">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>

                <h3 className="forgot-title">Link enviado com sucesso!</h3>
                <p className="forgot-subtitle" style={{ marginBottom: '14px' }}>
                  Verifique a sua caixa de entrada para redefinir sua credencial.
                </p>

                <div className="forgot-success-box">
                  Enviamos as instruções seguras para <strong>{forgotEmail || 'seu e-mail'}</strong>. O link de recuperação é válido pelos próximos 30 minutos.
                </div>

                <div className="forgot-actions">
                  <button
                    type="button"
                    className="forgot-btn-submit"
                    onClick={() => {
                      setIsForgotOpen(false);
                      setForgotSubmitted(false);
                    }}
                  >
                    ENTENDIDO, VOLTAR AO LOGIN
                  </button>
                </div>

                <div className="forgot-resend-row">
                  <span>Não recebeu o e-mail?</span>
                  <button
                    type="button"
                    className="forgot-resend-btn"
                    onClick={() => {
                      setForgotLoading(true);
                      setTimeout(() => {
                        setForgotLoading(false);
                      }, 400);
                    }}
                  >
                    Reenviar agora
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
