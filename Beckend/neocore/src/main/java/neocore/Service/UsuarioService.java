package neocore.Service;

import lombok.RequiredArgsConstructor;

import neocore.DTO.usuario.*;
import neocore.Exception.ConflitoException;
import neocore.Mapper.UsuarioMapper;
import neocore.Model.Usuario;
import neocore.Model.Enum.*;
import neocore.Repository.UsuarioRepository;
import neocore.Security.TokenStore;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UsuarioService {

    private final UsuarioRepository repository;
    private final UsuarioMapper mapper;
    private final ServiceSupport suporte;
    private final TokenStore tokens;
    private final AuditoriaService auditoria;

    public UsuarioResponse buscarPorId(UUID id) {
        var usuario = suporte.obter(Usuario.class, id);

        suporte.dono(usuario);

        return mapper.toResponse(usuario);
    }

    public Page<UsuarioResponse> listar(int pagina, int tamanho) {
        suporte.admin();

        return repository.findAll(suporte.pagina(pagina, tamanho))
                .map(mapper::toResponse);
    }

    @Transactional
    public UsuarioResponse cadastrar(
            UsuarioCadastroRequest request
    ) {
        var autor = suporte.admin();

        suporte.validar(request);

        if (suporte.duplicado(
                Usuario.class,
                "email",
                ServiceSupport.email(request.email()),
                null
        )) {
            throw new ConflitoException("E-mail já cadastrado.");
        }

        var usuario = mapper.toEntity(request);

        usuario.setEmail(ServiceSupport.email(request.email()));
        usuario.setStatus(StatusUsuario.CONVIDADO);
        usuario.setCriadoEm(OffsetDateTime.now());
        usuario.setAtualizadoEm(usuario.getCriadoEm());

        usuario = repository.save(usuario);

        auditoria.registrar(
                autor,
                "CADASTRAR",
                "Usuario",
                usuario.getId(),
                ResultadoAuditoria.SUCESSO
        );

        return mapper.toResponse(usuario);
    }

    @Transactional
    public UsuarioResponse atualizar(
            UUID id,
            UsuarioAtualizacaoRequest request
    ) {
        var autor = suporte.admin();

        suporte.validar(request);

        var usuario = suporte.bloquear(Usuario.class, id);

        if (suporte.duplicado(
                Usuario.class,
                "email",
                ServiceSupport.email(request.email()),
                id
        )) {
            throw new ConflitoException("E-mail já cadastrado.");
        }

        ServiceSupport.exigir(
                usuario.getStatus() == StatusUsuario.CONVIDADO
                        || usuario.getEmail()
                        .equalsIgnoreCase(request.email().strip()),
                "Conta ativada exige verificação para trocar e-mail."
        );

        mapper.atualizarEntidade(request, usuario);

        usuario.setEmail(ServiceSupport.email(request.email()));
        usuario.setAtualizadoEm(OffsetDateTime.now());

        auditoria.registrar(
                autor,
                "ATUALIZAR",
                "Usuario",
                id,
                ResultadoAuditoria.SUCESSO
        );

        return mapper.toResponse(usuario);
    }

    @Transactional
    public UsuarioResponse alterarStatus(
            UUID id,
            UsuarioAlteracaoStatusRequest request
    ) {
        var autor = suporte.admin();

        suporte.validar(request);

        var usuario = suporte.bloquear(Usuario.class, id);

        ServiceSupport.exigir(
                !autor.getId().equals(id),
                "Não é permitido alterar o próprio status."
        );

        ServiceSupport.exigir(
                request.status() != StatusUsuario.CONVIDADO,
                "Não é permitido retornar uma conta ao convite."
        );

        if (request.status() == StatusUsuario.ATIVO) {
            ServiceSupport.exigir(
                    usuario.getAtivadoEm() != null
                            && usuario.getSenhaHash() != null,
                    "Ative a conta por convite primeiro."
            );
        }

        usuario.setStatus(request.status());

        usuario.setVersaoAcesso(
                Math.addExact(usuario.getVersaoAcesso(), 1)
        );

        usuario.setAtualizadoEm(OffsetDateTime.now());

        tokens.revogar(id);

        auditoria.registrar(
                autor,
                "ALTERAR_STATUS",
                "Usuario",
                id,
                ResultadoAuditoria.SUCESSO
        );

        return mapper.toResponse(usuario);
    }
}