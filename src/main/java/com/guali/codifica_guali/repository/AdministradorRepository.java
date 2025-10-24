package com.guali.codifica_guali.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.guali.codifica_guali.entity.Administrador;

public interface AdministradorRepository extends JpaRepository<Administrador, Long> {
    Optional<Administrador> findByUsername(String username);
}