import React, { useState } from 'react';
import '../styles/modalRevisao.css';

export default function ModalRevisao({ fecharModal, onApprove, onReject, recordName = 'Registro em Revisão' }) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 1;

  const handleAction = (type) => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else {
      if (type === 'approve' && onApprove) onApprove();
      if (type === 'reject' && onReject) onReject();
      fecharModal();
    }
  };

  return (
    <div className="revisao-overlay" onClick={fecharModal}>
      <section
        className="revisao-modal"
        onClick={(evento) => evento.stopPropagation()}
      >
        <header className="revisao-header">
          <div className="revisao-avatar">🧐</div>

          <div className="revisao-titulo">
            <h2>Revisão humana</h2>
            <p>
              A IA completou os dados, mas alguns ficaram com baixa confiança.
              Confirme só o que está em dúvida.
            </p>
          </div>

          <button
            className="revisao-fechar"
            type="button"
            onClick={fecharModal}
            aria-label="Fechar modal"
          >
            ×
          </button>
        </header>

        <div className="revisao-alerta">
          <span className="revisao-alerta-icone">!</span>

          <div>
            <strong>Revisão de consistência cadastral</strong>
            <p>
              Validação de atributos e correspondência de campos antes da confirmação no banco de dados.
            </p>
          </div>
        </div>

        <div className="revisao-progresso">
          <div className="revisao-progresso-texto">
            <strong>Revisão {currentStep} de {totalSteps}</strong>
            <span>{totalSteps - currentStep} restantes</span>
          </div>

          <div className="revisao-barra">
            <div
              className="revisao-barra-preenchida"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <article className="revisao-contato">
          <div className="revisao-contato-topo">
            <div className="revisao-empresa">
              <div className="revisao-empresa-avatar">{recordName.slice(0, 2).toUpperCase()}</div>

              <div>
                <h3>{recordName}</h3>
                <span>Campo em validação: Atributo complementar</span>
              </div>
            </div>

            <span className="revisao-confianca">Confiança baixa · 62%</span>
          </div>

          <div className="revisao-comparacao">
            <div className="revisao-campo atual">
              <span>Valor atual</span>
              <strong>— (vazio)</strong>
            </div>

            <div className="revisao-campo sugestao">
              <span>Sugestão da IA</span>
              <strong>Segmento Corporativo B2B</strong>
            </div>
          </div>

          <div className="revisao-detalhes">
            <div>
              <span>Fonte</span>
              <span>Motivo da validação</span>
              <span>Origem do dado</span>
            </div>

            <div className="revisao-detalhes-valores">
              <strong>PostgreSQL NeoCore</strong>
              <strong>Correspondência cadastral validada</strong>
              <strong>Será registrada no log de auditoria</strong>
            </div>
          </div>
        </article>

        <div className="revisao-privacidade">
          <span>✓</span>
          <p>
            Os dados foram pseudonimizados antes de passar pela IA. Nada é salvo
            no cadastro sem a sua aprovação.
          </p>
        </div>

        <footer className="revisao-footer">
          <span className="revisao-footer-texto">
            Você decide o que entra no cadastro.
          </span>

          <div className="revisao-botoes">
            <button
              className="revisao-pular"
              type="button"
              onClick={() => handleAction('skip')}
            >
              Pular
            </button>

            <button
              className="revisao-rejeitar"
              type="button"
              onClick={() => handleAction('reject')}
            >
              Rejeitar
            </button>

            <button
              className="revisao-aprovar"
              type="button"
              onClick={() => handleAction('approve')}
            >
              Aprovar sugestão
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
