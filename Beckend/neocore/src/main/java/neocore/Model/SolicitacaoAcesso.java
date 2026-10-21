package neocore.Model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import neocore.Model.Enum.StatusSolicitacao;
;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "solicitacoes_acesso")
public class SolicitacaoAcesso {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(nullable = false, length = 254)
    private String email;

    @Column(nullable = false, length = 500)
    private String justificativa;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusSolicitacao status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "avaliado_por")
    private Usuario avaliadoPor;

    @Column(name = "solicitado_em", nullable = false)
    private OffsetDateTime solicitadoEm;

    @Column(name = "avaliado_em")
    private OffsetDateTime avaliadoEm;
}
