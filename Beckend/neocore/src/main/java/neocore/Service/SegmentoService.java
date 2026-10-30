package neocore.Service;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;

import neocore.DTO.segmento.*;
import neocore.DTO.segmentocontato.*;
import neocore.DTO.contato.ContatoResponse;
import neocore.Exception.ConflitoException;
import neocore.Mapper.*;
import neocore.Model.*;
import neocore.Model.Enum.*;
import neocore.Repository.*;

import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SegmentoService {

    private final SegmentoRepository repository;
    private final SegmentoContatoRepository membros;

    private final SegmentoMapper mapper;
    private final SegmentoContatoMapper membroMapper;
    private final ContatoMapper contatoMapper;

    private final ServiceSupport suporte;
    private final CriteriosSegmento criterios;
    private final AuditoriaService auditoria;
    private final EntityManager em;

    public SegmentoResponse buscarPorId(UUID id) {
        suporte.atual();

        return mapper.toResponse(
                suporte.obter(Segmento.class, id)
        );
    }

    public Page<SegmentoResponse> listar(int pagina, int tamanho) {
        suporte.atual();

        return repository.findAll(suporte.pagina(pagina, tamanho))
                .map(mapper::toResponse);
    }

    @Transactional
    public SegmentoResponse cadastrar(SegmentoRequest request) {
        var autor = suporte.atual();

        suporte.validar(request);

        var filtros = criterios.validar(request.criterios());

        ServiceSupport.exigir(
                request.status() == StatusSegmento.RASCUNHO,
                "Crie o segmento como RASCUNHO."
        );

        var segmento = mapper.toEntity(
                request,
                suporte.finalidade(request.finalidadeId()),
                autor
        );

        segmento.setCriterios(filtros);
        segmento.setCriadoEm(OffsetDateTime.now());
        segmento.setAtualizadoEm(segmento.getCriadoEm());

        segmento = repository.save(segmento);

        auditoria.registrar(
                autor,
                "CADASTRAR",
                "Segmento",
                segmento.getId(),
                ResultadoAuditoria.SUCESSO
        );

        return mapper.toResponse(segmento);
    }

    @Transactional
    public SegmentoResponse atualizar(
            UUID id,
            SegmentoRequest request
    ) {
        suporte.validar(request);

        var segmento = suporte.bloquear(Segmento.class, id);

        suporte.dono(segmento.getCriadoPor());

        ServiceSupport.exigir(
                segmento.getStatus() == StatusSegmento.RASCUNHO
                        && request.status() == StatusSegmento.RASCUNHO,
                "Edite apenas segmentos em rascunho."
        );

        var filtros = criterios.validar(request.criterios());

        boolean mudou = !filtros.equals(segmento.getCriterios())
                || !request.finalidadeId()
                .equals(segmento.getFinalidade().getId());

        mapper.atualizarEntidade(
                request,
                segmento,
                suporte.finalidade(request.finalidadeId())
        );

        segmento.setCriterios(filtros);
        segmento.setAtualizadoEm(OffsetDateTime.now());

        if (mudou) {
            limparMembros(id);
        }

        auditoria.registrar(
                suporte.atual(),
                "ATUALIZAR",
                "Segmento",
                id,
                ResultadoAuditoria.SUCESSO
        );

        return mapper.toResponse(segmento);
    }

    public Page<ContatoResponse> previa(
            UUID id,
            int pagina,
            int tamanho
    ) {
        suporte.atual();

        var pageable = suporte.pagina(pagina, tamanho);
        var segmento = suporte.obter(Segmento.class, id);

        UUID finalidadeId = segmento.getFinalidade().getId();

        suporte.finalidade(finalidadeId);

        long offset = pageable.getOffset();

        ServiceSupport.exigir(
                offset <= Integer.MAX_VALUE,
                "Página excede o limite."
        );

        var lista = criterios.buscar(
                        segmento.getCriterios(),
                        finalidadeId,
                        (int) offset,
                        tamanho
                )
                .stream()
                .map(contatoMapper::toResponse)
                .toList();

        return new PageImpl<>(
                lista,
                pageable,
                criterios.contar(
                        segmento.getCriterios(),
                        finalidadeId
                )
        );
    }

    @Transactional(isolation = Isolation.REPEATABLE_READ)
    public long recalcular(UUID id) {
        var segmento = suporte.bloquear(Segmento.class, id);

        suporte.dono(segmento.getCriadoPor());

        ServiceSupport.exigir(
                segmento.getStatus() == StatusSegmento.RASCUNHO,
                "Recalcule o segmento em rascunho."
        );

        UUID finalidadeId = segmento.getFinalidade().getId();

        suporte.finalidade(finalidadeId);

        long total = criterios.contar(
                segmento.getCriterios(),
                finalidadeId
        );

        ServiceSupport.exigir(
                total <= 10000,
                "Recálculo limitado a 10.000 contatos; refine os filtros."
        );

        limparMembros(id);

        long incluidos = 0;

        for (int offset = 0; offset < total; offset += 100) {
            var contatos = criterios.buscar(
                    segmento.getCriterios(),
                    finalidadeId,
                    offset,
                    100
            );

            for (var contato : contatos) {
                var membro = new SegmentoContato();

                membro.setSegmento(segmento);
                membro.setContato(contato);
                membro.setMotivoInclusao(
                        "Corresponde aos critérios cadastrais do segmento."
                );
                membro.setAvaliadoEm(OffsetDateTime.now());

                membros.save(membro);
                incluidos++;
            }

            em.flush();
        }

        segmento.setAtualizadoEm(OffsetDateTime.now());

        auditoria.registrar(
                suporte.atual(),
                "RECALCULAR",
                "Segmento",
                id,
                ResultadoAuditoria.SUCESSO
        );

        return incluidos;
    }

    @Transactional
    public SegmentoContatoResponse associar(
            SegmentoContatoRequest request
    ) {
        suporte.validar(request);

        var segmento = suporte.bloquear(
                Segmento.class,
                request.segmentoId()
        );

        suporte.dono(segmento.getCriadoPor());

        ServiceSupport.exigir(
                segmento.getStatus() == StatusSegmento.RASCUNHO,
                "Altere a composição em rascunho."
        );

        suporte.finalidade(segmento.getFinalidade().getId());

        var contato = suporte.obter(
                Contato.class,
                request.contatoId()
        );

        ServiceSupport.exigir(
                criterios.corresponde(contato, segmento),
                "Contato não atende aos critérios ou possui restrição."
        );

        if (membros.existsBySegmentoIdAndContatoId(
                segmento.getId(),
                contato.getId()
        )) {
            throw new ConflitoException("Contato já associado.");
        }

        var membro = membroMapper.toEntity(
                request,
                segmento,
                contato
        );

        membro.setAvaliadoEm(OffsetDateTime.now());

        auditoria.registrar(
                suporte.atual(),
                "ASSOCIAR_CONTATO",
                "Segmento",
                segmento.getId(),
                ResultadoAuditoria.SUCESSO
        );

        return membroMapper.toResponse(membros.save(membro));
    }

    @Transactional
    public void removerContato(
            UUID segmentoId,
            UUID contatoId
    ) {
        var segmento = suporte.bloquear(
                Segmento.class,
                segmentoId
        );

        suporte.dono(segmento.getCriadoPor());

        ServiceSupport.exigir(
                segmento.getStatus() == StatusSegmento.RASCUNHO,
                "Altere a composição em rascunho."
        );

        membros.deleteBySegmentoIdAndContatoId(
                segmentoId,
                contatoId
        );

        auditoria.registrar(
                suporte.atual(),
                "REMOVER_CONTATO",
                "Segmento",
                segmentoId,
                ResultadoAuditoria.SUCESSO
        );
    }

    @Transactional
    public SegmentoResponse alterarStatus(
            UUID id,
            StatusSegmento status
    ) {
        var segmento = suporte.bloquear(Segmento.class, id);

        suporte.dono(segmento.getCriadoPor());

        ServiceSupport.exigir(
                status != null
                        && segmento.getStatus() != StatusSegmento.ARQUIVADO,
                "Transição inválida."
        );

        if (status == StatusSegmento.ATIVO) {
            suporte.finalidade(segmento.getFinalidade().getId());
        }

        segmento.setStatus(status);
        segmento.setAtualizadoEm(OffsetDateTime.now());

        auditoria.registrar(
                suporte.atual(),
                "ALTERAR_STATUS",
                "Segmento",
                id,
                ResultadoAuditoria.SUCESSO
        );

        return mapper.toResponse(segmento);
    }

    private void limparMembros(UUID segmentoId) {
        em.createQuery(
                        """
                        delete from SegmentoContato m
                        where m.segmento.id = :id
                        """
                )
                .setParameter("id", segmentoId)
                .executeUpdate();
    }
}