import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { fazerLogin, confirmarCodigoMfa } from '../services/auth';
import '../styles/login.css';

export default function LoginNeocore() {
  const navigate = useNavigate();
  const { state: loginState } = useLocation();
  const outlet = useOutletContext();
  const startLoginTransition = outlet?.startLoginTransition;

  const cardRef = useRef(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfa, setMfa] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [tokenTemporario, setTokenTemporario] = useState(null);
  const [logging, setLogging] = useState(false);
  const [navigating, setNavigating] = useState(false);

  // Modal Esqueci minha senha
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  // Modal MFA Setup (QR Code + Chave Secreta)
  const [mfaSetupData, setMfaSetupData] = useState(null);
  const [mfaSetupCode, setMfaSetupCode] = useState(['', '', '', '', '', '']);
  const [mfaSetupError, setMfaSetupError] = useState('');
  const [mfaSetupLoading, setMfaSetupLoading] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);
  const mfaSetupRefs = useRef([]);

  const mfaRefs = useRef([]);

  const reiniciarVerificacao = useCallback(() => {
    setTokenTemporario(null);
    setMfa(['', '', '', '', '', '']);
    setMfaSetupData(null);
    setMfaSetupCode(['', '', '', '', '', '']);
    setMfaSetupError('');
    setError('');
    setInfoMessage('');
  }, []);

  useEffect(() => {
    document.body.classList.remove('dark-bg');
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (mfaSetupData) {
          if (!mfaSetupLoading) reiniciarVerificacao();
        } else if (isForgotOpen) {
          setIsForgotOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isForgotOpen, mfaSetupData, mfaSetupLoading, reiniciarVerificacao]);

  useEffect(() => {
    if (tokenTemporario && !mfaSetupData) mfaRefs.current[0]?.focus();
  }, [tokenTemporario, mfaSetupData]);

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

  /* ---------- MFA Setup Modal input handlers ---------- */
  const handleMfaSetupInput = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...mfaSetupCode];
    next[index] = digit;
    setMfaSetupCode(next);
    if (digit && index < 5) {
      mfaSetupRefs.current[index + 1]?.focus();
    }
  };

  const handleMfaSetupKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !mfaSetupCode[index] && index > 0) {
      mfaSetupRefs.current[index - 1]?.focus();
    }
  };

  const handleMfaSetupPaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!paste) return;
    const next = [...mfaSetupCode];
    for (let i = 0; i < paste.length; i++) next[i] = paste[i];
    setMfaSetupCode(next);
    const focusIdx = Math.min(paste.length, 5);
    mfaSetupRefs.current[focusIdx]?.focus();
  };

  const handleCopySecret = async () => {
    if (mfaSetupData?.segredo) {
      try {
        await navigator.clipboard.writeText(mfaSetupData.segredo);
        setSecretCopied(true);
        setTimeout(() => setSecretCopied(false), 2000);
      } catch {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = mfaSetupData.segredo;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setSecretCopied(true);
        setTimeout(() => setSecretCopied(false), 2000);
      }
    }
  };

  const handleMfaSetupConfirm = async () => {
    if (mfaSetupLoading) return;
    const code = mfaSetupCode.join('');
    if (code.length !== 6) {
      setMfaSetupError('Informe os 6 dígitos do Google Authenticator.');
      return;
    }
    setMfaSetupLoading(true);
    setMfaSetupError('');
    try {
      await confirmarCodigoMfa(tokenTemporario, code);
      setMfaSetupData(null);
      if (startLoginTransition) {
        startLoginTransition();
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setMfaSetupError(err?.status === 401
        ? 'Código ou verificação inválida. Use um código novo ou recomece a configuração.'
        : err?.message || 'Não foi possível confirmar a configuração.');
    } finally {
      setMfaSetupLoading(false);
    }
  };

  /* ---------- Submit → Autenticação Real com MFA / Google Authenticator ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (logging) return;
    if (mfaSetupData) {
      await handleMfaSetupConfirm();
      return;
    }

    setError('');
    setInfoMessage('');

    if (!email.trim() || !password) {
      setError('Por favor, informe seu e-mail e senha.');
      return;
    }

    // Acesso negado de teste (mantido para testes manuais se o CÓDIGO MFA for 000000)
    const mfaCode = tokenTemporario ? mfa.join('') : '';
    if (tokenTemporario && mfaCode.length !== 6) {
      setError('Informe os 6 dígitos do Google Authenticator.');
      return;
    }
    if (mfaCode === '000000') {
      sessionStorage.setItem('mfa_denied', 'true');
      navigate('/acesso-negado', { state: { fromMfaDenied: true } });
      return;
    }

    setLogging(true);

    try {
      const res = await fazerLogin(email, password, mfaCode, tokenTemporario);

      if (res.success) {
        if (startLoginTransition) {
          startLoginTransition();
        } else {
          navigate('/dashboard', { replace: true });
        }
        return;
      }

      if (res.mfaPending) {
        setTokenTemporario(res.tokenTemporario);

        // Se é primeiro login, abre a modal de setup MFA com QR Code
        if (res.mfaSetup) {
          setMfaSetupData(res.mfaSetup);
          setMfaSetupCode(['', '', '', '', '', '']);
          setMfaSetupError('');
          setLogging(false);
          return;
        }

        setInfoMessage(res.message || 'Informe o código de 6 dígitos do Google Authenticator.');
        setLogging(false);
        return;
      }

      setError(res.message || 'Erro ao realizar login.');
      setLogging(false);
    } catch (err) {
      setError(err?.message || 'Falha ao conectar com o servidor.');
      setLogging(false);
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
    <>
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

      {error && <div className="login-error" role="alert">{error}</div>}
      {!error && !tokenTemporario && loginState?.sessionEnded && (
        <div className="login-info" role="status">
          {loginState.sessionEnded === 'expired'
            ? 'Sua sessão expirou. Entre novamente para continuar.'
            : 'Sua sessão deixou de ser válida. Entre novamente para continuar.'}
        </div>
      )}
      {infoMessage && <div className="login-info" role="status">{infoMessage}</div>}

      {!tokenTemporario && (
        <>
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
              disabled={logging}
              autoComplete="username"
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
              disabled={logging}
              autoComplete="current-password"
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
        </>
      )}

      {/* Código MFA */}
      {!mfaSetupData && (
        <>
          <div className="mfa-wrap">
            <span className="mfa-label">CÓDIGO MFA</span>
            {!tokenTemporario ? (
              <p className="mfa-hint" id="mfa-hint">
                Clique em Continuar para habilitar o código.
              </p>
            ) : (
              <div className="mfa" onPaste={!logging ? handleMfaPaste : undefined}>
                {mfa.map((val, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (mfaRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    disabled={logging}
                    onChange={(e) => handleMfaInput(idx, e.target.value)}
                    onKeyDown={(e) => handleMfaKeyDown(idx, e)}
                    aria-label={`Dígito MFA ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
          {tokenTemporario && (
            <button type="button" className="link forgot" onClick={reiniciarVerificacao} disabled={logging}>
              Reiniciar verificação
            </button>
          )}
        </>
      )}

      {/* Botão Submit */}
      <button type="submit" className="submit" disabled={logging || Boolean(mfaSetupData)}>
        {tokenTemporario
          ? (logging ? 'VALIDANDO CÓDIGO...' : 'CONFIRMAR CÓDIGO')
          : (logging ? 'VERIFICANDO CREDENCIAIS...' : 'CONTINUAR')}
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
          disabled={navigating || logging || mfaSetupLoading}
        >
          Cadastre-se
        </button>
      </p>
    </form>

      {/* Modal MFA Setup — QR Code + Chave Secreta */}
      {mfaSetupData && (
        <div
          className="mfa-setup-backdrop"
          onClick={() => { if (!mfaSetupLoading) reiniciarVerificacao(); }}
        >
          <div
            className="mfa-setup-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mfa-setup-title"
          >
            <button
              type="button"
              className="mfa-setup-close"
              onClick={reiniciarVerificacao}
              disabled={mfaSetupLoading}
              aria-label="Fechar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Ícone de Segurança */}
            <div className="mfa-setup-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
            </div>

            <h3 id="mfa-setup-title" className="mfa-setup-title">
              Configure o Google Authenticator
            </h3>
            <p className="mfa-setup-subtitle">
              Escaneie o QR Code abaixo no aplicativo <strong>Google Authenticator</strong> ou insira a chave manualmente.
            </p>

            {/* QR Code */}
            <div className="mfa-setup-qr-container">
              <div className="mfa-setup-qr-box">
                <QRCodeSVG
                  value={mfaSetupData.uriOtpauth}
                  size={180}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                  includeMargin={false}
                />
              </div>
            </div>

            {/* Chave Secreta */}
            <div className="mfa-setup-secret-section">
              <span className="mfa-setup-secret-label">CHAVE SECRETA</span>
              <div className="mfa-setup-secret-box">
                <code className="mfa-setup-secret-code">{mfaSetupData.segredo}</code>
                <button
                  type="button"
                  className={`mfa-setup-copy-btn ${secretCopied ? 'copied' : ''}`}
                  onClick={handleCopySecret}
                  title="Copiar chave"
                >
                  {secretCopied ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Separador */}
            <div className="mfa-setup-divider" />

            {/* Código de verificação */}
            <span className="mfa-setup-verify-label">CÓDIGO DE VERIFICAÇÃO</span>
            <p className="mfa-setup-verify-hint">
              Após configurar, insira o código de 6 dígitos gerado pelo app.
            </p>

            {mfaSetupError && (
              <div className="mfa-setup-error">{mfaSetupError}</div>
            )}

            <div className="mfa-setup-code-inputs" onPaste={handleMfaSetupPaste}>
              {mfaSetupCode.map((val, idx) => (
                <input
                  key={idx}
                  ref={(el) => (mfaSetupRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={val}
                  onChange={(e) => handleMfaSetupInput(idx, e.target.value)}
                  onKeyDown={(e) => handleMfaSetupKeyDown(idx, e)}
                  aria-label={`Dígito verificação ${idx + 1}`}
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            <button
              type="button"
              className="mfa-setup-confirm-btn"
              disabled={mfaSetupLoading}
              onClick={handleMfaSetupConfirm}
            >
              {mfaSetupLoading ? 'VERIFICANDO...' : 'CONFIRMAR E ENTRAR'}
            </button>
          </div>
        </div>
      )}

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
                    placeholder="ex: usuario@neocore.tech"
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
    </>
  );
}
