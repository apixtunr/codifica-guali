package com.guali.codifica_guali.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.guali.codifica_guali.entity.Estadistica;

public interface EstadisticaRepository extends JpaRepository<Estadistica, Long> {
    
    // Contar eventos por tipo en un rango de fechas
    @Query("SELECT COUNT(e) FROM Estadistica e WHERE e.tipoEvento = :tipo AND e.fecha BETWEEN :inicio AND :fin")
    Long contarEventosPorTipo(@Param("tipo") String tipo, @Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);
    
    // Contar usuarios únicos por rango de fechas
    @Query("SELECT COUNT(DISTINCT e.sesionUsuario) FROM Estadistica e WHERE e.tipoEvento = 'visita' AND e.fecha BETWEEN :inicio AND :fin")
    Long contarUsuariosUnicos(@Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);
    
    // Obtener estadísticas por rango de fechas
    List<Estadistica> findByFechaBetweenOrderByFechaDesc(LocalDateTime inicio, LocalDateTime fin);
}
