import api from "@/api/axios";
import { isAxiosError } from "axios";
import type { ApiResponse, User } from "@/types";

interface LoginPayload {
  email: string;
  senha: string;
}

interface BackendUsuario {
  id: string;
  email: string;
  nome: string;
  role?: "admin" | "operador" | "motorista";
}

interface BackendLoginResponse {
  success: boolean;
  message?: string;
  token: string;
  refreshToken?: string;
  refresh_token?: string;
  usuario: BackendUsuario;
}

interface BackendRefreshResponse {
  success: boolean;
  message?: string;
  token: string;
  refreshToken?: string;
  refresh_token?: string;
}

interface LoginResult {
  user: User;
  token: string;
  refreshToken?: string;
  refresh_token?: string;
}

export async function login(email: string, senha: string): Promise<ApiResponse<LoginResult>> {
  try {
    const normalizedEmail = String(email ?? "").trim().toLowerCase();
    const res = await api.post<BackendLoginResponse>("/auth/login", { email: normalizedEmail, senha });

    const status = res.status;
    // Backend retorna: { success, message, token, usuario }
    if (res.data.success && res.data.token && res.data.usuario) {
      const { token, refreshToken, refresh_token, usuario } = res.data;
      const normalizedRefreshToken = refreshToken ?? refresh_token;

      if (!usuario) {
        return { success: false, data: null, message: "Usuário não encontrado na resposta", status };
      }

      // Map backend fields (nome) to frontend format (name)
      const mappedUser: User = {
        id: usuario.id,
        name: usuario.nome,
        email: usuario.email,
        role: usuario.role ?? "admin",
      };

      return {
        success: true,
        data: {
          user: mappedUser,
          token,
          refreshToken: normalizedRefreshToken,
        },
        status,
      };
    }

    return { success: false, data: null, message: res.data.message ?? "Resposta inválida do servidor", status };
  } catch (err: unknown) {
    let message = "Erro na autenticação";
    let status: number | undefined = undefined;
    if (isAxiosError(err)) {
      message = err.response?.data?.message ?? err.message ?? message;
      status = err.response?.status;
    } else if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "string") {
      message = err;
    }
    return { success: false, data: null, message, status };
  }
}

export async function refreshToken(refreshTokenValue: string): Promise<ApiResponse<{ token: string; refreshToken?: string }>> {
  try {
    const res = await api.post<BackendRefreshResponse>("/auth/refresh", { refreshToken: refreshTokenValue });

    if (res.data.success && res.data.token) {
      return {
        success: true,
        data: {
          token: res.data.token,
          refreshToken: res.data.refreshToken ?? res.data.refresh_token,
        },
        status: res.status,
      };
    }

    return {
      success: false,
      data: null,
      message: res.data.message ?? "Não foi possível renovar a sessão",
      status: res.status,
    };
  } catch (err: unknown) {
    let message = "Erro ao renovar sessão";
    let status: number | undefined = undefined;
    if (isAxiosError(err)) {
      message = err.response?.data?.message ?? err.message ?? message;
      status = err.response?.status;
    } else if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "string") {
      message = err;
    }
    return {
      success: false,
      data: null,
      message,
      status,
    };
  }
}

export async function register(nome: string, email: string, senha: string): Promise<ApiResponse<{ user: User }>> {
  try {
    const normalizedEmail = String(email ?? "").trim().toLowerCase();
    const res = await api.post("/auth/registrar", { nome, email: normalizedEmail, senha });

    const status = res.status;
    if (res.data.success && res.data.data) {
      return {
        success: true,
        data: { user: res.data.data },
        status,
      };
    }

    return { success: false, data: null, message: res.data.message ?? "Resposta inválida do servidor", status };
  } catch (err: unknown) {
    let message = "Erro no registro";
    let status: number | undefined = undefined;
    if (isAxiosError(err)) {
      message = err.response?.data?.message ?? err.message ?? message;
      status = err.response?.status;
    } else if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "string") {
      message = err;
    }
    return { success: false, data: null, message, status };
  }
}
