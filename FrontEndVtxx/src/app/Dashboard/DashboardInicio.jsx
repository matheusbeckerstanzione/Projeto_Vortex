import React, { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { contactService } from '../../services/contactService';
import '../../styles/DashboardInicio.css';

export default function DashboardInicio({ onNavigateToContacts, onEnrichment, onExport, onNavigateToIa }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredBar, setHoveredBar] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contactService.getContacts().then((list) => {
      setContacts(list || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const totalContacts = contacts.length;

  // ===== KPIs DINÂMICOS baseados nos contatos reais =====
  // Interesses identificados: contatos que possuem segmento diferente do padrão
  const interessesCount = useMemo(() => {
    const segmentos = new Set();
    contacts.forEach((c) => {
      if (c.segment && c.segment !== 'Cliente - B2B') {
        segmentos.add(c.segment);
      }
    });
    return segmentos.size;
  }, [contacts]);

  // Oportunidades pendentes: contatos "Em revisão" (não unificados)
  const oportunidadesCount = useMemo(() => {
    return contacts.filter((c) => c.statusType === 'review').length;
  }, [contacts]);

  // Atributos confirmados: % de contatos unificados
  const atributosConfirmados = useMemo(() => {
    if (totalContacts === 0) return '0%';
    const unificados = contacts.filter((c) => c.statusType === 'unified').length;
    return Math.round((unificados / totalContacts) * 100) + '%';
  }, [contacts, totalContacts]);

  // Confiança média: baseada nas fontes dos contatos
  const confiancaMedia = useMemo(() => {
    if (totalContacts === 0) return '0%';
    const unificados = contacts.filter((c) => c.statusType === 'unified').length;
    return Math.round((unificados / totalContacts) * 100) + '%';
  }, [contacts, totalContacts]);

  // ===== Afinidades do público: agrupamento REAL por segmento =====
  const affinitiesData = useMemo(() => {
    if (totalContacts === 0) return [];
    const segmentMap = {};
    contacts.forEach((c) => {
      const seg = c.segment || 'Outros';
      if (!segmentMap[seg]) segmentMap[seg] = 0;
      segmentMap[seg]++;
    });
    return Object.entries(segmentMap).map(([label, count]) => ({
      label: label.length > 10 ? label.slice(0, 10) + '…' : label,
      fullLabel: label,
      high: Math.round((count / totalContacts) * 100),
      moderate: Math.round((count / totalContacts) * 70),
      count,
    }));
  }, [contacts, totalContacts]);

  // ===== Origem dos atributos: calculada dinamicamente =====
  const origemCrm = useMemo(() => {
    if (totalContacts === 0) return '0%';
    // Contatos que vieram do CRM (todos os contatos persistidos no PostgreSQL = CRM)
    return Math.round((totalContacts / Math.max(totalContacts, 1)) * 100) + '%';
  }, [totalContacts]);

  const origemCampanhas = useMemo(() => {
    // Sem campanhas reais integradas ainda
    return '0%';
  }, []);

  const origemIA = useMemo(() => {
    // Sem sugestões de IA reais ainda
    return '0%';
  }, []);

  // ===== Oportunidades pendentes por tipo =====
  const pendentesInteresses = useMemo(() => {
    return contacts.filter((c) => c.statusType === 'review').length;
  }, [contacts]);

  const pendentesCanal = 0; // Sem dados de canal real ainda
  const pendentesAfinidade = 0; // Sem dados de afinidade real ainda
  const totalPendentes = pendentesInteresses + pendentesCanal + pendentesAfinidade;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim() && onNavigateToContacts) {
      onNavigateToContacts(searchTerm);
    }
  };

  const handleExportPDF = async () => {
    const doc = new jsPDF();

    const azulEscuro = [15, 23, 42];
    const azul = [11, 59, 96];
    const azulClaro = [239, 246, 255];
    const cinza = [100, 116, 139];
    const linha = [226, 232, 240];
    const dataAtual = new Date().toLocaleString('pt-BR');

    const carregarLogo = () => new Promise((resolve) => {
      const imagem = new Image();
      imagem.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = imagem.naturalWidth;
        canvas.height = imagem.naturalHeight;
        const contexto = canvas.getContext('2d');
        contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);
        resolve({
          data: canvas.toDataURL('image/png'),
          width: imagem.naturalWidth,
          height: imagem.naturalHeight,
        });
      };
      imagem.onerror = () => resolve(null);
      imagem.src = '/logo-n.png';
    });

    const logoNeoCore = await carregarLogo();

    const configuracaoTabela = {
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
        textColor: azulEscuro,
        lineColor: linha,
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: azul,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { top: 35, bottom: 20, left: 15, right: 15 },
    };

    const adicionarIdentidade = () => {
      const totalPaginas = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPaginas; i++) {
        doc.setPage(i);
        doc.setFillColor(...azulEscuro);
        doc.rect(0, 0, 210, 25, 'F');

        if (logoNeoCore) {
          const proporcao = logoNeoCore.width / logoNeoCore.height;
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

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('NEOCORE', 44, 12);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('RELATORIO DE INTELIGENCIA UNIFICADA', 44, 19);

        doc.setDrawColor(...linha);
        doc.line(15, 282, 195, 282);
        doc.setTextColor(...cinza);
        doc.setFontSize(8);
        doc.text('NeoCore | Relatorio operacional', 15, 288);
        doc.text(`Pagina ${i} de ${totalPaginas}`, 195, 288, { align: 'right' });
      }
    };

    const adicionarTitulo = (titulo, y) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...azulEscuro);
      doc.text(titulo, 15, y);
      doc.setDrawColor(...linha);
      doc.line(15, y + 3, 195, y + 3);
    };

    doc.setTextColor(...azulEscuro);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.text('Relatorio consolidado', 15, 39);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...cinza);
    doc.text('Inteligencia unificada de contatos e enriquecimento de dados', 15, 47);
    doc.text(`Data de geracao: ${dataAtual}`, 15, 54);

    const cards = [
      ['Contatos enriquecidos', String(totalContacts)],
      ['Interesses identificados', String(interessesCount)],
      ['Oportunidades pendentes', String(oportunidadesCount)],
      ['Atributos confirmados', atributosConfirmados],
    ];

    const cardWidth = 43.5;
    const cardHeight = 28;
    const cardGap = 2.5;
    const cardY = 62;

    cards.forEach((card, index) => {
      const x = 15 + index * (cardWidth + cardGap);
      doc.setFillColor(...azulClaro);
      doc.roundedRect(x, cardY, cardWidth, cardHeight, 3, 3, 'F');
      doc.setTextColor(...azul);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      const label = doc.splitTextToSize(card[0], cardWidth - 6);
      doc.text(label, x + 3, cardY + 7);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text(card[1], x + 3, cardY + 22);
    });

    adicionarTitulo('Resumo dos indicadores', 103);
    autoTable(doc, {
      ...configuracaoTabela,
      startY: 109,
      head: [['Indicador', 'Resultado']],
      body: [
        ['Contatos enriquecidos', String(totalContacts)],
        ['Interesses identificados', `${interessesCount} segmentos`],
        ['Oportunidades pendentes', `${oportunidadesCount} em revisao`],
        ['Atributos confirmados', atributosConfirmados],
        ['Confianca media das fontes', confiancaMedia],
      ],
    });

    let y = doc.lastAutoTable.finalY + 13;

    if (y > 260) {
      doc.addPage();
      y = 39;
    }
    adicionarTitulo('Afinidades do publico', y);
    autoTable(doc, {
      ...configuracaoTabela,
      startY: y + 6,
      head: [['Segmento', 'Proporcao', 'Peso relativo', 'Contatos']],
      body: affinitiesData.length > 0
        ? affinitiesData.map((item) => [item.fullLabel, `${item.high}%`, `${item.moderate}%`, String(item.count)])
        : [['Sem dados consolidados', '-', '-', '0']],
    });

    y = doc.lastAutoTable.finalY + 13;
    if (y > 255) {
      doc.addPage();
      y = 39;
    }
    adicionarTitulo('Contatos recentes', y);
    const recentRows = contacts.slice(0, 5).map((c) => [
      c.name || 'Sem nome',
      c.company || '-',
      c.segment || 'Cliente - B2B',
      c.statusType === 'unified' ? 'Unificado' : 'Em revisao',
    ]);
    autoTable(doc, {
      ...configuracaoTabela,
      startY: y + 6,
      head: [['Contato', 'Empresa', 'Segmento', 'Status']],
      body: recentRows.length > 0 ? recentRows : [['Nenhum contato cadastrado', '-', '-', '-']],
      styles: { ...configuracaoTabela.styles, fontSize: 7 },
    });

    y = doc.lastAutoTable.finalY + 13;
    if (y > 255) {
      doc.addPage();
      y = 39;
    }
    adicionarTitulo('Origem dos atributos', y);
    autoTable(doc, {
      ...configuracaoTabela,
      startY: y + 6,
      head: [['Fonte', 'Classificacao', 'Confianca']],
      body: [
        ['CRM', 'Declarados', origemCrm],
        ['Campanhas', 'Observados', origemCampanhas],
        ['IA', 'Sugestoes', origemIA],
      ],
    });

    y = doc.lastAutoTable.finalY + 13;
    if (y > 255) {
      doc.addPage();
      y = 39;
    }
    adicionarTitulo('Oportunidades pendentes', y);
    autoTable(doc, {
      ...configuracaoTabela,
      startY: y + 6,
      head: [['Atributo para revisao', 'Quantidade']],
      body: [
        ['Contatos em revisao', String(pendentesInteresses)],
        ['Preferencias de canal', String(pendentesCanal)],
        ['Afinidades de produto', String(pendentesAfinidade)],
      ],
    });

    adicionarIdentidade();
    doc.save('Relatorio-NEOCORE.pdf');
  };

  return (
    <main className="inicio-container">
      {/* 1. Header da Tela Início */}
      <div className="inicio-header">
        <div className="inicio-title-group">
          <h1 className="inicio-title">Início</h1>
          <p className="inicio-subtitle">Inteligência unificada de contatos</p>
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

          {/* Botão Exportar PDF */}
          <button
            type="button"
            className="inicio-btn-export"
            onClick={handleExportPDF}
            title="Exportar relatório em PDF"
          >
            Exportar PDF
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
          <div className="kpi-value">{totalContacts}</div>
          <div className="kpi-footer-text">{totalContacts} {totalContacts === 1 ? 'ativo' : 'ativos'} na base</div>
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
          <div className="kpi-value">{interessesCount}</div>
          <div className="kpi-footer-text">
            {interessesCount === 0
              ? 'Nenhum interesse mapeado ainda'
              : `${interessesCount} ${interessesCount === 1 ? 'segmento distinto' : 'segmentos distintos'} na base`}
          </div>
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
          <div className="kpi-value">{oportunidadesCount}</div>
          <div className="kpi-footer-text">
            {oportunidadesCount === 0
              ? 'Nenhuma sugestão pendente'
              : `${oportunidadesCount} ${oportunidadesCount === 1 ? 'contato aguarda' : 'contatos aguardam'} revisão`}
          </div>
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
          <div className="kpi-value">{atributosConfirmados}</div>
          <div className="kpi-footer-text">
            {totalContacts === 0
              ? 'Sem contatos para calcular'
              : `Confiança média das fontes: ${confiancaMedia}`}
          </div>
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
                <p className="card-subtitle">
                  {totalContacts === 0
                    ? 'Sem dados consolidados'
                    : 'Distribuição por segmento · azul: proporção; cinza: peso relativo'}
                </p>
              </div>
            </div>

            {/* Gráfico de Barras Duplas Customizado */}
            <div className="barchart-container">
              {affinitiesData.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  Nenhum dado de afinidade disponível. Cadastre contatos para visualizar a distribuição por segmento.
                </div>
              ) : (
                <div className="barchart-body">
                  {affinitiesData.map((item, idx) => (
                    <div
                      key={idx}
                      className="barchart-col"
                      onMouseEnter={() => setHoveredBar(item)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      <div className="bars-pair">
                        {/* Barra Azul: Proporção */}
                        <div
                          className="bar bar-blue"
                          style={{ height: `${item.high}%` }}
                          title={`${item.fullLabel}: ${item.count} contatos (${item.high}%)`}
                        />
                        {/* Barra Cinza: Peso relativo */}
                        <div
                          className="bar bar-gray"
                          style={{ height: `${item.moderate}%` }}
                          title={`${item.fullLabel} (peso relativo): ${item.moderate}%`}
                        />
                      </div>
                      <span className="bar-label">{item.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tooltip interativo se houver hover */}
              {hoveredBar && (
                <div className="barchart-tooltip">
                  <strong>{hoveredBar.fullLabel}:</strong> {hoveredBar.count} {hoveredBar.count === 1 ? 'contato' : 'contatos'} ({hoveredBar.high}%)
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
              {contacts.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  Nenhum contato cadastrado ainda. Cadastre um contato no menu <strong>Contatos</strong>.
                </div>
              ) : (
                contacts.slice(0, 3).map((c) => (
                  <div key={c.id} className="recent-item" onClick={() => onNavigateToContacts && onNavigateToContacts(c.name)}>
                    <div className="recent-left">
                      <div className="recent-avatar">{c.initials || 'NC'}</div>
                      <div className="recent-info">
                        <span className="recent-name">{c.name} {c.company && c.company !== 'Não informada' ? `· ${c.company}` : ''}</span>
                        <span className="recent-detail">{c.segment || 'Geral'} · PostgreSQL NeoCore · {c.email || 'Cadastrado'}</span>
                      </div>
                    </div>
                    <span className={`recent-badge ${c.statusType === 'unified' ? 'confirmed' : 'pending'}`}>
                      {c.status}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Bloco: Status do banco de dados */}
            <div className="enrich-feedback-block">
              <h4 className="feedback-title">Status do banco de dados</h4>
              <ul className="feedback-list">
                <li>{contacts.length} {contacts.length === 1 ? 'contato persistido' : 'contatos persistidos'} no PostgreSQL.</li>
                <li>Conectado ao backend NeoCore na nuvem (neocore-homologacao.onrender.com).</li>
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
                <span className="source-stat-value">{origemCrm}</span>
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
                <span className="source-stat-value">{origemCampanhas}</span>
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
                <span className="source-stat-value">{origemIA}</span>
              </div>
            </div>

            {/* Mini Card Dados Reais */}
            <div className="demo-data-box">
              <span className="demo-data-label">Base de dados</span>
              <p className="demo-data-text">{totalContacts} {totalContacts === 1 ? 'contato registrado' : 'contatos registrados'}</p>
            </div>
          </section>

          {/* Card: Oportunidades pendentes */}
          <section className="inicio-card">
            <h3 className="card-title">Oportunidades pendentes</h3>
            <p className="card-subtitle">
              {totalPendentes === 0
                ? 'Nenhum atributo pendente de validação.'
                : `${totalPendentes} ${totalPendentes === 1 ? 'atributo' : 'atributos'} para validar antes da campanha.`}
            </p>

            <div className="pending-counts-list">
              <div className="pending-count-row">
                <span className="pending-count-name">Interesses sugeridos</span>
                <span className="pending-count-val">{pendentesInteresses}</span>
              </div>
              <div className="pending-count-row">
                <span className="pending-count-name">Preferências de canal</span>
                <span className="pending-count-val">{pendentesCanal}</span>
              </div>
              <div className="pending-count-row">
                <span className="pending-count-name">Afinidades de produto</span>
                <span className="pending-count-val">{pendentesAfinidade}</span>
              </div>
            </div>

            {/* Aviso Revisão de marketing */}
            <div className="marketing-review-box">
              <span className="review-box-label">Revisão de marketing</span>
              <p className="review-box-text">
                {totalPendentes === 0
                  ? 'Nenhuma sugestão pendente de revisão no momento.'
                  : 'Confirme ou rejeite as sugestões antes de segmentar.'}
              </p>
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

              {/* Ação 3: Inteligência IA */}
              <button
                type="button"
                className="quick-action-item"
                onClick={onNavigateToIa}
              >
                <div className="quick-action-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
                  </svg>
                </div>
                <div className="quick-action-content">
                  <span className="quick-action-title">Inteligência IA</span>
                  <span className="quick-action-desc">Resumir dados e executar chat inteligente.</span>
                </div>
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
