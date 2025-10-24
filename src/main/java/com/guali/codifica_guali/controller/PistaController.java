package com.guali.codifica_guali.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.guali.codifica_guali.entity.Pista;
import com.guali.codifica_guali.service.PistaService;

@RestController
@RequestMapping("/api/pistas")
public class PistaController {

    @Autowired
    private PistaService pistaService;

    @GetMapping
    public List<Pista> getAll() {
        return pistaService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Pista> getById(@PathVariable Long id) {
        Optional<Pista> pista = pistaService.findById(id);
        return pista.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public Pista create(@RequestBody Pista pista) {
        return pistaService.save(pista);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Pista> update(@PathVariable Long id, @RequestBody Pista pista) {
        Optional<Pista> existente = pistaService.findById(id);
        if (existente.isPresent()) {
            pista.setId(id);
            return ResponseEntity.ok(pistaService.save(pista));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (pistaService.findById(id).isPresent()) {
            pistaService.deleteById(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
