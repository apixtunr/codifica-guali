package com.guali.codifica_guali.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.guali.codifica_guali.entity.Bitacora;
import com.guali.codifica_guali.service.BitacoraService;

@RestController
@RequestMapping("/api/bitacora")
public class BitacoraController {

    @Autowired
    private BitacoraService bitacoraService;

    @GetMapping
    public List<Bitacora> getAll() {
        return bitacoraService.findAll();
    }

    @GetMapping("/fechas")
    public List<Bitacora> getByFechas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin) {
        return bitacoraService.findByFechas(inicio, fin);
    }

    @GetMapping("/administrador/{username}")
    public List<Bitacora> getByAdministrador(@PathVariable String username) {
        return bitacoraService.findByAdministrador(username);
    }

    @PostMapping("/registrar")
    public Bitacora registrar(@RequestBody BitacoraRequest request) {
        return bitacoraService.registrarAccion(request.getAdministrador(), request.getAccion(), request.getDetalles());
    }

    // Clase interna para recibir datos del frontend
    public static class BitacoraRequest {
        private String administrador;
        private String accion;
        private String detalles;

        public String getAdministrador() { return administrador; }
        public void setAdministrador(String administrador) { this.administrador = administrador; }
        
        public String getAccion() { return accion; }
        public void setAccion(String accion) { this.accion = accion; }
        
        public String getDetalles() { return detalles; }
        public void setDetalles(String detalles) { this.detalles = detalles; }
    }
}
