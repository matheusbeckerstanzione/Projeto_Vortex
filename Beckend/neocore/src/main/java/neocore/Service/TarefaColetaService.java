package neocore.Service;

import lombok.RequiredArgsConstructor;

import neocore.DTO.tarefacoleta.*;
import neocore.Exception.ConflitoException;
import neocore.Mapper.TarefaColetaMapper;
import neocore.Model.*;
import neocore.Model.Enum.*;
import neocore.Repository.TarefaColetaRepository;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TarefaColetaService {

    private final TarefaColetaRepository repository;
    private final TarefaColetaMapper mapper;
    private final ServiceSupport suporte;
    private final AuditoriaService auditoria;

    public Page<TarefaColetaResponse> listar(
            int pagina,
            int tamanho
    ) {
        suporte.admin();

        return repository.findAll(suporte.pagina(pagina, tamanho))
                .map(mapper::toResponse);
    }

    @Transactional
    public TarefaColetaResponse cadastrar(
            TarefaColetaRequest request
    ) {
        var autor = suporte.admin();

        suporte.validar(request);

        var pesquisa = suporte.bloquear(
                PesquisaEnriquecimento.class,
                request.pesquisaId()
        );

        ServiceSupport.exigir(
                pesquisa.getStatus() == StatusPesquisa.PENDENTE,
                "Pesquisa não está pendente."
        );

        suporte.finalidade(pesquisa.getFinalidade().getId());

        var fonte = suporte.fonte(request.fonteId());

        if (repository.existsByChaveIdempotencia(
                request.chaveIdempotencia()
        )) {
            throw new ConflitoException("Tarefa já cadastrada.");
        }

        var tarefa = mapper.toEntity(request, pesquisa, fonte);

        tarefa.setStatus(StatusTarefa.PENDENTE);
        tarefa.setTentativas(0);
        tarefa.setCriadaEm(OffsetDateTime.now());

        tarefa = repository.save(tarefa);

        auditoria.registrar(
                autor,
                "CADASTRAR",
                "TarefaColeta",
                tarefa.getId(),
                ResultadoAuditoria.SUCESSO
        );

        return mapper.toResponse(tarefa);
    }

    @Transactional
    public TarefaColetaResponse cancelar(UUID id) {
        var autor = suporte.admin();
        var tarefa = suporte.bloquear(TarefaColeta.class, id);

        ServiceSupport.exigir(
                tarefa.getStatus() == StatusTarefa.PENDENTE
                        || tarefa.getStatus() == StatusTarefa.DISPONIVEL,
                "Tarefa não pode ser cancelada neste estado."
        );

        tarefa.setStatus(StatusTarefa.CANCELADA);
        tarefa.setFinalizadaEm(OffsetDateTime.now());

        auditoria.registrar(
                autor,
                "CANCELAR",
                "TarefaColeta",
                id,
                ResultadoAuditoria.SUCESSO
        );

        return mapper.toResponse(tarefa);
    }
}