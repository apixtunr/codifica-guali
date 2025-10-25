package com.guali.codifica_guali.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.guali.codifica_guali.entity.Administrador;

import com.guali.codifica_guali.repository.AdministradorRepository;

@Service
public class AdministradorService {


    @Autowired
    private AdministradorRepository administradorRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<Administrador> findAll() {
        return administradorRepository.findAll();
    }

    public Optional<Administrador> findById(Long id) {
        return administradorRepository.findById(id);
    }

    public Administrador save(Administrador admin) {
        // Si la contraseña no está encriptada (no empieza con $2), la encripta
        String rawPassword = admin.getPassword();
        if (rawPassword != null && !rawPassword.startsWith("$2")) {
            admin.setPassword(passwordEncoder.encode(rawPassword));
        }
        return administradorRepository.save(admin);
    }

    public void deleteById(Long id) {
        administradorRepository.deleteById(id);
    }

    public Optional<Administrador> findByUsername(String username) {
        return administradorRepository.findByUsername(username);
    }
}
