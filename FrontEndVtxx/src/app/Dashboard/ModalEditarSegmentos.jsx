
import React, { useState, useEffect } from 'react';
import '../../styles/modalEditarSegmentos.css';

export default function ModalEditarSegmento({
    segmento,
    fecharModal,
    salvarAlteracoes
}) {
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [criterios, setCriterios] = useState('');

    useEffect(() => {
        if (segmento) {
            setNome(segmento.name || '');
            setDescricao(segmento.description || '');
            setCriterios(segmento.criteria || '');
        }
    }, [segmento]);

    useEffect(() => {
        // Guarda o estilo original da página
        const overflowOriginal = document.body.style.overflow;

        // Bloqueia a rolagem da tela de trás
        document.body.style.overflow = 'hidden';

        // Ao fechar a modal, restaura a rolagem
        return () => {
            document.body.style.overflow = overflowOriginal;
        };
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!nome.trim()) {
            return;
        }

        salvarAlteracoes({
            ...segmento,
            name: nome.trim(),
            description: descricao.trim(),
            criteria: criterios.trim(),
            updatedAt: 'Agora'
        });
    };

    if (!segmento) return null;

    return (
        <div
            className="editar-segmento-overlay"
            onClick={fecharModal}
        >
            <div
                className="editar-segmento-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="editar-segmento-header">
                    <div className="editar-segmento-tag">
                        <span>Demonstração</span>
                        <span>Editar segmento</span>
                    </div>

                    <button
                        type="button"
                        className="editar-segmento-fechar"
                        onClick={fecharModal}
                    >
                        ×
                    </button>

                    <h2>Editar segmento</h2>

                    <p>
                        Atualize as informações e os critérios
                        do público selecionado.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="editar-segmento-campo">
                        <label>Nome do segmento</label>

                        <input
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            placeholder="Nome do segmento"
                            required
                        />
                    </div>

                    <div className="editar-segmento-campo">
                        <label>Descrição do segmento</label>

                        <textarea
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            placeholder="Descreva o público"
                            rows={3}
                        />
                    </div>

                    <div className="editar-segmento-campo">
                        <label>Critérios do segmento</label>

                        <textarea
                            value={criterios}
                            onChange={(e) => setCriterios(e.target.value)}
                            placeholder="Informe os critérios"
                            rows={3}
                        />
                    </div>

                    <div className="editar-segmento-aviso">
                        <strong>Alterações no segmento</strong>
                        <p>
                            As informações serão atualizadas no segmento
                            selecionado. Nenhuma campanha será disparada.
                        </p>
                    </div>

                    <div className="editar-segmento-footer">
                        <button
                            type="button"
                            className="editar-segmento-cancelar"
                            onClick={fecharModal}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className="editar-segmento-salvar"
                        >
                            Salvar alterações
                        </button>
                    </div>

                    <p className="editar-segmento-disclaimer">
                        Cenário ilustrativo. Nenhuma campanha será disparada.
                    </p>
                </form>
            </div>
        </div>
    );
}
