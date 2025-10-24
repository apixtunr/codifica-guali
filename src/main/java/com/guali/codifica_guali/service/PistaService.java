package com.guali.codifica_guali.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.guali.codifica_guali.entity.Pista;
import com.guali.codifica_guali.repository.PistaRepository;

@Service
public class PistaService {

    @Autowired
    private PistaRepository pistaRepository;

    public List<Pista> findAll() {
        return pistaRepository.findAllByOrderByFechaCreacionDesc();
    }

    public Optional<Pista> findById(Long id) {
        return pistaRepository.findById(id);
    }

    public Pista save(Pista pista) {
        return pistaRepository.save(pista);
    }

    public void deleteById(Long id) {
        pistaRepository.deleteById(id);
    }

    public List<Pista> findByCreadaPor(String creadaPor) {
        return pistaRepository.findByCreadaPorOrderByFechaCreacionDesc(creadaPor);
    }
}
