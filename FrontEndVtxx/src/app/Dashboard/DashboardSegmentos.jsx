import React, { useState, useMemo } from 'react';
import '../../styles/DashboardSegmentos.css';

// Segmentos iniciais
const INITIAL_SEGMENTS = [
  {
    id: 1,
    name: 'Tecnologia · alto engajamento',
    criteria: 'Tecnologia E SaaS B2B E canal E-mail/engaj. alto',
    contactsCount: 324,
    status: 'Ativo',
    statusClass: 'active',
    updatedAt: '11/10/2026 08:42',
    description: 'Estimativa: 324 contatos únicos com atributos confirmados. Dados demonstrativos.',
    dynamicText: 'Dinâmico · 324 contatos ilustrativos · sincronização automática.',
    criteriaRules: [
      { field: 'Interesse', condition: 'contém Tecnologia' },
      { field: 'Categoria', condition: 'é igual a SaaS B2B' }
    ],
    channelRule: {
      header: 'E · Preferência de canal (OU)',
      value: 'E-mail OU WhatsApp · E engajamento Alto'
    },
    ruleNote: 'Engajamento alto = 3 ou mais interações em 30 dias. Somente atributos confirmados; cada contato é contado uma vez.',
    sources: [
      { name: 'CRM Salesforce', desc: 'Preferências declaradas · confiança 93%' },
      { name: 'Plataforma de campanhas', desc: 'Interações observadas · confiança 91%' }
    ],
    previewContacts: [
      { initials: 'MS', name: 'Mariana Souza', detail: 'E-mail · 5 interações · CRM 93%' },
      { initials: 'RA', name: 'Rafael Almeida', detail: 'WhatsApp · 4 interações · CRM 93%' },
      { initials: 'LF', name: 'Lucas Ferreira', detail: 'E-mail · 3 interações · campanhas 91%' }
    ]
  },
  {
    id: 2,
    name: 'Moda · preferência WhatsApp',
    criteria: 'Interesse Moda E canal WhatsApp',
    contactsCount: 18,
    status: 'Ativo',
    statusClass: 'active',
    updatedAt: '11/10/2026 08:42',
    description: 'Estimativa: 18 contatos com opt-in de WhatsApp ativo e interesse declarado em Moda.',
    dynamicText: 'Dinâmico · 18 contatos ilustrativos · sincronização automática.',
    criteriaRules: [
      { field: 'Interesse', condition: 'contém Moda e Vestuário' },
      { field: 'Canal', condition: 'preferência declarada WhatsApp' }
    ],
    channelRule: {
      header: 'Critério de Canal',
      value: 'WhatsApp comercial verificado'
    },
    ruleNote: 'Somente números com validação de formato e sem bloqueios no histórico.',
    sources: [
      { name: 'CRM Salesforce', desc: 'Opt-in registrado' }
    ],
    previewContacts: [
      { initials: 'CS', name: 'Camila Santos', detail: 'WhatsApp · 8 interações · CRM 96%' },
      { initials: 'BO', name: 'Beatriz Oliveira', detail: 'WhatsApp · 3 interações · CRM 90%' }
    ]
  },
  {
    id: 3,
    name: 'Casa · compras recorrentes',
    criteria: 'Categoria Casa E engajamento alto',
    contactsCount: 7,
    status: 'Ativo',
    statusClass: 'active',
    updatedAt: '11/10/2026 08:40',
    description: 'Estimativa: 7 contatos de alto ticket na categoria Casa e Decoração.',
    dynamicText: 'Dinâmico · 7 contatos ilustrativos · sincronização automática.',
    criteriaRules: [
      { field: 'Categoria', condition: 'é igual a Casa e Decoração' },
      { field: 'Compras', condition: 'recorrência mínima de 2 pedidos' }
    ],
    channelRule: {
      header: 'Critério Comportamental',
      value: 'Engajamento recente em campanhas de catálogo'
    },
    ruleNote: 'Contatos elegíveis para clube de fidelidade e benefícios exclusivos.',
    sources: [
      { name: 'ERP Omie', desc: 'Histórico fiscal de notas emitidas' }
    ],
    previewContacts: [
      { initials: 'RS', name: 'Rodrigo Silva', detail: 'E-mail · 3 compras · ERP 99%' }
    ]
  },
  {
    id: 4,
    name: 'Saúde · assinantes engajados',
    criteria: 'Interesse Saúde E canal E-mail',
    contactsCount: 128,
    status: 'Ativo',
    statusClass: 'active',
    updatedAt: '10/10/2026 16:15',
    description: 'Estimativa: 128 assinantes de conteúdos informativos da vertical Saúde & Bem-estar.',
    dynamicText: 'Dinâmico · 128 contatos ilustrativos · sincronização automática.',
    criteriaRules: [
      { field: 'Interesse', condition: 'contém Saúde e Medicina' },
      { field: 'Assinatura', condition: 'Newsletter semanal confirmada' }
    ],
    channelRule: {
      header: 'Preferência de Envio',
      value: 'E-mail com taxa de abertura > 40%'
    },
    ruleNote: 'Envios respeitando horários matinais em dias úteis.',
    sources: [
      { name: 'Importação CSV', desc: 'Base de assinantes do blog' }
    ],
    previewContacts: [
      { initials: 'FM', name: 'Felipe Mendes', detail: 'E-mail · 12 aberturas · CSV 95%' }
    ]
  },
  {
    id: 5,
    name: 'SaaS · público a explorar',
    criteria: 'Sem correspondências · amplie os filtros',
    contactsCount: 0,
    status: 'Sem resultados',
    statusClass: 'no-results',
    updatedAt: '09/10/2026 14:20',
    description: 'Nenhum contato encontrado com a combinação restritiva atual de critérios.',
    dynamicText: 'Estático · 0 contatos encontrados.',
    criteriaRules: [
      { field: 'Interesse', condition: 'contém SaaS Enterprise' },
      { field: 'Faturamento', condition: 'acima de R$ 50M' }
    ],
    channelRule: {
      header: 'Filtro Restritivo',
      value: 'Exige faturamento auditado e canal exclusivo'
    },
    ruleNote: 'Recomendação: Amplie os filtros para abranger empresas de médio porte.',
    sources: [
      { name: 'Base Pública', desc: 'Dados societários' }
    ],
    previewContacts: []
  },
  {
    id: 6,
    name: 'Nova campanha de tecnologia',
    criteria: 'Critérios em elaboração · não publicado',
    contactsCount: null,
    status: 'Rascunho',
    statusClass: 'draft',
    updatedAt: '09/10/2026 10:30',
    description: 'Rascunho em construção para o lançamento da nova suíte de produtos de IA.',
    dynamicText: 'Rascunho · Cálculo pausado.',
    criteriaRules: [
      { field: 'Interesse', condition: 'contém Inteligência Artificial' }
    ],
    channelRule: {
      header: 'Canais em Análise',
      value: 'Omnichannel (E-mail, WhatsApp, LinkedIn)'
    },
    ruleNote: 'Salve e ative o segmento para disparar o cálculo automático.',
    sources: [
      { name: 'CRM Salesforce', desc: 'Leads qualificados no inbound' }
    ],
    previewContacts: []
  }
];

