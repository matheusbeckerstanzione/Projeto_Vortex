import '../../styles/modalFichaOrigemRevisaoHumana.css';
import { useEffect, useState } from 'react';

export default function ModalRevisaoHumana({
  request,
  cadastralData = [],
  interestValue = [],
  affinityState,
  preferenceValue,
  interactionCount,
  onClose,
  onConfirm,
}) {
  const [decisions, setDecisions] = useState({});
  const [justification, setJustification] = useState('');

  const source = request?.source;
  const sourceFields = source?.fields || [];

  useEffect(() => {
    setDecisions({});
    setJustification('');
  }, [request?.id]);

  if (!request) return null;

  const handleDecision = (field, value) => {
    setDecisions((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return 'Não informado';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  };

  return (
    <div className="human-review-overlay">
      <div className="human-review-modal">
        <button
          type="button"
          className="human-review-close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="human-review-header">
          <div className="human-review-icon">!</div>

          <div>
            <h2>Revisão humana</h2>
            <p>Analise os dados recebidos e registre sua decisão.</p>
          </div>
        </div>

        {/* IDENTIFICAÇÃO DO CONTATO */}
        <section className="human-review-section">
          <h3>Identificação do contato</h3>

          <div className="human-review-info-grid">
            <div className="human-review-info">
              <span>CONTATO</span>
              <strong>{request.contactName || 'Não informado'}</strong>
            </div>

            <div className="human-review-info">
              <span>ORIGEM</span>
              <strong>{source?.name || request.sourceId || 'Não informada'}</strong>
            </div>

            <div className="human-review-info">
              <span>DATA DA SOLICITAÇÃO</span>
              <strong>
                {request.createdAt
                  ? new Date(request.createdAt).toLocaleString('pt-BR')
                  : 'Não informada'}
              </strong>
            </div>

            <div className="human-review-info">
              <span>CONFIANÇA DA FONTE</span>
              <strong>
                {source?.confidence !== undefined
                  ? `${source.confidence}%`
                  : 'Não informada'}
              </strong>
            </div>
          </div>
        </section>

        {/* MOTIVO DA SOLICITAÇÃO */}
        <section className="human-review-section">
          <h3>Motivo da solicitação</h3>

          <div className="human-review-reason">
            <p>
              {request.notes || 'Nenhum motivo ou observação foi informado.'}
            </p>
          </div>
        </section>

        {/* DADOS RECEBIDOS DA FONTE */}
        <section className="human-review-section">
          <h3>Dados recebidos da fonte</h3>

          {sourceFields.length > 0 ? (
            <div className="human-review-fields">
              {sourceFields.map((field, index) => (
                <div
                  className="human-review-field-card"
                  key={`${field.label}-${index}`}
                >
                  <div className="human-review-field-data">
                    <span>{field.label}</span>
                    <strong>{formatValue(field.value)}</strong>
                  </div>

                  <label>Decisão humana</label>

                  <select
                    value={decisions[field.label] || ''}
                    onChange={(e) => handleDecision(field.label, e.target.value)}
                  >
                    <option value="">Selecione uma decisão</option>
                    <option value="aproveitar">Aproveitar no cadastro</option>
                    <option value="referencia">Manter apenas como referência</option>
                    <option value="descartar">Não utilizar esta informação</option>
                  </select>
                </div>
              ))}
            </div>
          ) : (
            <p className="human-review-empty">
              A solicitação não possui campos de origem disponíveis.
            </p>
          )}

          <div className="human-review-source-details">
            <p>
              <strong>Base legal:</strong> {source?.legalBase || 'Não informada'}
            </p>

            {source?.confidenceDesc && (
              <p>
                <strong>Avaliação da fonte:</strong> {source.confidenceDesc}
              </p>
            )}

            {source?.legalBaseDesc && (
              <p>
                <strong>Detalhes da base legal:</strong> {source.legalBaseDesc}
              </p>
            )}
          </div>
        </section>

        {/* DADOS JÁ CADASTRADOS */}
        <section className="human-review-section">
          <h3>Dados atuais do contato</h3>

          <div className="human-review-current-data">
            <h4>Cadastro existente</h4>

            {cadastralData.length > 0 ? (
              cadastralData.map((item) => (
                <div className="human-review-current-row" key={item.id}>
                  <span>{item.campo}</span>
                  <strong>{formatValue(item.valor)}</strong>
                </div>
              ))
            ) : (
              <p>Não existem dados cadastrais disponíveis.</p>
            )}

            <h4>Interesses registrados</h4>

            {interestValue.length > 0 ? (
              interestValue.map((item) => (
                <div className="human-review-current-row" key={item.id}>
                  <span>{item.nome}</span>
                  <strong>{item.origem || 'Origem não informada'}</strong>
                </div>
              ))
            ) : (
              <p>Nenhum interesse registrado.</p>
            )}

            <h4>Outras informações</h4>

            <div className="human-review-current-row">
              <span>Afinidade</span>
              <strong>{formatValue(affinityState)}</strong>
            </div>

            {preferenceValue !== undefined && (
              <div className="human-review-current-row">
                <span>Preferência</span>
                <strong>{formatValue(preferenceValue)}</strong>
              </div>
            )}

            {interactionCount !== undefined && (
              <div className="human-review-current-row">
                <span>Interações registradas</span>
                <strong>{formatValue(interactionCount)}</strong>
              </div>
            )}
          </div>
        </section>

        {/* JUSTIFICATIVA DA DECISÃO */}
        <section className="human-review-section">
          <h3>Justificativa da revisão</h3>

          <textarea
            className="human-review-justification"
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Explique as decisões tomadas durante a revisão..."
          />
        </section>

        {/* AÇÕES */}
        <div className="human-review-actions">
          <button
            type="button"
            className="human-review-cancel"
            onClick={onClose}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="human-review-confirm"
            disabled={
              sourceFields.length > 0 &&
              sourceFields.some((field) => !decisions[field.label])
            }
            onClick={() => onConfirm(decisions, justification)}
          >
            Concluir revisão
          </button>
        </div>
      </div>
    </div>
  );
}
