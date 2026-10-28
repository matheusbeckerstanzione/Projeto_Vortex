import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    cpf: '',
    mfa: '',
  });
  const [aceiteTermos, setAceiteTermos] = useState(false);
  const [aceiteNovidades, setAceiteNovidades] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    document.body.classList.remove('dark-bg');
  }, []);

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  /* ---------- Submit (Modo MVP direto sem validação) ---------- */
  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (saving) return;
    setSaving(true);

    /* Sucesso direto → navega suavemente para o login */
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

  /* ---------- Navegação para Login ---------- */
  const handleGoToLogin = (e) => {
    e.preventDefault();
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
    <form className="card cad-card" ref={cardRef} onSubmit={handleSubmit} noValidate>
      <div className="cad-head">
        <h2>Seus dados</h2>
        <p>Todos os campos são obrigatórios.</p>
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
        <label htmlFor="cad-email">E-mail</label>
        <input
          id="cad-email"
          type="email"
          autoComplete="email"
          placeholder="voce@email.com"
          value={form.email}
          onChange={(e) => setField('email', e.target.value)}
          aria-invalid={!!errors.email}
        />
        {errors.email && <span className="cad-err">{errors.email}</span>}
      </div>

      {/* Linha com CPF e Código MFA lado a lado */}
      <div className="cad-row">
        <div className={`cad-field ${errors.cpf ? 'has-error' : ''}`}>
          <label htmlFor="cpf">CPF</label>
          <input
            id="cpf"
            type="text"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={form.cpf}
            onChange={(e) => setField('cpf', maskCpf(e.target.value))}
            aria-invalid={!!errors.cpf}
          />
          {errors.cpf && <span className="cad-err">{errors.cpf}</span>}
        </div>

        <div className={`cad-field ${errors.mfa ? 'has-error' : ''}`}>
          <label htmlFor="cad-mfa">Código MFA</label>
          <input
            id="cad-mfa"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={form.mfa}
            onChange={(e) => setField('mfa', e.target.value.replace(/\D/g, '').slice(0, 6))}
            aria-invalid={!!errors.mfa}
          />
          {errors.mfa && <span className="cad-err">{errors.mfa}</span>}
        </div>
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
        {saving ? 'SALVANDO...' : 'Salvar e continuar'}
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
  );
}
