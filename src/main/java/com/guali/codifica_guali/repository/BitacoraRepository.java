package com.guali.codifica_guali.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import com.guali.codifica_guali.entity.Bitacora;
import java.time.LocalDateTime;
import java.util.List;

public interface BitacoraRepository extends JpaRepository<Bitacora, Long> {
    
    // Buscar por rango de fechas
    List<Bitacora> findByFechaBetween(LocalDateTime inicio, LocalDateTime fin);
    
    // Buscar por administrador
    List<Bitacora> findByAdministradorOrderByFechaDesc(String administrador);
    
    // Obtener las últimas N entradas
    @Query("SELECT b FROM Bitacora b ORDER BY b.fecha DESC")
    List<Bitacora> findAllOrderByFechaDesc();
}
