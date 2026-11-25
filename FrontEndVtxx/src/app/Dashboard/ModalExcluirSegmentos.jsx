import React from 'react';
import '../../styles/modalExcluirSegmentos.css';

export default function ModalExcluirSegmento({
    segmento,
    fecharModal,
    confirmarExclusao
}) {
    if (!segmento) return null;

    return (
        <div
            className="excluir-segmento-overlay"
            onClick={fecharModal}
        >
            <div
                className="excluir-segmento-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="excluir-segmento-icone">!</div>

                <h2>Excluir segmento?</h2>

                <p>
                    Tem certeza de que deseja excluir o segmento
                    <strong> "{segmento.name}"</strong>?
                </p>

                <p className="excluir-segmento-aviso">
                    Essa ação não poderá ser desfeita.
                </p>

                <div className="excluir-segmento-acoes">
                    <button
                        type="button"
                        className="excluir-segmento-cancelar"
                        onClick={fecharModal}
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        className="excluir-segmento-confirmar"
                        onClick={confirmarExclusao}
                    >
                        Excluir segmento
                    </button>
                </div>
            </div>
        </div>
    );
}
