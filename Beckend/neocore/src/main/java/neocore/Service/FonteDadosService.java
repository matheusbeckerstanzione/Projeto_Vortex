package neocore.Service;

import lombok.RequiredArgsConstructor;

import neocore.DTO.fontedados.*;
import neocore.Mapper.FonteDadosMapper;
import neocore.Model.*;
import neocore.Model.Enum.ResultadoAuditoria;
import neocore.Repository.FonteDadosRepository;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FonteDadosService {

    private final FonteDadosRepository repository;
    private final FonteDadosMapper mapper;
    private final ServiceSupport suporte;
    private final AuditoriaService auditoria;

    public FonteDadosResponse buscarPorId(UUID id) {
        suporte.atual();

        return mapper.toResponse(
                suporte.obter(FonteDados.class, id)
        );
    }

    public Page<FonteDadosResponse> listar(int pagina, int tamanho) {
        suporte.atual();

        return repository.findAll(suporte.pagina(pagina, tamanho))
                .map(mapper::toResponse);
    }

    @Transactional
    public FonteDadosResponse cadastrar(FonteDadosRequest request) {
        suporte.admin();
        suporte.validar(request);
        verificar(request);

        var fonte = mapper.toEntity(
                request,
                empresa(request.empresaId())
        );

        fonte.setCriadoEm(OffsetDateTime.now());
        fonte = repository.save(fonte);

        auditoria.registrar(
                suporte.atual(),
                "CADASTRAR",
                "FonteDados",
                fonte.getId(),
                ResultadoAuditoria.SUCESSO
        );

        return mapper.toResponse(fonte);
    }

    @Transactional
    public FonteDadosResponse atualizar(
            UUID id,
            FonteDadosRequest request
    ) {
        suporte.admin();
        suporte.validar(request);
        verificar(request);

        var fonte = suporte.bloquear(FonteDados.class, id);

        mapper.atualizarEntidade(
                request,
                fonte,
                empresa(request.empresaId())
        );

        auditoria.registrar(
                suporte.atual(),
                "ATUALIZAR",
                "FonteDados",
                id,
                ResultadoAuditoria.SUCESSO
        );

        return mapper.toResponse(fonte);
    }

    private Empresa empresa(UUID id) {
        return id == null
                ? null
                : suporte.obter(Empresa.class, id);
    }

    private void verificar(FonteDadosRequest request) {
        if (!request.habilitada()) {
            return;
        }

        ServiceSupport.exigir(
                request.condicoesUso() != null
                        && !request.condicoesUso().isBlank(),
                "Registre as condições de uso."
        );

        ServiceSupport.exigir(
                request.avaliadaEm() != null
                        && !request.avaliadaEm()
                        .isAfter(OffsetDateTime.now()),
                "Avaliação inválida."
        );

        ServiceSupport.exigir(
                request.validaAte() != null
                        && request.validaAte()
                        .isAfter(OffsetDateTime.now()),
                "Validade deve ser futura."
        );
    }
}