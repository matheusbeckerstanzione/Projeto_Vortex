package neocore.Model;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import neocore.Model.Enum.CanalCampanha;
import neocore.Model.Enum.StatusCampanha;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "campanhas")
public class Campanha {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "segmento_id", nullable = false)
    private Segmento segmento;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "finalidade_id", nullable = false)
    private FinalidadeTratamento finalidade;

    @Column(nullable = false, length = 160)
    private String nome;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String objetivo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CanalCampanha canal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusCampanha status;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "criterios_publico_snapshot", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> criteriosPublicoSnapshot = new HashMap<>();

    @Column(precision = 12, scale = 2)
    private BigDecimal orcamento;

    @Column(name = "inicio_em")
    private OffsetDateTime inicioEm;

    @Column(name = "fim_em")
    private OffsetDateTime fimEm;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "criada_por", nullable = false)
    private Usuario criadaPor;

    @Column(name = "criada_em", nullable = false)
    private OffsetDateTime criadaEm;
}
