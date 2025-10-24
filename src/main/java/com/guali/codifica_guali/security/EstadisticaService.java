package com.guali.codifica_guali.security;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.guali.codifica_guali.entity.Estadistica;
import com.guali.codifica_guali.repository.EstadisticaRepository;

@Service
public class EstadisticaService {

    @Autowired
    private EstadisticaRepository estadisticaRepository;

    public void registrarEvento(String tipoEvento, String detalles, String sesionUsuario) {
        Estadistica estadistica = new Estadistica();
        estadistica.setTipoEvento(tipoEvento);
        estadistica.setDetalles(detalles);
        estadistica.setSesionUsuario(sesionUsuario);
        estadisticaRepository.save(estadistica);
    }

    public Map<String, Long> obtenerEstadisticas(LocalDateTime inicio, LocalDateTime fin) {
        Map<String, Long> estadisticas = new HashMap<>();
        
        estadisticas.put("visitantes", estadisticaRepository.contarUsuariosUnicos(inicio, fin));
        estadisticas.put("exitos", estadisticaRepository.contarEventosPorTipo("exito", inicio, fin));
        estadisticas.put("fallos", estadisticaRepository.contarEventosPorTipo("fallo", inicio, fin));
        estadisticas.put("totalVisitas", estadisticaRepository.contarEventosPorTipo("visita", inicio, fin));
        
        return estadisticas;
    }

    public Map<String, Long> obtenerEstadisticasHoy() {
        LocalDateTime inicioHoy = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        LocalDateTime finHoy = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59);
        return obtenerEstadisticas(inicioHoy, finHoy);
    }
}
