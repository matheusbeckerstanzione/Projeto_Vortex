import React, { useState } from 'react';

export default function Sidebar({
  isOpen = true,
  activeItem = 'contatos',
  activeSubItem = 'todos-os-contatos',
  onSelectItem,
}) {
  const [contatosExpanded, setContatosExpanded] = useState(true);

  const handleItemClick = (id) => {
    if (id === 'contatos') {
      setContatosExpanded(!contatosExpanded);
      if (onSelectItem) onSelectItem('contatos', activeSubItem || 'todos-os-contatos');
    } else {
      if (onSelectItem) onSelectItem(id);
    }
  };

  const handleSubItemClick = (e, subId) => {
    e.stopPropagation();
    if (onSelectItem) onSelectItem('contatos', subId);
  };

  return (
    <aside className={`dash-sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="dash-sidebar-inner">
        {/* Topo: Workspace & Operações */}
        <div className="dash-workspace-header">
          <span className="dash-workspace-label">Workspace</span>
          <h2 className="dash-workspace-title">Operações</h2>
        </div>

        {/* Menu de Navegação */}
        <nav className="dash-nav">
          <ul className="dash-nav-list">
            {/* Item: Início */}
            <li className="dash-nav-item">
              <button
                type="button"
                className={`dash-nav-btn ${activeItem === 'inicio' ? 'active' : ''}`}
                onClick={() => handleItemClick('inicio')}
              >
                <span className="dash-nav-dot" />
                <span className="dash-nav-text">Início</span>
              </button>
            </li>

            {/* Item: Contatos (Expansível) */}
            <li className="dash-nav-item with-submenu">
              <button
                type="button"
                className={`dash-nav-btn ${activeItem === 'contatos' ? 'active' : ''}`}
                onClick={() => handleItemClick('contatos')}
              >
                <span className="dash-nav-dot" />
                <span className="dash-nav-text">Contatos</span>
                <svg
                  className={`dash-nav-chevron ${contatosExpanded ? 'expanded' : ''}`}
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Submenu de Contatos */}
              {contatosExpanded && (
                <ul className="dash-submenu">
                  <li className="dash-submenu-item">
                    <button
                      type="button"
                      className={`dash-submenu-btn ${
                        activeItem === 'contatos' && activeSubItem === 'todos-os-contatos'
                          ? 'active highlight-bar'
                          : ''
                      }`}
                      onClick={(e) => handleSubItemClick(e, 'todos-os-contatos')}
                    >
                      <span className="dash-sub-indicator" />
                      <span className="dash-submenu-text">Todos os contatos</span>
                    </button>
                  </li>
                  <li className="dash-submenu-item">
                    <button
                      type="button"
                      className={`dash-submenu-btn ${
                        activeItem === 'contatos' && activeSubItem === 'completar-contatos' ? 'active' : ''
                      }`}
                      onClick={(e) => handleSubItemClick(e, 'completar-contatos')}
                    >
                      <span className="dash-submenu-text">Completar contatos</span>
                    </button>
                  </li>
                  <li className="dash-submenu-item">
                    <button
                      type="button"
                      className={`dash-submenu-btn ${
                        activeItem === 'contatos' && activeSubItem === 'perfil-completo' ? 'active' : ''
                      }`}
                      onClick={(e) => handleSubItemClick(e, 'perfil-completo')}
                    >
                      <span className="dash-submenu-text">Perfil completo</span>
                    </button>
                  </li>
                  <li className="dash-submenu-item">
                    <button
                      type="button"
                      className={`dash-submenu-btn ${
                        activeItem === 'contatos' && activeSubItem === 'ficha-de-origem' ? 'active' : ''
                      }`}
                      onClick={(e) => handleSubItemClick(e, 'ficha-de-origem')}
                    >
                      <span className="dash-submenu-text">Ficha de origem</span>
                    </button>
                  </li>
                </ul>
              )}
            </li>

            {/* Item: Importar */}
            <li className="dash-nav-item">
              <button
                type="button"
                className={`dash-nav-btn ${activeItem === 'importar' ? 'active' : ''}`}
                onClick={() => handleItemClick('importar')}
              >
                <span className="dash-nav-dot" />
                <span className="dash-nav-text">Importar</span>
              </button>
            </li>

            {/* Item: Segmentos */}
            <li className="dash-nav-item">
              <button
                type="button"
                className={`dash-nav-btn ${activeItem === 'segmentos' ? 'active' : ''}`}
                onClick={() => handleItemClick('segmentos')}
              >
                <span className="dash-nav-dot" />
                <span className="dash-nav-text">Segmentos</span>
              </button>
            </li>

            {/* Item: Governança */}
            <li className="dash-nav-item">
              <button
                type="button"
                className={`dash-nav-btn ${activeItem === 'governanca' ? 'active' : ''}`}
                onClick={() => handleItemClick('governanca')}
              >
                <span className="dash-nav-dot" />
                <span className="dash-nav-text">Governança</span>
              </button>
            </li>

            {/* Item: Logs de auditoria */}
            <li className="dash-nav-item">
              <button
                type="button"
                className={`dash-nav-btn ${activeItem === 'logs' ? 'active' : ''}`}
                onClick={() => handleItemClick('logs')}
              >
                <span className="dash-nav-dot" />
                <span className="dash-nav-text">Logs de auditoria</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* Card Inferior de Atualização */}
        <div className="dash-update-card">
          <span className="dash-update-label">Atualização</span>
          <h4 className="dash-update-title">
            12 novos cadastros foram importados hoje
          </h4>
          <p className="dash-update-desc">
            3 precisam de revisão manual antes da conciliação.
          </p>
        </div>
      </div>
    </aside>
  );
}
