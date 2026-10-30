package neocore.Config;

import neocore.Repository.UsuarioRepository;
import neocore.Security.*;

import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SegurancaConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            TokenStore tokens,
            UsuarioRepository usuarios
    ) throws Exception {

        return http
                // Esta configuração usa apenas Bearer no cabeçalho,
                // sem cookies, Basic ou login por formulário.
                .csrf(csrf -> csrf.disable())

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .logout(logout -> logout.disable())
                .requestCache(cache -> cache.disable())

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                HttpMethod.POST,
                                "/autenticacao/login",
                                "/autenticacao/mfa/configuracao",
                                "/autenticacao/mfa/confirmar",
                                "/convites/ativar",
                                "/solicitacoes-acesso"
                        )
                        .permitAll()
                        .anyRequest()
                        .authenticated()
                )

                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint(
                                (request, response, exception) -> {
                                    response.setStatus(401);
                                    response.setContentType(
                                            "application/json"
                                    );

                                    response.getWriter().write(
                                            """
                                            {
                                              "status": 401,
                                              "mensagem": "Autenticação necessária."
                                            }
                                            """
                                    );
                                }
                        )
                        .accessDeniedHandler(
                                (request, response, exception) -> {
                                    response.setStatus(403);
                                    response.setContentType(
                                            "application/json"
                                    );

                                    response.getWriter().write(
                                            """
                                            {
                                              "status": 403,
                                              "mensagem": "Acesso negado."
                                            }
                                            """
                                    );
                                }
                        )
                )

                .addFilterBefore(
                        new FiltroToken(tokens, usuarios),
                        UsernamePasswordAuthenticationFilter.class
                )

                .build();
    }
}