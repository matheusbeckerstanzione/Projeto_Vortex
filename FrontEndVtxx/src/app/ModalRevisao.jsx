
import React, { useState } from 'react';
import '../styles/modalRevisao.css';

export default function ModalRevisao({
  fecharModal,
  onApprove,
  onReject,
  itemsParaRevisao = [],
  totalItens = 0,
  onConcluirRevisao
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [itensAprovados, setItensAprovados] = useState([]);

  const totalSteps = itemsParaRevisao.length;

  if (totalSteps === 0) return null;

  const itemOriginal = itemsParaRevisao[currentStep];

  const currentItem = {
    nome: itemOriginal.nome || 'Empresa sem nome',
    iniciais: (itemOriginal.nome || 'NC').slice(0, 2).toUpperCase(),
    campoDuvida: itemOriginal.alertas?.join(', ') || 'Validação cadastral pendente',
    valorAtual: itemOriginal.cnpj || itemOriginal.email || 'Não informado',
    sugestao: itemOriginal.setor || 'Não informado',
    confianca: 'Necessita revisão',
    motivo: itemOriginal.alertas?.join(', ') || 'Necessita confirmação humana'
  };

  const handleAction = (type) => {
    let aprovadosAtualizados = [...itensAprovados];

    if (type === 'approve') {
      aprovadosAtualizados.push(itemOriginal);

      setItensAprovados(aprovadosAtualizados);

      if (onApprove) {
        onApprove(itemOriginal);
      }
    }

    if (type === 'reject' && onReject) {
      onReject(itemOriginal);
    }

    // Avança para o próximo registro
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
      return;
    }

    // Último registro: envia somente os aprovados
    if (onConcluirRevisao) {
      onConcluirRevisao(aprovadosAtualizados);
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
            <strong>
              {totalSteps} de {totalItens} cadastros precisam de revisão
            </strong>
            <p>
              Os outros {Math.max(0, totalItens - totalSteps)} registros
              passaram pela validação automática.
            </p>
          </div>
        </div>

        <div className="revisao-progresso">
          <div className="revisao-progresso-texto">
            <strong>Revisão {currentStep + 1} de {totalSteps}</strong>
            <span>{totalSteps - currentStep - 1} restantes</span>
          </div>

          <div className="revisao-barra">
            <div
              className="revisao-barra-preenchida"
              style={{
                width: `${((currentStep + 1) / totalSteps) * 100}%`
              }}
            />
          </div>
        </div>

        <article className="revisao-contato">
          <div className="revisao-contato-topo">
            <div className="revisao-empresa">
              <div className="revisao-empresa-avatar">
                {currentItem.iniciais}
              </div>

              <div>
                <h3>{currentItem.nome}</h3>
                <span>Campo em dúvida: {currentItem.campoDuvida}</span>
              </div>
            </div>

            <span className="revisao-confianca">
              {currentItem.confianca}
            </span>
          </div>

          <div className="revisao-comparacao">
            <div className="revisao-campo atual">
              <span>Valor atual</span>
              <strong>{currentItem.valorAtual}</strong>
            </div>

            <div className="revisao-campo sugestao">
              <span>Informação complementar</span>
              <strong>{currentItem.sugestao}</strong>
            </div>
          </div>

          <div className="revisao-detalhes">
            <div>
              <span>Fonte</span>
              <span>Motivo da dúvida</span>
              <span>Origem do dado</span>
            </div>

            <div className="revisao-detalhes-valores">
              <strong>Arquivo importado</strong>
              <strong>{currentItem.motivo}</strong>
              <strong>Arquivo CSV</strong>
            </div>
          </div>
        </article>

        <div className="revisao-privacidade">
          <span>✓</span>
          <p>
            Nenhum registro com alerta será salvo sem sua aprovação.
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
