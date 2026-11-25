
import React, { useEffect } from 'react';
import '../../styles/ModalDetalhesContatosSegmentos.css';

export default function ModalDetalhesContato({
    contato,
    fecharModal,
    removerContato,
}) {
    console.log('Contato recebido pelo modal:', contato);
    useEffect(() => {
        const fecharComEscape = (event) => {
            if (event.key === 'Escape') {
                fecharModal();
            }
        };

        document.addEventListener('keydown', fecharComEscape);

        return () => {
            document.removeEventListener('keydown', fecharComEscape);
        };
    }, [fecharModal]);

    if (!contato) return null;

    return (
        <div
            className="detalhes-contato-overlay"
            onClick={fecharModal}
        >
            <div
                className="detalhes-contato-modal"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="detalhes-contato-header">
                    <div>
                        <span className="detalhes-contato-label">
                            CONTATO
                        </span>

                        <h2>Detalhes do contato</h2>
                    </div>

                    <button
                        className="detalhes-contato-fechar"
                        onClick={fecharModal}
                        aria-label="Fechar modal"
                    >
                        ×
                    </button>
                </div>

                <div className="detalhes-contato-perfil">
                    <div className="detalhes-contato-avatar">
                        {contato.initials || 'CT'}
                    </div>

                    <div>
                        <h3>{contato.name || 'Contato sem nome'}</h3>

                        <p>
                            {contato.detail || 'Informações não disponíveis'}
                        </p>
                    </div>
                </div>

                <div className="detalhes-contato-secao">
                    <h4>Informações profissionais</h4>

                    <div className="detalhes-contato-grid">
                        <div className="detalhes-contato-campo">
                            <span>E-mail</span>
                            <strong>{contato.email || 'Não informado'}</strong>
                        </div>

                        <div className="detalhes-contato-campo">
                            <span>Empresa</span>
                            <strong>{contato.company || 'Não informada'}</strong>
                        </div>

                        <div className="detalhes-contato-campo">
                            <span>Cargo</span>
                            <strong>{contato.cargo || 'Não informado'}</strong>
                        </div>

                        <div className="detalhes-contato-campo">
                            <span>Área de atuação</span>
                            <strong>{contato.area || 'Não informada'}</strong>
                        </div>
                    </div>
                </div>

                <div className="detalhes-contato-secao">
                    <h4>Enriquecimento de dados</h4>

                    <div className="detalhes-contato-campo">
                        <span>Interesses identificados</span>
                        <strong>
                            {contato.interests || 'Ainda não identificados'}
                        </strong>
                    </div>

                    <div className="detalhes-contato-campo">
                        <span>Origem das informações</span>
                        <strong>{contato.source || 'Não informada'}</strong>
                    </div>

                    <div className="detalhes-contato-campo">
                        <span>Nível de confiança</span>
                        <strong>
                            {contato.confidence || 'Não disponível'}
                        </strong>
                    </div>
                </div>

                <div className="detalhes-contato-footer">
                    <button
                        type="button"
                        className="detalhes-contato-btn detalhes-contato-btn-remover"
                        onClick={() => removerContato(contato)}
                    >
                        Remover contato
                    </button>

                    <button
                        type="button"
                        className="detalhes-contato-btn"
                        onClick={fecharModal}
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
