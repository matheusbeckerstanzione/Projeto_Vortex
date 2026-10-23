package neocore.Model;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "resultados_campanha")
public class ResultadoCampanha {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "campanha_id", nullable = false)
    private Campanha campanha;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "fonte_id", nullable = false)
    private FonteDados fonte;

    @Column(nullable = false, length = 50)
    private String variante;

    @Column(name = "periodo_inicio", nullable = false)
    private LocalDate periodoInicio;

    @Column(name = "periodo_fim", nullable = false)
    private LocalDate periodoFim;

    @Column(nullable = false)
    private Integer envios;

    @Column(nullable = false)
    private Integer entregues;

    @Column(nullable = false)
    private Integer cliques;

    @Column(nullable = false)
    private Integer conversoes;

    @Column(precision = 12, scale = 2)
    private BigDecimal custo;

    @Column(precision = 12, scale = 2)
    private BigDecimal receita;

    @Column(name = "registrado_em", nullable = false)
    private OffsetDateTime registradoEm;
}
