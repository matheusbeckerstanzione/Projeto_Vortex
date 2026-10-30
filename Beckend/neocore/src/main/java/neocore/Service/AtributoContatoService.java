package neocore.Service;

import lombok.RequiredArgsConstructor;

import neocore.DTO.atributocontato.*;
import neocore.Mapper.AtributoContatoMapper;
import neocore.Model.*;
import neocore.Model.Enum.*;
import neocore.Repository.AtributoContatoRepository;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AtributoContatoService {

    private final AtributoContatoRepository repository;
    private final AtributoContatoMapper mapper;
    private final ServiceSupport suporte;
    private final AuditoriaService auditoria;

    public AtributoContatoResponse buscarPorId(UUID id) {
        suporte.atual();

        return mapper.toResponse(
                suporte.obter(AtributoContato.class, id)
        );
    }

    public Page<AtributoContatoResponse> listar(
            int pagina,
            int tamanho
    ) {
        suporte.atual();

        return repository.findAll(suporte.pagina(pagina, tamanho))
                .map(mapper::toResponse);
    }

    @Transactional
    public AtributoContatoResponse cadastrar(
            AtributoContatoRequest request
    ) {
        var autor = suporte.atual();

        suporte.validar(request);

        var fonte = suporte.fonte(request.fonteId());
        var finalidade = suporte.finalidade(request.finalidadeId());

        suporte.retencao(request.validoAte(), finalidade);

        suporte.permitir(
                request.contatoId(),
                request.finalidadeId(),
                EscopoRestricao.ENRIQUECIMENTO,
                null
        );

        var atributo = mapper.toEntity(
                request,
                suporte.obter(Contato.class, request.contatoId()),
                fonte,
                finalidade
        );

        ServiceSupport.exigir(
                fonte.getEmpresa() == null
                        || fonte.getEmpresa().getId().equals(
                        atributo.getContato().getEmpresa().getId()
                ),
                "Fonte pertence a outra empresa."
        );

        atributo.setStatusRevisao(StatusRevisao.PENDENTE);
        atributo.setColetadoEm(OffsetDateTime.now());

        atributo = repository.save(atributo);

        auditoria.registrar(
                autor,
                "CADASTRAR",
                "AtributoContato",
                atributo.getId(),
                ResultadoAuditoria.SUCESSO
        );

        return mapper.toResponse(atributo);
    }

    @Transactional
    public AtributoContatoResponse revisar(
            UUID id,
            RevisaoAtributoContatoRequest request
    ) {
        var autor = suporte.atual();

        suporte.validar(request);

        var atributo = suporte.bloquear(AtributoContato.class, id);

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
            suporte.fonte(atributo.getFonteDados().getId());
            suporte.finalidade(atributo.getFinalidade().getId());

            ServiceSupport.exigir(
                    atributo.getValidoAte()
                            .isAfter(OffsetDateTime.now()),
                    "Atributo expirado."
            );

            suporte.permitir(
                    atributo.getContato().getId(),
                    atributo.getFinalidade().getId(),
                    EscopoRestricao.ENRIQUECIMENTO,
                    null
            );
        }

        atributo.setStatusRevisao(request.statusRevisao());
        atributo.setMotivoRevisao(request.motivoRevisao());
        atributo.setRevisadoPor(autor);
        atributo.setRevisadoEm(OffsetDateTime.now());

        auditoria.registrar(
                autor,
                "REVISAR",
                "AtributoContato",
                id,
                ResultadoAuditoria.SUCESSO
        );

        return mapper.toResponse(atributo);
    }
}