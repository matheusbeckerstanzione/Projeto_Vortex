import React, { useState } from 'react';
import '../../styles/DashboardInicio.css';

export default function DashboardInicio({ onNavigateToContacts, onEnrichment, onExport }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredBar, setHoveredBar] = useState(null);

  // Dados das afinidades do público (gráfico de barras duplas)
  const affinitiesData = [
    { label: 'SaaS', high: 46, moderate: 34 },
    { label: 'Moda', high: 68, moderate: 54 },
    { label: 'Casa', high: 82, moderate: 62 },
    { label: 'Saúde', high: 52, moderate: 40 },
    { label: 'Tech', high: 92, moderate: 76 },
    { label: 'B2B', high: 72, moderate: 52 },
    { label: 'Outros', high: 78, moderate: 60 },
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim() && onNavigateToContacts) {
      onNavigateToContacts(searchTerm);
    }
  };

  return (
    <main className="inicio-container">
      {/* 1. Header da Tela Início */}
      <div className="inicio-header">
        <div className="inicio-title-group">
          <h1 className="inicio-title">Início</h1>
          <p className="inicio-subtitle">Inteligência de marketing · dados demonstrativos</p>
        </div>

        <div className="inicio-actions">
          {/* Campo de Busca */}
          <form onSubmit={handleSearchSubmit} className="inicio-search-form">
            <svg
              className="inicio-search-icon"
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
              placeholder="Buscar cliente ou cadastro"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="inicio-search-input"
            />
          </form>

          {/* Botão Exportar */}
          <button
            type="button"
            className="inicio-btn-export"
            onClick={onExport}
            title="Exportar dados consolidados"
          >
            Exportar
          </button>

          {/* Botão Primário: Iniciar Enriquecimento */}
          <button
            type="button"
            className="inicio-btn-enrich"
            onClick={onEnrichment}
            title="Iniciar processo de enriquecimento com IA"
          >
            Iniciar enriquecimento
          </button>
        </div>
      </div>

      {/* 2. Grid de 4 Cards de Métricas (KPIs) */}
      <section className="inicio-kpis-grid">
        {/* Card 1: Contatos Enriquecidos */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Contatos enriquecidos</span>
            <div className="kpi-icon-wrapper blue-light">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>
          <div className="kpi-value">1.284</div>
          <div className="kpi-footer-text">+42 nas últimas 24h</div>
        </div>

        {/* Card 2: Interesses Identificados */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Interesses identificados</span>
            <div className="kpi-icon-wrapper cyan-light">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
          </div>
          <div className="kpi-value">18</div>
          <div className="kpi-footer-text">18 interesses na base enriquecida</div>
        </div>

        {/* Card 3: Oportunidades Pendentes */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Oportunidades pendentes</span>
            <div className="kpi-icon-wrapper info-light">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
          </div>
          <div className="kpi-value">7</div>
          <div className="kpi-footer-text">7 sugestões aguardam revisão</div>
        </div>

        {/* Card 4: Atributos Confirmados */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Atributos confirmados</span>
            <div className="kpi-icon-wrapper green-solid">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
          <div className="kpi-value">94%</div>
          <div className="kpi-footer-text">Confiança média das fontes: 91%</div>
        </div>
      </section>

      {/* 3. Grid Principal em 2 Colunas */}
      <div className="inicio-columns-grid">
        {/* Coluna Esquerda (~65%) */}
        <div className="inicio-col-left">
          {/* Card: Afinidades do público */}
          <section className="inicio-card">
            <div className="card-header-row">
              <div>
                <h3 className="card-title">Afinidades do público</h3>
                <p className="card-subtitle">Afinidades · azul: alto interesse; cinza: moderado</p>
              </div>
              <span className="demo-badge">Demo</span>
            </div>

            {/* Gráfico de Barras Duplas Customizado */}
            <div className="barchart-container">
              <div className="barchart-body">
                {affinitiesData.map((item, idx) => (
                  <div
                    key={idx}
                    className="barchart-col"
                    onMouseEnter={() => setHoveredBar(item)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    <div className="bars-pair">
                      {/* Barra Azul: Alto interesse */}
                      <div
                        className="bar bar-blue"
                        style={{ height: `${item.high}%` }}
                        title={`${item.label} (Alto interesse): ${item.high}%`}
                      />
                      {/* Barra Cinza: Moderado */}
                      <div
                        className="bar bar-gray"
                        style={{ height: `${item.moderate}%` }}
                        title={`${item.label} (Moderado): ${item.moderate}%`}
                      />
                    </div>
                    <span className="bar-label">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Tooltip interativo se houver hover */}
              {hoveredBar && (
                <div className="barchart-tooltip">
                  <strong>{hoveredBar.label}:</strong> Alto {hoveredBar.high}% · Moderado {hoveredBar.moderate}%
                </div>
              )}
            </div>
          </section>

          {/* Card: Inteligência recente */}
          <section className="inicio-card">
            <div className="card-header-row">
              <div>
                <h3 className="card-title">Inteligência recente</h3>
                <p className="card-subtitle">Interesses e preferências · origem e confiança</p>
              </div>
              <button
                type="button"
                className="link-btn"
                onClick={() => onNavigateToContacts && onNavigateToContacts('')}
              >
                Explorar interesses
              </button>
            </div>

            {/* Lista de Registros Recentes */}
            <div className="recent-list">
              {/* Item 1 */}
              <div className="recent-item" onClick={() => onNavigateToContacts && onNavigateToContacts('Mariana')}>
                <div className="recent-left">
                  <div className="recent-avatar">MS</div>
                  <div className="recent-info">
                    <span className="recent-name">Mariana Souza Ltda</span>
                    <span className="recent-detail">Tecnologia · CRM · declarado · 93%</span>
                  </div>
                </div>
                <span className="recent-badge confirmed">Confirmado</span>
              </div>

              {/* Item 2 */}
              <div className="recent-item" onClick={() => onNavigateToContacts && onNavigateToContacts('Ateliê')}>
                <div className="recent-left">
                  <div className="recent-avatar">AT</div>
                  <div className="recent-info">
                    <span className="recent-name">Ateliê Nova Era</span>
                    <span className="recent-detail">Moda · campanhas · observado · 91%</span>
                  </div>
                </div>
                <span className="recent-badge confirmed">Confirmado</span>
              </div>

              {/* Item 3 */}
              <div className="recent-item" onClick={() => onNavigateToContacts && onNavigateToContacts('Brasil')}>
                <div className="recent-left">
                  <div className="recent-avatar">BR</div>
                  <div className="recent-info">
                    <span className="recent-name">Brasil Comércio</span>
                    <span className="recent-detail">SaaS B2B · IA · sugerido · 67%</span>
                  </div>
                </div>
                <span className="recent-badge pending">Pendente</span>
              </div>
            </div>

            {/* Bloco: Feedback do enriquecimento */}
            <div className="enrich-feedback-block">
              <h4 className="feedback-title">Feedback do enriquecimento</h4>
              <ul className="feedback-list">
                <li>Concluído · 42 contatos enriquecidos nas últimas 24h.</li>
                <li>Sem interesses? Inicie um enriquecimento para descobrir afinidades.</li>
                <li>Erro de fonte? Os atributos confirmados são preservados. Tente novamente.</li>
              </ul>
            </div>
          </section>
        </div>

        {/* Coluna Direita (~35%) */}
        <div className="inicio-col-right">
          {/* Card: Origem dos atributos */}
          <section className="inicio-card">
            <h3 className="card-title">Origem dos atributos</h3>
            <p className="card-subtitle">Fontes autorizadas · confiança média</p>

            <div className="source-stats-list">
              <div className="source-stat-row">
                <div className="source-stat-left">
                  <div className="source-stat-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                    </svg>
                  </div>
                  <span className="source-stat-name">CRM · declarados</span>
                </div>
                <span className="source-stat-value">93%</span>
              </div>

              <div className="source-stat-row">
                <div className="source-stat-left">
                  <div className="source-stat-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                  </div>
                  <span className="source-stat-name">Campanhas · observados</span>
                </div>
                <span className="source-stat-value">91%</span>
              </div>

              <div className="source-stat-row">
                <div className="source-stat-left">
                  <div className="source-stat-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <span className="source-stat-name">IA · sugestões</span>
                </div>
                <span className="source-stat-value">67%</span>
              </div>
            </div>

            {/* Mini Card Dados Demonstrativos */}
            <div className="demo-data-box">
              <span className="demo-data-label">Dados demonstrativos</span>
              <p className="demo-data-text">1.284 contatos · último lote hoje, 08:42</p>
            </div>
          </section>

          {/* Card: Oportunidades pendentes */}
          <section className="inicio-card">
            <h3 className="card-title">Oportunidades pendentes</h3>
            <p className="card-subtitle">7 atributos para validar antes da campanha.</p>

            <div className="pending-counts-list">
              <div className="pending-count-row">
                <span className="pending-count-name">Interesses sugeridos</span>
                <span className="pending-count-val">3</span>
              </div>
              <div className="pending-count-row">
                <span className="pending-count-name">Preferências de canal</span>
                <span className="pending-count-val">2</span>
              </div>
              <div className="pending-count-row">
                <span className="pending-count-name">Afinidades de produto</span>
                <span className="pending-count-val">2</span>
              </div>
            </div>

            {/* Aviso Revisão de marketing */}
            <div className="marketing-review-box">
              <span className="review-box-label">Revisão de marketing</span>
              <p className="review-box-text">Confirme ou rejeite as sugestões antes de segmentar.</p>
            </div>
          </section>

          {/* Card: Ações rápidas */}
          <section className="inicio-card">
            <h3 className="card-title">Ações rápidas</h3>
            <p className="card-subtitle">Enriquecimento e ativação de públicos.</p>

            <div className="quick-actions-list">
              {/* Ação 1: Enriquecer contatos */}
              <button
                type="button"
                className="quick-action-item"
                onClick={onEnrichment}
              >
                <div className="quick-action-icon blue">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                </div>
                <div className="quick-action-content">
                  <span className="quick-action-title">Enriquecer contatos</span>
                  <span className="quick-action-desc">Descobrir interesses e preferências.</span>
                </div>
              </button>

              {/* Ação 2: Criar segmentos */}
              <button
                type="button"
                className="quick-action-item"
                onClick={() => onNavigateToContacts && onNavigateToContacts('')}
              >
                <div className="quick-action-icon cyan">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div className="quick-action-content">
                  <span className="quick-action-title">Criar segmentos</span>
                  <span className="quick-action-desc">Combinar atributos para campanhas.</span>
                </div>
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
