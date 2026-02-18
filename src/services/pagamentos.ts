import api from "@/api/axios";
import { isAxiosError } from "axios";
import type { ApiResponse, Pagamento, CriarPagamentoPayload, AtualizarPagamentoPayload } from "@/types";

const listarPagamentos = async (): Promise<ApiResponse<Pagamento[]>> => {
  try {
    const res = await api.get("/pagamentos");
    return { success: true, data: res.data.data || res.data, status: res.status };
  } catch (err: unknown) {
    let message = "Erro ao listar pagamentos";
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

const obterPagamento = async (id: string): Promise<ApiResponse<Pagamento>> => {
  try {
    const res = await api.get(`/pagamentos/${id}`);
    return { success: true, data: res.data.data || res.data, status: res.status };
  } catch (err: unknown) {
    let message = "Erro ao obter pagamento";
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

const criarPagamento = async (payload: CriarPagamentoPayload): Promise<ApiResponse<{ id: string }>> => {
  try {
    const res = await api.post("/pagamentos", payload);
    return { success: true, data: res.data.data || res.data, message: res.data.message, status: res.status };
  } catch (err: unknown) {
    let message = "Erro ao criar pagamento";
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

const atualizarPagamento = async (
  id: string,
  payload: AtualizarPagamentoPayload
): Promise<ApiResponse<{ id: string }>> => {
  try {
    const res = await api.put(`/pagamentos/${id}`, payload);
    return { success: true, data: res.data.data || res.data, message: res.data.message, status: res.status };
  } catch (err: unknown) {
    let message = "Erro ao atualizar pagamento";
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

const deletarPagamento = async (id: string): Promise<ApiResponse<void>> => {
  try {
    const res = await api.delete(`/pagamentos/${id}`);
    return { success: true, data: null, status: res.status };
  } catch (err: unknown) {
    let message = "Erro ao deletar pagamento";
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

const pagamentosService = {
  listarPagamentos,
  obterPagamento,
  criarPagamento,
  atualizarPagamento,
  deletarPagamento,
};

export default pagamentosService;
