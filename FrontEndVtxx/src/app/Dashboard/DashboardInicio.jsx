
import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../../styles/DashboardInicio.css';

export default function DashboardInicio({
  onNavigateToContacts,
  onEnrichment,
  onExport
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredBar, setHoveredBar] = useState(null);

  // ==========================================
  // DADOS DO DASHBOARD
  // ==========================================

  const affinitiesData = [
    { label: 'SaaS', high: 46, moderate: 34 },
    { label: 'Moda', high: 68, moderate: 54 },
    { label: 'Casa', high: 82, moderate: 62 },
    { label: 'Saúde', high: 52, moderate: 40 },
    { label: 'Tech', high: 92, moderate: 76 },
    { label: 'B2B', high: 72, moderate: 52 },
    { label: 'Outros', high: 78, moderate: 60 },
  ];

  const kpis = [
    { label: 'Contatos enriquecidos', value: '1.284' },
    { label: 'Interesses identificados', value: '18' },
    { label: 'Oportunidades pendentes', value: '7' },
    { label: 'Atributos confirmados', value: '94%' },
  ];

  const recentData = [
    ['Mariana Souza Ltda', 'Tecnologia', 'CRM', '93%', 'Confirmado'],
    ['Ateliê Nova Era', 'Moda', 'Campanhas', '91%', 'Confirmado'],
    ['Brasil Comércio', 'SaaS B2B', 'IA', '67%', 'Pendente'],
  ];

  const sourcesData = [
    ['CRM', 'Declarados', '93%'],
    ['Campanhas', 'Observados', '91%'],
    ['IA', 'Sugestões', '67%'],
  ];

  const pendingData = [
    ['Interesses sugeridos', '3'],
    ['Preferências de canal', '2'],
    ['Afinidades de produto', '2'],
  ];

  // ==========================================
  // EXPORTAÇÃO PDF
  // ==========================================


  const handleExportPDF = async () => {
    const doc = new jsPDF();

    // ======================================
    // IDENTIDADE VISUAL ORIGINAL NEOCORE
    // ======================================

    const azulEscuro = [15, 23, 42];
    const azul = [11, 59, 96];
    const azulClaro = [239, 246, 255];
    const cinza = [100, 116, 139];
    const linha = [226, 232, 240];

    const dataAtual = new Date().toLocaleString('pt-BR');

    // ======================================
    // CARREGAR LOGO ORIGINAL
    // ======================================

    const carregarLogo = () => new Promise(resolve => {
      const imagem = new Image();

      imagem.onload = () => {
        const canvas = document.createElement('canvas');

        canvas.width = imagem.naturalWidth;
        canvas.height = imagem.naturalHeight;

        const contexto = canvas.getContext('2d');

        contexto.drawImage(
          imagem,
          0,
          0,
          canvas.width,
          canvas.height
        );

        resolve({
          data: canvas.toDataURL('image/png'),
          width: imagem.naturalWidth,
          height: imagem.naturalHeight
        });
      };

      imagem.onerror = () => {
        console.error('Não foi possível carregar a logo NeoCore.');
        resolve(null);
      };

      imagem.src = '/logo-n.png';
    });

    const logoNeoCore = await carregarLogo();

    // ======================================
    // CONFIGURAÇÃO DAS TABELAS
    // ======================================

    const configuracaoTabela = {
      theme: 'grid',

      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
        textColor: azulEscuro,
        lineColor: linha,
        lineWidth: 0.2
      },

      headStyles: {
        fillColor: azul,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },

      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },

      margin: {
        top: 35,
        bottom: 20,
        left: 15,
        right: 15
      }
    };

    // ======================================
    // CABEÇALHO E RODAPÉ EM TODAS AS PÁGINAS
    // ======================================

    const adicionarIdentidade = () => {
      const totalPaginas = doc.internal.getNumberOfPages();

      for (let i = 1; i <= totalPaginas; i++) {
        doc.setPage(i);

        // Cabeçalho azul-marinho
        doc.setFillColor(...azulEscuro);
        doc.rect(0, 0, 210, 25, 'F');

        // Logo original com proporção preservada
        if (logoNeoCore) {
          const proporcao =
            logoNeoCore.width / logoNeoCore.height;

          const alturaMaxima = 17;
          const larguraMaxima = 23;

          let largura = larguraMaxima;
          let altura = largura / proporcao;

          if (altura > alturaMaxima) {
            altura = alturaMaxima;
            largura = altura * proporcao;
          }

          doc.addImage(
            logoNeoCore.data,
            'PNG',
            15,
            4 + (alturaMaxima - altura) / 2,
            largura,
            altura
          );
        }

        // Nome da marca
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);

        doc.text('NEOCORE', 44, 12);

        // Subtítulo
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);

        doc.text(
          'RELATORIO DE INTELIGENCIA DE MARKETING',
          44,
          19
        );

        // Rodapé
        doc.setDrawColor(...linha);

        doc.line(15, 282, 195, 282);

        doc.setTextColor(...cinza);
        doc.setFontSize(8);

        doc.text(
          'NeoCore | Documento demonstrativo',
          15,
          288
        );

        doc.text(
          `Pagina ${i} de ${totalPaginas}`,
          195,
          288,
          { align: 'right' }
        );
      }
    };

    // ======================================
    // TÍTULOS DAS SEÇÕES
    // ======================================

    const adicionarTitulo = (titulo, y) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...azulEscuro);

      doc.text(titulo, 15, y);

      doc.setDrawColor(...linha);
      doc.line(15, y + 3, 195, y + 3);
    };

    // ======================================
    // TÍTULO DO RELATÓRIO
    // ======================================

    doc.setTextColor(...azulEscuro);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);

    doc.text('Relatorio consolidado', 15, 39);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...cinza);

    doc.text(
      'Inteligencia de marketing e enriquecimento de dados',
      15,
      47
    );

    doc.text(`Data de geracao: ${dataAtual}`, 15, 54);

    // ======================================
    // CARD DE INDICADORES
    // ======================================

    const cards = [
      ['Contatos enriquecidos', '1.284'],
      ['Interesses identificados', '18'],
      ['Oportunidades pendentes', '7'],
      ['Atributos confirmados', '94%']
    ];

    const cardWidth = 43.5;
    const cardHeight = 28;
    const cardGap = 2.5;
    const cardY = 62;

    cards.forEach((card, index) => {
      const x = 15 + index * (cardWidth + cardGap);

      doc.setFillColor(...azulClaro);

      doc.roundedRect(
        x,
        cardY,
        cardWidth,
        cardHeight,
        3,
        3,
        'F'
      );

      doc.setTextColor(...azul);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);

      const label = doc.splitTextToSize(
        card[0],
        cardWidth - 6
      );

      doc.text(label, x + 3, cardY + 7);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);

      doc.text(card[1], x + 3, cardY + 22);
    });

    // ======================================
    // RESUMO DOS INDICADORES
    // ======================================

    adicionarTitulo('Resumo dos indicadores', 103);

    autoTable(doc, {
      ...configuracaoTabela,

      startY: 109,

      head: [['Indicador', 'Resultado']],

      body: [
        ['Contatos enriquecidos', '1.284'],
        ['Variacao nas ultimas 24 horas', '+42 contatos'],
        ['Interesses identificados', '18 interesses'],
        ['Oportunidades pendentes', '7 sugestoes'],
        ['Atributos confirmados', '94%'],
        ['Confianca media das fontes', '91%']
      ]
    });

    let y = doc.lastAutoTable.finalY + 13;

    // ======================================
    // AFINIDADES DO PÚBLICO
    // ======================================

    if (y > 260) {
      doc.addPage();
      y = 39;
    }

    adicionarTitulo('Afinidades do publico', y);

    autoTable(doc, {
      ...configuracaoTabela,

      startY: y + 6,

      head: [[
        'Categoria',
        'Alto interesse',
        'Interesse moderado'
      ]],

      body: affinitiesData.map(item => [
        item.label,
        `${item.high}%`,
        `${item.moderate}%`
      ])
    });

    y = doc.lastAutoTable.finalY + 13;

    // ======================================
    // INTELIGÊNCIA RECENTE
    // ======================================

    if (y > 255) {
      doc.addPage();
      y = 39;
    }

    adicionarTitulo('Inteligencia recente', y);

    autoTable(doc, {
      ...configuracaoTabela,

      startY: y + 6,

      head: [[
        'Contato',
        'Afinidade',
        'Origem',
        'Confianca',
        'Status'
      ]],

      body: recentData,

      styles: {
        ...configuracaoTabela.styles,
        fontSize: 7
      },

      columnStyles: {
        0: { cellWidth: 48 },
        1: { cellWidth: 32 },
        2: { cellWidth: 29 },
        3: { cellWidth: 25 },
        4: { cellWidth: 41 }
      }
    });

    y = doc.lastAutoTable.finalY + 13;

    // ======================================
    // ORIGEM DOS ATRIBUTOS
    // ======================================

    if (y > 255) {
      doc.addPage();
      y = 39;
    }

    adicionarTitulo('Origem dos atributos', y);

    autoTable(doc, {
      ...configuracaoTabela,

      startY: y + 6,

      head: [[
        'Fonte',
        'Classificacao',
        'Confianca'
      ]],

      body: sourcesData
    });

    y = doc.lastAutoTable.finalY + 13;

    // ======================================
    // OPORTUNIDADES PENDENTES
    // ======================================

    if (y > 255) {
      doc.addPage();
      y = 39;
    }

    adicionarTitulo('Oportunidades pendentes', y);

    autoTable(doc, {
      ...configuracaoTabela,

      startY: y + 6,

      head: [[
        'Atributo para revisao',
        'Quantidade'
      ]],

      body: pendingData
    });

    y = doc.lastAutoTable.finalY + 13;

    // ======================================
    // OBSERVAÇÕES
    // ======================================

    if (y > 255) {
      doc.addPage();
      y = 39;
    }

    adicionarTitulo('Observacoes gerais', y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...cinza);

    const observacoes = [
      'Os dados apresentados possuem carater demonstrativo.',
      'As sugestoes de IA devem ser revisadas antes de campanhas.',
      'A confianca representa a confiabilidade estimada das fontes.'
    ];

    let observacaoY = y + 11;

    observacoes.forEach(item => {
      const linhas = doc.splitTextToSize(
        `- ${item}`,
        180
      );

      if (observacaoY + linhas.length * 4 > 275) {
        doc.addPage();
        observacaoY = 39;
      }

      doc.text(linhas, 15, observacaoY);

      observacaoY += linhas.length * 4 + 3;
    });

    // ======================================
    // FINALIZAÇÃO
    // ======================================

    adicionarIdentidade();

    doc.save('Relatorio-NEOCORE.pdf');
  };

  // ==========================================
  // BUSCA DE CONTATOS
  // ==========================================

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    const termo = searchTerm.trim();

    if (termo && onNavigateToContacts) {
      onNavigateToContacts(termo);
    }
  };

  // ==========================================
  // INTERFACE
  // ==========================================

  return (
    <main className="inicio-container">

      {/* HEADER */}

      <div className="inicio-header">
        <div className="inicio-title-group">
          <h1 className="inicio-title">Início</h1>
          <p className="inicio-subtitle">
            Inteligência de marketing · dados demonstrativos
          </p>
        </div>

        <div className="inicio-actions">

          <form
            onSubmit={handleSearchSubmit}
            className="inicio-search-form"
          >
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

          {/* EXPORTAR PDF */}

          <button
            type="button"
            className="inicio-btn-export"
            onClick={handleExportPDF}
            title="Exportar relatório em PDF"
          >
            Exportar PDF
          </button>

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

      {/* KPIs */}

      <section className="inicio-kpis-grid">

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

      {/* GRID PRINCIPAL */}

      <div className="inicio-columns-grid">

        {/* COLUNA ESQUERDA */}

        <div className="inicio-col-left">

          {/* AFINIDADES */}

          <section className="inicio-card">
            <div className="card-header-row">
              <div>
                <h3 className="card-title">Afinidades do público</h3>
                <p className="card-subtitle">
                  Afinidades · azul: alto interesse; cinza: moderado
                </p>
              </div>
              <span className="demo-badge">Demo</span>
            </div>

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

                      <div
                        className="bar bar-blue"
                        style={{ height: `${item.high}%` }}
                        title={`${item.label} (Alto interesse): ${item.high}%`}
                      />

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

              {hoveredBar && (
                <div className="barchart-tooltip">
                  <strong>{hoveredBar.label}:</strong>
                  {' '}Alto {hoveredBar.high}% · Moderado {hoveredBar.moderate}%
                </div>
              )}
            </div>
          </section>

          {/* INTELIGÊNCIA RECENTE */}

          <section className="inicio-card">
            <div className="card-header-row">
              <div>
                <h3 className="card-title">Inteligência recente</h3>
                <p className="card-subtitle">
                  Interesses e preferências · origem e confiança
                </p>
              </div>

              <button
                type="button"
                className="link-btn"
                onClick={() => onNavigateToContacts && onNavigateToContacts('')}
              >
                Explorar interesses
              </button>
            </div>

            <div className="recent-list">

              <div
                className="recent-item"
                onClick={() => onNavigateToContacts && onNavigateToContacts('Mariana')}
              >
                <div className="recent-left">
                  <div className="recent-avatar">MS</div>
                  <div className="recent-info">
                    <span className="recent-name">Mariana Souza Ltda</span>
                    <span className="recent-detail">
                      Tecnologia · CRM · declarado · 93%
                    </span>
                  </div>
                </div>
                <span className="recent-badge confirmed">Confirmado</span>
              </div>

              <div
                className="recent-item"
                onClick={() => onNavigateToContacts && onNavigateToContacts('Ateliê')}
              >
                <div className="recent-left">
                  <div className="recent-avatar">AT</div>
                  <div className="recent-info">
                    <span className="recent-name">Ateliê Nova Era</span>
                    <span className="recent-detail">
                      Moda · campanhas · observado · 91%
                    </span>
                  </div>
                </div>
                <span className="recent-badge confirmed">Confirmado</span>
              </div>

              <div
                className="recent-item"
                onClick={() => onNavigateToContacts && onNavigateToContacts('Brasil')}
              >
                <div className="recent-left">
                  <div className="recent-avatar">BR</div>
                  <div className="recent-info">
                    <span className="recent-name">Brasil Comércio</span>
                    <span className="recent-detail">
                      SaaS B2B · IA · sugerido · 67%
                    </span>
                  </div>
                </div>
                <span className="recent-badge pending">Pendente</span>
              </div>

            </div>

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

        {/* COLUNA DIREITA */}

        <div className="inicio-col-right">

          {/* ORIGEM DOS ATRIBUTOS */}

          <section className="inicio-card">
            <h3 className="card-title">Origem dos atributos</h3>
            <p className="card-subtitle">
              Fontes autorizadas · confiança média
            </p>

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

            <div className="demo-data-box">
              <span className="demo-data-label">Dados demonstrativos</span>
              <p className="demo-data-text">
                1.284 contatos · último lote hoje, 08:42
              </p>
            </div>
          </section>

          {/* OPORTUNIDADES PENDENTES */}

          <section className="inicio-card">
            <h3 className="card-title">Oportunidades pendentes</h3>
            <p className="card-subtitle">
              7 atributos para validar antes da campanha.
            </p>

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

            <div className="marketing-review-box">
              <span className="review-box-label">Revisão de marketing</span>
              <p className="review-box-text">
                Confirme ou rejeite as sugestões antes de segmentar.
              </p>
            </div>
          </section>

          {/* AÇÕES RÁPIDAS */}

          <section className="inicio-card">
            <h3 className="card-title">Ações rápidas</h3>
            <p className="card-subtitle">
              Enriquecimento e ativação de públicos.
            </p>

            <div className="quick-actions-list">

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
                  <span className="quick-action-desc">
                    Descobrir interesses e preferências.
                  </span>
                </div>
              </button>

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
                  <span className="quick-action-desc">
                    Combinar atributos para campanhas.
                  </span>
                </div>
              </button>

            </div>
          </section>

        </div>
      </div>
    </main>
  );
}
