export const SIDEBAR_ITEMS = [
  { id: 'inicio', label: 'Início', path: '/' },
  { id: 'contatos', label: 'Contatos', path: '/contatos' },
  { id: 'importar', label: 'Importar', path: '/importar' },
  { id: 'segmentos', label: 'Segmentos', path: '/segmentos' },
  { id: 'governanca', label: 'Governança', path: '/governanca', active: true },
  { id: 'logs', label: 'Logs de auditoria', path: '/logs' },
];

export const KPI_CARDS = [
  {
    id: 'gastos',
    title: 'Gastos de IA no mês',
    value: 'R$ 0,00',
    description: '0% do orçamento de R$ 5.000',
    type: 'default',
    icon: 'sparkles',
  },
  {
    id: 'exclusoes',
    title: 'Exclusões em aberto',
    value: '0',
    description: 'Nenhuma solicitação pendente',
    type: 'default',
    icon: 'trash',
  },
  {
    id: 'expiracoes',
    title: 'Expirações em 7 dias',
    value: '0',
    description: 'Nenhum registro a expirar',
    type: 'default',
    icon: 'clock',
  },
  {
    id: 'alertas',
    title: 'Alertas ativos',
    value: '0',
    description: 'Conformidade em dia',
    type: 'default',
    icon: 'bell',
  },
];

export const CONSUMPTION_DATA = {
  currentSpend: 0,
  budgetTotal: 5000,
  percentageUsed: '0%',
  available: 'R$ 5.000',
  monthlyProjection: 'R$ 0,00 (0%)',
  dailyData: [],
  breakdown: [
    { label: 'Classificação', amount: 'R$ 0,00', percentage: '0% do consumo' },
    { label: 'Enriquecimento', amount: 'R$ 0,00', percentage: '0% do consumo' },
    { label: 'Conciliação', amount: 'R$ 0,00', percentage: '0% do consumo' },
  ],
};

export const ALERTS_DATA = [];

export const DELETION_REQUESTS = [];

export const UPCOMING_EXPIRATIONS = [];

export const AUDIT_LOGS = [];
