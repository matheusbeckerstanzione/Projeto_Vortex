import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { solicitarAcesso } from '../services/auth';
import '../styles/cadastro.css';

/* ---------- Helpers ---------- */
const maskCpf = (value) => {
  const d = value.replace(/\D/g, '').slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

export default function CadastroNeocore() {
  const navigate = useNavigate();
  const cardRef = useRef(null);

  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    cpf: '',
    justificativa: '',
  });
  const [aceiteTermos, setAceiteTermos] = useState(false);
  const [aceiteNovidades, setAceiteNovidades] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    document.body.classList.remove('dark-bg');
  }, []);

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  /* ---------- Submit: envia solicitação real para o backend ---------- */
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (saving) return;

    const newErrors = {};
    if (!form.nome.trim()) newErrors.nome = 'Informe seu nome completo';
    if (!form.email.trim()) {
      newErrors.email = 'Informe seu e-mail';
    } else if (!form.email.includes('@')) {
      newErrors.email = 'Informe um e-mail válido';
    }
    if (!form.senha) {
      newErrors.senha = 'Informe uma senha';
    } else if (form.senha.length < 6) {
      newErrors.senha = 'A senha deve ter pelo menos 6 caracteres';
    }
    if (!aceiteTermos) newErrors.termos = 'Você deve aceitar os termos de uso';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    setSubmitError('');

    try {
      await solicitarAcesso(form.nome, form.email, form.senha, form.justificativa);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err?.message || 'Falha ao enviar solicitação de acesso.');
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Navegação para Login ---------- */
  const handleGoToLogin = (e) => {
    if (e) e.preventDefault();
    if (navigating) return;
    setNavigating(true);

    const cardEl = cardRef.current;
    if (cardEl && cardEl.animate) {
      const anim = cardEl.animate(
        [
          { opacity: 1, transform: 'translateX(0)' },
          { opacity: 0, transform: 'translateX(16px)' },
        ],
        { duration: 200, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' }
      );
      anim.onfinish = () => navigate('/login');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="card cad-card" ref={cardRef}>
      {!submitted ? (
        <form onSubmit={handleSubmit} noValidate>
          <div className="cad-head">
            <h2>Solicitar Acesso</h2>
            <p>Preencha seus dados para solicitar acesso ao NeoCore.</p>
          </div>

          {submitError && <div className="login-error">{submitError}</div>}

          {/* Nome completo */}
          <div className={`cad-field ${errors.nome ? 'has-error' : ''}`}>
            <label htmlFor="nome">Nome completo</label>
            <input
              id="nome"
              type="text"
              autoComplete="name"
              placeholder="Como aparece no seu documento"
              value={form.nome}
              onChange={(e) => setField('nome', e.target.value)}
              aria-invalid={!!errors.nome}
            />
            {errors.nome && <span className="cad-err">{errors.nome}</span>}
          </div>

          {/* E-mail */}
          <div className={`cad-field ${errors.email ? 'has-error' : ''}`}>
            <label htmlFor="cad-email">E-mail corporativo</label>
            <input
              id="cad-email"
              type="email"
              autoComplete="email"
              placeholder="voce@empresa.com"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              aria-invalid={!!errors.email}
            />
            {errors.email && <span className="cad-err">{errors.email}</span>}
          </div>

          {/* Senha */}
          <div className={`cad-field ${errors.senha ? 'has-error' : ''}`}>
            <label htmlFor="cad-senha">Senha</label>
            <input
              id="cad-senha"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo de 6 caracteres"
              value={form.senha}
              onChange={(e) => setField('senha', e.target.value)}
              aria-invalid={!!errors.senha}
            />
            {errors.senha && <span className="cad-err">{errors.senha}</span>}
          </div>

          {/* CPF */}
          <div className="cad-field">
            <label htmlFor="cpf">CPF</label>
            <input
              id="cpf"
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={(e) => setField('cpf', maskCpf(e.target.value))}
            />
          </div>

          {/* Justificativa / Área de Atuação */}
          <div className="cad-field">
            <label htmlFor="justificativa">Área ou Finalidade do Acesso</label>
            <input
              id="justificativa"
              type="text"
              placeholder="Ex: Operações, Inteligência de Mercado, CRM"
              value={form.justificativa}
              onChange={(e) => setField('justificativa', e.target.value)}
            />
          </div>

          {/* Consentimentos */}
          <label className="cad-check">
            <input
              type="checkbox"
              checked={aceiteTermos}
              onChange={(e) => {
                setAceiteTermos(e.target.checked);
                if (errors.termos) setErrors((prev) => ({ ...prev, termos: '' }));
              }}
            />
            <span className="cad-box" aria-hidden="true" />
            <span>
              Li e concordo com os <a href="#termos" className="link">Termos de Uso</a> e com a{' '}
              <a href="#privacidade" className="link">Política de Privacidade</a>.
            </span>
          </label>
          {errors.termos && <span className="cad-err cad-err--check">{errors.termos}</span>}

          <label className="cad-check">
            <input
              type="checkbox"
              checked={aceiteNovidades}
              onChange={(e) => setAceiteNovidades(e.target.checked)}
            />
            <span className="cad-box" aria-hidden="true" />
            <span>Aceito receber novidades e comunicações da NEOCORE (opcional).</span>
          </label>

          <button type="submit" className="submit cad-submit" disabled={saving}>
            {saving ? 'ENVIANDO SOLICITAÇÃO...' : 'Solicitar acesso'}
          </button>

          <p className="signup" style={{ marginTop: '10px' }}>
            Já possui uma conta?{' '}
            <a href="/login" className="link" onClick={handleGoToLogin}>
              Fazer login
            </a>
          </p>

          {/* Aviso LGPD */}
          <div className="cad-notice" role="note">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            <span>Seus dados são tratados conforme a LGPD (Lei nº 13.709/2018).</span>
          </div>
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
            Solicitação Enviada!
          </h3>

          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: '0 0 20px' }}>
            Seu pedido de acesso para <strong>{form.email}</strong> foi registrado com sucesso no banco de dados. Um <strong>Administrador do NeoCore</strong> irá avaliar sua solicitação e atribuir seu perfil de acesso.
          </p>

          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '12px',
              fontSize: '12px',
              color: '#475569',
              marginBottom: '22px',
              textAlign: 'left',
            }}
          >
            <strong>Próximos passos:</strong> Assim que sua conta for ativada pelo Administrador, você poderá fazer login e configurar seu Google Authenticator no primeiro acesso.
          </div>

          <button
            type="button"
            className="submit cad-submit"
            onClick={handleGoToLogin}
          >
            IR PARA O LOGIN
          </button>
        </div>
      )}
    </div>
  );
}