export default function DashboardSegmentos({ onShowToast, onNavigateToContact }) {
  const [segments, setSegments] = useState(INITIAL_SEGMENTS);
  const [selectedSegmentId, setSelectedSegmentId] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeChip, setActiveChip] = useState(null);

  // Estados da Modal Criar Segmento com IA (1 a 7)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalState, setModalState] = useState(1); // 1 a 7
  const [segmentName, setSegmentName] = useState('Clientes B2B unificados');
  const [segmentPrompt, setSegmentPrompt] = useState(
    'Encontre clientes B2B com perfil unificado e vínculo no CRM Salesforce ou ERP Oracle para uma campanha por e-mail.'
  );
  const [excludeOptOut, setExcludeOptOut] = useState(true);
  const [excludeSemBase, setExcludeSemBase] = useState(true);
  const [targetCrm, setTargetCrm] = useState('CRM Salesforce');
  const [targetCampaign, setTargetCampaign] = useState('Público B2B · destino de exemplo');
  const [campaignName, setCampaignName] = useState('Relacionamento B2B · outubro/2026');
  const [enableAutomation, setEnableAutomation] = useState(true);

  // Segmento atualmente selecionado na lista
  const selectedSegment = useMemo(() => {
    return segments.find(s => s.id === selectedSegmentId) || segments[0];
  }, [segments, selectedSegmentId]);

  // Contagens dos KPIs
  const totalSaved = segments.length;
  const totalActive = segments.filter(s => s.status === 'Ativo').length;

  // Filtragem dos segmentos
  const filteredSegments = useMemo(() => {
    return segments.filter(seg => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matches =
          seg.name.toLowerCase().includes(term) ||
          seg.criteria.toLowerCase().includes(term);
        if (!matches) return false;
      }

      if (statusFilter !== 'ALL') {
        if (statusFilter === 'ativo' && seg.status !== 'Ativo') return false;
        if (statusFilter === 'rascunho' && seg.status !== 'Rascunho') return false;
        if (statusFilter === 'sem-resultados' && seg.status !== 'Sem resultados') return false;
      }

      if (activeChip) {
        if (activeChip === 'tecnologia' && !seg.name.toLowerCase().includes('tecnologia') && !seg.criteria.toLowerCase().includes('tecnologia')) {
          return false;
        }
        if (activeChip === 'email' && !seg.criteria.toLowerCase().includes('e-mail')) {
          return false;
        }
        if (activeChip === 'saas' && !seg.name.toLowerCase().includes('saas') && !seg.criteria.toLowerCase().includes('saas')) {
          return false;
        }
        if (activeChip === 'alto' && !seg.name.toLowerCase().includes('alto') && !seg.criteria.toLowerCase().includes('alto')) {
          return false;
        }
      }

      return true;
    });
  }, [segments, searchTerm, statusFilter, activeChip]);

  const handleOpenCreateModal = () => {
    setModalState(1);
    setIsModalOpen(true);
  };

  // Finalizar e salvar no Estado 7
  const handleFinishAndSaveSegment = () => {
    const newId = Date.now();
    const createdSegment = {
      id: newId,
      name: segmentName || 'Clientes B2B unificados',
      criteria: 'Status do perfil = Unificado E Tipo = Cliente B2B E Origem = CRM Salesforce OU ERP Oracle',
      contactsCount: 280,
      status: 'Ativo',
      statusClass: 'active',
      updatedAt: 'Hoje 11:30',
      description: 'Estimativa: 280 contatos com perfil conciliado e vínculo com o CRM ou o ERP · dados ilustrativos.',
      dynamicText: 'Dinâmico · 280 contatos elegíveis · sincronização automática.',
      criteriaRules: [
        { field: 'Status do perfil', condition: '= Unificado' },
        { field: 'Tipo de cliente', condition: '= Cliente B2B' },
        { field: 'Origem', condition: '= CRM Salesforce OU ERP Oracle' }
      ],
      channelRule: {
        header: 'Validação Jurídica Concluída',
        value: 'Excluídos 24 opt-outs e 20 registros sem base legal'
      },
      ruleNote: 'Contatos elegíveis e validados juridicamente para o canal E-mail com registro de consentimento auditado.',
      sources: [
        { name: targetCrm, desc: 'Público sincronizado' },
        { name: 'ERP Oracle', desc: 'Base conciliada' }
      ],
      previewContacts: [
        { initials: 'MS', name: 'Mariana Souza', detail: 'Mariana Souza Ltda · CRM Salesforce' },
        { initials: 'RA', name: 'Rafael Almeida', detail: 'Brasil Comércio · ERP Oracle' },
        { initials: 'LF', name: 'Lucas Ferreira', detail: 'Horizonte Tecnologia · CRM + ERP' }
      ]
    };

    setSegments(prev => [createdSegment, ...prev]);
    setSelectedSegmentId(newId);
    setIsModalOpen(false);
    if (onShowToast) onShowToast(`Segmento "${createdSegment.name}" adicionado e sincronizado com 280 contatos!`);
  };

  // Determinar qual etapa do stepper principal está ativa (1, 2 ou 3)
  const getActiveStepperStep = () => {
    if (modalState === 1 || modalState === 2 || modalState === 4) return 1; // Pedido e IA
    if (modalState === 3 || modalState === 5) return 2; // Checagem jurídica
    return 3; // Destinos e envio (6 e 7)
  };

  const activeStepper = getActiveStepperStep();

  return (
    <main className="segmentos-container">
      {/* ===== Header Principal ===== */}
      <div className="segmentos-page-header">
        <div className="segmentos-title-group">
          <h1 className="segmentos-page-title">Segmentos</h1>
          <p className="segmentos-page-subtitle">
            Organize contatos por critérios do perfil unificado e das fontes de origem.
          </p>
        </div>

        <div className="segmentos-header-actions">
          <button
            className="segmentos-btn-secondary"
            onClick={() => onShowToast && onShowToast('Exportando catálogo de segmentos...')}
          >
            Exportar
          </button>
          <button className="segmentos-btn-primary" onClick={handleOpenCreateModal}>
            Novo segmento
          </button>
        </div>
      </div>

      {/* ===== Banner de Aviso Superior ===== */}
      <div className="segmentos-info-banner">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>
          Demonstração · segmentos, contagens e datas ilustrativos. Não representa aprovação legal real nem envio de campanha.
        </span>
      </div>

      {/* ===== Grid de 3 Cards de Métricas (KPIs) ===== */}
      <div className="segmentos-kpis-grid">
        <div className="segmentos-kpi-card">
          <div className="segmentos-kpi-top">
            <span className="segmentos-kpi-label">Segmentos salvos</span>
          </div>
          <div className="segmentos-kpi-value">{totalSaved}</div>
          <div className="segmentos-kpi-sub">Critérios reutilizáveis para sua operação.</div>
        </div>

        <div className="segmentos-kpi-card">
          <div className="segmentos-kpi-top">
            <span className="segmentos-kpi-label">Segmentos ativos</span>
          </div>
          <div className="segmentos-kpi-value">{totalActive}</div>
          <div className="segmentos-kpi-sub">Atualização após a sincronização das fontes.</div>
        </div>

        <div className="segmentos-kpi-card">
          <div className="segmentos-kpi-top">
            <span className="segmentos-kpi-label">Outros estados</span>
          </div>
          <div className="segmentos-kpi-value-text">1 rascunho · 1 pausado</div>
          <div className="segmentos-kpi-sub">Rascunhos não calculam contatos.</div>
        </div>
      </div>

      {/* ===== Grid em Duas Colunas ===== */}
      <div className="segmentos-columns-grid">
        {/* ===== Coluna Esquerda: Todos os Segmentos ===== */}
        <div className="segmentos-col-left">
          <section className="segmentos-card">
            <div className="segmentos-card-header">
              <h3 className="segmentos-card-title">Todos os segmentos</h3>
              <span className="segmentos-count-label">{filteredSegments.length} segmentos</span>
            </div>

            {/* Campo de Busca */}
            <div className="segmentos-search-box">
              <svg className="segmentos-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por nome, interesse ou categoria"
                className="segmentos-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filtros Dropdowns */}
            <div className="segmentos-filters-row">
              <select
                className="segmentos-select"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                <option value="ALL">Todas as fontes</option>
                <option value="crm">CRM Salesforce</option>
                <option value="campanhas">Plataforma de campanhas</option>
                <option value="erp">ERP Omie</option>
              </select>

              <select
                className="segmentos-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">Todos os estados</option>
                <option value="ativo">Ativo</option>
                <option value="rascunho">Rascunho</option>
                <option value="sem-resultados">Sem resultados</option>
              </select>
            </div>

            {/* Chips Rápidos */}
            <div className="segmentos-chips-row">
              <button
                className={`segmentos-chip ${activeChip === 'tecnologia' ? 'active' : ''}`}
                onClick={() => setActiveChip(activeChip === 'tecnologia' ? null : 'tecnologia')}
              >
                Tecnologia ▾
              </button>
              <button
                className={`segmentos-chip ${activeChip === 'email' ? 'active' : ''}`}
                onClick={() => setActiveChip(activeChip === 'email' ? null : 'email')}
              >
                E-mail ▾
              </button>
              <button
                className={`segmentos-chip ${activeChip === 'saas' ? 'active' : ''}`}
                onClick={() => setActiveChip(activeChip === 'saas' ? null : 'saas')}
              >
                SaaS B2B ▾
              </button>
              <button
                className={`segmentos-chip ${activeChip === 'alto' ? 'active' : ''}`}
                onClick={() => setActiveChip(activeChip === 'alto' ? null : 'alto')}
              >
                Alto ▾
              </button>
            </div>

            {/* Tabela de Segmentos */}
            <div className="segmentos-table-wrap">
              <table className="segmentos-table">
                <thead>
                  <tr>
                    <th>SEGMENTO / CRITÉRIOS</th>
                    <th>CONTATOS</th>
                    <th>ESTADO</th>
                    <th>ATUALIZAÇÃO</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSegments.map((seg) => (
                    <tr
                      key={seg.id}
                      className={`segment-row ${selectedSegmentId === seg.id ? 'selected' : ''}`}
                      onClick={() => setSelectedSegmentId(seg.id)}
                    >
                      <td className="td-segment-info">
                        <h4 className="segment-row-title">{seg.name}</h4>
                        <p className="segment-row-criteria">{seg.criteria}</p>
                      </td>
                      <td className="td-segment-contacts">
                        {seg.contactsCount !== null ? seg.contactsCount : '—'}
                      </td>
                      <td className="td-segment-status">
                        {seg.status === 'Ativo' && (
                          <span className="seg-pill green">
                            <span className="dot" /> Ativo
                          </span>
                        )}
                        {seg.status === 'Sem resultados' && (
                          <span className="seg-pill gray">Sem resultados</span>
                        )}
                        {seg.status === 'Rascunho' && (
                          <span className="seg-pill gray">Rascunho</span>
                        )}
                      </td>
                      <td className="td-segment-date">{seg.updatedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Rodapé da Tabela */}
            <div className="segmentos-table-footer">
              <div className="footer-tip">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
                <span>Selecione um segmento ou crie um novo público.</span>
              </div>
              <div className="footer-pagination">
                <span>1–{filteredSegments.length} de {filteredSegments.length} segmentos</span>
                <button className="pagination-link">Página 1 de 1</button>
              </div>
            </div>

            <p className="segmentos-fine-note">
              Um contato pode pertencer a mais de um segmento. As contagens não devem ser somadas.
            </p>
          </section>
        </div>

        {/* ===== Coluna Direita: Detalhes do Segmento Selecionado ===== */}
        <div className="segmentos-col-right">
          <section className="segmentos-card">
            <div className="segmentos-card-header">
              <h3 className="segmentos-card-title">Detalhes do segmento</h3>
              <button
                className="seg-edit-btn"
                onClick={() => onShowToast && onShowToast('Abrindo editor de regras...')}
              >
                Editar
              </button>
            </div>

            {/* Cabeçalho do Segmento Selecionado */}
            <div className="selected-seg-heading">
              <h2 className="selected-seg-name">{selectedSegment.name}</h2>
              <p className="selected-seg-desc">{selectedSegment.description}</p>
              <div className="selected-seg-meta">
                {selectedSegment.status === 'Ativo' && (
                  <span className="seg-pill green">
                    <span className="dot" /> Ativo
                  </span>
                )}
                <span className="selected-seg-dynamic-text">
                  {selectedSegment.dynamicText}
                </span>
              </div>
            </div>

            {/* Critérios E / OU */}
            <div className="criteria-section">
              <div className="criteria-header">
                <h4 className="criteria-title">Critérios de inclusão</h4>
                <p className="criteria-subtitle">
                  Todas as condições (E) · qualquer uma das origens (OU).
                </p>
              </div>

              <div className="criteria-rules-list">
                {selectedSegment.criteriaRules.map((rule, idx) => (
                  <div key={idx} className="criteria-rule-box">
                    <span className="criteria-rule-field">{rule.field}</span>
                    <strong className="criteria-rule-cond">{rule.condition}</strong>
                  </div>
                ))}

                {selectedSegment.channelRule && (
                  <div className="criteria-channel-box">
                    <span className="criteria-channel-header">
                      {selectedSegment.channelRule.header}
                    </span>
                    <strong className="criteria-channel-val">
                      {selectedSegment.channelRule.value}
                    </strong>
                  </div>
                )}
              </div>

              <p className="criteria-explanation-note">
                {selectedSegment.ruleNote}
              </p>
            </div>

            {/* Fontes de Dados */}
            <div className="seg-sources-section">
              <h4 className="seg-sources-title">Fontes de dados</h4>
              <div className="seg-sources-list">
                {selectedSegment.sources.map((src, idx) => (
                  <div key={idx} className="seg-source-item">
                    <div className="seg-source-left">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                      </svg>
                      <span className="seg-source-name">{src.name}</span>
                    </div>
                    <span className="seg-source-desc">{src.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Prévia dos Contatos */}
            <div className="seg-preview-section">
              <div className="seg-preview-header">
                <div>
                  <h4 className="seg-preview-title">Prévia dos contatos</h4>
                  <p className="seg-preview-sub">
                    {selectedSegment.criteria}
                  </p>
                </div>
                <button
                  className="seg-preview-link"
                  onClick={() => onShowToast && onShowToast('Exibindo todos os contatos do segmento.')}
                >
                  Ver todos ({selectedSegment.contactsCount || 0} ilustrativos)
                </button>
              </div>

              <div className="seg-preview-list">
                {selectedSegment.previewContacts.length > 0 ? (
                  selectedSegment.previewContacts.map((c, i) => (
                    <div key={i} className="seg-preview-item">
                      <div className="seg-preview-left">
                        <div className="seg-contact-avatar">{c.initials}</div>
                        <div className="seg-contact-info">
                          <strong className="seg-contact-name">{c.name}</strong>
                          <span className="seg-contact-detail">{c.detail}</span>
                        </div>
                      </div>
                      <span className="seg-contact-confirmed">
                        Confirmado &gt;
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="seg-preview-empty">
                    Nenhum contato encontrado para a prévia deste segmento.
                  </div>
                )}
              </div>
            </div>

            {/* Rodapé do Segmento */}
            <div className="selected-seg-footer">
              <div className="seg-footer-calc">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                <span>Último cálculo: 11/10/2026, às 08:42</span>
              </div>
              <p className="seg-footer-warning">
                Prévia demonstrativa. Salvar preserva os critérios; exportar exige revisão de consentimento e opt-out.
              </p>
              <div className="seg-footer-actions">
                <button
                  className="seg-action-link"
                  onClick={() => onShowToast && onShowToast('Critérios do segmento salvos!')}
                >
                  Salvar segmento
                </button>
                <button
                  className="seg-action-link"
                  onClick={() => onShowToast && onShowToast('Iniciando exportação da lista de contatos...')}
                >
                  Exportar contatos
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ===== Card Inferior: Fluxo de Campanha ===== */}
      <section className="segmentos-card feedback-states-card">
        <h4 className="feedback-card-title">Fluxo de campanha</h4>
        <p className="feedback-note">
          Grupo de campanha → Pedido e proposta da IA → Checagem jurídica → CRM e campanhas
        </p>
        <p className="feedback-subnote">
          Em caso de pendência: revisar público, gerar nova proposta e checar novamente.
        </p>
      </section>

      {/* ==========================================================================
          MODAL INTERATIVO COMPLETO: CRIAR SEGMENTO COM IA (7 ESTADOS)
         ========================================================================== */}
      {isModalOpen && (
        <div className="seg-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="seg-modal-container" onClick={(e) => e.stopPropagation()}>
            {/* Header com Tags de Estado */}
            <div className="seg-modal-header">
              <div className="modal-header-top">
                <div className="modal-tag-group">
                  <span className="modal-tag-demo">Demonstração</span>
                  <span className="modal-tag-state">Estado {modalState} de 7 · Segmentos</span>
                </div>
                <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                  ×
                </button>
              </div>

              {/* Título dinâmico por Estado */}
              {modalState === 1 && (
                <>
                  <h3 className="modal-title">Criar segmento com IA</h3>
                  <p className="modal-subtitle">
                    Descreva o público. A IA organiza os critérios e explica cada regra.
                  </p>
                </>
              )}

              {modalState === 2 && (
                <>
                  <h3 className="modal-title">Revisar proposta da IA</h3>
                  <p className="modal-subtitle-bold">{segmentName}</p>
                </>
              )}

              {modalState === 3 && (
                <>
                  <h3 className="modal-title">Checagem jurídica — pendências</h3>
                  <p className="modal-subtitle-bold">{segmentName}</p>
                </>
              )}

              {modalState === 4 && (
                <>
                  <h3 className="modal-title">Revisar segmento</h3>
                  <p className="modal-subtitle-bold">{segmentName}</p>
                </>
              )}

              {modalState === 5 && (
                <>
                  <h3 className="modal-title">Checagem jurídica — público elegível</h3>
                  <p className="modal-subtitle-bold">{segmentName}</p>
                </>
              )}

              {modalState === 6 && (
                <>
                  <h3 className="modal-title">Enviar para CRM e campanhas</h3>
                  <p className="modal-subtitle-bold">{segmentName}</p>
                </>
              )}

              {modalState === 7 && (
                <>
                  <h3 className="modal-title">Envio concluído — demonstração</h3>
                  <p className="modal-subtitle-bold">{segmentName}</p>
                </>
              )}
            </div>

            {/* Stepper com 3 Etapas Globais */}
            <div className="modal-stepper">
              <div className={`step-item ${activeStepper >= 1 ? 'active' : ''} ${activeStepper > 1 ? 'completed' : ''}`}>
                <span className="step-number">1</span>
                <span className="step-text">Pedido e IA</span>
              </div>
              <div className={`step-item ${activeStepper >= 2 ? 'active' : ''} ${activeStepper > 2 ? 'completed' : ''}`}>
                <span className="step-number">2</span>
                <span className="step-text">Checagem jurídica</span>
              </div>
              <div className={`step-item ${activeStepper === 3 ? 'active' : ''}`}>
                <span className="step-number">3</span>
                <span className="step-text">Destinos e envio</span>
              </div>
            </div>

            {/* ==================== ESTADO 1 DE 7: Formulário Inicial ==================== */}
            {modalState === 1 && (
              <div className="modal-content-state">
                <div className="modal-field-group">
                  <label className="modal-label">Nome do segmento</label>
                  <input
                    type="text"
                    className="modal-input"
                    value={segmentName}
                    onChange={(e) => setSegmentName(e.target.value)}
                    placeholder="Clientes B2B unificados"
                  />
                </div>

                <div className="modal-field-group">
                  <label className="modal-label">Qual público você quer encontrar?</label>
                  <textarea
                    className="modal-textarea"
                    rows="3"
                    value={segmentPrompt}
                    onChange={(e) => setSegmentPrompt(e.target.value)}
                  />
                  <span className="modal-helper-text">
                    Informe perfil, tipo de cliente, fontes e canal. Você poderá revisar a proposta antes de continuar.
                  </span>
                </div>

                <div className="modal-sources-considered">
                  <div className="sources-considered-header">
                    <span className="sources-considered-title">Fontes consideradas</span>
                  </div>
                  <div className="sources-considered-item">
                    <div className="source-cons-left">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                      </svg>
                      <strong className="source-cons-name">CRM Salesforce</strong>
                    </div>
                    <span className="source-cons-tag">Selecionada</span>
                  </div>
                  <span className="sources-considered-note">
                    A busca usa o perfil unificado. Um contato com as duas fontes será contado apenas uma vez.
                  </span>
                </div>

                <div className="modal-info-box-blue">
                  <div className="modal-box-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  </div>
                  <div className="modal-box-text">
                    <h5 className="modal-box-title">Critérios não são autorização de campanha</h5>
                    <p className="modal-box-desc">
                      A IA não escolhe nem cria uma base legal. Base registrada na origem e opt-out serão verificados na etapa jurídica, para o canal e-mail.
                    </p>
                  </div>
                </div>

                <div className="modal-footer-row">
                  <button className="modal-btn-cancel" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </button>
                  <button className="modal-btn-primary" onClick={() => setModalState(2)}>
                    Gerar segmento
                  </button>
                </div>
                <p className="modal-disclaimer">
                  Cenário ilustrativo. Nenhum dado será transmitido e nenhuma campanha será disparada.
                </p>
              </div>
            )}

            {/* ==================== ESTADO 2 DE 7: Proposta da IA ==================== */}
            {modalState === 2 && (
              <div className="modal-content-state">
                <div className="modal-pedido-box">
                  <span className="modal-pedido-label">Pedido original</span>
                  <p className="modal-pedido-text">{segmentPrompt}</p>
                </div>

                <div className="modal-criteria-section">
                  <span className="modal-criteria-heading">Critérios de inclusão</span>
                  <span className="modal-criteria-sub">Todas as condições (E) · qualquer uma das origens (OU).</span>

                  <div className="modal-rules-group">
                    <div className="modal-rule-row">
                      <span className="rule-symbol">E</span>
                      <div className="rule-info">
                        <strong className="rule-title">Status do perfil = Unificado</strong>
                        <p className="rule-sub">Reúne registros conciliados em um perfil único, sem duplicar contatos.</p>
                      </div>
                    </div>

                    <div className="modal-rule-row">
                      <span className="rule-symbol">E</span>
                      <div className="rule-info">
                        <strong className="rule-title">Tipo de cliente = Cliente B2B</strong>
                        <p className="rule-sub">Restringe o público a clientes de empresas, como solicitado.</p>
                      </div>
                    </div>

                    <div className="modal-rule-row">
                      <span className="rule-symbol">E</span>
                      <div className="rule-info">
                        <strong className="rule-title">Origem = CRM Salesforce OU ERP Oracle</strong>
                        <p className="rule-sub">Inclui o perfil vinculado a pelo menos uma das duas fontes.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Box de Contatos Encontrados */}
                <div className="modal-count-box">
                  <div className="count-box-left">
                    <span className="count-number">324</span>
                    <div className="count-info">
                      <strong>Contatos encontrados - perfis únicos</strong>
                      <p>Contados uma única vez, inclusive quando vinculados às duas origens.</p>
                    </div>
                  </div>
                  <span className="count-badge-pending">Ainda não checados</span>
                </div>

                {/* Prévia breve */}
                <div className="modal-mini-preview">
                  <span className="mini-preview-title">Prévia breve · dados ilustrativos</span>
                  <div className="mini-preview-list">
                    <div className="mini-preview-item">
                      <div className="mini-item-left">
                        <strong>Mariana Souza</strong>
                        <span>Mariana Souza Ltda · Unificado · Cliente B2B</span>
                      </div>
                      <span className="mini-item-source">CRM Salesforce</span>
                    </div>
                    <div className="mini-preview-item">
                      <div className="mini-item-left">
                        <strong>Rafael Almeida</strong>
                        <span>Brasil Comércio · Unificado · Cliente B2B</span>
                      </div>
                      <span className="mini-item-source">ERP Oracle</span>
                    </div>
                    <div className="mini-preview-item">
                      <div className="mini-item-left">
                        <strong>Lucas Ferreira</strong>
                        <span>Horizonte Tecnologia · Unificado · Cliente B2B</span>
                      </div>
                      <span className="mini-item-source">CRM + ERP</span>
                    </div>
                  </div>
                </div>

                <div className="modal-info-box-blue">
                  <div className="modal-box-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  </div>
                  <p className="modal-box-desc">
                    Os 324 contatos atendem aos critérios, mas ainda não são um público elegível. A próxima etapa verifica base legal registrada e opt-out de e-mail.
                  </p>
                </div>

                <div className="modal-footer-row">
                  <button className="modal-btn-cancel" onClick={() => setModalState(1)}>
                    Ajustar pedido
                  </button>
                  <button className="modal-btn-primary" onClick={() => setModalState(3)}>
                    Checagem jurídica
                  </button>
                </div>
                <p className="modal-disclaimer">
                  Cenário ilustrativo. Nenhum dado será transmitido e nenhuma campanha será disparada.
                </p>
              </div>
            )}

            {/* ==================== ESTADO 3 DE 7: Checagem Jurídica — Pendências ==================== */}
            {modalState === 3 && (
              <div className="modal-content-state">
                {/* Alerta Vermelho de Envio Bloqueado */}
                <div className="modal-alert-box red">
                  <div className="alert-icon-red">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <div className="alert-content">
                    <strong className="alert-title">Envio bloqueado · 20 registros sem base legal</strong>
                    <p className="alert-desc">
                      A proposta contém registros sem base legal documentada para e-mail. Revise o público para excluí-los antes de uma nova checagem.
                    </p>
                  </div>
                </div>

                {/* 3 Cards de Métricas */}
                <div className="modal-stat-cards-grid three-cols">
                  <div className="modal-stat-card">
                    <span className="stat-card-num">324</span>
                    <span className="stat-card-label">Encontrados</span>
                  </div>
                  <div className="modal-stat-card">
                    <span className="stat-card-num">24</span>
                    <span className="stat-card-label">Opt-outs excluídos</span>
                  </div>
                  <div className="modal-stat-card red-highlight">
                    <span className="stat-card-num text-red">20</span>
                    <span className="stat-card-label">Sem base legal</span>
                  </div>
                </div>

                {/* Resultado por canal */}
                <div className="modal-channel-results">
                  <div className="channel-results-header">
                    <strong>Resultado por canal</strong>
                    <div className="channel-subhead">
                      <span>E-mail · 324 perfis únicos</span>
                      <span className="badge-warning-pill">Pendências</span>
                    </div>
                  </div>

                  <div className="channel-results-table">
                    <div className="channel-res-row">
                      <span className="res-row-label">Opt-out</span>
                      <span className="res-row-val">24 excluídos obrigatoriamente. Solicitação de não receber comunicações respeitada.</span>
                    </div>
                    <div className="channel-res-row">
                      <span className="res-row-label">Base legal registrada</span>
                      <span className="res-row-val">280 com documentação na origem, entre os 300 perfis sem opt-out.</span>
                    </div>
                    <div className="channel-res-row">
                      <span className="res-row-label">Base legal ausente</span>
                      <span className="res-row-val">20 sem evidência registrada na origem para e-mail. Permanecem bloqueados nesta proposta.</span>
                    </div>
                    <div className="channel-res-row">
                      <span className="res-row-label">Outros canais</span>
                      <span className="res-row-val">Não avaliados. Esta checagem se limita ao canal e-mail.</span>
                    </div>
                  </div>
                </div>

                <p className="modal-explanation-small">
                  Os grupos são distintos nesta demonstração: 324 perfis únicos – 24 opt-outs = 300 para verificação da base. Destes, 20 têm pendência. Não há soma de perfis duplicados.
                </p>

                <div className="modal-info-box-blue">
                  <div className="modal-box-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  </div>
                  <div className="modal-box-text">
                    <h5 className="modal-box-title">A checagem não é um parecer jurídico</h5>
                    <p className="modal-box-desc">
                      A IA não define base legal. Conciliação e sincronização não autorizam campanhas. Os 24 opt-outs já estão fora do público, não são uma falha que possa ser ignorada.
                    </p>
                  </div>
                </div>

                <div className="modal-footer-row">
                  <button className="modal-btn-cancel" onClick={() => setModalState(2)}>
                    Voltar
                  </button>
                  <button className="modal-btn-primary" onClick={() => setModalState(4)}>
                    Revisar público
                  </button>
                </div>
                <p className="modal-disclaimer">
                  Checagem de demonstração. Nenhuma ação permite ignorar opt-out ou liberar registros sem base legal.
                </p>
              </div>
            )}

            {/* ==================== ESTADO 4 DE 7: Revisar Segmento (Exclusões) ==================== */}
            {modalState === 4 && (
              <div className="modal-content-state">
                {/* Alerta Âmbar */}
                <div className="modal-alert-box amber">
                  <div className="alert-icon-amber">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <div className="alert-content">
                    <strong className="alert-title">Ajuste o público, não as evidências legais</strong>
                    <p className="alert-desc">
                      20 registros estão sem base legal para e-mail. Excluí-los do envio não regulariza seus cadastros nem cria documentação na origem.
                    </p>
                  </div>
                </div>

                <div className="modal-pedido-box">
                  <span className="modal-pedido-label">Pedido original</span>
                  <p className="modal-pedido-text">{segmentPrompt}</p>
                </div>

                <div className="modal-criteria-section">
                  <span className="modal-criteria-heading">Critérios de inclusão</span>
                  <span className="modal-criteria-sub">Todas as condições (E) · qualquer uma das origens (OU).</span>

                  <div className="modal-rules-group">
                    <div className="modal-rule-row">
                      <span className="rule-symbol">E</span>
                      <div className="rule-info">
                        <strong className="rule-title">Status do perfil = Unificado</strong>
                      </div>
                    </div>
                    <div className="modal-rule-row">
                      <span className="rule-symbol">E</span>
                      <div className="rule-info">
                        <strong className="rule-title">Tipo de cliente = Cliente B2B</strong>
                      </div>
                    </div>
                    <div className="modal-rule-row">
                      <span className="rule-symbol">E</span>
                      <div className="rule-info">
                        <strong className="rule-title">Origem = CRM Salesforce OU ERP Oracle</strong>
                      </div>
                    </div>
                  </div>

                  {/* Caixas de Seleção de Exclusão */}
                  <div className="modal-exclusion-boxes">
                    <div className="exclusion-card">
                      <label className="exclusion-label">
                        <input
                          type="checkbox"
                          checked={excludeOptOut}
                          onChange={() => {}}
                          disabled
                        />
                        <div className="exclusion-text">
                          <strong>Excluir os 24 perfis com opt-out</strong>
                          <p>Exclusão obrigatória para e-mail. Não pode ser desmarcada.</p>
                        </div>
                      </label>
                      <span className="exclusion-badge-obrig">Obrigatório</span>
                    </div>

                    <div className="exclusion-card">
                      <label className="exclusion-label">
                        <input
                          type="checkbox"
                          checked={excludeSemBase}
                          onChange={(e) => setExcludeSemBase(e.target.checked)}
                        />
                        <div className="exclusion-text">
                          <strong>Excluir os 20 registros sem base legal registrada</strong>
                          <p>Opção selecionada para esta nova proposta. Os registros continuam pendentes na origem.</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Box de Perfis Previstos */}
                <div className="modal-count-box blue-theme">
                  <div className="count-box-left">
                    <span className="count-number">280</span>
                    <div className="count-info">
                      <strong>Perfis previstos para a nova checagem</strong>
                      <p>324 encontrados – 24 opt-outs – 20 sem base legal = 280.</p>
                    </div>
                  </div>
                  <span className="count-badge-pending">Ainda não liberados</span>
                </div>

                <p className="modal-explanation-small">
                  O pedido e as regras de inclusão serão preservados. A IA gera uma nova proposta com estas exclusões; alterar critérios não corrige evidências legais. A nova proposta deve passar pela checagem novamente.
                </p>

                <div className="modal-footer-row">
                  <button className="modal-btn-cancel" onClick={() => setModalState(3)}>
                    Voltar à checagem
                  </button>
                  <button className="modal-btn-primary" onClick={() => setModalState(5)}>
                    Gerar nova proposta
                  </button>
                </div>
                <p className="modal-disclaimer">
                  Retorno à IA → nova proposta → nova checagem jurídica obrigatória. O envio continua bloqueado.
                </p>
              </div>
            )}

            {/* ==================== ESTADO 5 DE 7: Checagem Jurídica — Público Elegível ==================== */}
            {modalState === 5 && (
              <div className="modal-content-state">
                {/* Alerta Verde de Sucesso */}
                <div className="modal-alert-box green">
                  <div className="alert-icon-green">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <div className="alert-content">
                    <strong className="alert-title">Nova proposta checada · 280 elegíveis para e-mail</strong>
                    <p className="alert-desc">
                      Após a revisão e a nova checagem, os perfis restantes têm base legal documentada na origem e não apresentam opt-out para este canal, no cenário ilustrativo.
                    </p>
                  </div>
                </div>

                {/* 4 Cards de Métricas */}
                <div className="modal-stat-cards-grid four-cols">
                  <div className="modal-stat-card">
                    <span className="stat-card-num">324</span>
                    <span className="stat-card-label">Encontrados</span>
                  </div>
                  <div className="modal-stat-card">
                    <span className="stat-card-num">24</span>
                    <span className="stat-card-label">Opt-outs excluídos</span>
                  </div>
                  <div className="modal-stat-card">
                    <span className="stat-card-num">20</span>
                    <span className="stat-card-label">Sem base excluídos</span>
                  </div>
                  <div className="modal-stat-card green-highlight">
                    <span className="stat-card-num text-green">280</span>
                    <span className="stat-card-label">Elegíveis · e-mail</span>
                  </div>
                </div>

                <p className="modal-explanation-small">
                  324 perfis únicos – 24 opt-outs – 20 sem base legal = 280 elegíveis. Exclusões distintas, verificadas sem duplicar perfis.
                </p>

                {/* Tabela do Resultado da Nova Checagem */}
                <div className="modal-channel-results">
                  <div className="channel-results-header">
                    <strong>Resultado da nova checagem</strong>
                    <div className="channel-subhead">
                      <span>Proposta revisada · versão 2</span>
                      <span className="badge-success-pill">Checagem concluída</span>
                    </div>
                  </div>

                  <div className="channel-results-table">
                    <div className="channel-res-row">
                      <span className="res-row-label">Canal</span>
                      <span className="res-row-val">E-mail. A elegibilidade não se estende automaticamente a outros canais.</span>
                    </div>
                    <div className="channel-res-row">
                      <span className="res-row-label">Base legal</span>
                      <span className="res-row-val">Documentada nos registros de origem dos 280 perfis restantes. A IA não escolheu nem criou a base.</span>
                    </div>
                    <div className="channel-res-row">
                      <span className="res-row-label">Opt-out</span>
                      <span className="res-row-val">24 perfis excluídos; preferências de não receber mensagens respeitadas.</span>
                    </div>
                    <div className="channel-res-row">
                      <span className="res-row-label">Sem base registrada</span>
                      <span className="res-row-val">20 registros excluídos do público. Continuam sem regularização automática na origem.</span>
                    </div>
                  </div>
                </div>

                <div className="modal-info-box-blue">
                  <div className="modal-box-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  </div>
                  <div className="modal-box-text">
                    <h5 className="modal-box-title">Validação de registros, não parecer jurídico</h5>
                    <p className="modal-box-desc">
                      O resultado ilustrativo não substitui análise jurídica da finalidade e do uso dos dados. Sincronização e conciliação não equivalem a autorização de campanha.
                    </p>
                  </div>
                </div>

                <div className="modal-footer-row">
                  <button className="modal-btn-cancel" onClick={() => setModalState(4)}>
                    Voltar
                  </button>
                  <button className="modal-btn-primary" onClick={() => setModalState(6)}>
                    Continuar para envio
                  </button>
                </div>
                <p className="modal-disclaimer">
                  Cenário ilustrativo. Nenhum dado será transmitido e nenhuma campanha será disparada.
                </p>
              </div>
            )}

            {/* ==================== ESTADO 6 DE 7: Enviar para CRM e Campanhas ==================== */}
            {modalState === 6 && (
              <div className="modal-content-state">
                {/* 4 Cards de Métricas */}
                <div className="modal-stat-cards-grid four-cols">
                  <div className="modal-stat-card">
                    <span className="stat-card-num">324</span>
                    <span className="stat-card-label">Encontrados</span>
                  </div>
                  <div className="modal-stat-card">
                    <span className="stat-card-num">24</span>
                    <span className="stat-card-label">Opt-outs excluídos</span>
                  </div>
                  <div className="modal-stat-card">
                    <span className="stat-card-num">20</span>
                    <span className="stat-card-label">Sem base excluídos</span>
                  </div>
                  <div className="modal-stat-card green-highlight">
                    <span className="stat-card-num text-green">280</span>
                    <span className="stat-card-label">Elegíveis · e-mail</span>
                  </div>
                </div>

                {/* Dropdowns de Destino */}
                <div className="modal-destinations-grid">
                  <div className="dest-field">
                    <label className="dest-label">CRM de destino</label>
                    <select
                      className="dest-select"
                      value={targetCrm}
                      onChange={(e) => setTargetCrm(e.target.value)}
                    >
                      <option value="CRM Salesforce">CRM Salesforce</option>
                      <option value="HubSpot">HubSpot CRM</option>
                    </select>
                  </div>

                  <div className="dest-field">
                    <label className="dest-label">Destino de campanhas *</label>
                    <select
                      className="dest-select"
                      value={targetCampaign}
                      onChange={(e) => setTargetCampaign(e.target.value)}
                    >
                      <option value="Público B2B · destino de exemplo">Público B2B · destino de exemplo</option>
                      <option value="Campanha Inbound">Campanha Inbound</option>
                    </select>
                  </div>
                </div>

                <span className="dest-config-badge">
                  Configurado na demonstração · Destino genérico configurável, sem integração real vinculada.
                </span>

                <div className="modal-field-group">
                  <label className="dest-label">Campanha de demonstração</label>
                  <input
                    type="text"
                    className="modal-input"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                  />
                  <span className="dest-field-sub">
                    Canal e-mail · operação: sincronizar público, sem disparar mensagens.
                  </span>
                </div>

                {/* Mapeamento Mínimo */}
                <div className="modal-mapping-box">
                  <span className="mapping-title">Mapeamento mínimo · NEOCORE → destinos</span>
                  <div className="mapping-rows">
                    <div className="mapping-row">
                      <span>ID do perfil unificado</span>
                      <span className="arrow-sep">→</span>
                      <strong>ID externo do contato</strong>
                    </div>
                    <div className="mapping-row">
                      <span>E-mail principal</span>
                      <span className="arrow-sep">→</span>
                      <strong>E-mail</strong>
                    </div>
                    <div className="mapping-row">
                      <span>Nome do segmento</span>
                      <span className="arrow-sep">→</span>
                      <strong>Lista / público de campanha</strong>
                    </div>
                  </div>
                  <span className="mapping-sub">Chave única: ID do perfil. Um contato por perfil, mesmo com CRM e ERP vinculados.</span>
                </div>

                {/* Checkbox de Automação */}
                <label className="automation-checkbox-card">
                  <input
                    type="checkbox"
                    checked={enableAutomation}
                    onChange={(e) => setEnableAutomation(e.target.checked)}
                  />
                  <div className="auto-text">
                    <strong>Automação · atualizar este público</strong>
                    <p>Selecionada no cenário ilustrativo. Toda atualização exige nova checagem de base legal e opt-out antes de futuros envios; pendências bloqueiam a sincronização.</p>
                  </div>
                </label>

                <div className="modal-info-box-blue">
                  <div className="modal-box-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  </div>
                  <div className="modal-box-text">
                    <h5 className="modal-box-title">Destino configurado é obrigatório</h5>
                    <p className="modal-box-desc">
                      A confirmação só fica disponível com CRM e destino de campanhas configurados. Aqui a configuração é ilustrativa. Sincronizar o público não dispara mensagens nem autoriza campanha.
                    </p>
                  </div>
                </div>

                <div className="modal-footer-row">
                  <button className="modal-btn-cancel" onClick={() => setModalState(5)}>
                    Voltar
                  </button>
                  <button className="modal-btn-primary" onClick={() => setModalState(7)}>
                    Confirmar envio
                  </button>
                </div>
                <p className="modal-disclaimer">
                  Confirmar envio representa apenas sincronizar o público na demonstração. Nenhuma mensagem será disparada.
                </p>
              </div>
            )}

            {/* ==================== ESTADO 7 DE 7: Envio Concluído — Demonstração ==================== */}
            {modalState === 7 && (
              <div className="modal-content-state">
                {/* Banner Verde Concluído */}
                <div className="modal-alert-box green">
                  <div className="alert-icon-green">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <div className="alert-content">
                    <strong className="alert-title">Público sincronizado no cenário ilustrativo</strong>
                    <p className="alert-desc">
                      Campanha não disparada · nenhuma mensagem enviada.
                    </p>
                  </div>
                </div>

                {/* Box de Perfis Únicos */}
                <div className="modal-count-box blue-theme">
                  <div className="count-box-left">
                    <span className="count-number">280</span>
                    <div className="count-info">
                      <strong>Perfis únicos no público de e-mail</strong>
                      <p>324 encontrados · 24 opt-outs e 20 sem base legal excluídos.</p>
                    </div>
                  </div>
                  <span className="count-badge-demo">Demonstração</span>
                </div>

                {/* Destinos e Operação */}
                <div className="modal-details-card">
                  <span className="card-sec-title">Destinos e operação</span>
                  <div className="card-sec-rows">
                    <div className="card-sec-row">
                      <span className="sec-row-key">CRM</span>
                      <span className="sec-row-val">{targetCrm} - público sincronizado (ilustrativo)</span>
                    </div>
                    <div className="card-sec-row">
                      <span className="sec-row-key">Campanhas</span>
                      <span className="sec-row-val">{targetCampaign} configurável, sem integração real</span>
                    </div>
                    <div className="card-sec-row">
                      <span className="sec-row-key">Campanha</span>
                      <span className="sec-row-val">{campaignName} - somente público, sem disparo</span>
                    </div>
                  </div>
                </div>

                {/* Registro de Auditoria Ilustrativo */}
                <div className="modal-details-card">
                  <span className="card-sec-title">Registro de auditoria ilustrativo</span>
                  <div className="card-sec-rows">
                    <div className="card-sec-row">
                      <span className="sec-row-key">Registro</span>
                      <strong className="sec-row-val">DEMO-SEG-014 · 14/10/2026, às 11:30 · Carlos</strong>
                    </div>
                    <div className="card-sec-row">
                      <span className="sec-row-key">Rastreabilidade</span>
                      <span className="sec-row-val">Proposta v2 → nova checagem de e-mail → exclusões verificadas → sincronização simulada</span>
                    </div>
                  </div>
                  <span className="card-sec-note">
                    Contagem deduplicada por ID de perfil. Registros sem base permanecem fora do público e pendentes na origem.
                  </span>
                </div>

                {/* Alerta Azul Automação Selecionada */}
                <div className="modal-info-box-blue">
                  <div className="modal-box-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  </div>
                  <div className="modal-box-text">
                    <h5 className="modal-box-title">Automação selecionada · com rechecagem obrigatória</h5>
                    <p className="modal-box-desc">
                      No cenário ilustrativo, futuras atualizações do público exigem nova checagem de base legal e opt-out antes de cada envio. Opt-outs sempre excluídos; pendências bloqueiam a sincronização. Sem execução real.
                    </p>
                  </div>
                </div>

                {/* Botões do Estado 7 */}
                <div className="modal-footer-row">
                  <button className="modal-btn-cancel" onClick={handleFinishAndSaveSegment}>
                    Voltar a segmentos
                  </button>
                  <button
                    className="modal-btn-primary"
                    onClick={() => onShowToast && onShowToast('Registro de auditoria DEMO-SEG-014 validado com sucesso!')}
                  >
                    Ver registro
                  </button>
                </div>
                <p className="modal-disclaimer">
                  Confirmação exclusivamente ilustrativa. Nenhuma sincronização ou automação real foi executada.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
