import {
  KPI_CARDS,
  CONSUMPTION_DATA,
  ALERTS_DATA,
  DELETION_REQUESTS,
  UPCOMING_EXPIRATIONS,
  AUDIT_LOGS,
} from '../constants/governancaData';

export const governancaService = {
  getKpis: async () => {
    return Promise.resolve(KPI_CARDS);
  },

  getConsumptionData: async () => {
    return Promise.resolve(CONSUMPTION_DATA);
  },

  getAlerts: async () => {
    return Promise.resolve(ALERTS_DATA);
  },

  getDeletionRequests: async () => {
    return Promise.resolve(DELETION_REQUESTS);
  },

  getUpcomingExpirations: async () => {
    return Promise.resolve(UPCOMING_EXPIRATIONS);
  },

  getAuditLogs: async () => {
    return Promise.resolve(AUDIT_LOGS);
  },

  exportReport: async () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(
      JSON.stringify(
        {
          relatorio: 'Gastos de IA e Ciclo de Vida dos Dados - Governança',
          geradoEm: new Date().toISOString(),
          kpis: KPI_CARDS,
          consumo: CONSUMPTION_DATA,
          alertas: ALERTS_DATA,
          exclusoes: DELETION_REQUESTS,
          expiracoes: UPCOMING_EXPIRATIONS,
          logs: AUDIT_LOGS,
        },
        null,
        2
      )
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `relatorio_governanca_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    return true;
  },
};
