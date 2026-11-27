import React, { useState, useEffect } from 'react';
import '../../styles/modalEditarSegmentos.css';

export default function ModalEditarSegmento({
  segmento,
  fecharModal,
  salvarAlteracoes,
  salvando = false,
}) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [criterios, setCriterios] = useState('');
  const [status, setStatus] = useState('ATIVO');

  useEffect(() => {
    if (segmento) {
      setNome(segmento.name || '');
      setDescricao(segmento.description || '');
      setCriterios(segmento.criteria || '');
      setStatus(
        segmento.backendStatus ||
        (segmento.status === 'Ativo' ? 'ATIVO' : segmento.status === 'Sem resultados' ? 'ARQUIVADO' : 'RASCUNHO')
      );
    }
  }, [segmento]);

  useEffect(() => {
    if (!segmento) return;
    const overflowOriginal = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflowOriginal;
    };
  }, [segmento]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!nome.trim() || salvando) {
      return;
    }

    salvarAlteracoes({
      ...segmento,
      name: nome.trim(),
      description: descricao.trim(),
      criteria: criterios.trim(),
      backendStatus: status,
      updatedAt: 'Hoje',
    });
  };

  if (!segmento) return null;

  return (
    <div
      className="editar-segmento-overlay"
      onClick={fecharModal}
    >
      <div
        className="editar-segmento-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="editar-segmento-header">
          <div className="editar-segmento-tag">
            <span>NeoCore</span>
            <span>Editar segmento</span>
          </div>

          <button
            type="button"
            className="editar-segmento-fechar"
            onClick={fecharModal}
          >
            ×
          </button>

          <h2>Editar segmento</h2>

          <p>
            Atualize as informações e os critérios
            do público selecionado.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="editar-segmento-campo">
            <label>Nome do segmento</label>

            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do segmento"
              required
            />
          </div>

          <div className="editar-segmento-campo">
            <label>Descrição do segmento</label>

            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o público"
              rows={3}
            />
          </div>

          <div className="editar-segmento-campo">
            <label>Critérios do segmento</label>

            <textarea
              value={criterios}
              onChange={(e) => setCriterios(e.target.value)}
              placeholder="Informe os critérios"
              rows={3}
            />
          </div>

          <div className="editar-segmento-campo">
            <label>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                fontFamily: 'inherit',
                background: '#fff',
              }}
            >
              <option value="ATIVO">Ativo</option>
              <option value="RASCUNHO">Rascunho</option>
              <option value="ARQUIVADO">Arquivado</option>
            </select>
          </div>

          <div className="editar-segmento-aviso">
            <strong>Alterações no segmento</strong>
            <p>
              As informações serão atualizadas no segmento
              selecionado. Nenhuma campanha será disparada.
            </p>
          </div>

          <div className="editar-segmento-footer">
            <button
              type="button"
              className="editar-segmento-cancelar"
              onClick={fecharModal}
              disabled={salvando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="editar-segmento-salvar"
              disabled={salvando}
            >
              {salvando ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>

          <p className="editar-segmento-disclaimer">
            Nenhuma campanha será disparada automaticamente.
          </p>
        </form>
      </div>
    </div>
  );
}
