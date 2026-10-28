import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/header.css';

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className="neocore-header">
      <button
        className="header-menu"
        type="button"
        aria-label="Abrir menu"
        onClick={() => navigate('/dashboard')}
      >
        <img src="/menu.svg" alt="" />
      </button>

      <a className="header-brand" href="/dashboard" aria-label="NEOCORE">
        <img src="/logo-n.png" alt="" />
        <span>NEOCORE</span>
      </a>

      <div className="header-user">
        <span>Olá, Carlos</span>
        <span className="header-avatar">CL</span>
      </div>
    </header>
  );
}
