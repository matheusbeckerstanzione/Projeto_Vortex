import React, { useState } from 'react';
import '../../styles/DashboardPerfilCompleto.css';

export default function DashboardPerfilCompleto({
  contact,
  onBack,
  onNavigateToEnrichment,
  onShowToast
}) {
  const [searchTerm, setSearchTerm] = useState('');
  // Estado para afinidade pendente de IA
  const [affinityState, setAffinityState] = useState('pending'); // 'pending' | 'confirmed' | 'rejected'
  // Modal ou visualização de consulta de fonte
  const [sourceModal, setSourceModal] = useState(null);
  // Estado de edição simples
  const [isEditMode, setIsEditMode] = useState(false);

  // Dados do perfil (Mariana Souza Ltda conforme o screenshot ou dados passados)
  const profile = {
    name: contact?.name || 'Mariana Souza Ltda',
    initials: contact?.initials || 'MS',
    role: 'Diretora comercial · Souza & Filhos Comércio',
    status: 'Cliente ativo',
    sourceTag: 'CRM Salesforce',
    updatedAt: 'Atualizado hoje, 08:42',
    confidenceScore: 92,
    confidenceGrade: 'Alta',
    confidenceNote: 'Acima de 85 pontos',
  };

  // Dados cadastrais e operacionais
  const [cadastralData, setCadastralData] = useState([
    {
      id: 'email',
      icon: 'mail',
      campo: 'E-mail',
      valor: 'mariana.souza@souzafilhos.com.br',
      origem: 'CRM Salesforce',
      confianca: '98% · Alta',
      badgeClass: 'green'
    },
    {
      id: 'phone',
      icon: 'phone',
      campo: 'Telefone',
      valor: '+55 11 98765-4321',
      origem: 'Provedor de contatos',
      confianca: '94% · Alta',
      badgeClass: 'green'
    },
    {
      id: 'cargo',
      icon: 'briefcase',
      campo: 'Cargo',
      valor: 'Diretora comercial',
      origem: 'Perfil público',
      confianca: '85% · Média',
      badgeClass: 'amber'
    },
    {
      id: 'empresa',
      icon: 'building',
      campo: 'Empresa',
      valor: 'Souza & Filhos Comércio Ltda',
      origem: 'Base pública',
      confianca: '97% · Alta',
      badgeClass: 'green'
    },
    {
      id: 'endereco',
      icon: 'map-pin',
      campo: 'Endereço',
      valor: 'Rua das Acácias, 410 - São Paulo',
      origem: 'Base pública',
      confianca: '78% · Média',
      badgeClass: 'amber'
    },
    {
      id: 'cnpj',
      icon: 'credit-card',
      campo: 'CNPJ',
      valor: '12.345.678/0001-90',
      origem: 'Base pública',
      confianca: '99% · Alta',
      badgeClass: 'green'
    }
  ]);

  const handleConfirmAffinity = () => {
    setAffinityState('confirmed');
    if (onShowToast) onShowToast('Afinidade SaaS B2B confirmada com sucesso!');
  };

  const handleRejectAffinity = () => {
    setAffinityState('rejected');
    if (onShowToast) onShowToast('Afinidade SaaS B2B rejeitada.');
  };

  const handleResetAffinity = () => {
    setAffinityState('pending');
    if (onShowToast) onShowToast('Afinidade retornada para revisão.');
  };

  const handleConsultSource = (sourceName, details) => {
    setSourceModal({ sourceName, details });
  };

  const handleSaveToRegister = () => {
    if (onShowToast) onShowToast('Perfil completo e revisões salvas no cadastro!');
  };

  const handleSaveReview = () => {
    if (onShowToast) onShowToast('Revisão de inteligência salva com sucesso!');
  };

  const handleExportProfile = () => {
    if (onShowToast) onShowToast('Gerando exportação em PDF com trilha de auditoria...');
  };

  // Filtragem dos campos por busca
  const filteredCadastral = cadastralData.filter(item => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.campo.toLowerCase().includes(term) ||
      item.valor.toLowerCase().includes(term) ||
      item.origem.toLowerCase().includes(term)
    );
  });

  // Ícones auxiliares
  const renderIcon = (type) => {
    switch (type) {
      case 'mail':
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        );
      case 'phone':
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        );
      case 'briefcase':
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        );
      case 'building':
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        );
      case 'map-pin':
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        );
      case 'credit-card':
      default:
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        );
    }
  };

  return (
    <main className="perfil-completo-container">
      {/* ===== Header Principal ===== */}
      <div className="perfil-header">
        <div className="perfil-title-group">
          <h1 className="perfil-page-title">Perfil completo</h1>
          <p className="perfil-page-subtitle">
            Interesses, preferências e afinidades · demonstração
          </p>
        </div>

        <div className="perfil-header-actions">
          <div className="perfil-search-wrapper">
            <svg
              className="perfil-search-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Buscar contato ou campo"
              className="perfil-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button className="perfil-btn-secondary" onClick={handleExportProfile} title="Exportar dados do perfil">
            Exportar
          </button>

          <button className="perfil-btn-primary" onClick={handleSaveToRegister} title="Salvar todas as alterações">
            Salvar no cadastro
          </button>
        </div>
      </div>

      {/* ===== Card Banner do Perfil do Contato ===== */}
      <section className="perfil-banner-card">
        <div className="perfil-banner-left">
          <div className="perfil-avatar">
            {profile.initials}
          </div>

          <div className="perfil-info">
            <h2 className="perfil-name">{profile.name}</h2>
            <p className="perfil-role">{profile.role}</p>

            <div className="perfil-badges-row">
              <span className="perfil-status-pill green">
                {profile.status}
              </span>
              <span className="perfil-status-pill navy">
                {profile.sourceTag}
              </span>
              <span className="perfil-updated-text">
                {profile.updatedAt}
              </span>
            </div>
          </div>
        </div>

        {/* Circular Gauge da Nota de Confiança */}
        <div className="perfil-banner-right">
          <div className="perfil-gauge-wrap">
            <svg className="perfil-gauge-svg" width="76" height="76" viewBox="0 0 80 80">
              <circle
                className="gauge-bg"
                cx="40"
                cy="40"
                r="34"
                strokeWidth="7"
              />
              <circle
                className="gauge-progress"
                cx="40"
                cy="40"
                r="34"
                strokeWidth="7"
                strokeDasharray="213.6"
                strokeDashoffset={213.6 * (1 - profile.confidenceScore / 100)}
              />
            </svg>
            <span className="perfil-gauge-number">{profile.confidenceScore}</span>
          </div>

          <div className="perfil-gauge-text">
            <span className="gauge-label">Nota de confiança</span>
            <span className="gauge-grade">{profile.confidenceGrade}</span>
            <span className="gauge-subnote">{profile.confidenceNote}</span>
          </div>
        </div>
      </section>

      {/* ===== Layout em Duas Colunas ===== */}
      <div className="perfil-columns-grid">
        {/* ===== Coluna Esquerda (~65%) ===== */}
        <div className="perfil-col-left">

          {/* 1. Card: Inteligência do contato */}
          <section className="perfil-card">
            <div className="perfil-card-header">
              <div>
                <h3 className="perfil-card-title">Inteligência do contato</h3>
                <p className="perfil-card-subtitle">
                  Dados demonstrativos · a confiança da fonte não substitui a confirmação.
                </p>
              </div>
            </div>

            <div className="perfil-intelligence-list">
              {/* Item 1: Interesses Tecnologia */}
              <div className="intel-item-card">
                <div className="intel-item-content">
                  <h4 className="intel-item-title">Interesses · Tecnologia</h4>
                  <p className="intel-item-desc">
                    Declarado · formulário CRM · confiança 93% · <strong className="text-confirmed">Confirmado</strong>
                  </p>
                </div>
                <div className="intel-item-actions">
                  <button
                    className="intel-link-btn"
                    onClick={() => {
                      if (onShowToast) onShowToast('Editando preferências de Tecnologia...');
                    }}
                  >
                    Editar
                  </button>
                  <span className="intel-sep">·</span>
                  <button
                    className="intel-link-btn"
                    onClick={() => handleConsultSource('CRM Salesforce', 'Formulário de lead submetido em 11/10/2026. Confiança 93%.')}
                  >
                    Consultar fonte
                  </button>
                </div>
              </div>

              {/* Item 2: Preferência E-mail */}
              <div className="intel-item-card">
                <div className="intel-item-content">
                  <h4 className="intel-item-title">Preferência · E-mail</h4>
                  <p className="intel-item-desc">
                    Declarado · central de preferências · confiança 93% · <strong className="text-confirmed">Confirmado</strong>
                  </p>
                </div>
                <div className="intel-item-actions">
                  <button
                    className="intel-link-btn"
                    onClick={() => {
                      if (onShowToast) onShowToast('Editando canal de preferência...');
                    }}
                  >
                    Editar
                  </button>
                  <span className="intel-sep">·</span>
                  <button
                    className="intel-link-btn"
                    onClick={() => handleConsultSource('Central de Preferências', 'Opt-in de canal de comunicação registrado no portal do cliente.')}
                  >
                    Consultar fonte
                  </button>
                </div>
              </div>

              {/* Item 3: Afinidade SaaS B2B (Com Ações Confirmar / Rejeitar) */}
              <div className={`intel-item-card ${affinityState !== 'pending' ? 'intel-item-reviewed' : ''}`}>
                <div className="intel-item-content">
                  <h4 className="intel-item-title">Afinidade · SaaS B2B</h4>
                  <p className="intel-item-desc">
                    Sugerido por IA · modelo de afinidade · confiança 87% ·{' '}
                    {affinityState === 'pending' && <span className="text-pending">Pendente de confirmação</span>}
                    {affinityState === 'confirmed' && <strong className="text-confirmed">Confirmado manualmente ✓</strong>}
                    {affinityState === 'rejected' && <strong className="text-rejected">Rejeitado pelo usuário ✕</strong>}
                  </p>
                </div>
                <div className="intel-item-actions">
                  {affinityState === 'pending' ? (
                    <>
                      <button className="intel-btn-confirm" onClick={handleConfirmAffinity}>
                        Confirmar
                      </button>
                      <span className="intel-sep">·</span>
                      <button className="intel-btn-reject" onClick={handleRejectAffinity}>
                        Rejeitar
                      </button>
                      <span className="intel-sep">·</span>
                      <button
                        className="intel-link-btn"
                        onClick={() => handleConsultSource('Modelo de Afinidade IA', 'Predição gerada com base em interações anteriores e comportamento de compra.')}
                      >
                        Consultar fonte
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="intel-link-btn" onClick={handleResetAffinity}>
                        Revisar novamente
                      </button>
                      <span className="intel-sep">·</span>
                      <button
                        className="intel-link-btn"
                        onClick={() => handleConsultSource('Modelo de Afinidade IA', 'Predição gerada com base em interações anteriores e comportamento de compra.')}
                      >
                        Consultar fonte
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Item 4: Interações em Campanhas */}
              <div className="intel-item-card">
                <div className="intel-item-content">
                  <h4 className="intel-item-title">
                    Interações · 5 cliques em campanhas nos últimos 30 dias
                  </h4>
                  <p className="intel-item-desc">
                    Observados · plataforma de campanhas · confiança 91% · <strong className="text-confirmed">Confirmado</strong>
                  </p>
                </div>
                <div className="intel-item-actions">
                  <button
                    className="intel-link-btn"
                    onClick={() => handleConsultSource('Plataforma de Campanhas', '5 eventos de clique registrados nos últimos 30 dias em newsletters corporativas.')}
                  >
                    Consultar fonte
                  </button>
                </div>
              </div>
            </div>

            {/* Notas de Rodapé do Card de Inteligência */}
            <div className="intel-footer-notes">
              <p className="intel-note-unavailable">
                Categoria secundária · Indisponível — nenhuma fonte retornou dados. Tentar novamente.
              </p>
              <p className="intel-note-explanation">
                Feedback de revisão: confirmado → disponível para segmentos; rejeitado → não utilizar. Falha ao salvar? Suas alterações permanecem para nova tentativa.
              </p>
            </div>
          </section>

          {/* 2. Card: Dados cadastrais e operacionais */}
          <section className="perfil-card">
            <div className="perfil-card-header">
              <div>
                <h3 className="perfil-card-title">Dados cadastrais e operacionais</h3>
                <p className="perfil-card-subtitle">
                  Dados existentes · disponíveis para consulta e edição.
                </p>
              </div>
              <button
                className="perfil-edit-action-btn"
                onClick={() => {
                  setIsEditMode(!isEditMode);
                  if (onShowToast) onShowToast(isEditMode ? 'Edição concluída!' : 'Modo de edição habilitado.');
                }}
              >
                {isEditMode ? 'Concluir' : 'Editar'}
              </button>
            </div>

            {/* Tabela de Dados Cadastrais */}
            <div className="cadastral-table-wrap">
              <table className="cadastral-table">
                <thead>
                  <tr>
                    <th>CAMPO</th>
                    <th>VALOR</th>
                    <th>ORIGEM</th>
                    <th>CONFIANÇA</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCadastral.map((row) => (
                    <tr key={row.id}>
                      <td className="cadastral-td-campo">
                        <div className="cadastral-icon-box">
                          {renderIcon(row.icon)}
                        </div>
                        <span className="cadastral-field-label">{row.campo}</span>
                      </td>

                      <td className="cadastral-td-valor">
                        {isEditMode ? (
                          <input
                            type="text"
                            value={row.valor}
                            className="cadastral-inline-input"
                            onChange={(e) => {
                              const val = e.target.value;
                              setCadastralData(prev => prev.map(item => item.id === row.id ? { ...item, valor: val } : item));
                            }}
                          />
                        ) : (
                          <span className="cadastral-value-text">{row.valor}</span>
                        )}
                      </td>

                      <td className="cadastral-td-origem">
                        <span className="cadastral-origin-text">{row.origem}</span>
                      </td>

                      <td className="cadastral-td-confianca">
                        <span className={`cadastral-pill ${row.badgeClass}`}>
                          {row.confianca}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* ===== Coluna Direita (~35%) ===== */}
        <div className="perfil-col-right">

          {/* Card 1: Nota de confiança */}
          <section className="perfil-card">
            <h3 className="perfil-card-title">Nota de confiança</h3>
            <p className="perfil-card-subtitle">Resumo da avaliação.</p>

            {/* Barra de 3 segmentos */}
            <div className="confidence-segment-container">
              <div className="confidence-bars">
                <div className="confidence-bar-segment segment-low" />
                <div className="confidence-bar-segment segment-mid" />
                <div className="confidence-bar-segment segment-high" />
              </div>
              <div className="confidence-bar-labels">
                <span>Baixa 0-59</span>
                <span>Média 60-84</span>
                <span>Alta 85-100</span>
              </div>
            </div>

            {/* Linhas de resumo */}
            <div className="confidence-summary-list">
              <div className="confidence-summary-row">
                <span className="confidence-label">Esta nota</span>
                <span className="confidence-value text-green">92 · Alta</span>
              </div>
              <div className="confidence-summary-row">
                <span className="confidence-label">Campos verificados</span>
                <span className="confidence-value">6 de 6</span>
              </div>
              <div className="confidence-summary-row">
                <span className="confidence-label">Fontes consultadas</span>
                <span className="confidence-value">3</span>
              </div>
              <div className="confidence-summary-row">
                <span className="confidence-label">Campos com atenção</span>
                <span className="confidence-value text-amber">2</span>
              </div>
            </div>
          </section>

          {/* Card 2: Revisão de inteligência */}
          <section className="perfil-card">
            <h3 className="perfil-card-title">Revisão de inteligência</h3>
            <p className="perfil-card-subtitle">Confirme sugestões antes de usar em campanhas.</p>

            {/* Callout Amarelo de Alerta */}
            {affinityState === 'pending' ? (
              <div className="intel-review-callout">
                <div className="callout-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div className="callout-text">
                  <h5 className="callout-title">1 sugestão de IA pendente</h5>
                  <p className="callout-desc">
                    Afinidade com SaaS B2B · 87%. Consulte a fonte e confirme ou rejeite a hipótese.
                  </p>
                </div>
              </div>
            ) : (
              <div className="intel-review-callout success">
                <div className="callout-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div className="callout-text">
                  <h5 className="callout-title">Todas as sugestões revisadas!</h5>
                  <p className="callout-desc">
                    Nenhuma pendência crítica de IA restante neste perfil.
                  </p>
                </div>
              </div>
            )}

            <button className="perfil-btn-primary full-width" onClick={handleSaveToRegister}>
              Salvar no cadastro
            </button>

            <button className="perfil-btn-outline full-width" onClick={handleSaveReview}>
              Salvar revisão
            </button>
          </section>

          {/* Card 3: Ações rápidas */}
          <section className="perfil-card">
            <h3 className="perfil-card-title">Ações rápidas</h3>
            <p className="perfil-card-subtitle">Atalhos para este perfil.</p>

            <div className="quick-actions-list">
              {/* Ação 1: Enriquecer contato */}
              <div
                className="quick-action-item"
                onClick={onNavigateToEnrichment}
                title="Ir para a tela de enriquecimento"
              >
                <div className="quick-action-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                </div>
                <div className="quick-action-text">
                  <span className="quick-action-title">Enriquecer contato</span>
                  <span className="quick-action-desc">Buscar novos atributos de marketing.</span>
                </div>
              </div>

              {/* Ação 2: Exportar perfil */}
              <div
                className="quick-action-item"
                onClick={handleExportProfile}
                title="Baixar dossiê em PDF"
              >
                <div className="quick-action-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </div>
                <div className="quick-action-text">
                  <span className="quick-action-title">Exportar perfil</span>
                  <span className="quick-action-desc">PDF com a origem de cada dado.</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ===== Modal de Detalhes da Fonte (quando clica em "Consultar fonte") ===== */}
      {sourceModal && (
        <div className="source-modal-overlay" onClick={() => setSourceModal(null)}>
          <div className="source-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="source-modal-header">
              <h4 className="source-modal-title">Origem e Auditoria do Dado</h4>
              <button className="source-modal-close" onClick={() => setSourceModal(null)}>×</button>
            </div>
            <div className="source-modal-body">
              <div className="source-modal-field">
                <span className="source-modal-label">Fonte:</span>
                <strong className="source-modal-val">{sourceModal.sourceName}</strong>
              </div>
              <div className="source-modal-field">
                <span className="source-modal-label">Trilha de Auditoria:</span>
                <p className="source-modal-desc">{sourceModal.details}</p>
              </div>
              <div className="source-modal-field">
                <span className="source-modal-label">Base Legal / LGPD:</span>
                <span className="source-modal-tag">Legítimo Interesse · Consentimento Declarado</span>
              </div>
            </div>
            <div className="source-modal-footer">
              <button className="perfil-btn-primary" onClick={() => setSourceModal(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
