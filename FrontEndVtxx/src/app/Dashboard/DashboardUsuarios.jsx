import React, { useState, useEffect, useMemo } from 'react';
import { userService } from '../../services/userService';
import '../../styles/DashboardUsuarios.css';

export default function DashboardUsuarios({ onShowToast }) {
  const [activeTab, setActiveTab] = useState('solicitacoes'); // 'solicitacoes' | 'usuarios'
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modais
  const [modalAprovar, setModalAprovar] = useState(null); // objeto solicitacao a aprovar
  const [perfilAprovacao, setPerfilAprovacao] = useState('ANALISTA');
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    nome: '',
    email: '',
    perfil: 'ANALISTA',
  });
  const [conviteGerado, setConviteGerado] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleGerarConvite = async (usuario) => {
    setActionLoading(true);
    try {
      const resp = await userService.criarConvite(usuario.id);
      const token = resp?.token || resp?.tokenConvite || '';
      const link = `${window.location.origin}/ativar-conta${token ? `?token=${encodeURIComponent(token)}` : ''}`;
      setConviteGerado({
        usuarioNome: usuario.nome,
        email: usuario.email,
        token,
        link,
      });
      if (onShowToast) onShowToast(`Convite gerado para ${usuario.nome}!`);
    } catch (err) {
      if (onShowToast) onShowToast(err?.message || 'Erro ao gerar convite.');
    } finally {
      setActionLoading(false);
    }
  };

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [solics, users] = await Promise.all([
        userService.getSolicitacoes(),
        userService.getUsuarios(),
      ]);
      setSolicitacoes(solics || []);
      setUsuarios(users || []);
    } catch (e) {
      if (onShowToast) onShowToast('Erro ao carregar dados de usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const pendentesCount = useMemo(() => {
    return solicitacoes.filter((s) => s.status === 'PENDENTE').length;
  }, [solicitacoes]);

  // Filtragem
  const filteredSolicitacoes = useMemo(() => {
    return solicitacoes.filter((s) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        s.nome?.toLowerCase().includes(term) ||
        s.email?.toLowerCase().includes(term) ||
        s.justificativa?.toLowerCase().includes(term)
      );
    });
  }, [solicitacoes, searchTerm]);

  const filteredUsuarios = useMemo(() => {
    return usuarios.filter((u) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        u.nome?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.perfil?.toLowerCase().includes(term)
      );
    });
  }, [usuarios, searchTerm]);

  // Ações de Solicitação
  const handleConfirmarAprovacao = async () => {
    if (!modalAprovar) return;
    setActionLoading(true);
    try {
      // 1. Atualiza a solicitação para APROVADA
      await userService.avaliarSolicitacao(modalAprovar.id, 'APROVADA');

      // 2. Cadastra o usuário com o perfil selecionado
      try {
        await userService.cadastrarUsuario({
          nome: modalAprovar.nome,
          email: modalAprovar.email,
          perfil: perfilAprovacao,
        });
      } catch (errCad) {
        console.warn('Usuário já existia ou convite criado:', errCad.message);
      }

      if (onShowToast) {
        onShowToast(`Solicitação de ${modalAprovar.nome} aprovada com perfil ${perfilAprovacao}!`);
      }
      setModalAprovar(null);
      carregarDados();
    } catch (e) {
      if (onShowToast) onShowToast('Erro ao aprovar solicitação: ' + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejeitar = async (solic) => {
    if (!window.confirm(`Deseja realmente rejeitar a solicitação de ${solic.nome}?`)) return;
    setActionLoading(true);
    try {
      await userService.avaliarSolicitacao(solic.id, 'REJEITADA');
      if (onShowToast) onShowToast(`Solicitação de ${solic.nome} rejeitada.`);
      carregarDados();
    } catch (e) {
      if (onShowToast) onShowToast('Erro ao rejeitar solicitação: ' + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Ações de Usuário
  const handleToggleStatus = async (user) => {
    const novoStatus = user.status === 'ATIVO' ? 'DESATIVADO' : 'ATIVO';
    const confirmMsg = user.status === 'ATIVO'
      ? `Deseja desativar o acesso de ${user.nome}?`
      : `Deseja reativar o acesso de ${user.nome}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await userService.alterarStatusUsuario(user.id, novoStatus);
      if (onShowToast) onShowToast(`Status de ${user.nome} alterado para ${novoStatus}!`);
      carregarDados();
    } catch (e) {
      if (onShowToast) onShowToast('Erro ao alterar status: ' + e.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserForm.nome.trim() || !newUserForm.email.trim()) {
      alert('Preencha o nome e o e-mail do usuário.');
      return;
    }
    setActionLoading(true);
    try {
      await userService.cadastrarUsuario(newUserForm);
      if (onShowToast) onShowToast(`Usuário ${newUserForm.nome} criado com sucesso!`);
      setIsNewUserModalOpen(false);
      setNewUserForm({ nome: '', email: '', perfil: 'ANALISTA' });
      carregarDados();
    } catch (e) {
      if (onShowToast) onShowToast('Erro ao cadastrar usuário: ' + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <main className="users-container">
      {/* Header */}
      <div className="users-page-header">
        <div className="users-title-group">
          <h1 className="users-page-title">Usuários & Acessos</h1>
          <p className="users-page-subtitle">
            Gerenciamento de solicitações de novos acessos, permissões (Administrador/Analista) e status dos usuários no NeoCore.
          </p>
        </div>

        <div className="users-header-actions">
          {activeTab === 'usuarios' && (
            <button
              type="button"
              className="users-btn-primary"
              onClick={() => setIsNewUserModalOpen(true)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Novo Usuário
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="users-tabs-bar">
        <button
          type="button"
          className={`users-tab-btn ${activeTab === 'solicitacoes' ? 'active' : ''}`}
          onClick={() => setActiveTab('solicitacoes')}
        >
          <span>Solicitações de Cadastro</span>
          {pendentesCount > 0 && (
            <span className="users-tab-badge">{pendentesCount}</span>
          )}
        </button>

        <button
          type="button"
          className={`users-tab-btn ${activeTab === 'usuarios' ? 'active' : ''}`}
          onClick={() => setActiveTab('usuarios')}
        >
          <span>Usuários do Sistema</span>
          <span className="users-tab-badge secondary">{usuarios.length}</span>
        </button>

        {/* Busca */}
        <div className="users-search-box">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Conteúdo Aba 1: Solicitações */}
      {activeTab === 'solicitacoes' && (
        <section className="users-card">
          <div className="users-table-responsive">
            <table className="users-table">
              <thead>
                <tr>
                  <th>NOME</th>
                  <th>E-MAIL</th>
                  <th>JUSTIFICATIVA</th>
                  <th>SOLICITADO EM</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                      Carregando solicitações...
                    </td>
                  </tr>
                ) : filteredSolicitacoes.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      Nenhuma solicitação de acesso encontrada.
                    </td>
                  </tr>
                ) : (
                  filteredSolicitacoes.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="users-name-cell">
                          <div className="users-avatar-circle">
                            {s.nome ? s.nome.substring(0, 2).toUpperCase() : 'US'}
                          </div>
                          <strong>{s.nome}</strong>
                        </div>
                      </td>
                      <td style={{ color: '#475569' }}>{s.email}</td>
                      <td style={{ maxWidth: '240px', fontSize: '12px', color: '#64748b' }}>
                        {s.justificativa || 'Sem justificativa informada'}
                      </td>
                      <td style={{ fontSize: '12px', color: '#64748b' }}>
                        {s.solicitadoEm
                          ? new Date(s.solicitadoEm).toLocaleDateString('pt-BR')
                          : 'Recentemente'}
                      </td>
                      <td>
                        <span className={`users-status-pill ${s.status?.toLowerCase()}`}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {s.status === 'PENDENTE' ? (
                          <div className="users-actions-inline">
                            <button
                              type="button"
                              className="users-action-btn approve"
                              onClick={() => setModalAprovar(s)}
                              title="Aprovar e atribuir perfil"
                            >
                              Aprovar
                            </button>
                            <button
                              type="button"
                              className="users-action-btn reject"
                              onClick={() => handleRejeitar(s)}
                              title="Rejeitar solicitação"
                            >
                              Rejeitar
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                            {s.status === 'APROVADA' ? 'Aprovado' : 'Rejeitado'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Conteúdo Aba 2: Usuários */}
      {activeTab === 'usuarios' && (
        <section className="users-card">
          <div className="users-table-responsive">
            <table className="users-table">
              <thead>
                <tr>
                  <th>USUÁRIO</th>
                  <th>E-MAIL</th>
                  <th>PERFIL</th>
                  <th>STATUS</th>
                  <th>CRIADO EM</th>
                  <th style={{ textAlign: 'right' }}>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                      Carregando usuários...
                    </td>
                  </tr>
                ) : filteredUsuarios.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      Nenhum usuário cadastrado encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredUsuarios.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="users-name-cell">
                          <div className="users-avatar-circle">
                            {u.nome ? u.nome.substring(0, 2).toUpperCase() : 'US'}
                          </div>
                          <strong>{u.nome}</strong>
                        </div>
                      </td>
                      <td style={{ color: '#475569' }}>{u.email}</td>
                      <td>
                        <span className={`users-role-pill ${u.perfil?.toLowerCase()}`}>
                          {u.perfil === 'ADMINISTRADOR' ? 'Administrador' : 'Analista'}
                        </span>
                      </td>
                      <td>
                        <span className={`users-status-pill ${u.status?.toLowerCase()}`}>
                          {u.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: '#64748b' }}>
                        {u.criadoEm
                          ? new Date(u.criadoEm).toLocaleDateString('pt-BR')
                          : '—'}
                      </td>
                      <td style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          type="button"
                          className="users-action-btn activate"
                          disabled={actionLoading}
                          onClick={() => handleGerarConvite(u)}
                          title="Gerar link/token de ativação de conta"
                        >
                          Convite
                        </button>
                        <button
                          type="button"
                          className={`users-action-btn ${u.status === 'ATIVO' ? 'deactivate' : 'activate'}`}
                          onClick={() => handleToggleStatus(u)}
                        >
                          {u.status === 'ATIVO' ? 'Desativar' : 'Ativar'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Modal Aprovar Solicitação */}
      {modalAprovar && (
        <div className="users-modal-overlay" onClick={() => setModalAprovar(null)}>
          <div className="users-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="users-modal-header">
              <h3>Aprovar Solicitação de Acesso</h3>
              <button
                type="button"
                className="users-modal-close"
                onClick={() => setModalAprovar(null)}
              >
                ✕
              </button>
            </div>

            <div className="users-modal-body">
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                Você está concedendo acesso ao sistema para:
              </p>

              <div className="users-modal-info-box">
                <div><strong>Nome:</strong> {modalAprovar.nome}</div>
                <div><strong>E-mail:</strong> {modalAprovar.email}</div>
                <div><strong>Justificativa:</strong> {modalAprovar.justificativa || 'Não informada'}</div>
              </div>

              <label className="users-modal-label">PERFIL DE ACESSO</label>
              <select
                className="users-modal-select"
                value={perfilAprovacao}
                onChange={(e) => setPerfilAprovacao(e.target.value)}
              >
                <option value="ANALISTA">ANALISTA (Operação de contatos e enriquecimento)</option>
                <option value="ADMINISTRADOR">ADMINISTRADOR (Acesso total, governança e usuários)</option>
              </select>

              <div className="users-modal-hint">
                {perfilAprovacao === 'ADMINISTRADOR' ? (
                  <span style={{ color: '#0369a1' }}>
                    O usuário terá permissão total, incluindo relatórios de conformidade LGPD, logs de auditoria e aprovação de novos membros.
                  </span>
                ) : (
                  <span style={{ color: '#475569' }}>
                    O usuário terá acesso operacional aos contatos e enriquecimento, com restrição a dados de auditoria e governança.
                  </span>
                )}
              </div>
            </div>

            <div className="users-modal-footer">
              <button
                type="button"
                className="users-btn-secondary"
                onClick={() => setModalAprovar(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="users-btn-primary"
                disabled={actionLoading}
                onClick={handleConfirmarAprovacao}
              >
                {actionLoading ? 'APROVANDO...' : 'CONFIRMAR APROVAÇÃO'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar Novo Usuário Diretamente */}
      {isNewUserModalOpen && (
        <div className="users-modal-overlay" onClick={() => setIsNewUserModalOpen(false)}>
          <div className="users-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="users-modal-header">
              <h3>Cadastrar Novo Usuário</h3>
              <button
                type="button"
                className="users-modal-close"
                onClick={() => setIsNewUserModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="users-modal-body">
                <label className="users-modal-label">NOME COMPLETO</label>
                <input
                  type="text"
                  className="users-modal-input"
                  placeholder="Nome do colaborador"
                  value={newUserForm.nome}
                  onChange={(e) => setNewUserForm({ ...newUserForm, nome: e.target.value })}
                  required
                />

                <label className="users-modal-label">E-MAIL CORPORATIVO</label>
                <input
                  type="email"
                  className="users-modal-input"
                  placeholder="colaborador@empresa.com"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  required
                />

                <label className="users-modal-label">PERFIL DE ACESSO</label>
                <select
                  className="users-modal-select"
                  value={newUserForm.perfil}
                  onChange={(e) => setNewUserForm({ ...newUserForm, perfil: e.target.value })}
                >
                  <option value="ANALISTA">ANALISTA (Operação de contatos e enriquecimento)</option>
                  <option value="ADMINISTRADOR">ADMINISTRADOR (Acesso total)</option>
                </select>
              </div>

              <div className="users-modal-footer">
                <button
                  type="button"
                  className="users-btn-secondary"
                  onClick={() => setIsNewUserModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="users-btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'CADASTRANDO...' : 'CADASTRAR USUÁRIO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Convite Gerado */}
      {conviteGerado && (
        <div className="users-modal-overlay" onClick={() => setConviteGerado(null)}>
          <div className="users-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="users-modal-header">
              <h3>Convite de Ativação Gerado</h3>
              <button
                type="button"
                className="users-modal-close"
                onClick={() => setConviteGerado(null)}
              >
                ✕
              </button>
            </div>
            <div className="users-modal-body">
              <p style={{ fontSize: '13px', color: '#475569', marginBottom: '12px' }}>
                Envie o link ou token abaixo para <strong>{conviteGerado.usuarioNome}</strong> ({conviteGerado.email}) definir a senha em <strong>/ativar-conta</strong>:
              </p>
              {conviteGerado.token && (
                <div style={{ marginBottom: '12px' }}>
                  <label className="users-modal-label">TOKEN DO CONVITE</label>
                  <input
                    type="text"
                    readOnly
                    className="users-modal-input"
                    value={conviteGerado.token}
                    onClick={(e) => e.target.select()}
                  />
                </div>
              )}
              <div>
                <label className="users-modal-label">LINK DE ATIVAÇÃO</label>
                <input
                  type="text"
                  readOnly
                  className="users-modal-input"
                  value={conviteGerado.link}
                  onClick={(e) => e.target.select()}
                />
              </div>
            </div>
            <div className="users-modal-footer">
              <button
                type="button"
                className="users-btn-secondary"
                onClick={() => {
                  navigator.clipboard?.writeText(conviteGerado.link);
                  if (onShowToast) onShowToast('Link de ativação copiado!');
                }}
              >
                Copiar Link
              </button>
              <button
                type="button"
                className="users-btn-primary"
                onClick={() => setConviteGerado(null)}
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
