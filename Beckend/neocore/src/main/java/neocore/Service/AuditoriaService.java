package neocore.Service;

import lombok.RequiredArgsConstructor;

import neocore.DTO.logauditoria.LogAuditoriaResponse;
import neocore.Mapper.LogAuditoriaMapper;
import neocore.Model.*;
import neocore.Model.Enum.ResultadoAuditoria;
import neocore.Repository.LogAuditoriaRepository;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuditoriaService {

    private final LogAuditoriaRepository repository;
    private final LogAuditoriaMapper mapper;
    private final ServiceSupport suporte;

    @Transactional
    public void registrar(
            Usuario usuario,
            String acao,
            String tipo,
            UUID recursoId,
            ResultadoAuditoria resultado
    ) {
        ServiceSupport.exigir(
                acao != null
                        && acao.length() <= 60
                        && tipo != null
                        && tipo.length() <= 40
                        && resultado != null,
                "Evento de auditoria inválido."
        );

        var log = new LogAuditoria();

        log.setUsuario(usuario);
        log.setAcao(acao);
        log.setTipoRecurso(tipo);
        log.setRecursoId(recursoId);
        log.setResultado(resultado);
        log.setOcorridoEm(OffsetDateTime.now());

        repository.save(log);
    }

    public Page<LogAuditoriaResponse> listar(int pagina, int tamanho) {
        suporte.admin();

        return repository.findAll(suporte.pagina(pagina, tamanho))
                .map(mapper::toResponse);
    }
}