package com.guali.codifica_guali.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.guali.codifica_guali.entity.Pista;

public interface PistaRepository extends JpaRepository<Pista, Long> {
    List<Pista> findByCreadaPorOrderByFechaCreacionDesc(String creadaPor);
    List<Pista> findAllByOrderByFechaCreacionDesc();
}
