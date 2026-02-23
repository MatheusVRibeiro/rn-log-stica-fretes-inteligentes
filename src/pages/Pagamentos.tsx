import { useShake } from "@/hooks/useShake";
import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { PeriodoFilter } from "@/components/shared/PeriodoFilter";
import { FilterBar } from "@/components/shared/FilterBar";
import { DataTable } from "@/components/shared/DataTable";
import { ModalSubmitFooter } from "@/components/shared/ModalSubmitFooter";
import { FieldError, fieldErrorClass } from "@/components/shared/FieldError";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
// Missing UI imports used across the component
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

// Icons
import {
  FileText,
  Clock,
  TrendingDown,
  TrendingUp,
  Check,
  Filter,
  FileDown,
  Plus,
  Edit,
  DollarSign,
  Calendar,
  Paperclip,
  Download,
  Eye,
  AlertCircle,
  X,
  Save,
} from "lucide-react";

// Utilities
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn, shortName } from "@/lib/utils";
import { formatarCodigoFrete } from "@/utils/formatters";
import { toast } from "sonner";
import { ITEMS_PER_PAGE } from "@/lib/pagination";

// PDF helpers
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ApiResponse, Pagamento, Motorista, Frete, AtualizarPagamentoPayload, CriarPagamentoPayload, Fazenda } from "@/types";
import pagamentosService from "@/services/pagamentos";
import motoristasService from "@/services/motoristas";
import * as fretesService from "@/services/fretes";
import custosService from "@/services/custos";
import fazendasService from "@/services/fazendas";
import { exportarGuiaPagamentoIndividual, PagamentoPDFParams } from "@/utils/pdf/pagamentos-pdf";
import { usePeriodoFilter } from "@/hooks/usePeriodoFilter";
// locale imported above
/*
 * 5. Ao salvar pagamento, os fretes selecionados são vinculados (recebem pagamentoId)
 * 6. Fretes pagos não aparecem mais na lista de disponíveis
 * 
 * INTEGRAÇÃO COM BANCO:
 * - Campo pagamentoId na tabela fretes (FK para pagamentos)
 * - Trigger atualiza pagamentoId nos fretes quando pagamento é criado
 * - Query: SELECT * FROM fretes WHERE motorista_id = ? AND pagamento_id IS NULL
 */

interface PagamentoMotorista {
  id: string;
  motoristaId: string;
  motoristaNome: string;
  tipoRelatorio?: "GUIA_INTERNA" | "PAGAMENTO_TERCEIRO";
  dataFrete: string;
  toneladas: number;
  fretes: number;
  valorUnitarioPorTonelada: number;
  valorTotal: number;
  fretesSelecionados?: string[];
  dataPagamento: string;
  statusPagamento: "pendente" | "processando" | "pago" | "cancelado";
  metodoPagamento: "pix" | "transferencia_bancaria";
  comprovante?: {
    nome: string;
    url: string;
    datadoUpload: string;
  };
  observacoes?: string;
}

// Dados de motoristas carregados via API (ver `motoristasApi` e mapeamento abaixo)

// Dados de fretes carregados via API (ver `fretesApi` e mapeamento abaixo)

// Dados de custos adicionais para cada frete
interface CustoAdicional {
  freteId: string;
  valor: number;
  descricao: string;
}

// Pagamentos serão carregados via API (ver `pagamentosApi` e mapeamento acima)

const statusConfig = {
  pendente: { label: "Pendente", variant: "pending" as const },
  processando: { label: "Processando", variant: "inTransit" as const },
  pago: { label: "Pago", variant: "completed" as const },
  cancelado: { label: "Cancelado", variant: "cancelled" as const },
};

const getFavorecidoId = (item: { proprietario_id?: string | null; motorista_id?: string | null }) =>
  String(item.proprietario_id || item.motorista_id || "");

const getFavorecidoNome = (item: { proprietario_nome?: string | null; motorista_nome?: string | null }) =>
  String(item.proprietario_nome || item.motorista_nome || "Favorecido");

const parseFretesIncluidos = (value?: string | null): string[] =>
  value
    ? value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
    : [];

