package neocore.Service;

import lombok.RequiredArgsConstructor;

import neocore.DTO.finalidadetratamento.*;
import neocore.Exception.ConflitoException;
import neocore.Mapper.FinalidadeTratamentoMapper;
import neocore.Model.FinalidadeTratamento;
import neocore.Model.Enum.ResultadoAuditoria;
import neocore.Repository.FinalidadeTratamentoRepository;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FinalidadeTratamentoService {

    private final FinalidadeTratamentoRepository repository;
    private final FinalidadeTratamentoMapper mapper;
    private final ServiceSupport suporte;
    private final AuditoriaService auditoria;

    public FinalidadeTratamentoResponse buscarPorId(UUID id) {
        suporte.atual();

        return mapper.toResponse(
                suporte.obter(FinalidadeTratamento.class, id)
        );
    }

    public Page<FinalidadeTratamentoResponse> listar(
            int pagina,
            int tamanho
    ) {
        suporte.atual();

        return repository.findAll(suporte.pagina(pagina, tamanho))
                .map(mapper::toResponse);
    }

    @Transactional
    public FinalidadeTratamentoResponse cadastrar(
            FinalidadeTratamentoRequest request
    ) {
        suporte.admin();
        suporte.validar(request);
        verificar(request, null);

        var finalidade = mapper.toEntity(request);

        finalidade.setCriadoEm(OffsetDateTime.now());
        finalidade = repository.save(finalidade);

        auditoria.registrar(
                suporte.atual(),
                "CADASTRAR",
                "FinalidadeTratamento",
                finalidade.getId(),
                ResultadoAuditoria.SUCESSO
        );

        return mapper.toResponse(finalidade);
    }

    @Transactional
    public FinalidadeTratamentoResponse atualizar(
            UUID id,
            FinalidadeTratamentoRequest request
    ) {
        suporte.admin();
        suporte.validar(request);

        var finalidade = suporte.bloquear(
                FinalidadeTratamento.class,
                id
        );

        verificar(request, id);
        mapper.atualizarEntidade(request, finalidade);

        auditoria.registrar(
                suporte.atual(),
                "ATUALIZAR",
                "FinalidadeTratamento",
                id,
                ResultadoAuditoria.SUCESSO
        );

        return mapper.toResponse(finalidade);
    }

    private void verificar(
            FinalidadeTratamentoRequest request,
            UUID id
    ) {
        if (suporte.duplicado(
                FinalidadeTratamento.class,
                "nome",
                request.nome().strip(),
                id
        )) {
            throw new ConflitoException("Nome já cadastrado.");
        }

        ServiceSupport.exigir(
                !request.habilitada()
                        || (
                        request.baseLegal() != null
                                && !request.baseLegal().isBlank()
                ),
                "Informe a base legal antes de habilitar."
        );
    }
}