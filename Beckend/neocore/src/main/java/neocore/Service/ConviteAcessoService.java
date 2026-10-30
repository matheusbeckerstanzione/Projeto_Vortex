package neocore.Service;

import lombok.RequiredArgsConstructor;

import neocore.DTO.conviteacesso.*;
import neocore.DTO.usuario.UsuarioResponse;
import neocore.Exception.RegraNegocioException;
import neocore.Mapper.*;
import neocore.Model.*;
import neocore.Model.Enum.*;
import neocore.Repository.ConviteAcessoRepository;
import neocore.Security.TokenStore;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ConviteAcessoService {

    private final ConviteAcessoRepository repository;
    private final ConviteAcessoMapper mapper;
    private final UsuarioMapper usuarioMapper;
    private final ServiceSupport suporte;
    private final PasswordEncoder encoder;
    private final AuditoriaService auditoria;

    public record ConviteCriado(
            ConviteAcessoResponse convite,
            String token
    ) {
    }

    @Transactional
    public ConviteCriado criar(CriacaoConviteRequest request) {
        var autor = suporte.admin();

        suporte.validar(request);

        var usuario = suporte.bloquear(
                Usuario.class,
                request.usuarioId()
        );

        ServiceSupport.exigir(
                usuario.getStatus() == StatusUsuario.CONVIDADO,
                "Usuário não aguarda convite."
        );

        ServiceSupport.exigir(
                !request.expiraEm()
                        .isAfter(OffsetDateTime.now().plusDays(7)),
                "Convite deve expirar em até sete dias."
        );

        repository.findAllByUsuarioId(usuario.getId())
                .stream()
                .filter(convite ->
                        convite.getUtilizadoEm() == null
                                && convite.getRevogadoEm() == null
                )
                .forEach(convite ->
                        convite.setRevogadoEm(OffsetDateTime.now())
                );

        String token = TokenStore.aleatorio();

        var convite = mapper.toEntity(request, usuario, autor);

        convite.setTokenHash(TokenStore.hash(token));
        convite.setCriadoEm(OffsetDateTime.now());

        convite = repository.save(convite);

        auditoria.registrar(
                autor,
                "CRIAR_CONVITE",
                "ConviteAcesso",
                convite.getId(),
                ResultadoAuditoria.SUCESSO
        );

        return new ConviteCriado(
                mapper.toResponse(convite),
                token
        );
    }

    @Transactional
    public UsuarioResponse ativar(AtivacaoContaRequest request) {
        suporte.validar(request);

        ServiceSupport.exigir(
                request.senha()
                        .getBytes(StandardCharsets.UTF_8).length <= 72,
                "Senha excede 72 bytes."
        );

        var convite = repository.findByTokenHash(
                        TokenStore.hash(request.token())
                )
                .orElseThrow(() ->
                        new RegraNegocioException(
                                "Convite inválido ou expirado."
                        )
                );

        var usuario = suporte.bloquear(
                Usuario.class,
                convite.getUsuario().getId()
        );

        convite = suporte.bloquear(
                ConviteAcesso.class,
                convite.getId()
        );

        ServiceSupport.exigir(
                convite.getUtilizadoEm() == null
                        && convite.getRevogadoEm() == null
                        && convite.getExpiraEm()
                        .isAfter(OffsetDateTime.now())
                        && usuario.getStatus() == StatusUsuario.CONVIDADO,
                "Convite inválido ou expirado."
        );

        usuario.setSenhaHash(encoder.encode(request.senha()));
        usuario.setStatus(StatusUsuario.ATIVO);
        usuario.setAtivadoEm(OffsetDateTime.now());
        usuario.setAtualizadoEm(usuario.getAtivadoEm());

        convite.setUtilizadoEm(usuario.getAtivadoEm());

        auditoria.registrar(
                usuario,
                "ATIVAR_CONTA",
                "Usuario",
                usuario.getId(),
                ResultadoAuditoria.SUCESSO
        );

        return usuarioMapper.toResponse(usuario);
    }

    @Transactional
    public void revogar(UUID id) {
        var autor = suporte.admin();

        var convite = suporte.obter(ConviteAcesso.class, id);

        suporte.bloquear(
                Usuario.class,
                convite.getUsuario().getId()
        );

        convite = suporte.bloquear(ConviteAcesso.class, id);

        ServiceSupport.exigir(
                convite.getUtilizadoEm() == null,
                "Convite já utilizado."
        );

        convite.setRevogadoEm(OffsetDateTime.now());

        auditoria.registrar(
                autor,
                "REVOGAR_CONVITE",
                "ConviteAcesso",
                id,
                ResultadoAuditoria.SUCESSO
        );
    }

    public ConviteAcessoResponse buscarPorId(UUID id) {
        suporte.admin();

        return mapper.toResponse(
                suporte.obter(ConviteAcesso.class, id)
        );
    }
}