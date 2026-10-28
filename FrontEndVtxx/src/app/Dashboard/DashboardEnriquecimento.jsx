import React, { useState, useMemo } from 'react';
import '../../styles/DashboardEnriquecimento.css';

// Dados mockados da prévia de resultado
const PREVIEW_DATA = [
  {
    id: 1,
    name: 'Mariana Souza Ltda',
    initials: 'MS',
    attributes: [
      { label: 'Tecnologia', color: 'navy' },
      { label: 'SaaS B2B', color: 'navy' }
    ],
    source: 'CRM Salesforce',
    confidence: '96%',
    status: 'concluido',
    statusLabel: 'Concluído'
  },
  {
    id: 2,
    name: 'Ateliê Nova Era',
    initials: 'AN',
    attributes: [
      { label: 'Moda e estilo', color: 'teal' },
      { label: 'design, ideias', color: 'teal' }
    ],
    source: 'Engajamento',
    confidence: '91%',
    status: 'revisao',
    statusLabel: 'Em revisão'
  },
  {
    id: 3,
    name: 'Brasil Comércio',
    initials: 'BC',
    attributes: [
      { label: 'Falha de fonte - retornar', color: 'red' }
    ],
    source: 'Erro, complementar',
    confidence: '—',
    status: 'erro',
    statusLabel: 'Erro'
  },
  {
    id: 4,
    name: 'Farmácia Central',
    initials: 'FC',
    attributes: [
      { label: 'Marcação atividades...', color: 'gray' }
    ],
    source: 'Processando...',
    confidence: '—',
    status: 'processando',
    statusLabel: 'Processando'
  },
  {
    id: 5,
    name: 'Construtora Verde',
    initials: 'CV',
    attributes: [
      { label: 'Aguardando seleção', color: 'light' }
    ],
    source: 'Ag. seleção',
    confidence: '—',
    status: 'selecionado',
    statusLabel: 'Selecionado'
  }
];

