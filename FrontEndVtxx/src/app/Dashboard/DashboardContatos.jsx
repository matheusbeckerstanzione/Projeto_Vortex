import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/DashboardContatos.css';
import neocoreLogo from '../../assets/neocore-logo.png';
import { contactService } from '../../services/contactService';
import DashboardInicio from './DashboardInicio';
import DashboardEnriquecimento from './DashboardEnriquecimento';
import DashboardPerfilCompleto from './DashboardPerfilCompleto';
import DashboardFichaOrigem from './DashboardFichaOrigem';
import DashboardSegmentos from './DashboardSegmentos';
import VortexGovernanca from './DashboardGovernanca';
import VortexLogs from './DashboardLogs';
import ImportarNeocore from '../ImportarNeocore';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isContactsOpen, setIsContactsOpen] = useState(
    ['todos-contatos', 'completar', 'enriquecimento', 'perfil-completo', 'ficha'].includes(initialMenu)
  );
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    if (initialMenu) {
      setActiveMenu(initialMenu);
      if (['todos-contatos', 'completar', 'enriquecimento', 'perfil-completo', 'ficha'].includes(initialMenu)) {
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
  const [isRecordsModalOpen, setIsRecordsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Formulário Novo Contato
  const [newContactForm, setNewContactForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
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
    contactService.getContacts().then((data) => {
      setContacts(data);
      if (data.length > 0 && !selectedContactId) {
        setSelectedContactId(data[0].id);
      }
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
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    return (
      contacts.find((c) => c.id === selectedContactId) ||
      contacts[0] ||
      null
    );
  }, [contacts, selectedContactId]);

  // Abrir modal de edição
  const handleOpenEdit = () => {
    if (!selectedContact) return;
    setEditForm({
      name: selectedContact.name,
      company: selectedContact.company,
      email: selectedContact.email,
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

  // Criar novo contato
  const handleCreateContact = async (e) => {
    e.preventDefault();
    if (!newContactForm.name.trim() || !newContactForm.email.trim()) {
      alert('Por favor, preencha o nome e o e-mail do contato.');
      return;
    }
    const created = await contactService.addContact(newContactForm);
    setContacts((prev) => [created, ...prev]);
    setSelectedContactId(created.id);
    setIsNewContactModalOpen(false);
    setNewContactForm({
      name: '',
      company: '',
      email: '',
      phone: '',
      location: '',
      segment: 'Cliente - B2B',
      status: 'Unificado'
    });
    showToast(`Contato "${created.name}" criado com sucesso!`);
  };

  // Exportar contatos
  const handleExport = () => {
    contactService.exportToCSV(filteredContacts);
    showToast('Planilha CSV gerada e baixada com sucesso!');
  };

  // Adicionar nota
  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNoteText.trim() || !selectedContact) return;
    const newNoteObj = {
      id: Date.now(),
      author: 'Carlos Lima',
      date: 'Hoje às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      text: newNoteText.trim()
    };
    setContacts((prev) =>
      prev.map((c) => {
        if (c.id === selectedContact.id) {
          return {
            ...c,
            notes: [newNoteObj, ...(c.notes || [])]
          };
        }
        return c;
      })
    );
    setNewNoteText('');
    showToast('Nota adicionada com sucesso!');
  };

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
            <span className="user-greeting">Olá, Carlos</span>
            <button
              type="button"
              className="user-avatar-btn"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              aria-label="Abrir menu do usuário"
              title="Carlos Lima (Admin) - Clique para opções"
            >
              <div className="user-avatar">
                CL
              </div>
            </button>

            {isUserMenuOpen && (
              <>
                <div className="user-menu-backdrop" onClick={() => setIsUserMenuOpen(false)} />
                <div className="user-dropdown-menu">
                  <div className="dropdown-user-header">
                    <span className="dropdown-user-name">Carlos Lima</span>
                    <span className="dropdown-user-email">carlos@neocore.tech</span>
                    <span className="dropdown-user-badge">Administrador</span>
                  </div>
                  <div className="dropdown-divider" />
                  <button
                    type="button"
                    className="dropdown-menu-item logout"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      document.body.classList.remove('dark-bg');
                      navigate('/');
                    }}
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
        {/* Left Sidebar */}
        <aside className={`vortex-sidebar ${!isSidebarOpen ? 'closed' : ''}`} aria-hidden={!isSidebarOpen}>
          <div className="sidebar-inner-container">
            <div className="workspace-header">
            <span className="workspace-label">Workspace</span>
            <h2 className="workspace-title">Operações</h2>
          </div>

          <nav className="sidebar-nav">
            <div
              className={`nav-item ${activeMenu === 'inicio' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('inicio');
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
                    setActiveMenu('todos-contatos');
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
                    setActiveMenu('todos-contatos');
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
                    setActiveMenu('enriquecimento');
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
                    setActiveMenu('perfil-completo');
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
                    setActiveMenu('ficha');
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
              onClick={() => setActiveMenu('importar')}
            >
              <span className="nav-bullet"></span>
              <span className="nav-text">Importar</span>
            </div>

            <div
              className={`nav-item ${activeMenu === 'segmentos' ? 'active' : ''}`}
              onClick={() => setActiveMenu('segmentos')}
            >
              <span className="nav-bullet"></span>
              <span className="nav-text">Segmentos</span>
            </div>

            <div
              className={`nav-item ${activeMenu === 'governanca' ? 'active' : ''}`}
              onClick={() => setActiveMenu('governanca')}
            >
              <span className="nav-bullet"></span>
              <span className="nav-text">Governança</span>
            </div>

            <div
              className={`nav-item ${activeMenu === 'logs' ? 'active' : ''}`}
              onClick={() => {
                setActiveMenu('logs');
                setActiveTab('historico');
              }}
            >
              <span className="nav-bullet"></span>
              <span className="nav-text">Logs de auditoria</span>
            </div>
          </nav>

          {/* Bottom Update Card */}
          <div
            className="sidebar-update-card"
            onClick={() => {
              setIsContactsOpen(true);
              setActiveMenu('enriquecimento');
            }}
            style={{ cursor: 'pointer' }}
            title="Clique para abrir enriquecimento de contatos"
          >
            <span className="update-tag">Atualização</span>
            <h4 className="update-title">12 novos cadastros foram importados hoje</h4>
            <p className="update-subtitle">3 precisam de revisão manual antes da conciliação.</p>
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
          />
        ) : (activeMenu === 'enriquecimento' || activeMenu === 'completar') ? (
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
          <>
            {/* Center Content: Contatos Table */}
            <main className="vortex-center-content">
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
                    className="btn-primary"
                    onClick={() => setIsNewContactModalOpen(true)}
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
                    {filteredContacts.length} de 1.284 contatos
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
                          return (
                            <tr
                              key={contact.id}
                              className={`contact-row ${isSelected ? 'row-selected' : ''}`}
                              onClick={() => setSelectedContactId(contact.id)}
                            >
                              <td className="td-contact">
                                <div className="contact-cell-content">
                                  <div className={`contact-avatar ${isSelected ? 'avatar-highlight' : ''}`}>
                                    {contact.initials}
                                  </div>
                                  <div className="contact-details">
                                    <span className="contact-name">{contact.name}</span>
                                    <span className="contact-company">{contact.company}</span>
                                    <span className="contact-email">{contact.email}</span>
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
                  1-{Math.min(filteredContacts.length, 7)} de 1.284 contatos
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
            {selectedContact && (
              <aside className="vortex-right-panel">
                <div className="panel-header">
                  <h3 className="panel-title">Perfil unificado</h3>
                  <button className="btn-edit" onClick={handleOpenEdit} title="Editar dados consolidados">
                    Editar
                  </button>
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
                        {selectedContact.consolidatedData.map((item, idx) => (
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
                      <div className="banner-text-wrap">
                        <h5 className="banner-title">{selectedContact.reconciliation.title}</h5>
                        <p className="banner-subtitle">{selectedContact.reconciliation.subtitle}</p>
                      </div>
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
            )}
          </>
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
                  <label className="form-label">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Mariana Souza"
                    className="form-input"
                    value={newContactForm.name}
                    onChange={(e) => setNewContactForm({ ...newContactForm, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Empresa / Razão Social</label>
                  <input
                    type="text"
                    placeholder="Ex: Mariana Souza Ltda"
                    className="form-input"
                    value={newContactForm.company}
                    onChange={(e) => setNewContactForm({ ...newContactForm, company: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group half">
                    <label className="form-label">E-mail Principal *</label>
                    <input
                      type="email"
                      required
                      placeholder="mariana@empresa.com.br"
                      className="form-input"
                      value={newContactForm.email}
                      onChange={(e) => setNewContactForm({ ...newContactForm, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group half">
                    <label className="form-label">Telefone</label>
                    <input
                      type="text"
                      placeholder="+55 (11) 99999-9999"
                      className="form-input"
                      value={newContactForm.phone}
                      onChange={(e) => setNewContactForm({ ...newContactForm, phone: e.target.value })}
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
                <button type="submit" className="btn-primary">
                  Salvar Contato
                </button>
              </div>
            </form>
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
                    required
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
                      required
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
    </div>
  );
}
