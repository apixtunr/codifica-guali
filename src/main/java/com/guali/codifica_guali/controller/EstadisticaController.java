package com.guali.codifica_guali.controller;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.guali.codifica_guali.security.EstadisticaService;

@RestController
@RequestMapping("/api/estadisticas")
public class EstadisticaController {

    @Autowired
    private EstadisticaService estadisticaService;

    @GetMapping("/hoy")
    public Map<String, Long> getEstadisticasHoy() {
        return estadisticaService.obtenerEstadisticasHoy();
    }

    @GetMapping("/rango")
    public Map<String, Long> getEstadisticasPorRango(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin) {
        return estadisticaService.obtenerEstadisticas(inicio, fin);
    }

    @PostMapping("/registrar")
    public void registrarEvento(@RequestBody EventoRequest request) {
        estadisticaService.registrarEvento(request.getTipoEvento(), request.getDetalles(), request.getSesionUsuario());
    }

    // Clase para recibir eventos del frontend
    public static class EventoRequest {
        private String tipoEvento;
        private String detalles;
        private String sesionUsuario;

        public String getTipoEvento() { return tipoEvento; }
        public void setTipoEvento(String tipoEvento) { this.tipoEvento = tipoEvento; }
        
        public String getDetalles() { return detalles; }
        public void setDetalles(String detalles) { this.detalles = detalles; }
        
        public String getSesionUsuario() { return sesionUsuario; }
        public void setSesionUsuario(String sesionUsuario) { this.sesionUsuario = sesionUsuario; }
    }
}
