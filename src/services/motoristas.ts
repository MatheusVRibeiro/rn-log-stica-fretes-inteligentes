import api from "@/api/axios";
import { isAxiosError } from "axios";
import type { ApiResponse, Motorista } from "@/types";

export async function listarMotoristas(): Promise<ApiResponse<Motorista[]>> {
  try {
    const res = await api.get("/motoristas");
    // Backend retorna {success, message, data: [...]} 
    // Então res.data.data contém o array de motoristas
    return { success: true, data: res.data.data || res.data };
  } catch (err: any) {
    console.error("Erro em listarMotoristas:", err);
    const message = err?.response?.data?.message ?? err?.message ?? "Erro ao listar motoristas";
    return { success: false, data: null, message };
  }
}

export async function criarMotorista(payload: Record<string, any>): Promise<ApiResponse<Motorista>> {
  try {
    console.debug("POST /motoristas payload:", payload);
    const res = await api.post("/motoristas", payload);
    // Backend retorna {success, message, data: {...}}
    return { success: true, data: res.data.data || res.data };
  } catch (err: any) {
    // Log detalhado e tentativa de extrair mensagem útil do backend
    console.error("Erro em criarMotorista:", err);
    const respData = err?.response?.data;
    console.error("Resposta do servidor:", respData, "payload:", payload);
    let message = "Erro ao criar motorista";
    if (isAxiosError(err)) {
      if (respData) {
        // Prioriza campos comuns de erro
        message = respData.message ?? respData.error ?? JSON.stringify(respData);
      } else {
        message = err.message;
      }

      // No automatic retry: backend requires veiculo_id when aplicável — frontend deve validar antes
    } else if (err instanceof Error) {
      message = err.message;
    }
    return { success: false, data: null, message, status: err?.response?.status };
  }
}

const motoristasService = {
  listarMotoristas,
  criarMotorista,
};

export default motoristasService;
