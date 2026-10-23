package neocore.Model;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import neocore.Model.Enum.PerfilUsuario;
import neocore.Model.Enum.StatusUsuario;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(nullable = false, unique = true, length = 254)
    private String email;

    @Column(name = "senha_hash", columnDefinition = "TEXT")
    private String senhaHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PerfilUsuario perfil;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusUsuario status;

    @Column(name = "ultimo_contador_mfa", nullable = false)
    private Long ultimoContadorMfa = 0L;

    @Column(name = "tentativas_login", nullable = false)
    private Integer tentativasLogin = 0;

    @Column(name = "criado_em", nullable = false)
    private OffsetDateTime criadoEm;

    @Column(name = "ativado_em")
    private OffsetDateTime ativadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private OffsetDateTime atualizadoEm;


    @Column(name = "segredo_mfa_criptografado", columnDefinition = "TEXT")
    private String segredoMfaCriptografado;

    @Column(name = "bloqueado_ate")
    private OffsetDateTime bloqueadoAte;

    @Column(name = "versao_acesso", nullable = false)
    private Integer versaoAcesso = 0;


}
