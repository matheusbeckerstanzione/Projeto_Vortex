package neocore.Service;

import lombok.RequiredArgsConstructor;

import neocore.DTO.solicitacaoacesso.*;
import neocore.Mapper.SolicitacaoAcessoMapper;
import neocore.Model.SolicitacaoAcesso;
import neocore.Model.Enum.*;
import neocore.Repository.SolicitacaoAcessoRepository;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SolicitacaoAcessoService {

    private final SolicitacaoAcessoRepository repository;
    private final SolicitacaoAcessoMapper mapper;
    private final ServiceSupport suporte;
    private final AuditoriaService auditoria;

    @Transactional
    public SolicitacaoAcessoResponse solicitar(
            SolicitacaoAcessoRequest request
    ) {
        suporte.validar(request);

        var solicitacao = mapper.toEntity(request);

        solicitacao.setEmail(ServiceSupport.email(request.email()));
        solicitacao.setStatus(StatusSolicitacao.PENDENTE);
        solicitacao.setSolicitadoEm(OffsetDateTime.now());

        return mapper.toResponse(repository.save(solicitacao));
    }

    public Page<SolicitacaoAcessoResponse> listar(
            int pagina,
            int tamanho
    ) {
        suporte.admin();

        return repository.findAll(suporte.pagina(pagina, tamanho))
                .map(mapper::toResponse);
    }

    @Transactional
    public SolicitacaoAcessoResponse avaliar(
            UUID id,
            AvaliacaoSolicitacaoRequest request
    ) {
        var autor = suporte.admin();

        suporte.validar(request);

        var solicitacao = suporte.bloquear(
                SolicitacaoAcesso.class,
                id
        );

        ServiceSupport.exigir(
                solicitacao.getStatus() == StatusSolicitacao.PENDENTE
                        && request.status() != StatusSolicitacao.PENDENTE,
                "Avaliação inválida ou já concluída."
        );

        solicitacao.setStatus(request.status());
        solicitacao.setAvaliadoPor(autor);
        solicitacao.setAvaliadoEm(OffsetDateTime.now());

        auditoria.registrar(
                autor,
                "AVALIAR_SOLICITACAO",
                "SolicitacaoAcesso",
                id,
                ResultadoAuditoria.SUCESSO
        );

        return mapper.toResponse(solicitacao);
    }
}