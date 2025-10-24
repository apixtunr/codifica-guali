package com.guali.codifica_guali.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.guali.codifica_guali.entity.Administrador;
import com.guali.codifica_guali.service.AdministradorService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AdministradorService administradorService;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");
        
        Optional<Administrador> admin = administradorService.findByUsername(username);
        
        Map<String, Object> response = new HashMap<>();
        
        if (admin.isPresent() && verificarPassword(admin.get().getPassword(), password)) {
            response.put("success", true);
            response.put("message", "Login exitoso");
            response.put("admin", admin.get());
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "Usuario o contraseña incorrectos");
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    private boolean verificarPassword(String passwordBD, String passwordIngresada) {
        // Si la contraseña en BD tiene {noop}, la comparamos directamente
        if (passwordBD.startsWith("{noop}")) {
            return passwordBD.substring(6).equals(passwordIngresada);
        }
        return passwordBD.equals(passwordIngresada);
    }
}
