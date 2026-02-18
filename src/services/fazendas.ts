import api from "@/api/axios";
import { isAxiosError } from "axios";
import type { Fazenda, CriarFazendaPayload, ApiResponse } from "@/types";

const listarFazendas = async (): Promise<ApiResponse<Fazenda[]>> => {
  try {
    const res = await api.get("/fazendas");
    return { success: true, data: res.data.data || res.data, status: res.status };
  } catch (err: unknown) {
    let message = "Erro ao listar fazendas";
    if (isAxiosError(err)) {
      message = err.response?.data?.message ?? err.message ?? message;
      const status = err.response?.status;
      return { success: false, data: null, message, status };
    } else if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "string") {
      message = err;
    }
    return { success: false, data: null, message };
  }
};

const obterFazenda = async (id: string): Promise<ApiResponse<Fazenda>> => {
  try {
    const res = await api.get(`/fazendas/${id}`);
    return { success: true, data: res.data.data || res.data, status: res.status };
  } catch (err: unknown) {
    let message = "Erro ao obter fazenda";
    if (isAxiosError(err)) {
      message = err.response?.data?.message ?? err.message ?? message;
      const status = err.response?.status;
      return { success: false, data: null, message, status };
    } else if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "string") {
      message = err;
    }
    return { success: false, data: null, message };
  }
};

const criarFazenda = async (payload: CriarFazendaPayload): Promise<ApiResponse<Fazenda>> => {
  try {
    const res = await api.post("/fazendas", payload);
    return { success: true, data: res.data.data || res.data, status: res.status };
  } catch (err: unknown) {
    let message = "Erro ao criar fazenda";
    if (isAxiosError(err)) {
      message = err.response?.data?.message ?? err.message ?? message;
      const status = err.response?.status;
      return { success: false, data: null, message, status };
    } else if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "string") {
      message = err;
    }
    return { success: false, data: null, message };
  }
};

const atualizarFazenda = async (
  id: string,
  payload: Partial<CriarFazendaPayload>
): Promise<ApiResponse<Fazenda>> => {
  try {
    const res = await api.put(`/fazendas/${id}`, payload);
    return { success: true, data: res.data.data || res.data, status: res.status };
  } catch (err: unknown) {
    let message = "Erro ao atualizar fazenda";
    if (isAxiosError(err)) {
      message = err.response?.data?.message ?? err.message ?? message;
      const status = err.response?.status;
      return { success: false, data: null, message, status };
    } else if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "string") {
      message = err;
    }
    return { success: false, data: null, message };
  }
};

const deletarFazenda = async (id: string): Promise<ApiResponse<void>> => {
  try {
    const res = await api.delete(`/fazendas/${id}`);
    return { success: true, data: null, status: res.status };
  } catch (err: unknown) {
    let message = "Erro ao deletar fazenda";
    if (isAxiosError(err)) {
      message = err.response?.data?.message ?? err.message ?? message;
      const status = err.response?.status;
      return { success: false, data: null, message, status };
    } else if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "string") {
      message = err;
    }
    return { success: false, data: null, message };
  }
};

const incrementarVolumeTransportado = async (
  id: string,
  toneladas: number
): Promise<ApiResponse<Fazenda>> => {
  try {
    const res = await api.post(`/fazendas/${id}/incrementar-volume`, { toneladas });
    return { success: true, data: res.data.data || res.data, status: res.status };
  } catch (err: unknown) {
    let message = "Erro ao incrementar volume";
    if (isAxiosError(err)) {
      message = err.response?.data?.message ?? err.message ?? message;
      const status = err.response?.status;
      return { success: false, data: null, message, status };
    } else if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "string") {
      message = err;
    }
    return { success: false, data: null, message };
  }
};

const fazendasService = {
  listarFazendas,
  obterFazenda,
  criarFazenda,
  atualizarFazenda,
  deletarFazenda,
  incrementarVolumeTransportado,
};

export default fazendasService;
