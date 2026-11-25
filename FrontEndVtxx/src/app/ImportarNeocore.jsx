import React, { useState, useMemo, useEffect } from 'react';
import ModalRevisao from './ModalRevisao';
import '../styles/importar.css';
import {
  baixarModeloCsv,
  parseCsvText,
  validarRegistros,
  enviarImportacaoApi
} from '../services/importacaoService';

export default function ImportarNeocore({ embedded = false, onShowToast }) {
  const [modalRevisaoAberto, setModalRevisaoAberto] = useState(false);
  const [origemSelecionada, setOrigemSelecionada] = useState('crm');
  const [isProcessando, setIsProcessando] = useState(false);
  const [toast, setToast] = useState('');
  const [buscaHistorico, setBuscaHistorico] = useState('');

  // Arquivo carregado e linhas analisadas
  const [arquivoCarregado, setArquivoCarregado] = useState(null);
  const [headersDetectados, setHeadersDetectados] = useState([]);
  const [linhasArquivo, setLinhasArquivo] = useState([]);

  // Histórico de importações
  const [historicoImportacoes, setHistoricoImportacoes] = useState(() => {
    try {
      const historicoSalvo = localStorage.getItem('neocore_historico_importacoes')

      return historicoSalvo ? JSON.parse(historicoSalvo) : []
    } catch (error) {
      console.error('Erro ao carregar historico:', error);
      return []
    }
  })

  // Switches das regras de validação
  const [switches, setSwitches] = useState({
    duplicados: true,
    linhasVazias: true,
    normalizar: true,
    sobrescrever: false,
  });

  // Mapeamento dinâmico de colunas
  const [mapeamento, setMapeamento] = useState({
    razao_social: 'razao_social',
    cnpj_cpf: 'cnpj',
    email_contato: 'email',
    setor: 'setor',
    cidade: 'cidade',
    uf: 'uf',
    telefone: 'telefone'
  });

  const showFeedback = (msg) => {
    setToast(msg);
    if (onShowToast) onShowToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  // Processa o arquivo selecionado ou arrastado
  const processFile = (file) => {
    if (!file) return;

    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const textContent = event.target?.result;
        const { headers, rows } = parseCsvText(textContent);

        if (rows.length === 0) {
          showFeedback('O arquivo enviado está vazio ou possui formato inválido.');
          return;
        }

        setHeadersDetectados(headers);
        setLinhasArquivo(rows);

        // Auto mapeia os nomes de colunas encontrados
        const autoMap = { ...mapeamento };
        headers.forEach(h => {
          const lower = h.toLowerCase();
          if (lower.includes('razao') || lower.includes('nome') || lower.includes('empresa')) autoMap.razao_social = h;
          if (lower.includes('cnpj') || lower.includes('cpf') || lower.includes('doc')) autoMap.cnpj_cpf = h;
          if (lower.includes('email') || lower.includes('mail')) autoMap.email_contato = h;
          if (lower.includes('setor') || lower.includes('segmento')) autoMap.setor = h;
          if (lower.includes('cidade') || lower.includes('city')) autoMap.cidade = h;
          if (lower.includes('uf') || lower.includes('estado')) autoMap.uf = h;
          if (lower.includes('tel') || lower.includes('fone') || lower.includes('phone')) autoMap.telefone = h;
        });
        setMapeamento(autoMap);

        setArquivoCarregado({
          nome: file.name,
          detalhes: `${rows.length} registros lidos · ${sizeMb} MB · arquivo validado`,
          sizeMb,
          totalLinhas: rows.length
        });

        showFeedback(`Arquivo "${file.name}" carregado com sucesso (${rows.length} registros)!`);
      } catch {
        showFeedback('Erro ao ler o arquivo. Certifique-se de que é um CSV válido.');
      }
    };

    reader.readAsText(file, 'UTF-8');
  };

  useEffect(() => {
    try {
      localStorage.setItem(
        'neocore_historico_importacoes',
        JSON.stringify(historicoImportacoes)
      );
    } catch (erro) {
      console.error('Erro ao salvar histórico:', erro);
    }
  }, [historicoImportacoes]);

  const handleFileUpload = (e) => processFile(e.target.files?.[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    processFile(e.dataTransfer.files?.[0]);
  };

  const toggleSwitch = (key) => {
    setSwitches((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Executa validações em tempo real conforme as regras e o mapeamento
  const validacao = useMemo(() => {
    if (linhasArquivo.length === 0) {
      return {
        total: 0,
        validos: [],
        comAlertas: [],
        duplicadosCount: 0,
        taxaAprovacao: 0
      };
    }

    return validarRegistros(linhasArquivo, mapeamento, switches);
  }, [linhasArquivo, mapeamento, switches]);

  // Função para executar a importação e envio à API

  const executarImportacao = async (alertasAprovados = []) => {

    if (!arquivoCarregado || linhasArquivo.length === 0) {
      showFeedback('Selecione um arquivo CSV antes de importar.');
      return;
    }

    const listaParaEnviar = [
      ...validacao.validos,
      ...alertasAprovados
    ]

    if (listaParaEnviar.length === 0) {
      showFeedback('Não existem registros válidos para importar.');
      return;
    }

    setIsProcessando(true);

    try {
      const resultado = await enviarImportacaoApi(listaParaEnviar);

      if (!resultado.sucesso) {
        showFeedback(
          `Não foi possível concluir a importação. ${resultado.totalImportado || 0} registros foram salvos.`
        );
        return;
      }

      const novoHistorico = {
        id: Date.now(),
        iniciais: arquivoCarregado.nome.slice(0, 2).toUpperCase(),
        nomeArquivo: arquivoCarregado.nome,
        detalhes: `${resultado.totalImportado} registros · ${origemSelecionada.toUpperCase()}`,
        status: 'Concluído',
        statusClasse: 'historico-ok'
      };

      setHistoricoImportacoes(prev => [novoHistorico, ...prev]);

      showFeedback(
        `${resultado.totalImportado} empresas importadas e salvas nos Contatos!`
      );

      setArquivoCarregado(null);
      setLinhasArquivo([]);
      setHeadersDetectados([]);
    } catch (erro) {
      console.error('Erro na importação:', erro);
      showFeedback('Ocorreu um erro ao salvar os contatos.');
    } finally {
      setIsProcessando(false);
      setModalRevisaoAberto(false);
    }
  };


  const historicoFiltrado = historicoImportacoes.filter(item =>
    (item.nomeArquivo || '').toLowerCase().includes(buscaHistorico.toLowerCase()) ||
    (item.detalhes || '').toLowerCase().includes(buscaHistorico.toLowerCase())
  );
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
              value={buscaHistorico}
              onChange={(e) => setBuscaHistorico(e.target.value)}
            />
          </label>

          <button
            className="importar-modelo"
            type="button"
            onClick={baixarModeloCsv}
            title="Baixar planilha modelo CSV recomendada"
          >
            Baixar modelo
          </button>

          <button
            className="importar-iniciar"
            type="button"
            disabled={isProcessando || !arquivoCarregado}
            onClick={() => {
              if (validacao.comAlertas.length > 0) {
                setModalRevisaoAberto(true);
              } else {
                executarImportacao();
              }
            }}
          >
            {isProcessando ? 'Processando...' : 'Iniciar importação'}
          </button>
        </div>
      </div>

      {/* Indicadores Dinâmicos */}
      <section className="importar-indicadores">
        <article className="indicador-card">
          <div className="indicador-topo">
            <span>Arquivos na fila</span>
            <div className="indicador-logo">
              <img src="/arquivo.svg" alt="Arquivo" />
            </div>
          </div>
          <strong>{arquivoCarregado ? '1' : '0'}</strong>
          <small>
            {arquivoCarregado ? 'Arquivo pronto para envio' : 'Nenhum arquivo carregado'}
          </small>
        </article>

        <article className="indicador-card">
          <div className="indicador-topo">
            <span>Registros lidos</span>
            <div className="indicador-logo">
              <img src="/banco.svg" alt="Banco" />
            </div>
          </div>
          <strong>{validacao.total.toLocaleString('pt-BR')}</strong>
          <small>{validacao.validos.length} prontos para salvar</small>
        </article>

        <article className="indicador-card">
          <div className="indicador-topo">
            <span>Alertas de validação</span>
            <div className="indicador-logo-alert">
              <img src="/alert.svg" alt="Alerta" />
            </div>
          </div>
          <strong>{validacao.comAlertas.length}</strong>
          <small>
            {validacao.comAlertas.length === 0
              ? 'Nenhum erro cadastral'
              : 'Revisão antes de salvar'}
          </small>
        </article>

        <article className="indicador-card">
          <div className="indicador-topo">
            <span>Taxa de aprovação</span>
            <div className="indicador-logo-check">
              <img src="/check.svg" alt="Check" />
            </div>
          </div>
          <strong>{validacao.taxaAprovacao}%</strong>
          <small>{validacao.validos.length} de {validacao.total} válidos</small>
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

              <div className={`fluxo-etapa ${arquivoCarregado ? 'concluida' : 'atual'}`}>
                <span>2</span>
                <small>Arquivo</small>
              </div>

              <div className={`fluxo-linha ${arquivoCarregado ? 'concluida' : ''}`} />

              <div className={`fluxo-etapa ${arquivoCarregado ? 'atual' : ''}`}>
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
                ERP Omie
              </button>

              <button
                className={`origem-botao ${origemSelecionada === 'planilha' ? 'selecionada' : ''}`}
                type="button"
                onClick={() => setOrigemSelecionada('planilha')}
              >
                <img src="/arquivo-gray.svg" alt="" />
                Planilha CSV
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

            {/* Zona de Upload Interativa */}
            <label
              className="zona-upload"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              style={{ cursor: 'pointer' }}
            >
              <input
                type="file"
                accept=".csv,.txt"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <div className="upload-icone">
                <img src="/upload.svg" alt="" />
              </div>
              <strong>Arraste o arquivo aqui</strong>
              <span>
                ou clique para selecionar do computador · formato CSV recomendado
              </span>
              <span className="upload-selecionar">Selecionar arquivo CSV</span>
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
                    setLinhasArquivo([]);
                    setHeadersDetectados([]);
                    showFeedback('Arquivo removido da seleção.');
                  }}
                  title="Remover arquivo"
                >
                  ×
                </span>
              </div>
            )}
          </section>

          {/* Mapeamento de Colunas */}
          <section className="painel-card painel-mapeamento">
            <div className="painel-titulo">
              <div>
                <h3>Mapeamento de colunas</h3>
                <p>
                  Associe cada coluna do arquivo aos campos do cadastro do NeoCore.
                </p>
              </div>

              <button
                className="link-acao"
                type="button"
                onClick={() => {
                  const autoMap = {
                    razao_social: headersDetectados.find(h => /razao|nome|empresa/i.test(h)) || 'razao_social',
                    cnpj_cpf: headersDetectados.find(h => /cnpj|cpf/i.test(h)) || 'cnpj',
                    email_contato: headersDetectados.find(h => /email|mail/i.test(h)) || 'email',
                    setor: headersDetectados.find(h => /setor|segmento/i.test(h)) || 'setor',
                    cidade: headersDetectados.find(h => /cidade/i.test(h)) || 'cidade',
                    uf: headersDetectados.find(h => /uf/i.test(h)) || 'uf',
                    telefone: headersDetectados.find(h => /tel|phone/i.test(h)) || 'telefone'
                  };
                  setMapeamento(autoMap);
                  showFeedback('Colunas mapeadas automaticamente com sucesso!');
                }}
              >
                Mapear automaticamente
              </button>
            </div>

            <div className="tabela-mapeamento">
              <div className="mapeamento-linha mapeamento-cabecalho">
                <span>Coluna do arquivo</span>
                <span>Campo NeoCore</span>
                <span>Status</span>
              </div>

              {/* Linha 1: Razão social */}
              <div className="mapeamento-linha">
                <strong>{mapeamento.razao_social || 'razao_social'}</strong>
                <select
                  value={mapeamento.razao_social}
                  onChange={(e) => setMapeamento({ ...mapeamento, razao_social: e.target.value })}
                >
                  <option value="razao_social">Razão social / Nome da Empresa</option>
                  {headersDetectados.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <span className="mapeamento-status status-mapeado">Mapeado</span>
              </div>

              {/* Linha 2: CNPJ */}
              <div className="mapeamento-linha">
                <strong>{mapeamento.cnpj_cpf || 'cnpj'}</strong>
                <select
                  value={mapeamento.cnpj_cpf}
                  onChange={(e) => setMapeamento({ ...mapeamento, cnpj_cpf: e.target.value })}
                >
                  <option value="cnpj">CNPJ da Empresa (14 dígitos)</option>
                  {headersDetectados.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <span className="mapeamento-status status-mapeado">Mapeado</span>
              </div>

              {/* Linha 3: E-mail */}
              <div className="mapeamento-linha">
                <strong>{mapeamento.email_contato || 'email'}</strong>
                <select
                  value={mapeamento.email_contato}
                  onChange={(e) => setMapeamento({ ...mapeamento, email_contato: e.target.value })}
                >
                  <option value="email">E-mail corporativo</option>
                  {headersDetectados.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <span className="mapeamento-status status-mapeado">Mapeado</span>
              </div>

              {/* Linha 4: Setor */}
              <div className="mapeamento-linha">
                <strong>{mapeamento.setor || 'setor'}</strong>
                <select
                  value={mapeamento.setor}
                  onChange={(e) => setMapeamento({ ...mapeamento, setor: e.target.value })}
                >
                  <option value="setor">Segmento / Setor de atuação</option>
                  {headersDetectados.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <span className="mapeamento-status status-mapeado">Mapeado</span>
              </div>

              {/* Linha 5: Cidade / UF */}
              <div className="mapeamento-linha">
                <strong>{mapeamento.cidade || 'cidade'} / {mapeamento.uf || 'uf'}</strong>
                <select
                  value={mapeamento.cidade}
                  onChange={(e) => setMapeamento({ ...mapeamento, cidade: e.target.value })}
                >
                  <option value="cidade">Localização (Cidade e Estado)</option>
                  {headersDetectados.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <span className="mapeamento-status status-parcial">Parcial</span>
              </div>
            </div>
          </section>

          {/* Histórico Recente Interativo */}
          <section className="painel-card painel-historico">
            <div className="painel-titulo">
              <div>
                <h3>Importações recentes</h3>
                <p>Acompanhe os arquivos e suas respectivas situações.</p>
              </div>

              <button
                className="link-acao"
                type="button"
                onClick={() => showFeedback(`Total de ${historicoImportacoes.length} importações no histórico`)}
              >
                Ver todas ({historicoImportacoes.length})
              </button>
            </div>

            <div className="historico-lista">

              {historicoFiltrado.length === 0 && (
                <p className="historico-vazio">
                  {buscaHistorico
                    ? 'Nenhuma importação encontrada para essa busca.'
                    : 'Nenhuma importação realizada até o momento.'}
                </p>
              )}

              {historicoFiltrado.map((item) => (
                <div key={item.id} className="historico-item">
                  <span className="historico-avatar">{item.iniciais}</span>
                  <div className="historico-info">
                    <strong>{item.nomeArquivo}</strong>
                    <small>{item.detalhes}</small>
                  </div>
                  <span className={`historico-status ${item.statusClasse}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Coluna Lateral */}
        <aside className="importar-coluna-lateral">
          <section className="painel-card painel-resumo">
            <h3>Resumo da importação</h3>
            <p className="resumo-arquivo">
              {arquivoCarregado ? arquivoCarregado.nome : 'Nenhum arquivo selecionado'}
            </p>

            <div className="resumo-linha">
              <span>Registros lidos</span>
              <strong>{validacao.total}</strong>
            </div>

            <div className="resumo-linha">
              <span>Registros válidos</span>
              <strong className="texto-verde">{validacao.validos.length}</strong>
            </div>

            <div className="resumo-linha">
              <span>Com alertas</span>
              <strong className="texto-amarelo">{validacao.comAlertas.length}</strong>
            </div>

            <div className="resumo-linha">
              <span>Possíveis duplicados</span>
              <strong>{validacao.duplicadosCount}</strong>
            </div>

            <div className="resumo-aviso">
              <strong>Próxima etapa</strong>
              <span>
                {validacao.comAlertas.length > 0
                  ? `Revise ${validacao.comAlertas.length} campos antes de salvar.`
                  : 'Todos os registros estão válidos para inclusão direta.'}
              </span>
            </div>

            <button
              className="botao-resumo-principal"
              type="button"
              disabled={isProcessando || !arquivoCarregado}
              onClick={() => {
                if (validacao.comAlertas.length > 0) {
                  setModalRevisaoAberto(true);
                } else {
                  executarImportacao();
                }
              }}
            >
              {isProcessando
                ? 'Importando...'
                : validacao.comAlertas.length > 0
                  ? 'Continuar para revisão'
                  : 'Salvar no sistema'}
            </button>

            <button
              className="botao-resumo-secundario"
              type="button"
              onClick={() => showFeedback('Rascunho de importação salvo com sucesso!')}
            >
              Salvar rascunho
            </button>
          </section>

          {/* Regras de Validação */}
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

          {/* Atalhos de Ajuda */}
          <section className="painel-card painel-ajuda">
            <h3>Modelos e ajuda</h3>
            <p>Atalhos para preparar a importação.</p>

            <div
              className="ajuda-item"
              style={{ cursor: 'pointer' }}
              onClick={baixarModeloCsv}
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
              onClick={() => showFeedback('Dica: Use colunas com razão social, CNPJ (14 dígitos), e-mail e setor.')}
            >
              <div className="ajuda-icone">
                <img src="/book.svg" alt="" />
              </div>
              <span>
                <strong>Guia de importação</strong>
                <small>Boas práticas e regras de CNPJ.</small>
              </span>
            </div>
          </section>
        </aside>
      </div>

      {/* Modal de Revisão Dinâmico */}
      {modalRevisaoAberto && (
        <ModalRevisao
          fecharModal={() => setModalRevisaoAberto(false)}
          itemsParaRevisao={validacao.comAlertas}
          totalItens={linhasArquivo.length > 0 ? validacao.total : 1284}
          onApprove={(item) => showFeedback(`Sugestão aprovada para "${item.nome}"!`)}
          onReject={(item) => showFeedback(`Sugestão rejeitada para "${item.nome}".`)}
          onConcluirRevisao={(aprovados) => executarImportacao(aprovados)}
        />
      )}
    </main>
  );
}
