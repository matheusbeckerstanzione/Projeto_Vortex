package neocore.Service;

import neocore.DTO.sinais.SugestaoPautasRequest;
import neocore.DTO.sinais.SugestaoPautasResponse;

public interface SugestaoPautasProvider {

    SugestaoPautasResponse gerar(SugestaoPautasRequest request);
}