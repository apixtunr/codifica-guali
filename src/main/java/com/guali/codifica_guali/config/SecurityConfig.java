package com.guali.codifica_guali.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Autowired
    private UserDetailsService userDetailsService;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Autowired
    public void configureGlobal(AuthenticationManagerBuilder auth) throws Exception {
        auth.userDetailsService(userDetailsService).passwordEncoder(passwordEncoder());
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/index.html", "/tablero.html", "/estilos.css", "/tablero.js", "/images/**").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/init/**").permitAll() // Endpoint temporal para crear admin inicial
                .requestMatchers(HttpMethod.GET, "/api/pistas", "/api/pistas/**").permitAll() // Lectura pública de pistas
                .requestMatchers(HttpMethod.POST, "/api/pistas/**").hasRole("ADMIN") // Crear/guardar pistas requiere admin
                .requestMatchers(HttpMethod.PUT, "/api/pistas/**").hasRole("ADMIN") // Editar pistas requiere admin
                .requestMatchers(HttpMethod.DELETE, "/api/pistas/**").hasRole("ADMIN") // Borrar pistas requiere admin
                .requestMatchers("/api/administradores/**").hasRole("ADMIN")
                .requestMatchers("/api/bitacora/**").hasRole("ADMIN")
                .requestMatchers("/api/estadisticas/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .csrf(csrf -> csrf.disable())
            .httpBasic(httpBasic -> httpBasic.authenticationEntryPoint((request, response, authException) -> {
                // No enviar el header WWW-Authenticate que causa el popup
                response.sendError(401, "Unauthorized");
            })) // Habilitar HTTP Basic pero sin popup
            .formLogin(formLogin -> formLogin.disable()); // Deshabilitar form login
        return http.build();
    }
}