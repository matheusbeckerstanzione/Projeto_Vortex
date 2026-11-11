package neocore.Model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import neocore.DTO.sinais.SinaisGitHubResponse;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "empresa_github")
public class EmpresaGitHub {

    @Id
    @Column(name = "empresa_id")
    private UUID empresaId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @Version
    @Column(nullable = false)
    private Long versao;

    @Column(name = "organizacao_id", nullable = false)
    private Long organizacaoId;

    @Column(nullable = false, length = 39)
    private String organizacao;

    @Column(
            name = "referencia_vinculo",
            nullable = false,
            columnDefinition = "TEXT"
    )
    private String referenciaVinculo;

    @Column(
            name = "justificativa_vinculo",
            nullable = false,
            length = 500
    )
    private String justificativaVinculo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "confirmado_por", nullable = false)
    private Usuario confirmadoPor;

    @Column(name = "confirmado_em", nullable = false)
    private Instant confirmadoEm;

    @Column(nullable = false)
    private boolean ativo;

    @Column(name = "consultado_em")
    private Instant consultadoEm;

    @Column(name = "valido_ate")
    private Instant validoAte;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private SinaisGitHubResponse amostra;

    @ElementCollection
    @CollectionTable(
            name = "empresa_github_linguagens",
            joinColumns = @JoinColumn(name = "empresa_id")
    )
    @Column(
            name = "linguagem",
            nullable = false,
            length = 100
    )
    private Set<String> linguagens = new HashSet<>();
}