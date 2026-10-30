package neocore.Config;

import neocore.Repository.UsuarioRepository;
import neocore.Security.*;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SegurancaConfig {

    @Bean
    public PasswordEncoder passwordEncoder(
            @Value("${neocore.seguranca.senhas-bloqueadas:}")
            String arquivo,

            @Value("${neocore.seguranca.exigir-lista-senhas:true}")
            boolean exigirLista) {

        return new SenhaSeguraEncoder(arquivo, exigirLista);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${neocore.seguranca.cors-origins:}")
            String origens) {

        var configuracao = new CorsConfiguration();

        List<String> permitidas = Arrays.stream(origens.split(","))
                .map(String::strip)
                .filter(origem -> !origem.isEmpty())
                .toList();

        if (permitidas.stream().anyMatch(origem -> origem.contains("*"))) {
            throw new IllegalStateException(
                    "Configure origens CORS explícitas."
            );
        }

        configuracao.setAllowedOrigins(permitidas);

        configuracao.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "PATCH",
                        "DELETE",
                        "OPTIONS"
                )
        );

        configuracao.setAllowedHeaders(
                List.of(
                        "Authorization",
                        "Content-Type",
                        "Accept"
                )
        );

        configuracao.setExposedHeaders(
                List.of(
                        "Content-Disposition",
                        "Retry-After"
                )
        );

        configuracao.setAllowCredentials(false);
        configuracao.setMaxAge(3600L);

        var source = new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuracao
        );

        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            TokenStore tokens,
            UsuarioRepository usuarios,
            LimitadorRequisicoes limitador,

            @Qualifier("corsConfigurationSource")
            CorsConfigurationSource cors,

            @Value("${neocore.seguranca.exigir-https:true}")
            boolean exigirHttps) throws Exception {

        if (exigirHttps) {
            http.redirectToHttps(Customizer.withDefaults());
        }

        http
                .cors(config -> config.configurationSource(cors))

                // Exclusivamente Bearer no header.
                // Não reutilizar esta dispensa com autenticação por cookie.
                .csrf(config -> config.disable())

                .sessionManagement(config ->
                        config.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .formLogin(config -> config.disable())
                .httpBasic(config -> config.disable())
                .logout(config -> config.disable())
                .requestCache(config -> config.disable())

                .headers(headers -> headers
                        .frameOptions(frame -> frame.deny())

                        .contentSecurityPolicy(csp ->
                                csp.policyDirectives(
                                        "default-src 'none'; "
                                                + "frame-ancestors 'none'; "
                                                + "base-uri 'none'; "
                                                + "form-action 'none'"
                                )
                        )

                        .referrerPolicy(referrer ->
                                referrer.policy(
                                        ReferrerPolicyHeaderWriter
                                                .ReferrerPolicy.NO_REFERRER
                                )
                        )

                        .permissionsPolicyHeader(policy ->
                                policy.policy(
                                        "camera=(), microphone=(), geolocation=()"
                                )
                        )

                        .httpStrictTransportSecurity(hsts ->
                                hsts.maxAgeInSeconds(31536000)
                                        .includeSubDomains(false)
                                        .preload(false)
                        )
                )

                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint(
                                (request, response, exception) ->
                                        RespostaSeguranca.enviar(
                                                response,
                                                401
                                        )
                        )

                        .accessDeniedHandler(
                                (request, response, exception) ->
                                        RespostaSeguranca.enviar(
                                                response,
                                                403
                                        )
                        )
                )

                .authorizeHttpRequests(rotas -> rotas

                        // Rotas públicas: somente estes POSTs.
                        .requestMatchers(
                                HttpMethod.POST,
                                "/autenticacao/login",
                                "/autenticacao/mfa/configuracao",
                                "/autenticacao/mfa/confirmar",
                                "/convites/ativar",
                                "/solicitacoes-acesso"
                        ).permitAll()

                        // O service confere se é o próprio usuário ou admin.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/usuarios/{id}"
                        ).hasAnyRole(
                                "ADMINISTRADOR",
                                "ANALISTA"
                        )

                        // Operações administrativas.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/usuarios",
                                "/convites/{id}",
                                "/solicitacoes-acesso",
                                "/tarefas-coleta",
                                "/auditoria"
                        ).hasRole("ADMINISTRADOR")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/usuarios",
                                "/convites",
                                "/fontes-dados",
                                "/finalidades-tratamento",
                                "/tarefas-coleta",
                                "/importacoes/cnpj"
                        ).hasRole("ADMINISTRADOR")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/usuarios/{id}",
                                "/fontes-dados/{id}",
                                "/finalidades-tratamento/{id}"
                        ).hasRole("ADMINISTRADOR")

                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/usuarios/{id}/status",
                                "/convites/{id}/revogacao",
                                "/solicitacoes-acesso/{id}/avaliacao",
                                "/tarefas-coleta/{id}/cancelamento",
                                "/restricoes-uso/{id}/encerramento",
                                "/revisoes-atributos/contatos/{id}",
                                "/revisoes-atributos/empresas/{id}"
                        ).hasRole("ADMINISTRADOR")

                        // Consultas da equipe.
                        .requestMatchers(
                                HttpMethod.GET,
                                "/empresas",
                                "/empresas/{id}",
                                "/contatos",
                                "/contatos/{id}",
                                "/fontes-dados",
                                "/fontes-dados/{id}",
                                "/finalidades-tratamento",
                                "/finalidades-tratamento/{id}",
                                "/atributos-contato",
                                "/atributos-contato/{id}",
                                "/atributos-empresa",
                                "/atributos-empresa/{id}",
                                "/pesquisas-enriquecimento",
                                "/segmentos",
                                "/segmentos/{id}",
                                "/segmentos/{id}/previa",
                                "/campanhas",
                                "/campanhas/{id}",
                                "/interacoes-contato",
                                "/resultados-campanha",
                                "/restricoes-uso",
                                "/exportacoes/segmentos/{id}"
                        ).hasAnyRole(
                                "ADMINISTRADOR",
                                "ANALISTA"
                        )

                        .requestMatchers(
                                HttpMethod.POST,
                                "/autenticacao/logout",
                                "/empresas",
                                "/contatos",
                                "/atributos-contato",
                                "/atributos-empresa",
                                "/pesquisas-enriquecimento",
                                "/segmentos",
                                "/segmentos/{id}/recalculo",
                                "/segmento-contatos",
                                "/campanhas",
                                "/interacoes-contato",
                                "/resultados-campanha",
                                "/restricoes-uso"
                        ).hasAnyRole(
                                "ADMINISTRADOR",
                                "ANALISTA"
                        )

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/empresas/{id}",
                                "/contatos/{id}",
                                "/segmentos/{id}",
                                "/campanhas/{id}"
                        ).hasAnyRole(
                                "ADMINISTRADOR",
                                "ANALISTA"
                        )

                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/pesquisas-enriquecimento/{id}/cancelamento",
                                "/segmentos/{id}/status",
                                "/campanhas/{id}/status"
                        ).hasAnyRole(
                                "ADMINISTRADOR",
                                "ANALISTA"
                        )

                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/segmento-contatos/{segmentoId}/{contatoId}"
                        ).hasAnyRole(
                                "ADMINISTRADOR",
                                "ANALISTA"
                        )

                        .requestMatchers(
                                HttpMethod.GET,
                                "/empresas/{id}/enriquecimento"
                        ).hasAnyRole(
                                "ADMINISTRADOR",
                                "ANALISTA"
                        )

                        .requestMatchers(
                                HttpMethod.POST,
                                "/empresas/{id}/enriquecimento/previa",
                                "/empresas/{id}/enriquecimento/confirmacao"
                        ).hasAnyRole(
                                "ADMINISTRADOR",
                                "ANALISTA"
                        )

                        .anyRequest().denyAll()


                )

                .addFilterBefore(
                        new FiltroToken(
                                tokens,
                                usuarios,
                                limitador
                        ),
                        UsernamePasswordAuthenticationFilter.class
                )

                .addFilterBefore(
                        new FiltroLimiteRequisicoes(limitador),
                        FiltroToken.class
                );

        return http.build();
    }
}