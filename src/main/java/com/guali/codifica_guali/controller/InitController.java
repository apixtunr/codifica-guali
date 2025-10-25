package com.guali.codifica_guali.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.guali.codifica_guali.entity.Administrador;
import com.guali.codifica_guali.repository.AdministradorRepository;

import java.util.Map;

@RestController
@RequestMapping("/api/init")
public class InitController {
    
    @Autowired
    private AdministradorRepository administradorRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @PostMapping("/crear-admin")
    public String crearAdminInicial(@RequestBody Map<String, String> datos) {
        
        String username = datos.get("username");
        String password = datos.get("password");
        String nombre = datos.get("nombre");
        
        // Verificar si ya existe
        if (administradorRepository.findByUsername(username).isPresent()) {
            return "El administrador ya existe";
        }
        
        // Crear nuevo administrador
        Administrador admin = new Administrador();
        admin.setUsername(username);
        admin.setPassword(passwordEncoder.encode(password));
        admin.setNombre(nombre);
        
        administradorRepository.save(admin);
        
        return "Administrador creado exitosamente: " + username;
    }
}