export default function DashboardEnriquecimento({ onBack, onShowToast }) {
  // Atributos selecionados
  const [attributes, setAttributes] = useState({
    interesses: true,
    preferencias: true,
    categorias: true,
    engajamento: true
  });

  // Fontes de dados
  const [sources, setSources] = useState({
    crm: true,
    engajamento: true,
    segmentacao: true,
    comportamental: false
  });

  // Regras da busca
  const [rules, setRules] = useState({
    camposVazios: true,
    confiancaMinima: true,
    registrarOrigem: true,
    sobrescrever: false
  });

  // Busca
  const [searchTerm, setSearchTerm] = useState('');

  // Ações da prévia
  const [previewActions, setPreviewActions] = useState({});

  // Contagem de atributos selecionados
  const selectedCount = useMemo(() => {
    return Object.values(attributes).filter(Boolean).length;
  }, [attributes]);

  // Contagem de fontes ativas
  const activeSources = useMemo(() => {
    return Object.values(sources).filter(Boolean).length;
  }, [sources]);

  const toggleAttribute = (key) => {
    setAttributes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSource = (key) => {
    setSources(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleRule = (key) => {
    setRules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAll = () => {
    const allSelected = Object.values(attributes).every(Boolean);
    const newVal = !allSelected;
    setAttributes({
      interesses: newVal,
      preferencias: newVal,
      categorias: newVal,
      engajamento: newVal
    });
  };

  const handleApprove = (id) => {
    setPreviewActions(prev => ({ ...prev, [id]: 'approved' }));
    if (onShowToast) onShowToast('Atributo aprovado com sucesso!');
  };

  const handleReject = (id) => {
    setPreviewActions(prev => ({ ...prev, [id]: 'rejected' }));
    if (onShowToast) onShowToast('Atributo rejeitado.');
  };

  const handleSelect = (id) => {
    setPreviewActions(prev => ({ ...prev, [id]: 'selected' }));
    if (onShowToast) onShowToast('Contato selecionado para enriquecimento.');
  };

  const handleStartEnrichment = () => {
    if (onShowToast) onShowToast('Enriquecimento de contatos iniciado em segundo plano!');
  };

  const handleSaveResults = () => {
    if (onShowToast) onShowToast('Resultados salvos e aplicados com sucesso!');
  };

  const handleSaveSelection = () => {
    if (onShowToast) onShowToast('Seleção de atributos e fontes salva!');
  };

  return (
    <main className="enrich-container">
      {/* ===== Page Header ===== */}
      <div className="enrich-page-header">
        <div className="enrich-title-group">
          <h1 className="enrich-page-title">Enriquecimento de contatos</h1>
          <p className="enrich-page-subtitle">
            Selecione atributos e fontes, inicie o enriquecimento dos cadastros.
          </p>
        </div>

        <div className="enrich-header-actions">
          <div className="enrich-search-wrapper">
            <svg className="enrich-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Buscar contato ou campo"
              className="enrich-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="enrich-link-btn" onClick={onBack}>Voltar</button>
          <button className="enrich-btn-primary" onClick={handleStartEnrichment}>
            Iniciar enriquecimento
          </button>
        </div>
      </div>

      {/* ===== KPI Cards Row ===== */}
      <div className="enrich-kpis-row">
        {/* KPI 1: Contatos selecionados */}
        <div className="enrich-kpi-card">
          <div className="enrich-kpi-top">
            <span className="enrich-kpi-label">Contatos selecionados</span>
            <div className="enrich-kpi-icon-wrap blue-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
          <div className="enrich-kpi-value">1.284</div>
          <div className="enrich-kpi-footer">Da importação clientes_nc0326.csv</div>
        </div>

        {/* KPI 2: Atributos selecionados */}
        <div className="enrich-kpi-card">
          <div className="enrich-kpi-top">
            <span className="enrich-kpi-label">Atributos selecionados</span>
            <div className="enrich-kpi-icon-wrap teal-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
          </div>
          <div className="enrich-kpi-value">{selectedCount} de 4</div>
          <div className="enrich-kpi-footer">Interesses, preferências, categorias, engajamento.</div>
        </div>

        {/* KPI 3: Créditos estimados */}
        <div className="enrich-kpi-card">
          <div className="enrich-kpi-top">
            <span className="enrich-kpi-label">Créditos estimados</span>
            <div className="enrich-kpi-icon-wrap info-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
          </div>
          <div className="enrich-kpi-value">2.140</div>
          <div className="enrich-kpi-footer">Cerca de 1.7 por contato.</div>
        </div>

        {/* KPI 4: Confiança média */}
        <div className="enrich-kpi-card">
          <div className="enrich-kpi-top">
            <span className="enrich-kpi-label">Confiança média</span>
            <div className="enrich-kpi-icon-wrap green-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
          <div className="enrich-kpi-value">91%</div>
          <div className="enrich-kpi-footer">Estimativa do total · revisão por atributo.</div>
        </div>
      </div>

      {/* ===== Two Columns Layout ===== */}
      <div className="enrich-columns">
        {/* ===== Left Column ===== */}
        <div className="enrich-col-left">

          {/* Section: O que descobrir */}
          <section className="enrich-card">
            <div className="enrich-card-header">
              <div>
                <h3 className="enrich-card-title">O que descobrir</h3>
                <p className="enrich-card-subtitle">
                  Marque os atributos de marketing que o NEOCORE irá buscar para cada contato.
                </p>
              </div>
              <button className="enrich-select-all-btn" onClick={selectAll}>
                Selecionar tudo
              </button>
            </div>

            <div className="enrich-attributes-grid">
              {/* Card: Interesses */}
              <div
                className={`enrich-attr-card ${attributes.interesses ? 'selected' : ''}`}
                onClick={() => toggleAttribute('interesses')}
              >
                <div className="enrich-attr-left">
                  <div className="enrich-attr-icon blue">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                  <div className="enrich-attr-text">
                    <span className="enrich-attr-name">Interesses</span>
                    <span className="enrich-attr-desc">Tendências, afinidades e sugestões por IA.</span>
                  </div>
                </div>
                <div className={`enrich-checkbox ${attributes.interesses ? 'checked' : ''}`}>
                  {attributes.interesses && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Card: Preferências declaradas */}
              <div
                className={`enrich-attr-card ${attributes.preferencias ? 'selected' : ''}`}
                onClick={() => toggleAttribute('preferencias')}
              >
                <div className="enrich-attr-left">
                  <div className="enrich-attr-icon blue">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </div>
                  <div className="enrich-attr-text">
                    <span className="enrich-attr-name">Preferências declaradas</span>
                    <span className="enrich-attr-desc">1.084 contatos com preferências.</span>
                  </div>
                </div>
                <div className={`enrich-checkbox ${attributes.preferencias ? 'checked' : ''}`}>
                  {attributes.preferencias && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Card: Categorias de produtos */}
              <div
                className={`enrich-attr-card ${attributes.categorias ? 'selected' : ''}`}
                onClick={() => toggleAttribute('categorias')}
              >
                <div className="enrich-attr-left">
                  <div className="enrich-attr-icon teal">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                  </div>
                  <div className="enrich-attr-text">
                    <span className="enrich-attr-name">Categorias de produtos</span>
                    <span className="enrich-attr-desc">142 contatos em categorias.</span>
                  </div>
                </div>
                <div className={`enrich-checkbox ${attributes.categorias ? 'checked' : ''}`}>
                  {attributes.categorias && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Card: Engajamento */}
              <div
                className={`enrich-attr-card ${attributes.engajamento ? 'selected' : ''}`}
                onClick={() => toggleAttribute('engajamento')}
              >
                <div className="enrich-attr-left">
                  <div className="enrich-attr-icon teal">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  </div>
                  <div className="enrich-attr-text">
                    <span className="enrich-attr-name">Engajamento</span>
                    <span className="enrich-attr-desc">876 contatos com interações.</span>
                  </div>
                </div>
                <div className={`enrich-checkbox ${attributes.engajamento ? 'checked' : ''}`}>
                  {attributes.engajamento && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </div>
            </div>

            <div className="enrich-demo-note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>Demonstração · use apenas fontes autorizadas e verifique a base legal antes de ativar campanhas.</span>
            </div>
          </section>

          {/* Section: Fontes de dados */}
          <section className="enrich-card">
            <div className="enrich-card-header">
              <div>
                <h3 className="enrich-card-title">Fontes de dados</h3>
                <p className="enrich-card-subtitle">
                  Escolha de onde buscar informações de marketing e preferências.
                </p>
              </div>
              <button className="enrich-manage-btn">Gerenciar fontes</button>
            </div>

            <div className="enrich-sources-list">
              {/* Source: CRM Salesforce */}
              <div className={`enrich-source-row ${sources.crm ? 'active' : ''}`}>
                <div className="enrich-source-left">
                  <div className="enrich-source-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                    </svg>
                  </div>
                  <div className="enrich-source-info">
                    <span className="enrich-source-name">CRM Salesforce</span>
                    <span className="enrich-source-desc">Interesses de marca e preferências declaradas.</span>
                  </div>
                </div>
                <div className="enrich-source-right">
                  <span className="enrich-source-badge connected">Conectado</span>
                  <label className="enrich-toggle">
                    <input type="checkbox" checked={sources.crm} onChange={() => toggleSource('crm')} />
                    <span className="enrich-toggle-slider" />
                  </label>
                </div>
              </div>

              {/* Source: Plataforma de engajamento */}
              <div className={`enrich-source-row ${sources.engajamento ? 'active' : ''}`}>
                <div className="enrich-source-left">
                  <div className="enrich-source-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  </div>
                  <div className="enrich-source-info">
                    <span className="enrich-source-name">Plataforma de engajamento</span>
                    <span className="enrich-source-desc">Cliques, aberturas e interações em campanhas.</span>
                  </div>
                </div>
                <div className="enrich-source-right">
                  <span className="enrich-source-badge connectable">Conectável</span>
                  <label className="enrich-toggle">
                    <input type="checkbox" checked={sources.engajamento} onChange={() => toggleSource('engajamento')} />
                    <span className="enrich-toggle-slider" />
                  </label>
                </div>
              </div>

              {/* Source: Provedor de segmentação */}
              <div className={`enrich-source-row ${sources.segmentacao ? 'active' : ''}`}>
                <div className="enrich-source-left">
                  <div className="enrich-source-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                  </div>
                  <div className="enrich-source-info">
                    <span className="enrich-source-name">Provedor de segmentação</span>
                    <span className="enrich-source-desc">Interesses e categorias por perfil público.</span>
                  </div>
                </div>
                <div className="enrich-source-right">
                  <span className="enrich-source-badge analysis">Em análise</span>
                  <label className="enrich-toggle">
                    <input type="checkbox" checked={sources.segmentacao} onChange={() => toggleSource('segmentacao')} />
                    <span className="enrich-toggle-slider" />
                  </label>
                </div>
              </div>

              {/* Source: Base comportamental */}
              <div className={`enrich-source-row ${sources.comportamental ? 'active' : ''}`}>
                <div className="enrich-source-left">
                  <div className="enrich-source-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a9 9 0 0 1 9 9c0 3.88-3.13 7.13-7 8.71V22h-4v-2.29C6.13 18.13 3 14.88 3 11a9 9 0 0 1 9-9z" />
                      <line x1="12" y1="18" x2="12" y2="22" />
                      <line x1="8" y1="22" x2="16" y2="22" />
                    </svg>
                  </div>
                  <div className="enrich-source-info">
                    <span className="enrich-source-name">Base comportamental</span>
                    <span className="enrich-source-desc">Preferências inferidas por comportamento de compra.</span>
                  </div>
                </div>
                <div className="enrich-source-right">
                  <label className="enrich-toggle">
                    <input type="checkbox" checked={sources.comportamental} onChange={() => toggleSource('comportamental')} />
                    <span className="enrich-toggle-slider" />
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Prévia do resultado */}
          <section className="enrich-card">
            <div className="enrich-card-header">
              <div>
                <h3 className="enrich-card-title">Prévia do resultado</h3>
                <p className="enrich-card-subtitle">
                  Exemplos com 5 contatos da seleção — atributos descobertos, fonte e confiança.
                </p>
              </div>
              <button className="enrich-manage-btn" onClick={onBack}>Ver todos</button>
            </div>

            <div className="enrich-preview-table-wrap">
              <table className="enrich-preview-table">
                <thead>
                  <tr>
                    <th>CONTATO</th>
                    <th>ATRIBUTOS DESCOBERTOS</th>
                    <th>FONTE / CONF.</th>
                    <th>ESTADO</th>
                    <th>AÇÃO</th>
                  </tr>
                </thead>
                <tbody>
                  {PREVIEW_DATA.map((row) => {
                    const action = previewActions[row.id];
                    return (
                      <tr key={row.id} className={`preview-row status-${row.status}`}>
                        <td className="preview-td-contact">
                          <div className={`preview-avatar status-${row.status}`}>
                            {row.initials}
                          </div>
                          <span className="preview-contact-name">{row.name}</span>
                        </td>
                        <td className="preview-td-attrs">
                          <div className="preview-badges-wrap">
                            {row.attributes.map((attr, idx) => (
                              <span key={idx} className={`preview-badge badge-${attr.color}`}>
                                {attr.label}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="preview-td-source">
                          <span className={`preview-source-text status-${row.status}`}>{row.source}</span>
                          {row.confidence !== '—' && (
                            <span className="preview-confidence">{row.confidence}</span>
                          )}
                        </td>
                        <td className="preview-td-status">
                          <span className={`preview-status-badge status-${row.status}`}>
                            {row.statusLabel}
                          </span>
                        </td>
                        <td className="preview-td-action">
                          {action === 'approved' ? (
                            <span className="preview-action-done approved">Aprovado ✓</span>
                          ) : action === 'rejected' ? (
                            <span className="preview-action-done rejected">Rejeitado</span>
                          ) : action === 'selected' ? (
                            <span className="preview-action-done approved">Selecionado ✓</span>
                          ) : (
                            <>
                              {(row.status === 'concluido' || row.status === 'revisao') && (
                                <div className="preview-action-btns">
                                  <button className="preview-btn approve" onClick={() => handleApprove(row.id)}>Aprovar</button>
                                  <button className="preview-btn reject" onClick={() => handleReject(row.id)}>Rejeitar</button>
                                </div>
                              )}
                              {row.status === 'selecionado' && (
                                <button className="preview-btn select" onClick={() => handleSelect(row.id)}>Selecionar</button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="enrich-preview-footer">
              <div className="enrich-preview-footer-text">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>
                  Demonstração · 1.284 contatos, 86 em revisão, 4 erros, 4 processando e 4 aguardando seleção. Total: 1.284.
                </span>
              </div>
            </div>

            <button className="enrich-save-results-btn" onClick={handleSaveResults}>
              Salvar e aplicar resultados
            </button>
          </section>
        </div>

        {/* ===== Right Column ===== */}
        <div className="enrich-col-right">

          {/* Card: Resumo da busca */}
          <section className="enrich-card">
            <h3 className="enrich-card-title">Resumo da busca</h3>
            <p className="enrich-card-subtitle">Estimativa antes de iniciar.</p>

            <div className="enrich-summary-list">
              <div className="enrich-summary-row">
                <span className="enrich-summary-label">Contatos</span>
                <span className="enrich-summary-value">1.284</span>
              </div>
              <div className="enrich-summary-row">
                <span className="enrich-summary-label">Atributos selecionados</span>
                <span className="enrich-summary-value">{selectedCount} de 4</span>
              </div>
              <div className="enrich-summary-row">
                <span className="enrich-summary-label">Fontes ativas</span>
                <span className="enrich-summary-value">{activeSources}</span>
              </div>
              <div className="enrich-summary-row">
                <span className="enrich-summary-label">Créditos estimados</span>
                <span className="enrich-summary-value highlight">2.140</span>
              </div>
            </div>

            <div className="enrich-summary-warning">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>
                Revise cada atributo antes de aprovar, rejeitar e salvar. Erro de fonte? Tente novamente.
              </span>
            </div>

            <button className="enrich-btn-primary full-width" onClick={handleStartEnrichment}>
              Iniciar enriquecimento
            </button>
            <button className="enrich-btn-secondary full-width" onClick={handleSaveSelection}>
              Salvar seleção
            </button>
          </section>

          {/* Card: Regras da busca */}
          <section className="enrich-card">
            <h3 className="enrich-card-title">Regras da busca</h3>
            <p className="enrich-card-subtitle">Controle os filtros da aplicação.</p>

            <div className="enrich-rules-list">
              <div className="enrich-rule-row">
                <span className="enrich-rule-label">Preencher só campos vazios</span>
                <label className="enrich-toggle">
                  <input type="checkbox" checked={rules.camposVazios} onChange={() => toggleRule('camposVazios')} />
                  <span className="enrich-toggle-slider" />
                </label>
              </div>
              <div className="enrich-rule-row">
                <span className="enrich-rule-label">Exigir confiança mínima de 80%</span>
                <label className="enrich-toggle">
                  <input type="checkbox" checked={rules.confiancaMinima} onChange={() => toggleRule('confiancaMinima')} />
                  <span className="enrich-toggle-slider" />
                </label>
              </div>
              <div className="enrich-rule-row">
                <span className="enrich-rule-label">Registrar a origem de cada dado</span>
                <label className="enrich-toggle">
                  <input type="checkbox" checked={rules.registrarOrigem} onChange={() => toggleRule('registrarOrigem')} />
                  <span className="enrich-toggle-slider" />
                </label>
              </div>
              <div className="enrich-rule-row">
                <span className="enrich-rule-label">Sobrescrever dados existentes</span>
                <label className="enrich-toggle">
                  <input type="checkbox" checked={rules.sobrescrever} onChange={() => toggleRule('sobrescrever')} />
                  <span className="enrich-toggle-slider" />
                </label>
              </div>
            </div>
          </section>

          {/* Card: Privacidade e ajuda */}
          <section className="enrich-card">
            <h3 className="enrich-card-title">Privacidade e ajuda</h3>
            <p className="enrich-card-subtitle">Transparência para os dados.</p>

            <div className="enrich-privacy-list">
              <div className="enrich-privacy-item">
                <div className="enrich-privacy-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div className="enrich-privacy-text">
                  <span className="enrich-privacy-name">Fontes autorizadas</span>
                  <span className="enrich-privacy-desc">Lista de fontes aprovadas e ativa.</span>
                </div>
              </div>
              <div className="enrich-privacy-item">
                <div className="enrich-privacy-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div className="enrich-privacy-text">
                  <span className="enrich-privacy-name">Política de uso</span>
                  <span className="enrich-privacy-desc">Leia sobre os termos de uso de dados.</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
