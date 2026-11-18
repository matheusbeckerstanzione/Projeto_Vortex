
import React, { useEffect, useState } from 'react';
import '../../styles/modalPerfilCompletoPreferencias.css';

export default function ModalEditarPreferencia({
  aberto,
  valorAtual,
  onClose,
  onSave
}) {
  const [preferencia, setPreferencia] = useState(valorAtual);

  useEffect(() => {
    if (aberto) {
      setPreferencia(valorAtual);
    }
  }, [aberto, valorAtual]);

  if (!aberto) return null;

  const handleSave = () => {
    if (!preferencia.trim()) {
      alert('Selecione uma preferência válida.');
      return;
    }

    onSave(preferencia);
  };

  return (
    <div className="pref-modal-overlay" onClick={onClose}>
      <div
        className="pref-modal-container"
        onClick={e => e.stopPropagation()}
      >
        <div className="pref-modal-header">
          <h2>Editar Preferência</h2>

          <button
            type="button"
            className="pref-modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <p className="pref-modal-description">
          Altere o canal de comunicação preferido deste contato.
        </p>

        <div className="pref-modal-content">
          <div className="pref-modal-field">
            <label htmlFor="pref-canal">
              Preferência de contato
            </label>

            <select
              id="pref-canal"
              value={preferencia}
              onChange={e => setPreferencia(e.target.value)}
            >
              <option value="E-mail">E-mail</option>
              <option value="Telefone">Telefone</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="SMS">SMS</option>
            </select>
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
