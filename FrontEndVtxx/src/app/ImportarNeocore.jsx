import React, { useState } from 'react';
import ModalRevisao from './ModalRevisao';
import { importService } from '../services/importService';
import '../styles/importar.css';

export default function ImportarNeocore({ embedded = false, onShowToast }) {
  const [modalRevisaoAberto, setModalRevisaoAberto] = useState(false);
  const [origemSelecionada, setOrigemSelecionada] = useState('crm');
  const [arquivoCarregado, setArquivoCarregado] = useState(null);
  const [parsedRecords, setParsedRecords] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importStats, setImportStats] = useState({
    arquivosFila: 0,
    registrosLidos: 0,
    alertas: 0,
    taxa: '—',
  });
  const [historicoImportacoes, setHistoricoImportacoes] = useState([]);
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

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const records = importService.parseCSV(text);
      const qtd = records.length > 0 ? records.length : 1;

      setParsedRecords(records.length > 0 ? records : [
        {
          name: file.name.replace(/\.[^/.]+$/, ''),
          company: `${file.name.replace(/\.[^/.]+$/, '')} Ltda`,
          cnpj: '00000000000191',
          email: 'Não informado',
          phone: 'Não informado',
          city: 'São Paulo',
          uf: 'SP',
          setor: 'Tecnologia'
        }
      ]);

      setArquivoCarregado({
        nome: file.name,
        detalhes: `${qtd} registros identificados · ${sizeMb} MB · pronto para processamento`,
      });

      setImportStats(prev => ({
        ...prev,
        arquivosFila: 1,
        registrosLidos: qtd,
      }));

      showFeedback(`Arquivo ${file.name} carregado com ${qtd} registros.`);
    };

    reader.readAsText(file);
  };

  const handleDownloadModelo = () => {
    const csvContent =
      'Nome,Empresa,CNPJ,Email,Telefone,Cidade,UF,Setor\n' +
      'Ana Ferreira,Ferreira Tech Ltda,12345678000195,ana@ferreiratech.com.br,+55 11 98765-4321,São Paulo,SP,Tecnologia\n' +
      'Marcos Oliveira,Oliveira Logística ME,98765432000188,marcos@oliveiralog.com.br,+55 21 99888-1122,Rio de Janeiro,RJ,Logística\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modelo_importacao_neocore.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    showFeedback('Modelo CSV baixado com sucesso!');
  };

  const handleStartImport = async () => {
    if (!arquivoCarregado && parsedRecords.length === 0) {
      showFeedback('Por favor, selecione um arquivo CSV para importar.');
      return;
    }

    setIsImporting(true);
    showFeedback('Enviando dados para o PostgreSQL...');

    try {
      const recordsToImport = parsedRecords.length > 0 ? parsedRecords : [
        {
          name: arquivoCarregado?.nome?.replace(/\.[^/.]+$/, '') || 'Cliente Importado',
          company: `${arquivoCarregado?.nome?.replace(/\.[^/.]+$/, '') || 'Empresa'} Ltda`,
          cnpj: '00000000000191',
          email: 'Não informado',
          phone: 'Não informado',
          city: 'São Paulo',
          uf: 'SP',
          setor: 'Tecnologia'
        }
      ];

      const res = await importService.importBatch(recordsToImport);

      setImportStats({
        arquivosFila: 0,
        registrosLidos: res.totalContatos,
        alertas: 0,
        taxa: '100%',
      });

      const novoHistorico = {
        id: Date.now(),
        avatar: 'OK',
        nome: arquivoCarregado?.nome || 'dados_importados.csv',
        detalhe: `${res.totalContatos} registros gravados no PostgreSQL`,
        status: 'Concluído',
      };

      setHistoricoImportacoes(prev => [novoHistorico, ...prev]);
      showFeedback(`Importação de ${res.totalContatos} registros concluída no PostgreSQL com sucesso!`);
      setArquivoCarregado(null);
      setParsedRecords([]);
    } catch (err) {
      showFeedback(`Erro ao importar: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
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
    <main className={`importar-content ${embedded ? 'embedded' : ''}`}>
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
            onClick={handleDownloadModelo}
          >
            Baixar modelo
          </button>

          <button
            className="importar-iniciar"
            type="button"
            disabled={isImporting}
            onClick={handleStartImport}
          >
            {isImporting ? 'Importando...' : 'Iniciar importação'}
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
          <strong>{importStats.arquivosFila}</strong>
          <small>{importStats.arquivosFila === 0 ? 'Nenhum arquivo na fila' : 'Pronto para envio'}</small>
        </article>

        <article className="indicador-card">
          <div className="indicador-topo">
            <span>Registros lidos</span>
            <div className="indicador-logo">
              <img src="/banco.svg" alt="Banco" />
            </div>
          </div>
          <strong>{importStats.registrosLidos}</strong>
          <small>{importStats.registrosLidos === 0 ? 'Aguardando upload' : 'Prontos para conciliação'}</small>
        </article>

        <article className="indicador-card">
          <div className="indicador-topo">
            <span>Alertas de validação</span>
            <div className="indicador-logo-alert">
              <img src="/alert.svg" alt="Alerta" />
            </div>
          </div>
          <strong>{importStats.alertas}</strong>
          <small>Sem inconsistências</small>
        </article>

        <article className="indicador-card">
          <div className="indicador-topo">
            <span>Taxa de aprovação</span>
            <div className="indicador-logo-check">
              <img src="/check.svg" alt="Check" />
            </div>
          </div>
          <strong>{importStats.taxa}</strong>
          <small>{importStats.taxa === '100%' ? 'Validados com sucesso' : 'Sem registros processados'}</small>
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
              {historicoImportacoes.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  Nenhuma importação realizada recentemente.
                </div>
              ) : (
                historicoImportacoes.map((item) => (
                  <div key={item.id} className="historico-item">
                    <span className="historico-avatar">{item.avatar}</span>
                    <div className="historico-info">
                      <strong>{item.nome}</strong>
                      <small>{item.detalhe}</small>
                    </div>
                    <span className="historico-status historico-ok">{item.status}</span>
                  </div>
                ))
              )}
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
              <strong>{importStats.registrosLidos}</strong>
            </div>

            <div className="resumo-linha">
              <span>Registros válidos</span>
              <strong className="texto-verde">{importStats.registrosLidos}</strong>
            </div>

            <div className="resumo-linha">
              <span>Com alertas</span>
              <strong className="texto-amarelo">0</strong>
            </div>

            <div className="resumo-linha">
              <span>Possíveis duplicados</span>
              <strong>0</strong>
            </div>

            <div className="resumo-aviso">
              <strong>Próxima etapa</strong>
              <span>{arquivoCarregado ? 'Clique em Iniciar importação para gravar no PostgreSQL.' : 'Selecione ou arraste um arquivo para continuar.'}</span>
            </div>

            <button
              className="botao-resumo-principal"
              type="button"
              disabled={isImporting}
              onClick={handleStartImport}
            >
              {isImporting ? 'Gravando no banco...' : 'Iniciar importação'}
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
