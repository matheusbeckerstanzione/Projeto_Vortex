import React, { useState } from 'react';
import '../styles/modalRevisao.css';

export default function ModalRevisao({
  fecharModal,
  onApprove,
  onReject,
  itemsParaRevisao = [],
  totalItens = 1284,
  onConcluirRevisao
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = itemsParaRevisao.length > 0 ? itemsParaRevisao.length : 3;

  const demoItems = [
    {
      nome: 'Brasil Comércio de Calçados',
      iniciais: 'BC',
      campoDuvida: 'CNPJ sem dígito verificador',
      valorAtual: '12345678000100',
      sugestao: '12.345.678/0001-90',
      confianca: '68% · Média',
      motivo: 'Formato divergente da base da Receita Federal'
    },
    {
      nome: 'Ateliê Moda & Estilo',
      iniciais: 'AM',
      campoDuvida: 'E-mail corporativo',
      valorAtual: 'atendimento@atelie.com',
      sugestao: 'contato@ateliemoda.com.br',
      confianca: '74% · Média',
      motivo: 'Domínio atualizado no DNS do CRM'
    },
    {
      nome: 'Logística Expressa Norte',
      iniciais: 'LN',
      campoDuvida: 'Segmento de atuação',
      valorAtual: '— (não informado)',
      sugestao: 'Transporte & Logística B2B',
      confianca: '81% · Média',
      motivo: 'Identificado via CNAE primário da empresa'
    }
  ];

  const currentItem = itemsParaRevisao.length > 0
    ? {
        nome: itemsParaRevisao[currentStep - 1]?.nome || 'Empresa em Revisão',
        iniciais: (itemsParaRevisao[currentStep - 1]?.nome || 'NC').slice(0, 2).toUpperCase(),
        campoDuvida: itemsParaRevisao[currentStep - 1]?.alertas?.[0] || 'Validação cadastral pendente',
        valorAtual: itemsParaRevisao[currentStep - 1]?.cnpj || itemsParaRevisao[currentStep - 1]?.email || '—',
        sugestao: itemsParaRevisao[currentStep - 1]?.setor || 'Cadastro Unificado Recomendado',
        confianca: '65% · Média',
        motivo: itemsParaRevisao[currentStep - 1]?.alertas?.[0] || 'Necessita confirmação humana'
      }
    : demoItems[(currentStep - 1) % demoItems.length];

  const handleAction = (type) => {
    if (type === 'approve' && onApprove) onApprove(currentItem);
    if (type === 'reject' && onReject) onReject(currentItem);

    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else {
      if (onConcluirRevisao) onConcluirRevisao();
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
            <strong>{totalSteps} de {totalItens} cadastros precisam de revisão</strong>
            <p>
              Os outros {Math.max(0, totalItens - totalSteps)} passaram da confiança mínima de 90% e foram
              aprovados automaticamente.
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
              <div className="revisao-empresa-avatar">{currentItem.iniciais}</div>

              <div>
                <h3>{currentItem.nome}</h3>
                <span>Campo em dúvida: {currentItem.campoDuvida}</span>
              </div>
            </div>

            <span className="revisao-confianca">{currentItem.confianca}</span>
          </div>

          <div className="revisao-comparacao">
            <div className="revisao-campo atual">
              <span>Valor atual</span>
              <strong>{currentItem.valorAtual}</strong>
            </div>

            <div className="revisao-campo sugestao">
              <span>Sugestão da IA</span>
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
              <strong>Registrado no log de auditoria</strong>
            </div>
          </div>
        </article>

        <div className="revisao-privacidade">
          <span>✓</span>
          <p>
            Os dados foram tratados e validados segundo as regras de conformidade. Nada é salvo
            no cadastro sem a sua validação.
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
