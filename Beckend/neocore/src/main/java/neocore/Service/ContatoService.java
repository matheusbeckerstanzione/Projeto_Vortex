package neocore.Service;

import lombok.RequiredArgsConstructor;

import neocore.DTO.contato.*;
import neocore.Mapper.ContatoMapper;
import neocore.Model.*;
import neocore.Model.Enum.ResultadoAuditoria;
import neocore.Repository.ContatoRepository;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ContatoService {

    private final ContatoRepository repository;
    private final ContatoMapper mapper;
    private final ServiceSupport suporte;
    private final AuditoriaService auditoria;

    public ContatoResponse buscarPorId(UUID id) {
        suporte.atual();

        return mapper.toResponse(
                suporte.obter(Contato.class, id)
        );
    }

    public Page<ContatoResponse> listar(int pagina, int tamanho) {
        suporte.atual();

        return repository.findAll(suporte.pagina(pagina, tamanho))
                .map(mapper::toResponse);
    }

    @Transactional
    public ContatoResponse cadastrar(ContatoRequest request) {
        suporte.atual();
        suporte.validar(request);

        var empresa = suporte.obter(
                Empresa.class,
                request.empresaId()
        );

        var contato = mapper.toEntity(request, empresa);

        contato.setCriadoEm(OffsetDateTime.now());
        contato.setAtualizadoEm(contato.getCriadoEm());

        contato = repository.save(contato);

        auditoria.registrar(
                suporte.atual(),
                "CADASTRAR",
                "Contato",
                contato.getId(),
                ResultadoAuditoria.SUCESSO
        );

        return mapper.toResponse(contato);
    }

    @Transactional
    public ContatoResponse atualizar(
            UUID id,
            ContatoRequest request
    ) {
        suporte.atual();
        suporte.validar(request);

        var contato = suporte.bloquear(Contato.class, id);

        ServiceSupport.exigir(
                contato.getEmpresa().getId()
                        .equals(request.empresaId()),
                "Não é permitido transferir um contato entre empresas."
        );

        mapper.atualizarEntidade(
                request,
                contato,
                suporte.obter(Empresa.class, request.empresaId())
        );

        contato.setAtualizadoEm(OffsetDateTime.now());

        auditoria.registrar(
                suporte.atual(),
                "ATUALIZAR",
                "Contato",
                id,
                ResultadoAuditoria.SUCESSO
        );

        return mapper.toResponse(contato);
    }
}