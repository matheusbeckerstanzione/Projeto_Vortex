import React, { useState, useEffect } from 'react';
import { contactService } from '../../services/contactService';
import '../../styles/DashboardFichaOrigem.css';

export default function DashboardFichaOrigem({
  contact,
  onBack,
  onNavigateToLogs,
  onShowToast
}) {
  const [selectedSourceId, setSelectedSourceId] = useState('banco');
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [revisionRequests, setRevisionRequests] = useState([]);
  const [revisionSuccess, setRevisionSuccess] = useState(false);

  const storageKey = `neocore-perfil-${contact?.id || contact?.email || contact?.name || 'demo'}`;
  const revisionStorageKey = `${storageKey}-solicitacoes-revisao`;

  const loadRevisionRequests = () => {
    try {
      const savedRequests = localStorage.getItem(revisionStorageKey);
      if (!savedRequests) return [];
      const parsedRequests = JSON.parse(savedRequests);
      return Array.isArray(parsedRequests) ? parsedRequests : [];
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
      return [];
    }
  };

  const refreshRevisionRequests = () => {
    setRevisionRequests(loadRevisionRequests());
  };

  useEffect(() => {
    refreshRevisionRequests();
  }, [revisionStorageKey]);

  useEffect(() => {
    const syncRequests = () => {
      refreshRevisionRequests();
    };
    const handleStorageChange = (event) => {
      if (event.key === revisionStorageKey) {
        syncRequests();
      }
    };
    window.addEventListener('neocore:revision-requests-updated', syncRequests);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('neocore:revision-requests-updated', syncRequests);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [revisionStorageKey]);

  // Perfil base (dados reais do contato)
  const profileName = contact?.name || 'Contato sem nome';
  const profileCompany = contact?.company || 'Empresa não informada';
  const profileCode = contact?.id || '—';
  const profileInitials = contact?.initials || 'NC';

  // Fontes disponíveis com dados reais do banco
  const sourcesData = {
    banco: {
      id: 'banco',
      name: 'PostgreSQL NeoCore',
      code: contact?.id ? `DB-${String(contact.id).slice(0, 8)}` : 'NC-DB',
      syncDate: 'Registro Ativo',
      sublabel: 'Tabela contatos / empresas',
      dateShort: 'Sincronizado · PostgreSQL',
      fields: [
        { label: 'Nome Completo', value: contact?.name || 'Não informado' },
        { label: 'Razão Social / Empresa', value: contact?.company || 'Não informada' },
        { label: 'E-mail Principal', value: contact?.email || 'Não informado' },
        { label: 'Telefone', value: contact?.phone || 'Não informado' },
        { label: 'Localização', value: contact?.location || 'Não informada' },
        { label: 'Segmento', value: contact?.segment || 'Cliente - B2B' }
      ],
      confidence: '100% · Verificada',
      confidenceDesc: 'Dados persistidos diretamente no banco de dados e validados pelo backend NeoCore.',
      legalBase: 'Execução de Contrato',
      legalBaseDesc: 'Gestão de relacionamento e consolidação de cadastros corporativos.'
    }
  };

  const activeSource = sourcesData[selectedSourceId] || sourcesData.banco;

  // Eventos do histórico de sincronização
  const syncHistory = [
    {
      id: 1,
      datetime: 'Hoje',
      origin: 'PostgreSQL NeoCore · Tabela contatos',
      event: 'Registro sincronizado e persistido',
      status: 'Sincronizado'
    }
  ];

  // Matriz de comparação entre fontes
  const comparisonData = [
    {
      campo: 'Nome',
      crm: contact?.name || 'Não informado',
      erp: '—',
      csv: '—'
    },
    {
      campo: 'E-mail',
      crm: contact?.email || 'Não informado',
      erp: '—',
      csv: '—'
    },
    {
      campo: 'Telefone',
      crm: contact?.phone || 'Não informado',
      erp: '—',
      csv: '—'
    },
    {
      campo: 'Empresa',
      crm: contact?.company || 'Não informada',
      erp: '—',
      csv: '—'
    }
  ];

  const handleOpenRevision = () => {
    setRevisionSuccess(false);
    setIsRevisionModalOpen(true);
  };

  const handleSendRevision = (e) => {
    e.preventDefault();
    if (!revisionNotes.trim()) return;

    if (contact?.id) {
      contactService.addNote(contact.id, `[Solicitação de Revisão]: ${revisionNotes.trim()}`, 'Governança');
    }

    try {
      const savedRequests = loadRevisionRequests();
      const now = new Date().toISOString();

      const newRequest = {
        id: Date.now(),
        contactId: contact?.id || null,
        contactName: profileName,
        sourceId: selectedSourceId,
        source: activeSource,
        notes: revisionNotes.trim(),
        status: 'pendente',
        createdAt: now,
        review: null,
        history: [
          {
            action: 'Solicitação enviada',
            date: now,
            status: 'pendente'
          }
        ]
      };

      const updatedRequests = [...savedRequests, newRequest];
      localStorage.setItem(revisionStorageKey, JSON.stringify(updatedRequests));
      setRevisionRequests(updatedRequests);
      window.dispatchEvent(new CustomEvent('neocore:revision-requests-updated'));

      setRevisionNotes('');
      setIsRevisionModalOpen(false);
      setRevisionSuccess(true);
      if (onShowToast) onShowToast('Solicitação de revisão registrada e enviada para o Perfil Completo!');
    } catch (error) {
      console.error('Erro ao salvar solicitação:', error);
      setIsRevisionModalOpen(false);
      setRevisionNotes('');
      if (onShowToast) onShowToast('Solicitação de revisão registrada no histórico do contato!');
    }
  };

  const formatRequestDate = (date) => {
    if (!date) return '-';
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return '-';
    return parsedDate.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRequestStatusLabel = (status) => {
    const labels = {
      pendente: 'Pendente',
      aprovada: 'Aprovada',
      rejeitada: 'Rejeitada'
    };
    return labels[status] || 'Pendente';
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

      {/* Confirmação visual de envio */}
      {revisionSuccess && (
        <div className="revision-success-message">
          <span className="revision-success-icon">✓</span>
          <div>
            <strong>Solicitação registrada com sucesso!</strong>
            <p>O pedido foi salvo e está aguardando análise no Perfil Completo.</p>
          </div>
          <button
            type="button"
            onClick={() => setRevisionSuccess(false)}
            aria-label="Fechar mensagem"
          >
            ×
          </button>
        </div>
      )}

      {/* ===== Grid Central: Fontes Vinculadas + Dados da Origem ===== */}
      <div className="ficha-middle-grid">
        {/* Coluna Esquerda: Lista de Fontes Vinculadas */}
        <div className="sources-col-left">
          <section className="ficha-card sources-list-card">
            <div className="sources-list-header">
              <h3 className="ficha-card-title">Fontes vinculadas</h3>
              <span className="sources-count-badge">1 fonte</span>
            </div>

            <div className="sources-items-list">
              <div
                className="source-selection-item active"
                onClick={() => setSelectedSourceId('banco')}
              >
                <div className="source-item-title-row">
                  <h4 className="source-item-title">PostgreSQL NeoCore</h4>
                </div>
                <p className="source-item-reg">ID: {String(profileCode).slice(0, 12)}</p>
                <p className="source-item-date">Sincronizado · Banco de Dados</p>
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

      {/* ===== Histórico de Solicitações de Revisão ===== */}
      <section className="ficha-card revision-history-section">
        <div className="ficha-card-header">
          <div>
            <h3 className="ficha-card-title">Solicitações de revisão</h3>
            <p className="revision-history-subtitle">
              Acompanhe os pedidos de correção deste contato.
            </p>
          </div>
          <span className="history-count-badge">
            {revisionRequests.length} solicitações
          </span>
        </div>

        {revisionRequests.length === 0 ? (
          <div className="revision-empty-state">
            <strong>Nenhuma solicitação registrada</strong>
            <p>Quando uma revisão for solicitada, ela aparecerá aqui.</p>
          </div>
        ) : (
          <div className="ficha-table-wrap">
            <table className="ficha-table revision-history-table">
              <thead>
                <tr>
                  <th>DATA</th>
                  <th>FONTE</th>
                  <th>DESCRIÇÃO</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {[...revisionRequests].reverse().map((request) => {
                  const updatedAt =
                    request.review?.updatedAt ||
                    request.review?.reviewedAt ||
                    request.completedAt ||
                    request.rejectedAt;

                  return (
                    <tr key={request.id}>
                      <td className="td-datetime">
                        {formatRequestDate(request.createdAt)}
                      </td>
                      <td className="td-origin">
                        {typeof request.source === 'string'
                          ? request.source
                          : request.source?.name || 'Fonte não identificada'}
                      </td>
                      <td className="revision-description">
                        {request.notes || 'Sem descrição informada'}
                      </td>
                      <td>
                        <span
                          className={`revision-status-pill ${
                            ['pendente', 'aprovada', 'rejeitada'].includes(request.status)
                              ? request.status
                              : 'pendente'
                          }`}
                        >
                          {getRequestStatusLabel(request.status)}
                        </span>
                        {updatedAt && (
                          <small className="revision-status-date">
                            Atualizado em {formatRequestDate(updatedAt)}
                          </small>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
                  <span className="log-mini-date">Registro ativo</span>
                  <p className="log-mini-text">Cadastro unificado no PostgreSQL via API NeoCore</p>
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
