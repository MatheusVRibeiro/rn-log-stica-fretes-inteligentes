import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import fazendasService from "@/services/fazendas";
import type { CriarFazendaPayload } from "@/types";

export const FAZENDAS_QUERY_KEY = ["fazendas"] as const;

export function useFazendas() {
  return useQuery({
    queryKey: FAZENDAS_QUERY_KEY,
    queryFn: fazendasService.listarFazendas,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCriarFazenda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fazendasService.criarFazenda,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAZENDAS_QUERY_KEY });
    },
  });
}

export function useAtualizarFazenda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CriarFazendaPayload> }) =>
      fazendasService.atualizarFazenda(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAZENDAS_QUERY_KEY });
    },
  });
}

export function useDeletarFazenda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fazendasService.deletarFazenda,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAZENDAS_QUERY_KEY });
    },
  });
}
