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
    value: 'R$ 3.240,00',
    description: '64,8% do orçamento de R$ 5.000',
    type: 'default',
    icon: 'sparkles',
  },
  {
    id: 'exclusoes',
    title: 'Exclusões em aberto',
    value: '6',
    description: '1 solicitação com prazo vencido',
    type: 'danger',
    icon: 'trash',
  },
  {
    id: 'expiracoes',
    title: 'Expirações em 7 dias',
    value: '128',
    description: '42 registros nas próximas 48h',
    type: 'default',
    icon: 'clock',
  },
  {
    id: 'alertas',
    title: 'Alertas ativos',
    value: '3',
    description: '1 crítico · 2 de atenção',
    type: 'warning',
    icon: 'bell',
  },
];

export const CONSUMPTION_DATA = {
  currentSpend: 3240,
  budgetTotal: 5000,
  percentageUsed: '64,8%',
  available: 'R$ 1.760',
  monthlyProjection: 'R$ 4.860 (97,2%)',
  dailyData: [
    { day: '08 out.', value: 190, label: '190', isToday: false },
    { day: '09 out.', value: 220, label: '220', isToday: false },
    { day: '10 out.', value: 260, label: '260', isToday: false },
    { day: '11 out.', value: 280, label: '280', isToday: false },
    { day: '12 out.', value: 310, label: '310', isToday: false },
    { day: '13 out.', value: 295, label: '295', isToday: false },
    { day: '14 out.', value: 355, label: '355', isToday: true },
  ],
  breakdown: [
    { label: 'Classificação', amount: 'R$ 1.620', percentage: '50% do consumo' },
    { label: 'Enriquecimento', amount: 'R$ 1.080', percentage: '33,3% do consumo' },
    { label: 'Conciliação', amount: 'R$ 540', percentage: '16,7% do consumo' },
  ],
};

export const ALERTS_DATA = [
  {
    id: 1,
    severity: 'Crítico',
    type: 'critical',
    title: 'Exclusão fora do prazo',
    description: 'EXC-1042 venceu há 1 dia e aguarda aprovação.',
    actionLabel: 'Revisar solicitação',
  },
  {
    id: 2,
    severity: 'Atenção',
    type: 'warning',
    title: 'Orçamento próximo do limite',
    description: 'A projeção de IA atinge 97,2% do orçamento mensal.',
    actionLabel: 'Ajustar limite de IA',
  },
  {
    id: 3,
    severity: 'Atenção',
    type: 'warning',
    title: 'Expirações em até 48h',
    description: '42 registros de leads atingirão o prazo de retenção.',
    actionLabel: 'Revisar registros',
  },
];

export const DELETION_REQUESTS = [
  {
    id: 'EXC-1042',
    scope: 'Ana S. · dados pessoais',
    deadline: '13 out.',
    isOverdue: true,
    status: 'Em aprovação',
    statusType: 'danger',
  },
  {
    id: 'EXC-1048',
    scope: 'Lote CRM · 24 registros',
    deadline: '15 out.',
    isOverdue: false,
    status: 'Processando',
    statusType: 'info',
  },
  {
    id: 'EXC-1051',
    scope: 'João M. · dados pessoais',
    deadline: '16 out.',
    isOverdue: false,
    status: 'Em validação',
    statusType: 'neutral',
  },
];

export const UPCOMING_EXPIRATIONS = [
  {
    id: 1,
    count: 42,
    title: 'Leads sem atividade',
    subtitle: 'Retenção de 180 dias · 15-16 out.',
    badge: 'Em até 48h',
    badgeType: 'urgent',
  },
  {
    id: 2,
    count: 54,
    title: 'Importações temporárias',
    subtitle: 'Retenção de 30 dias · 17-19 out.',
    badge: 'Em 3-5 dias',
    badgeType: 'medium',
  },
  {
    id: 3,
    count: 32,
    title: 'Anexos de conciliação',
    subtitle: 'Retenção de 90 dias · 20-21 out.',
    badge: 'Em 6-7 dias',
    badgeType: 'medium',
  },
];

export const AUDIT_LOGS = [
  {
    id: 1,
    time: '10:42',
    user: 'Carlos Lima',
    initials: 'CL',
    action: 'Atualizou limite de IA',
    resource: 'Orçamento mensal · R$ 5.000',
    origin: 'Aplicação',
    result: 'Concluído',
    resultType: 'success',
  },
  {
    id: 2,
    time: '10:18',
    user: 'Sistema',
    initials: 'SY',
    action: 'Iniciou exclusão de lote',
    resource: 'EXC-1048 · 24 registros',
    origin: 'Automação',
    result: 'Em execução',
    resultType: 'progress',
  },
  {
    id: 3,
    time: '09:56',
    user: 'Marina Souza',
    initials: 'MS',
    action: 'Criou solicitação de exclusão',
    resource: 'EXC-1051 · dados pessoais',
    origin: 'Aplicação',
    result: 'Registrado',
    resultType: 'registered',
  },
  {
    id: 4,
    time: '09:30',
    user: 'Sistema',
    initials: 'SY',
    action: 'Emitiu alerta de prazo',
    resource: 'EXC-1042 · aprovação pendente',
    origin: 'Automação',
    result: 'Registrado',
    resultType: 'registered',
  },
  {
    id: 5,
    time: '08:47',
    user: 'Carlos Lima',
    initials: 'CL',
    action: 'Exportou relatório de consumo',
    resource: 'Gastos de IA · outubro 2026',
    origin: 'Aplicação',
    result: 'Concluído',
    resultType: 'success',
  },
];
