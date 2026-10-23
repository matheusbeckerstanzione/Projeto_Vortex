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
@Table(
        name = "segmento_contatos",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_segmento_contato",
                        columnNames = {"segmento_id", "contato_id"}
                )
        }
)
public class SegmentoContato {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "segmento_id", nullable = false)
    private Segmento segmento;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contato_id", nullable = false)
    private Contato contato;

    @Column(name = "motivo_inclusao", nullable = false, columnDefinition = "TEXT")
    private String motivoInclusao;

    @Column(name = "avaliado_em", nullable = false)
    private OffsetDateTime avaliadoEm;
}
