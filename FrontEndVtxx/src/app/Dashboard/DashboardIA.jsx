import React, { useState, useEffect } from 'react';
import { iaService, OPERACOES_IA, REGIOES_IA } from '../../services/iaService';
import { governancaService } from '../../services/governancaService';
import api from '../../services/api';
import '../../styles/DashboardIA.css';

const OPERACAO_LABELS = {
  [OPERACOES_IA.RESUMIR]: 'RESUMIR',
  [OPERACOES_IA.PROPOR_CAMPANHA]: 'PROPOR CAMPANHA',
  [OPERACOES_IA.ANALISAR_TENDENCIAS]: 'ANALISAR TENDÊNCIAS',
};

const OPERACAO_PLACEHOLDERS = {
  [OPERACOES_IA.RESUMIR]: 'Ex: Resuma os pontos principais desta fonte ou dos dados informados...',
  [OPERACOES_IA.PROPOR_CAMPANHA]: 'Ex: Proponha uma campanha B2B para empresas de tecnologia focada em agendar demonstrações...',
  [OPERACOES_IA.ANALISAR_TENDENCIAS]: 'Ex: Quais sinais temáticos aparecem para o tema informado?',
};

function RenderRespostaEstruturada({ payload }) {
  const conteudo = payload?.conteudo;
  if (!conteudo) return null;

  const { resumo, campanha, tendencias, observacoes, limitacoes } = conteudo;
  const fontes = payload?.fontes || [];
  const avisos = payload?.avisos || [];

  return (
    <div className="ia-structured-response">
      {resumo && (
        <div className="ia-resumo-highlight">
          <h5>Resumo Consolidado</h5>
          <div>{resumo}</div>
        </div>
      )}

      {campanha && (
        <div className="ia-section-card ia-campanha-card">
          <h5>Campanha Proposta: {campanha.nome}</h5>
          <div className="ia-campanha-grid">
            <div><strong>Objetivo:</strong> {campanha.objetivo}</div>
            <div><strong>Público:</strong> {campanha.publico}</div>
            <div><strong>Mensagem principal:</strong> {campanha.mensagemPrincipal}</div>
            {campanha.canais?.length > 0 && (
              <div><strong>Canais:</strong> {campanha.canais.join(', ')}</div>
            )}
          </div>
          {campanha.textos?.length > 0 && (
            <div className="ia-sublist">
              <strong>Sugestões de texto:</strong>
              <ul>
                {campanha.textos.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}
          {campanha.kpis?.length > 0 && (
            <div className="ia-sublist">
              <strong>KPIs sugeridos:</strong>
              <ul>
                {campanha.kpis.map((k, i) => <li key={i}>{k}</li>)}
              </ul>
            </div>
          )}
          {campanha.hipoteses?.length > 0 && (
            <div className="ia-sublist">
              <strong>Hipóteses para validação:</strong>
              <ul>
                {campanha.hipoteses.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {tendencias?.length > 0 && (
        <div className="ia-section-card ia-tendencias-card">
          <h5>Tendências Identificadas ({tendencias.length})</h5>
          <div className="ia-tendencias-list">
            {tendencias.map((t, i) => (
              <div key={i} className="ia-tendencia-item">
                <div className="ia-tendencia-title">{t.titulo}</div>
                <p><strong>Evidência:</strong> {t.evidencia}</p>
                <p><strong>Aplicação B2B:</strong> {t.aplicacao}</p>
                {t.fontesIds?.length > 0 && (
                  <span className="ia-fontes-tags">Fontes: {t.fontesIds.join(', ')}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {observacoes?.length > 0 && (
        <div className="ia-meta-list">
          <strong>Observações:</strong>
          <ul>
            {observacoes.map((obs, i) => <li key={i}>{obs}</li>)}
          </ul>
        </div>
      )}

      {limitacoes?.length > 0 && (
        <div className="ia-meta-list">
          <strong>Limitações:</strong>
          <ul>
            {limitacoes.map((lim, i) => <li key={i}>{lim}</li>)}
          </ul>
        </div>
      )}

      {fontes.length > 0 && (
        <div className="ia-meta-list">
          <strong>Fontes ({fontes.length}):</strong>
          <ul>
            {fontes.map((f) => (
              <li key={f.id}>
                <span className="ia-fonte-id">[{f.id}]</span>{' '}
                {f.url ? (
                  <a href={f.url} target="_blank" rel="noopener noreferrer">{f.titulo || f.url}</a>
                ) : (
                  f.titulo
                )}{' '}
                <span className="ia-fonte-origem">({f.origem})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(payload?.recorte || avisos.length > 0) && (
        <details className="ia-avisos-details">
          <summary>Recorte e avisos de conformidade ({avisos.length})</summary>
          {payload?.recorte && <p className="ia-recorte-text"><strong>Recorte:</strong> {payload.recorte}</p>}
          {avisos.length > 0 && (
            <ul>
              {avisos.map((aviso, i) => <li key={i}>{aviso}</li>)}
            </ul>
          )}
        </details>
      )}
    </div>
  );
}

export default function DashboardIA({ onShowToast, isModal = false, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [operacao, setOperacao] = useState(OPERACOES_IA.RESUMIR);
  const [usarExemploFicticio, setUsarExemploFicticio] = useState(false);

  // Modo de contexto para RESUMIR real: 'referencia' ou 'dados'
  const [modoResumo, setModoResumo] = useState('referencia');
  const [salvarResumoPublico, setSalvarResumoPublico] = useState(true);
  const [referencia, setReferencia] = useState({ titulo: '', url: '', publicadoEm: '', trechoPublico: '' });
  const [dadosPublicos, setDadosPublicos] = useState('');
  const [finalidadeId, setFinalidadeId] = useState('');
  const [finalidades, setFinalidades] = useState([]);

  // Campos de ANALISAR_TENDENCIAS
  const [tema, setTema] = useState('');
  const [regiao, setRegiao] = useState('BR');
  const [dias, setDias] = useState(30);

  const [isLoading, setIsLoading] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  const isLocalBackend = api.BASE_URL.includes('localhost') || api.BASE_URL.includes('127.0.0.1');
  const hojeIso = new Date().toISOString().split('T')[0];

  const usaReferencia = operacao === OPERACOES_IA.RESUMIR && !usarExemploFicticio && modoResumo === 'referencia';
  const usaDadosSistema = operacao === OPERACOES_IA.RESUMIR && !usarExemploFicticio && modoResumo === 'dados';
  const usaTendencias = operacao === OPERACOES_IA.ANALISAR_TENDENCIAS;

  const atualizarReferencia = (event) => {
    const { name, value } = event.target;
    setReferencia((prev) => ({ ...prev, [name]: value }));
  };

  const carregarHistorico = async () => {
    setLoadingHistorico(true);
    try {
      const data = await iaService.obterHistorico();
      setHistorico(data || []);
    } catch {
      // Ignora erro
    } finally {
      setLoadingHistorico(false);
    }
  };

  useEffect(() => {
    carregarHistorico();
    governancaService.getFinalidades().then((lista) => {
      if (Array.isArray(lista)) {
        setFinalidades(lista.filter((f) => f.ativo !== false));
      }
    });
  }, []);

  const handleChangeOperacao = (novaOp) => {
    setOperacao(novaOp);
    if (novaOp !== OPERACOES_IA.RESUMIR) {
      setUsarExemploFicticio(false);
    }
  };

  const handleSendMessage = async (customParams = null) => {
    if (isLoading) return;

    const params = customParams || {
      operacao,
      pergunta: inputText.trim(),
      usarExemploFicticio: operacao === OPERACOES_IA.RESUMIR && usarExemploFicticio,
    };

    if (!params.pergunta) return;

    if (!customParams) {
      if (usaReferencia) {
        params.referencias = [{
          titulo: referencia.titulo.trim(),
          url: referencia.url.trim(),
          publicadoEm: `${referencia.publicadoEm}T00:00:00Z`,
          trechoPublico: referencia.trechoPublico.trim(),
        }];
        params.salvarResumoPublico = salvarResumoPublico;
      } else if (usaDadosSistema) {
        params.dadosPublicos = dadosPublicos.trim();
        params.finalidadeId = finalidadeId;
      } else if (usaTendencias) {
        params.tema = tema.trim();
        params.regiao = regiao;
        params.dias = Number(dias) || 30;
      }
    }

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: params.pergunta,
      operacao: params.operacao,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customParams) setInputText('');
    setIsLoading(true);

    try {
      const resp = await iaService.enviarMensagem(params);

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        payload: resp,
        text: resp?.conteudo?.resumo || JSON.stringify(resp, null, 2),
        operacao: resp?.operacao || params.operacao,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      if (onShowToast) onShowToast('Resposta recebida da IA!');

      await carregarHistorico();
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 2,
        sender: 'assistant',
        text: `Erro na comunicação com a IA: ${err?.message || 'Falha na requisição.'}`,
        isError: true,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
      if (onShowToast) onShowToast('Erro ao consultar IA: ' + (err?.message || 'Falha de conexão.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunExemploFicticio = () => {
    handleSendMessage({
      operacao: OPERACOES_IA.RESUMIR,
      pergunta: 'Executar o exemplo fictício de resumo.',
      usarExemploFicticio: true,
    });
  };

  const handleOpenHistoricoItem = (item) => {
    if (!item?.resposta) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'assistant',
        payload: item.resposta,
        text: item.resposta?.conteudo?.resumo || '',
        operacao: item.operacao || item.resposta?.operacao,
        timestamp: item.criadoEm
          ? new Date(item.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          : 'Histórico',
      },
    ]);
  };

  return (
    <main className={`ia-container ${isModal ? 'is-modal' : ''}`}>
      {/* Header */}
      <div className="ia-header">
        <div className="ia-title-group">
          <div className="ia-title-row">
            <h1 className="ia-title">Inteligência Artificial</h1>
            <span className="ia-badge-cloud">
              {isLocalBackend ? 'Local · localhost:8080' : 'Nuvem · Render'}
            </span>
          </div>
          <p className="ia-subtitle">
            Assistente de marketing B2B integrado ao motor Gemini do backend NeoCore.
          </p>
        </div>

        <div className="ia-header-actions">
          <button
            type="button"
            className="ia-btn-ficticio"
            onClick={handleRunExemploFicticio}
            disabled={isLoading}
            title="Executar teste rápido com dados fictícios fixos do servidor"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            {isLoading ? 'Processando...' : 'Executar Exemplo Fictício (Resumo)'}
          </button>

          {isModal && onClose && (
            <button
              type="button"
              className="ia-modal-close-btn"
              onClick={onClose}
              title="Fechar Inteligência Artificial (ESC)"
              aria-label="Fechar"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Grid Principal */}
      <div className="ia-grid">
        {/* Coluna Esquerda: Chat / Prompt */}
        <section className="ia-card">
          <div className="ia-card-header">
            <div>
              <h3 className="ia-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
                </svg>
                Chat & Processamento
              </h3>
              <p className="ia-card-sub">Envie solicitações estruturadas para o motor de IA.</p>
            </div>
            <button
              type="button"
              className="ia-btn-send"
              style={{ background: '#f1f5f9', color: '#475569', padding: '6px 12px', fontSize: '11.5px' }}
              onClick={() => setMessages([])}
            >
              Limpar chat
            </button>
          </div>

          {/* Mensagens */}
          <div className="ia-messages-box">
            {messages.length === 0 ? (
              <div className="ia-empty-state">
                <div className="ia-empty-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <strong>Nenhuma interação ainda</strong>
                <p style={{ margin: '6px 0 14px', fontSize: '12.5px' }}>
                  Clique no botão roxo acima para testar o <strong>exemplo fictício de resumo</strong> ou escolha uma operação abaixo.
                </p>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`ia-msg-row ${m.sender}`}>
                  <div className="ia-msg-meta">
                    <span>{m.sender === 'user' ? 'Você' : 'Assistente NeoCore'}</span>
                    <span>·</span>
                    <span>{m.timestamp}</span>
                    {m.operacao && (
                      <span className="ia-badge-cloud" style={{ fontSize: '9.5px', padding: '1px 6px' }}>
                        {OPERACAO_LABELS[m.operacao] || m.operacao}
                      </span>
                    )}
                  </div>
                  <div className={`ia-msg-bubble ${m.sender} ${m.isError ? 'is-error' : ''}`}>
                    {m.payload?.conteudo ? (
                      <RenderRespostaEstruturada payload={m.payload} />
                    ) : (
                      m.text
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="ia-msg-row assistant">
                <div className="ia-msg-meta">
                  <span>Assistente NeoCore</span>
                  <span>·</span>
                  <span>processando...</span>
                </div>
                <div className="ia-msg-bubble assistant" style={{ fontStyle: 'italic', color: '#7c3aed' }}>
                  Aguardando resposta do servidor em {api.BASE_URL}...
                </div>
              </div>
            )}
          </div>

          {/* Barra de Envio */}
          <form
            className="ia-input-bar"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <div className="ia-controls-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Operação:</span>
                <select
                  className="ia-select-operacao"
                  value={operacao}
                  onChange={(e) => handleChangeOperacao(e.target.value)}
                  disabled={isLoading}
                >
                  <option value={OPERACOES_IA.RESUMIR}>RESUMIR</option>
                  <option value={OPERACOES_IA.PROPOR_CAMPANHA}>PROPOR CAMPANHA</option>
                  <option value={OPERACOES_IA.ANALISAR_TENDENCIAS}>ANALISAR TENDÊNCIAS</option>
                </select>

                {operacao === OPERACOES_IA.RESUMIR && !usarExemploFicticio && (
                  <select
                    className="ia-select-operacao"
                    value={modoResumo}
                    onChange={(e) => setModoResumo(e.target.value)}
                    disabled={isLoading}
                    aria-label="Origem dos dados para resumo"
                  >
                    <option value="referencia">Via Fonte Pública (URL)</option>
                    <option value="dados">Via Dados + Finalidade LGPD</option>
                  </select>
                )}
              </div>

              {operacao === OPERACOES_IA.RESUMIR && (
                <label className="ia-checkbox-label">
                  <input
                    type="checkbox"
                    checked={usarExemploFicticio}
                    onChange={(e) => setUsarExemploFicticio(e.target.checked)}
                    disabled={isLoading}
                  />
                  usarExemploFicticio (homologação)
                </label>
              )}
            </div>

            {usaReferencia && (
              <fieldset className="ia-reference-fields" disabled={isLoading}>
                <legend>Fonte pública</legend>
                <label>
                  Título
                  <input
                    className="ia-input-text"
                    name="titulo"
                    value={referencia.titulo}
                    onChange={atualizarReferencia}
                    maxLength={250}
                    required
                  />
                </label>
                <label>
                  URL (HTTPS)
                  <input
                    className="ia-input-text"
                    type="url"
                    name="url"
                    placeholder="https://"
                    pattern="https://.+"
                    value={referencia.url}
                    onChange={atualizarReferencia}
                    maxLength={800}
                    required
                  />
                </label>
                <label>
                  Data de publicação
                  <input
                    className="ia-input-text"
                    type="date"
                    name="publicadoEm"
                    max={hojeIso}
                    value={referencia.publicadoEm}
                    onChange={atualizarReferencia}
                    required
                  />
                </label>
                <label className="ia-reference-excerpt">
                  Trecho público da fonte
                  <textarea
                    className="ia-input-text"
                    name="trechoPublico"
                    value={referencia.trechoPublico}
                    onChange={atualizarReferencia}
                    maxLength={1000}
                    rows={2}
                    required
                  />
                </label>
                <label className="ia-checkbox-label ia-reference-excerpt" style={{ display: 'flex' }}>
                  <input
                    type="checkbox"
                    checked={salvarResumoPublico}
                    onChange={(e) => setSalvarResumoPublico(e.target.checked)}
                  />
                  Salvar resumo público no histórico da conta (retenção de 7 dias)
                </label>
              </fieldset>
            )}

            {usaDadosSistema && (
              <fieldset className="ia-reference-fields" disabled={isLoading}>
                <legend>Dados agregados & Finalidade LGPD</legend>
                <label className="ia-reference-excerpt">
                  Finalidade de tratamento
                  <select
                    className="ia-select-operacao"
                    value={finalidadeId}
                    onChange={(e) => setFinalidadeId(e.target.value)}
                    required
                  >
                    <option value="">Selecione uma finalidade...</option>
                    {finalidades.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nome} ({f.retencaoDias} dias)
                      </option>
                    ))}
                  </select>
                </label>
                <label className="ia-reference-excerpt">
                  Dados públicos / agregados (sem e-mails, telefones ou links)
                  <textarea
                    className="ia-input-text"
                    value={dadosPublicos}
                    onChange={(e) => setDadosPublicos(e.target.value)}
                    maxLength={6000}
                    rows={3}
                    placeholder="Ex: Campanha Q1 alcançou 250 empresas de software, 60 solicitaram demo..."
                    required
                  />
                </label>
              </fieldset>
            )}

            {usaTendencias && (
              <fieldset className="ia-reference-fields" disabled={isLoading}>
                <legend>Parâmetros de Tendências (YouTube API)</legend>
                <label>
                  Tema
                  <input
                    className="ia-input-text"
                    value={tema}
                    onChange={(e) => setTema(e.target.value)}
                    maxLength={100}
                    placeholder="Ex: automação B2B"
                    required
                  />
                </label>
                <label>
                  Região
                  <select
                    className="ia-select-operacao"
                    value={regiao}
                    onChange={(e) => setRegiao(e.target.value)}
                  >
                    {REGIOES_IA.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Período (dias)
                  <input
                    className="ia-input-text"
                    type="number"
                    min={1}
                    max={90}
                    value={dias}
                    onChange={(e) => setDias(e.target.value)}
                    required
                  />
                </label>
              </fieldset>
            )}

            <div className="ia-form-row">
              <input
                type="text"
                className="ia-input-text"
                placeholder={OPERACAO_PLACEHOLDERS[operacao] || 'Digite sua pergunta ou instrução...'}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                maxLength={1000}
                disabled={isLoading}
              />
              <button
                type="submit"
                className="ia-btn-send"
                disabled={isLoading || !inputText.trim()}
              >
                Enviar
              </button>
            </div>
          </form>
        </section>

        {/* Coluna Direita: Histórico Oficial da Conta */}
        <section className="ia-card">
          <div className="ia-card-header">
            <div>
              <h3 className="ia-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Histórico da Conta
              </h3>
              <p className="ia-card-sub">Registros salvos de GET /ia/historico.</p>
            </div>
            <button
              type="button"
              className="ia-btn-send"
              style={{ background: '#f1f5f9', color: '#0284c7', padding: '6px 12px', fontSize: '11.5px' }}
              onClick={carregarHistorico}
              disabled={loadingHistorico}
            >
              {loadingHistorico ? 'Atualizando...' : 'Recarregar'}
            </button>
          </div>

          <div className="ia-hist-list">
            {historico.length === 0 ? (
              <div className="ia-empty-state">
                <p style={{ fontSize: '12.5px', color: '#94a3b8' }}>
                  {loadingHistorico ? 'Carregando histórico...' : 'Nenhum histórico registrado nesta conta ainda.'}
                </p>
              </div>
            ) : (
              historico.map((item, idx) => {
                const resumo =
                  item?.resposta?.conteudo?.resumo ||
                  item?.conteudo?.resumo ||
                  'Operação concluída com sucesso.';

                const dataFormatada = item?.criadoEm
                  ? new Date(item.criadoEm).toLocaleString('pt-BR')
                  : 'Recente';

                return (
                  <div
                    key={item.id || idx}
                    className="ia-hist-card"
                    onClick={() => handleOpenHistoricoItem(item)}
                    title="Clique para visualizar esta análise no chat"
                  >
                    <div className="ia-hist-top">
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span className={`ia-hist-tag ${item.operacao === 'RESUMIR' ? 'resumo' : ''}`}>
                          {OPERACAO_LABELS[item.operacao] || item.operacao || 'OPERAÇÃO'}
                        </span>
                        {item.ficticio && (
                          <span className="ia-hist-tag">Fictício</span>
                        )}
                      </div>
                      <span className="ia-hist-date">{dataFormatada}</span>
                    </div>
                    {item?.resposta?.recorte && (
                      <p className="ia-hist-pergunta">{item.resposta.recorte}</p>
                    )}
                    <p className="ia-hist-resposta">{resumo}</p>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
