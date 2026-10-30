package neocore.Service;

import lombok.RequiredArgsConstructor;

import neocore.DTO.interacaocontato.*;
import neocore.Exception.ConflitoException;
import neocore.Mapper.InteracaoContatoMapper;
import neocore.Model.*;
import neocore.Model.Enum.*;
import neocore.Repository.InteracaoContatoRepository;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InteracaoContatoService {

    private final InteracaoContatoRepository repository;
    private final InteracaoContatoMapper mapper;
    private final ServiceSupport suporte;
    private final AuditoriaService auditoria;

    public Page<InteracaoContatoResponse> listar(
            int pagina,
            int tamanho
    ) {
        suporte.atual();

        return repository.findAll(suporte.pagina(pagina, tamanho))
                .map(mapper::toResponse);
    }

    @Transactional
    public InteracaoContatoResponse registrar(
            InteracaoContatoRequest request
    ) {
        var autor = suporte.atual();

        suporte.validar(request);

        var fonte = suporte.fonte(request.fonteId());
        var finalidade = suporte.finalidade(request.finalidadeId());

        ServiceSupport.exigir(
                !request.ocorridoEm().isAfter(OffsetDateTime.now()),
                "Interação não pode ocorrer no futuro."
        );

        var contato = suporte.obter(
                Contato.class,
                request.contatoId()
        );

        ServiceSupport.exigir(
                fonte.getEmpresa() == null
                        || fonte.getEmpresa().getId()
                        .equals(contato.getEmpresa().getId()),
                "Fonte pertence a outra empresa."
        );

        suporte.permitir(
                request.contatoId(),
                request.finalidadeId(),
                EscopoRestricao.ENRIQUECIMENTO,
                null
        );

        Campanha campanha = request.campanhaId() == null
                ? null
                : suporte.obter(Campanha.class, request.campanhaId());

        if (campanha != null) {
            ServiceSupport.exigir(
                    campanha.getFinalidade().getId()
                            .equals(finalidade.getId()),
                    "Finalidade diferente da campanha."
            );

            suporte.permitir(
                    request.contatoId(),
                    request.finalidadeId(),
                    EscopoRestricao.CAMPANHA,
                    campanha.getCanal()
            );
        }

        if (repository.existsByFonteIdAndIdentificadorOrigem(
                request.fonteId(),
                request.identificadorOrigem()
        )) {
            throw new ConflitoException(
                    "Interação já registrada nesta fonte."
            );
        }

        var interacao = mapper.toEntity(
                request,
                contato,
                campanha,
                fonte,
                finalidade
        );

        interacao.setCriadoEm(OffsetDateTime.now());
        interacao = repository.save(interacao);

        auditoria.registrar(
                autor,
                "REGISTRAR",
                "InteracaoContato",
                interacao.getId(),
                ResultadoAuditoria.SUCESSO
        );

        return mapper.toResponse(interacao);
    }
}