/**
 * Serviço de Inteligência Artificial (Chat de Marketing e Histórico)
 * Integrado ao backend NeoCore (POST /ia/chat e GET /ia/historico).
 */
import api from './api';

export const OPERACOES_IA = {
  RESUMIR: 'RESUMIR',
  PROPOR_CAMPANHA: 'PROPOR_CAMPANHA',
  ANALISAR_TENDENCIAS: 'ANALISAR_TENDENCIAS',
};

export const REGIOES_IA = ['BR', 'GLOBAL', 'US', 'GB', 'PT'];

export const iaService = {
  /**
   * Envia uma solicitação estruturada para o assistente de IA.
   * POST /ia/chat
   *
   * @param {Object} params
   * @param {'RESUMIR'|'PROPOR_CAMPANHA'|'ANALISAR_TENDENCIAS'} params.operacao
   * @param {string} params.pergunta
   * @param {string} [params.dadosPublicos]
   * @param {string} [params.finalidadeId]
   * @param {string} [params.tema]
   * @param {'GLOBAL'|'BR'|'US'|'GB'|'PT'} [params.regiao]
   * @param {number} [params.dias]
   * @param {Array} [params.referencias]
   * @param {boolean} [params.usarExemploFicticio=false]
   * @param {boolean} [params.salvarResumoPublico=false]
   */
  enviarMensagem: async (params) => {
    const operacao = params?.operacao || OPERACOES_IA.RESUMIR;
    const usarExemploFicticio =
      operacao === OPERACOES_IA.RESUMIR && Boolean(params?.usarExemploFicticio);

    if (usarExemploFicticio) {
      return await api.post('/ia/chat', {
        operacao,
        pergunta: params.pergunta,
        usarExemploFicticio: true,
      });
    }

    const payload = {
      operacao,
      pergunta: params.pergunta,
      usarExemploFicticio: false,
    };

    if (params.dadosPublicos?.trim()) {
      payload.dadosPublicos = params.dadosPublicos.trim();
      if (params.finalidadeId) {
        payload.finalidadeId = params.finalidadeId;
      }
    }

    if (params.tema?.trim()) {
      payload.tema = params.tema.trim();
    }

    if (operacao === OPERACOES_IA.ANALISAR_TENDENCIAS) {
      if (params.regiao) payload.regiao = params.regiao;
      if (params.dias !== undefined && params.dias !== null && params.dias !== '') {
        payload.dias = Number(params.dias);
      }
    }

    if (Array.isArray(params.referencias) && params.referencias.length > 0) {
      payload.referencias = params.referencias;
    }

    if (
      operacao === OPERACOES_IA.RESUMIR &&
      params.salvarResumoPublico &&
      payload.referencias?.length > 0 &&
      !payload.dadosPublicos &&
      !payload.finalidadeId
    ) {
      payload.salvarResumoPublico = true;
    }

    return await api.post('/ia/chat', payload);
  },

  /**
   * Retorna o histórico de análises de IA da conta autenticada.
   * GET /ia/historico
   */
  obterHistorico: async () => {
    try {
      const resp = await api.get('/ia/historico');
      return Array.isArray(resp) ? resp : resp?.content || [];
    } catch (e) {
      console.warn('Erro ao obter histórico de IA:', e.message);
      return [];
    }
  },
};

export default iaService;
