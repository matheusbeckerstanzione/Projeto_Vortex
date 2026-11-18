import React, { useEffect, useState } from 'react';
import '../../styles/DashboardFichaOrigem.css';

const validateCNPJ = (value) => {
  const cnpj = String(value || '').replace(/\D/g, '');

  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) {
    return false;
  }

  const calculateDigit = (numbers, weights) => {
    const sum = numbers.split('').reduce(
      (total, number, index) =>
        total + Number(number) * weights[index],
      0
    );

    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calculateDigit(
    cnpj.slice(0, 12),
    [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  );

  const secondDigit = calculateDigit(
    cnpj.slice(0, 12) + firstDigit,
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  );

  return cnpj.endsWith(`${firstDigit}${secondDigit}`);
};

const analyzeSourceQuality = (fields) => {
  const analyzedFields = fields.map((field) => {
    const label = field.label.toLowerCase();
    const value = String(field.value ?? '').trim();

    if (!value) {
      return {
        ...field,
        status: 'ausente',
        message: 'Este campo não possui informação.'
      };
    }

    if (label.includes('e-mail') || label.includes('email')) {
      const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

      return {
        ...field,
        status: validEmail ? 'preenchido' : 'inconsistente',
        message: validEmail
          ? 'Formato de e-mail aparentemente válido.'
          : 'O formato do e-mail parece inválido.'
      };
    }

    if (label.includes('telefone') || label.includes('celular')) {
      const digits = value.replace(/\D/g, '');
      const validPhone = digits.length >= 10 && digits.length <= 13;

      return {
        ...field,
        status: validPhone ? 'preenchido' : 'inconsistente',
        message: validPhone
          ? 'Quantidade de dígitos compatível com um telefone.'
          : 'Quantidade de dígitos fora do padrão esperado.'
      };
    }

    if (label.includes('cnpj')) {
      const validCNPJ = validateCNPJ(value);

      return {
        ...field,
        status: validCNPJ ? 'preenchido' : 'inconsistente',
        message: validCNPJ
          ? 'Dígitos verificadores do CNPJ válidos.'
          : 'CNPJ com formato ou dígitos verificadores inválidos.'
      };
    }

    return {
      ...field,
      status: 'preenchido',
      message: 'Campo preenchido. Não possui validação específica de formato.'
    };
  });

  const total = analyzedFields.length;
  const missing = analyzedFields.filter(
    field => field.status === 'ausente'
  ).length;
  const inconsistent = analyzedFields.filter(
    field => field.status === 'inconsistente'
  ).length;
  const filled = analyzedFields.filter(
    field => field.status === 'preenchido'
  ).length;

  const conformity = total > 0
    ? Math.round(((total - missing - inconsistent) / total) * 100)
    : 0;

  return {
    fields: analyzedFields,
    total,
    filled,
    missing,
    inconsistent,
    conformity
  };
};

const normalizeText = (value) => {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
};

const buildComparisonData = (sourcesData) => {
  const fieldsToCompare = [
    { campo: 'Nome', aliases: ['nome', 'nome completo'] },
    { campo: 'E-mail', aliases: ['e-mail', 'email', 'e-mail comercial'] },
    { campo: 'Telefone', aliases: ['telefone', 'celular', 'telefone comercial'] },
    { campo: 'CNPJ', aliases: ['cnpj'] },
    { campo: 'Endereço', aliases: ['endereço', 'endereco'] },
    { campo: 'Segmento', aliases: ['segmento', 'segmento original'] },
    { campo: 'Origem da lista', aliases: ['origem da lista'] }
  ];

  const normalizeValue = (value, campo) => {
    const normalized = normalizeText(value);

    if (campo === 'Telefone' || campo === 'CNPJ') {
      return normalized.replace(/\D/g, '');
    }

    return normalized;
  };

  return fieldsToCompare.map((item) => {
    const row = {
      campo: item.campo,
      crm: null,
      erp: null,
      csv: null
    };

    Object.keys(sourcesData).forEach((sourceId) => {
      const source = sourcesData[sourceId];

      const matchingField = source.fields.find((field) => {
        const label = normalizeText(field.label);

        return item.aliases.some(
          alias => normalizeText(alias) === label
        );
      });

      if (matchingField) {
        row[sourceId] = matchingField.value;
      }
    });

    const availableValues = ['crm', 'erp', 'csv']
      .filter(sourceId => row[sourceId])
      .map(sourceId => normalizeValue(row[sourceId], item.campo));

    if (availableValues.length < 2) {
      row.status = 'sem-comparacao';
    } else {
      row.status = new Set(availableValues).size === 1
        ? 'convergente'
        : 'divergente';
    }

    return row;
  });
};

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

  const [revisionRequests, setRevisionRequests] = useState([]);
  const [revisionSuccess, setRevisionSuccess] = useState(false);

  /*
   * IMPORTANTE:
   * Esta chave precisa ser igual à utilizada na tela Perfil Completo.
   * Assim, as duas telas consultam e atualizam as mesmas solicitações.
   */
  const storageKey = `neocore-perfil-${contact?.id ||
    contact?.email ||
    contact?.name ||
    'demo'}`;

  const revisionStorageKey = `${storageKey}-solicitacoes-revisao`;

  // Carrega as solicitações salvas.
  const loadRevisionRequests = () => {
    try {
      const savedRequests = localStorage.getItem(revisionStorageKey);

      if (!savedRequests) {
        return [];
      }

      const parsedRequests = JSON.parse(savedRequests);

      return Array.isArray(parsedRequests)
        ? parsedRequests
        : [];
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
      return [];
    }
  };

  // Atualiza as solicitações na tela.
  const refreshRevisionRequests = () => {
    setRevisionRequests(loadRevisionRequests());
  };

  // Carrega as solicitações quando o contato é alterado.
  useEffect(() => {
    refreshRevisionRequests();
  }, [revisionStorageKey]);

  /*
   * Sincronização entre Ficha de origem e Perfil Completo.
   *
   * O evento personalizado atualiza as telas abertas na mesma aba.
   * O evento storage atualiza quando a alteração acontece em outra aba.
   */
  useEffect(() => {
    const syncRequests = () => {
      refreshRevisionRequests();
    };

    const handleStorageChange = (event) => {
      if (event.key === revisionStorageKey) {
        syncRequests();
      }
    };

    window.addEventListener(
      'neocore:revision-requests-updated',
      syncRequests
    );

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(
        'neocore:revision-requests-updated',
        syncRequests
      );

      window.removeEventListener('storage', handleStorageChange);
    };
  }, [revisionStorageKey]);

  // Perfil base do contato.
  const profileName = contact?.name || 'Mariana Souza';
  const profileCompany = contact?.company || 'Mariana Souza Ltda';
  const profileCode = contact?.id || 'NC-00142';
  const profileInitials = contact?.initials || 'MS';

  // Fontes disponíveis com dados demonstrativos.
  const sourcesData = {
    crm: {
      id: 'crm',
      name: 'CRM Salesforce',
      code: 'SF-00482',
      syncDate: '11/10/2026, às 08:42',
      dateShort: '11/10/2026, 08:42',
      syncStatus: 'sincronizado',
      syncStatusLabel: 'Sincronizado',
      collectionMethod: 'Integração com CRM',
      collectionDate: '11/10/2026, às 08:42',

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
      dateShort: '11/10/2026, 08:40',
      syncStatus: 'sincronizado',
      syncStatusLabel: 'Sincronizado',
      collectionMethod: 'Integração com ERP',
      collectionDate: '11/10/2026, às 08:40',

      fields: [
        {
          label: 'Razão Social',
          value: 'Mariana Souza Comércio de Calçados ME'
        },
        { label: 'CNPJ', value: '12.345.678/0001-90' },
        { label: 'Inscrição Estadual', value: '112.445.789.110' },
        {
          label: 'Endereço',
          value: 'Rua das Acácias, 410 - São Paulo, SP'
        }
      ],

      confidence: '95% · Alta',
      confidenceDesc: 'Avaliação demonstrativa da confiabilidade da fonte.',
      legalBase: 'Obrigação Legal',
      legalBaseDesc: 'Emissão e conciliação de documentos fiscais eletrônicos.'
    },

    csv: {
      id: 'csv',
      name: 'Importação CSV',
      code: 'cliente_outubro.csv',
      syncDate: '10/10/2026, às 16:15',
      dateShort: '10/10/2026, 16:15',
      syncStatus: 'sincronizado',
      syncStatusLabel: 'Sincronizado',
      collectionMethod: 'Upload manual de planilha',
      collectionDate: '10/10/2026, às 16:15',

      fields: [
        { label: 'Nome Completo', value: 'Mariana Souza' },
        { label: 'E-mail Comercial', value: 'mariana@msouza.com.br' },
        { label: 'Segmento Original', value: 'Cliente - B2B' },
        {
          label: 'Origem da Lista',
          value: 'Upload manual de planilha'
        }
      ],

      confidence: '82% · Média',
      confidenceDesc: 'Avaliação demonstrativa de uma planilha estática importada manualmente.',
      legalBase: 'Legítimo Interesse',
      legalBaseDesc: 'Base legal informada no cadastro demonstrativo, sujeita à validação.'
    }
  };

  const activeSource = sourcesData[selectedSourceId] || sourcesData.crm;
  const qualityAnalysis = analyzeSourceQuality(activeSource.fields);

  // Histórico demonstrativo de sincronização.
  const syncHistory = [
    {
      id: 1,
      datetime: '10/10/2026, 16:15',
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

  const comparisonData = buildComparisonData(sourcesData);

  const handleOpenRevision = () => {
    setRevisionSuccess(false);
    setIsRevisionModalOpen(true);
  };

  // Envia e salva uma nova solicitação.
  const handleSendRevision = (event) => {
    event.preventDefault();

    if (!revisionNotes.trim()) {
      return;
    }

    try {
      const savedRequests = loadRevisionRequests();
      const now = new Date().toISOString();

      const newRequest = {
        id: Date.now(),
        contactId: contact?.id || null,
        contactName: profileName,
        sourceId: selectedSourceId,
        source: activeSource.name,
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

      localStorage.setItem(
        revisionStorageKey,
        JSON.stringify(updatedRequests)
      );

      setRevisionRequests(updatedRequests);

      window.dispatchEvent(
        new CustomEvent('neocore:revision-requests-updated')
      );

      setRevisionNotes('');
      setIsRevisionModalOpen(false);
      setRevisionSuccess(true);

      onShowToast?.('Solicitação enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar solicitação:', error);
      onShowToast?.('Não foi possível enviar a solicitação.');
    }
  };

  // Formata a data das solicitações.
  const formatRequestDate = (date) => {
    if (!date) return '-';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return '-';
    }

    return parsedDate.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Converte o status para um texto amigável.
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

      {/* Breadcrumbs */}
      <nav className="ficha-breadcrumb" aria-label="Navegação estrutural">
        <button
          type="button"
          className="breadcrumb-link"
          onClick={onBack}
        >
          Contatos
        </button>

        <span className="breadcrumb-separator">/</span>

        <button
          type="button"
          className="breadcrumb-link"
          onClick={onBack}
        >
          {profileName}
        </button>

        <span className="breadcrumb-separator">/</span>

        <span className="breadcrumb-current">Ficha de origem</span>
      </nav>

      {/* Header principal */}
      <div className="ficha-page-header">
        <div className="ficha-title-group">
          <h1 className="ficha-page-title">Ficha de origem</h1>

          <p className="ficha-page-subtitle">
            Consulte a procedência dos dados deste contato.
          </p>
        </div>

        <div className="ficha-header-actions">
          <button
            type="button"
            className="ficha-btn-outline"
            onClick={handleOpenLogs}
          >
            Ver logs de auditoria
          </button>

          <button
            type="button"
            className="ficha-btn-primary"
            onClick={handleOpenRevision}
          >
            Solicitar revisão
          </button>
        </div>
      </div>

      {/* Card do contato */}
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
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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
            <p>O pedido foi salvo e está aguardando análise.</p>
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

      {/* Grid central */}
      <div className="ficha-middle-grid">

        {/* Lista de fontes */}
        <div className="sources-col-left">
          <section className="ficha-card sources-list-card">
            <div className="sources-list-header">
              <h3 className="ficha-card-title">Fontes vinculadas</h3>
              <span className="sources-count-badge">3 fontes</span>
            </div>

            <div className="sources-items-list">
              {Object.values(sourcesData).map((source) => (
                <button
                  type="button"
                  key={source.id}
                  className={`source-selection-item ${
                    selectedSourceId === source.id ? 'active' : ''
                  }`}
                  onClick={() => setSelectedSourceId(source.id)}
                  aria-pressed={selectedSourceId === source.id}
                >
                  <div className="source-item-title-row">
                    <h4 className="source-item-title">{source.name}</h4>
                  </div>

                  <p className="source-item-reg">
                    Registro {source.code}
                  </p>

                  <p className="source-item-date">
                    Sincronizado · {source.dateShort}
                  </p>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Detalhes da fonte selecionada */}
        <div className="sources-col-right">
          <section className="ficha-card source-details-card">

            <div className="source-details-top">
              <div className="source-top-left">
                <span className="source-top-label">Fonte</span>

                <h3 className="source-top-title">
                  {activeSource.name}
                </h3>

                <p className="source-top-sub">
                  Registro de origem: {activeSource.code}
                </p>
              </div>

              <div className="source-top-right">
                <span className="source-top-label">
                  Data de sincronização
                </span>

                <h3 className="source-top-title">
                  {activeSource.syncDate}
                </h3>

                <p className="source-top-sub">
                  Última atualização da fonte
                </p>
              </div>
            </div>

            {/* Status e método de coleta */}
            <div className="source-sync-status">
              <div className="source-sync-info">
                <span
                  className={`sync-status-indicator ${activeSource.syncStatus}`}
                />

                <div>
                  <strong>{activeSource.syncStatusLabel}</strong>

                  <p>
                    Última sincronização: {activeSource.syncDate}
                  </p>
                </div>
              </div>

              <div className="source-sync-method">
                <span>Método de coleta</span>
                <strong>{activeSource.collectionMethod}</strong>
              </div>
            </div>

            {/* Dados da origem */}
            <div className="source-fields-section">
              <h4 className="source-fields-heading">
                Dados desta origem
              </h4>

              <div className="source-fields-table">
                {activeSource.fields.map((field, index) => (
                  <div key={index} className="source-field-row">
                    <div className="source-field-content">
                      <span className="source-field-label">
                        {field.label}
                      </span>

                      <strong className="source-field-value">
                        {field.value}
                      </strong>

                      <div className="source-field-provenance">
                        <span>Origem: {activeSource.name}</span>
                        <span>Registro: {activeSource.code}</span>
                        <span>
                          Coletado em: {activeSource.collectionDate}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Análise de qualidade */}
            <div className="quality-analysis-section">
              <div className="quality-analysis-header">
                <div>
                  <h4 className="source-fields-heading">
                    Análise de qualidade dos dados
                  </h4>

                  <p>
                    Verificação de preenchimento e formato das informações desta origem.
                  </p>
                </div>

                <span className="quality-analysis-total">
                  {qualityAnalysis.total} campos analisados
                </span>
              </div>

              <div className="quality-score-card">
                <div className="quality-score-info">
                  <span>Índice de conformidade</span>

                  <strong>{qualityAnalysis.conformity}%</strong>

                  <p>
                    Baseado nas verificações de preenchimento e formato.
                  </p>
                </div>

                <div className="quality-progress">
                  <div
                    className="quality-progress-fill"
                    style={{
                      width: `${qualityAnalysis.conformity}%`
                    }}
                  />
                </div>

                <div className="quality-metrics-grid">
                  <div className="quality-metric">
                    <span className="quality-metric-icon filled">✓</span>

                    <div>
                      <strong>{qualityAnalysis.filled}</strong>
                      <span>Campos preenchidos</span>
                    </div>
                  </div>

                  <div className="quality-metric">
                    <span className="quality-metric-icon warning">!</span>

                    <div>
                      <strong>{qualityAnalysis.inconsistent}</strong>
                      <span>Inconsistências</span>
                    </div>
                  </div>

                  <div className="quality-metric">
                    <span className="quality-metric-icon missing">!</span>

                    <div>
                      <strong>{qualityAnalysis.missing}</strong>
                      <span>Campos ausentes</span>
                    </div>
                  </div>
                </div>

                <div className="quality-details">
                  <h5>Detalhamento de análise</h5>

                  {qualityAnalysis.fields.map((field, index) => (
                    <div className="quality-detail-row" key={index}>
                      <div className="quality-detail-info">
                        <strong>{field.label}</strong>

                        <span>
                          {field.value || 'Não informado'}
                        </span>

                        <p>{field.message}</p>
                      </div>

                      <span className={`quality-status ${field.status}`}>
                        {field.status === 'preenchido'
                          ? 'Preenchido'
                          : field.status === 'inconsistente'
                            ? 'Inconsistente'
                            : 'Ausente'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Confiança e base legal */}
            <div className="source-evaluation-cards">
              <div className="eval-box">
                <div className="eval-box-header">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>

                  <span className="eval-box-title">Confiança</span>
                </div>

                <h5 className="eval-box-val">
                  {activeSource.confidence}
                </h5>

                <p className="eval-box-desc">
                  {activeSource.confidenceDesc}
                </p>
              </div>

              <div className="eval-box">
                <div className="eval-box-header">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>

                  <span className="eval-box-title">Base legal</span>
                </div>

                <h5 className="eval-box-val">
                  {activeSource.legalBase}
                </h5>

                <p className="eval-box-desc">
                  {activeSource.legalBaseDesc}
                </p>
              </div>
            </div>

            {/* Aviso */}
            <div className="ficha-info-callout">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0284c7"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>

              <span>
                Dados de confiança e base legal pendentes de revisão.
                A vinculação da fonte não representa validação legal.
              </span>
            </div>

            {/* Rodapé da origem */}
            <div className="source-card-footer">
              <span className="source-footer-text">
                Consulte o histórico de ações nos logs de auditoria.
              </span>

              <div className="source-footer-btns">
                <button
                  type="button"
                  className="ficha-btn-outline"
                  onClick={handleOpenLogs}
                >
                  Ver logs de auditoria
                </button>

                <button
                  type="button"
                  className="ficha-btn-primary"
                  onClick={handleOpenRevision}
                >
                  Solicitar revisão
                </button>
              </div>
            </div>

          </section>
        </div>
      </div>

      {/* Histórico de sincronização */}
      <section className="ficha-card history-section-card">
        <div className="ficha-card-header">
          <h3 className="ficha-card-title">
            Histórico de sincronização
          </h3>

          <span className="history-count-badge">
            {syncHistory.length} eventos
          </span>
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
                    <span className="result-pill-green">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Comparação entre fontes */}
      <section className="ficha-card comparison-section-card">
        <div className="ficha-card-header">
          <h3 className="ficha-card-title">
            Comparação entre fontes
          </h3>

          <span className="history-count-badge">
            {comparisonData.length} campos
          </span>
        </div>

        <div className="ficha-table-wrap">
          <table className="ficha-table comparison-table">
            <thead>
              <tr>
                <th>CAMPO</th>
                <th>CRM SALESFORCE</th>
                <th>ERP OMIE</th>
                <th>IMPORTAÇÃO CSV</th>
                <th>RESULTADO</th>
              </tr>
            </thead>

            <tbody>
              {comparisonData.map((row, index) => (
                <tr key={index}>
                  <td className="td-campo-name">{row.campo}</td>

                  <td className="td-field-val">
                    {row.crm || '-'}
                  </td>

                  <td className="td-field-val empty-val">
                    {row.erp || '-'}
                  </td>

                  <td className="td-field-val empty-val">
                    {row.csv || '-'}
                  </td>

                  <td>
                    <span className={`comparison-status ${row.status}`}>
                      {row.status === 'convergente'
                        ? 'Convergente'
                        : row.status === 'divergente'
                          ? 'Divergente'
                          : 'Sem comparação'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Histórico de solicitações de revisão */}
      <section className="ficha-card revision-history-section">
        <div className="ficha-card-header">
          <div>
            <h3 className="ficha-card-title">
              Solicitações de revisão
            </h3>

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

            <p>
              Quando uma revisão for solicitada, ela aparecerá aqui.
            </p>
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

      {/* Modal de solicitação de revisão */}
      {isRevisionModalOpen && (
        <div
          className="ficha-modal-overlay"
          onClick={() => setIsRevisionModalOpen(false)}
        >
          <div
            className="ficha-modal-box"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="ficha-modal-header">
              <h4 className="ficha-modal-title">
                Solicitar Revisão de Dados
              </h4>

              <button
                type="button"
                className="ficha-modal-close"
                onClick={() => setIsRevisionModalOpen(false)}
                aria-label="Fechar modal"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSendRevision}
              className="ficha-modal-body"
            >
              <p className="ficha-modal-desc">
                Descreva a inconsistência observada nos dados da fonte{' '}
                <strong>{activeSource.name}</strong> para o time de governança.
              </p>

              <textarea
                className="ficha-modal-textarea"
                placeholder="Ex: Telefone divergente do cadastro físico ou falta de consentimento de marketing..."
                rows="4"
                value={revisionNotes}
                onChange={(event) => setRevisionNotes(event.target.value)}
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

                <button
                  type="submit"
                  className="ficha-btn-primary"
                >
                  Enviar solicitação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de logs de auditoria */}
      {isLogsModalOpen && (
        <div
          className="ficha-modal-overlay"
          onClick={() => setIsLogsModalOpen(false)}
        >
          <div
            className="ficha-modal-box"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="ficha-modal-header">
              <h4 className="ficha-modal-title">
                Logs de Auditoria · {profileName}
              </h4>

              <button
                type="button"
                className="ficha-modal-close"
                onClick={() => setIsLogsModalOpen(false)}
                aria-label="Fechar modal"
              >
                ×
              </button>
            </div>

            <div className="ficha-modal-body">
              <div className="logs-mini-list">
                <div className="log-mini-row">
                  <span className="log-mini-date">
                    11/10/2026 08:42:15
                  </span>

                  <p className="log-mini-text">
                    Conciliação automática via motor NeoCore v2.4
                  </p>
                </div>

                <div className="log-mini-row">
                  <span className="log-mini-date">
                    11/10/2026 08:40:02
                  </span>

                  <p className="log-mini-text">
                    Payload recebido via Webhook ERP Omie (Sync 200 OK)
                  </p>
                </div>

                <div className="log-mini-row">
                  <span className="log-mini-date">
                    10/10/2026 16:15:30
                  </span>

                  <p className="log-mini-text">
                    Criação inicial do cadastro a partir do arquivo cliente_outubro.csv
                  </p>
                </div>
              </div>
            </div>

            <div className="ficha-modal-footer">
              <button
                type="button"
                className="ficha-btn-primary"
                onClick={() => setIsLogsModalOpen(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}