
import React, { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../../styles/DashboardPerfilCompleto.css';

// ======================================
// LOCAL STORAGE
// ======================================

function useLocalStorageState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) return JSON.parse(saved);
    } catch (error) {
      console.error('Erro ao recuperar dados:', error);
    }

    return typeof initialValue === 'function'
      ? initialValue()
      : initialValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
    }
  }, [key, value]);

  return [value, setValue];
}

// ======================================
// COMPONENTE PRINCIPAL
// ======================================

export default function DashboardPerfilCompleto({
  contact,
  onBack,
  onNavigateToEnrichment,
  onShowToast
}) {
  const storageKey = `neocore-perfil-${contact?.id ||
    contact?.email ||
    contact?.name ||
    'demo'}`;

  const [searchTerm, setSearchTerm] = useState('');
  const [sourceModal, setSourceModal] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [cadastralDraft, setCadastralDraft] = useState(null);

  // ======================================
  // AFINIDADE
  // ======================================

  const [affinityState, setAffinityState] = useLocalStorageState(
    `${storageKey}-afinidade`,
    'pending'
  );

  const handleConfirmAffinity = () => {
    setAffinityState('confirmed');
    onShowToast?.('Afinidade SaaS B2B confirmada com sucesso!');
  };

  const handleRejectAffinity = () => {
    setAffinityState('rejected');
    onShowToast?.('Afinidade SaaS B2B rejeitada.');
  };

  const handleResetAffinity = () => {
    setAffinityState('pending');
    onShowToast?.('Afinidade retornada para revisão.');
  };

  // ======================================
  // INTERESSES
  // ======================================

  const [interestValue, setInterestValue] = useLocalStorageState(
    `${storageKey}-interesse`,
    [
      {
        id: 1,
        nome: 'Tecnologia',
        origem: 'CRM Salesforce',
        confianca: '93%',
        status: 'Confirmado'
      }
    ]
  );

  const [interestInput, setInterestInput] = useState('');
  const [editingInterestId, setEditingInterestId] = useState(null);

  useEffect(() => {
    if (typeof interestValue === 'string') {
      setInterestValue([
        {
          id: Date.now(),
          nome: interestValue,
          origem: 'CRM Salesforce',
          confianca: '93%',
          status: 'Confirmado'
        }
      ]);
    }
  }, [interestValue, setInterestValue]);

  const interests = Array.isArray(interestValue)
    ? interestValue
    : [];

  const handleSaveInterest = () => {
    const nome = interestInput.trim();

    if (!nome) {
      onShowToast?.('Digite um interesse válido.');
      return;
    }

    const alreadyExists = interests.some(
      item =>
        item.nome.toLowerCase() === nome.toLowerCase() &&
        item.id !== editingInterestId
    );

    if (alreadyExists) {
      onShowToast?.('Esse interesse já está cadastrado.');
      return;
    }

    if (editingInterestId !== null) {
      setInterestValue(prev =>
        (Array.isArray(prev) ? prev : []).map(item =>
          item.id === editingInterestId
            ? { ...item, nome }
            : item
        )
      );

      onShowToast?.('Interesse atualizado com sucesso!');
    } else {
      setInterestValue(prev => [
        ...(Array.isArray(prev) ? prev : []),
        {
          id: Date.now(),
          nome,
          origem: 'Cadastro manual',
          confianca: 'Não avaliada',
          status: 'Adicionado manualmente'
        }
      ]);

      onShowToast?.('Interesse adicionado com sucesso!');
    }

    setInterestInput('');
    setEditingInterestId(null);
  };

  const handleEditInterest = interest => {
    setInterestInput(interest.nome);
    setEditingInterestId(interest.id);
  };

  const handleCancelInterestEdit = () => {
    setInterestInput('');
    setEditingInterestId(null);
  };

  const handleRemoveInterest = id => {
    setInterestValue(prev =>
      (Array.isArray(prev) ? prev : []).filter(
        item => item.id !== id
      )
    );

    if (editingInterestId === id) {
      setInterestInput('');
      setEditingInterestId(null);
    }

    onShowToast?.('Interesse removido com sucesso!');
  };

  // ======================================
  // PREFERÊNCIA E INTERAÇÕES
  // ======================================

  const [preferenceValue, setPreferenceValue] = useLocalStorageState(
    `${storageKey}-preferencia`,
    'E-mail'
  );

  const [interactionCount, setInteractionCount] = useLocalStorageState(
    `${storageKey}-interações`,
    5
  );

  const handleEditPreference = () => {
    const newPreference = window.prompt(
      'Digite a nova preferência:',
      preferenceValue
    );

    if (newPreference && newPreference.trim()) {
      setPreferenceValue(newPreference.trim());
      onShowToast?.('Preferência atualizada com sucesso!');
    }
  };

  const handleEditInteractions = () => {
    const newCount = window.prompt(
      'Digite a quantidade de cliques em campanhas:',
      interactionCount
    );

    if (newCount === null || newCount.trim() === '') return;

    const number = Number(newCount);

    if (Number.isInteger(number) && number >= 0) {
      setInteractionCount(number);
      onShowToast?.('Interações atualizadas com sucesso!');
    } else {
      onShowToast?.('Digite uma quantidade válida.');
    }
  };

  // ======================================
  // DADOS CADASTRAIS
  // ======================================

  const [cadastralData, setCadastralData] = useLocalStorageState(
    `${storageKey}-cadastro`,
    [
      {
        id: 'nome',
        icon: 'user',
        campo: 'Nome',
        valor: contact?.name || 'Mariana Souza Ltda',
        origem: 'CRM Salesforce',
        confianca: '98% · Alta',
        badgeClass: 'green'
      },
      {
        id: 'email',
        icon: 'mail',
        campo: 'E-mail',
        valor: contact?.email || 'mariana.souza@souzafilhos.com.br',
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
        id: 'area',
        icon: 'briefcase',
        campo: 'Área',
        valor: 'Comercial',
        origem: 'CRM Salesforce',
        confianca: '85% · Média',
        badgeClass: 'amber'
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
    ]
  );

  // Acrescenta nome e área aos cadastros antigos sem apagar dados existentes.
  useEffect(() => {
    const camposPadrao = [
      {
        id: 'nome',
        icon: 'user',
        campo: 'Nome',
        valor: contact?.name || 'Mariana Souza Ltda',
        origem: 'CRM Salesforce',
        confianca: '98% · Alta',
        badgeClass: 'green'
      },
      {
        id: 'area',
        icon: 'briefcase',
        campo: 'Área',
        valor: 'Comercial',
        origem: 'CRM Salesforce',
        confianca: '85% · Média',
        badgeClass: 'amber'
      }
    ];

    setCadastralData(prev => {
      const dados = Array.isArray(prev) ? prev : [];

      const novosCampos = camposPadrao.filter(
        campo => !dados.some(item => item.id === campo.id)
      );

      return novosCampos.length > 0
        ? [...novosCampos, ...dados]
        : dados;
    });
  }, [contact?.name, setCadastralData]);

  // ======================================
  // PERFIL DO CONTATO
  // ======================================

  const getCadastralValue = (id, fallback) => {
    return cadastralData.find(item => item.id === id)?.valor || fallback;
  };

  const profile = {
    name: getCadastralValue(
      'nome',
      contact?.name || 'Mariana Souza Ltda'
    ),
    initials: getCadastralValue(
      'nome',
      contact?.name || 'Mariana Souza Ltda'
    )
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(palavra => palavra[0].toUpperCase())
      .join(''),
    role: `${getCadastralValue('cargo', 'Diretora comercial')} · ${getCadastralValue('empresa', 'Souza & Filhos Comércio')}`,
    status: 'Cliente ativo',
    sourceTag: 'CRM Salesforce',
    updatedAt: 'Dados cadastrais',
    confidenceScore: 92,
    confidenceGrade: 'Alta',
    confidenceNote: 'Acima de 85 pontos'
  };

  // ======================================
  // EDIÇÃO DOS DADOS CADASTRAIS
  // ======================================

  const handleStartCadastralEdit = () => {
    setCadastralDraft(
      JSON.parse(JSON.stringify(cadastralData))
    );

    setIsEditMode(true);
  };

  const handleChangeCadastral = (id, valor) => {
    setCadastralDraft(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              valor,
              origem: 'Edição manual',
              confianca: 'Não avaliada',
              badgeClass: 'neutral'
            }
          : item
      )
    );
  };

  const handleCancelCadastralEdit = () => {
    setCadastralDraft(null);
    setIsEditMode(false);
    onShowToast?.('Edição cancelada. Os dados originais foram preservados.');
  };

  const handleSaveCadastralEdit = () => {
    if (!Array.isArray(cadastralDraft)) return;

    const obrigatorios = [
      'nome',
      'email',
      'cargo',
      'empresa',
      'area'
    ];

    for (const id of obrigatorios) {
      const campo = cadastralDraft.find(item => item.id === id);

      if (!campo || !campo.valor.trim()) {
        onShowToast?.(
          `O campo ${campo?.campo || id} é obrigatório.`
        );
        return;
      }
    }

    const email = cadastralDraft.find(
      item => item.id === 'email'
    )?.valor;

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!emailValido) {
      onShowToast?.('Digite um endereço de e-mail válido.');
      return;
    }

    setCadastralData(cadastralDraft);
    setCadastralDraft(null);
    setIsEditMode(false);

    onShowToast?.('Dados cadastrais atualizados com sucesso!');
  };

  // ======================================
  // OUTROS ESTADOS
  // ======================================

  const [savedProfile, setSavedProfile] = useLocalStorageState(
    `${storageKey}-perfil-salvo`,
    null
  );

  const [savedReview, setSavedReview] = useLocalStorageState(
    `${storageKey}-revisao-salva`,
    null
  );

  // ======================================
  // CONSULTAR FONTE
  // ======================================

  const handleConsultSource = (sourceName, details) => {
    setSourceModal({ sourceName, details });
  };

  // ======================================
  // SALVAR PERFIL
  // ======================================

  const handleSaveToRegister = () => {
    if (isEditMode) {
      onShowToast?.('Salve ou cancele a edição cadastral antes de salvar o perfil.');
      return;
    }

    const profileToSave = {
      contato: profile,
      dadosCadastrais: cadastralData,
      interesse: interests,
      preferencia: preferenceValue,
      interacoes: interactionCount,
      afinidade: affinityState,
      dataSalvamento: new Date().toISOString()
    };

    setSavedProfile(profileToSave);
    onShowToast?.('Perfil completo salvo no cadastro com sucesso!');
  };

  // ======================================
  // SALVAR REVISÃO
  // ======================================

  const handleSaveReview = () => {
    const reviewToSave = {
      afinidade: affinityState,
      interesse: interests,
      preferencia: preferenceValue,
      interacoes: interactionCount,
      dataReview: new Date().toISOString()
    };

    setSavedReview(reviewToSave);
    onShowToast?.('Revisão de inteligência salva com sucesso!');
  };

  // ======================================
  // EXPORTAÇÃO PDF
  // ======================================

  const handleExportProfile = async () => {
    if (isEditMode) {
      onShowToast?.('Salve ou cancele a edição cadastral antes de exportar.');
      return;
    }

    const doc = new jsPDF();

    const azulEscuro = [15, 23, 42];
    const azul = [11, 59, 96];
    const azulClaro = [239, 246, 255];
    const cinza = [100, 116, 139];
    const linha = [226, 232, 240];

    const dataAtual = new Date().toLocaleString('pt-BR');

    const nomeArquivo = profile.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '-');

    const interessesTexto = interests.length
      ? interests.map(item => item.nome).join(', ')
      : 'Nenhum interesse cadastrado';

    const carregarLogo = () => new Promise(resolve => {
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
          height: imagem.naturalHeight
        });
      };

      imagem.onerror = () => {
        console.error('Não foi possível carregar a logo do NeoCore.');
        resolve(null);
      };

      imagem.src = '/logo-n.png';
    });

    const logoNeoCore = await carregarLogo();

    const statusAfinidade = {
      confirmed: 'Confirmado manualmente',
      rejected: 'Rejeitado pelo usuário',
      pending: 'Pendente de confirmação'
    };

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
        doc.text('RELATORIO DE PERFIL COMPLETO', 44, 19);

        doc.setDrawColor(...linha);
        doc.line(15, 282, 195, 282);

        doc.setTextColor(...cinza);
        doc.setFontSize(8);
        doc.text('NeoCore | Documento demonstrativo', 15, 288);
        doc.text(`Pagina ${i} de ${totalPaginas}`, 195, 288, {
          align: 'right'
        });
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

    // 1. Identificação
    doc.setTextColor(...azulEscuro);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.text(profile.name, 15, 39);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...cinza);

    doc.text(profile.role, 15, 47);
    doc.text(`Status: ${profile.status}`, 15, 54);
    doc.text(`Origem: ${profile.sourceTag}`, 15, 61);
    doc.text(`Atualizacao: ${profile.updatedAt}`, 15, 68);

    doc.setFillColor(...azulClaro);
    doc.roundedRect(145, 32, 50, 40, 3, 3, 'F');

    doc.setTextColor(...azul);
    doc.setFontSize(8);
    doc.text('CONFIANCA', 170, 41, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(19);
    doc.text(`${profile.confidenceScore}/100`, 170, 54, {
      align: 'center'
    });

    doc.setFontSize(9);
    doc.text(profile.confidenceGrade, 170, 63, {
      align: 'center'
    });

    // 2. Resumo do perfil
    adicionarTitulo('Resumo do perfil', 85);

    autoTable(doc, {
      ...configuracaoTabela,
      startY: 91,
      head: [['Indicador', 'Resultado']],
      body: [
        ['Nota de confianca', `${profile.confidenceScore} - ${profile.confidenceGrade}`],
        ['Campos cadastrais', `${cadastralData.length} campos`],
        ['Interesses', interessesTexto],
        ['Preferencia de contato', preferenceValue],
        ['Interacoes em campanhas', `${interactionCount} cliques`],
        ['Afinidade SaaS B2B', statusAfinidade[affinityState] || 'Nao informado']
      ]
    });

    // 3. Dados cadastrais
    let y = doc.lastAutoTable.finalY + 13;

    if (y > 255) {
      doc.addPage();
      y = 39;
    }

    adicionarTitulo('Dados cadastrais e operacionais', y);

    autoTable(doc, {
      ...configuracaoTabela,
      startY: y + 6,
      head: [['Campo', 'Valor', 'Origem', 'Confianca']],
      body: cadastralData.map(item => [
        item.campo,
        item.valor,
        item.origem,
        item.confianca
      ]),
      styles: {
        ...configuracaoTabela.styles,
        fontSize: 7.5
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 55 },
        2: { cellWidth: 55 },
        3: { cellWidth: 40 }
      }
    });

    // 4. Inteligência do contato
    y = doc.lastAutoTable.finalY + 13;

    if (y > 255) {
      doc.addPage();
      y = 39;
    }

    adicionarTitulo('Inteligencia do contato', y);

    const linhasInteresses = interests.length
      ? interests.map(item => [
          `Interesse: ${item.nome}`,
          item.nome,
          item.origem,
          item.status
        ])
      : [['Interesses', 'Nenhum interesse cadastrado', '-', '-']];

    autoTable(doc, {
      ...configuracaoTabela,
      startY: y + 6,
      head: [['Informacao', 'Resultado', 'Origem', 'Situacao']],
      body: [
        ...linhasInteresses,
        [
          'Preferencia',
          preferenceValue,
          'Central de Preferencias',
          'Registrado'
        ],
        [
          'Afinidade SaaS B2B',
          '87% de confianca',
          'Modelo de Afinidade IA',
          statusAfinidade[affinityState] || 'Nao informado'
        ],
        [
          'Interacoes',
          `${interactionCount} cliques`,
          'Plataforma de Campanhas',
          'Registrado'
        ]
      ],
      styles: {
        ...configuracaoTabela.styles,
        fontSize: 7.5
      }
    });

    // 5. Histórico de revisão
    y = doc.lastAutoTable.finalY + 13;

    if (y > 255) {
      doc.addPage();
      y = 39;
    }

    adicionarTitulo('Historico de revisao', y);

    const revisaoData = savedReview
      ? [
          [
            'Situacao da afinidade',
            statusAfinidade[savedReview.afinidade] || 'Nao informado'
          ],
          [
            'Interesses revisados',
            Array.isArray(savedReview.interesse)
              ? savedReview.interesse.map(item => item.nome).join(', ')
              : savedReview.interesse
          ],
          ['Preferencia revisada', savedReview.preferencia],
          ['Interacoes registradas', `${savedReview.interacoes} cliques`],
          [
            'Data da revisao',
            savedReview.dataReview
              ? new Date(savedReview.dataReview).toLocaleString('pt-BR')
              : 'Nao informada'
          ]
        ]
      : [['Registro', 'Nenhuma revisao salva ate o momento']];

    autoTable(doc, {
      ...configuracaoTabela,
      startY: y + 6,
      head: [['Registro', 'Detalhes']],
      body: revisaoData
    });

    // 6. Fontes e rastreabilidade
    y = doc.lastAutoTable.finalY + 13;

    if (y > 255) {
      doc.addPage();
      y = 39;
    }

    adicionarTitulo('Fontes e rastreabilidade', y);

    const fontesData = [
      ...cadastralData.map(item => [
        item.campo,
        item.origem,
        item.confianca
      ]),
      ...interests.map(item => [
        `Interesse: ${item.nome}`,
        item.origem,
        item.confianca
      ]),
      ['Preferencia', 'Central de Preferencias', '93%'],
      ['Afinidade SaaS B2B', 'Modelo de Afinidade IA', '87%'],
      ['Interacoes', 'Plataforma de Campanhas', '91%']
    ];

    autoTable(doc, {
      ...configuracaoTabela,
      startY: y + 6,
      head: [['Informacao', 'Fonte consultada', 'Confianca']],
      body: fontesData,
      styles: {
        ...configuracaoTabela.styles,
        fontSize: 7.5
      }
    });

    // 7. Data de exportação
    y = doc.lastAutoTable.finalY + 12;

    if (y > 270) {
      doc.addPage();
      y = 39;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...cinza);
    doc.text(`Documento gerado em ${dataAtual}`, 15, y);

    // 8. Identidade visual e exportação
    adicionarIdentidade();
    doc.save(`perfil-${nomeArquivo}.pdf`);

    onShowToast?.('Relatório PDF do NeoCore exportado com sucesso!');
  };

  // ======================================
  // FILTRO DOS DADOS CADASTRAIS
  // ======================================

  const filteredCadastral = (
    isEditMode && Array.isArray(cadastralDraft)
      ? cadastralDraft
      : Array.isArray(cadastralData)
        ? cadastralData
        : []
  ).filter(item => {
    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase();

    return (
      item.campo.toLowerCase().includes(term) ||
      item.valor.toLowerCase().includes(term) ||
      item.origem.toLowerCase().includes(term)
    );
  });

  // ======================================
  // ÍCONES
  // ======================================

  const renderIcon = type => {
    switch (type) {
      case 'user':
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M5 21a7 7 0 0 1 14 0" />
          </svg>
        );

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

  // ======================================
  // JSX
  // ======================================

  return (
    <main className="perfil-completo-container">

      {/* HEADER */}
      <div className="perfil-header">
        <div className="perfil-title-group">
          <h1 className="perfil-page-title">Perfil completo</h1>
          <p className="perfil-page-subtitle">
            Interesses, preferências e afinidades · demonstração
          </p>
        </div>

        <div className="perfil-header-actions">
          <div className="perfil-search-wrapper">
            <svg className="perfil-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>

            <input
              type="text"
              placeholder="Buscar contato ou campo"
              className="perfil-search-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            className="perfil-btn-secondary"
            onClick={handleExportProfile}
            title="Exportar dados do perfil"
          >
            Exportar
          </button>

          <button
            className="perfil-btn-primary"
            onClick={handleSaveToRegister}
            title="Salvar todas as alterações"
          >
            Salvar no cadastro
          </button>
        </div>
      </div>

      {/* BANNER DO PERFIL */}
      <section className="perfil-banner-card">
        <div className="perfil-banner-left">
          <div className="perfil-avatar">{profile.initials}</div>

          <div className="perfil-info">
            <h2 className="perfil-name">{profile.name}</h2>
            <p className="perfil-role">{profile.role}</p>

            <div className="perfil-badges-row">
              <span className="perfil-status-pill green">{profile.status}</span>
              <span className="perfil-status-pill navy">{profile.sourceTag}</span>
              <span className="perfil-updated-text">{profile.updatedAt}</span>
            </div>
          </div>
        </div>

        <div className="perfil-banner-right">
          <div className="perfil-gauge-wrap">
            <svg className="perfil-gauge-svg" width="76" height="76" viewBox="0 0 80 80">
              <circle className="gauge-bg" cx="40" cy="40" r="34" strokeWidth="7" />
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

      {/* COLUNAS */}
      <div className="perfil-columns-grid">

        {/* COLUNA ESQUERDA */}
        <div className="perfil-col-left">

          {/* INTELIGÊNCIA DO CONTATO */}
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

              {/* INTERESSES */}
              <div className="intel-item-card">
                <div className="intel-item-content">
                  <h4 className="intel-item-title">
                    Interesses
                    <span className="interest-count">{interests.length}</span>
                  </h4>

                  <p className="intel-item-desc">
                    Interesses associados ao contato e suas respectivas origens.
                  </p>

                  <div className="interest-list">
                    {interests.length > 0 ? (
                      interests.map(interest => (
                        <div className="interest-row" key={interest.id}>
                          <div className="interest-row-info">
                            <span className="interest-name">{interest.nome}</span>
                            <span className="interest-meta">
                              {interest.origem} · {interest.status}
                              {interest.confianca !== 'Não avaliada' &&
                                ` · Confiança ${interest.confianca}`}
                            </span>
                          </div>

                          <div className="interest-row-actions">
                            <button type="button" className="intel-link-btn" onClick={() => handleEditInterest(interest)}>
                              Editar
                            </button>
                            <button type="button" className="intel-link-btn interest-remove-btn" onClick={() => handleRemoveInterest(interest.id)}>
                              Remover
                            </button>
                            <button
                              type="button"
                              className="intel-link-btn"
                              onClick={() => handleConsultSource(
                                interest.origem,
                                `Interesse: ${interest.nome}. Situação: ${interest.status}. Confiança: ${interest.confianca}.`
                              )}
                            >
                              Fonte
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="interest-empty">Nenhum interesse cadastrado.</p>
                    )}
                  </div>

                  <div className="interest-form">
                    <input
                      type="text"
                      className="interest-input"
                      placeholder="Digite um interesse..."
                      value={interestInput}
                      onChange={e => setInterestInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveInterest();
                      }}
                    />

                    <button type="button" className="interest-add-btn" onClick={handleSaveInterest}>
                      {editingInterestId !== null ? 'Atualizar' : '+ Adicionar'}
                    </button>

                    {editingInterestId !== null && (
                      <button type="button" className="interest-cancel-btn" onClick={handleCancelInterestEdit}>
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* PREFERÊNCIA */}
              <div className="intel-item-card">
                <div className="intel-item-content">
                  <h4 className="intel-item-title">
                    Preferência · {preferenceValue}
                  </h4>
                  <p className="intel-item-desc">
                    Declarado · central de preferências · confiança 93% ·{' '}
                    <strong className="text-confirmed">Confirmado</strong>
                  </p>
                </div>

                <div className="intel-item-actions">
                  <button className="intel-link-btn" onClick={handleEditPreference}>Editar</button>
                  <span className="intel-sep">·</span>
                  <button
                    className="intel-link-btn"
                    onClick={() => handleConsultSource(
                      'Central de Preferências',
                      'Preferência de canal de comunicação registrada no portal do cliente. Dados demonstrativos.'
                    )}
                  >
                    Consultar fonte
                  </button>
                </div>
              </div>

              {/* AFINIDADE */}
              <div className={`intel-item-card ${affinityState !== 'pending' ? 'intel-item-reviewed' : ''}`}>
                <div className="intel-item-content">
                  <h4 className="intel-item-title">Afinidade · SaaS B2B</h4>
                  <p className="intel-item-desc">
                    Sugerido por IA · modelo de afinidade · confiança 87% ·{' '}
                    {affinityState === 'pending' && (
                      <span className="text-pending">Pendente de confirmação</span>
                    )}
                    {affinityState === 'confirmed' && (
                      <strong className="text-confirmed">Confirmado manualmente ✓</strong>
                    )}
                    {affinityState === 'rejected' && (
                      <strong className="text-rejected">Rejeitado pelo usuário ✕</strong>
                    )}
                  </p>
                </div>

                <div className="intel-item-actions">
                  {affinityState === 'pending' ? (
                    <>
                      <button className="intel-btn-confirm" onClick={handleConfirmAffinity}>Confirmar</button>
                      <span className="intel-sep">·</span>
                      <button className="intel-btn-reject" onClick={handleRejectAffinity}>Rejeitar</button>
                      <span className="intel-sep">·</span>
                    </>
                  ) : (
                    <>
                      <button className="intel-link-btn" onClick={handleResetAffinity}>Revisar novamente</button>
                      <span className="intel-sep">·</span>
                    </>
                  )}

                  <button
                    className="intel-link-btn"
                    onClick={() => handleConsultSource(
                      'Modelo de Afinidade IA',
                      'Predição demonstrativa de afinidade com SaaS B2B. A pontuação apresentada não representa uma consulta independente.'
                    )}
                  >
                    Consultar fonte
                  </button>
                </div>
              </div>

              {/* INTERAÇÕES */}
              <div className="intel-item-card">
                <div className="intel-item-content">
                  <h4 className="intel-item-title">
                    Interações · {interactionCount} cliques em campanhas nos últimos 30 dias
                  </h4>
                  <p className="intel-item-desc">
                    Observados · plataforma de campanhas · confiança 91% ·{' '}
                    <strong className="text-confirmed">Registrado</strong>
                  </p>
                </div>

                <div className="intel-item-actions">
                  <button className="intel-link-btn" onClick={handleEditInteractions}>Editar</button>
                  <span className="intel-sep">·</span>
                  <button
                    className="intel-link-btn"
                    onClick={() => handleConsultSource(
                      'Plataforma de Campanhas',
                      `${interactionCount} eventos de clique registrados. Dados demonstrativos.`
                    )}
                  >
                    Consultar fonte
                  </button>
                </div>
              </div>
            </div>

            <div className="intel-footer-notes">
              <p className="intel-note-unavailable">
                Categoria secundária · Indisponível — nenhuma fonte retornou dados. Tentar novamente.
              </p>
              <p className="intel-note-explanation">
                Feedback de revisão: confirmado → disponível para segmentos; rejeitado → não utilizar. Falha ao salvar? Suas alterações permanecem para nova tentativa.
              </p>
            </div>
          </section>

          {/* DADOS CADASTRAIS */}
          <section className="perfil-card">
            <div className="perfil-card-header">
              <div>
                <h3 className="perfil-card-title">Dados cadastrais e operacionais</h3>
                <p className="perfil-card-subtitle">
                  Dados existentes · disponíveis para consulta e edição.
                </p>
              </div>

              {isEditMode ? (
                <div className="cadastral-edit-actions">
                  <button
                    type="button"
                    className="perfil-btn-outline"
                    onClick={handleCancelCadastralEdit}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="perfil-btn-primary"
                    onClick={handleSaveCadastralEdit}
                  >
                    Salvar alterações
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="perfil-edit-action-btn"
                  onClick={handleStartCadastralEdit}
                >
                  Editar dados
                </button>
              )}
            </div>

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
                  {filteredCadastral.map(row => (
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
                            value={
                              cadastralDraft?.find(item => item.id === row.id)?.valor ?? row.valor
                            }
                            className="cadastral-inline-input"
                            onChange={e => handleChangeCadastral(row.id, e.target.value)}
                            placeholder={`Digite ${row.campo.toLowerCase()}`}
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

              {filteredCadastral.length === 0 && (
                <p className="interest-empty">
                  Nenhum campo encontrado para essa pesquisa.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* COLUNA DIREITA */}
        <div className="perfil-col-right">

          {/* NOTA DE CONFIANÇA */}
          <section className="perfil-card">
            <h3 className="perfil-card-title">Nota de confiança</h3>
            <p className="perfil-card-subtitle">Resumo da avaliação.</p>

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

            <div className="confidence-summary-list">
              <div className="confidence-summary-row">
                <span className="confidence-label">Esta nota</span>
                <span className="confidence-value text-green">92 · Alta</span>
              </div>
              <div className="confidence-summary-row">
                <span className="confidence-label">Campos cadastrados</span>
                <span className="confidence-value">{cadastralData.length}</span>
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

          {/* REVISÃO DE INTELIGÊNCIA */}
          <section className="perfil-card">
            <h3 className="perfil-card-title">Revisão de inteligência</h3>
            <p className="perfil-card-subtitle">
              Confirme sugestões antes de usar em campanhas.
            </p>

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

          {/* AÇÕES RÁPIDAS */}
          <section className="perfil-card">
            <h3 className="perfil-card-title">Ações rápidas</h3>
            <p className="perfil-card-subtitle">Atalhos para este perfil.</p>

            <div className="quick-actions-list">
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

      {/* MODAL DE FONTE */}
      {sourceModal && (
        <div
          className="source-modal-overlay"
          onClick={() => setSourceModal(null)}
        >
          <div
            className="source-modal-box"
            onClick={e => e.stopPropagation()}
          >
            <div className="source-modal-header">
              <h4 className="source-modal-title">Origem e Auditoria do Dado</h4>
              <button
                className="source-modal-close"
                onClick={() => setSourceModal(null)}
              >
                ×
              </button>
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
                <span className="source-modal-tag">
                  A validar conforme a finalidade e a base legal aplicável.
                </span>
              </div>
            </div>

            <div className="source-modal-footer">
              <button
                className="perfil-btn-primary"
                onClick={() => setSourceModal(null)}
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
