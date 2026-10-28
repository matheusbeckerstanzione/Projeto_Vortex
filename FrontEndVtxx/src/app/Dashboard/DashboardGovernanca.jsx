import React, { useState } from 'react';
import '../../styles/DashboardGovernanca.css';
import logoImg from '../../assets/logo.png';
import {
  SIDEBAR_ITEMS,
  KPI_CARDS,
  CONSUMPTION_DATA,
  ALERTS_DATA,
  DELETION_REQUESTS,
  UPCOMING_EXPIRATIONS,
  AUDIT_LOGS,
} from '../../constants/governancaData';
import { governancaService } from '../../services/governancaService';

export default function VortexGovernanca({ embedded = false, onNavigate, onShowToast }) {
  const [selectedPeriod, setSelectedPeriod] = useState('Este mês - 01-14 out. 2026');
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('governanca');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);

  // Policy modal states
  const [budgetLimit, setBudgetLimit] = useState(5000);
  const [alertThreshold, setAlertThreshold] = useState(90);
  const [retentionDays, setRetentionDays] = useState(180);

  const showToast = (msg) => {
    setToastMessage(msg);
    if (onShowToast) onShowToast(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleExport = async () => {
    try {
      await governancaService.exportReport();
      showToast('Relatório de governança exportado com sucesso!');
    } catch (err) {
      showToast('Erro ao exportar relatório.');
    }
  };

  const handleSavePolicies = (e) => {
    e.preventDefault();
    setIsPolicyModalOpen(false);
    showToast('Políticas de governança atualizadas com sucesso!');
  };

  // Max value for bar chart scaling
  const maxChartValue = 400;

  const renderModal = () => (
    isPolicyModalOpen && (
      <div className="gov-modal-overlay" onClick={() => setIsPolicyModalOpen(false)}>
        <div className="gov-modal" onClick={(e) => e.stopPropagation()}>
          <div className="gov-modal-header">
            <div>
              <h3 className="gov-modal-title">Configurar Políticas de Governança</h3>
              <p className="gov-modal-subtitle">Defina limites orçamentários e regras de retenção do workspace.</p>
            </div>
            <button
              className="gov-modal-close"
              onClick={() => setIsPolicyModalOpen(false)}
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSavePolicies} className="gov-modal-form">
            <div className="gov-form-group">
              <label className="gov-form-label">Limite Mensal de Orçamento de IA (R$)</label>
              <input
                type="number"
                className="gov-input"
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(Number(e.target.value))}
                min="1000"
                step="500"
                required
              />
              <span className="gov-input-hint">Valor atual sugerido: R$ 5.000,00</span>
            </div>

            <div className="gov-form-group">
              <label className="gov-form-label">Gatilho de Alerta Orçamentário (%)</label>
              <input
                type="number"
                className="gov-input"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(Number(e.target.value))}
                min="50"
                max="100"
                required
              />
              <span className="gov-input-hint">Dispara alertas quando o consumo atingir a porcentagem</span>
            </div>

            <div className="gov-form-group">
              <label className="gov-form-label">Retenção de Dados Padrão (dias)</label>
              <input
                type="number"
                className="gov-input"
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                min="30"
                step="30"
                required
              />
              <span className="gov-input-hint">Exclusão automática após o período sem atividade</span>
            </div>

            <div className="gov-modal-footer">
              <button
                type="button"
                className="gov-btn-secondary"
                onClick={() => setIsPolicyModalOpen(false)}
              >
                Cancelar
              </button>
              <button type="submit" className="gov-btn-primary">
                Salvar Políticas
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  );

  const renderMain = () => (
    <main className="gov-main" style={embedded ? { width: '100%', maxWidth: '100%', padding: '24px 32px' } : {}}>
          {/* Header row */}
          <div className="gov-main-header">
            <div>
              <h1 className="gov-page-title">Governança</h1>
              <p className="gov-page-subtitle">
                Controle o consumo de IA e o ciclo de vida dos seus dados.
              </p>
            </div>

            <div className="gov-main-actions">
              <button className="gov-btn-outline" onClick={handleExport}>
                Exportar relatório
              </button>
              <button
                className="gov-btn-outline"
                onClick={() => setIsPolicyModalOpen(true)}
              >
                Configurar políticas
              </button>
            </div>
          </div>

          {/* Filter & Status row */}
          <div className="gov-filter-row">
            <div className="gov-filter-left">
              <div className="gov-date-dropdown-container">
                <button
                  className="gov-date-pill"
                  onClick={() => setIsPeriodMenuOpen(!isPeriodMenuOpen)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>{selectedPeriod}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {isPeriodMenuOpen && (
                  <div className="gov-dropdown-menu">
                    {[
                      'Este mês - 01-14 out. 2026',
                      'Últimos 7 dias',
                      'Últimos 30 dias',
                      'Setembro 2026',
                      'Agosto 2026',
                    ].map((period) => (
                      <button
                        key={period}
                        className={`gov-dropdown-item ${selectedPeriod === period ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedPeriod(period);
                          setIsPeriodMenuOpen(false);
                          showToast(`Filtro alterado para: ${period}`);
                        }}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <span className="gov-filter-scope">Workspace Operações</span>
            </div>

            <div className="gov-status-indicator">
              <span className="gov-status-dot"></span>
              <span className="gov-status-text">
                Atualizado às 10:42 · Dados ilustrativos
              </span>
            </div>
          </div>

          {/* 4 TOP KPI CARDS */}
          <div className="gov-kpis-grid">
            {KPI_CARDS.map((kpi) => {
              return (
                <div key={kpi.id} className="gov-kpi-card">
                  <div className="gov-kpi-header">
                    <span className="gov-kpi-title">{kpi.title}</span>
                    <div className="gov-kpi-icon-wrap">
                      {kpi.icon === 'sparkles' && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
                        </svg>
                      )}
                      {kpi.icon === 'trash' && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      )}
                      {kpi.icon === 'clock' && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      )}
                      {kpi.icon === 'bell' && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                      )}
                    </div>
                  </div>

                  <div className="gov-kpi-value">{kpi.value}</div>
                  <div className={`gov-kpi-footer ${kpi.type}`}>
                    {kpi.description}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ROW 2: CONSUMO DE IA + CENTRAL DE ALERTAS */}
          <div className="gov-row-2">
            {/* Card Gastos de IA */}
            <div className="gov-card gov-card-chart">
              <div className="gov-card-header">
                <div>
                  <h3 className="gov-card-title">Gastos de IA</h3>
                  <p className="gov-card-subtitle">Consumo diário - últimos 7 dias</p>
                </div>
                <button
                  className="gov-link-action"
                  onClick={() => showToast('Abrindo detalhamento completo de consumo de IA...')}
                >
                  Ver detalhes <span>→</span>
                </button>
              </div>

              {/* Budget Progress Bar */}
              <div className="gov-budget-progress-section">
                <div className="gov-budget-top">
                  <span className="gov-budget-label">
                    R$ {CONSUMPTION_DATA.currentSpend.toLocaleString('pt-BR')} de R${' '}
                    {CONSUMPTION_DATA.budgetTotal.toLocaleString('pt-BR')}
                  </span>
                  <span className="gov-budget-pill">
                    {CONSUMPTION_DATA.percentageUsed} utilizado
                  </span>
                </div>

                <div className="gov-progress-track">
                  <div
                    className="gov-progress-fill"
                    style={{
                      width: `${(CONSUMPTION_DATA.currentSpend / CONSUMPTION_DATA.budgetTotal) * 100}%`,
                    }}
                  ></div>
                </div>

                <div className="gov-budget-bottom">
                  <span className="gov-budget-available">
                    Disponível: {CONSUMPTION_DATA.available}
                  </span>
                  <span className="gov-budget-projection">
                    Projeção mensal: {CONSUMPTION_DATA.monthlyProjection}
                  </span>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="gov-chart-container">
                <div className="gov-chart-y-axis">
                  <span>R$ 400</span>
                  <span>R$ 200</span>
                  <span>R$ 0</span>
                </div>

                <div className="gov-chart-bars-wrap">
                  {/* Horizontal grid lines */}
                  <div className="gov-chart-gridline top"></div>
                  <div className="gov-chart-gridline middle"></div>
                  <div className="gov-chart-gridline bottom"></div>

                  <div className="gov-chart-bars">
                    {CONSUMPTION_DATA.dailyData.map((item, index) => {
                      const barHeightPercent = (item.value / maxChartValue) * 100;
                      return (
                        <div key={index} className="gov-bar-column">
                          <span className="gov-bar-val">{item.label}</span>
                          <div className="gov-bar-slot">
                            <div
                              className={`gov-bar ${item.isToday ? 'active-today' : ''}`}
                              style={{ height: `${barHeightPercent}%` }}
                              title={`${item.day}: R$ ${item.value}`}
                            ></div>
                          </div>
                          <span className="gov-bar-day">{item.day}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Breakdown 3 columns */}
              <div className="gov-chart-breakdown">
                {CONSUMPTION_DATA.breakdown.map((item, idx) => (
                  <div key={idx} className="gov-breakdown-col">
                    <span className="gov-breakdown-label">{item.label}</span>
                    <span className="gov-breakdown-amount">{item.amount}</span>
                    <span className="gov-breakdown-percentage">{item.percentage}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card Central de Alertas */}
            <div className="gov-card gov-card-alerts">
              <div className="gov-card-header">
                <div>
                  <h3 className="gov-card-title">Central de alertas</h3>
                  <p className="gov-card-subtitle">3 ativos · priorizados por gravidade</p>
                </div>
              </div>

              <div className="gov-alerts-list">
                {ALERTS_DATA.map((alert) => (
                  <div key={alert.id} className="gov-alert-item">
                    <div className="gov-alert-top">
                      <span className={`gov-alert-badge ${alert.type}`}>
                        {alert.severity}
                      </span>
                      <h4 className="gov-alert-heading">{alert.title}</h4>
                    </div>
                    <p className="gov-alert-desc">{alert.description}</p>
                    <button
                      className="gov-alert-action"
                      onClick={() => showToast(`Ação acionada: ${alert.actionLabel}`)}
                    >
                      {alert.actionLabel} <span>→</span>
                    </button>
                  </div>
                ))}
              </div>

              <div className="gov-alerts-footer">
                <button
                  className="gov-link-action gov-settings-link"
                  onClick={() => showToast('Abrindo gerenciamento de notificações...')}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="21" x2="4" y2="14" />
                    <line x1="4" y1="10" x2="4" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12" y2="3" />
                    <line x1="20" y1="21" x2="20" y2="16" />
                    <line x1="20" y1="12" x2="20" y2="3" />
                    <line x1="1" y1="14" x2="7" y2="14" />
                    <line x1="9" y1="8" x2="15" y2="8" />
                    <line x1="17" y1="16" x2="23" y2="16" />
                  </svg>
                  <span>Gerenciar notificações</span>
                </button>
              </div>
            </div>
          </div>

          {/* ROW 3: SOLICITAÇÕES DE EXCLUSÃO + PRÓXIMAS EXPIRAÇÕES */}
          <div className="gov-row-3">
            {/* Solicitações de exclusão */}
            <div className="gov-card">
              <div className="gov-card-header">
                <div>
                  <h3 className="gov-card-title">Solicitações de exclusão</h3>
                  <p className="gov-card-subtitle">6 em aberto · 1 com prazo vencido</p>
                </div>
                <button
                  className="gov-link-action"
                  onClick={() => showToast('Listando todas as 6 solicitações de exclusão...')}
                >
                  Ver todas <span>→</span>
                </button>
              </div>

              <div className="gov-table-wrapper">
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50%' }}>SOLICITAÇÃO / ESCOPO</th>
                      <th style={{ width: '22%', textAlign: 'center' }}>PRAZO</th>
                      <th style={{ width: '28%', textAlign: 'right' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DELETION_REQUESTS.map((req) => (
                      <tr
                        key={req.id}
                        onClick={() => showToast(`Abrindo detalhes de ${req.id}`)}
                        className="gov-clickable-row"
                      >
                        <td>
                          <div className="gov-item-primary">{req.id}</div>
                          <div className="gov-item-secondary">{req.scope}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`gov-deadline ${req.isOverdue ? 'overdue' : ''}`}>
                            {req.deadline}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="gov-status-cell">
                            <span className={`gov-status-badge ${req.statusType}`}>
                              {req.status}
                            </span>
                            <span className="gov-chevron">›</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="gov-card-footer-text">
                3 em aprovação · 2 processando · 1 em validação
              </div>
            </div>

            {/* Próximas expirações */}
            <div className="gov-card">
              <div className="gov-card-header">
                <div>
                  <h3 className="gov-card-title">Próximas expirações</h3>
                  <p className="gov-card-subtitle">128 registros · próximos 7 dias</p>
                </div>
                <button
                  className="gov-link-action"
                  onClick={() => showToast('Exibindo todos os 128 registros a expirar...')}
                >
                  Ver todos <span>→</span>
                </button>
              </div>

              <div className="gov-expirations-list">
                {UPCOMING_EXPIRATIONS.map((exp) => (
                  <div key={exp.id} className="gov-expiration-item">
                    <div className="gov-expiration-count">{exp.count}</div>
                    <div className="gov-expiration-info">
                      <h4 className="gov-expiration-title">{exp.title}</h4>
                      <p className="gov-expiration-sub">{exp.subtitle}</p>
                    </div>
                    <span className={`gov-expiration-badge ${exp.badgeType}`}>
                      {exp.badge}
                    </span>
                  </div>
                ))}
              </div>

              <div className="gov-expirations-footer">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Próxima rotina: 15 out., 02:00 · exclusão automática</span>
              </div>
            </div>
          </div>

          {/* ROW 4: LOGS DE AUDITORIA */}
          <div className="gov-card gov-audit-card">
            <div className="gov-card-header">
              <div>
                <h3 className="gov-card-title">Logs de auditoria</h3>
                <p className="gov-card-subtitle">
                  Atividade recente de governança · hoje, 14 out. 2026
                </p>
              </div>
              <button
                className="gov-link-action"
                onClick={() => {
                  if (onNavigate) onNavigate('logs');
                  else showToast('Carregando histórico completo de logs...');
                }}
              >
                Ver todos os logs <span>→</span>
              </button>
            </div>

            <div className="gov-table-wrapper">
              <table className="gov-table gov-table-audit">
                <thead>
                  <tr>
                    <th style={{ width: '9%' }}>HORÁRIO</th>
                    <th style={{ width: '18%' }}>RESPONSÁVEL</th>
                    <th style={{ width: '25%' }}>AÇÃO</th>
                    <th style={{ width: '24%' }}>RECURSO</th>
                    <th style={{ width: '12%' }}>ORIGEM</th>
                    <th style={{ width: '12%', textAlign: 'right' }}>RESULTADO</th>
                  </tr>
                </thead>
                <tbody>
                  {AUDIT_LOGS.map((log) => (
                    <tr key={log.id}>
                      <td className="gov-log-time">{log.time}</td>
                      <td>
                        <div className="gov-log-user">
                          <span className={`gov-mini-avatar ${log.initials === 'SY' ? 'system' : ''}`}>
                            {log.initials}
                          </span>
                          <span className="gov-user-name">{log.user}</span>
                        </div>
                      </td>
                      <td className="gov-log-action">{log.action}</td>
                      <td className="gov-log-resource">{log.resource}</td>
                      <td className="gov-log-origin">{log.origin}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`gov-pill-result ${log.resultType}`}>
                          {log.result}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="gov-audit-footer">
              <div className="gov-audit-footer-left">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span>Histórico rastreável · retenção de 365 dias</span>
              </div>
              <span className="gov-audit-footer-right">5 eventos recentes</span>
            </div>
          </div>
        </main>
  );

  if (embedded) {
    return (
      <div className="gov-embed-wrapper is-embedded">
        {toastMessage && <div className="gov-toast">{toastMessage}</div>}
        {renderModal()}
        {renderMain()}
      </div>
    );
  }

  return (
    <div className="gov-layout">
      {toastMessage && <div className="gov-toast">{toastMessage}</div>}
      {renderModal()}

      {/* TOP NAVBAR */}
      <header className="gov-navbar">
        <div className="gov-nav-left">
          <button
            className="gov-menu-btn"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label={sidebarOpen ? 'Fechar menu lateral' : 'Abrir menu lateral'}
            title={sidebarOpen ? 'Fechar menu lateral' : 'Abrir menu lateral'}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* LOGO CENTRALIZADO NO CENTRO DA TELA */}
        <div className="gov-logo-container">
          <img src={logoImg} alt="NEOCORE" className="gov-logo-img" />
          <span className="gov-logo-text">NEOCORE</span>
        </div>

        <div className="gov-nav-right">
          <span className="gov-user-greeting">Olá, Carlos</span>
          <div className="gov-user-avatar">CL</div>
        </div>
      </header>

      {/* BODY WRAPPER */}
      <div className="gov-body">
        {/* SIDEBAR COM TRANSIÇÃO DE ABRIR/FECHAR */}
        <aside className={`gov-sidebar-wrapper ${sidebarOpen ? 'open' : 'collapsed'}`}>
          <div className="gov-sidebar-card">
            <div className="gov-sidebar-top">
              <span className="gov-sidebar-caption">Workspace</span>
              <h2 className="gov-sidebar-workspace">Operações</h2>

              <nav className="gov-nav-list">
                {SIDEBAR_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveNav(item.id);
                      if (onNavigate) onNavigate(item.id);
                      if (window.innerWidth < 900) setSidebarOpen(false);
                    }}
                    className={`gov-nav-item ${activeNav === item.id ? 'active' : ''}`}
                  >
                    <span className="gov-nav-bullet"></span>
                    <span className="gov-nav-label">{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Bottom Promo Card */}
            <div className="gov-sidebar-bottom-card">
              <div className="gov-card-shield-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <h4 className="gov-bottom-card-title">Governança em dia começa com visibilidade.</h4>
              <p className="gov-bottom-card-desc">
                Acompanhe limites, retenção e decisões do seu workspace.
              </p>
              <button
                className="gov-bottom-card-link"
                onClick={() => setIsPolicyModalOpen(true)}
              >
                Consultar políticas <span>→</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            className="gov-sidebar-backdrop"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {renderMain()}
      </div>
    </div>
  );
}
