import React, { useState } from 'react';
import ModalRevisao from './ModalRevisao';
import '../styles/importar.css';

export default function ImportarNeocore({ embedded = false, onShowToast }) {
  const [modalRevisaoAberto, setModalRevisaoAberto] = useState(false);
  const [origemSelecionada, setOrigemSelecionada] = useState('crm');
  const [arquivoCarregado, setArquivoCarregado] = useState({
    nome: 'clientes_out2026.csv',
    detalhes: '1.284 registros · 2,4 MB · arquivo carregado',
  });
  const [switches, setSwitches] = useState({
    duplicados: true,
    linhasVazias: true,
    normalizar: true,
    sobrescrever: false,
  });
  const [toast, setToast] = useState('');

  const showFeedback = (msg) => {
    setToast(msg);
    if (onShowToast) onShowToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const processFile = (file) => {
    if (!file) return;
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setArquivoCarregado({
      nome: file.name,
      detalhes: `Arquivo selecionado · ${sizeMb} MB · pronto para processamento`,
    });
    showFeedback(`Arquivo ${file.name} carregado com sucesso!`);
  };

  const handleFileUpload = (e) => processFile(e.target.files?.[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    processFile(e.dataTransfer.files?.[0]);
  };

  const toggleSwitch = (key) => {
    setSwitches((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <main className="importar-content" style={embedded ? { padding: '16px 24px', width: '100%' } : {}}>
      {toast && (
        <div className="importar-toast">
          {toast}
        </div>
      )}

      <div className="box-div-title">
        <div className="importar-cabecalho">
          <h1>Importar</h1>
          <span>
            Traga cadastros de CRM, ERP ou planilhas para iniciar uma conciliação.
          </span>
        </div>

        <div className="importar-acoes">
          <label className="importar-busca">
            <span className="busca-icone">⌕</span>
            <input
              type="text"
              placeholder="Buscar arquivo ou origem"
              aria-label="Buscar arquivo ou origem"
            />
          </label>

          <button
            className="importar-modelo"
            type="button"
            onClick={() => showFeedback('Download do modelo CSV iniciado!')}
          >
            Baixar modelo
          </button>

          <button
            className="importar-iniciar"
            type="button"
            onClick={() => setModalRevisaoAberto(true)}
          >
            Iniciar importação
          </button>
        </div>
      </div>

      <section className="importar-indicadores">
        <article className="indicador-card">
          <div className="indicador-topo">
            <span>Arquivos na fila</span>
            <div className="indicador-logo">
              <img src="/arquivo.svg" alt="Arquivo" />
            </div>
          </div>
          <strong>3</strong>
          <small>1 aguardando processamento</small>
        </article>

        <article className="indicador-card">
          <div className="indicador-topo">
            <span>Registros lidos</span>
            <div className="indicador-logo">
              <img src="/banco.svg" alt="Banco" />
            </div>
          </div>
          <strong>4.812</strong>
          <small>+1.240 no último arquivo</small>
        </article>

        <article className="indicador-card">
          <div className="indicador-topo">
            <span>Alertas de validação</span>
            <div className="indicador-logo-alert">
              <img src="/alert.svg" alt="Alerta" />
            </div>
          </div>
          <strong>27</strong>
          <small>9 precisam de correção</small>
        </article>

        <article className="indicador-card">
          <div className="indicador-topo">
            <span>Taxa de aprovação</span>
            <div className="indicador-logo-check">
              <img src="/check.svg" alt="Check" />
            </div>
          </div>
          <strong>98%</strong>
          <small>1.257 de 1.284 registros válidos</small>
        </article>
      </section>

      <div className="importar-layout">
        <div className="importar-coluna-principal">
          <section className="painel-card painel-upload">
            <div className="painel-titulo">
              <div>
                <h3>Nova importação</h3>
                <p>Escolha a origem e envie o arquivo para validação.</p>
              </div>

              <span className="etapa-badge">Passo 2 de 4</span>
            </div>

            <div className="fluxo-etapas">
              <div className="fluxo-etapa concluida">
                <span>1</span>
                <small>Origem</small>
              </div>

              <div className="fluxo-linha concluida" />

              <div className="fluxo-etapa atual">
                <span>2</span>
                <small>Arquivo</small>
              </div>

              <div className="fluxo-linha" />

              <div className="fluxo-etapa">
                <span>3</span>
                <small>Mapeamento</small>
              </div>

              <div className="fluxo-linha" />

              <div className="fluxo-etapa">
                <span>4</span>
                <small>Revisão</small>
              </div>
            </div>

            <div className="origem-titulo">Origem dos dados</div>

            <div className="origem-opcoes">
              <button
                className={`origem-botao ${origemSelecionada === 'crm' ? 'selecionada' : ''}`}
                type="button"
                onClick={() => setOrigemSelecionada('crm')}
              >
                <img src="/nuvem.svg" alt="" />
                CRM Salesforce
              </button>

              <button
                className={`origem-botao ${origemSelecionada === 'erp' ? 'selecionada' : ''}`}
                type="button"
                onClick={() => setOrigemSelecionada('erp')}
              >
                <img src="/banco-gray.svg" alt="" />
                ERP
              </button>

              <button
                className={`origem-botao ${origemSelecionada === 'planilha' ? 'selecionada' : ''}`}
                type="button"
                onClick={() => setOrigemSelecionada('planilha')}
              >
                <img src="/arquivo-gray.svg" alt="" />
                Planilha
              </button>

              <button
                className={`origem-botao ${origemSelecionada === 'email' ? 'selecionada' : ''}`}
                type="button"
                onClick={() => setOrigemSelecionada('email')}
              >
                <img src="/email.svg" alt="" />
                E-mail
              </button>
            </div>

            <label
              className="zona-upload"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              style={{ cursor: 'pointer' }}
            >
              <input
                type="file"
                accept=".csv,.xlsx,.json"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <div className="upload-icone">
                <img src="/upload.svg" alt="" />
              </div>
              <strong>Arraste o arquivo aqui</strong>
              <span>
                ou selecione do computador · CSV, XLSX ou JSON, até 50 MB
              </span>
              <span className="upload-selecionar">Selecionar arquivo</span>
            </label>

            {arquivoCarregado && (
              <div className="arquivo-selecionado">
                <div className="arquivo-tipo">
                  <img src="/banco.svg" alt="" />
                </div>

                <div className="arquivo-info">
                  <strong>{arquivoCarregado.nome}</strong>
                  <small>{arquivoCarregado.detalhes}</small>
                </div>

                <span className="status-pronto">Pronto</span>

                <span
                  className="arquivo-remover"
                  onClick={() => {
                    setArquivoCarregado(null);
                    showFeedback('Arquivo removido da seleção.');
                  }}
                  title="Remover arquivo"
                >
                  ×
                </span>
              </div>
            )}
          </section>

          <section className="painel-card painel-mapeamento">
            <div className="painel-titulo">
              <div>
                <h3>Mapeamento de colunas</h3>
                <p>
                  Associe cada coluna do arquivo aos campos do cadastro da Neocore.
                </p>
              </div>

              <button
                className="link-acao"
                type="button"
                onClick={() => showFeedback('Campos mapeados automaticamente com sucesso!')}
              >
                Mapear automaticamente
              </button>
            </div>

            <div className="tabela-mapeamento">
              <div className="mapeamento-linha mapeamento-cabecalho">
                <span>Coluna do arquivo</span>
                <span>Campo Neocore</span>
                <span>Status</span>
              </div>

              <div className="mapeamento-linha">
                <strong>razao_social</strong>
                <select defaultValue="Razão social">
                  <option>Razão social</option>
                  <option>Nome fantasia</option>
                </select>
                <span className="mapeamento-status status-mapeado">Mapeado</span>
              </div>

              <div className="mapeamento-linha">
                <strong>cnpj_cpf</strong>
                <select defaultValue="CPF / CNPJ">
                  <option>CPF / CNPJ</option>
                  <option>Documento Estrangeiro</option>
                </select>
                <span className="mapeamento-status status-mapeado">Mapeado</span>
              </div>

              <div className="mapeamento-linha">
                <strong>email_contato</strong>
                <select defaultValue="E-mail">
                  <option>E-mail</option>
                  <option>E-mail Secundário</option>
                </select>
                <span className="mapeamento-status status-mapeado">Mapeado</span>
              </div>

              <div className="mapeamento-linha">
                <strong>endereco</strong>
                <select defaultValue="Endereço">
                  <option>Endereço</option>
                  <option>Logradouro</option>
                </select>
                <span className="mapeamento-status status-parcial">Parcial</span>
              </div>

              <div className="mapeamento-linha">
                <strong>limite</strong>
                <select defaultValue="Limite de crédito">
                  <option>Limite de crédito</option>
                  <option>Orçamento</option>
                </select>
                <span className="mapeamento-status status-parcial">Parcial</span>
              </div>

              <div className="mapeamento-linha">
                <strong>cod_cliente</strong>
                <select defaultValue="Selecionar campo">
                  <option>Selecionar campo</option>
                  <option>Código Externo</option>
                  <option>ID no CRM</option>
                </select>
                <span className="mapeamento-status status-erro">Não mapeado</span>
              </div>
            </div>
          </section>

          <section className="painel-card painel-historico">
            <div className="painel-titulo">
              <div>
                <h3>Importações recentes</h3>
                <p>Acompanhe os arquivos e suas respectivas situações.</p>
              </div>

              <button
                className="link-acao"
                type="button"
                onClick={() => showFeedback('Exibindo todo o histórico de importações')}
              >
                Ver todas
              </button>
            </div>

            <div className="historico-lista">
              <div className="historico-item">
                <span className="historico-avatar">CS</span>
                <div className="historico-info">
                  <strong>clientes_out2026.csv</strong>
                  <small>1.284 registros · CRM Salesforce</small>
                </div>
                <span className="historico-status historico-ok">Concluído</span>
              </div>

              <div className="historico-item">
                <span className="historico-avatar">EF</span>
                <div className="historico-info">
                  <strong>erp_financeiro.xlsx</strong>
                  <small>1.426 registros · ERP</small>
                </div>
                <span className="historico-status historico-analise">
                  Em análise
                </span>
              </div>

              <div className="historico-item">
                <span className="historico-avatar">LN</span>
                <div className="historico-info">
                  <strong>leads_novos.csv</strong>
                  <small>48 registros · Planilha</small>
                </div>
                <span className="historico-status historico-erro">Com erros</span>
              </div>
            </div>
          </section>
        </div>

        <aside className="importar-coluna-lateral">
          <section className="painel-card painel-resumo">
            <h3>Resumo da importação</h3>
            <p className="resumo-arquivo">
              {arquivoCarregado ? arquivoCarregado.nome : 'Nenhum arquivo ativo'}
            </p>

            <div className="resumo-linha">
              <span>Registros lidos</span>
              <strong>1.284</strong>
            </div>

            <div className="resumo-linha">
              <span>Registros válidos</span>
              <strong className="texto-verde">1.257</strong>
            </div>

            <div className="resumo-linha">
              <span>Com alertas</span>
              <strong className="texto-amarelo">27</strong>
            </div>

            <div className="resumo-linha">
              <span>Possíveis duplicados</span>
              <strong>18</strong>
            </div>

            <div className="resumo-aviso">
              <strong>Próxima etapa</strong>
              <span>Revise 3 campos antes de continuar.</span>
            </div>

            <button
              className="botao-resumo-principal"
              type="button"
              onClick={() => setModalRevisaoAberto(true)}
            >
              Continuar para revisão
            </button>

            <button
              className="botao-resumo-secundario"
              type="button"
              onClick={() => showFeedback('Rascunho de importação salvo!')}
            >
              Salvar rascunho
            </button>
          </section>

          <section className="painel-card painel-validacao">
            <h3>Regras de validação</h3>
            <p>Aplicadas durante a leitura do arquivo.</p>

            <div className="validacao-linha">
              <span>Detectar duplicados</span>
              <span
                className={`switch ${switches.duplicados ? 'ligado' : ''}`}
                onClick={() => toggleSwitch('duplicados')}
                role="button"
                tabIndex={0}
              />
            </div>

            <div className="validacao-linha">
              <span>Ignorar linhas vazias</span>
              <span
                className={`switch ${switches.linhasVazias ? 'ligado' : ''}`}
                onClick={() => toggleSwitch('linhasVazias')}
                role="button"
                tabIndex={0}
              />
            </div>

            <div className="validacao-linha">
              <span>Normalizar CPF/CNPJ</span>
              <span
                className={`switch ${switches.normalizar ? 'ligado' : ''}`}
                onClick={() => toggleSwitch('normalizar')}
                role="button"
                tabIndex={0}
              />
            </div>

            <div className="validacao-linha">
              <span>Sobrescrever existentes</span>
              <span
                className={`switch ${switches.sobrescrever ? 'ligado' : ''}`}
                onClick={() => toggleSwitch('sobrescrever')}
                role="button"
                tabIndex={0}
              />
            </div>
          </section>

          <section className="painel-card painel-ajuda">
            <h3>Modelos e ajuda</h3>
            <p>Atalhos para preparar a importação.</p>

            <div
              className="ajuda-item"
              style={{ cursor: 'pointer' }}
              onClick={() => showFeedback('Download do modelo CSV padrão iniciado!')}
            >
              <div className="ajuda-icone">
                <img src="/upload-baixo.svg" alt="" />
              </div>
              <span>
                <strong>Baixar modelo CSV</strong>
                <small>Use um modelo recomendado de colunas.</small>
              </span>
            </div>

            <div
              className="ajuda-item"
              style={{ cursor: 'pointer' }}
              onClick={() => showFeedback('Abrindo guia completo de importação NeoCore...')}
            >
              <div className="ajuda-icone">
                <img src="/book.svg" alt="" />
              </div>
              <span>
                <strong>Guia de importação</strong>
                <small>Boas práticas e dicas de formatação.</small>
              </span>
            </div>
          </section>
        </aside>
      </div>

      {modalRevisaoAberto && (
        <ModalRevisao
          fecharModal={() => setModalRevisaoAberto(false)}
          onApprove={() => showFeedback('Sugestões da IA aprovadas com sucesso!')}
          onReject={() => showFeedback('Sugestão rejeitada.')}
        />
      )}
    </main>
  );
}
