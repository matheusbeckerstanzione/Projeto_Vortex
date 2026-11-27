import React, { useState, useMemo, useEffect, useRef } from 'react';
import { segmentService, DEFAULT_SEGMENT } from '../../services/segmentService';
import ModalEditarSegmento from './ModalEditarSegmentos';
import ModalExcluirSegmento from './ModalExcluirSegmentos';
import ModalDetalhesContato from './ModalDetalhesContatoSegmentos';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../../styles/DashboardSegmentos.css';

const CONTATOS_POR_PAGINA = 10;

export default function DashboardSegmentos({ onShowToast, onNavigateToContact }) {
  const [segments, setSegments] = useState([DEFAULT_SEGMENT]);
  const [selectedSegmentId, setSelectedSegmentId] = useState(DEFAULT_SEGMENT.id);
  const [segmentMobileTab, setSegmentMobileTab] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeChip, setActiveChip] = useState(null);

  useEffect(() => {
    segmentService.getSegments().then((list) => {
      if (list && list.length > 0) {
        setSegments(list);
        setSelectedSegmentId(list[0].id);
      }
    });
  }, []);

  // Estados da Modal Criar Segmento com IA (1 a 7)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalState, setModalState] = useState(1); // 1 a 7
  const [segmentName, setSegmentName] = useState('Clientes B2B unificados');
  const [segmentPrompt, setSegmentPrompt] = useState(
    'Encontre clientes B2B com perfil unificado e vínculo no CRM Salesforce ou ERP Oracle para uma campanha por e-mail.'
  );
  const [excludeOptOut, setExcludeOptOut] = useState(true);
  const [excludeSemBase, setExcludeSemBase] = useState(true);
  const [targetCrm, setTargetCrm] = useState('CRM Salesforce');
  const [targetCampaign, setTargetCampaign] = useState('Público B2B · destino de exemplo');
  const [campaignName, setCampaignName] = useState('Relacionamento B2B · outubro/2026');
  const [enableAutomation, setEnableAutomation] = useState(true);

  // Estados dos Modais (Editar, Excluir, Detalhes do Contato)
  const [isEditSegModalOpen, setIsEditSegModalOpen] = useState(false);
  const [segmentToDelete, setSegmentToDelete] = useState(null);
  const [contatoSelecionado, setContatoSelecionado] = useState(null);
  const [contatosSelecionados, setContatosSelecionados] = useState([]);
  const [mostrarTodosContatos, setMostrarTodosContatos] = useState(false);
  const [paginaContatos, setPaginaContatos] = useState(1);
  const [isSavingSeg, setIsSavingSeg] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Segmento atualmente selecionado na lista
  const selectedSegment = useMemo(() => {
    return segments.find(s => s.id === selectedSegmentId) || segments[0];
  }, [segments, selectedSegmentId]);

  // Carrega a prévia real de contatos quando seleciona um segmento do backend
  useEffect(() => {
    if (!selectedSegmentId) return;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedSegmentId);
    if (!isUUID) return;

    segmentService.getPrevia(selectedSegmentId).then((previewList) => {
      setSegments((prev) =>
        prev.map((s) =>
          s.id === selectedSegmentId
            ? {
                ...s,
                previewContacts: previewList,
                contactsCount: previewList.length,
              }
            : s
        )
      );
    });
  }, [selectedSegmentId]);

  const handleOpenEditSegment = () => {
    if (!selectedSegment) return;
    setIsEditSegModalOpen(true);
  };

  const handleSaveEditSegment = async (segmentoAtualizado) => {
    if (!segmentoAtualizado || !segmentoAtualizado.name?.trim()) return;
    setIsSavingSeg(true);
    const nextStatus = segmentoAtualizado.backendStatus || 'ATIVO';

    try {
      await segmentService.updateSegment(segmentoAtualizado.id, {
        name: segmentoAtualizado.name,
        description: segmentoAtualizado.description,
        criterios: segmentoAtualizado.criteriosObj,
        finalidadeId: segmentoAtualizado.finalidadeId,
        status: nextStatus,
      });

      const visualStatus =
        nextStatus === 'ATIVO'
          ? 'Ativo'
          : nextStatus === 'ARQUIVADO'
            ? 'Sem resultados'
            : 'Rascunho';

      setSegments((prev) =>
        prev.map((s) =>
          s.id === segmentoAtualizado.id
            ? {
                ...s,
                name: segmentoAtualizado.name.trim(),
                description: segmentoAtualizado.description.trim(),
                criteria: segmentoAtualizado.criteria?.trim() || segmentoAtualizado.description.trim() || s.criteria,
                backendStatus: nextStatus,
                status: visualStatus,
                statusClass: nextStatus === 'ATIVO' ? 'active' : 'draft',
                updatedAt: 'Hoje',
              }
            : s
        )
      );
      setIsEditSegModalOpen(false);
      if (onShowToast) onShowToast(`Segmento "${segmentoAtualizado.name.trim()}" atualizado com sucesso!`);
    } catch (err) {
      if (onShowToast) onShowToast('Erro ao atualizar segmento: ' + (err?.message || 'Verifique os dados.'));
    } finally {
      setIsSavingSeg(false);
    }
  };

  const handleDuplicateSegment = () => {
    if (!selectedSegment) return;

    let newId = `SEG-${Date.now()}`;
    while (segments.some((segment) => segment.id === newId)) {
      newId = `SEG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }

    const duplicatedSegment = {
      ...selectedSegment,
      id: newId,
      name: `${selectedSegment.name} (cópia)`,
      status: 'Rascunho',
      backendStatus: 'RASCUNHO',
      statusClass: 'draft',
      isBackend: false,
      updatedAt: 'Agora',
      dynamicText: 'Rascunho · cálculo pendente.',
      criteriaRules: (selectedSegment.criteriaRules || []).map((rule) => ({ ...rule })),
      sources: (selectedSegment.sources || []).map((source) => ({ ...source })),
      previewContacts: (selectedSegment.previewContacts || []).map((contact) => ({ ...contact })),
      channelRule: selectedSegment.channelRule
        ? { ...selectedSegment.channelRule }
        : selectedSegment.channelRule,
    };

    setSegments((previous) => [duplicatedSegment, ...previous]);
    setSelectedSegmentId(newId);
    if (onShowToast) onShowToast('Segmento duplicado como rascunho.');
  };

  const handleOpenDeleteModal = () => {
    if (!selectedSegment) return;
    setSegmentToDelete(selectedSegment);
  };

  const handleConfirmDeleteSegment = async () => {
    if (!segmentToDelete) return;

    if (segments.length <= 1) {
      if (onShowToast) onShowToast('É necessário manter pelo menos um segmento.');
      setSegmentToDelete(null);
      return;
    }

    try {
      await segmentService.alterarStatus(segmentToDelete.id, 'ARQUIVADO');
    } catch (err) {
      console.warn('Erro ao arquivar segmento no backend:', err?.message);
    }

    const segmentosRestantes = segments.filter((s) => s.id !== segmentToDelete.id);
    setSegments(segmentosRestantes);
    if (String(selectedSegmentId) === String(segmentToDelete.id) && segmentosRestantes.length > 0) {
      setSelectedSegmentId(segmentosRestantes[0].id);
    }
    setContatosSelecionados([]);
    setMostrarTodosContatos(false);
    setPaginaContatos(1);
    setSegmentToDelete(null);

    if (onShowToast) onShowToast('Segmento excluído com sucesso!');
  };

  const handleExportSegments = () => {
    if (!segments || segments.length === 0) {
      onShowToast?.('Não há segmentos para exportar.');
      return;
    }

    try {
      const headers = ['Nome', 'Critérios', 'Contatos', 'Status', 'Atualização'];
      const rows = segments.map((segment) => [
        segment.name ?? '',
        segment.criteria ?? '',
        segment.contactsCount ?? '',
        segment.status ?? '',
        segment.updatedAt ?? '',
      ]);

      const csvContent = [headers, ...rows]
        .map((row) =>
          row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(';')
        )
        .join('\r\n');

      const blob = new Blob(['\uFEFF', csvContent], { type: 'text/csv;charset=utf-8;' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'catalogo-segmentos.csv';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
      onShowToast?.('Catálogo de segmentos exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar segmentos:', error);
      onShowToast?.('Não foi possível exportar os segmentos.');
    }
  };

  const handleExportContacts = async () => {
    if (!selectedSegment) {
      onShowToast?.('Selecione um segmento para exportar.');
      return;
    }

    const listaContatos = selectedSegment.previewContacts || [];
    if (listaContatos.length === 0) {
      onShowToast?.('Nenhum contato disponível neste segmento para exportar.');
      return;
    }

    try {
      const doc = new jsPDF();
      const azulEscuro = [15, 23, 42];
      const azul = [11, 59, 96];
      const azulClaro = [239, 246, 255];
      const cinza = [100, 116, 139];
      const linha = [226, 232, 240];
      const dataAtual = new Date().toLocaleString('pt-BR');

      const nomeArquivo = (selectedSegment.name || 'segmento')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '-')
        .replace(/-+/g, '-')
        .toLowerCase();

      const carregarLogo = () => new Promise((resolve) => {
        const imagem = new Image();
        imagem.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = imagem.naturalWidth;
          canvas.height = imagem.naturalHeight;
          const contexto = canvas.getContext('2d');
          contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        };
        imagem.onerror = () => resolve(null);
        imagem.src = '/logo-n.png';
      });

      const logoNeoCore = await carregarLogo();

      const desenharCabecalho = () => {
        doc.setFillColor(...azulEscuro);
        doc.rect(0, 0, 210, 38, 'F');
        if (logoNeoCore) {
          doc.addImage(logoNeoCore, 'PNG', 14, 8, 18, 18);
        }
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(17);
        doc.text('NEOCORE', logoNeoCore ? 38 : 14, 15);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('RELATÓRIO DE CONTATOS DO SEGMENTO', logoNeoCore ? 38 : 14, 22);
        doc.setFontSize(8);
        doc.setTextColor(203, 213, 225);
        const nomeSegmento = doc.splitTextToSize(selectedSegment.name || 'Segmento selecionado', 105);
        doc.text(nomeSegmento, 14, 31);
      };

      desenharCabecalho();

      doc.setTextColor(...azulEscuro);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Resumo do segmento', 14, 49);

      doc.setFillColor(...azulClaro);
      doc.roundedRect(14, 54, 182, 24, 3, 3, 'F');

      doc.setFontSize(9);
      doc.setTextColor(...azul);
      doc.text('Critérios', 19, 62);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...azulEscuro);
      const criterios = doc.splitTextToSize(selectedSegment.criteria || 'Não informado', 165);
      doc.text(criterios, 19, 69);

      autoTable(doc, {
        startY: 85,
        margin: { top: 48, left: 14, right: 14, bottom: 20 },
        head: [['Nome', 'Detalhe / Empresa', 'E-mail', 'Status']],
        body: listaContatos.map((c) => [
          c.name || '—',
          c.detail || c.company || '—',
          c.email || '—',
          'Confirmado',
        ]),
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 8,
          cellPadding: 3,
          textColor: azulEscuro,
          lineColor: linha,
          lineWidth: 0.2,
          overflow: 'linebreak',
          valign: 'middle',
        },
        headStyles: {
          fillColor: azul,
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        didDrawPage: () => {
          desenharCabecalho();
        },
      });

      const totalPaginasPdf = doc.getNumberOfPages();
      for (let pagina = 1; pagina <= totalPaginasPdf; pagina++) {
        doc.setPage(pagina);
        const alturaPagina = doc.internal.pageSize.getHeight();
        doc.setDrawColor(...linha);
        doc.line(14, alturaPagina - 15, 196, alturaPagina - 15);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...cinza);
        doc.text(`Gerado em ${dataAtual}`, 14, alturaPagina - 9);
        doc.text(`Página ${pagina} de ${totalPaginasPdf}`, 196, alturaPagina - 9, { align: 'right' });
      }

      doc.save(`contatos-${nomeArquivo}.pdf`);
      onShowToast?.('PDF de contatos do segmento exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar contatos:', error);
      onShowToast?.('Não foi possível exportar os contatos em PDF.');
    }
  };

  const handleVerTodos = () => {
    setMostrarTodosContatos((prev) => !prev);
    setPaginaContatos(1);
  };

  const gerarChaveContato = (contato) => {
    if (contato.id) return String(contato.id);
    if (contato.email) return contato.email.trim().toLowerCase();
    return `${contato.name || ''}::${contato.initials || ''}`.trim().toLowerCase();
  };

  const alternarSelecaoContato = (contato) => {
    const chave = gerarChaveContato(contato);
    setContatosSelecionados((selecionados) =>
      selecionados.includes(chave)
        ? selecionados.filter((item) => item !== chave)
        : [...selecionados, chave]
    );
  };

  const removerContatoDoSegmento = (contato) => {
    const confirmar = window.confirm(`Deseja remover ${contato.name} da prévia deste segmento?`);
    if (!confirmar) return;

    setSegments((prevSegments) =>
      prevSegments.map((segmento) => {
        if (segmento.id !== selectedSegmentId) return segmento;
        const contatosAtuais = segmento.previewContacts || [];
        const contatosAtualizados = contatosAtuais.filter(
          (c) => gerarChaveContato(c) !== gerarChaveContato(contato)
        );
        const totalAtual = segmento.contactsCount ?? contatosAtuais.length;
        return {
          ...segmento,
          previewContacts: contatosAtualizados,
          contactsCount: Math.max(0, totalAtual - (contatosAtuais.length - contatosAtualizados.length)),
        };
      })
    );
    setContatoSelecionado(null);
    setMostrarTodosContatos(false);
    setPaginaContatos(1);
    onShowToast?.('Contato removido da prévia do segmento.');
  };

  const removerContatosSelecionados = () => {
    if (contatosSelecionados.length === 0) return;
    const confirmar = window.confirm(
      `Deseja remover ${contatosSelecionados.length} contato(s) da prévia deste segmento?`
    );
    if (!confirmar) return;

    setSegments((prevSegments) =>
      prevSegments.map((segmento) => {
        if (segmento.id !== selectedSegmentId) return segmento;
        const contatosAtuais = segmento.previewContacts || [];
        const contatosAtualizados = contatosAtuais.filter(
          (contato) => !contatosSelecionados.includes(gerarChaveContato(contato))
        );
        const totalAtual = segmento.contactsCount ?? contatosAtuais.length;
        return {
          ...segmento,
          previewContacts: contatosAtualizados,
          contactsCount: Math.max(0, totalAtual - (contatosAtuais.length - contatosAtualizados.length)),
        };
      })
    );
    setContatosSelecionados([]);
    setMostrarTodosContatos(false);
    setPaginaContatos(1);
    onShowToast?.('Contatos selecionados removidos da prévia.');
  };

  useEffect(() => {
    setContatosSelecionados([]);
    setMostrarTodosContatos(false);
    setPaginaContatos(1);
  }, [selectedSegmentId]);

  const contatosPreview = selectedSegment?.previewContacts || [];
  const totalContatos = contatosPreview.length;
  const totalPaginas = Math.ceil(totalContatos / CONTATOS_POR_PAGINA);
  const contatosVisiveis = mostrarTodosContatos
    ? contatosPreview.slice(
        (paginaContatos - 1) * CONTATOS_POR_PAGINA,
        paginaContatos * CONTATOS_POR_PAGINA
      )
    : contatosPreview.slice(0, 3);

  const selecionarTodosRef = useRef(null);
  const todosContatosSelecionados =
    contatosVisiveis.length > 0 &&
    contatosVisiveis.every((contato) =>
      contatosSelecionados.includes(gerarChaveContato(contato))
    );
  const algunsContatosSelecionados = contatosVisiveis.some((contato) =>
    contatosSelecionados.includes(gerarChaveContato(contato))
  );

  useEffect(() => {
    if (selecionarTodosRef.current) {
      selecionarTodosRef.current.indeterminate =
        algunsContatosSelecionados && !todosContatosSelecionados;
    }
  }, [algunsContatosSelecionados, todosContatosSelecionados]);

  const alternarSelecaoTodos = () => {
    const chavesVisiveis = contatosVisiveis.map((contato) => gerarChaveContato(contato));
    if (todosContatosSelecionados) {
      setContatosSelecionados((selecionados) =>
        selecionados.filter((chave) => !chavesVisiveis.includes(chave))
      );
    } else {
      setContatosSelecionados((selecionados) => [
        ...new Set([...selecionados, ...chavesVisiveis]),
      ]);
    }
  };

  const handleRecalcularSegmento = async () => {
    if (!selectedSegment) return;
    setIsRecalculating(true);
    try {
      const res = await segmentService.recalcular(selectedSegment.id);
      const previewList = await segmentService.getPrevia(selectedSegment.id);
      const novaQtd = res?.quantidadeContatos ?? previewList.length;

      setSegments((prev) =>
        prev.map((s) =>
          s.id === selectedSegment.id
            ? { ...s, contactsCount: novaQtd, previewContacts: previewList, updatedAt: 'Agora' }
            : s
        )
      );
      if (onShowToast) onShowToast(`Segmento recalculado: ${novaQtd} contato(s) elegível(is).`);
    } catch (err) {
      if (onShowToast) onShowToast('Erro ao recalcular segmento: ' + (err?.message || 'Tente novamente.'));
    } finally {
      setIsRecalculating(false);
    }
  };

  // Contagens dos KPIs
  const totalSaved = segments.length;
  const totalActive = segments.filter(s => s.status === 'Ativo').length;

  // Filtragem dos segmentos
  const filteredSegments = useMemo(() => {
    return segments.filter(seg => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matches =
          seg.name.toLowerCase().includes(term) ||
          seg.criteria.toLowerCase().includes(term);
        if (!matches) return false;
      }

      if (statusFilter !== 'ALL') {
        if (statusFilter === 'ativo' && seg.status !== 'Ativo') return false;
        if (statusFilter === 'rascunho' && seg.status !== 'Rascunho') return false;
        if (statusFilter === 'sem-resultados' && seg.status !== 'Sem resultados') return false;
      }

      if (activeChip) {
        if (activeChip === 'tecnologia' && !seg.name.toLowerCase().includes('tecnologia') && !seg.criteria.toLowerCase().includes('tecnologia')) {
          return false;
        }
        if (activeChip === 'email' && !seg.criteria.toLowerCase().includes('e-mail')) {
          return false;
        }
        if (activeChip === 'saas' && !seg.name.toLowerCase().includes('saas') && !seg.criteria.toLowerCase().includes('saas')) {
          return false;
        }
        if (activeChip === 'alto' && !seg.name.toLowerCase().includes('alto') && !seg.criteria.toLowerCase().includes('alto')) {
          return false;
        }
      }

      return true;
    });
  }, [segments, searchTerm, statusFilter, activeChip]);

  const handleOpenCreateModal = () => {
    setModalState(1);
    setIsModalOpen(true);
  };

  // Finalizar e salvar novo segmento diretamente no backend e banco
  const handleFinishAndSaveSegment = async () => {
    const nome = segmentName.trim() || 'Clientes B2B unificados';
    try {
      const createdSegment = await segmentService.createSegment({
        name: nome,
        description: segmentPrompt?.trim() || `Segmento "${nome}" ativo no PostgreSQL.`,
        criteria: 'Status do perfil = Unificado E Tipo = Cliente B2B',
        contactsCount: excludeSemBase ? 280 : 300,
      });

      setSegments((prev) => [createdSegment, ...prev]);
      setSelectedSegmentId(createdSegment.id);
      setIsModalOpen(false);
      if (onShowToast) onShowToast(`Segmento "${createdSegment.name}" adicionado com sucesso no PostgreSQL!`);
    } catch (err) {
      console.error('Erro ao criar segmento:', err);
      if (onShowToast) onShowToast('Erro ao salvar segmento. Tente novamente.');
    }
  };

  // Determinar qual etapa do stepper principal está ativa (1, 2 ou 3)
  const getActiveStepperStep = () => {
    if (modalState === 1 || modalState === 2 || modalState === 4) return 1; // Pedido e IA
    if (modalState === 3 || modalState === 5) return 2; // Checagem jurídica
    return 3; // Destinos e envio (6 e 7)
  };

  const activeStepper = getActiveStepperStep();

  return (
    <main className="segmentos-container">
      {/* ===== Header Principal ===== */}
      <div className="segmentos-page-header">
        <div className="segmentos-title-group">
          <h1 className="segmentos-page-title">Segmentos</h1>
          <p className="segmentos-page-subtitle">
            Organize contatos por critérios do perfil unificado e das fontes de origem.
          </p>
        </div>

        <div className="segmentos-header-actions">
          <button
            className="segmentos-btn-secondary"
            onClick={handleExportSegments}
          >
            Exportar
          </button>
          <button className="segmentos-btn-primary" onClick={handleOpenCreateModal}>
            Novo segmento
          </button>
        </div>
      </div>

      {/* ===== Banner Superior ===== */}
      <div className="segmentos-info-banner">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>
          Segmentos dinâmicos baseados no cadastro unificado de contatos.
        </span>
      </div>

      {/* ===== Grid de 3 Cards de Métricas (KPIs) ===== */}
      <div className="segmentos-kpis-grid">
        <div className="segmentos-kpi-card">
          <div className="segmentos-kpi-top">
            <span className="segmentos-kpi-label">Segmentos salvos</span>
          </div>
          <div className="segmentos-kpi-value">{totalSaved}</div>
          <div className="segmentos-kpi-sub">Critérios reutilizáveis para sua operação.</div>
        </div>

        <div className="segmentos-kpi-card">
          <div className="segmentos-kpi-top">
            <span className="segmentos-kpi-label">Segmentos ativos</span>
          </div>
          <div className="segmentos-kpi-value">{totalActive}</div>
          <div className="segmentos-kpi-sub">Atualização após a sincronização das fontes.</div>
        </div>

        <div className="segmentos-kpi-card">
          <div className="segmentos-kpi-top">
            <span className="segmentos-kpi-label">Outros estados</span>
          </div>
          <div className="segmentos-kpi-value-text">
            {(() => {
              const rascunhos = segments.filter(s => s.status === 'Rascunho').length;
              const semResultados = segments.filter(s => s.status === 'Sem resultados').length;
              const parts = [];
              if (rascunhos > 0) parts.push(`${rascunhos} ${rascunhos === 1 ? 'rascunho' : 'rascunhos'}`);
              if (semResultados > 0) parts.push(`${semResultados} ${semResultados === 1 ? 'pausado' : 'pausados'}`);
              return parts.length > 0 ? parts.join(' · ') : 'Nenhum';
            })()}
          </div>
          <div className="segmentos-kpi-sub">Rascunhos não calculam contatos.</div>
        </div>
      </div>

      {/* ===== Grid em Duas Colunas ===== */}
      {/* Mobile Tab Switcher */}
      <div className="segmentos-mobile-tabs">
        <button
          type="button"
          className={`segmentos-mobile-tab ${segmentMobileTab === 'list' ? 'active' : ''}`}
          onClick={() => setSegmentMobileTab('list')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
          <span>Segmentos ({filteredSegments.length})</span>
        </button>
        <button
          type="button"
          className={`segmentos-mobile-tab ${segmentMobileTab === 'details' ? 'active' : ''}`}
          onClick={() => setSegmentMobileTab('details')}
          disabled={!selectedSegment}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span>Detalhes {selectedSegment ? `(${selectedSegment.name.slice(0, 14)}...)` : ''}</span>
        </button>
      </div>

      <div className="segmentos-columns-grid">
        {/* ===== Coluna Esquerda: Todos os Segmentos ===== */}
        <div className={`segmentos-col-left ${segmentMobileTab === 'details' ? 'mobile-hidden' : ''}`}>
          <section className="segmentos-card">
            <div className="segmentos-card-header">
              <h3 className="segmentos-card-title">Todos os segmentos</h3>
              <span className="segmentos-count-label">{filteredSegments.length} segmentos</span>
            </div>

            {/* Campo de Busca */}
            <div className="segmentos-search-box">
              <svg className="segmentos-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por nome, interesse ou categoria"
                className="segmentos-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filtros Dropdowns */}
            <div className="segmentos-filters-row">
              <select
                className="segmentos-select"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                <option value="ALL">Todas as fontes</option>
                <option value="crm">CRM Salesforce</option>
                <option value="campanhas">Plataforma de campanhas</option>
                <option value="erp">ERP Omie</option>
              </select>

              <select
                className="segmentos-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">Todos os estados</option>
                <option value="ativo">Ativo</option>
                <option value="rascunho">Rascunho</option>
                <option value="sem-resultados">Sem resultados</option>
              </select>
            </div>

            {/* Chips Rápidos */}
            <div className="segmentos-chips-row">
              <button
                className={`segmentos-chip ${activeChip === 'tecnologia' ? 'active' : ''}`}
                onClick={() => setActiveChip(activeChip === 'tecnologia' ? null : 'tecnologia')}
              >
                Tecnologia ▾
              </button>
              <button
                className={`segmentos-chip ${activeChip === 'email' ? 'active' : ''}`}
                onClick={() => setActiveChip(activeChip === 'email' ? null : 'email')}
              >
                E-mail ▾
              </button>
              <button
                className={`segmentos-chip ${activeChip === 'saas' ? 'active' : ''}`}
                onClick={() => setActiveChip(activeChip === 'saas' ? null : 'saas')}
              >
                SaaS B2B ▾
              </button>
              <button
                className={`segmentos-chip ${activeChip === 'alto' ? 'active' : ''}`}
                onClick={() => setActiveChip(activeChip === 'alto' ? null : 'alto')}
              >
                Alto ▾
              </button>
            </div>

            {/* Tabela de Segmentos */}
            <div className="segmentos-table-wrap">
              <table className="segmentos-table">
                <thead>
                  <tr>
                    <th>SEGMENTO / CRITÉRIOS</th>
                    <th>CONTATOS</th>
                    <th>ESTADO</th>
                    <th className="th-hide-mobile">ATUALIZAÇÃO</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSegments.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                        Nenhum segmento encontrado. Clique em <strong>Novo segmento</strong> acima para criar.
                      </td>
                    </tr>
                  ) : (
                    filteredSegments.map((seg) => (
                      <tr
                        key={seg.id}
                        className={`segment-row ${selectedSegmentId === seg.id ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedSegmentId(seg.id);
                          if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
                            setSegmentMobileTab('details');
                          }
                        }}
                      >
                        <td className="td-segment-info">
                          <h4 className="segment-row-title">{seg.name}</h4>
                          <p className="segment-row-criteria">{seg.criteria}</p>
                          <div className="segment-meta-mobile">
                            <span className="segment-mobile-contacts">{seg.contactsCount !== null ? `${seg.contactsCount} contatos` : '0 contatos'}</span>
                            <span className="segment-mobile-dot">·</span>
                            <span className="segment-mobile-date">{seg.updatedAt}</span>
                          </div>
                        </td>
                        <td className="td-segment-contacts">
                          {seg.contactsCount !== null ? seg.contactsCount : '—'}
                        </td>
                        <td className="td-segment-status">
                          {seg.status === 'Ativo' && (
                            <span className="seg-pill green">
                              <span className="dot" /> Ativo
                            </span>
                          )}
                          {seg.status === 'Sem resultados' && (
                            <span className="seg-pill gray">Sem resultados</span>
                          )}
                          {seg.status === 'Rascunho' && (
                            <span className="seg-pill gray">Rascunho</span>
                          )}
                        </td>
                        <td className="td-segment-date td-hide-mobile">{seg.updatedAt}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Rodapé da Tabela */}
            <div className="segmentos-table-footer">
              <div className="footer-tip">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                </svg>
                <span>Selecione um segmento ou crie um novo público.</span>
              </div>
              <div className="footer-pagination">
                <span>1–{filteredSegments.length} de {filteredSegments.length} segmentos</span>
                <button className="pagination-link">Página 1 de 1</button>
              </div>
            </div>

            <p className="segmentos-fine-note">
              Um contato pode pertencer a mais de um segmento. As contagens não devem ser somadas.
            </p>
          </section>
        </div>

        {/* ===== Coluna Direita: Detalhes do Segmento Selecionado ===== */}
        <div className={`segmentos-col-right ${segmentMobileTab === 'list' ? 'mobile-hidden' : ''}`}>
          <div className="segmentos-mobile-back-bar">
            <button
              type="button"
              className="segmentos-back-to-list-btn"
              onClick={() => setSegmentMobileTab('list')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              <span>Voltar para lista de segmentos</span>
            </button>
          </div>
          {selectedSegment ? (
            <section className="segmentos-card">
              <div className="segmentos-card-header">
                <h3 className="segmentos-card-title">Detalhes do segmento</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="seg-edit-btn"
                    onClick={handleDuplicateSegment}
                  >
                    Duplicar
                  </button>
                  <button
                    type="button"
                    className="seg-edit-btn"
                    onClick={handleOpenEditSegment}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="seg-delete-btn"
                    onClick={handleOpenDeleteModal}
                  >
                    Excluir
                  </button>
                </div>
              </div>

              {/* Cabeçalho do Segmento Selecionado */}
              <div className="selected-seg-heading">
                <h2 className="selected-seg-name">{selectedSegment.name}</h2>
                <p className="selected-seg-desc">{selectedSegment.description}</p>
                <div className="selected-seg-meta">
                  {selectedSegment.status === 'Ativo' && (
                    <span className="seg-pill green">
                      <span className="dot" /> Ativo
                    </span>
                  )}
                  <span className="selected-seg-dynamic-text">
                    {selectedSegment.dynamicText}
                  </span>
                </div>
              </div>

              {/* Critérios E / OU */}
              <div className="criteria-section">
                <div className="criteria-header">
                  <h4 className="criteria-title">Critérios de inclusão</h4>
                  <p className="criteria-subtitle">
                    Todas as condições (E) · qualquer uma das origens (OU).
                  </p>
                </div>

                <div className="criteria-rules-list">
                  {selectedSegment.criteriaRules && selectedSegment.criteriaRules.map((rule, idx) => (
                    <div key={idx} className="criteria-rule-box">
                      <span className="criteria-rule-field">{rule.field}</span>
                      <strong className="criteria-rule-cond">{rule.condition}</strong>
                    </div>
                  ))}

                  {selectedSegment.channelRule && (
                    <div className="criteria-channel-box">
                      <span className="criteria-channel-header">
                        {selectedSegment.channelRule.header}
                      </span>
                      <strong className="criteria-channel-val">
                        {selectedSegment.channelRule.value}
                      </strong>
                    </div>
                  )}
                </div>

                <p className="criteria-explanation-note">
                  {selectedSegment.ruleNote}
                </p>
              </div>

              {/* Fontes de Dados */}
              <div className="seg-sources-section">
                <h4 className="seg-sources-title">Fontes de dados</h4>
                <div className="seg-sources-list">
                  {selectedSegment.sources && selectedSegment.sources.map((src, idx) => (
                    <div key={idx} className="seg-source-item">
                      <div className="seg-source-left">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                        </svg>
                        <span className="seg-source-name">{src.name}</span>
                      </div>
                      <span className="seg-source-desc">{src.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prévia dos Contatos */}
              <div className="seg-preview-section">
                <div className="seg-preview-header">
                  <div>
                    <h4 className="seg-preview-title">Prévia dos contatos</h4>
                    <p className="seg-preview-sub">
                      {selectedSegment.criteria}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="seg-preview-link"
                    onClick={handleVerTodos}
                  >
                    {mostrarTodosContatos ? 'Mostrar menos' : 'Ver todos'} ({selectedSegment.contactsCount || 0} contatos)
                  </button>
                </div>

                <div className="seg-preview-list">
                  {contatosVisiveis.length > 0 && (
                    <div className="seg-selecionar-todos">
                      <label className="seg-selecionar-todos-label">
                        <input
                          ref={selecionarTodosRef}
                          type="checkbox"
                          className="seg-contato-checkbox"
                          checked={todosContatosSelecionados}
                          onChange={alternarSelecaoTodos}
                        />
                        <span>Selecionar todos</span>
                      </label>
                      <span className="seg-selecionar-todos-contagem">
                        {contatosVisiveis.length} contatos
                      </span>
                    </div>
                  )}

                  {contatosSelecionados.length > 0 && (
                    <div className="seg-acoes-selecao">
                      <span>{contatosSelecionados.length} contato(s) selecionado(s)</span>
                      <button
                        type="button"
                        className="seg-btn-remover-selecionados"
                        onClick={removerContatosSelecionados}
                      >
                        Remover selecionados
                      </button>
                      <button
                        type="button"
                        className="seg-btn-limpar-selecao"
                        onClick={() => setContatosSelecionados([])}
                      >
                        Limpar seleção
                      </button>
                    </div>
                  )}

                  {contatosVisiveis.length > 0 ? (
                    contatosVisiveis.map((c, i) => (
                      <div
                        key={c.id || i}
                        className="seg-preview-item"
                        onClick={() => setContatoSelecionado(c)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="seg-preview-left">
                          <input
                            type="checkbox"
                            className="seg-contato-checkbox"
                            checked={contatosSelecionados.includes(gerarChaveContato(c))}
                            onChange={() => alternarSelecaoContato(c)}
                            onClick={(event) => event.stopPropagation()}
                            aria-label={`Selecionar ${c.name}`}
                          />
                          <div className="seg-contact-avatar">{c.initials}</div>
                          <div className="seg-contact-info">
                            <strong className="seg-contact-name">{c.name}</strong>
                            <span className="seg-contact-detail">{c.detail}</span>
                          </div>
                        </div>
                        <span className="seg-contact-confirmed">
                          Confirmado &gt;
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="seg-preview-empty">
                      Nenhum contato encontrado para a prévia deste segmento.
                    </div>
                  )}
                </div>

                {mostrarTodosContatos && totalPaginas > 1 && (
                  <div className="paginacao-contatos">
                    <button
                      type="button"
                      className="paginacao-btn"
                      onClick={() => setPaginaContatos((pagina) => pagina - 1)}
                      disabled={paginaContatos === 1}
                    >
                      Anterior
                    </button>
                    <span className="paginacao-info">
                      Página {paginaContatos} de {totalPaginas}
                    </span>
                    <button
                      type="button"
                      className="paginacao-btn"
                      onClick={() => setPaginaContatos((pagina) => pagina + 1)}
                      disabled={paginaContatos === totalPaginas}
                    >
                      Próxima
                    </button>
                  </div>
                )}
              </div>

              {/* Rodapé do Segmento */}
              <div className="selected-seg-footer">
                <div className="seg-footer-calc">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  <span>Sincronizado com o banco de dados</span>
                </div>
                <p className="seg-footer-warning">
                  Critérios dinâmicos baseados no cadastro PostgreSQL.
                </p>
                <div className="seg-footer-actions">
                  <button
                    type="button"
                    className="seg-action-link seg-action-excluir"
                    onClick={handleOpenDeleteModal}
                  >
                    Excluir segmento
                  </button>
                  <button
                    type="button"
                    className="seg-action-link"
                    disabled={isRecalculating}
                    onClick={handleRecalcularSegmento}
                  >
                    {isRecalculating ? 'Recalculando...' : 'Recalcular contatos'}
                  </button>
                  <button
                    type="button"
                    className="seg-action-link"
                    onClick={handleExportContacts}
                  >
                    Exportar contatos
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <section className="segmentos-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ color: '#94a3b8', marginBottom: '12px' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto' }}>
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>Nenhum segmento selecionado</h3>
              <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '300px', margin: '0 auto 20px' }}>
                Selecione um segmento na lista ao lado ou crie um novo público.
              </p>
              <button className="segmentos-btn-primary" onClick={handleOpenCreateModal}>
                Novo segmento
              </button>
            </section>
          )}
        </div>
      </div>

      {/* ===== Card Inferior: Fluxo de Campanha ===== */}
      <section className="segmentos-card feedback-states-card">
        <h4 className="feedback-card-title">Fluxo de campanha</h4>
        <p className="feedback-note">
          Grupo de campanha → Pedido e proposta da IA → Checagem jurídica → CRM e campanhas
        </p>
        <p className="feedback-subnote">
          Em caso de pendência: revisar público, gerar nova proposta e checar novamente.
        </p>
      </section>

      {/* ==========================================================================
          MODAL INTERATIVO COMPLETO: CRIAR SEGMENTO COM IA (7 ESTADOS)
         ========================================================================== */}
      {isModalOpen && (
        <div className="seg-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="seg-modal-container" onClick={(e) => e.stopPropagation()}>
            {/* Header com Tags de Estado */}
            <div className="seg-modal-header">
              <div className="modal-header-top">
                <div className="modal-tag-group">
                  <span className="modal-tag-demo">Demonstração</span>
                  <span className="modal-tag-state">Estado {modalState} de 7 · Segmentos</span>
                </div>
                <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                  ×
                </button>
              </div>

              {/* Título dinâmico por Estado */}
              {modalState === 1 && (
                <>
                  <h3 className="modal-title">Criar segmento com IA</h3>
                  <p className="modal-subtitle">
                    Descreva o público. A IA organiza os critérios e explica cada regra.
                  </p>
                </>
              )}

              {modalState === 2 && (
                <>
                  <h3 className="modal-title">Revisar proposta da IA</h3>
                  <p className="modal-subtitle-bold">{segmentName}</p>
                </>
              )}

              {modalState === 3 && (
                <>
                  <h3 className="modal-title">Checagem jurídica — pendências</h3>
                  <p className="modal-subtitle-bold">{segmentName}</p>
                </>
              )}

              {modalState === 4 && (
                <>
                  <h3 className="modal-title">Revisar segmento</h3>
                  <p className="modal-subtitle-bold">{segmentName}</p>
                </>
              )}

              {modalState === 5 && (
                <>
                  <h3 className="modal-title">Checagem jurídica — público elegível</h3>
                  <p className="modal-subtitle-bold">{segmentName}</p>
                </>
              )}

              {modalState === 6 && (
                <>
                  <h3 className="modal-title">Enviar para CRM e campanhas</h3>
                  <p className="modal-subtitle-bold">{segmentName}</p>
                </>
              )}

              {modalState === 7 && (
                <>
                  <h3 className="modal-title">Envio concluído — demonstração</h3>
                  <p className="modal-subtitle-bold">{segmentName}</p>
                </>
              )}
            </div>

            {/* Stepper com 3 Etapas Globais */}
            <div className="modal-stepper">
              <div className={`step-item ${activeStepper >= 1 ? 'active' : ''} ${activeStepper > 1 ? 'completed' : ''}`}>
                <span className="step-number">1</span>
                <span className="step-text">Pedido e IA</span>
              </div>
              <div className={`step-item ${activeStepper >= 2 ? 'active' : ''} ${activeStepper > 2 ? 'completed' : ''}`}>
                <span className="step-number">2</span>
                <span className="step-text">Checagem jurídica</span>
              </div>
              <div className={`step-item ${activeStepper === 3 ? 'active' : ''}`}>
                <span className="step-number">3</span>
                <span className="step-text">Destinos e envio</span>
              </div>
            </div>

            {/* ==================== ESTADO 1 DE 7: Formulário Inicial ==================== */}
            {modalState === 1 && (
              <div className="modal-content-state">
                <div className="modal-field-group">
                  <label className="modal-label">Nome do segmento</label>
                  <input
                    type="text"
                    className="modal-input"
                    value={segmentName}
                    onChange={(e) => setSegmentName(e.target.value)}
                    placeholder="Clientes B2B unificados"
                  />
                </div>

                <div className="modal-field-group">
                  <label className="modal-label">Qual público você quer encontrar?</label>
                  <textarea
                    className="modal-textarea"
                    rows="3"
                    value={segmentPrompt}
                    onChange={(e) => setSegmentPrompt(e.target.value)}
                  />
                  <span className="modal-helper-text">
                    Informe perfil, tipo de cliente, fontes e canal. Você poderá revisar a proposta antes de continuar.
                  </span>
                </div>

                <div className="modal-sources-considered">
                  <div className="sources-considered-header">
                    <span className="sources-considered-title">Fontes consideradas</span>
                  </div>
                  <div className="sources-considered-item">
                    <div className="source-cons-left">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                      </svg>
                      <strong className="source-cons-name">CRM Salesforce</strong>
                    </div>
                    <span className="source-cons-tag">Selecionada</span>
                  </div>
                  <span className="sources-considered-note">
                    A busca usa o perfil unificado. Um contato com as duas fontes será contado apenas uma vez.
                  </span>
                </div>

                <div className="modal-info-box-blue">
                  <div className="modal-box-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  </div>
                  <div className="modal-box-text">
                    <h5 className="modal-box-title">Critérios não são autorização de campanha</h5>
                    <p className="modal-box-desc">
                      A IA não escolhe nem cria uma base legal. Base registrada na origem e opt-out serão verificados na etapa jurídica, para o canal e-mail.
                    </p>
                  </div>
                </div>

                <div className="modal-footer-row">
                  <button className="modal-btn-cancel" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </button>
                  <button className="modal-btn-primary" onClick={() => setModalState(2)}>
                    Gerar segmento
                  </button>
                </div>
                <p className="modal-disclaimer">
                  Cenário ilustrativo. Nenhum dado será transmitido e nenhuma campanha será disparada.
                </p>
              </div>
            )}

            {/* ==================== ESTADO 2 DE 7: Proposta da IA ==================== */}
            {modalState === 2 && (
              <div className="modal-content-state">
                <div className="modal-pedido-box">
                  <span className="modal-pedido-label">Pedido original</span>
                  <p className="modal-pedido-text">{segmentPrompt}</p>
                </div>

                <div className="modal-criteria-section">
                  <span className="modal-criteria-heading">Critérios de inclusão</span>
                  <span className="modal-criteria-sub">Todas as condições (E) · qualquer uma das origens (OU).</span>

                  <div className="modal-rules-group">
                    <div className="modal-rule-row">
                      <span className="rule-symbol">E</span>
                      <div className="rule-info">
                        <strong className="rule-title">Status do perfil = Unificado</strong>
                        <p className="rule-sub">Reúne registros conciliados em um perfil único, sem duplicar contatos.</p>
                      </div>
                    </div>

                    <div className="modal-rule-row">
                      <span className="rule-symbol">E</span>
                      <div className="rule-info">
                        <strong className="rule-title">Tipo de cliente = Cliente B2B</strong>
                        <p className="rule-sub">Restringe o público a clientes de empresas, como solicitado.</p>
                      </div>
                    </div>

                    <div className="modal-rule-row">
                      <span className="rule-symbol">E</span>
                      <div className="rule-info">
                        <strong className="rule-title">Origem = CRM Salesforce OU ERP Oracle</strong>
                        <p className="rule-sub">Inclui o perfil vinculado a pelo menos uma das duas fontes.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Box de Contatos Encontrados */}
                <div className="modal-count-box">
                  <div className="count-box-left">
                    <span className="count-number">324</span>
                    <div className="count-info">
                      <strong>Contatos encontrados - perfis únicos</strong>
                      <p>Contados uma única vez, inclusive quando vinculados às duas origens.</p>
                    </div>
                  </div>
                  <span className="count-badge-pending">Ainda não checados</span>
                </div>

                {/* Prévia breve */}
                <div className="modal-mini-preview">
                  <span className="mini-preview-title">Prévia breve · dados ilustrativos</span>
                  <div className="mini-preview-list">
                    <div className="mini-preview-item">
                      <div className="mini-item-left">
                        <strong>Mariana Souza</strong>
                        <span>Mariana Souza Ltda · Unificado · Cliente B2B</span>
                      </div>
                      <span className="mini-item-source">CRM Salesforce</span>
                    </div>
                    <div className="mini-preview-item">
                      <div className="mini-item-left">
                        <strong>Rafael Almeida</strong>
                        <span>Brasil Comércio · Unificado · Cliente B2B</span>
                      </div>
                      <span className="mini-item-source">ERP Oracle</span>
                    </div>
                    <div className="mini-preview-item">
                      <div className="mini-item-left">
                        <strong>Lucas Ferreira</strong>
                        <span>Horizonte Tecnologia · Unificado · Cliente B2B</span>
                      </div>
                      <span className="mini-item-source">CRM + ERP</span>
                    </div>
                  </div>
                </div>

                <div className="modal-info-box-blue">
                  <div className="modal-box-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  </div>
                  <p className="modal-box-desc">
                    Os contatos encontrados atendem aos critérios, mas ainda não são um público elegível. A próxima etapa verifica base legal registrada e opt-out de e-mail.
                  </p>
                </div>

                <div className="modal-footer-row">
                  <button className="modal-btn-cancel" onClick={() => setModalState(1)}>
                    Ajustar pedido
                  </button>
                  <button className="modal-btn-primary" onClick={() => setModalState(3)}>
                    Checagem jurídica
                  </button>
                </div>
                <p className="modal-disclaimer">
                  Cenário ilustrativo. Nenhum dado será transmitido e nenhuma campanha será disparada.
                </p>
              </div>
            )}

            {/* ==================== ESTADO 3 DE 7: Checagem Jurídica — Pendências ==================== */}
            {modalState === 3 && (
              <div className="modal-content-state">
                {/* Alerta Vermelho de Envio Bloqueado */}
                <div className="modal-alert-box red">
                  <div className="alert-icon-red">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <div className="alert-content">
                    <strong className="alert-title">Envio bloqueado · 20 registros sem base legal</strong>
                    <p className="alert-desc">
                      A proposta contém registros sem base legal documentada para e-mail. Revise o público para excluí-los antes de uma nova checagem.
                    </p>
                  </div>
                </div>

                {/* 3 Cards de Métricas */}
                <div className="modal-stat-cards-grid three-cols">
                  <div className="modal-stat-card">
                    <span className="stat-card-num">324</span>
                    <span className="stat-card-label">Encontrados</span>
                  </div>
                  <div className="modal-stat-card">
                    <span className="stat-card-num">24</span>
                    <span className="stat-card-label">Opt-outs excluídos</span>
                  </div>
                  <div className="modal-stat-card red-highlight">
                    <span className="stat-card-num text-red">20</span>
                    <span className="stat-card-label">Sem base legal</span>
                  </div>
                </div>

                {/* Resultado por canal */}
                <div className="modal-channel-results">
                  <div className="channel-results-header">
                    <strong>Resultado por canal</strong>
                    <div className="channel-subhead">
                      <span>E-mail · 324 perfis únicos</span>
                      <span className="badge-warning-pill">Pendências</span>
                    </div>
                  </div>

                  <div className="channel-results-table">
                    <div className="channel-res-row">
                      <span className="res-row-label">Opt-out</span>
                      <span className="res-row-val">24 excluídos obrigatoriamente. Solicitação de não receber comunicações respeitada.</span>
                    </div>
                    <div className="channel-res-row">
                      <span className="res-row-label">Base legal registrada</span>
                      <span className="res-row-val">280 com documentação na origem, entre os 300 perfis sem opt-out.</span>
                    </div>
                    <div className="channel-res-row">
                      <span className="res-row-label">Base legal ausente</span>
                      <span className="res-row-val">20 sem evidência registrada na origem para e-mail. Permanecem bloqueados nesta proposta.</span>
                    </div>
                    <div className="channel-res-row">
                      <span className="res-row-label">Outros canais</span>
                      <span className="res-row-val">Não avaliados. Esta checagem se limita ao canal e-mail.</span>
                    </div>
                  </div>
                </div>

                <p className="modal-explanation-small">
                  Os grupos são distintos nesta simulação. Os perfis com opt-out já estão excluídos do público e não há soma de perfis duplicados.
                </p>

                <div className="modal-info-box-blue">
                  <div className="modal-box-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  </div>
                  <div className="modal-box-text">
                    <h5 className="modal-box-title">A checagem não é um parecer jurídico</h5>
                    <p className="modal-box-desc">
                      A IA não define base legal. Conciliação e sincronização não autorizam campanhas. Os contatos com opt-out já estão fora do público, não são uma falha que possa ser ignorada.
                    </p>
                  </div>
                </div>

                <div className="modal-footer-row">
                  <button className="modal-btn-cancel" onClick={() => setModalState(2)}>
                    Voltar
                  </button>
                  <button className="modal-btn-primary" onClick={() => setModalState(4)}>
                    Revisar público
                  </button>
                </div>
                <p className="modal-disclaimer">
                  Checagem de demonstração. Nenhuma ação permite ignorar opt-out ou liberar registros sem base legal.
                </p>
              </div>
            )}

            {/* ==================== ESTADO 4 DE 7: Revisar Segmento (Exclusões) ==================== */}
            {modalState === 4 && (
              <div className="modal-content-state">
                {/* Alerta Âmbar */}
                <div className="modal-alert-box amber">
                  <div className="alert-icon-amber">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <div className="alert-content">
                    <strong className="alert-title">Ajuste o público, não as evidências legais</strong>
                    <p className="alert-desc">
                      20 registros estão sem base legal para e-mail. Excluí-los do envio não regulariza seus cadastros nem cria documentação na origem.
                    </p>
                  </div>
                </div>

                <div className="modal-pedido-box">
                  <span className="modal-pedido-label">Pedido original</span>
                  <p className="modal-pedido-text">{segmentPrompt}</p>
                </div>

                <div className="modal-criteria-section">
                  <span className="modal-criteria-heading">Critérios de inclusão</span>
                  <span className="modal-criteria-sub">Todas as condições (E) · qualquer uma das origens (OU).</span>

                  <div className="modal-rules-group">
                    <div className="modal-rule-row">
                      <span className="rule-symbol">E</span>
                      <div className="rule-info">
                        <strong className="rule-title">Status do perfil = Unificado</strong>
                      </div>
                    </div>
                    <div className="modal-rule-row">
                      <span className="rule-symbol">E</span>
                      <div className="rule-info">
                        <strong className="rule-title">Tipo de cliente = Cliente B2B</strong>
                      </div>
                    </div>
                    <div className="modal-rule-row">
                      <span className="rule-symbol">E</span>
                      <div className="rule-info">
                        <strong className="rule-title">Origem = CRM Salesforce OU ERP Oracle</strong>
                      </div>
                    </div>
                  </div>

                  {/* Caixas de Seleção de Exclusão */}
                  <div className="modal-exclusion-boxes">
                    <div className="exclusion-card">
                      <label className="exclusion-label">
                        <input
                          type="checkbox"
                          checked={excludeOptOut}
                          onChange={() => { }}
                          disabled
                        />
                        <div className="exclusion-text">
                          <strong>Excluir os 24 perfis com opt-out</strong>
                          <p>Exclusão obrigatória para e-mail. Não pode ser desmarcada.</p>
                        </div>
                      </label>
                      <span className="exclusion-badge-obrig">Obrigatório</span>
                    </div>

                    <div className="exclusion-card">
                      <label className="exclusion-label">
                        <input
                          type="checkbox"
                          checked={excludeSemBase}
                          onChange={(e) => setExcludeSemBase(e.target.checked)}
                        />
                        <div className="exclusion-text">
                          <strong>Excluir os 20 registros sem base legal registrada</strong>
                          <p>Opção selecionada para esta nova proposta. Os registros continuam pendentes na origem.</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Box de Perfis Previstos */}
                <div className="modal-count-box blue-theme">
                  <div className="count-box-left">
                    <span className="count-number">{excludeSemBase ? 280 : 300}</span>
                    <div className="count-info">
                      <strong>Perfis previstos para a nova checagem</strong>
                      <p>
                        {excludeSemBase
                          ? '324 encontrados – 24 opt-outs – 20 sem base legal = 280.'
                          : '300 perfis sem opt-out. Porém, 20 continuam sem base legal e permanecem bloqueados para envio.'}
                      </p>
                    </div>
                  </div>
                  <span className="count-badge-pending">Ainda não liberados</span>
                </div>

                <p className="modal-explanation-small">
                  O pedido e as regras de inclusão serão preservados. A IA gera uma nova proposta com estas exclusões; alterar critérios não corrige evidências legais. A nova proposta deve passar pela checagem novamente.
                </p>

                <div className="modal-footer-row">
                  <button className="modal-btn-cancel" onClick={() => setModalState(3)}>
                    Voltar à checagem
                  </button>
                  <button className="modal-btn-primary" onClick={() => setModalState(5)}>
                    Gerar nova proposta
                  </button>
                </div>
                <p className="modal-disclaimer">
                  Retorno à IA → nova proposta → nova checagem jurídica obrigatória. O envio continua bloqueado.
                </p>
              </div>
            )}

            {/* ==================== ESTADO 5 DE 7: Checagem Jurídica — Público Elegível ==================== */}
            {modalState === 5 && (
              <div className="modal-content-state">
                {/* Alerta Verde de Sucesso */}
                <div className="modal-alert-box green">
                  <div className="alert-icon-green">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <div className="alert-content">
                    <strong className="alert-title">
                      Nova proposta checada · {excludeSemBase ? '280 elegíveis para e-mail' : '300 perfis sem opt-out'}
                    </strong>
                    <p className="alert-desc">
                      {excludeSemBase
                        ? 'Após a revisão e a nova checagem, os perfis restantes têm base legal documentada na origem e não apresentam opt-out para este canal, no cenário ilustrativo.'
                        : 'Após a revisão, 300 perfis estão sem opt-out. Os 20 registros sem base legal não foram excluídos e permanecem sinalizados.'}
                    </p>
                  </div>
                </div>

                {/* 4 Cards de Métricas */}
                <div className="modal-stat-cards-grid four-cols">
                  <div className="modal-stat-card">
                    <span className="stat-card-num">324</span>
                    <span className="stat-card-label">Encontrados</span>
                  </div>
                  <div className="modal-stat-card">
                    <span className="stat-card-num">24</span>
                    <span className="stat-card-label">Opt-outs excluídos</span>
                  </div>
                  <div className="modal-stat-card">
                    <span className="stat-card-num">{excludeSemBase ? 20 : 0}</span>
                    <span className="stat-card-label">Sem base excluídos</span>
                  </div>
                  <div className="modal-stat-card green-highlight">
                    <span className="stat-card-num text-green">{excludeSemBase ? 280 : 300}</span>
                    <span className="stat-card-label">Elegíveis · e-mail</span>
                  </div>
                </div>

                <p className="modal-explanation-small">
                  {excludeSemBase
                    ? '324 perfis únicos – 24 opt-outs – 20 sem base legal = 280 elegíveis. Exclusões distintas, verificadas sem duplicar perfis.'
                    : '324 perfis únicos – 24 opt-outs = 300 perfis (20 registros sem base legal mantidos sem exclusão).'}
                </p>

                {/* Tabela do Resultado da Nova Checagem */}
                <div className="modal-channel-results">
                  <div className="channel-results-header">
                    <strong>Resultado da nova checagem</strong>
                    <div className="channel-subhead">
                      <span>Proposta revisada · versão 2</span>
                      <span className="badge-success-pill">Checagem concluída</span>
                    </div>
                  </div>

                  <div className="channel-results-table">
                    <div className="channel-res-row">
                      <span className="res-row-label">Canal</span>
                      <span className="res-row-val">E-mail. A elegibilidade não se estende automaticamente a outros canais.</span>
                    </div>
                    <div className="channel-res-row">
                      <span className="res-row-label">Base legal</span>
                      <span className="res-row-val">
                        {excludeSemBase
                          ? 'Documentada nos registros de origem dos 280 perfis restantes. A IA não escolheu nem criou a base.'
                          : 'Documentada em 280 dos 300 perfis restantes. 20 registros seguem sem base legal na origem.'}
                      </span>
                    </div>
                    <div className="channel-res-row">
                      <span className="res-row-label">Opt-out</span>
                      <span className="res-row-val">24 perfis excluídos; preferências de não receber mensagens respeitadas.</span>
                    </div>
                    <div className="channel-res-row">
                      <span className="res-row-label">Sem base registrada</span>
                      <span className="res-row-val">
                        {excludeSemBase
                          ? '20 registros excluídos do público. Continuam sem regularização automática na origem.'
                          : '0 excluídos. Os 20 registros sem base legal foram mantidos por opção do usuário.'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="modal-info-box-blue">
                  <div className="modal-box-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  </div>
                  <div className="modal-box-text">
                    <h5 className="modal-box-title">Validação de registros, não parecer jurídico</h5>
                    <p className="modal-box-desc">
                      O resultado ilustrativo não substitui análise jurídica da finalidade e do uso dos dados. Sincronização e conciliação não equivalem a autorização de campanha.
                    </p>
                  </div>
                </div>

                <div className="modal-footer-row">
                  <button className="modal-btn-cancel" onClick={() => setModalState(4)}>
                    Voltar
                  </button>
                  <button className="modal-btn-primary" onClick={() => setModalState(6)}>
                    Continuar para envio
                  </button>
                </div>
                <p className="modal-disclaimer">
                  Cenário ilustrativo. Nenhum dado será transmitido e nenhuma campanha será disparada.
                </p>
              </div>
            )}

            {/* ==================== ESTADO 6 DE 7: Enviar para CRM e Campanhas ==================== */}
            {modalState === 6 && (
              <div className="modal-content-state">
                {/* 4 Cards de Métricas */}
                <div className="modal-stat-cards-grid four-cols">
                  <div className="modal-stat-card">
                    <span className="stat-card-num">324</span>
                    <span className="stat-card-label">Encontrados</span>
                  </div>
                  <div className="modal-stat-card">
                    <span className="stat-card-num">24</span>
                    <span className="stat-card-label">Opt-outs excluídos</span>
                  </div>
                  <div className="modal-stat-card">
                    <span className="stat-card-num">{excludeSemBase ? 20 : 0}</span>
                    <span className="stat-card-label">Sem base excluídos</span>
                  </div>
                  <div className="modal-stat-card green-highlight">
                    <span className="stat-card-num text-green">{excludeSemBase ? 280 : 300}</span>
                    <span className="stat-card-label">Elegíveis · e-mail</span>
                  </div>
                </div>

                {/* Dropdowns de Destino */}
                <div className="modal-destinations-grid">
                  <div className="dest-field">
                    <label className="dest-label">CRM de destino</label>
                    <select
                      className="dest-select"
                      value={targetCrm}
                      onChange={(e) => setTargetCrm(e.target.value)}
                    >
                      <option value="CRM Salesforce">CRM Salesforce</option>
                      <option value="HubSpot">HubSpot CRM</option>
                    </select>
                  </div>

                  <div className="dest-field">
                    <label className="dest-label">Destino de campanhas *</label>
                    <select
                      className="dest-select"
                      value={targetCampaign}
                      onChange={(e) => setTargetCampaign(e.target.value)}
                    >
                      <option value="Público B2B · destino de exemplo">Público B2B · destino de exemplo</option>
                      <option value="Campanha Inbound">Campanha Inbound</option>
                    </select>
                  </div>
                </div>

                <span className="dest-config-badge">
                  Configurado na demonstração · Destino genérico configurável, sem integração real vinculada.
                </span>

                <div className="modal-field-group">
                  <label className="dest-label">Campanha de demonstração</label>
                  <input
                    type="text"
                    className="modal-input"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                  />
                  <span className="dest-field-sub">
                    Canal e-mail · operação: sincronizar público, sem disparar mensagens.
                  </span>
                </div>

                {/* Mapeamento Mínimo */}
                <div className="modal-mapping-box">
                  <span className="mapping-title">Mapeamento mínimo · NEOCORE → destinos</span>
                  <div className="mapping-rows">
                    <div className="mapping-row">
                      <span>ID do perfil unificado</span>
                      <span className="arrow-sep">→</span>
                      <strong>ID externo do contato</strong>
                    </div>
                    <div className="mapping-row">
                      <span>E-mail principal</span>
                      <span className="arrow-sep">→</span>
                      <strong>E-mail</strong>
                    </div>
                    <div className="mapping-row">
                      <span>Nome do segmento</span>
                      <span className="arrow-sep">→</span>
                      <strong>Lista / público de campanha</strong>
                    </div>
                  </div>
                  <span className="mapping-sub">Chave única: ID do perfil. Um contato por perfil, mesmo com CRM e ERP vinculados.</span>
                </div>

                {/* Checkbox de Automação */}
                <label className="automation-checkbox-card">
                  <input
                    type="checkbox"
                    checked={enableAutomation}
                    onChange={(e) => setEnableAutomation(e.target.checked)}
                  />
                  <div className="auto-text">
                    <strong>Automação · atualizar este público</strong>
                    <p>Selecionada no cenário ilustrativo. Toda atualização exige nova checagem de base legal e opt-out antes de futuros envios; pendências bloqueiam a sincronização.</p>
                  </div>
                </label>

                <div className="modal-info-box-blue">
                  <div className="modal-box-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  </div>
                  <div className="modal-box-text">
                    <h5 className="modal-box-title">Destino configurado é obrigatório</h5>
                    <p className="modal-box-desc">
                      A confirmação só fica disponível com CRM e destino de campanhas configurados. Aqui a configuração é ilustrativa. Sincronizar o público não dispara mensagens nem autoriza campanha.
                    </p>
                  </div>
                </div>

                <div className="modal-footer-row">
                  <button className="modal-btn-cancel" onClick={() => setModalState(5)}>
                    Voltar
                  </button>
                  <button className="modal-btn-primary" onClick={() => setModalState(7)}>
                    Confirmar envio
                  </button>
                </div>
                <p className="modal-disclaimer">
                  Confirmar envio representa apenas sincronizar o público na demonstração. Nenhuma mensagem será disparada.
                </p>
              </div>
            )}

            {/* ==================== ESTADO 7 DE 7: Envio Concluído — Demonstração ==================== */}
            {modalState === 7 && (
              <div className="modal-content-state">
                {/* Banner Verde Concluído */}
                <div className="modal-alert-box green">
                  <div className="alert-icon-green">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <div className="alert-content">
                    <strong className="alert-title">Público sincronizado no cenário ilustrativo</strong>
                    <p className="alert-desc">
                      Campanha não disparada · nenhuma mensagem enviada.
                    </p>
                  </div>
                </div>

                {/* Box de Perfis Únicos */}
                <div className="modal-count-box blue-theme">
                  <div className="count-box-left">
                    <span className="count-number">{excludeSemBase ? 280 : 300}</span>
                    <div className="count-info">
                      <strong>Perfis únicos no público de e-mail</strong>
                      <p>
                        {excludeSemBase
                          ? '324 encontrados · 24 opt-outs e 20 sem base legal excluídos.'
                          : '324 encontrados · 24 opt-outs excluídos (20 sem base legal mantidos).'}
                      </p>
                    </div>
                  </div>
                  <span className="count-badge-demo">Demonstração</span>
                </div>

                {/* Destinos e Operação */}
                <div className="modal-details-card">
                  <span className="card-sec-title">Destinos e operação</span>
                  <div className="card-sec-rows">
                    <div className="card-sec-row">
                      <span className="sec-row-key">CRM</span>
                      <span className="sec-row-val">{targetCrm} - público sincronizado (ilustrativo)</span>
                    </div>
                    <div className="card-sec-row">
                      <span className="sec-row-key">Campanhas</span>
                      <span className="sec-row-val">{targetCampaign} configurável, sem integração real</span>
                    </div>
                    <div className="card-sec-row">
                      <span className="sec-row-key">Campanha</span>
                      <span className="sec-row-val">{campaignName} - somente público, sem disparo</span>
                    </div>
                  </div>
                </div>

                {/* Registro de Auditoria Ilustrativo */}
                <div className="modal-details-card">
                  <span className="card-sec-title">Registro de auditoria ilustrativo</span>
                  <div className="card-sec-rows">
                    <div className="card-sec-row">
                      <span className="sec-row-key">Registro</span>
                      <strong className="sec-row-val">DEMO-SEG-014 · 14/10/2026, às 11:30 · Administrador</strong>
                    </div>
                    <div className="card-sec-row">
                      <span className="sec-row-key">Rastreabilidade</span>
                      <span className="sec-row-val">Proposta v2 → nova checagem de e-mail → exclusões verificadas → sincronização simulada</span>
                    </div>
                  </div>
                  <span className="card-sec-note">
                    Contagem deduplicada por ID de perfil. Registros sem base permanecem fora do público e pendentes na origem.
                  </span>
                </div>

                {/* Alerta Azul Automação Selecionada */}
                <div className="modal-info-box-blue">
                  <div className="modal-box-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  </div>
                  <div className="modal-box-text">
                    <h5 className="modal-box-title">Automação selecionada · com rechecagem obrigatória</h5>
                    <p className="modal-box-desc">
                      No cenário ilustrativo, futuras atualizações do público exigem nova checagem de base legal e opt-out antes de cada envio. Opt-outs sempre excluídos; pendências bloqueiam a sincronização. Sem execução real.
                    </p>
                  </div>
                </div>

                {/* Botões do Estado 7 */}
                <div className="modal-footer-row">
                  <button className="modal-btn-cancel" onClick={handleFinishAndSaveSegment}>
                    Voltar a segmentos
                  </button>
                  <button
                    className="modal-btn-primary"
                    onClick={() => {
                      handleFinishAndSaveSegment();
                      if (onShowToast) {
                        onShowToast('Registro de auditoria DEMO-SEG-014 validado com sucesso!');
                      }
                    }}
                  >
                    Ver registro
                  </button>
                </div>
                <p className="modal-disclaimer">
                  Confirmação exclusivamente ilustrativa. Nenhuma sincronização ou automação real foi executada.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {isEditSegModalOpen && (
        <ModalEditarSegmento
          segmento={selectedSegment}
          fecharModal={() => !isSavingSeg && setIsEditSegModalOpen(false)}
          salvarAlteracoes={handleSaveEditSegment}
          salvando={isSavingSeg}
        />
      )}

      <ModalExcluirSegmento
        segmento={segmentToDelete}
        fecharModal={() => setSegmentToDelete(null)}
        confirmarExclusao={handleConfirmDeleteSegment}
      />

      <ModalDetalhesContato
        contato={contatoSelecionado}
        fecharModal={() => setContatoSelecionado(null)}
        removerContato={removerContatoDoSegmento}
      />
    </main>
  );
}
