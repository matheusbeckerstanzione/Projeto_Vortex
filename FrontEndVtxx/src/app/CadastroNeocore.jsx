
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/cadastro.css';

/* ---------- Helper: Máscara CPF ---------- */
const maskCpf = (value) => {
  const d = value.replace(/\D/g, '').slice(0, 11);

  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};



const validCpf = (cpf) => {
  let numeros = ""

  // Pega somente os números do CPF
  for (let i = 0; i < cpf.length; i++) {
    if (cpf[i] >= "0" && cpf[i] <= "9") {
      numeros += cpf[i]
    }
  }

  if (numeros.length !== 11) {
    return false
  }



  // Verifica se todos os números são iguais
  let iguais = true

  for (let i = 1; i < numeros.length; i++) {
    if (numeros[i] !== numeros[0]) {
      iguais = false;
    }
  }

  if (iguais) {
    return false
  }


  //Calcula o primeiro digito
  let soma = 0

  for (let i = 0; i < 9; i++) {
    soma += Number(numeros[i]) * (10 - i)
  }


  let digito1 = (soma * 10) % 11

  if (digito1 == 10) {
    digito1 = 0
  }

  if (digito1 !== Number(numeros[9])) {
    return false
  }



  //Calcula o segundo digito
  soma = 0

  for (let i = 0; i < 10; i++) {
    soma += Number(numeros[i]) * (11 - i)
  }

  let digito2 = (soma * 10) % 11

  if (digito2 == 10) {
    digito2 = 0
  }

  if (digito2 !== Number(numeros[10])) {
    return false
  }

  return true
}



/* ---------- Validação do formulário ---------- */
const validarForm = (form, aceitaTermos) => {
  const erros = {}

  if (form.nome == "") {
    erros.nome = "Informe seu nome completo."
  }

  if (form.email == "") {
    erros.email = "Informe seu e-mail."
  } else if (!form.email.includes("@") || !form.email.includes(".")) {
    erros.email = "Informe um e-mail válido."
  }

  if (form.senha === '') {
    erros.senha = 'Informe sua senha.';
  } else if (form.senha.length < 8) {
    erros.senha = 'A senha deve ter pelo menos 8 caracteres.';
  }

  if (form.cpf == "") {
    erros.cpf = "Informe seu CPF."
  } else if (!validCpf(form.cpf)) {
    erros.cpf = "CPF inválido."
  }

  if (form.mfa.length !== 6) {
    erros.mfa = "O código MFA deve ter 6 números."
  }

  if (!aceitaTermos) {
    erros.termos = "Aceite os termos para continuar."
  }

  return erros
}


export default function CadastroNeocore() {
  const navigate = useNavigate();

  /* ---------- Dados do formulário ---------- */
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    cpf: '',
    mfa: '',
  });

  /* ---------- Consentimentos ---------- */
  const [aceiteTermos, setAceiteTermos] = useState(false);
  const [aceiteNovidades, setAceiteNovidades] = useState(false);

  /* ---------- Controle do formulário ---------- */
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  /* ---------- Atualização dos campos ---------- */
  const setField = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  /* ---------- Envio do formulário ---------- */
  const handleSubmit = async (ev) => {
    ev.preventDefault();

    if (saving) return;

    setSubmitError('');


    //Executa as validações 
    const erros = validarForm(form, aceiteTermos)


    //Mostra os erros na tela
    setErrors(erros)


    //Verifica se existe algum erro
    if (
      erros.nome ||
      erros.email ||
      erros.senha ||
      erros.cpf ||
      erros.mfa ||
      erros.termos
    ) {
      return
    }

    setSaving(true)

    try {
      alert("Cadastro validado com sucesso!")

      navigate('/login')
    } catch (error) {
      setSubmitError('Não foi possível realizar o cadastro.');
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Navegação para Login ---------- */
  const handleGoToLogin = (e) => {
    e.preventDefault();
    navigate('/login');
  };

  return (
    <form
      className="card cad-card"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="cad-head">
        <h2>Seus dados</h2>
        <p>Todos os campos são obrigatórios.</p>
      </div>

      {submitError && (
        <div className="login-error">
          {submitError}
        </div>
      )}

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

        {errors.nome && (
          <span className="cad-err">{errors.nome}</span>
        )}
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

        {errors.email && (
          <span className="cad-err">{errors.email}</span>
        )}
      </div>

      {/* Senha */}
      <div className={`cad-field ${errors.senha ? 'has-error' : ''}`}>
        <label htmlFor="cad-senha">Senha</label>

        <div className="cad-senha-container">
          <input
            id="cad-senha"
            type={mostrarSenha ? 'text' : 'password'}
            placeholder="Digite sua senha"
            autoComplete="new-password"
            value={form.senha}
            onChange={(e) => setField('senha', e.target.value)}
            aria-invalid={!!errors.senha}
          />

          <button
            type="button"
            className="cad-olho"
            onClick={() => setMostrarSenha(!mostrarSenha)}
            aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {mostrarSenha ? (
              // Ícone de olho aberto
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              // Ícone de olho fechado
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3l18 18" />
                <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a15.8 15.8 0 0 1-4 4.8" />
                <path d="M6.2 6.2C3.5 8 2 12 2 12s3.5 7 10 7a10.7 10.7 0 0 0 4-.8" />
              </svg>
            )}
          </button>
        </div>

        {errors.senha && (
          <span className="cad-err">{errors.senha}</span>
        )}
      </div>

      {/* CPF e Código MFA */}
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

          {errors.cpf && (
            <span className="cad-err">{errors.cpf}</span>
          )}
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
            onChange={(e) =>
              setField(
                'mfa',
                e.target.value.replace(/\D/g, '').slice(0, 6)
              )
            }
            aria-invalid={!!errors.mfa}
          />

          {errors.mfa && (
            <span className="cad-err">{errors.mfa}</span>
          )}
        </div>

      </div>

      {/* Termos e Privacidade */}
      <label className="cad-check">
        <input
          type="checkbox"
          checked={aceiteTermos}
          onChange={(e) => {
            setAceiteTermos(e.target.checked);

            if (errors.termos) {
              setErrors((prev) => ({
                ...prev,
                termos: '',
              }));
            }
          }}
        />

        <span className="cad-box" aria-hidden="true" />

        <span>
          Li e concordo com os{' '}
          <a href="#termos" className="link">Termos de Uso</a>
          {' '}e com a{' '}
          <a href="#privacidade" className="link">
            Política de Privacidade
          </a>.
        </span>
      </label>

      {errors.termos && (
        <span className="cad-err cad-err--check">
          {errors.termos}
        </span>
      )}

      {/* Recebimento de novidades */}
      <label className="cad-check">
        <input
          type="checkbox"
          checked={aceiteNovidades}
          onChange={(e) => setAceiteNovidades(e.target.checked)}
        />

        <span className="cad-box" aria-hidden="true" />

        <span>
          Aceito receber novidades e comunicações da NEOCORE (opcional).
        </span>
      </label>

      {/* Botão de cadastro */}
      <button
        type="submit"
        className="submit cad-submit"
        disabled={saving}
      >
        {saving ? 'SALVANDO...' : 'Salvar e continuar'}
      </button>

      {/* Acesso ao login */}
      <p className="signup" style={{ marginTop: '10px' }}>
        Já possui uma conta?{' '}

        <a
          href="/login"
          className="link"
          onClick={handleGoToLogin}
        >
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

        <span>
          Seus dados são tratados conforme a LGPD (Lei nº 13.709/2018).
        </span>
      </div>

    </form>
  );
}
