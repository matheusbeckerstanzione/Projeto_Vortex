import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/DashboardContatos.css';
import neocoreLogo from '../../assets/neocore-logo.png';
import { contactService, UNNAMED_CONTACT_LABEL } from '../../services/contactService';
import { authStorage } from '../../services/api';
import { fazerLogout } from '../../services/auth';
import DashboardInicio from './DashboardInicio';
import DashboardEnriquecimento from './DashboardEnriquecimento';
import DashboardPerfilCompleto from './DashboardPerfilCompleto';
import DashboardFichaOrigem from './DashboardFichaOrigem';
import DashboardSegmentos from './DashboardSegmentos';
import VortexGovernanca from './DashboardGovernanca';
import VortexLogs from './DashboardLogs';
import DashboardUsuarios from './DashboardUsuarios';
import DashboardIA from './DashboardIA';
import ImportarNeocore from '../ImportarNeocore';
import OrbScene from '../OrbScene';

export default function DashboardContatos({ initialMenu = 'inicio' }) {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [segmentFilter, setSegmentFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('gerais');
  const [activeMenu, setActiveMenu] = useState(initialMenu);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 992;
    }
    return true;
  });
  const [contactMobileTab, setContactMobileTab] = useState('list');
  const handleMenuSelect = (menuKey) => {
    setActiveMenu(menuKey);
    if (typeof window !== 'undefined' && window.innerWidth <= 992) {
      setIsSidebarOpen(false);
    }
  };
  const [isContactsOpen, setIsContactsOpen] = useState(
    ['todos-contatos', 'completar', 'completar-contatos', 'enriquecimento', 'perfil-completo', 'ficha'].includes(initialMenu)
  );
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const currentUser = authStorage.getUser();
  const hasSession = Boolean(authStorage.getToken() && currentUser);
  const userName = currentUser?.nome || 'Usuário';
  const userRole = currentUser?.perfil === 'ADMINISTRADOR' ? 'Administrador' : (currentUser?.perfil || 'Usuário');
  const userInitials = useMemo(() => {
    if (!currentUser?.nome) return 'US';
    return currentUser.nome
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');
  }, [currentUser?.nome]);

  useEffect(() => {
    if (!hasSession) {
      navigate('/login', { replace: true });
      return;
    }

    const handleSessionExpired = (event) => {
      navigate('/login', {
        replace: true,
        state: { sessionEnded: event.detail?.reason ?? 'invalid' },
      });
    };

    window.addEventListener('neocore:session-expired', handleSessionExpired);
    return () => window.removeEventListener('neocore:session-expired', handleSessionExpired);
  }, [hasSession, navigate]);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    document.body.classList.remove('dark-bg');
    await fazerLogout();
    navigate('/');
  };

  useEffect(() => {
    if (initialMenu) {
      setActiveMenu(initialMenu);
      if (['todos-contatos', 'completar', 'completar-contatos', 'enriquecimento', 'perfil-completo', 'ficha'].includes(initialMenu)) {
        setIsContactsOpen(true);
      }
    }
  }, [initialMenu]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.classList.remove('auth-no-scroll');
    document.documentElement.classList.remove('auth-no-scroll');
    document.body.style.overflowY = 'auto';
    document.documentElement.style.overflowY = 'auto';
  }, [activeMenu]);

  // Modais e interações
  const [isNewContactModalOpen, setIsNewContactModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRecordsModalOpen, setIsRecordsModalOpen] = useState(false);
  const [isEmpresasModalOpen, setIsEmpresasModalOpen] = useState(false);
  const [isIaModalOpen, setIsIaModalOpen] = useState(false);
  const [empresaToDelete, setEmpresaToDelete] = useState(null);
  const [isDeletingEmpresa, setIsDeletingEmpresa] = useState(false);

  useEffect(() => {
    if (!isIaModalOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsIaModalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    if (!hasSession) {
    return null;
  }

  return () => window.removeEventListener('keydown', onKeyDown);
  }, [isIaModalOpen]);
  const [toastMessage, setToastMessage] = useState('');
  const [empresasDisponiveis, setEmpresasDisponiveis] = useState([]);
  const [empresaModo, setEmpresaModo] = useState('existente'); // 'existente' | 'nova'

  // Formulário Novo Contato
  const [newContactForm, setNewContactForm] = useState({
    name: null,
    company: '',
    empresaId: '',
    cnpj: '',
    email: null,
    phone: null,
    secondaryPhone: null,
    location: '',
    segment: 'Cliente - B2B',
    status: 'Unificado'
  });

  // Formulário Edição
  const [editForm, setEditForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    location: '',
    segment: ''
  });

  // Nova nota
  const [newNoteText, setNewNoteText] = useState('');

  // Carregar contatos iniciais do service
  useEffect(() => {
    if (!hasSession) return;
    contactService.getContacts().then((data) => {
      setContacts(data);
      if (data.length > 0 && !selectedContactId) {
        setSelectedContactId(data[0].id);
      }
    });
    contactService.getEmpresas().then((emps) => {
      setEmpresasDisponiveis(emps || []);
    });
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Filtro de contatos
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      // Menu lateral filtro
      if ((activeMenu === 'completar' || activeMenu === 'enriquecimento') && c.statusType !== 'review') return false;
      if (activeMenu === 'perfil-completo' && c.sourcesCount < 3) return false;

      // Busca por texto
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.company.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro de status
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'unified' && c.statusType === 'unified') ||
        (statusFilter === 'review' && c.statusType === 'review');

      // Filtro de fonte
      const matchesSource =
        sourceFilter === 'ALL' ||
        (c.originSources &&
          c.originSources.some((s) =>
            s.name.toLowerCase().includes(sourceFilter.toLowerCase()) ||
            s.type === sourceFilter.toLowerCase()
          ));

      // Filtro de segmento
      const matchesSegment =
        segmentFilter === 'ALL' || c.segment === segmentFilter;

      return matchesSearch && matchesStatus && matchesSource && matchesSegment;
    });
  }, [contacts, searchTerm, statusFilter, sourceFilter, segmentFilter, activeMenu]);

  // Contato selecionado
  const selectedContact = useMemo(() => {
    if (!hasSession) {
    return null;
  }

  return (
      contacts.find((c) => c.id === selectedContactId) ||
      contacts[0] ||
      null
    );
  }, [contacts, selectedContactId]);

  const empresaId = selectedContact?.empresaId;
  const [empresaCadastral, setEmpresaCadastral] = useState(null);
  useEffect(() => {
    if (!hasSession || activeMenu !== 'todos-contatos' || !empresaId) return;

    const controller = new AbortController();
    setEmpresaCadastral(null);
    contactService.getEmpresa(empresaId, controller.signal)
      .then((empresa) => {
        if (!controller.signal.aborted && empresa) {
          setEmpresaCadastral({ id: empresaId, empresa });
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, [hasSession, activeMenu, empresaId]);

  const empresaVinculada = empresaCadastral?.id === empresaId ? empresaCadastral?.empresa : null;
  const dadosEmpresa = [
    { label: 'E-mail cadastral da empresa', value: empresaVinculada?.emailContato },
    { label: 'Telefone principal da empresa', value: empresaVinculada?.telefonePrincipal },
    { label: 'Telefone secundário da empresa', value: empresaVinculada?.telefoneSecundario },
  ].filter(({ value }) => value);

  // Abrir modal de edição
  const handleOpenEdit = () => {
    if (!selectedContact) return;
    setEditForm({
      name: selectedContact.name === UNNAMED_CONTACT_LABEL ? '' : selectedContact.name,
      company: selectedContact.company,
      email: selectedContact.email ?? '',
      phone: selectedContact.phone,
      location: selectedContact.location,
      segment: selectedContact.segment
    });
    setIsEditModalOpen(true);
  };

  // Salvar edição
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedContact) return;
    const updated = await contactService.updateContact(selectedContact.id, editForm);
    setContacts((prev) =>
      prev.map((c) => (c.id === selectedContact.id ? { ...c, ...updated } : c))
    );
    setIsEditModalOpen(false);
    showToast('Perfil atualizado com sucesso!');
  };

  const [isSavingContact, setIsSavingContact] = useState(false);
  const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);
  const [cnpjLookup, setCnpjLookup] = useState(null);
  const cnpjResult = empresaModo === 'nova' && cnpjLookup?.cnpj === newContactForm.cnpj
    ? cnpjLookup
    : null;
  const empresaDoCadastro = empresaModo === 'existente'
    ? empresasDisponiveis.find((empresa) => empresa.id === newContactForm.empresaId)
    : cnpjResult;
  const contactChannels = {
    email: newContactForm.email ?? empresaDoCadastro?.emailContato ?? '',
    phone: newContactForm.phone ?? empresaDoCadastro?.telefonePrincipal ?? '',
    secondaryPhone: newContactForm.secondaryPhone ?? empresaDoCadastro?.telefoneSecundario ?? '',
  };
  const missingChannels = cnpjResult ? [
    !contactChannels.email && 'e-mail',
    !contactChannels.phone && 'telefone principal',
    !contactChannels.secondaryPhone && 'telefone secundário',
  ].filter(Boolean) : [];

  const handleBuscarCnpj = async () => {
    const clean = (newContactForm.cnpj || '').replace(/\D/g, '');
    if (clean.length !== 14) {
      showToast('Informe os 14 dígitos do CNPJ para buscar.');
      return;
    }
    setIsSearchingCnpj(true);
    try {
      const dados = await contactService.consultarCnpj(clean);
      const nomeEncontrado = dados?.razaoSocial || dados?.nomeFantasia || '';
      const cidade = dados?.endereco?.cidade || '';
      const uf = dados?.endereco?.uf || '';
      const localizacao = cidade && uf ? `${cidade}, ${uf} - Brasil` : cidade || newContactForm.location;

      setCnpjLookup({ ...dados, cnpj: clean });
      setNewContactForm((prev) => prev.cnpj !== clean ? prev : ({
        ...prev,
        company: nomeEncontrado || prev.company,
        empresaId: dados?.empresaIdExistente || '',
        cidade: cidade || prev.cidade,
        uf: uf || prev.uf,
        setor: dados?.setor || prev.setor,
        location: localizacao,
      }));

      if (dados?.empresaIdExistente) {
        showToast(`CNPJ já cadastrado: ${nomeEncontrado}. Empresa vinculada!`);
      } else {
        showToast(`Dados encontrados para: ${nomeEncontrado || clean}!`);
      }
    } catch (err) {
      showToast(err?.message || 'Não foi possível consultar o CNPJ.');
    } finally {
      setIsSearchingCnpj(false);
    }
  };

  const handleOpenNewContact = async () => {
    try {
      const emps = await contactService.getEmpresas();
      setEmpresasDisponiveis(emps || []);
      setNewContactForm((prev) => ({
        ...prev,
        empresaId: emps?.[0]?.id || '',
        company: emps?.[0]?.nome || prev.company || '',
      }));
    } catch {
      // Ignora erro
    }
    setIsNewContactModalOpen(true);
  };

  // Criar novo contato
  const handleCreateContact = async (e) => {
    e.preventDefault();
    const payload = {
      ...newContactForm,
      ...contactChannels,
      company: empresaDoCadastro?.nome ?? newContactForm.company,
    };

    setIsSavingContact(true);
    try {
      const created = await contactService.addContact(payload);
      setContacts((prev) => [created, ...prev]);
      setSelectedContactId(created.id);
      setIsNewContactModalOpen(false);
      setCnpjLookup(null);
      setNewContactForm({
        name: null,
        company: '',
        empresaId: '',
        cnpj: '',
        email: null,
        phone: null,
        secondaryPhone: null,
        location: '',
        segment: 'Cliente - B2B',
        status: 'Unificado'
      });
      showToast(`Contato "${created.name}" cadastrado e salvo no PostgreSQL!`);
    } catch (err) {
      alert('Erro ao salvar contato no banco de dados: ' + (err?.message || err));
    } finally {
      setIsSavingContact(false);
    }
  };

  // Excluir contato
  const handleDeleteContact = () => {
    if (!selectedContact) return;
    contactService.deleteContact(selectedContact.id);
    const rest = contacts.filter((c) => c.id !== selectedContact.id);
    setContacts(rest);
    setSelectedContactId(rest.length > 0 ? rest[0].id : null);
    setIsDeleteModalOpen(false);
    showToast(`Contato "${selectedContact.name}" removido com sucesso.`);
  };

  // Abrir modal de gerenciamento de empresas
  const handleOpenEmpresasModal = async () => {
    try {
      const emps = await contactService.getEmpresas();
      setEmpresasDisponiveis(emps || []);
    } catch {
      // Ignora erro
    }
    setIsEmpresasModalOpen(true);
  };

  // Excluir empresa selecionada
  const handleConfirmDeleteEmpresa = async () => {
    if (!empresaToDelete) return;
    setIsDeletingEmpresa(true);
    try {
      await contactService.deleteEmpresa(empresaToDelete.id);

      // Atualiza lista de empresas disponíveis
      const emps = await contactService.getEmpresas();
      setEmpresasDisponiveis(emps || []);

      // Se o formulário do novo contato estava com essa empresa selecionada, limpa
      if (newContactForm.empresaId === empresaToDelete.id) {
        setNewContactForm((prev) => ({
          ...prev,
          empresaId: emps?.[0]?.id || '',
          company: emps?.[0]?.nome || '',
        }));
      }

      // Atualiza lista de contatos em tela para desvincular a empresa excluída
      setContacts((prev) =>
        prev.map((c) =>
          c.empresaId === empresaToDelete.id || c.company === empresaToDelete.nome
            ? { ...c, company: 'Não informada', empresaId: null }
            : c
        )
      );

      showToast(`Empresa "${empresaToDelete.nome}" excluída com sucesso!`);
      setEmpresaToDelete(null);
    } catch (err) {
      alert('Erro ao excluir empresa: ' + (err?.message || err));
    } finally {
      setIsDeletingEmpresa(false);
    }
  };

  // Alternar status de conciliação
  const handleToggleStatus = async () => {
    if (!selectedContact) return;
    const novoStatus = selectedContact.status === 'Unificado' ? 'Em revisão' : 'Unificado';
    const updated = await contactService.updateContact(selectedContact.id, {
      status: novoStatus,
      statusType: novoStatus === 'Unificado' ? 'unified' : 'review',
    });
    setContacts((prev) =>
      prev.map((c) => (c.id === selectedContact.id ? { ...c, ...updated } : c))
    );
    showToast(`Status alterado para "${novoStatus}"!`);
  };

  // Exportar contatos
  const handleExport = () => {
    contactService.exportToCSV(filteredContacts);
    showToast('Planilha CSV gerada e baixada com sucesso!');
  };

  // Adicionar nota com autor real e persistência
  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNoteText.trim() || !selectedContact) return;
    const updatedNotes = contactService.addNote(selectedContact.id, newNoteText, userName);
    setContacts((prev) =>
      prev.map((c) => {
        if (c.id === selectedContact.id) {
          return {
            ...c,
            notes: updatedNotes,
          };
        }
        return c;
      })
    );
    setNewNoteText('');
    showToast('Nota adicionada e salva com sucesso!');
  };

  if (!hasSession) {
    return null;
  }

  return (
    <div className="vortex-app">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="vortex-toast">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="vortex-header">
        <div className="header-left">
          <button
            className={`icon-button menu-toggle-btn ${!isSidebarOpen ? 'collapsed' : ''}`}
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            title={isSidebarOpen ? "Ocultar menu lateral" : "Exibir menu lateral"}
            aria-label={isSidebarOpen ? "Ocultar menu lateral" : "Exibir menu lateral"}
            aria-expanded={isSidebarOpen}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="header-center">
          <div className="logo-container" onClick={() => setActiveMenu('todos-contatos')} style={{ cursor: 'pointer' }}>
            <img src={neocoreLogo} alt="NEOCORE Logo" className="logo-image" />
            <span className="logo-text">NEOCORE</span>
          </div>
        </div>

        <div className="header-right">
          <div className="user-profile-menu-container">
            <span className="user-greeting">Olá, {userName.split(' ')[0]}</span>
            <button
              type="button"
              className="user-avatar-btn"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              aria-label="Abrir menu do usuário"
              title={`${userName} (${userRole}) - Clique para opções`}
            >
              <div className="user-avatar">
                {userInitials}
              </div>
            </button>

            {isUserMenuOpen && (
              <>
                <div className="user-menu-backdrop" onClick={() => setIsUserMenuOpen(false)} />
                <div className="user-dropdown-menu">
                  <div className="dropdown-user-header">
                    <span className="dropdown-user-name">{userName}</span>
                    <span className="dropdown-user-email">{currentUser?.email || 'usuario@neocore.tech'}</span>
                    <span className="dropdown-user-badge">{userRole}</span>
                  </div>
                  <div className="dropdown-divider" />
                  <button
                    type="button"
                    className="dropdown-menu-item logout"
                    onClick={handleLogout}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Sair do sistema</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="vortex-main-layout">
        {/* Mobile Sidebar Backdrop */}
        {isSidebarOpen && (
          <div
            className="sidebar-mobile-backdrop"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Left Sidebar */}
        <aside className={`vortex-sidebar ${!isSidebarOpen ? 'closed' : ''}`} aria-hidden={!isSidebarOpen}>
          <div className="sidebar-inner-container">
            <div className="workspace-header">
              <div className="workspace-header-text">
                <span className="workspace-label">Workspace</span>
                <h2 className="workspace-title">Operações</h2>
              </div>
              <button
                type="button"
                className="sidebar-mobile-close-btn"
                onClick={() => setIsSidebarOpen(false)}
                aria-label="Fechar menu"
                title="Fechar menu"
              >
                ✕
              </button>
            </div>

          <nav className="sidebar-nav">
            <div
              className={`nav-item ${activeMenu === 'inicio' ? 'active' : ''}`}
              onClick={() => {
                handleMenuSelect('inicio');
                setStatusFilter('ALL');
                setSourceFilter('ALL');
                setSegmentFilter('ALL');
              }}
            >
              <span className="nav-bullet"></span>
              <span className="nav-text">Início</span>
            </div>

            {/* Menu Group: Contatos */}
            <div className={`nav-group ${isContactsOpen ? 'open' : 'closed'}`}>
              <div
                className={`nav-item group-header ${isContactsOpen || ['todos-contatos', 'completar', 'enriquecimento', 'perfil-completo', 'ficha'].includes(activeMenu) ? 'active' : ''}`}
                onClick={() => {
                  const willOpen = !isContactsOpen;
                  setIsContactsOpen(willOpen);
                  if (willOpen && activeMenu === 'inicio') {
                    handleMenuSelect('todos-contatos');
                    setStatusFilter('ALL');
                  }
                }}
                title="Contatos"
                aria-expanded={isContactsOpen}
              >
                <div className="group-left">
                  <span className="nav-bullet"></span>
                  <span className="nav-text">Contatos</span>
                </div>
                <div
                  className="chevron-btn"
                  title={isContactsOpen ? "Recolher submenu" : "Expandir submenu"}
                  aria-label={isContactsOpen ? "Recolher submenu" : "Expandir submenu"}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsContactsOpen((prev) => !prev);
                  }}
                >
                  <svg className="chevron-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>

              <div className="nav-subitems">
                <div
                  className={`sub-item ${activeMenu === 'todos-contatos' ? 'active' : ''}`}
                  onClick={() => {
                    handleMenuSelect('todos-contatos');
                    setStatusFilter('ALL');
                    setIsContactsOpen(true);
                  }}
                >
                  <span className="sub-bullet">·</span>
                  {activeMenu === 'todos-contatos' && <span className="sub-bar"></span>}
                  <span>Todos os contatos</span>
                </div>
                <div
                  className={`sub-item ${activeMenu === 'enriquecimento' || activeMenu === 'completar' ? 'active' : ''}`}
                  onClick={() => {
                    handleMenuSelect('enriquecimento');
                    setStatusFilter('review');
                    setIsContactsOpen(true);
                  }}
                  title="Contatos com pendências cadastrais para enriquecimento"
                >
                  <span className="sub-bullet">·</span>
                  {(activeMenu === 'enriquecimento' || activeMenu === 'completar') && <span className="sub-bar"></span>}
                  <span>Enriquecimento</span>
                </div>
                <div
                  className={`sub-item ${activeMenu === 'perfil-completo' ? 'active' : ''}`}
                  onClick={() => {
                    handleMenuSelect('perfil-completo');
                    setStatusFilter('unified');
                    setIsContactsOpen(true);
                  }}
                  title="Contatos com todas as fontes unificadas"
                >
                  <span className="sub-bullet">·</span>
                  {activeMenu === 'perfil-completo' && <span className="sub-bar"></span>}
                  <span>Perfil completo</span>
                </div>
                <div
                  className={`sub-item ${activeMenu === 'ficha' ? 'active' : ''}`}
                  onClick={() => {
                    handleMenuSelect('ficha');
                    setIsContactsOpen(true);
                  }}
                  title="Consultar fichas de origem brutas"
                >
                  <span className="sub-bullet">·</span>
                  {activeMenu === 'ficha' && <span className="sub-bar"></span>}
                  <span>Ficha de origem</span>
                </div>
              </div>
            </div>

            <div
              className={`nav-item ${activeMenu === 'importar' ? 'active' : ''}`}
              onClick={() => handleMenuSelect('importar')}
            >
              <span className="nav-bullet"></span>
              <span className="nav-text">Importar</span>
            </div>

            <div
              className={`nav-item ${activeMenu === 'segmentos' ? 'active' : ''}`}
              onClick={() => handleMenuSelect('segmentos')}
            >
              <span className="nav-bullet"></span>
              <span className="nav-text">Segmentos</span>
            </div>

            {/* Apenas Administradores têm acesso a Usuários, Governança e Logs */}
            {currentUser?.perfil === 'ADMINISTRADOR' && (
              <>
                <div
                  className={`nav-item ${activeMenu === 'usuarios' ? 'active' : ''}`}
                  onClick={() => handleMenuSelect('usuarios')}
                >
                  <span className="nav-bullet"></span>
                  <span className="nav-text">Usuários & Acessos</span>
                </div>

                <div
                  className={`nav-item ${activeMenu === 'governanca' ? 'active' : ''}`}
                  onClick={() => handleMenuSelect('governanca')}
                >
                  <span className="nav-bullet"></span>
                  <span className="nav-text">Governança</span>
                </div>

                <div
                  className={`nav-item ${activeMenu === 'logs' ? 'active' : ''}`}
                  onClick={() => {
                    handleMenuSelect('logs');
                    setActiveTab('historico');
                  }}
                >
                  <span className="nav-bullet"></span>
                  <span className="nav-text">Logs de auditoria</span>
                </div>
              </>
            )}
          </nav>

          {/* Bottom Update Card */}
          <div
            className="sidebar-update-card"
            onClick={() => {
              setIsContactsOpen(true);
              handleMenuSelect('enriquecimento');
            }}
            style={{ cursor: 'pointer' }}
            title="Clique para abrir enriquecimento de contatos"
          >
            <span className="update-tag">Status</span>
            <h4 className="update-title">
              {contacts.length} {contacts.length === 1 ? 'contato cadastrado' : 'contatos cadastrados'}
            </h4>
            <p className="update-subtitle">
              {contacts.filter((c) => c.statusType === 'review').length} em revisão no sistema.
            </p>
          </div>
        </div>
      </aside>

        {activeMenu === 'inicio' ? (
          <DashboardInicio
            onNavigateToContacts={(query) => {
              setActiveMenu('todos-contatos');
              setIsContactsOpen(true);
              if (query) setSearchTerm(query);
            }}
            onEnrichment={() => {
              setActiveMenu('enriquecimento');
              setIsContactsOpen(true);
            }}
            onExport={handleExport}
            onNavigateToIa={() => setIsIaModalOpen(true)}
          />
        ) : (activeMenu === 'enriquecimento' || activeMenu === 'completar' || activeMenu === 'completar-contatos') ? (
          <DashboardEnriquecimento
            onBack={() => {
              setActiveMenu('todos-contatos');
              setIsContactsOpen(true);
            }}
            onShowToast={showToast}
          />
        ) : activeMenu === 'perfil-completo' ? (
          <DashboardPerfilCompleto
            contact={selectedContact}
            onBack={() => {
              setActiveMenu('todos-contatos');
              setIsContactsOpen(true);
            }}
            onNavigateToEnrichment={() => {
              setActiveMenu('enriquecimento');
              setIsContactsOpen(true);
            }}
            onShowToast={showToast}
          />
        ) : activeMenu === 'ficha' ? (
          <DashboardFichaOrigem
            contact={selectedContact}
            onBack={() => {
              setActiveMenu('todos-contatos');
              setIsContactsOpen(true);
            }}
            onNavigateToLogs={() => {
              setActiveMenu('logs');
              setActiveTab('historico');
            }}
            onShowToast={showToast}
          />
        ) : activeMenu === 'segmentos' ? (
          <DashboardSegmentos
            onShowToast={showToast}
            onNavigateToContact={(contactName) => {
              setActiveMenu('todos-contatos');
              setIsContactsOpen(true);
              if (contactName) setSearchTerm(contactName);
            }}
          />
        ) : activeMenu === 'usuarios' ? (
          <DashboardUsuarios onShowToast={showToast} />
        ) : activeMenu === 'governanca' ? (
          <VortexGovernanca
            embedded={true}
            onNavigate={(target) => {
              setActiveMenu(target);
              if (['todos-contatos', 'completar', 'enriquecimento', 'perfil-completo', 'ficha'].includes(target)) {
                setIsContactsOpen(true);
              }
            }}
            onShowToast={showToast}
          />
        ) : activeMenu === 'logs' ? (
          <VortexLogs
            embedded={true}
            onNavigate={(target) => {
              setActiveMenu(target);
              if (['todos-contatos', 'completar', 'enriquecimento', 'perfil-completo', 'ficha'].includes(target)) {
                setIsContactsOpen(true);
              }
            }}
            onShowToast={showToast}
          />
        ) : activeMenu === 'importar' ? (
          <ImportarNeocore
            embedded={true}
            onShowToast={showToast}
          />
        ) : (
          <div className="vortex-contacts-wrapper">
            {/* Mobile View Tabs (Lista vs Perfil) */}
            <div className="mobile-view-tabs">
              <button
                type="button"
                className={`mobile-view-tab ${contactMobileTab === 'list' ? 'active' : ''}`}
                onClick={() => setContactMobileTab('list')}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
                <span>Contatos ({filteredContacts.length})</span>
              </button>
              <button
                type="button"
                className={`mobile-view-tab ${contactMobileTab === 'details' ? 'active' : ''}`}
                onClick={() => setContactMobileTab('details')}
                disabled={!selectedContact}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>Perfil {selectedContact ? `(${selectedContact.initials})` : ''}</span>
              </button>
            </div>

            <div className="vortex-contacts-content-split">
              {/* Center Content: Contatos Table */}
              <main className={`vortex-center-content ${contactMobileTab === 'details' ? 'mobile-hidden' : ''}`}>
              <div className="content-page-header">
                <div>
                  <h1 className="page-title">Contatos</h1>
                  <p className="page-subtitle">Consulte seus contatos e reúna os dados em um perfil único.</p>
                </div>
                <div className="page-header-actions">
                  <button className="btn-secondary" onClick={handleExport} title="Baixar lista em CSV">
                    Exportar
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={handleOpenEmpresasModal}
                    title="Visualizar e gerenciar empresas cadastradas"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                    Gerenciar empresas
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleOpenNewContact}
                    title="Cadastrar novo contato"
                  >
                    Novo contato
                  </button>
                </div>
              </div>

              {/* Table Card */}
              <div className="table-card">
                <div className="table-card-top">
                  <h3 className="card-heading">Todos os contatos</h3>
                  <span className="contacts-count">
                    {filteredContacts.length} {filteredContacts.length === 1 ? 'contato' : 'contatos'}
                  </span>
                </div>

                {/* Search Bar */}
                <div className="search-bar-wrapper">
                  <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input
                    type="text"
                    placeholder="Buscar por nome, e-mail ou empresa"
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      className="clear-search-btn"
                      onClick={() => setSearchTerm('')}
                      title="Limpar busca"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filters Row */}
                <div className="filters-row">
                  <div className="filter-dropdown">
                    <select
                      value={sourceFilter}
                      onChange={(e) => setSourceFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="ALL">Todas as fontes</option>
                      <option value="Salesforce">CRM Salesforce</option>
                      <option value="Omie">ERP Omie</option>
                      <option value="CSV">Importação CSV</option>
                    </select>
                    <svg className="dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>

                  <div className="filter-dropdown">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="ALL">Todos os status</option>
                      <option value="unified">Unificado</option>
                      <option value="review">Em revisão</option>
                    </select>
                    <svg className="dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>

                  <div className="filter-dropdown">
                    <select
                      value={segmentFilter}
                      onChange={(e) => setSegmentFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="ALL">Segmentos</option>
                      <option value="Cliente - B2B">Cliente - B2B</option>
                      <option value="Varejo">Varejo</option>
                      <option value="Moda & Design">Moda & Design</option>
                      <option value="Tecnologia / SaaS">Tecnologia / SaaS</option>
                      <option value="Jurídico">Jurídico</option>
                      <option value="Logística">Logística</option>
                      <option value="Arquitetura">Arquitetura</option>
                    </select>
                    <svg className="dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>

                  {(searchTerm || sourceFilter !== 'ALL' || statusFilter !== 'ALL' || segmentFilter !== 'ALL' || activeMenu !== 'todos-contatos') && (
                    <button
                      className="btn-clear-filters"
                      onClick={() => {
                        setSearchTerm('');
                        setSourceFilter('ALL');
                        setStatusFilter('ALL');
                        setSegmentFilter('ALL');
                        setActiveMenu('todos-contatos');
                      }}
                      title="Resetar todos os filtros"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>

                {/* Contacts Table */}
                <div className="table-responsive">
                  <table className="contacts-table">
                    <thead>
                      <tr>
                        <th className="th-contact">CONTATO</th>
                        <th className="th-sources">FONTES</th>
                        <th className="th-status">STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContacts.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="no-results-td">
                            Nenhum contato encontrado com os filtros aplicados.
                          </td>
                        </tr>
                      ) : (
                        filteredContacts.map((contact) => {
                          const isSelected = selectedContact && contact.id === selectedContact.id;
                          if (!hasSession) {
    return null;
  }

  return (
                            <tr
                              key={contact.id}
                              className={`contact-row ${isSelected ? 'row-selected' : ''}`}
                              onClick={() => {
                                setSelectedContactId(contact.id);
                                if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
                                  setContactMobileTab('details');
                                }
                              }}
                            >
                              <td className="td-contact">
                                <div className="contact-cell-content">
                                  <div className={`contact-avatar ${isSelected ? 'avatar-highlight' : ''}`}>
                                    {contact.initials}
                                  </div>
                                  <div className="contact-details">
                                    <span className="contact-name">{contact.name}</span>
                                    <span className="contact-company">{contact.company}</span>
                                    <span className="contact-email">{contact.email ?? 'Não informado'}</span>
                                    <span className="contact-sources-mobile">{contact.sourcesCount} {contact.sourcesLabel}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="td-sources">
                                <div className="sources-cell">
                                  <span className="sources-number">{contact.sourcesCount}</span>
                                  <span className="sources-label">{contact.sourcesLabel}</span>
                                </div>
                              </td>
                              <td className="td-status">
                                {contact.statusType === 'unified' ? (
                                  <span className="status-badge unified">
                                    <span className="status-dot"></span>
                                    Unificado
                                  </span>
                                ) : (
                                  <span className="status-badge review">
                                    Em revisão
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Bottom Help Note */}
                <div className="table-footer-note">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="3" x2="9" y2="21"></line>
                  </svg>
                  <span>Selecione um contato para consultar o perfil unificado.</span>
                </div>
              </div>

              {/* Pagination Controls */}
              <div className="pagination-bar">
                <span className="pagination-info">
                  {filteredContacts.length === 0
                    ? '0 contatos'
                    : `1-${Math.min(filteredContacts.length, 7)} de ${filteredContacts.length} contatos`}
                </span>
                <div className="pagination-controls">
                  <button className="page-nav-btn" disabled aria-label="Página anterior">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                  <button className="page-num active">1</button>
                  <button className="page-nav-btn" aria-label="Próxima página">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>
              </div>
            </main>

            {/* Right Sidebar: Perfil Unificado */}
            {selectedContact ? (
              <aside className={`vortex-right-panel ${contactMobileTab === 'list' ? 'mobile-hidden' : ''}`}>
                <div className="mobile-panel-back-bar">
                  <button
                    type="button"
                    className="mobile-back-to-list-btn"
                    onClick={() => setContactMobileTab('list')}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    <span>Voltar para lista de contatos</span>
                  </button>
                </div>
                <div className="panel-header">
                  <h3 className="panel-title">Perfil unificado</h3>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn-edit" onClick={handleOpenEdit} title="Editar dados consolidados">
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn-edit"
                      style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                      onClick={() => setIsDeleteModalOpen(true)}
                      title="Excluir contato"
                    >
                      Excluir
                    </button>
                  </div>
                </div>

                {/* Profile Identity Card */}
                <div className="profile-identity">
                  <div className="profile-avatar-large">
                    {selectedContact.initials}
                  </div>
                  <div className="profile-info-block">
                    <h2 className="profile-name">{selectedContact.name}</h2>
                    <span className="profile-company">{selectedContact.company}</span>
                    <span className="profile-id">ID NEOCORE: {selectedContact.id}</span>
                  </div>
                </div>

                <div className="profile-status-badges">
                  {selectedContact.statusType === 'unified' ? (
                    <span className="status-badge unified small">
                      <span className="status-dot"></span>
                      Unificado
                    </span>
                  ) : (
                    <span className="status-badge review small">
                      Em revisão
                    </span>
                  )}
                  <span className="records-count">
                    {selectedContact.linkedSourcesCount} registros de origem vinculados
                  </span>
                </div>

                {/* Tab Navigation */}
                <div className="profile-tabs">
                  <button
                    className={`tab-btn ${activeTab === 'gerais' ? 'active' : ''}`}
                    onClick={() => setActiveTab('gerais')}
                  >
                    Dados gerais
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'historico' ? 'active' : ''}`}
                    onClick={() => setActiveTab('historico')}
                  >
                    Histórico
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'notas' ? 'active' : ''}`}
                    onClick={() => setActiveTab('notas')}
                  >
                    Notas {selectedContact.notes?.length > 0 && `(${selectedContact.notes.length})`}
                  </button>
                </div>

                {/* Tab: Dados Gerais */}
                {activeTab === 'gerais' && (
                  <div className="tab-body">
                    {/* Consolidated Data */}
                    <div className="section-block">
                      <div className="section-header">
                        <h4 className="section-title">Dados consolidados</h4>
                        <span className="section-extra-label">Fonte do dado</span>
                      </div>

                      <div className="consolidated-fields-list">
                        {[...selectedContact.consolidatedData, ...dadosEmpresa.map(item => ({
                          ...item, source: 'Cadastro da empresa',
                        }))].map((item, idx) => (
                          <div key={idx} className="field-row">
                            <div className="field-left">
                              <span className="field-label">{item.label}</span>
                              <span className="field-value">{item.value}</span>
                            </div>
                            <div className="field-source">
                              <svg className="link-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                              </svg>
                              <span>{item.source}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Origin Sources */}
                    <div className="section-block">
                      <div className="section-header">
                        <h4 className="section-title">Fontes de origem</h4>
                        <button
                          className="section-link-btn"
                          onClick={() => setIsRecordsModalOpen(true)}
                        >
                          Ver registros
                        </button>
                      </div>

                      <div className="origin-sources-list">
                        {selectedContact.originSources.map((source, idx) => (
                          <div key={idx} className="origin-source-card">
                            <div className="source-card-left">
                              <div className="source-icon-wrap">
                                {source.type === 'crm' && (
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
                                  </svg>
                                )}
                                {source.type === 'erp' && (
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                                  </svg>
                                )}
                                {source.type === 'csv' && (
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                  </svg>
                                )}
                              </div>
                              <div className="source-card-info">
                                <span className="source-name">{source.name}</span>
                                <span className="source-code">{source.code}</span>
                              </div>
                            </div>

                            <div className="source-card-right">
                              <span className="source-sync-status">{source.status}</span>
                              <span className="source-sync-time">{source.syncDate}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Reconciled Banner */}
                    <div className={`reconciliation-banner ${selectedContact.statusType === 'review' ? 'banner-alert' : ''}`}>
                      <div className="banner-icon-circle">
                        {selectedContact.statusType === 'review' ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </div>
                      <div className="banner-text-wrap" style={{ flex: 1 }}>
                        <h5 className="banner-title">{selectedContact.reconciliation.title}</h5>
                        <p className="banner-subtitle">{selectedContact.reconciliation.subtitle}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleStatus}
                        className="btn-edit"
                        style={{ fontSize: '11px', whiteSpace: 'nowrap', padding: '4px 8px' }}
                        title="Alternar entre Unificado e Em revisão"
                      >
                        {selectedContact.status === 'Unificado' ? 'Revisar' : 'Unificar'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab: Histórico */}
                {activeTab === 'historico' && (
                  <div className="tab-body">
                    <div className="timeline-container">
                      {selectedContact.history && selectedContact.history.length > 0 ? (
                        selectedContact.history.map((h, i) => (
                          <div key={i} className="timeline-item">
                            <div className="timeline-bullet"></div>
                            <div className="timeline-content">
                              <span className="timeline-date">{h.date}</span>
                              <p className="timeline-action">{h.action}</p>
                              <span className="timeline-source">Origem: {h.source}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="tab-body-empty">
                          <p>Nenhum histórico registrado para este contato.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab: Notas */}
                {activeTab === 'notas' && (
                  <div className="tab-body">
                    {/* Formulário de Nova Nota */}
                    <form onSubmit={handleAddNote} className="note-form">
                      <textarea
                        placeholder="Adicionar nota interna sobre este contato..."
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        className="note-textarea"
                        rows="3"
                      />
                      <div className="note-form-actions">
                        <button type="submit" className="btn-primary small" disabled={!newNoteText.trim()}>
                          Adicionar Nota
                        </button>
                      </div>
                    </form>

                    {/* Lista de Notas */}
                    <div className="notes-list">
                      {selectedContact.notes && selectedContact.notes.length > 0 ? (
                        selectedContact.notes.map((note) => (
                          <div key={note.id} className="note-card">
                            <div className="note-header">
                              <span className="note-author">{note.author}</span>
                              <span className="note-date">{note.date}</span>
                            </div>
                            <p className="note-text">{note.text}</p>
                          </div>
                        ))
                      ) : (
                        <div className="tab-body-empty">
                          <p>Nenhuma nota cadastrada ainda.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </aside>
            ) : (
              <aside className={`vortex-right-panel ${contactMobileTab === 'list' ? 'mobile-hidden' : ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center' }}>
                <div>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px' }}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', margin: '0 0 6px' }}>Nenhum contato selecionado</h4>
                  <p style={{ fontSize: '13px', margin: 0, color: '#64748b' }}>Cadastre um contato usando o botão "+ Novo contato" acima.</p>
                </div>
              </aside>
            )}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Novo Contato */}
      {isNewContactModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsNewContactModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Novo Contato</h3>
              <button className="modal-close" onClick={() => setIsNewContactModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateContact}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome completo</label>
                  <input
                    type="text"
                    placeholder="Ex: Nome do contato"
                    className="form-input"
                    value={newContactForm.name ?? ''}
                    onChange={(e) => setNewContactForm({ ...newContactForm, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Empresa / Razão Social</label>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: empresaModo === 'existente' ? '#0284c7' : '#94a3b8',
                          fontWeight: empresaModo === 'existente' ? 700 : 500,
                          cursor: 'pointer',
                          padding: 0
                        }}
                        onClick={() => setEmpresaModo('existente')}
                      >
                        Selecionar existente
                      </button>
                      <span style={{ color: '#cbd5e1' }}>|</span>
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: empresaModo === 'nova' ? '#0284c7' : '#94a3b8',
                          fontWeight: empresaModo === 'nova' ? 700 : 500,
                          cursor: 'pointer',
                          padding: 0
                        }}
                        onClick={() => setEmpresaModo('nova')}
                      >
                        + Nova empresa
                      </button>
                    </div>
                  </div>

                  {empresaModo === 'existente' && empresasDisponiveis.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select
                          className="form-select"
                          style={{ flex: 1 }}
                          value={newContactForm.empresaId}
                          onChange={(e) => {
                            const emp = empresasDisponiveis.find((x) => x.id === e.target.value);
                            setNewContactForm({
                              ...newContactForm,
                              empresaId: e.target.value,
                              company: emp ? emp.nome : ''
                            });
                          }}
                        >
                          <option value="">Selecione uma empresa do PostgreSQL...</option>
                          {empresasDisponiveis.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.nome} ({emp.cidade || 'SP'} · CNPJ: {emp.cnpj || '—'})
                            </option>
                          ))}
                        </select>
                        {newContactForm.empresaId && (
                          <button
                            type="button"
                            title="Excluir esta empresa cadastrada"
                            onClick={() => {
                              const emp = empresasDisponiveis.find((x) => x.id === newContactForm.empresaId);
                              if (emp) setEmpresaToDelete(emp);
                            }}
                            style={{
                              padding: '8px 12px',
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              borderRadius: '8px',
                              color: '#dc2626',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            Excluir
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewContactModalOpen(false);
                            setIsEmpresasModalOpen(true);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#0284c7',
                            fontSize: '11px',
                            cursor: 'pointer',
                            padding: '2px 0'
                          }}
                        >
                          Gerenciar todas as empresas →
                        </button>
                      </div>
                    </div>
                  ) : empresaModo === 'existente' && empresasDisponiveis.length === 0 ? (
                    <div style={{ padding: '10px 12px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', fontSize: '12px', color: '#64748b' }}>
                      Nenhuma empresa cadastrada no momento.{' '}
                      <button
                        type="button"
                        style={{ background: 'none', border: 'none', color: '#0284c7', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                        onClick={() => setEmpresaModo('nova')}
                      >
                        Clique para cadastrar uma nova empresa.
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="CNPJ (14 dígitos, ex: 12345678000195)"
                          className="form-input"
                          style={{ flex: 1 }}
                          value={newContactForm.cnpj}
                          onChange={(e) => {
                            const cnpj = e.target.value.replace(/\D/g, '').slice(0, 14);
                            setCnpjLookup(null);
                            setNewContactForm((prev) => ({ ...prev, cnpj, empresaId: '' }));
                          }}
                        />
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={isSearchingCnpj || (newContactForm.cnpj || '').length !== 14}
                          onClick={handleBuscarCnpj}
                          title="Preencher dados cadastrais da empresa pelo CNPJ"
                          style={{ whiteSpace: 'nowrap', padding: '0 12px', fontSize: '12px' }}
                        >
                          {isSearchingCnpj ? 'Buscando...' : 'Buscar CNPJ'}
                        </button>
                      </div>
                      {missingChannels.length > 0 && (
                        <small role="status">Preenchimento manual disponível para {missingChannels.join(', ')}.</small>
                      )}
                      <input
                        type="text"
                        placeholder="Nome da nova empresa"
                        className="form-input"
                        value={newContactForm.company}
                        onChange={(e) => setNewContactForm({ ...newContactForm, company: e.target.value, empresaId: '' })}
                      />
                    </div>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group half">
                    <label className="form-label">E-mail principal</label>
                    <input
                      type="email"
                      placeholder="contato@empresa.com.br"
                      className="form-input"
                      value={contactChannels.email}
                      onChange={(e) => setNewContactForm({ ...newContactForm, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group half">
                    <label className="form-label">Telefone principal</label>
                    <input
                      type="text"
                      placeholder="+55 (11) 99999-9999"
                      className="form-input"
                      value={contactChannels.phone}
                      onChange={(e) => setNewContactForm({ ...newContactForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group half">
                    <label className="form-label" htmlFor="new-contact-secondary-phone">Telefone secundário</label>
                    <input
                      id="new-contact-secondary-phone"
                      type="tel"
                      className="form-input"
                      value={contactChannels.secondaryPhone}
                      onChange={(e) => setNewContactForm({ ...newContactForm, secondaryPhone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group half">
                    <label className="form-label">Segmento</label>
                    <select
                      className="form-select"
                      value={newContactForm.segment}
                      onChange={(e) => setNewContactForm({ ...newContactForm, segment: e.target.value })}
                    >
                      <option value="Cliente - B2B">Cliente - B2B</option>
                      <option value="Varejo">Varejo</option>
                      <option value="Moda & Design">Moda & Design</option>
                      <option value="Tecnologia / SaaS">Tecnologia / SaaS</option>
                      <option value="Jurídico">Jurídico</option>
                      <option value="Logística">Logística</option>
                      <option value="Arquitetura">Arquitetura</option>
                    </select>
                  </div>
                  <div className="form-group half">
                    <label className="form-label">Localização</label>
                    <input
                      type="text"
                      placeholder="Ex: São Paulo, SP - Brasil"
                      className="form-input"
                      value={newContactForm.location}
                      onChange={(e) => setNewContactForm({ ...newContactForm, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Status de Conciliação</label>
                  <select
                    className="form-select"
                    value={newContactForm.status}
                    onChange={(e) => setNewContactForm({ ...newContactForm, status: e.target.value })}
                  >
                    <option value="Unificado">Unificado (Conferido)</option>
                    <option value="Em revisão">Em revisão (Pendente)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsNewContactModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={isSavingContact}>
                  {isSavingContact ? 'Salvando no Banco...' : 'Salvar Contato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Exclusão de Contato */}
      {isDeleteModalOpen && selectedContact && (
        <div className="modal-backdrop" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#b91c1c' }}>Confirmar Exclusão</h3>
              <button className="modal-close" onClick={() => setIsDeleteModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13.5px', color: '#334155', lineHeight: '1.5', margin: '0 0 12px' }}>
                Tem certeza que deseja remover o contato <strong>{selectedContact.name}</strong> ({selectedContact.company})?
              </p>
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#991b1b' }}>
                Esta ação remove o contato da visualização ativa e consolidação da base de contatos.
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ background: '#dc2626', borderColor: '#dc2626' }}
                onClick={handleDeleteContact}
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Gerenciar Empresas Cadastradas */}
      {isEmpresasModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsEmpresasModalOpen(false)}>
          <div className="modal-dialog large" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Empresas Cadastradas</h3>
                <p className="modal-subtitle">
                  Visualize e gerencie as empresas cadastradas no banco PostgreSQL.
                </p>
              </div>
              <button className="modal-close" onClick={() => setIsEmpresasModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {empresasDisponiveis.length === 0 ? (
                <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px', display: 'block' }}>
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                  Nenhuma empresa cadastrada no momento.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {empresasDisponiveis.map((emp) => {
                    const contatosVinculados = contacts.filter((c) => c.empresaId === emp.id || c.company === emp.nome).length;
                    return (
                      <div
                        key={emp.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          background: '#ffffff',
                          transition: 'border-color 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '8px',
                              background: '#f0f9ff',
                              color: '#0284c7',
                              fontWeight: 700,
                              fontSize: '13px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            {(emp.nome || 'E').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>
                              {emp.nome}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                              CNPJ: {emp.cnpj ? emp.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : 'Não informado'}
                              {' · '}
                              {emp.cidade || 'SP'}/{emp.uf || 'SP'}
                              {' · '}
                              <span style={{ color: contatosVinculados > 0 ? '#0284c7' : '#94a3b8' }}>
                                {contatosVinculados} {contatosVinculados === 1 ? 'contato vinculado' : 'contatos vinculados'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setEmpresaToDelete(emp)}
                          title={`Excluir empresa ${emp.nome}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '8px',
                            color: '#dc2626',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                          Excluir
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsEmpresasModalOpen(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmação de Exclusão de Empresa */}
      {empresaToDelete && (
        <div className="modal-backdrop" onClick={() => !isDeletingEmpresa && setEmpresaToDelete(null)} style={{ zIndex: 1100 }}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#b91c1c' }}>Excluir Empresa</h3>
              <button className="modal-close" onClick={() => !isDeletingEmpresa && setEmpresaToDelete(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13.5px', color: '#334155', lineHeight: '1.5', margin: '0 0 12px' }}>
                Tem certeza que deseja excluir a empresa <strong>{empresaToDelete.nome}</strong>
                {empresaToDelete.cnpj ? ` (CNPJ: ${empresaToDelete.cnpj})` : ''}?
              </p>
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#991b1b', lineHeight: '1.4' }}>
                A empresa será removida da lista e não aparecerá mais nos cadastros. Os contatos vinculados passarão a ter empresa "Não informada".
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                disabled={isDeletingEmpresa}
                onClick={() => setEmpresaToDelete(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={isDeletingEmpresa}
                style={{ background: '#dc2626', borderColor: '#dc2626' }}
                onClick={handleConfirmDeleteEmpresa}
              >
                {isDeletingEmpresa ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Contato */}
      {isEditModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Perfil Unificado</h3>
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome Completo</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Empresa</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editForm.company}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group half">
                    <label className="form-label">E-mail</label>
                    <input
                      type="email"
                      className="form-input"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group half">
                    <label className="form-label">Telefone</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group half">
                    <label className="form-label">Segmento</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.segment}
                      onChange={(e) => setEditForm({ ...editForm, segment: e.target.value })}
                    />
                  </div>
                  <div className="form-group half">
                    <label className="form-label">Localização</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsEditModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Atualizar Dados
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ver Registros de Origem */}
      {isRecordsModalOpen && selectedContact && (
        <div className="modal-backdrop" onClick={() => setIsRecordsModalOpen(false)}>
          <div className="modal-dialog large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Fichas de Origem Brutas</h3>
                <p className="modal-subtitle">
                  Visualização dos registros individuais antes da consolidação para <strong>{selectedContact.name}</strong> ({selectedContact.id}).
                </p>
              </div>
              <button className="modal-close" onClick={() => setIsRecordsModalOpen(false)}>✕</button>
            </div>

            <div className="modal-body raw-records-body">
              {selectedContact.rawRecords && selectedContact.rawRecords.length > 0 ? (
                selectedContact.rawRecords.map((rec, index) => (
                  <div key={index} className="raw-record-card">
                    <div className="raw-record-header">
                      <div>
                        <h4 className="raw-record-system">{rec.system}</h4>
                        <span className="raw-record-id">ID: {rec.id}</span>
                      </div>
                      <span className="raw-record-status">{rec.status}</span>
                    </div>

                    <div className="raw-record-table">
                      {Object.entries(rec.fields).map(([key, val]) => (
                        <div key={key} className="raw-field-row">
                          <span className="raw-field-key">{key}</span>
                          <span className="raw-field-val">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="raw-record-empty">
                  <p>As fichas brutas detalhadas estão sincronizadas no servidor de integração.</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-primary" onClick={() => setIsRecordsModalOpen(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botão Flutuante 3D (Globo) para abrir a Inteligência Artificial em tela cheia */}
      {!isIaModalOpen && (
        <button
          type="button"
          className="ia-floating-orb-btn"
          onClick={() => setIsIaModalOpen(true)}
          aria-label="Abrir Inteligência Artificial"
        >
          <span className="ia-floating-orb-tooltip">Abrir Inteligência IA</span>
          <div className="ia-floating-orb-canvas">
            <OrbScene compact />
          </div>
        </button>
      )}

      {/* Modal em Tela Cheia: Inteligência Artificial */}
      {isIaModalOpen && (
        <div
          className="ia-fullscreen-modal-backdrop"
          onClick={() => setIsIaModalOpen(false)}
        >
          <div
            className="ia-fullscreen-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <DashboardIA
              isModal={true}
              onClose={() => setIsIaModalOpen(false)}
              onShowToast={showToast}
            />
          </div>
        </div>
      )}
    </div>
  );
}
