package neocore.Service;

import lombok.RequiredArgsConstructor;

import neocore.DTO.atributocontato.*;
import neocore.DTO.atributoempresa.*;

import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RevisaoAtributoService {

    private final AtributoContatoService contatos;
    private final AtributoEmpresaService empresas;

    public AtributoContatoResponse revisarContato(
            UUID id,
            RevisaoAtributoContatoRequest request
    ) {
        return contatos.revisar(id, request);
    }

    public AtributoEmpresaResponse revisarEmpresa(
            UUID id,
            RevisaoAtributoEmpresaRequest request
    ) {
        return empresas.revisar(id, request);
    }
}