const uniqueById = <T extends { id: string | number }>(items: T[]): T[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = String(item.id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export default function Pagamentos() {
  const queryClient = useQueryClient();

  const { data: pagamentosResponse, isLoading: isLoadingPagamentos } = useQuery<ApiResponse<Pagamento[]>>({
    queryKey: ["pagamentos"],
    queryFn: () => pagamentosService.listarPagamentos(),
  });

  const { data: motoristasResponse } = useQuery<ApiResponse<Motorista[]>>({
    queryKey: ["motoristas"],
    queryFn: () => motoristasService.listarMotoristas(),
  });

  const { data: fretesResponse } = useQuery<ApiResponse<Frete[]>>({
    queryKey: ["fretes"],
    queryFn: () => fretesService.listarFretes(),
  });

  const { data: custosResponse } = useQuery<ApiResponse<any[]>>({
    queryKey: ["custos"],
    queryFn: () => custosService.listarCustos(),
  });

  const { data: fazendasResponse } = useQuery<ApiResponse<Fazenda[]>>({
    queryKey: ["fazendas"],
    queryFn: () => fazendasService.listarFazendas(),
  });

  const pagamentosApi: Pagamento[] = pagamentosResponse?.data || [];
  const motoristasApi: Motorista[] = motoristasResponse?.data || [];
  const fretesApi: Frete[] = fretesResponse?.data || [];
  const custosApi: any[] = custosResponse?.data || [];
  const fazendasApi: Fazenda[] = fazendasResponse?.data || [];

  const getFazendaCodigoByFrete = (frete: Frete) => {
    const byId = frete.fazenda_id
      ? fazendasApi.find((f) => String(f.id) === String(frete.fazenda_id))
      : undefined;
    if (byId?.codigo_fazenda) return byId.codigo_fazenda;

    const byNome = frete.fazenda_nome
      ? fazendasApi.find((f) => String(f.fazenda).toUpperCase() === String(frete.fazenda_nome).toUpperCase())
      : undefined;
    return byNome?.codigo_fazenda || "";
  };

  // Mapear custos da API para o formato usado no componente
  const custosAdicionaisData: CustoAdicional[] = useMemo(() => {
    return custosApi.map((custo) => ({
      freteId: String(custo.frete_id),
      valor: Number(custo.valor) || 0,
      descricao: custo.descricao || custo.tipo || "Custo adicional",
    }));
  }, [custosApi]);

  // Funções de formatação
  const formatDateBR = (value: string) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return format(parsed, "dd/MM/yyyy", { locale: ptBR });
  };

  // Formata periodo_fretes removendo duplicação de datas (ex: "19-19/02/2026" → "19/02/2026")
  const formatPeriodoFretes = (periodo: string): string => {
    if (!periodo) return "";
    // Se tem padrão "DD-DD/MM/YYYY" onde os dois DDs são iguais, remover o primeiro
    const match = periodo.match(/^(\d{2})-(\d{2})\/(\d{2}\/\d{4})$/);
    if (match && match[1] === match[2]) {
      return `${match[2]}/${match[3]}`;
    }
    // Se tem padrão "DD-DD de ..." onde os dois DDs são iguais
    const match2 = periodo.match(/^(\d{2}) a (\d{2}) de (.+)$/);
    if (match2 && match2[1] === match2[2]) {
      return `${match2[2]} de ${match2[3]}`;
    }
    return periodo;
  };

  const toApiDate = (value: string) => {
    if (!value) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const parsed = parse(value, "dd/MM/yyyy", new Date());
    return Number.isNaN(parsed.getTime()) ? value : format(parsed, "yyyy-MM-dd");
  };

  const parseBRDateToLocalDate = (value?: string) => {
    if (!value) return undefined;
    const [day, month, year] = String(value).split("/").map(Number);
    if (!day || !month || !year) return undefined;
    const localDate = new Date(year, month - 1, day);
    return Number.isNaN(localDate.getTime()) ? undefined : localDate;
  };

  // Hook para filtro de período
  const {
    tipoVisualizacao,
    selectedPeriodo,
    periodosDisponiveis,
    dadosFiltrados: pagamentosFiltrados,
    formatPeriodoLabel,
    setTipoVisualizacao,
    setSelectedPeriodo,
  } = usePeriodoFilter({
    data: pagamentosApi,
    getDataField: (p) => p.data_pagamento,
  });

  // Transformar dados filtrados para PagamentoMotorista
  const pagamentosFiltradosTransformados = useMemo(
    () =>
      pagamentosFiltrados.map((pagamento) => ({
        id: pagamento.codigo_pagamento || pagamento.id || "SEM-ID",
        motoristaId: getFavorecidoId(pagamento),
        motoristaNome: getFavorecidoNome(pagamento),
        tipoRelatorio: pagamento.tipo_relatorio || undefined,
        dataFrete: formatPeriodoFretes(pagamento.periodo_fretes),
        toneladas: Number(pagamento.total_toneladas) || 0,
        fretes: Number(pagamento.quantidade_fretes) || 0,
        valorUnitarioPorTonelada: Number(pagamento.valor_por_tonelada) || 0,
        valorTotal: Number(pagamento.valor_total) || 0,
        fretesSelecionados: parseFretesIncluidos(pagamento.fretes_incluidos),
        dataPagamento: formatDateBR(pagamento.data_pagamento),
        statusPagamento: pagamento.status,
        metodoPagamento: pagamento.metodo_pagamento,
        comprovante: pagamento.comprovante_nome
          ? {
            nome: pagamento.comprovante_nome,
            url: pagamento.comprovante_url || "",
            datadoUpload: pagamento.comprovante_data_upload || "",
          }
          : undefined,
        observacoes: pagamento.observacoes || undefined,
      })),
    [pagamentosFiltrados]
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [motoristaFilter, setMotoristaFilter] = useState<string>("all");
  const [selectedPagamento, setSelectedPagamento] = useState<PagamentoMotorista | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedPagamento, setEditedPagamento] = useState<Partial<PagamentoMotorista>>({});
  const [dataPagamentoSelected, setDataPagamentoSelected] = useState<Date | undefined>();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(null);
  const [selectedFileIsImage, setSelectedFileIsImage] = useState(false);
  const [selectedFileIsPdf, setSelectedFileIsPdf] = useState(false);
  const [comprovanteDialog, setComprovanteDialog] = useState<{
    url: string;
    nome: string;
    isImage: boolean;
    isPdf: boolean;
  } | null>(null);
  const [selectedFretes, setSelectedFretes] = useState<string[]>([]);
  const [isInternalCostConfirmed, setIsInternalCostConfirmed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = ITEMS_PER_PAGE;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [autoEmitirGuia, setAutoEmitirGuia] = useState(true);

  const getComprovanteUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const base = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
    if (!base) return url;
    const suffix = url.startsWith("/") ? url : `/${url}`;

    if (suffix.startsWith("/uploads/")) {
      try {
        const baseUrl = new URL(base);
        return `${baseUrl.origin}${suffix}`;
      } catch {
        // fallback padrão
      }
    }

    return `${base}${suffix}`;
  };

  const parseFileType = (urlOrName?: string) => {
    if (!urlOrName) return { isImage: false, isPdf: false };
    const clean = urlOrName.split("?")[0].split("#")[0].toLowerCase();
    return {
      isImage: /\.(png|jpe?g|webp|gif|bmp|svg)$/.test(clean),
      isPdf: /\.pdf$/.test(clean),
    };
  };

  useEffect(() => {
    return () => {
      if (selectedFilePreview) {
        URL.revokeObjectURL(selectedFilePreview);
      }
    };
  }, [selectedFilePreview]);
  type FormErrors = {
    motoristaId: string;
    fretes: string;
  };
  const initialFormErrors: FormErrors = {
    motoristaId: "",
    fretes: "",
  };
  const [formErrors, setFormErrors] = useState<FormErrors>(initialFormErrors);
  const resetFormErrors = () => setFormErrors(initialFormErrors);
  const clearFormError = (field: keyof FormErrors) => {
    setFormErrors((prev) => (prev[field] ? { ...prev, [field]: "" } : prev));
  };
  const { isShaking, triggerShake } = useShake(220);

  const clearFilters = () => {
    setSearch("");
    setMotoristaFilter("all");
    setStatusFilter("all");
  };

  const motoristas = useMemo(
    () =>
      uniqueById(
        motoristasApi.map((motorista) => ({
          id: motorista.id,
          nome: motorista.nome,
          tipo: motorista.tipo,
          tipoPagamento: motorista.tipo_pagamento || "pix",
          chavePixTipo: motorista.chave_pix_tipo,
          chavePix: motorista.chave_pix,
          banco: motorista.banco,
          agencia: motorista.agencia,
          conta: motorista.conta,
          tipoConta: motorista.tipo_conta,
        }))
      ),
    [motoristasApi]
  );

  const resolveMotoristaById = (id?: string | null) => {
    if (!id) return undefined;
    const idString = String(id);
    return (
      motoristas.find((m) => String(m.id) === idString) ||
      motoristasComPendentes.find((m) => String(m.id) === idString)
    );
  };

  const motoristaSelecionado = resolveMotoristaById(editedPagamento.motoristaId);
  const isInternalCostFlow = motoristaSelecionado?.tipo === "proprio";

  // Motoristas que possuem fretes pendentes (pagamento_id == null/0)
  const motoristasComPendentes = useMemo(() => {
    const pendentes = (fretesApi || []).filter(
      (f) => f.pagamento_id == null || String(f.pagamento_id) === "0"
    );
    const pendingIds = new Set(
      pendentes
        .map((f) => getFavorecidoId(f))
        .filter(Boolean)
    );

    const fromMotoristas = motoristasApi
      .filter((m) => pendingIds.has(m.id))
      .map((motorista) => ({
        id: motorista.id,
        nome: motorista.nome,
        tipo: motorista.tipo,
        tipoPagamento: motorista.tipo_pagamento || "pix",
        chavePixTipo: motorista.chave_pix_tipo,
        chavePix: motorista.chave_pix,
        banco: motorista.banco,
        agencia: motorista.agencia,
        conta: motorista.conta,
        tipoConta: motorista.tipo_conta,
      }));

    const existing = new Set(fromMotoristas.map((item) => item.id));
    const fromFretesFallback = pendentes
      .map((f) => ({ id: getFavorecidoId(f), nome: getFavorecidoNome(f), tipo: f.proprietario_tipo }))
      .filter((f) => f.id && !existing.has(f.id))
      .map((f) => ({
        id: f.id,
        nome: f.nome,
        tipo: (f.tipo as Motorista["tipo"]) || "terceirizado",
        tipoPagamento: "pix" as const,
        chavePixTipo: undefined,
        chavePix: undefined,
        banco: undefined,
        agencia: undefined,
        conta: undefined,
        tipoConta: undefined,
      }));

    return uniqueById([...fromMotoristas, ...fromFretesFallback]);
  }, [motoristasApi, fretesApi]);

  const fretesData = useMemo(
    () =>
      fretesApi.map((frete, index) => ({
        id: frete.id,
        codigoFrete: formatarCodigoFrete(frete.codigo_frete || frete.id, frete.data_frete, index + 1),
        codigoFreteRaw: String(frete.codigo_frete || ""),
        motoristaId: getFavorecidoId(frete),
        motoristaNome: getFavorecidoNome(frete),
        proprietarioTipo: frete.proprietario_tipo,
        dataFrete: formatDateBR(frete.data_frete),
        rota: `${frete.origem} → ${frete.destino}`,
        toneladas: Number(frete.toneladas) || 0,
        valorGerado: Number(frete.receita ?? frete.toneladas * frete.valor_por_tonelada) || 0,
        pagamentoId: frete.pagamento_id ?? null,
      })),
    [fretesApi]
  );

  const normalizeFreteRef = (value: unknown) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const resolveFreteByRef = (ref: string) => {
    const token = String(ref || "").trim();
    if (!token) return undefined;
    const tokenLower = token.toLowerCase();
    const tokenNorm = normalizeFreteRef(token);

    return fretesData.find((f) => {
      const id = String(f.id || "").trim().toLowerCase();
      const codigo = String(f.codigoFrete || "").trim().toLowerCase();
      const codigoRaw = String((f as any).codigoFreteRaw || "").trim().toLowerCase();

      if (id === tokenLower || codigo === tokenLower || codigoRaw === tokenLower) {
        return true;
      }

      const idNorm = normalizeFreteRef(id);
      const codigoNorm = normalizeFreteRef(codigo);
      const codigoRawNorm = normalizeFreteRef(codigoRaw);
      return idNorm === tokenNorm || codigoNorm === tokenNorm || codigoRawNorm === tokenNorm;
    });
  };

  const getCustosByFreteRef = (ref: string) => {
    const resolved = resolveFreteByRef(ref);
    const refs = new Set<string>([
      normalizeFreteRef(ref),
      normalizeFreteRef(resolved?.id),
      normalizeFreteRef(resolved?.codigoFrete),
      normalizeFreteRef((resolved as any)?.codigoFreteRaw),
    ]);

    refs.delete("");

    return custosAdicionaisData.filter((custo) => refs.has(normalizeFreteRef(custo.freteId)));
  };

  const getTotalCustosByFreteRef = (ref: string) =>
    getCustosByFreteRef(ref).reduce((sum, custo) => sum + custo.valor, 0);

  // Query pendentes por motorista (carrega apenas fretes com pagamento_id == null)
  const motoristaIdForPendentes = editedPagamento?.motoristaId || null;
  const usePendentesEndpoint = import.meta.env.VITE_USE_FRETES_PENDENTES_ENDPOINT === "true";
  const {
    data: fretesPendentesResponse,
  } = useQuery<ApiResponse<Frete[]>>({
    queryKey: ["fretes", "pendentes", motoristaIdForPendentes],
    queryFn: () =>
      fretesService.listarFretesPendentes({
        proprietarioId: String(motoristaIdForPendentes),
        motoristaId: String(motoristaIdForPendentes),
      }),
    enabled: usePendentesEndpoint && !!motoristaIdForPendentes,
    retry: 1,
  });

  const fretesPendentesData = useMemo(() => {
    const rawData = fretesPendentesResponse?.data || [];
    // O backend retorna um array de agrupamentos por proprietario/motorista
    // Ex: { proprietario_id: X, fretes: [...] }
    const flatFretes = Array.isArray(rawData) ? rawData.flatMap((group: any) => group.fretes ? group.fretes : [group]) : [];

    return flatFretes.map((frete: any, index: number) => ({
      id: frete.id,
      codigoFrete: formatarCodigoFrete(frete.codigo_frete || frete.id, frete.data_frete, index + 1),
      motoristaId: getFavorecidoId(frete),
      motoristaNome: getFavorecidoNome(frete),
      proprietarioTipo: frete.proprietario_tipo,
      dataFrete: formatDateBR(frete.data_frete),
      rota: `${frete.origem || ""} → ${frete.destino || ""}`,
      toneladas: Number(frete.toneladas) || 0,
      valorGerado: Number(frete.receita ?? frete.toneladas * frete.valor_por_tonelada) || 0,
      pagamentoId: frete.pagamento_id ?? null,
    }));
  }, [fretesPendentesResponse]);

  const pagamentosData = useMemo(
    () =>
      pagamentosApi.map((pagamento) => ({
        id: pagamento.codigo_pagamento || pagamento.id || "SEM-ID",
        motoristaId: getFavorecidoId(pagamento),
        motoristaNome: getFavorecidoNome(pagamento),
        tipoRelatorio: pagamento.tipo_relatorio || undefined,
        dataFrete: formatPeriodoFretes(pagamento.periodo_fretes),
        toneladas: pagamento.total_toneladas,
        fretes: Number(pagamento.quantidade_fretes) || 0,
        valorUnitarioPorTonelada: Number(pagamento.valor_por_tonelada) || 0,
        valorTotal: Number(pagamento.valor_total) || 0,
        fretesSelecionados: parseFretesIncluidos(pagamento.fretes_incluidos),
        dataPagamento: formatDateBR(pagamento.data_pagamento),
        statusPagamento: pagamento.status,
        metodoPagamento: pagamento.metodo_pagamento,
        comprovante: pagamento.comprovante_nome
          ? {
            nome: pagamento.comprovante_nome,
            url: pagamento.comprovante_url || "",
            datadoUpload: pagamento.comprovante_data_upload || "",
          }
          : undefined,
        observacoes: pagamento.observacoes || undefined,
      })),
    [pagamentosApi]
  );

  // Dados históricos para comparação (simulado - mes anterior)
  const dadosMesAnterior = {
    periodo: "2025-12",
    totalPago: 21500, // Dezembro 2025 pagou R$ 21.500
    totalMotoristas: 4,
  };

  const uploadComprovanteIfNeeded = async (pagamentoId: string) => {
    if (isInternalCostFlow) return true;
    if (!selectedFile || !pagamentoId) return true;

    const uploadResponse = await pagamentosService.uploadComprovante(String(pagamentoId), selectedFile);
    if (!uploadResponse.success) {
      toast.error(uploadResponse.message || "Pagamento salvo, mas falhou o upload do comprovante.");
      return false;
    }

    return true;
  };

  const createMutation = useMutation({
    mutationFn: pagamentosService.criarPagamento,
    onSuccess: async (response) => {
      if (response.success) {
        const createdId = String((response as any)?.data?.id || "");
        await uploadComprovanteIfNeeded(createdId);
        const tipoRelatorio = String((response as any)?.data?.tipo_relatorio || "");

        const guiaPayload = {
          pagamentoId: createdId || `PG-${Date.now()}`,
          motoristaId: String(editedPagamento.motoristaId || ""),
          motoristaNome: String(
            editedPagamento.motoristaNome ||
            motoristas.find((m) => m.id === editedPagamento.motoristaId)?.nome ||
            "Favorecido"
          ),
          metodoPagamento: (editedPagamento.metodoPagamento || "pix") as "pix" | "transferencia_bancaria",
          dataPagamento: String(editedPagamento.dataPagamento || format(new Date(), "dd/MM/yyyy", { locale: ptBR })),
          freteIds: selectedFretes.map((id) => String(id).trim()).filter(Boolean),
          totalToneladas: Number(editedPagamento.toneladas || 0),
          valorTonelada: Number(editedPagamento.valorUnitarioPorTonelada || 0),
          valorTotal: Number(editedPagamento.valorTotal || 0),
          tipoRelatorio: (tipoRelatorio || (isInternalCostFlow ? "GUIA_INTERNA" : "PAGAMENTO_TERCEIRO")) as "GUIA_INTERNA" | "PAGAMENTO_TERCEIRO",
        };

        queryClient.invalidateQueries({ queryKey: ["pagamentos"] });
        // refresh fretes pendentes for current motorista and full fretes list
        if (usePendentesEndpoint && motoristaIdForPendentes) {
          queryClient.invalidateQueries({ queryKey: ["fretes", "pendentes", motoristaIdForPendentes] });
        }
        queryClient.invalidateQueries({ queryKey: ["fretes"] });
        const isGuiaInterna = guiaPayload.tipoRelatorio === "GUIA_INTERNA";
        if (isGuiaInterna) {
          if (autoEmitirGuia) handleExportarPDF(guiaPayload);
          toast.success("Fechamento de custo interno confirmado e salvo.");
        } else {
          if (autoEmitirGuia) {
            handleExportarPDF(guiaPayload);
            toast.success("Pagamento registrado e guia emitida com sucesso!");
          } else {
            toast.success("Pagamento registrado com sucesso!");
          }
        }
        setIsModalOpen(false);
        setSelectedFretes([]);
        setIsInternalCostConfirmed(false);
        setIsSaving(false);
      } else {
        toast.error(response.message || "Erro ao criar pagamento");
        setIsSaving(false);
      }
    },
    onError: (error: any) => {
      const isNetwork = !error?.response;
      const msg = isNetwork ? "Erro de rede, tente novamente" : (error?.response?.data?.message || error?.message || "Erro ao criar pagamento");
      toast.error(msg);
      setIsSaving(false);
      setIsInternalCostConfirmed(false);
      // If backend indicates some fretes already paid, refresh pending list to sync UI
      if (String(msg).toLowerCase().includes("alguns fretes ja") || String(msg).toLowerCase().includes("alguns fretes já") || String(msg).toLowerCase().includes("já estão pagos")) {
        if (usePendentesEndpoint && motoristaIdForPendentes) {
          queryClient.invalidateQueries({ queryKey: ["fretes", "pendentes", motoristaIdForPendentes] });
        }
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AtualizarPagamentoPayload }) =>
      pagamentosService.atualizarPagamento(id, data),
    onSuccess: async (response) => {
      if (response.success) {
        await uploadComprovanteIfNeeded(String(editedPagamento.id || ""));
        queryClient.invalidateQueries({ queryKey: ["pagamentos"] });
        if (usePendentesEndpoint && motoristaIdForPendentes) {
          queryClient.invalidateQueries({ queryKey: ["fretes", "pendentes", motoristaIdForPendentes] });
        }
        queryClient.invalidateQueries({ queryKey: ["fretes"] });
        if (autoEmitirGuia) {
          // Precisamos remontoar o payload para a edição (simplificado p/ PDF)
          const isGuiaInterna = isInternalCostFlow;
          handleExportarPDF({
            pagamentoId: String(editedPagamento.id || ""),
            motoristaId: String(editedPagamento.motoristaId || ""),
            motoristaNome: String(editedPagamento.motoristaNome || motoristaSelecionado?.nome || "Favorecido"),
            metodoPagamento: (editedPagamento.metodoPagamento || "pix") as "pix" | "transferencia_bancaria",
            dataPagamento: String(editedPagamento.dataPagamento || ""),
            freteIds: selectedFretes.map((id) => String(id).trim()).filter(Boolean),
            totalToneladas: Number(editedPagamento.toneladas || 0),
            valorTonelada: Number(editedPagamento.valorUnitarioPorTonelada || 0),
            valorTotal: Number(editedPagamento.valorTotal || 0),
            tipoRelatorio: isGuiaInterna ? "GUIA_INTERNA" : "PAGAMENTO_TERCEIRO",
          });
          toast.success("Pagamento atualizado e guia reemitida!");
        } else {
          toast.success("Pagamento atualizado com sucesso!");
        }
        setIsModalOpen(false);
        setIsSaving(false);
      } else {
        toast.error(response.message || "Erro ao atualizar pagamento");
        setIsSaving(false);
      }
    },
    onError: (error: any) => {
      const isNetwork = !error?.response;
      const msg = isNetwork ? "Erro de rede, tente novamente" : (error?.response?.data?.message || error?.message || "Erro ao atualizar pagamento");
      toast.error(msg);
      setIsSaving(false);
      if (String(msg).toLowerCase().includes("alguns fretes ja") || String(msg).toLowerCase().includes("alguns fretes já") || String(msg).toLowerCase().includes("já estão pagos")) {
        if (usePendentesEndpoint && motoristaIdForPendentes) {
          queryClient.invalidateQueries({ queryKey: ["fretes", "pendentes", motoristaIdForPendentes] });
        }
      }
    },
  });

  const handleOpenNewModal = () => {
    resetFormErrors();
    setEditedPagamento({
      motoristaId: "",
      motoristaNome: "",
      dataFrete: format(new Date(), "dd/MM/yyyy", { locale: ptBR }),
      toneladas: 0,
      fretes: 0,
      valorUnitarioPorTonelada: 150,
      valorTotal: 0,
      fretesSelecionados: [],
      dataPagamento: format(new Date(), "dd/MM/yyyy", { locale: ptBR }),
      statusPagamento: "pendente",
      observacoes: "",
    });
    setSelectedFile(null);
    if (selectedFilePreview) {
      URL.revokeObjectURL(selectedFilePreview);
    }
    setSelectedFilePreview(null);
    setSelectedFileIsImage(false);
    setSelectedFileIsPdf(false);
    setSelectedFretes([]);
    setIsInternalCostConfirmed(false);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (pagamento: PagamentoMotorista) => {
    resetFormErrors();
    setEditedPagamento(pagamento);
    setSelectedFretes(pagamento.fretesSelecionados || []);
    setSelectedFile(null);
    if (selectedFilePreview) {
      URL.revokeObjectURL(selectedFilePreview);
    }
    setSelectedFilePreview(null);
    setSelectedFileIsImage(false);
    setSelectedFileIsPdf(false);
    setIsInternalCostConfirmed(false);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  // Abrir modal de edição quando rota /pagamentos/editar/:id for acessada
  const pagamentosParams = useParams();
  useEffect(() => {
    const idParam = pagamentosParams.id;
    if (!idParam) return;
    if (!isLoadingPagamentos && pagamentosApi.length > 0) {
      const found = pagamentosApi.find((p) => String(p.id) === String(idParam));
      if (found) handleOpenEditModal(found as unknown as PagamentoMotorista);
    }
  }, [pagamentosParams.id, isLoadingPagamentos, pagamentosApi]);

  const handleMotoristaChange = (motoristaId: string) => {
    // Handle clearing selection (placeholder uses 'none')
    if (motoristaId === "none" || motoristaId === "") {
      setSelectedFretes([]);
      clearFormError("motoristaId");
      clearFormError("fretes");
      setEditedPagamento({
        ...editedPagamento,
        motoristaId: "",
        motoristaNome: "",
        toneladas: 0,
        fretes: 0,
        valorTotal: 0,
        fretesSelecionados: [],
        metodoPagamento: undefined,
      });
      setIsInternalCostConfirmed(false);
      return;
    }

    const motorista =
      motoristas.find((m) => m.id === motoristaId) ||
      motoristasComPendentes.find((m) => m.id === motoristaId);
    setSelectedFretes([]);
    clearFormError("motoristaId");
    clearFormError("fretes");
    setEditedPagamento({
      ...editedPagamento,
      motoristaId,
      motoristaNome: motorista?.nome || "",
      toneladas: 0,
      fretes: 0,
      valorTotal: 0,
      fretesSelecionados: [],
      metodoPagamento: motorista?.tipoPagamento || "pix",
    });
    setIsInternalCostConfirmed(false);
  };

  // Buscar fretes não pagos do motorista selecionado
  const fretesNaoPagos = useMemo(() => {
    // prefer pendentes endpoint result; fallback to full list filter
    if (!editedPagamento?.motoristaId) return [];
    if (usePendentesEndpoint && fretesPendentesData && fretesPendentesData.length > 0) {
      return fretesPendentesData;
    }
    return fretesData.filter(
      (f) =>
        f.motoristaId === editedPagamento.motoristaId &&
        (f.pagamentoId == null || String(f.pagamentoId) === "0")
    );
  }, [editedPagamento?.motoristaId, usePendentesEndpoint, fretesPendentesData, fretesData]);

  const fretesRefs = (isEditing
    ? editedPagamento?.fretesSelecionados
    : selectedPagamento?.fretesSelecionados) || [];
  const fretesDoPagamento = fretesRefs
    .map((ref) => resolveFreteByRef(ref))
    .filter((frete): frete is NonNullable<typeof frete> => !!frete)
    .filter((frete, index, array) => array.findIndex((item) => item.id === frete.id) === index);

  const fretesDisponiveis = isEditing ? fretesDoPagamento : fretesNaoPagos;

  const handleToggleFrete = (freteId: string) => {
    if (isEditing) return;
    // prefer pending fretes list, fallback to full fretesData
    const frete =
      (usePendentesEndpoint ? fretesPendentesData.find((f) => f.id === freteId) : undefined) ||
      fretesData.find((f) => f.id === freteId);
    if (!frete) return;

    // If frete is already linked to a payment different from current edited payment, block selection
    if (frete.pagamentoId && frete.pagamentoId !== (editedPagamento?.id ?? null)) {
      toast.error("Este frete já foi pago e não pode ser selecionado.");
      return;
    }

    const isSelected = selectedFretes.includes(freteId);
    const nextSelected = isSelected
      ? selectedFretes.filter((id) => id !== freteId)
      : [...selectedFretes, freteId];

    const fretesSelecionados = fretesData.filter((f) => nextSelected.includes(f.id));
    const toneladas = fretesSelecionados.reduce((acc, f) => acc + f.toneladas, 0);
    const valorBruto = fretesSelecionados.reduce((acc, f) => acc + f.valorGerado, 0);
    const custosTotais = nextSelected.reduce(
      (acc, freteId) => acc + getTotalCustosByFreteRef(freteId),
      0
    );
    const valorTotal = valorBruto - custosTotais;
    const dataFrete = fretesSelecionados.map((f) => f.dataFrete).join(", ");
    const valorUnitario = toneladas > 0 ? valorTotal / toneladas : 0;

    setSelectedFretes(nextSelected);
    if (nextSelected.length > 0) {
      clearFormError("fretes");
    }
    setEditedPagamento({
      ...editedPagamento,
      toneladas,
      fretes: fretesSelecionados.length,
      valorTotal,
      dataFrete: dataFrete || format(new Date(), "dd/MM/yyyy", { locale: ptBR }),
      valorUnitarioPorTonelada: Number(valorUnitario.toFixed(2)),
      fretesSelecionados: nextSelected,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Formato inválido", { description: "Use PDF ou imagem (JPG, PNG, WEBP)." });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Arquivo muito grande (máximo 5MB)");
        return;
      }
      if (selectedFilePreview) {
        URL.revokeObjectURL(selectedFilePreview);
      }
      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";
      setSelectedFileIsImage(isImage);
      setSelectedFileIsPdf(isPdf);
      setSelectedFilePreview(URL.createObjectURL(file));
      setSelectedFile(file);
    }
  };

  const metodoPagamentoAtual = isInternalCostFlow
    ? "pix"
    : (motoristaSelecionado?.tipoPagamento || editedPagamento.metodoPagamento || "pix");

  const buildPeriodoFretes = (freteIds: string[]) => {
    const datas = freteIds
      .map((id) => fretesData.find((f) => f.id === id)?.dataFrete)
      .filter((value): value is string => !!value)
      .map((value) => parse(value, "dd/MM/yyyy", new Date()))
      .filter((value) => !Number.isNaN(value.getTime()));

    if (datas.length === 0) return "";

    const sorted = datas.sort((a, b) => a.getTime() - b.getTime());
    const inicio = sorted[0];
    const fim = sorted[sorted.length - 1];

    const mesmoMes = inicio.getMonth() === fim.getMonth() && inicio.getFullYear() === fim.getFullYear();

    // Se é o mesmo dia, mostrar apenas uma data
    if (inicio.getDate() === fim.getDate() && mesmoMes) {
      return format(inicio, "dd/MM/yyyy");
    }

    if (mesmoMes) {
      return `${format(inicio, "dd")} a ${format(fim, "dd")} de ${format(inicio, "MMMM/yyyy", { locale: ptBR })}`;
    }

    return `${format(inicio, "dd/MM/yyyy")} a ${format(fim, "dd/MM/yyyy")}`;
  };

  const getDadosPagamentoMotorista = (
    motoristaId: string,
    metodoFallback?: "pix" | "transferencia_bancaria"
  ) => {
    const motorista = motoristas.find((m) => String(m.id) === String(motoristaId));
    const metodo = motorista?.tipoPagamento || metodoFallback || "pix";

    if (metodo === "pix") {
      const tipoChave = motorista?.chavePixTipo
        ? String(motorista.chavePixTipo).toUpperCase()
        : "N/I";
      const chave = motorista?.chavePix || "Chave PIX não cadastrada";
      return {
        metodoLabel: "PIX",
        dadosLabel: `Tipo: ${tipoChave} | Chave: ${chave}`,
      };
    }

    const banco = motorista?.banco || "Banco não informado";
    const agencia = motorista?.agencia || "N/I";
    const conta = motorista?.conta || "N/I";
    const tipoConta = motorista?.tipoConta === "corrente"
      ? "Corrente"
      : motorista?.tipoConta === "poupanca"
        ? "Poupança"
        : "N/I";

    return {
      metodoLabel: "Transferência Bancária",
      dadosLabel: `Banco: ${banco} | Agência: ${agencia} | Conta: ${conta} | Tipo: ${tipoConta}`,
    };
  };

  const handleExportarPDF = (params: {
    pagamentoId: string;
    motoristaId: string;
    motoristaNome: string;
    metodoPagamento: "pix" | "transferencia_bancaria";
    dataPagamento: string;
    freteIds: string[];
    totalToneladas: number;
    valorTonelada: number;
    valorTotal: number;
    tipoRelatorio?: "GUIA_INTERNA" | "PAGAMENTO_TERCEIRO";
  }) => {
    const dadosPagamento = getDadosPagamentoMotorista(params.motoristaId, params.metodoPagamento);
    const normalizeRef = (value: string) =>
      String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");

    const resolveFreteByRef = (ref: string) => {
      const token = String(ref || "").trim();
      if (!token) return undefined;
      const tokenLower = token.toLowerCase();
      const tokenNorm = normalizeRef(token);
      return fretesData.find((f) => {
        const id = String(f.id || "").trim().toLowerCase();
        const codigo = String(f.codigoFrete || "").trim().toLowerCase();
        const codigoRaw = String((f as any).codigoFreteRaw || "").trim().toLowerCase();
        if (id === tokenLower || codigo === tokenLower || codigoRaw === tokenLower) return true;
        const idNorm = normalizeRef(id);
        const codigoNorm = normalizeRef(codigo);
        const codigoRawNorm = normalizeRef(codigoRaw);
        return idNorm === tokenNorm || codigoNorm === tokenNorm || codigoRawNorm === tokenNorm;
      });
    };

    const fretesSelecionados = params.freteIds
      .map((ref) => resolveFreteByRef(ref))
      .filter((frete): frete is NonNullable<typeof frete> => !!frete)
      .filter((frete, index, array) => array.findIndex((item) => item.id === frete.id) === index);

    const fretesParam = fretesSelecionados.map(frete => {
      const custosFrete = getTotalCustosByFreteRef(frete.id);
      const custosDetalhados = getCustosByFreteRef(frete.id).map(c => ({ descricao: c.descricao, valor: c.valor }));
      return {
        id: String(frete.id),
        codigo: String(frete.codigoFrete || frete.id),
        dataFrete: String(frete.dataFrete || ""),
        rota: String(frete.rota || ""),
        toneladas: Number(frete.toneladas || 0),
        valorGerado: Number(frete.valorGerado || 0),
        custosTotal: custosFrete,
        valorLiquido: Number(frete.valorGerado || 0) - custosFrete,
        custos: custosDetalhados
      };
    });

    const totalCustos = fretesParam.reduce((acc, f) => acc + f.custosTotal, 0);
    const valorGeradoBruto = fretesParam.reduce((acc, f) => acc + f.valorGerado, 0);

    const pdfParams: PagamentoPDFParams = {
      pagamentoId: params.pagamentoId,
      motoristaNome: params.motoristaNome,
      tipoRelatorio: params.tipoRelatorio,
      fretes: fretesParam,
      totalToneladas: Number(params.totalToneladas) || 0,
      valorGeradoBruto,
      totalCustos,
      valorAPagar: valorGeradoBruto - totalCustos,
      dadosPagamento: {
        metodoLabel: dadosPagamento.metodoLabel,
        dadosLabel: dadosPagamento.dadosLabel
      }
    };

    exportarGuiaPagamentoIndividual(pdfParams);
  };

  const handleSave = () => {
    // prevent double-submit
    const isMutationPending = createMutation.status === "pending" || updateMutation.status === "pending";
    if (isMutationPending) return;
    setIsSaving(true);

    const nextErrors: FormErrors = { motoristaId: "", fretes: "" };
    if (!editedPagamento.motoristaId) {
      nextErrors.motoristaId = "Selecione um proprietário/favorecido.";
    }
    if (selectedFretes.length === 0) {
      nextErrors.fretes = "Selecione ao menos um frete.";
    }
    if (nextErrors.motoristaId || nextErrors.fretes) {
      setFormErrors(nextErrors);
      triggerShake();
      setIsSaving(false);
      return;
    }

    if (isInternalCostFlow && !isInternalCostConfirmed) {
      toast.error("Confirme o fechamento de custo interno para continuar.");
      setIsSaving(false);
      return;
    }

    // Validate that selected fretes are not already linked to another payment
    const conflicting = selectedFretes.find((id) => {
      const f = fretesData.find((ff) => ff.id === id);
      if (!f) return false;
      // allow if editing and the frete is linked to the same payment being edited
      if (f.pagamentoId && isEditing && editedPagamento?.id && String(f.pagamentoId) === String(editedPagamento.id)) return false;
      return !!f.pagamentoId;
    });

    if (conflicting) {
      toast.error("Um ou mais fretes selecionados já estão vinculados a outro pagamento.");
      // refresh pendentes to sync UI
      if (usePendentesEndpoint && motoristaIdForPendentes) queryClient.invalidateQueries({ queryKey: ["fretes", "pendentes", motoristaIdForPendentes] });
      setIsSaving(false);
      return;
    }

    const nomeFavorecidoResolvido = (
      editedPagamento.motoristaNome ||
      motoristasComPendentes.find((m) => m.id === editedPagamento.motoristaId)?.nome ||
      fretesNaoPagos.find((f) => f.motoristaId === editedPagamento.motoristaId)?.motoristaNome ||
      ""
    ).trim();

    if (!nomeFavorecidoResolvido) {
      toast.error("Não foi possível identificar o nome do favorecido para este pagamento.");
      setIsSaving(false);
      return;
    }

    const payload: CriarPagamentoPayload = {
      motorista_id: editedPagamento.motoristaId,
      motorista_nome: nomeFavorecidoResolvido.toUpperCase(),
      proprietario_id: editedPagamento.motoristaId,
      proprietario_nome: nomeFavorecidoResolvido.toUpperCase(),
      periodo_fretes: (buildPeriodoFretes(selectedFretes) || editedPagamento.dataFrete || "").trim().toUpperCase(),
      quantidade_fretes: selectedFretes.length,
      fretes_incluidos: selectedFretes.join(","),
      total_toneladas: editedPagamento.toneladas || 0,
      valor_por_tonelada: editedPagamento.valorUnitarioPorTonelada || 0,
      valor_total: editedPagamento.valorTotal || 0,
      data_pagamento: toApiDate(editedPagamento.dataPagamento || ""),
      status: isInternalCostFlow ? "pago" : (editedPagamento.statusPagamento || "pendente"),
      comprovante_nome: isInternalCostFlow ? undefined : selectedFile?.name,
      comprovante_url: isInternalCostFlow ? undefined : editedPagamento.comprovante?.url,
      observacoes: editedPagamento.observacoes,
    };

    if (isEditing && editedPagamento.id) {
      updateMutation.mutate({ id: editedPagamento.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Filtrar dados com base em busca e filtros
  const filteredData = pagamentosFiltradosTransformados.filter((pagamento) => {
    const matchesSearch =
      pagamento.motoristaNome.toLowerCase().includes(search.toLowerCase()) ||
      pagamento.id.includes(search);
    const matchesStatus =
      statusFilter === "all" || pagamento.statusPagamento === statusFilter;
    const matchesMotorista =
      motoristaFilter === "all" || pagamento.motoristaId === motoristaFilter;
    return matchesSearch && matchesStatus && matchesMotorista;
  });

  // Lógica de paginação
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Resetar para página 1 quando aplicar novos filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, motoristaFilter]);

  // Função para exportar Resumo Geral (Mockada temporariamente)
  const handleExportarGeralPDF = () => {
    toast.info("Exportação geral de pagamentos estará disponível em breve.");
  };

  const columns = [
    {
      key: "id",
      header: "ID Pagamento",
      render: (item: PagamentoMotorista) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary/60" />
          <span className="font-mono font-bold text-primary">{item.id}</span>
        </div>
      ),
    },
    {
      key: "motoristaNome",
      header: "Favorecido",
      render: (item: PagamentoMotorista) => (
        <div className="flex items-start gap-3 py-2">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold">
              {item.motoristaNome
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground">{shortName(item.motoristaNome)}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground font-medium">{item.dataFrete}</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "toneladas",
      header: "Fretes",
      render: (item: PagamentoMotorista) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{item.toneladas}t</span>
          </div>
          <p className="text-xs text-muted-foreground">{item.fretes} frete(s)</p>
        </div>
      ),
    },
    {
      key: "valorTotal",
      header: "Valor",
      render: (item: PagamentoMotorista) => (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-profit" />
          <span className="font-bold text-profit">
            R$ {item.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      ),
    },
    {
      key: "statusPagamento",
      header: "Status",
      render: (item: PagamentoMotorista) => (
        <div className="space-y-2">
          <Badge variant={statusConfig[item.statusPagamento].variant}>
            {statusConfig[item.statusPagamento].label}
          </Badge>
          <p className="text-xs text-muted-foreground">{item.dataPagamento}</p>
        </div>
      ),
    },
    {
      key: "comprovante",
      header: "Comprovante",
      render: (item: PagamentoMotorista) => (
        <div className="flex items-center gap-2">
          {item.comprovante ? (
            <Button
              variant="ghost"
              size="icon"
              className="text-xs"
              title={`Visualizar: ${item.comprovante.nome}`}
              onClick={(e) => {
                e.stopPropagation();
                const url = getComprovanteUrl(item.comprovante?.url);
                if (!url) {
                  toast.error("Comprovante sem URL");
                  return;
                }
                setComprovanteDialog({
                  url,
                  nome: item.comprovante?.nome || "Comprovante",
                  ...parseFileType(`${url} ${item.comprovante?.nome || ""}`),
                });
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">Sem anexo</span>
          )}
        </div>
      ),
    },
  ];

  const totalPendente = pagamentosData
    .filter((p) => p.statusPagamento === "pendente")
    .reduce((acc, p) => acc + p.valorTotal, 0);

  const totalPago = pagamentosData
    .filter((p) => p.statusPagamento === "pago")
    .reduce((acc, p) => acc + p.valorTotal, 0);

  if (isLoadingPagamentos) {
    return (
      <MainLayout title="Pagamentos" subtitle="Registro de pagamentos por proprietário/favorecido">
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Carregando pagamentos...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Pagamentos" subtitle="Registro de pagamentos por proprietário/favorecido">
      <PageHeader
        title="Pagamentos por Favorecido"
        description="Registre e acompanhe os pagamentos pelos fretes realizados"
        actions={
          <div className="hidden lg:flex items-center gap-3">
            <PeriodoFilter
              tipoVisualizacao={tipoVisualizacao}
              selectedPeriodo={selectedPeriodo}
              periodosDisponiveis={periodosDisponiveis}
              formatPeriodoLabel={formatPeriodoLabel}
              onTipoChange={setTipoVisualizacao}
              onPeriodoChange={setSelectedPeriodo}
            />

            {/* Botão Exportar PDF */}
            <Button variant="outline" onClick={handleExportarGeralPDF} className="gap-2">
              <FileDown className="h-4 w-4" />
              Exportar PDF
            </Button>

            {/* Botão Novo Pagamento */}
            <Button onClick={handleOpenNewModal}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Pagamento
            </Button>
          </div>
        }
      />

      {/* Summary Cards com KPIs Comparativos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6">
        <Card className="p-4 md:p-6 bg-gradient-to-br from-primary/5 to-transparent border-l-4 border-l-primary hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total de Registros</p>
              <p className="text-2xl md:text-4xl font-bold mt-2 text-foreground">{pagamentosFiltradosTransformados.length}</p>
              <p className="text-[10px] md:text-xs text-primary mt-2 flex items-center gap-1">
                {pagamentosFiltradosTransformados.length === 0 ? "Nenhum pagamento neste período" : "Pagamentos cadastrados"}
              </p>
            </div>
            <FileText className="h-8 w-8 md:h-12 md:w-12 text-primary/20" />
          </div>
        </Card>

        <Card className="p-4 md:p-6 bg-gradient-to-br from-yellow-50 to-yellow-50/30 dark:from-yellow-950/20 dark:to-yellow-950/10 border-l-4 border-l-yellow-600 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-semibold text-yellow-700 dark:text-yellow-300 uppercase tracking-wide">Pendente de Pagamento</p>
              <p className="text-2xl md:text-4xl font-bold mt-2 text-yellow-700 dark:text-yellow-400">
                R$ {pagamentosFiltradosTransformados
                  .filter((p) => p.statusPagamento === "pendente")
                  .reduce((acc, p) => acc + p.valorTotal, 0)
                  .toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] md:text-xs text-yellow-600 dark:text-yellow-400 mt-2 flex items-center gap-1">
                {pagamentosFiltradosTransformados.filter(p => p.statusPagamento === "pendente").length} pagamentos
              </p>
            </div>
            <Clock className="h-8 w-8 md:h-12 md:w-12 text-yellow-600/20" />
          </div>
        </Card>

        <Card className="p-4 md:p-6 bg-gradient-to-br from-profit/5 to-profit/5 dark:from-profit/5 dark:to-profit/5 border-l-4 border-l-profit hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-semibold text-profit/70 uppercase tracking-wide">Já Pago</p>
              <p className="text-2xl md:text-4xl font-bold mt-2 text-profit">
                R$ {pagamentosFiltradosTransformados
                  .filter((p) => p.statusPagamento === "pago")
                  .reduce((acc, p) => acc + p.valorTotal, 0)
                  .toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-[10px] md:text-xs text-profit/70 flex items-center gap-1">
                  {pagamentosFiltradosTransformados.filter(p => p.statusPagamento === "pago").length} pagamentos
                </p>
                {(() => {
                  const totalAtual = pagamentosFiltradosTransformados
                    .filter((p) => p.statusPagamento === "pago")
                    .reduce((acc, p) => acc + p.valorTotal, 0);
                  const variacao = dadosMesAnterior.totalPago > 0
                    ? ((totalAtual - dadosMesAnterior.totalPago) / dadosMesAnterior.totalPago) * 100
                    : 0;
                  const temDados = totalAtual > 0;

                  return temDados && Math.abs(variacao) > 0 ? (
                    <Badge
                      variant={variacao < 0 ? "completed" : "cancelled"}
                      className={cn(
                        "text-xs px-2 py-0.5 flex items-center gap-1",
                        variacao < 0
                          ? "bg-profit/10 text-profit border-profit/20"
                          : "bg-loss/10 text-loss border-loss/20"
                      )}
                    >
                      {variacao < 0 ? (
                        <>
                          <TrendingDown className="h-3 w-3" />
                          {Math.abs(variacao).toFixed(0)}% vs mês anterior
                        </>
                      ) : (
                        <>
                          <TrendingUp className="h-3 w-3" />
                          +{variacao.toFixed(0)}% vs mês anterior
                        </>
                      )}
                    </Badge>
                  ) : null;
                })()}
              </div>
            </div>
            <Check className="h-8 w-8 md:h-12 md:w-12 text-profit/20" />
          </div>
        </Card>
      </div>

      {/* Mobile Filters */}
      <div className="lg:hidden mb-4">
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh]">
            <SheetHeader>
              <SheetTitle>Filtros e Acoes</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4 overflow-y-auto max-h-[calc(85vh-120px)]">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Periodo</Label>
                <PeriodoFilter
                  tipoVisualizacao={tipoVisualizacao}
                  selectedPeriodo={selectedPeriodo}
                  periodosDisponiveis={periodosDisponiveis}
                  formatPeriodoLabel={formatPeriodoLabel}
                  onTipoChange={setTipoVisualizacao}
                  onPeriodoChange={setSelectedPeriodo}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Buscar</Label>
                <Input
                  placeholder="Buscar por favorecido ou ID de pagamento..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Proprietário / Favorecido</Label>
                <Select value={motoristaFilter} onValueChange={setMotoristaFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Proprietário / Favorecido" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    <SelectItem value="all">Todos</SelectItem>
                    {motoristas.map((motorista) => (
                      <SelectItem key={motorista.id} value={motorista.id}>
                        {shortName(motorista.nome)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="processando">Processando</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-sm font-medium">Acoes</Label>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleExportarGeralPDF();
                      setFiltersOpen(false);
                    }}
                    className="w-full gap-2"
                  >
                    <FileDown className="h-4 w-4" />
                    Exportar PDF
                  </Button>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <Button variant="outline" onClick={clearFilters} className="flex-1">
                  Limpar
                </Button>
                <Button onClick={() => setFiltersOpen(false)} className="flex-1">
                  Aplicar
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Filters */}
      <FilterBar
        className="hidden lg:flex"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por favorecido ou ID de pagamento..."
      >
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground block">Proprietário / Favorecido</Label>
          <Select value={motoristaFilter} onValueChange={setMotoristaFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Proprietário / Favorecido" />
            </SelectTrigger>
            <SelectContent className="max-h-64 overflow-y-auto">
              <SelectItem value="all">Todos</SelectItem>
              {motoristas.map((motorista) => (
                <SelectItem key={motorista.id} value={motorista.id}>
                  {motorista.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground block">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="processando">Processando</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FilterBar>

      {/* FAB: Novo Pagamento (Mobile) */}
      <Button
        onClick={handleOpenNewModal}
        className="lg:hidden fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg p-0"
        size="icon"
        aria-label="Novo Pagamento"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <DataTable<PagamentoMotorista>
        columns={columns}
        data={paginatedData}
        onRowClick={(item) => setSelectedPagamento(item)}
        emptyMessage="Nenhum pagamento encontrado"
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(Math.max(1, currentPage - 1));
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const isCurrentPage = page === currentPage;
                const isVisible = Math.abs(page - currentPage) <= 1 || page === 1 || page === totalPages;

                if (!isVisible) {
                  return null;
                }

                if (page === 2 && currentPage > 3) {
                  return (
                    <PaginationItem key="ellipsis-start">
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }

                if (page === totalPages - 1 && currentPage < totalPages - 2) {
                  return (
                    <PaginationItem key="ellipsis-end">
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }

                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(page);
                      }}
                      isActive={isCurrentPage}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(Math.min(totalPages, currentPage + 1));
                  }}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          <div className="text-xs text-muted-foreground ml-4 flex items-center">
            Página {currentPage} de {totalPages} • {filteredData.length} registros
          </div>
        </div>
      )}

      {/* Payment Detail Modal */}
      <Dialog open={!!selectedPagamento} onOpenChange={() => setSelectedPagamento(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Detalhes do Pagamento</DialogTitle>
              <DialogDescription className="sr-only">
                Detalhes do pagamento e ações disponíveis.
              </DialogDescription>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!selectedPagamento) return;
                    handleExportarPDF({
                      pagamentoId: selectedPagamento.id,
                      motoristaId: selectedPagamento.motoristaId,
                      motoristaNome: selectedPagamento.motoristaNome,
                      metodoPagamento: selectedPagamento.metodoPagamento,
                      dataPagamento: selectedPagamento.dataPagamento,
                      freteIds: selectedPagamento.fretesSelecionados || [],
                      totalToneladas: Number(selectedPagamento.toneladas || 0),
                      valorTonelada: Number(selectedPagamento.valorUnitarioPorTonelada || 0),
                      valorTotal: Number(selectedPagamento.valorTotal || 0),
                      tipoRelatorio: selectedPagamento.tipoRelatorio,
                    });
                  }}
                  className="gap-2"
                >
                  <FileDown className="h-4 w-4" />
                  Reimprimir PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedPagamento) {
                      handleOpenEditModal(selectedPagamento);
                      setSelectedPagamento(null);
                    }
                  }}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="max-h-[calc(90vh-200px)] overflow-y-auto px-1">
            {selectedPagamento && (
              <div className="space-y-6">
                {/* Header */}
                <Card className="p-4 bg-gradient-to-br from-primary/5 to-transparent">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">ID Pagamento</p>
                      <p className="text-base font-semibold font-mono text-primary">
                        {selectedPagamento.id}
                      </p>
                    </div>
                    <Badge variant={statusConfig[selectedPagamento.statusPagamento].variant} className="text-xs px-2 py-1">
                      {statusConfig[selectedPagamento.statusPagamento].label}
                    </Badge>
                  </div>
                </Card>

                {/* Motorista Info */}
                <div>
                  <h3 className="font-semibold mb-3">Informações do Favorecido</h3>
                  <Card className="p-4 flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                        {selectedPagamento.motoristaNome
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-lg font-bold">{selectedPagamento.motoristaNome}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium">
                          {selectedPagamento.dataFrete}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                <Separator />

                {/* Fretes Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                    <p className="text-sm text-muted-foreground mb-1">Toneladas</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {selectedPagamento.toneladas}t
                    </p>
                  </Card>
                  <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900">
                    <p className="text-sm text-muted-foreground mb-1">Fretes</p>
                    <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                      {selectedPagamento.fretes}
                    </p>
                  </Card>
                  <Card className="p-4 bg-profit/5 border-profit/20">
                    <p className="text-sm text-muted-foreground mb-1">Valor/Tonelada</p>
                    <p className="text-3xl font-bold text-profit">
                      R$ {selectedPagamento.valorUnitarioPorTonelada}
                    </p>
                  </Card>
                </div>

                {/* Fretes com Descontos */}
                {fretesDoPagamento.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Fretes com Detalhamento de Custos</h3>
                    <div className="space-y-3">
                      {fretesDoPagamento.map((frete) => {
                        const custosFrete = getCustosByFreteRef(frete.id);
                        const totalCustos = custosFrete.reduce((sum, c) => sum + c.valor, 0);
                        const valorLiquido = frete.valorGerado - totalCustos;
                        return (
                          <Card key={frete.id} className="p-4 bg-muted/30">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-foreground">
                                    {frete.codigoFrete || frete.id} • {frete.rota}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {frete.dataFrete} • {frete.toneladas}t
                                  </p>
                                </div>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  Bruto
                                </Badge>
                              </div>

                              <div className="bg-background p-3 rounded border border-blue-200 dark:border-blue-900">
                                <p className="text-sm font-semibold text-blue-600">
                                  R$ {frete.valorGerado.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                              </div>

                              {custosFrete.length > 0 && (
                                <>
                                  <div className="border-t pt-3 space-y-2">
                                    <p className="text-xs font-semibold text-muted-foreground mb-2">Descontos (Custos Adicionais):</p>
                                    {custosFrete.map((custo, idx) => (
                                      <div key={idx} className="flex items-center justify-between text-sm bg-loss/5 p-2 rounded">
                                        <span className="text-muted-foreground">• {custo.descricao}</span>
                                        <span className="font-semibold text-loss">
                                          -R$ {custo.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                      </div>
                                    ))}
                                    <div className="flex items-center justify-between text-xs font-semibold pt-2 border-t border-loss/20">
                                      <span className="text-loss">Total de Descontos:</span>
                                      <span className="text-loss">-R$ {totalCustos.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                  </div>

                                  <div className="bg-profit/5 border border-profit/20 p-3 rounded">
                                    <p className="text-xs text-muted-foreground mb-1">Valor Líquido (após descontos)</p>
                                    <p className="text-lg font-bold text-profit">
                                      R$ {valorLiquido.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Resumo de Valores com Descontos */}
                <div>
                  <h3 className="font-semibold mb-3">Resumo Financeiro</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                      <p className="text-xs text-muted-foreground mb-1">Valor Bruto (Fretes)</p>
                      <p className="text-2xl font-bold text-blue-600">
                        R$ {fretesDoPagamento.reduce((acc, f) => acc + f.valorGerado, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </Card>
                    <Card className="p-4 bg-loss/10 border-loss/20">
                      <p className="text-xs text-muted-foreground mb-1">Total de Descontos</p>
                      <p className="text-2xl font-bold text-loss">
                        -R$ {fretesDoPagamento
                          .reduce((acc, frete) => {
                            return (
                              acc +
                              getTotalCustosByFreteRef(frete.id)
                            );
                          }, 0)
                          .toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </Card>
                    <Card className="p-4 bg-profit/5 border-profit/20">
                      <p className="text-xs text-muted-foreground mb-1">Valor Líquido a Pagar</p>
                      <p className="text-2xl font-bold text-profit">
                        R$ {(selectedPagamento.valorTotal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </Card>
                  </div>
                </div>

                {/* Value */}
                <Card className="p-6 bg-gradient-to-br from-profit/10 to-transparent border-profit/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Valor Total a Pagar</p>
                      <p className="text-4xl font-bold text-profit">
                        R$ {selectedPagamento.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <DollarSign className="h-16 w-16 text-profit/20" />
                  </div>
                </Card>

                {/* Payment Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground mb-2">Data do Pagamento</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="font-semibold">{selectedPagamento.dataPagamento}</p>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground mb-2">Método de Pagamento</p>
                    <p className="font-semibold">
                      {selectedPagamento.metodoPagamento === "pix"
                        ? "PIX"
                        : "Transferência Bancária"}
                    </p>
                  </Card>
                </div>

                {/* Comprovante */}
                {selectedPagamento.comprovante && (
                  <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Paperclip className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm text-muted-foreground mb-0.5">
                            Comprovante de Pagamento
                          </p>
                          <p className="font-semibold text-green-600">
                            {selectedPagamento.comprovante.nome}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Enviado em {selectedPagamento.comprovante.datadoUpload}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          const url = getComprovanteUrl(selectedPagamento.comprovante?.url);
                          if (!url) {
                            toast.error("Comprovante sem URL");
                            return;
                          }
                          setComprovanteDialog({
                            url,
                            nome: selectedPagamento.comprovante?.nome || "Comprovante",
                            ...parseFileType(`${url} ${selectedPagamento.comprovante?.nome || ""}`),
                          });
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        Visualizar
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Observações */}
                {selectedPagamento.observacoes && (
                  <Card className="p-4 bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-2">Observações</p>
                    <p className="text-foreground">{selectedPagamento.observacoes}</p>
                  </Card>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!comprovanteDialog}
        onOpenChange={(open) => {
          if (!open) setComprovanteDialog(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Comprovante</DialogTitle>
            <DialogDescription className="sr-only">
              Visualização do arquivo de comprovante.
            </DialogDescription>
          </DialogHeader>
          {comprovanteDialog && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{comprovanteDialog.nome}</p>
              {comprovanteDialog.isImage ? (
                <img
                  src={comprovanteDialog.url}
                  alt={comprovanteDialog.nome}
                  className="max-h-[70vh] w-full rounded-md object-contain"
                />
              ) : comprovanteDialog.isPdf ? (
                <iframe
                  src={comprovanteDialog.url}
                  title={comprovanteDialog.nome}
                  className="h-[70vh] w-full rounded-md border"
                />
              ) : (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Não foi possível identificar o tipo do arquivo para preview direto.
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => window.open(comprovanteDialog.url, "_blank")}
                  >
                    <Download className="h-4 w-4" />
                    Abrir PDF
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Modal */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (isSaving) return;
          setIsModalOpen(open);
          resetFormErrors();
        }}
      >
        <DialogContent className={cn("max-w-2xl", isShaking && "animate-shake")}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Pagamento" : "Registrar Novo Pagamento"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {isEditing ? "Editar dados do pagamento." : "Registrar um novo pagamento."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[calc(90vh-200px)] overflow-y-auto px-1">
            {/* Motorista Selection */}
            <div className="space-y-2">
              <Label htmlFor="motorista">Proprietário / Favorecido *</Label>
              <Select
                value={editedPagamento.motoristaId || ""}
                onValueChange={handleMotoristaChange}
                onOpenChange={(open) => {
                  if (open) clearFormError("motoristaId");
                }}
                disabled={isEditing}
              >
                <SelectTrigger className={cn(fieldErrorClass(formErrors.motoristaId))}>
                  <SelectValue placeholder="Selecione um proprietário/favorecido" />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  {isEditing ? (
                    <SelectItem value={editedPagamento.motoristaId || ""}>
                      {editedPagamento.motoristaNome || "Favorecido"}
                    </SelectItem>
                  ) : motoristasComPendentes.length === 0 ? (
                    <SelectItem value="none" disabled>Nenhum favorecido com pagamentos pendentes</SelectItem>
                  ) : (
                    motoristasComPendentes.map((motorista) => (
                      <SelectItem key={motorista.id} value={motorista.id}>
                        {motorista.nome}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FieldError message={formErrors.motoristaId} />
            </div>

            {/* Seleção de Fretes */}
            {editedPagamento.motoristaId && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Selecione os fretes para pagamento *</Label>
                  {fretesDisponiveis.length > 0 && (
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                      {fretesDisponiveis.length} frete{fretesDisponiveis.length > 1 ? "s" : ""} {isEditing ? "vinculado" : "aguardando"}
                    </Badge>
                  )}
                </div>
                <FieldError message={formErrors.fretes} />
                {fretesDisponiveis.length === 0 ? (
                  <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {isEditing
                        ? "Este pagamento não possui fretes vinculados."
                        : "Este favorecido não possui fretes pendentes de pagamento"}
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {fretesDisponiveis.map((frete) => (
                      <Card
                        key={frete.id}
                        className={cn(
                          "p-4 transition-all border-2",
                          selectedFretes.includes(frete.id)
                            ? "border-green-400 bg-green-50 dark:bg-green-950/20 shadow-sm"
                            : "border-border hover:border-green-300 dark:hover:border-green-700 hover:shadow-sm"
                        )}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleToggleFrete(frete.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleToggleFrete(frete.id);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1">
                            <Checkbox
                              id={`frete-${frete.id}`}
                              checked={selectedFretes.includes(frete.id)}
                              onCheckedChange={() => handleToggleFrete(frete.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-5 w-5"
                              disabled={isEditing}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                  {frete.codigoFrete || frete.id}
                                </p>
                                <span className="text-slate-400 dark:text-slate-500">•</span>
                                <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                                  {frete.rota}
                                </p>
                                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs ml-auto border-blue-200 dark:border-blue-800">
                                  Aguardando
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                📅 {frete.dataFrete} • 📦 {frete.toneladas} toneladas
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 min-w-max">
                            <div className={cn(
                              "text-base font-bold px-3 py-1 rounded-lg",
                              selectedFretes.includes(frete.id)
                                ? "bg-green-500 text-white dark:bg-green-600"
                                : "text-green-600 dark:text-green-500"
                            )}>
                              R$ {frete.valorGerado.toLocaleString("pt-BR")}
                            </div>
                            <p className={cn(
                              "text-xs font-semibold px-2 py-1 rounded",
                              selectedFretes.includes(frete.id)
                                ? "bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200"
                                : "text-slate-400 dark:text-slate-500"
                            )}>
                              {selectedFretes.includes(frete.id) ? "✓ Selecionado" : "○ Não selecionado"}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Fretes Info */}
            {editedPagamento.toneladas ? (
              <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Toneladas</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {editedPagamento.toneladas}t
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Fretes</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {editedPagamento.fretes}
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              editedPagamento.motoristaId && fretesNaoPagos.length === 0 && (
                <Card className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900 flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Este favorecido não possui fretes pendentes de pagamento
                  </p>
                </Card>
              )
            )}

            <Separator />

            {/* Resumo de Valores com Descontos */}
            {selectedFretes.length > 0 && (
              <div className="space-y-4">
                {/* Detalhamento por Frete */}
                <div className="space-y-3 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-800/40 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Detalhamento de Custos por Frete</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {fretesDisponiveis
                      .filter((f) => selectedFretes.includes(f.id))
                      .map((frete) => {
                        const custosFrete = getCustosByFreteRef(frete.id);
                        const totalCustos = custosFrete.reduce((sum, c) => sum + c.valor, 0);
                        const valorLiquido = frete.valorGerado - totalCustos;
                        return (
                          <Card key={frete.id} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{frete.codigoFrete || frete.id}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{frete.rota}</p>
                                <div className="text-right">
                                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Bruto</p>
                                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                    R$ {frete.valorGerado.toLocaleString("pt-BR")}
                                  </p>
                                </div>
                              </div>
                              {custosFrete.length > 0 && (
                                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 pl-2 space-y-1">
                                  {custosFrete.map((custo, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs">
                                      <span className="text-slate-600 dark:text-slate-400">📌 {custo.descricao}</span>
                                      <span className="font-semibold text-red-600 dark:text-red-400">
                                        -R$ {custo.valor.toLocaleString("pt-BR")}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {totalCustos > 0 && (
                                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-2 bg-emerald-50 dark:bg-emerald-950/30 -mx-3 px-3 py-2 rounded">
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Líquido do Frete</span>
                                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">R$ {valorLiquido.toLocaleString("pt-BR")}</span>
                                </div>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                  </div>
                </div>

                <Separator />

                {/* Resumo Final de Valores */}
                <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">Resumo Financeiro</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600 dark:text-slate-400">Valor Bruto</Label>
                      <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900 shadow-sm">
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                          R$ {fretesNaoPagos
                            .filter((f) => selectedFretes.includes(f.id))
                            .reduce((acc, f) => acc + f.valorGerado, 0)
                            .toLocaleString("pt-BR")}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">Receita dos fretes</p>
                      </Card>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600 dark:text-slate-400">Total de Descontos</Label>
                      <Card className="p-4 bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900 shadow-sm">
                        <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                          {(() => {
                            const totalDescontos = selectedFretes
                              .reduce((acc, freteId) => {
                                return acc + getTotalCustosByFreteRef(freteId);
                              }, 0);
                            return totalDescontos > 0
                              ? `-R$ ${totalDescontos.toLocaleString("pt-BR")}`
                              : "R$ 0";
                          })()}
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-500 mt-1">Combustível, pedágio, etc</p>
                      </Card>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600 dark:text-slate-400">Valor a Pagar</Label>
                      <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900 shadow-sm">
                        <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                          R$ {(editedPagamento.valorTotal || 0).toLocaleString("pt-BR")}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-500 mt-1">Líquido ao favorecido</p>
                      </Card>
                    </div>
                  </div>
                </div>

                <Card className="p-5 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-emerald-700 dark:text-emerald-400 font-semibold mb-1">Valor Unitário por Tonelada</p>
                      <p className="text-3xl font-bold text-emerald-800 dark:text-emerald-300">
                        R$ {(editedPagamento.valorUnitarioPorTonelada || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-2">
                        📊 {editedPagamento.toneladas.toFixed(2)}t • Já com descontos incluídos
                      </p>
                    </div>
                    <DollarSign className="h-12 w-12 text-slate-400 opacity-50" />
                  </div>
                </Card>
              </div>
            )}

            <Separator />

            {/* Data do Pagamento e Status */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-800/40 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-4">Informações do Pagamento</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">📅 Data do Pagamento *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal gap-2 px-3 h-11 border-2 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                      >
                        <Calendar className="h-4 w-4 text-blue-600" />
                        {editedPagamento.dataPagamento
                          ? format(
                            parseBRDateToLocalDate(editedPagamento.dataPagamento) || new Date(),
                            "dd/MM/yyyy",
                            { locale: ptBR }
                          )
                          : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 align-start" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={
                          parseBRDateToLocalDate(editedPagamento.dataPagamento)
                        }
                        onSelect={(date) => {
                          if (date) {
                            const formattedDate = format(date, "dd/MM/yyyy", { locale: ptBR });
                            setEditedPagamento({
                              ...editedPagamento,
                              dataPagamento: formattedDate,
                            });
                          }
                        }}
                        disabled={(date) =>
                          date > new Date() || date < new Date(2025, 0, 1)
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="statusPagamento" className="text-sm font-semibold">📌 Status *</Label>
                  <Select
                    value={isInternalCostFlow ? "pago" : (editedPagamento.statusPagamento || "pendente")}
                    onValueChange={(value: "pendente" | "processando" | "pago" | "cancelado") =>
                      !isInternalCostFlow &&
                      setEditedPagamento({
                        ...editedPagamento,
                        statusPagamento: value,
                      })
                    }
                    disabled={isInternalCostFlow}
                  >
                    <SelectTrigger className="border-2 hover:border-blue-400 transition-colors h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">⏳ Pendente</SelectItem>
                      <SelectItem value="processando">⚙️ Processando</SelectItem>
                      <SelectItem value="pago">✓ Pago</SelectItem>
                      <SelectItem value="cancelado">✗ Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Método de Pagamento (somente leitura) */}
            <div className="space-y-3">
              <Label htmlFor="metodoPagamento" className="text-sm font-semibold">💳 Método de Pagamento</Label>
              <Select value={metodoPagamentoAtual} disabled>
                <SelectTrigger id="metodoPagamento" className="border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="transferencia_bancaria">Transferência Bancária</SelectItem>
                </SelectContent>
              </Select>

              <Card
                className={cn(
                  "p-4 border",
                  metodoPagamentoAtual === "pix"
                    ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900"
                    : "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900"
                )}
              >
                {isInternalCostFlow ? (
                  <p className="text-sm text-muted-foreground">
                    Método definido pelo cadastro do favorecido (fluxo de custo interno).
                  </p>
                ) : metodoPagamentoAtual === "pix" ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground">Dados PIX do favorecido (cadastro)</p>
                      <Badge variant="outline">PIX</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Tipo de chave</p>
                        <p className="font-semibold">
                          {String(motoristaSelecionado?.chavePixTipo || "Não informado").toUpperCase()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Chave PIX</p>
                        <p className="font-mono font-semibold break-all">
                          {motoristaSelecionado?.chavePix || "Não informada"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground">Dados bancários do favorecido (cadastro)</p>
                      <Badge variant="outline">Transferência</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Banco</p>
                        <p className="font-semibold">{motoristaSelecionado?.banco || "Não informado"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Agência</p>
                        <p className="font-mono font-semibold">{motoristaSelecionado?.agencia || "Não informada"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Conta</p>
                        <p className="font-mono font-semibold">{motoristaSelecionado?.conta || "Não informada"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Tipo de conta</p>
                        <p className="font-semibold">
                          {motoristaSelecionado?.tipoConta === "corrente"
                            ? "Corrente"
                            : motoristaSelecionado?.tipoConta === "poupanca"
                              ? "Poupança"
                              : "Não informado"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            <Separator />

            {/* Comprovante Upload */}
            {isInternalCostFlow ? (
              <div className="space-y-3">
                <Label>Fechamento interno</Label>
                <Card className="p-4 border-primary/30 bg-primary/5">
                  <Button
                    type="button"
                    className={cn("w-full h-12 text-base font-semibold", isInternalCostConfirmed && "bg-green-600 hover:bg-green-700")}
                    onClick={() => setIsInternalCostConfirmed(true)}
                  >
                    {isInternalCostConfirmed
                      ? "Fechamento de custo interno confirmado"
                      : "Confirmar Fechamento de Custo Interno"}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3">
                    Este fluxo dispensa comprovante PIX e registra automaticamente a despesa interna.
                  </p>
                </Card>
              </div>
            ) : (
              <div className="space-y-3">
                <Label>Comprovante de Pagamento</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 hover:border-muted-foreground/50 transition-colors">
                  <input
                    type="file"
                    id="comprovante"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                  />
                  <label
                    htmlFor="comprovante"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Paperclip className="h-6 w-6 text-muted-foreground/60" />
                    <div className="text-center">
                      <p className="text-sm font-medium">
                        {selectedFile ? selectedFile.name : "Clique para selecionar ou arraste"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF ou imagem (JPG, PNG, WEBP) - máx. 5MB
                      </p>
                    </div>
                  </label>
                </div>
                {selectedFile && (
                  <div className="rounded-lg border border-muted p-3 bg-muted/30">
                    {selectedFileIsImage && selectedFilePreview ? (
                      <img
                        src={selectedFilePreview}
                        alt="Preview do comprovante"
                        className="max-h-48 w-full rounded-md object-contain"
                      />
                    ) : selectedFileIsPdf && selectedFilePreview ? (
                      <iframe
                        src={selectedFilePreview}
                        title="Preview do comprovante"
                        className="h-64 w-full rounded-md border"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>Preview não disponível para este arquivo.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <textarea
                id="observacoes"
                className="w-full min-h-24 px-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Digite qualquer observação sobre este pagamento..."
                value={editedPagamento.observacoes || ""}
                onChange={(e) =>
                  setEditedPagamento({
                    ...editedPagamento,
                    observacoes: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3 items-center justify-between mt-4">
            <div className="flex items-center space-x-2 mr-auto pl-1">
              <Checkbox
                id="autoEmitirGuia"
                checked={autoEmitirGuia}
                onCheckedChange={(checked) => setAutoEmitirGuia(checked === true)}
              />
              <label
                htmlFor="autoEmitirGuia"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-muted-foreground select-none"
              >
                Emitir Guia em PDF após salvar
              </label>
            </div>
            <ModalSubmitFooter
              onCancel={() => {
                setIsModalOpen(false);
                resetFormErrors();
              }}
              onSubmit={handleSave}
              isSubmitting={isSaving}
              disableSubmit={isSaving}
              submitLabel={isEditing ? "Salvar Alterações" : "Registrar Pagamento"}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
