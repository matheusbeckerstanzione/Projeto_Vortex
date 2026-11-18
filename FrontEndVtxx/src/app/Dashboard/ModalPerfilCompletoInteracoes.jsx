import React, { useEffect, useState } from 'react';
import '../../styles/modalPerfilCompletoInteracoes.css';

export default function ModalEditarInteracoes({
  aberto,
  valorAtual,
  onClose,
  onSave
}) {
  const [interacoes, setInteracoes] = useState(valorAtual);

  useEffect(() => {
    if (aberto) {
      setInteracoes(valorAtual);
    }
  }, [aberto, valorAtual]);

  if (!aberto) return null;

  const handleSave = () => {
    const quantidade = Number(interacoes);

    if (
      interacoes === '' ||
      !Number.isInteger(quantidade) ||
      quantidade < 0
    ) {
      alert('Digite uma quantidade válida de interações.');
      return;
    }

    onSave(quantidade);
  };

  return (
    <div className="pref-modal-overlay" onClick={onClose}>
      <div
        className="pref-modal-container"
        onClick={e => e.stopPropagation()}
      >
        <div className="pref-modal-header">
          <h2>Editar Interações</h2>

          <button
            type="button"
            className="pref-modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <p className="pref-modal-description">
          Atualize a quantidade de cliques realizados pelo contato
          em campanhas nos últimos 30 dias.
        </p>

        <div className="pref-modal-content">
          <div className="pref-modal-field">
            <label htmlFor="pref-interacoes">
              Quantidade de interações
            </label>

            <input
              id="pref-interacoes"
              type="number"
              min="0"
              step="1"
              value={interacoes}
              onChange={e => setInteracoes(e.target.value)}
              placeholder="Digite a quantidade"
            />
          </div>
        </div>

        <div className="pref-modal-footer">
          <button
            type="button"
            className="pref-modal-cancel"
            onClick={onClose}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="pref-modal-save"
            onClick={handleSave}
          >
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  );
}
