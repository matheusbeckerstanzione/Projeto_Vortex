package neocore.Service;

import lombok.RequiredArgsConstructor;

import neocore.DTO.resultadocampanha.*;
import neocore.Mapper.ResultadoCampanhaMapper;
import neocore.Model.Campanha;
import neocore.Model.Enum.*;
import neocore.Repository.ResultadoCampanhaRepository;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ResultadoCampanhaService {

    private final ResultadoCampanhaRepository repository;
    private final ResultadoCampanhaMapper mapper;
    private final ServiceSupport suporte;
    private final AuditoriaService auditoria;

    public Page<ResultadoCampanhaResponse> listar(
            int pagina,
            int tamanho
    ) {
        suporte.atual();

        return repository.findAll(suporte.pagina(pagina, tamanho))
                .map(mapper::toResponse);
    }

    @Transactional
    public ResultadoCampanhaResponse registrar(
            ResultadoCampanhaRequest request
    ) {
        var autor = suporte.atual();

        suporte.validar(request);

        ServiceSupport.exigir(
                !request.periodoFim().isBefore(request.periodoInicio()),
                "Fim anterior ao início."
        );

        ServiceSupport.exigir(
                !request.periodoFim().isAfter(LocalDate.now()),
                "Período ainda não concluído."
        );

        ServiceSupport.exigir(
                request.entregues() <= request.envios(),
                "Entregues excedem os envios."
        );

        ServiceSupport.dinheiro(request.custo());
        ServiceSupport.dinheiro(request.receita());

        var campanha = suporte.obter(
                Campanha.class,
                request.campanhaId()
        );

        suporte.dono(campanha.getCriadaPor());

        var fonte = suporte.fonte(request.fonteId());

        ServiceSupport.exigir(
                fonte.getTipo() == TipoFonteDados.RESULTADO_CAMPANHA,
                "Fonte deve ser de resultados de campanha."
        );

        var resultado = mapper.toEntity(request, campanha, fonte);

        resultado.setRegistradoEm(OffsetDateTime.now());
        resultado = repository.save(resultado);

        auditoria.registrar(
                autor,
                "REGISTRAR",
                "ResultadoCampanha",
                resultado.getId(),
                ResultadoAuditoria.SUCESSO
        );

        return mapper.toResponse(resultado);
    }
}