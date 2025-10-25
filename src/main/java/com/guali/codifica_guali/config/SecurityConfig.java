package com.guali.codifica_guali.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/index.html", "/tablero.html", "/estilos.css", "/tablero.js", "/images/**").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/init/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/pistas", "/api/pistas/**").permitAll()
                .requestMatchers("/api/administradores/**").hasRole("ADMIN")
                .requestMatchers("/api/bitacora/**").hasRole("ADMIN")
                .requestMatchers("/api/estadisticas/**").hasRole("ADMIN")
                .requestMatchers("/api/pistas/**").hasRole("ADMIN")
                .anyRequest().permitAll()
            )
            .csrf(csrf -> csrf.disable())
            .httpBasic(httpBasic -> httpBasic.disable())
            .formLogin(formLogin -> formLogin.disable());
        return http.build();
    }
}