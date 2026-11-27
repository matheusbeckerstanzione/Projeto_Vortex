/**
 * Serviço de Usuários e Solicitações de Acesso integrado ao Spring Boot.
 */
import api from './api';

export const userService = {
  /**
   * Lista as solicitações de acesso pendentes e avaliadas
   * GET /solicitacoes-acesso
   */
  getSolicitacoes: async (pagina = 0, tamanho = 50) => {
    try {
      const resp = await api.get(`/solicitacoes-acesso?pagina=${pagina}&tamanho=${tamanho}`);
      return resp?.content || (Array.isArray(resp) ? resp : []);
    } catch (e) {
      console.warn('Erro ao consultar /solicitacoes-acesso:', e.message);
      return [];
    }
  },

  /**
   * Avalia uma solicitação de acesso (APROVADA ou REJEITADA)
   * PATCH /solicitacoes-acesso/{id}/avaliacao
   */
  avaliarSolicitacao: async (id, status) => {
    return await api.patch(`/solicitacoes-acesso/${id}/avaliacao`, {
      status, // "APROVADA" ou "REJEITADA"
    });
  },

  /**
   * Lista todos os usuários cadastrados no NeoCore
   * GET /usuarios
   */
  getUsuarios: async (pagina = 0, tamanho = 50) => {
    try {
      const resp = await api.get(`/usuarios?pagina=${pagina}&tamanho=${tamanho}`);
      return resp?.content || (Array.isArray(resp) ? resp : []);
    } catch (e) {
      console.warn('Erro ao consultar /usuarios:', e.message);
      return [];
    }
  },

  /**
   * Cadastra um novo usuário diretamente (pelo Admin)
   * POST /usuarios
   */
  cadastrarUsuario: async ({ nome, email, perfil }) => {
    return await api.post('/usuarios', {
      nome: nome.trim(),
      email: email.trim(),
      perfil, // "ADMINISTRADOR" ou "ANALISTA"
    });
  },

  /**
   * Altera o status de um usuário (ATIVO ou DESATIVADO)
   * PATCH /usuarios/{id}/status
   */
  alterarStatusUsuario: async (id, status) => {
    return await api.patch(`/usuarios/${id}/status`, {
      status, // "ATIVO" ou "DESATIVADO"
    });
  },

  /**
   * Gera um convite de ativação para um usuário
   * POST /convites
   */
  criarConvite: async (usuarioId, diasValidade = 7) => {
    const expiraEm = new Date(Date.now() + diasValidade * 24 * 60 * 60 * 1000).toISOString();
    return await api.post('/convites', {
      usuarioId,
      expiraEm,
    });
  },

  /**
   * Ativa a conta do usuário convidado definindo a senha inicial
   * POST /convites/ativar
   */
  ativarConta: async ({ token, senha }) => {
    return await api.post('/convites/ativar', {
      token: token.trim(),
      senha,
    });
  },
};
