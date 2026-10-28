import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Header({ onToggleSidebar, userName = 'Carlos', userInitials = 'CL' }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <header className="dash-header">
      {/* Botão de Toggle da Sidebar (Menu Hambúrguer) */}
      <div className="dash-header-left">
        <button
          type="button"
          className="dash-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Alternar barra lateral"
          title="Alternar barra lateral"
        >
          <span className="dash-menu-bar" />
          <span className="dash-menu-bar" />
          <span className="dash-menu-bar" />
        </button>
      </div>

      {/* Centro: Logo e Nome NEOCORE */}
      <div className="dash-header-center">
        <div className="dash-brand">
          <img src="/logo-n.png" alt="NEOCORE" className="dash-brand-logo" />
          <span className="dash-brand-name">NEOCORE</span>
        </div>
      </div>

      {/* Lado Direito: Usuário e Avatar */}
      <div className="dash-header-right">
        <div className="dash-user-wrapper" onClick={() => setMenuOpen(!menuOpen)}>
          <span className="dash-user-greeting">Olá, {userName}</span>
          <div className="dash-user-avatar" title={`Perfil de ${userName}`}>
            {userInitials}
          </div>

          {menuOpen && (
            <div className="dash-user-dropdown" onClick={(e) => e.stopPropagation()}>
              <div className="dash-dropdown-info">
                <strong>{userName}</strong>
                <span>carlos@neocore.tech</span>
              </div>
              <div className="dash-dropdown-divider" />
              <button
                type="button"
                className="dash-dropdown-item logout"
                onClick={handleLogout}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sair do sistema
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
