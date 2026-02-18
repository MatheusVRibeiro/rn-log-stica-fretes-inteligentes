import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as motoristasService from "@/services/motoristas";
import type { ApiResponse, Motorista } from "@/types";

export const MOTORISTAS_QUERY_KEY = ["motoristas"] as const;

export function useMotoristas() {
  return useQuery({
    queryKey: MOTORISTAS_QUERY_KEY,
    queryFn: motoristasService.listarMotoristas,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCriarMotorista() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: motoristasService.criarMotorista,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MOTORISTAS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["caminhoes"] });
    },
  });
}

export function useAtualizarMotorista() {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<Motorista>, unknown, { id: string; payload: Partial<Record<string, any>> }>({
    mutationFn: ({ id, payload }) => motoristasService.atualizarMotorista(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MOTORISTAS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["frota"] });
    },
  });
}