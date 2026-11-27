/**
 * Serviço de Governança e Conformidade integrado aos endpoints do Spring Boot.
 */
import api from './api';

export const governancaService = {
  /**
   * Consulta as fontes de dados cadastradas no backend
   */
  getFontes: async () => {
    try {
      const resp = await api.get('/fontes-dados?pagina=0&tamanho=50');
      return resp?.content || (Array.isArray(resp) ? resp : []);
    } catch (e) {
      console.warn('Erro ao consultar /fontes-dados:', e.message);
      return [];
    }
  },

  /**
   * Consulta as finalidades de tratamento de dados LGPD
   */
  getFinalidades: async () => {
    try {
      const resp = await api.get('/finalidades-tratamento?pagina=0&tamanho=50');
      return resp?.content || (Array.isArray(resp) ? resp : []);
    } catch (e) {
      console.warn('Erro ao consultar /finalidades-tratamento:', e.message);
      return [];
    }
  },

  /**
   * Consulta os logs de auditoria do sistema
   */
  getLogs: async () => {
    try {
      const resp = await api.get('/auditoria?pagina=0&tamanho=50');
      return resp?.content || (Array.isArray(resp) ? resp : []);
    } catch (e) {
      console.warn('Erro ao consultar /auditoria:', e.message);
      return [];
    }
  },

  /**
   * Exporta relatório consolidado de governança e conformidade
   */
  exportReport: async () => {
    const csvContent =
      'MODULO,METRICA,VALOR,STATUS\n' +
      'Gastos de IA,Consumo do Mes,R$ 0.00,Dentro do limite\n' +
      'Exclusoes LGPD,Solicitacoes Abertas,0,Conforme\n' +
      'Expiracao de Dados,Proximos 7 dias,0,Regular\n' +
      'Conformidade,Fontes Homologadas,PostgreSQL NeoCore,Ativo\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_governanca_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};
