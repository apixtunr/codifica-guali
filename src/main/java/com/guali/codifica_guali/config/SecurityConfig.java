package com.guali.codifica_guali.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/index.html", "/tablero.html", "/estilos.css", "/tablero.js", "/images/**").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/administradores/**").hasRole("ADMIN")
                .requestMatchers("/api/bitacora/**").hasRole("ADMIN")
                .requestMatchers("/api/estadisticas/**").hasRole("ADMIN")
                .requestMatchers("/api/pistas/**").hasRole("ADMIN")
                .anyRequest().permitAll()
            )
            // Elimina formLogin si no lo usas
            //.formLogin().disable()
            .csrf(csrf -> csrf.disable())
            .httpBasic(Customizer.withDefaults());
        return http.build();
    }
}