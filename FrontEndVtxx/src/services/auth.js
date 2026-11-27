/**
 * Serviço de autenticação e sessão NeoCore integrado ao Spring Boot.
 */
import api, { authStorage, ApiError } from './api';

function postAuth(endpoint, body, timeoutMs = 20000) {
  return api.request(endpoint, {
    method: 'POST',
    body,
    authenticated: false,
    signal: AbortSignal.timeout(timeoutMs),
  });
}

function salvarSessao(dados) {
  if (!dados?.token) throw new ApiError(502, 'O servidor não confirmou a autenticação.');
  authStorage.setSession(dados.token, {
    id: dados.usuarioId,
    nome: dados.nome,
    perfil: dados.perfil,
    tipo: dados.tipo,
  }, dados.expiraEmSegundos);
}

/**
 * Passo 1 do login: valida credenciais no backend.
 * POST /autenticacao/login
 * Resposta: { autenticado: boolean, mfaNecessario: boolean, tokenTemporario: string, mensagem: string }
 */
export async function iniciarLogin(email, senha) {
  return postAuth('/autenticacao/login', {
    email: email.trim(),
    senha,
  }, 60000);
}

/**
 * Obter configuração/URI do Google Authenticator para novos usuários.
 * POST /autenticacao/mfa/configuracao
 * Resposta: { segredo: string, uriOtpauth: string }
 */
export async function obterConfiguracaoMfa(tokenTemporario) {
  return postAuth('/autenticacao/mfa/configuracao', { tokenTemporario });
}

/**
 * Passo 2 do login: valida o código de 6 dígitos gerado pelo Google Authenticator.
 * POST /autenticacao/mfa/confirmar
 * Resposta: { token: string, tipo: string, expiraEmSegundos: number, usuarioId: string, nome: string, perfil: string }
 */
export async function confirmarCodigoMfa(tokenTemporario, codigoTotp) {
  const payload = {
    tokenTemporario,
    codigo: String(codigoTotp).replace(/\D/g, ''),
  };

  const dados = await postAuth('/autenticacao/mfa/confirmar', payload);
  salvarSessao(dados);
  return dados;
}

/**
 * Fluxo integrado de autenticação com suporte a Google Authenticator (TOTP)
 */
export async function fazerLogin(email, senha, mfaCode, tokenTemporarioExistente = null) {
  let tokenTemp = tokenTemporarioExistente;
  try {
    const codigoLimpo = (mfaCode || '').replace(/\D/g, '');

    // Se ainda não temos um token temporário de um login anterior, inicia o login
    if (!tokenTemp) {
      const respLogin = await iniciarLogin(email, senha);

      // Se autenticou direto sem MFA
      if (respLogin?.autenticado && respLogin.token) {
        salvarSessao(respLogin);
        return { success: true, usuario: respLogin };
      }

      tokenTemp = respLogin?.tokenTemporario;
      if (!tokenTemp) throw new ApiError(502, 'O servidor não iniciou a verificação em duas etapas.');

      // Se é o primeiro login e precisa configurar o Google Authenticator
      let mfaSetup = null;
      if (respLogin.mensagem && respLogin.mensagem.toLowerCase().includes('configure')) {
        mfaSetup = await obterConfiguracaoMfa(tokenTemp);
      }

      // Se o usuário ainda não informou os 6 dígitos do Google Authenticator
      if (mfaSetup || codigoLimpo.length !== 6) {
        return {
          success: false,
          mfaPending: true,
          mfaSetup,
          tokenTemporario: tokenTemp,
          message: mfaSetup?.segredo
            ? `Primeiro acesso! Insira esta chave no Google Authenticator: ${mfaSetup.segredo}`
            : (respLogin.mensagem || 'Informe o código de 6 dígitos do Google Authenticator.'),
        };
      }
    }

    // Se o código não tem 6 dígitos
    if (codigoLimpo.length !== 6) {
      return {
        success: false,
        mfaPending: true,
        tokenTemporario: tokenTemp,
        message: 'O código MFA deve possuir exatamente 6 dígitos numéricos.',
      };
    }

    // Confirma o código do Google Authenticator com o backend
    const dadosAuth = await confirmarCodigoMfa(tokenTemp, codigoLimpo);

    return {
      success: true,
      usuario: dadosAuth,
    };
  } catch (error) {
    return {
      success: false,
      status: error.status,
      message: error.status === 401 && tokenTemp
        ? 'Código ou verificação inválida. Use um código novo ou reinicie a verificação.'
        : error.message || 'Falha ao autenticar. Verifique suas credenciais.',
    };
  }
}

/**
 * Encerra a sessão no backend e limpa armazenamento local.
 * POST /autenticacao/logout
 */
export async function fazerLogout() {
  const token = authStorage.getToken();
  try {
    await api.post('/autenticacao/logout');
  } catch {
    // Silencia erros caso o token já tenha expirado
  } finally {
    if (authStorage.getToken() === token) authStorage.clear();
  }
}

/**
 * Solicitação de acesso para novos usuários
 * POST /solicitacoes-acesso
 */
export async function solicitarAcesso(nome, email, justificativa) {
  return await api.post('/solicitacoes-acesso', {
    nome,
    email,
    justificativa: justificativa || 'Solicitação de acesso ao sistema NeoCore',
  });
}
