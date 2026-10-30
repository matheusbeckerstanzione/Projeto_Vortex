package neocore.Service;

import lombok.RequiredArgsConstructor;

import neocore.DTO.campanha.*;
import neocore.Mapper.CampanhaMapper;
import neocore.Model.*;
import neocore.Model.Enum.*;
import neocore.Repository.CampanhaRepository;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CampanhaService {

    private final CampanhaRepository repository;
    private final CampanhaMapper mapper;
    private final ServiceSupport suporte;
    private final AuditoriaService auditoria;

    public CampanhaResponse buscarPorId(UUID id) {
        suporte.atual();

        return mapper.toResponse(
                suporte.obter(Campanha.class, id)
        );
    }

    public Page<CampanhaResponse> listar(int pagina, int tamanho) {
        suporte.atual();

        return repository.findAll(suporte.pagina(pagina, tamanho))
                .map(mapper::toResponse);
    }

    private Segmento verificar(CampanhaRequest request) {
        suporte.validar(request);

        ServiceSupport.dinheiro(request.orcamento());

        ServiceSupport.exigir(
                request.status() == StatusCampanha.RASCUNHO,
                "Use a operação de status para alterar o andamento."
        );

        ServiceSupport.exigir(
                request.inicioEm() == null
                        || request.fimEm() == null
                        || !request.fimEm().isBefore(request.inicioEm()),
                "Fim anterior ao início."
        );

        var segmento = suporte.obter(
                Segmento.class,
                request.segmentoId()
        );

        suporte.finalidade(request.finalidadeId());

        ServiceSupport.exigir(
                segmento.getStatus() == StatusSegmento.ATIVO,
                "Segmento precisa estar ativo."
        );

        ServiceSupport.exigir(
                segmento.getFinalidade().getId()
                        .equals(request.finalidadeId()),
                "Campanha e segmento precisam ter a mesma finalidade."
        );

        return segmento;
    }

    @Transactional
    public CampanhaResponse cadastrar(CampanhaRequest request) {
        var autor = suporte.atual();
        var segmento = verificar(request);

        var campanha = mapper.toEntity(
                request,
                segmento,
                segmento.getFinalidade(),
                autor
        );

        campanha.setCriteriosPublicoSnapshot(
                new LinkedHashMap<>(segmento.getCriterios())
        );

        campanha.setCriadaEm(OffsetDateTime.now());
        campanha = repository.save(campanha);

        auditoria.registrar(
                autor,
                "CADASTRAR",
                "Campanha",
                campanha.getId(),
                ResultadoAuditoria.SUCESSO
        );

        return mapper.toResponse(campanha);
    }

    @Transactional
    public CampanhaResponse atualizar(
            UUID id,
            CampanhaRequest request
    ) {
        var campanha = suporte.bloquear(Campanha.class, id);

        suporte.dono(campanha.getCriadaPor());

        ServiceSupport.exigir(
                campanha.getStatus() == StatusCampanha.RASCUNHO,
                "Edite apenas campanhas em rascunho."
        );

        var segmento = verificar(request);

        mapper.atualizarEntidade(
                request,
                campanha,
                segmento,
                segmento.getFinalidade()
        );

        campanha.setCriteriosPublicoSnapshot(
                new LinkedHashMap<>(segmento.getCriterios())
        );

        auditoria.registrar(
                suporte.atual(),
                "ATUALIZAR",
                "Campanha",
                id,
                ResultadoAuditoria.SUCESSO
        );

        return mapper.toResponse(campanha);
    }

    @Transactional
    public CampanhaResponse alterarStatus(
            UUID id,
            StatusCampanha novo
    ) {
        var campanha = suporte.bloquear(Campanha.class, id);

        suporte.dono(campanha.getCriadaPor());

        var atual = campanha.getStatus();

        boolean permitido = novo != null && (
                (
                        atual == StatusCampanha.RASCUNHO
                                && (
                                novo == StatusCampanha.AGENDADA
                                        || novo == StatusCampanha.CANCELADA
                        )
                )
                        || (
                        atual == StatusCampanha.AGENDADA
                                && (
                                novo == StatusCampanha.EM_ANDAMENTO
                                        || novo == StatusCampanha.CANCELADA
                        )
                )
                        || (
                        atual == StatusCampanha.EM_ANDAMENTO
                                && (
                                novo == StatusCampanha.CONCLUIDA
                                        || novo == StatusCampanha.CANCELADA
                        )
                )
        );

        ServiceSupport.exigir(
                permitido,
                "Transição de campanha inválida."
        );

        if (novo == StatusCampanha.AGENDADA
                || novo == StatusCampanha.EM_ANDAMENTO) {

            suporte.finalidade(campanha.getFinalidade().getId());

            ServiceSupport.exigir(
                    campanha.getSegmento().getStatus()
                            == StatusSegmento.ATIVO,
                    "Segmento inativo."
            );

            ServiceSupport.exigir(
                    campanha.getCriteriosPublicoSnapshot()
                            .equals(campanha.getSegmento().getCriterios()),
                    "Segmento mudou; revise a campanha."
            );

            if (novo == StatusCampanha.AGENDADA) {
                ServiceSupport.exigir(
                        campanha.getInicioEm() != null
                                && campanha.getInicioEm()
                                .isAfter(OffsetDateTime.now()),
                        "Informe início futuro."
                );
            } else {
                ServiceSupport.exigir(
                        campanha.getInicioEm() != null
                                && !campanha.getInicioEm()
                                .isAfter(OffsetDateTime.now()),
                        "Aguarde o horário de início."
                );
            }
        }

        campanha.setStatus(novo);

        auditoria.registrar(
                suporte.atual(),
                "ALTERAR_STATUS",
                "Campanha",
                id,
                ResultadoAuditoria.SUCESSO
        );

        return mapper.toResponse(campanha);
    }
}