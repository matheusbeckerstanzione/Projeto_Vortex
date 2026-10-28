
import React, { useState } from "react";
import Header from "../../components/Header.jsx";
import Sidebar from "../../components/Sidebar.jsx";
import "../../styles/DashboardLogs.css";

export default function VortexLogs({ embedded = false, onNavigate, onShowToast }) {
    const [selectedLogId, setSelectedLogId] = useState("DEMO-005");
    const [searchTerm, setSearchTerm] = useState("");

    const handleExportLogs = () => {
        const csvContent = "data:text/csv;charset=utf-8," + 
            "DATA/HORA,EVENTO/ACAO,ID,CONTATO,ORIGEM,FONTE,RESPONSAVEL,TIPO,RESULTADO\n" +
            "13/10/2026 09:18:32,Revisão solicitada,DEMO-005,Mariana Souza,NC-00142,CRM Salesforce,Carlos,Usuário,Solicitada\n" +
            "13/10/2026 09:16:04,Ficha consultada,DEMO-004,Mariana Souza,NC-00142,CRM Salesforce,Carlos,Usuário,Registrada\n" +
            "13/10/2026 09:12:08,Ficha consultada,DEMO-003,Rafael Almeida,NC-00143,ERP Omie,Carlos,Usuário,Registrada\n" +
            "11/10/2026 08:42:00,Fonte sincronizada,DEMO-002,Mariana Souza,NC-00142,CRM Salesforce,Sistema,Automação,Concluída\n" +
            "11/10/2026 08:40:00,Fonte sincronizada,DEMO-001,Mariana Souza,NC-00142,ERP Omie,Sistema,Automação,Concluída\n";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `logs_auditoria_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        if (onShowToast) onShowToast("Logs de auditoria exportados com sucesso!");
    };

    const mainContent = (
        <main className={`conteudo-logs ${embedded ? 'embedded-logs' : ''}`}>
            {/* Título da página */}
            <section className="audit-logs">
                <div className="audit-content">
                    <div className="audit-info">
                        <h1>Logs de auditoria</h1>
                        <p>
                            Acompanhe o registro automático das ações
                            em contatos e fichas de origem.
                        </p>
                    </div>

                    <button className="export-button" onClick={handleExportLogs}>
                        Exportar logs
                    </button>
                </div>
            </section>

                    {/* Registro automático de eventos */}
                    <section className="card-registro">
                        <div className="registro-topo">
                            <div className="registro-titulo">
                                <span className="registro-icone">♧</span>
                                <strong>Registro automático de eventos</strong>
                                <span className="registro-status">
                                    ● Ativa · exemplo
                                </span>
                            </div>

                            <small>
                                Logs e status demonstrativos · não são registros reais
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
                                <h3>♧ &nbsp; Consulta à ficha</h3>
                                <p>
                                    Ao abrir a ficha de origem, registra
                                    o acesso e o responsável.
                                </p>
                            </div>

                            <div className="tipo-evento">
                                <h3>▤ &nbsp; Solicitação de revisão</h3>
                                <p>
                                    Ao enviar a solicitação, registra o pedido.
                                    Não conclui a revisão.
                                </p>
                            </div>
                        </div>

                        <p className="registro-nota">
                            O log é gerado pelo sistema após cada evento,
                            mesmo quando a ação é realizada por uma pessoa.
                        </p>
                    </section>

                    {/* Histórico de eventos */}
                    <section className="card-historico">
                        <div className="historico-topo">
                            <h2>Histórico de eventos</h2>
                            <span>5 eventos demonstrativos</span>
                        </div>

                        <input
                            className="historico-busca"
                            type="text"
                            placeholder="⌕  Buscar por contato, registro de origem ou ID do evento"
                        />

                        <div className="historico-filtros">
                            <select defaultValue="11–13 out. 2026">
                                <option>11–13 out. 2026</option>
                            </select>

                            <select defaultValue="Todos os eventos">
                                <option>Todos os eventos</option>
                                <option>Revisão solicitada</option>
                                <option>Ficha consultada</option>
                                <option>Fonte sincronizada</option>
                            </select>

                            <select defaultValue="Todas as fontes">
                                <option>Todas as fontes</option>
                                <option>CRM Salesforce</option>
                                <option>ERP Omie</option>
                            </select>

                            <select defaultValue="Todos os responsáveis">
                                <option>Todos os responsáveis</option>
                                <option>Carlos</option>
                                <option>Sistema</option>
                            </select>

                            <select defaultValue="Todos os resultados">
                                <option>Todos os resultados</option>
                                <option>Solicitada</option>
                                <option>Registrada</option>
                                <option>Concluída</option>
                            </select>
                        </div>

                        <div className="historico-tabela-container">
                            <table className="historico-tabela">
                                <thead>
                                    <tr>
                                        <th>DATA / HORA</th>
                                        <th>EVENTO / AÇÃO</th>
                                        <th>CONTATO / ORIGEM</th>
                                        <th>FONTE</th>
                                        <th>RESPONSÁVEL</th>
                                        <th>RESULTADO</th>
                                        <th>DETALHES</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    <tr className="evento-selecionado">
                                        <td>
                                            13/10/2026
                                            <small>09:18:32 · BRT</small>
                                        </td>
                                        <td>
                                            Revisão solicitada
                                            <small>DEMO-005</small>
                                        </td>
                                        <td>
                                            Mariana Souza
                                            <small>NC-00142 · SF-00482</small>
                                        </td>
                                        <td>CRM Salesforce</td>
                                        <td>
                                            Carlos
                                            <small>Usuário</small>
                                        </td>
                                        <td>
                                            <span className="etiqueta solicitada">
                                                Solicitada
                                            </span>
                                        </td>
                                        <td>
                                            <button className="detalhes-btn">
                                                Em exibição
                                            </button>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td>
                                            13/10/2026
                                            <small>09:16:04 · BRT</small>
                                        </td>
                                        <td>
                                            Ficha consultada
                                            <small>DEMO-004</small>
                                        </td>
                                        <td>
                                            Mariana Souza
                                            <small>NC-00142 · SF-00482</small>
                                        </td>
                                        <td>CRM Salesforce</td>
                                        <td>
                                            Carlos
                                            <small>Usuário</small>
                                        </td>
                                        <td>
                                            <span className="etiqueta registrada">
                                                Registrada
                                            </span>
                                        </td>
                                        <td>
                                            <button className="detalhes-btn">
                                                Detalhes →
                                            </button>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td>
                                            13/10/2026
                                            <small>09:12:08 · BRT</small>
                                        </td>
                                        <td>
                                            Ficha consultada
                                            <small>DEMO-003</small>
                                        </td>
                                        <td>
                                            Rafael Almeida
                                            <small>NC-00143 · OM-0138</small>
                                        </td>
                                        <td>ERP Omie</td>
                                        <td>
                                            Carlos
                                            <small>Usuário</small>
                                        </td>
                                        <td>
                                            <span className="etiqueta registrada">
                                                Registrada
                                            </span>
                                        </td>
                                        <td>
                                            <button className="detalhes-btn">
                                                Detalhes →
                                            </button>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td>
                                            11/10/2026
                                            <small>08:42:00 · BRT</small>
                                        </td>
                                        <td>
                                            Fonte sincronizada
                                            <small>DEMO-002</small>
                                        </td>
                                        <td>
                                            Mariana Souza
                                            <small>NC-00142 · SF-00482</small>
                                        </td>
                                        <td>CRM Salesforce</td>
                                        <td>
                                            Sistema
                                            <small>Automação</small>
                                        </td>
                                        <td>
                                            <span className="etiqueta concluida">
                                                ● Concluída
                                            </span>
                                        </td>
                                        <td>
                                            <button className="detalhes-btn">
                                                Detalhes →
                                            </button>
                                        </td>
                                    </tr>

                                    <tr>
                                        <td>
                                            11/10/2026
                                            <small>08:40:00 · BRT</small>
                                        </td>
                                        <td>
                                            Fonte sincronizada
                                            <small>DEMO-001</small>
                                        </td>
                                        <td>
                                            Mariana Souza
                                            <small>NC-00142 · OM-0137</small>
                                        </td>
                                        <td>ERP Omie</td>
                                        <td>
                                            Sistema
                                            <small>Automação</small>
                                        </td>
                                        <td>
                                            <span className="etiqueta concluida">
                                                ● Concluída
                                            </span>
                                        </td>
                                        <td>
                                            <button className="detalhes-btn">
                                                Detalhes →
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="historico-rodape">
                            <span>
                                1–5 de 5 eventos · Mais recentes primeiro
                            </span>

                            <div className="historico-paginacao">
                                <button disabled>‹</button>
                                <strong>1</strong>
                                <button disabled>›</button>
                            </div>
                        </div>
                    </section>

                    {/* Detalhes do evento: agora fora do histórico */}
                    <section className="card-detalhes">
                        <div className="detalhes-topo">
                            <div className="detalhes-titulo">
                                <h2>Detalhes do evento</h2>
                                <span>DEMO-005</span>
                            </div>

                            <span className="detalhes-status">
                                Revisão solicitada
                            </span>
                        </div>

                        <div className="detalhes-informacoes">
                            <div className="detalhe-coluna">
                                <span>Contato e origem</span>
                                <strong>Mariana Souza</strong>
                                <small>
                                    NC-00142 · CRM Salesforce · SF-00482
                                </small>
                            </div>

                            <div className="detalhe-coluna">
                                <span>Acionada por</span>
                                <strong>Carlos · Usuário</strong>
                                <small>
                                    Origem da ação: Ficha de origem
                                </small>
                            </div>

                            <div className="detalhe-coluna">
                                <span>Log gerado por</span>
                                <strong>Sistema (automação)</strong>
                                <small>
                                    13/10/2026, às 09:18:32 · BRT (UTC−3)
                                </small>
                            </div>
                        </div>

                        <div className="detalhes-rodape">
                            <div className="detalhe-explicacao">
                                <h3>Como este registro foi gerado</h3>

                                <div className="fluxo-registro">
                                    <span>Pedido enviado</span>
                                    <b>→</b>
                                    <span>Evento capturado</span>
                                    <b>→</b>
                                    <strong>Log registrado</strong>
                                </div>

                                <p>
                                    Solicitação registrada; análise humana
                                    ainda pendente.
                                </p>
                            </div>

                            <div className="detalhe-explicacao">
                                <h3>
                                    Situação da ficha no momento do evento
                                </h3>

                                <p>
                                    Confiança: não informada · Base legal:
                                    não informada
                                </p>

                                <p>
                                    Solicitar revisão não significa revisão
                                    concluída ou aprovação legal.
                                </p>
                            </div>
                        </div>
                    </section>
                </main>
    );

    if (embedded) {
        return mainContent;
    }

    return (
        <>
            <Header />
            <section className="layout-logs">
                <Sidebar />
                {mainContent}
            </section>
        </>
    );
}
