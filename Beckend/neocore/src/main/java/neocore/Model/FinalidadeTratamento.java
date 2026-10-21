package neocore.Model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "finalidades_tratamento")
public class FinalidadeTratamento {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "base_legal", length = 100)
    private String baseLegal;

    @Column(name = "referencia_avaliacao", columnDefinition = "TEXT")
    private String referenciaAvaliacao;

    @Column(name = "retencao_dias", nullable = false)
    private Integer retencaoDias;

    @Column(nullable = false)
    private Boolean habilitada = false;

    @Column(name = "criado_em", nullable = false)
    private OffsetDateTime criadoEm;
}
