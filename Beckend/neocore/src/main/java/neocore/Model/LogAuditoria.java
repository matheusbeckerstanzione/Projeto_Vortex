package neocore.Model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import neocore.Model.Enum.ResultadoAuditoria;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "logs_auditoria")
public class LogAuditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @Column(nullable = false, length = 60)
    private String acao;

    @Column(name = "tipo_recurso", nullable = false, length = 40)
    private String tipoRecurso;

    @Column(name = "recurso_id")
    private UUID recursoId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ResultadoAuditoria resultado;

    @Column(name = "ocorrido_em", nullable = false)
    private OffsetDateTime ocorridoEm;
}
