package com.guali.codifica_guali.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.guali.codifica_guali.entity.Administrador;

import com.guali.codifica_guali.repository.AdministradorRepository;

@Service
public class AdministradorService {

    @Autowired
    private AdministradorRepository administradorRepository;

    public List<Administrador> findAll() {
        return administradorRepository.findAll();
    }

    public Optional<Administrador> findById(Long id) {
        return administradorRepository.findById(id);
    }

    public Administrador save(Administrador admin) {
        return administradorRepository.save(admin);
    }

    public void deleteById(Long id) {
        administradorRepository.deleteById(id);
    }

    public Optional<Administrador> findByUsername(String username) {
        return administradorRepository.findByUsername(username);
    }
}
