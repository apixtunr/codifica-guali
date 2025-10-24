package com.guali.codifica_guali.service;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.guali.codifica_guali.entity.Bitacora;
import com.guali.codifica_guali.repository.BitacoraRepository;

@Service
public class BitacoraService {

    @Autowired
    private BitacoraRepository bitacoraRepository;

    public List<Bitacora> findAll() {
        return bitacoraRepository.findAllOrderByFechaDesc();
    }

    public List<Bitacora> findByFechas(LocalDateTime inicio, LocalDateTime fin) {
        return bitacoraRepository.findByFechaBetween(inicio, fin);
    }

    public List<Bitacora> findByAdministrador(String administrador) {
        return bitacoraRepository.findByAdministradorOrderByFechaDesc(administrador);
    }

    public Bitacora registrarAccion(String administrador, String accion, String detalles) {
        Bitacora entrada = new Bitacora();
        entrada.setAdministrador(administrador);
        entrada.setAccion(accion);
        entrada.setDetalles(detalles);
        return bitacoraRepository.save(entrada);
    }
}
