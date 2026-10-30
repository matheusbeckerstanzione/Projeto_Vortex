package neocore.Service;

import lombok.RequiredArgsConstructor;

import neocore.DTO.pesquisaenriquecimento.*;
import neocore.Mapper.PesquisaEnriquecimentoMapper;
import neocore.Model.PesquisaEnriquecimento;
import neocore.Model.Enum.*;
import neocore.Repository.PesquisaEnriquecimentoRepository;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PesquisaEnriquecimentoService {

    private final PesquisaEnriquecimentoRepository repository;
    private final PesquisaEnriquecimentoMapper mapper;
    private final ServiceSupport suporte;
    private final AuditoriaService auditoria;

    public Page<PesquisaEnriquecimentoResponse> listar(
            int pagina,
            int tamanho
    ) {
        suporte.atual();

        return repository.findAll(suporte.pagina(pagina, tamanho))
                .map(mapper::toResponse);
    }

    @Transactional
    public PesquisaEnriquecimentoResponse cadastrar(
            PesquisaEnriquecimentoRequest request
    ) {
        var autor = suporte.atual();

        suporte.validar(request);

        var pesquisa = mapper.toEntity(
                request,
                suporte.finalidade(request.finalidadeId()),
                autor
        );

        pesquisa.setUf(request.uf().toUpperCase(Locale.ROOT));
        pesquisa.setStatus(StatusPesquisa.PENDENTE);
        pesquisa.setCriadaEm(OffsetDateTime.now());

        pesquisa = repository.save(pesquisa);

        auditoria.registrar(
                autor,
                "CADASTRAR",
                "PesquisaEnriquecimento",
                pesquisa.getId(),
                ResultadoAuditoria.SUCESSO
        );

        return mapper.toResponse(pesquisa);
    }

    @Transactional
    public PesquisaEnriquecimentoResponse cancelar(UUID id) {
        var pesquisa = suporte.bloquear(
                PesquisaEnriquecimento.class,
                id
        );

        suporte.dono(pesquisa.getSolicitadoPor());

        ServiceSupport.exigir(
                pesquisa.getStatus() == StatusPesquisa.PENDENTE,
                "Só é possível cancelar pesquisas pendentes nesta etapa."
        );

        pesquisa.setStatus(StatusPesquisa.CANCELADA);
        pesquisa.setFinalizadaEm(OffsetDateTime.now());

        auditoria.registrar(
                suporte.atual(),
                "CANCELAR",
                "PesquisaEnriquecimento",
                id,
                ResultadoAuditoria.SUCESSO
        );

        return mapper.toResponse(pesquisa);
    }
}