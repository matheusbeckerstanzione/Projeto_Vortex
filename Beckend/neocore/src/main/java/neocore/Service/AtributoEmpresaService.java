package neocore.Service;

import lombok.RequiredArgsConstructor;

import neocore.DTO.atributoempresa.*;
import neocore.Mapper.AtributoEmpresaMapper;
import neocore.Model.*;
import neocore.Model.Enum.*;
import neocore.Repository.AtributoEmpresaRepository;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AtributoEmpresaService {

    private final AtributoEmpresaRepository repository;
    private final AtributoEmpresaMapper mapper;
    private final ServiceSupport suporte;
    private final AuditoriaService auditoria;

    public AtributoEmpresaResponse buscarPorId(UUID id) {
        suporte.atual();

        return mapper.toResponse(
                suporte.obter(AtributoEmpresa.class, id)
        );
    }

    public Page<AtributoEmpresaResponse> listar(
            int pagina,
            int tamanho
    ) {
        suporte.atual();

        return repository.findAll(suporte.pagina(pagina, tamanho))
                .map(mapper::toResponse);
    }

    @Transactional
    public AtributoEmpresaResponse cadastrar(
            AtributoEmpresaRequest request
    ) {
        var autor = suporte.atual();

        suporte.validar(request);

        var fonte = suporte.fonte(request.fonteId());
        var finalidade = suporte.finalidade(request.finalidadeId());

        suporte.retencao(request.validoAte(), finalidade);

        var atributo = mapper.toEntity(
                request,
                suporte.obter(Empresa.class, request.empresaId()),
                fonte,
                finalidade
        );

        ServiceSupport.exigir(
                fonte.getEmpresa() == null
                        || fonte.getEmpresa().getId()
                        .equals(atributo.getEmpresa().getId()),
                "Fonte pertence a outra empresa."
        );

        atributo.setStatusRevisao(StatusRevisao.PENDENTE);
        atributo.setColetadoEm(OffsetDateTime.now());

        atributo = repository.save(atributo);

        auditoria.registrar(
                autor,
                "CADASTRAR",
                "AtributoEmpresa",
                atributo.getId(),
                ResultadoAuditoria.SUCESSO
        );

        return mapper.toResponse(atributo);
    }

    @Transactional
    public AtributoEmpresaResponse revisar(
            UUID id,
            RevisaoAtributoEmpresaRequest request
    ) {
        var autor = suporte.atual();

        suporte.validar(request);

        var atributo = suporte.bloquear(AtributoEmpresa.class, id);

        ServiceSupport.exigir(
                request.statusRevisao() != StatusRevisao.PENDENTE,
                "Escolha aprovar ou rejeitar."
        );

        ServiceSupport.exigir(
                request.statusRevisao() != StatusRevisao.REJEITADO
                        || (
                        request.motivoRevisao() != null
                                && !request.motivoRevisao().isBlank()
                ),
                "Informe o motivo da rejeição."
        );

        if (request.statusRevisao() == StatusRevisao.APROVADO) {
            suporte.fonte(atributo.getFonte().getId());
            suporte.finalidade(atributo.getFinalidade().getId());

            ServiceSupport.exigir(
                    atributo.getValidoAte()
                            .isAfter(OffsetDateTime.now()),
                    "Atributo expirado."
            );
        }

        atributo.setStatusRevisao(request.statusRevisao());
        atributo.setMotivoRevisao(request.motivoRevisao());
        atributo.setRevisadoPor(autor);
        atributo.setRevisadoEm(OffsetDateTime.now());

        auditoria.registrar(
                autor,
                "REVISAR",
                "AtributoEmpresa",
                id,
                ResultadoAuditoria.SUCESSO
        );

        return mapper.toResponse(atributo);
    }
}