import React, { useState } from 'react';
import '../../styles/DashboardFichaOrigem.css';

export default function DashboardFichaOrigem({
  contact,
  onBack,
  onNavigateToLogs,
  onShowToast
}) {
  const [selectedSourceId, setSelectedSourceId] = useState('crm');
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');

  // Perfil base (dados da Mariana Souza ou contato selecionado)
  const profileName = contact?.name || 'Mariana Souza';
  const profileCompany = contact?.company || 'Mariana Souza Ltda';
  const profileCode = contact?.id || 'NC-00142';
  const profileInitials = contact?.initials || 'MS';

  // Fontes disponíveis com dados específicos para cada uma
  const sourcesData = {
    crm: {
      id: 'crm',
      name: 'CRM Salesforce',
      code: 'SF-00482',
      syncDate: '11/10/2026, às 08:42',
      sublabel: 'Registro SF-00482',
      dateShort: 'Sincronizado · 11/10/2026, 08:42',
      fields: [
        { label: 'Nome', value: 'Mariana Souza' },
        { label: 'E-mail', value: 'mariana@msouza.com.br' },
        { label: 'Telefone', value: '+55 (11) 99842-7310' }
      ],
      confidence: 'Não informada',
      confidenceDesc: 'A fonte não possui uma avaliação de confiança registrada.',
      legalBase: 'Não informada',
      legalBaseDesc: 'Nenhuma base legal foi informada para este registro.'
    },
    erp: {
      id: 'erp',
      name: 'ERP Omie',
      code: 'OM-0137',
      syncDate: '11/10/2026, às 08:40',
      sublabel: 'Registro OM-0137',
      dateShort: 'Sincronizado · 11/10/2026, 08:40',
      fields: [
        { label: 'Razão Social', value: 'Mariana Souza Comércio de Calçados ME' },
        { label: 'CNPJ', value: '12.345.678/0001-90' },
        { label: 'Inscrição Estadual', value: '112.445.789.110' },
        { label: 'Endereço', value: 'Rua das Acácias, 410 - São Paulo, SP' }
      ],
      confidence: '95% · Alta',
      confidenceDesc: 'Fonte contábil primária validada via certificado digital.',
      legalBase: 'Obrigação Legal',
      legalBaseDesc: 'Emissão e conciliação de documentos fiscais eletrônicos.'
    },
    csv: {
      id: 'csv',
      name: 'Importação CSV',
      code: 'cliente_outubro.csv',
      syncDate: '10/10/2026, às 16:15',
      sublabel: 'cliente_outubro.csv',
      dateShort: 'Sincronizado · 11/10/2026, 16:15',
      fields: [
        { label: 'Nome Completo', value: 'Mariana Souza' },
        { label: 'E-mail Comercial', value: 'mariana@msouza.com.br' },
        { label: 'Segmento Original', value: 'Cliente - B2B' },
        { label: 'Origem da Lista', value: 'Upload manual de planilha' }
      ],
      confidence: '82% · Média',
      confidenceDesc: 'Planilha estática importada por operador humano.',
      legalBase: 'Legítimo Interesse',
      legalBaseDesc: 'Prospects comerciais qualificados em eventos do setor.'
    }
  };

  const activeSource = sourcesData[selectedSourceId] || sourcesData.crm;

  // Eventos do histórico de sincronização
  const syncHistory = [
    {
      id: 1,
      datetime: '11/10/2026, 16:15',
      origin: 'Importação CSV · cliente_outubro.csv',
      event: 'Registro importado',
      status: 'Sincronizado'
    },
    {
      id: 2,
      datetime: '11/10/2026, 08:42',
      origin: 'CRM Salesforce · SF-00482',
      event: 'Dados sincronizados',
      status: 'Sincronizado'
    },
    {
      id: 3,
      datetime: '11/10/2026, 08:40',
      origin: 'ERP Omie',
      event: 'Dados sincronizados',
      status: 'Sincronizado'
    }
  ];

  // Matriz de comparação entre fontes
  const comparisonData = [
    {
      campo: 'Nome',
      crm: 'Mariana Souza',
      erp: '—',
      csv: '—'
    },
    {
      campo: 'E-mail',
      crm: 'mariana@msouza.com.br',
      erp: '—',
      csv: '—'
    },
    {
      campo: 'Telefone',
      crm: '+55 (11) 99842-7310',
      erp: '—',
      csv: '—'
    }
  ];

  const handleOpenRevision = () => {
    setIsRevisionModalOpen(true);
  };

  const handleSendRevision = (e) => {
    e.preventDefault();
    setIsRevisionModalOpen(false);
    setRevisionNotes('');
    if (onShowToast) onShowToast('Solicitação de revisão enviada para a equipe de governança!');
  };

  const handleOpenLogs = () => {
    if (onNavigateToLogs) {
      onNavigateToLogs();
    } else {
      setIsLogsModalOpen(true);
    }
  };

  return (
    <main className="ficha-origem-container">
      {/* ===== Breadcrumbs ===== */}
      <nav className="ficha-breadcrumb" aria-label="Navegação estrutural">
        <button className="breadcrumb-link" onClick={onBack}>Contatos</button>
        <span className="breadcrumb-separator">/</span>
        <button className="breadcrumb-link" onClick={onBack}>{profileName}</button>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Ficha de origem</span>
      </nav>

      {/* ===== Header Principal ===== */}
      <div className="ficha-page-header">
        <div className="ficha-title-group">
          <h1 className="ficha-page-title">Ficha de origem</h1>
          <p className="ficha-page-subtitle">
            Consulte a procedência dos dados deste contato.
          </p>
        </div>

        <div className="ficha-header-actions">
          <button className="ficha-btn-outline" onClick={handleOpenLogs}>
            Ver logs de auditoria
          </button>
          <button className="ficha-btn-primary" onClick={handleOpenRevision}>
            Solicitar revisão
          </button>
        </div>
      </div>

      {/* ===== Card Topo do Contato ===== */}
      <section className="ficha-contact-banner">
        <div className="contact-banner-left">
          <div className="contact-banner-avatar">
            {profileInitials}
          </div>
          <div className="contact-banner-text">
            <h2 className="contact-banner-name">{profileName}</h2>
            <p className="contact-banner-sub">
              {profileCompany} · {profileCode}
            </p>
          </div>
        </div>

        <div className="contact-banner-right">
          <div className="source-linked-badge">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span>Origem vinculada</span>
          </div>
        </div>
      </section>

      {/* ===== Grid Central: Fontes Vinculadas + Dados da Origem ===== */}
      <div className="ficha-middle-grid">
        {/* Coluna Esquerda: Lista de Fontes Vinculadas */}
        <div className="sources-col-left">
          <section className="ficha-card sources-list-card">
            <div className="sources-list-header">
              <h3 className="ficha-card-title">Fontes vinculadas</h3>
              <span className="sources-count-badge">3 fontes</span>
            </div>

            <div className="sources-items-list">
              {/* Card 1: CRM Salesforce */}
              <div
                className={`source-selection-item ${selectedSourceId === 'crm' ? 'active' : ''}`}
                onClick={() => setSelectedSourceId('crm')}
              >
                <div className="source-item-title-row">
                  <h4 className="source-item-title">CRM Salesforce</h4>
                </div>
                <p className="source-item-reg">Registro SF-00482</p>
                <p className="source-item-date">Sincronizado · 11/10/2026, 08:42</p>
              </div>

              {/* Card 2: ERP Omie */}
              <div
                className={`source-selection-item ${selectedSourceId === 'erp' ? 'active' : ''}`}
                onClick={() => setSelectedSourceId('erp')}
              >
                <div className="source-item-title-row">
                  <h4 className="source-item-title">ERP Omie</h4>
                </div>
                <p className="source-item-date">Sincronizado · 11/10/2026, 08:40</p>
              </div>

              {/* Card 3: Importação CSV */}
              <div
                className={`source-selection-item ${selectedSourceId === 'csv' ? 'active' : ''}`}
                onClick={() => setSelectedSourceId('csv')}
              >
                <div className="source-item-title-row">
                  <h4 className="source-item-title">Importação CSV</h4>
                </div>
                <p className="source-item-reg">cliente_outubro.csv</p>
                <p className="source-item-date">Sincronizado · 11/10/2026, 16:15</p>
              </div>
            </div>
          </section>
        </div>

        {/* Coluna Direita: Dados desta origem */}
        <div className="sources-col-right">
          <section className="ficha-card source-details-card">
            {/* Header com Nome da Fonte e Data */}
            <div className="source-details-top">
              <div className="source-top-left">
                <span className="source-top-label">Fonte</span>
                <h3 className="source-top-title">{activeSource.name}</h3>
                <p className="source-top-sub">Registro de origem: {activeSource.code}</p>
              </div>

              <div className="source-top-right">
                <span className="source-top-label">Data de sincronização</span>
                <h3 className="source-top-title">{activeSource.syncDate}</h3>
                <p className="source-top-sub">Última atualização da fonte</p>
              </div>
            </div>

            {/* Lista dos Campos desta Origem */}
            <div className="source-fields-section">
              <h4 className="source-fields-heading">Dados desta origem</h4>
              <div className="source-fields-table">
                {activeSource.fields.map((f, i) => (
                  <div key={i} className="source-field-row">
                    <span className="source-field-label">{f.label}</span>
                    <strong className="source-field-value">{f.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Cards de Avaliação: Confiança & Base Legal */}
            <div className="source-evaluation-cards">
              <div className="eval-box">
                <div className="eval-box-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span className="eval-box-title">Confiança</span>
                </div>
                <h5 className="eval-box-val">{activeSource.confidence}</h5>
                <p className="eval-box-desc">{activeSource.confidenceDesc}</p>
              </div>

              <div className="eval-box">
                <div className="eval-box-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span className="eval-box-title">Base legal</span>
                </div>
                <h5 className="eval-box-val">{activeSource.legalBase}</h5>
                <p className="eval-box-desc">{activeSource.legalBaseDesc}</p>
              </div>
            </div>

            {/* Alerta Azul: Dados pendentes de revisão */}
            <div className="ficha-info-callout">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>
                Dados de confiança e base legal pendentes de revisão. A vinculação da fonte não representa validação legal.
              </span>
            </div>

            {/* Rodapé da Origem com Ações */}
            <div className="source-card-footer">
              <span className="source-footer-text">
                Consulte o histórico de ações nos logs de auditoria.
              </span>
              <div className="source-footer-btns">
                <button className="ficha-btn-outline" onClick={handleOpenLogs}>
                  Ver logs de auditoria
                </button>
                <button className="ficha-btn-primary" onClick={handleOpenRevision}>
                  Solicitar revisão
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ===== Seção: Histórico de sincronização ===== */}
      <section className="ficha-card history-section-card">
        <div className="ficha-card-header">
          <h3 className="ficha-card-title">Histórico de sincronização</h3>
          <span className="history-count-badge">3 eventos</span>
        </div>

        <div className="ficha-table-wrap">
          <table className="ficha-table">
            <thead>
              <tr>
                <th>DATA E HORA</th>
                <th>ORIGEM</th>
                <th>EVENTO</th>
                <th>RESULTADO</th>
              </tr>
            </thead>
            <tbody>
              {syncHistory.map((row) => (
                <tr key={row.id}>
                  <td className="td-datetime">{row.datetime}</td>
                  <td className="td-origin">{row.origin}</td>
                  <td className="td-event">{row.event}</td>
                  <td className="td-result">
                    <span className="result-pill-green">{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== Seção: Comparação entre fontes ===== */}
      <section className="ficha-card comparison-section-card">
        <div className="ficha-card-header">
          <h3 className="ficha-card-title">Comparação entre fontes</h3>
          <span className="history-count-badge">3 campos</span>
        </div>

        <div className="ficha-table-wrap">
          <table className="ficha-table comparison-table">
            <thead>
              <tr>
                <th>CAMPO</th>
                <th>CRM SALESFORCE</th>
                <th>ERP OMIE</th>
                <th>IMPORTAÇÃO CSV</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, i) => (
                <tr key={i}>
                  <td className="td-campo-name">{row.campo}</td>
                  <td className="td-field-val active-val">{row.crm}</td>
                  <td className="td-field-val empty-val">{row.erp}</td>
                  <td className="td-field-val empty-val">{row.csv}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== Modal de Solicitação de Revisão ===== */}
      {isRevisionModalOpen && (
        <div className="ficha-modal-overlay" onClick={() => setIsRevisionModalOpen(false)}>
          <div className="ficha-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="ficha-modal-header">
              <h4 className="ficha-modal-title">Solicitar Revisão de Dados</h4>
              <button className="ficha-modal-close" onClick={() => setIsRevisionModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSendRevision} className="ficha-modal-body">
              <p className="ficha-modal-desc">
                Descreva a inconsistência observada nos dados da fonte <strong>{activeSource.name}</strong> para o time de governança.
              </p>
              <textarea
                className="ficha-modal-textarea"
                placeholder="Ex: Telefone divergente do cadastro físico ou falta de consentimento de marketing..."
                rows="4"
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                required
              />
              <div className="ficha-modal-footer">
                <button
                  type="button"
                  className="ficha-btn-outline"
                  onClick={() => setIsRevisionModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="ficha-btn-primary">
                  Enviar solicitação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Modal Rápido de Logs de Auditoria ===== */}
      {isLogsModalOpen && (
        <div className="ficha-modal-overlay" onClick={() => setIsLogsModalOpen(false)}>
          <div className="ficha-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="ficha-modal-header">
              <h4 className="ficha-modal-title">Logs de Auditoria · {profileName}</h4>
              <button className="ficha-modal-close" onClick={() => setIsLogsModalOpen(false)}>×</button>
            </div>
            <div className="ficha-modal-body">
              <div className="logs-mini-list">
                <div className="log-mini-row">
                  <span className="log-mini-date">11/10/2026 08:42:15</span>
                  <p className="log-mini-text">Conciliação automática via motor NeoCore v2.4</p>
                </div>
                <div className="log-mini-row">
                  <span className="log-mini-date">11/10/2026 08:40:02</span>
                  <p className="log-mini-text">Payload recebido via Webhook ERP Omie (Sync 200 OK)</p>
                </div>
                <div className="log-mini-row">
                  <span className="log-mini-date">10/10/2026 16:15:30</span>
                  <p className="log-mini-text">Criação inicial do cadastro a partir do arquivo cliente_outubro.csv</p>
                </div>
              </div>
            </div>
            <div className="ficha-modal-footer">
              <button className="ficha-btn-primary" onClick={() => setIsLogsModalOpen(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
