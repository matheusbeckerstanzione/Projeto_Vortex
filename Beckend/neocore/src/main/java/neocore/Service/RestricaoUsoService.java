package neocore.Service;

import lombok.RequiredArgsConstructor;

import neocore.DTO.restricaouso.*;
import neocore.Mapper.RestricaoUsoMapper;
import neocore.Model.*;
import neocore.Model.Enum.*;
import neocore.Repository.RestricaoUsoRepository;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RestricaoUsoService {

    private final RestricaoUsoRepository repository;
    private final RestricaoUsoMapper mapper;
    private final ServiceSupport suporte;
    private final AuditoriaService auditoria;

    public Page<RestricaoUsoResponse> listar(int pagina, int tamanho) {
        suporte.atual();

        return repository.findAll(suporte.pagina(pagina, tamanho))
                .map(mapper::toResponse);
    }

    @Transactional
    public RestricaoUsoResponse registrar(
            RestricaoUsoRequest request
    ) {
        var autor = suporte.atual();

        suporte.validar(request);

        ServiceSupport.exigir(
                request.escopo() != EscopoRestricao.TODOS
                        || request.canal() == null,
                "Uma restrição TODOS não pode se limitar a um canal."
        );

        var contato = suporte.obter(
                Contato.class,
                request.contatoId()
        );

        FinalidadeTratamento finalidade =
                request.finalidadeId() == null
                        ? null
                        : suporte.obter(
                        FinalidadeTratamento.class,
                        request.finalidadeId()
                );

        var restricao = mapper.toEntity(
                request,
                contato,
                finalidade,
                autor
        );

        restricao.setAtiva(true);
        restricao.setCriadaEm(OffsetDateTime.now());

        restricao = repository.save(restricao);

        auditoria.registrar(
                autor,
                "REGISTRAR_RESTRICAO",
                "RestricaoUso",
                restricao.getId(),
                ResultadoAuditoria.SUCESSO
        );

        return mapper.toResponse(restricao);
    }

    @Transactional
    public RestricaoUsoResponse encerrar(
            UUID id,
            EncerramentoRestricaoRequest request
    ) {
        var autor = suporte.admin();

        suporte.validar(request);

        var restricao = suporte.bloquear(RestricaoUso.class, id);

        ServiceSupport.exigir(
                Boolean.TRUE.equals(restricao.getAtiva()),
                "Restrição já encerrada."
        );

        restricao.setAtiva(false);
        restricao.setEncerradaEm(OffsetDateTime.now());

        restricao.setMotivo(
                restricao.getMotivo()
                        + "\nEncerramento: "
                        + request.motivoEncerramento()
        );

        auditoria.registrar(
                autor,
                "ENCERRAR_RESTRICAO",
                "RestricaoUso",
                id,
                ResultadoAuditoria.SUCESSO
        );

        return mapper.toResponse(restricao);
    }
}