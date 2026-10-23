package neocore.Model;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import neocore.Model.Enum.StatusTarefa;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "tarefas_coleta")
public class TarefaColeta {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pesquisa_id", nullable = false)
    private PesquisaEnriquecimento pesquisa;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "fonte_id", nullable = false)
    private FonteDados fonte;

    @Column(name = "url_pagina", nullable = false, columnDefinition = "TEXT")
    private String urlPagina;

    @Column(name = "chave_idempotencia", nullable = false, unique = true, length = 160)
    private String chaveIdempotencia;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusTarefa status;

    @Column(nullable = false)
    private Integer tentativas = 0;

    @Column(name = "disponivel_em", nullable = false)
    private OffsetDateTime disponivelEm;

    @Column(name = "reservada_em")
    private OffsetDateTime reservadaEm;

    @Column(name = "codigo_erro", length = 60)
    private String codigoErro;

    @Column(name = "criada_em", nullable = false)
    private OffsetDateTime criadaEm;

    @Column(name = "finalizada_em")
    private OffsetDateTime finalizadaEm;
}
