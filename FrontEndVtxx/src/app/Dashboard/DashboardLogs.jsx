import React, { useState, useEffect } from "react";
import api from "../../services/api.js";
import "../../styles/DashboardLogs.css";

const PAGE_SIZE = 10;
const FETCH_SIZE = 50;

export default function VortexLogs({ embedded = false, onNavigate, onShowToast }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLogId, setSelectedLogId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(0);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        async function loadLogs() {
            try {
                const eventsById = new Map();
                for (let index = 0; ; index++) {
                    const result = await api.request(
                        `/auditoria?pagina=${index}&tamanho=${FETCH_SIZE}`,
                        { signal: controller.signal },
                    );
                    const batch = Array.isArray(result) ? result : (result?.content ?? []);
                    const previousSize = eventsById.size;
                    batch.forEach(log => eventsById.set(log.id, log));
                    const totalPages = result?.totalPages ?? result?.page?.totalPages;
                    if (eventsById.size === previousSize || (totalPages != null
                        ? index + 1 >= totalPages
                        : result?.last ?? batch.length < FETCH_SIZE)) {
                        break;
                    }
                }
                if (!controller.signal.aborted) setLogs([...eventsById.values()]);
            } catch {
                if (!controller.signal.aborted) setLoadError(true);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }

        loadLogs();
        return () => controller.abort();
    }, []);

    const handleExportLogs = () => {
        if (logs.length === 0) {
            if (onShowToast) onShowToast("Não há logs para exportar.");
            return;
        }

        const headers = "DATA/HORA,EVENTO/ACAO,ID,RECURSO,RESPONSAVEL,RESULTADO\n";
        const rows = logs.map(l => {
            const dataHora = l.ocorridoEm ? new Date(l.ocorridoEm).toLocaleString('pt-BR') : '—';
            return `"${dataHora}","${l.acao || ''}","${l.id || ''}","${l.tipoRecurso || ''}","${l.usuarioNome || ''}","${l.resultado || ''}"`;
        }).join("\n");

        const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `logs_auditoria_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        if (onShowToast) onShowToast("Logs de auditoria exportados com sucesso!");
    };

    const filteredLogs = logs.filter(log => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return (
            (log.acao && log.acao.toLowerCase().includes(term)) ||
            (log.usuarioNome && log.usuarioNome.toLowerCase().includes(term)) ||
            (log.tipoRecurso && log.tipoRecurso.toLowerCase().includes(term))
        );
    });
    const firstIndex = page * PAGE_SIZE;
    const pageLogs = filteredLogs.slice(firstIndex, firstIndex + PAGE_SIZE);
    const pageCount = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
    const selectedLog = pageLogs.find(log => log.id === selectedLogId) ?? pageLogs[0];

    const mainContent = (
        <main className={`conteudo-logs ${embedded ? 'embedded-logs' : ''}`}>
            {/* Título da página */}
            <section className="audit-logs">
                <div className="audit-content">
                    <div className="audit-info">
                        <h1>Logs de auditoria</h1>
                        <p>
                            Acompanhe o registro automático das ações
                            em contatos e fichas de origem no banco PostgreSQL.
                        </p>
                    </div>

                    <button className="export-button" onClick={handleExportLogs} disabled={loading}>
                        Exportar logs
                    </button>
                </div>
            </section>

            {/* Registro automático de eventos */}
            <section className="card-registro">
                <div className="registro-topo">
                    <div className="registro-titulo">
                        <span className="registro-icone">♧</span>
                        <strong>Trilha de Auditoria e Conformidade</strong>
                        <span className="registro-status">
                            ● Ativa · PostgreSQL
                        </span>
                    </div>

                    <small>
                        Registros oficiais de operações do sistema
                    </small>
                </div>

                <div className="registro-tipos">
                    <div className="tipo-evento">
                        <h3>⟳ &nbsp; Sincronização de fonte</h3>
                        <p>
                            Ao finalizar uma sincronização, registra
                            a fonte e o resultado.
                        </p>
                    </div>

                    <div className="tipo-evento">
                        <h3>♧ &nbsp; Consulta e Alteração</h3>
                        <p>
                            Ao consultar ou editar cadastros, registra
                            o acesso e o responsável.
                        </p>
                    </div>

                    <div className="tipo-evento">
                        <h3>▤ &nbsp; Autenticação e MFA</h3>
                        <p>
                            Registra os acessos e confirmações
                            de autenticação do usuário.
                        </p>
                    </div>
                </div>

                <p className="registro-nota">
                    O log é gerado pelo backend após cada evento do sistema.
                </p>
            </section>

            {/* Histórico de eventos */}
            <section className="card-historico">
                <div className="historico-topo">
                    <h2>Histórico de eventos</h2>
                    <span>{loading ? 'Carregando...' : `${filteredLogs.length} eventos registrados`}</span>
                </div>

                <input
                    className="historico-busca"
                    type="text"
                    placeholder="⌕  Buscar por ação, responsável ou recurso"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(0);
                        setSelectedLogId(null);
                    }}
                />

                <div className="historico-tabela-container">
                    <table className="historico-tabela">
                        <thead>
                            <tr>
                                <th>DATA / HORA</th>
                                <th>EVENTO / AÇÃO</th>
                                <th>RECURSO</th>
                                <th>FONTE</th>
                                <th>RESPONSÁVEL</th>
                                <th>RESULTADO</th>
                                <th>DETALHES</th>
                            </tr>
                        </thead>

                        <tbody>
                            {pageLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: "center", padding: "36px", color: "#64748b" }}>
                                        {loading ? "Carregando registros..." : loadError
                                            ? "Não foi possível carregar o histórico de auditoria."
                                            : searchTerm.trim() ? "Nenhum evento encontrado para esta busca."
                                                : "Nenhum evento de auditoria registrado ainda."}
                                    </td>
                                </tr>
                            ) : (
                                pageLogs.map((log) => {
                                    const isSelected = selectedLog?.id === log.id;
                                    const dataFormatada = log.ocorridoEm ? new Date(log.ocorridoEm).toLocaleDateString('pt-BR') : 'Hoje';
                                    const horaFormatada = log.ocorridoEm ? new Date(log.ocorridoEm).toLocaleTimeString('pt-BR') : '';

                                    return (
                                        <tr
                                            key={log.id}
                                            className={isSelected ? "evento-selecionado" : ""}
                                            onClick={() => setSelectedLogId(log.id)}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <td>
                                                {dataFormatada}
                                                <small>{horaFormatada} · BRT</small>
                                            </td>
                                            <td>
                                                {log.acao || 'Operação'}
                                                <small>ID: {log.id}</small>
                                            </td>
                                            <td>
                                                {log.tipoRecurso || 'Geral'}
                                                <small>{log.recursoId ? String(log.recursoId).slice(0, 8) : '—'}</small>
                                            </td>
                                            <td>PostgreSQL NeoCore</td>
                                            <td>
                                                {log.usuarioNome || 'Sistema'}
                                                <small>Usuário</small>
                                            </td>
                                            <td>
                                                <span className={`etiqueta ${String(log.resultado).toLowerCase() === 'sucesso' ? 'registrada' : 'solicitada'}`}>
                                                    {log.resultado || 'Concluído'}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="detalhes-btn" onClick={(e) => { e.stopPropagation(); setSelectedLogId(log.id); }}>
                                                    {isSelected ? "Em exibição" : "Detalhes →"}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="historico-rodape">
                    <span>
                        {filteredLogs.length === 0 ? "0 eventos" : `${firstIndex + 1}–${firstIndex + pageLogs.length} de ${filteredLogs.length} eventos`}
                    </span>

                    <div className="historico-paginacao">
                        <button type="button" aria-label="Página anterior" disabled={page === 0} onClick={() => setPage(page - 1)}>‹</button>
                        <strong aria-live="polite">{page + 1} / {pageCount}</strong>
                        <button type="button" aria-label="Próxima página" disabled={page + 1 >= pageCount} onClick={() => setPage(page + 1)}>›</button>
                    </div>
                </div>
            </section>

            {/* Detalhes do evento */}
            {selectedLog && (
                <section className="card-detalhes">
                    <div className="detalhes-topo">
                        <div className="detalhes-titulo">
                            <h2>Detalhes do evento</h2>
                            <span>ID #{selectedLog.id}</span>
                        </div>

                        <span className="detalhes-status">
                            {selectedLog.resultado || 'Concluído'}
                        </span>
                    </div>

                    <div className="detalhes-informacoes">
                        <div className="detalhe-coluna">
                            <span>Ação e Recurso</span>
                            <strong>{selectedLog.acao || 'Operação'}</strong>
                            <small>
                                {selectedLog.tipoRecurso || 'Recurso'} · {selectedLog.recursoId ? String(selectedLog.recursoId).slice(0, 12) : 'Geral'}
                            </small>
                        </div>

                        <div className="detalhe-coluna">
                            <span>Acionada por</span>
                            <strong>{selectedLog.usuarioNome || 'Sistema'}</strong>
                            <small>
                                Usuário autenticado
                            </small>
                        </div>

                        <div className="detalhe-coluna">
                            <span>Data e Hora</span>
                            <strong>{selectedLog.ocorridoEm ? new Date(selectedLog.ocorridoEm).toLocaleString('pt-BR') : 'Hoje'}</strong>
                            <small>
                                Banco de dados PostgreSQL
                            </small>
                        </div>
                    </div>
                </section>
            )}
        </main>
    );

    return mainContent;
}
