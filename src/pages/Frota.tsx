import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { FilterBar } from "@/components/shared/FilterBar";
import { DataTable } from "@/components/shared/DataTable";
import { FieldError, fieldErrorClass } from "@/components/shared/FieldError";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Eye, Truck, Gauge, Weight, CalendarDays, Wrench, AlertCircle, Save, X, Info, FileText, Shield, Fuel, Package as PackageIcon } from "lucide-react";
import { toast } from "sonner";
import caminhoesService from "@/services/caminhoes";
import motoristasService from "@/services/motoristas";
import type { Caminhao, CriarCaminhaoPayload, Motorista } from "@/types";
import { cn, formatPlaca, emptyToNull } from "@/lib/utils";
import { sortMotoristasPorNome } from "@/lib/sortHelpers";
import { formatarDocumento } from '@/utils/formatters';
import { RefreshingIndicator } from "@/components/shared/RefreshingIndicator";
import { useRefreshData } from "@/hooks/useRefreshData";
import { useShake } from "@/hooks/useShake";

// Novos Componentes Frota
import { FleetSummaryCards } from "@/components/frota/FleetSummaryCards";
import { FleetFilters } from "@/components/frota/FleetFilters";
import { VehicleCard } from "@/components/frota/VehicleCard";
import { VehicleDetailsDialog } from "@/components/frota/VehicleDetailsDialog";
import { VehicleFormModal } from "@/components/frota/VehicleFormModal";

const statusConfig = {
  disponivel: { label: "Disponível", variant: "active" as const },
  em_viagem: { label: "Em Viagem", variant: "inTransit" as const },
  em_manutencao: { label: "Manutenção", variant: "warning" as const },
  inativo: { label: "Inativo", variant: "cancelled" as const },
};

const getFleetType = (caminhao: Caminhao): "PROPRIO" | "TERCEIRO" => {
  if (caminhao.proprietario_tipo === "PROPRIO") return "PROPRIO";
  if (caminhao.proprietario_tipo === "TERCEIRO") return "TERCEIRO";
  return caminhao.motorista_fixo_id ? "TERCEIRO" : "PROPRIO";
};

const formatVehicleCategory = (vehicleType?: Caminhao["tipo_veiculo"]) => {
  if (!vehicleType) return "Não informada";
  return vehicleType
    .toString()
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export default function Frota() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [fleetFilter, setFleetFilter] = useState<"all" | "proprio" | "terceiro">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCaminhao, setSelectedCaminhao] = useState<Caminhao | null>(null);
  const [editedCaminhao, setEditedCaminhao] = useState<Partial<CriarCaminhaoPayload>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 21;
  const { isRefreshing, startRefresh, endRefresh } = useRefreshData();

  // Query para buscar caminhões
  const { data: caminhoesResponse, isLoading } = useQuery({
    queryKey: ["caminhoes"],
    queryFn: () => caminhoesService.listarCaminhoes(),
    refetchOnMount: "always",
  });

  // Query para buscar motoristas
  const { data: motoristasResponse, isLoading: isLoadingMotoristas } = useQuery({
    queryKey: ["motoristas"],
    queryFn: () => motoristasService.listarMotoristas(),
    refetchOnMount: "always",
  });

  const caminhoes = caminhoesResponse?.data || [];
  const motoristasDisponiveis = sortMotoristasPorNome(motoristasResponse?.data || []);
  const transportadoraContelli = motoristasDisponiveis.find(
    (motorista) => String(motorista.nome || "").trim().toUpperCase() === "TRANSPORTADORA CONTELLI"
  );
  const [autoFilledFields, setAutoFilledFields] = useState<{ placa?: boolean; motorista?: boolean; proprietario_tipo?: boolean }>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const resetFormErrors = () => setFormErrors({});
  const clearFormError = (field: string) => {
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };
  const applyUniqueFieldError = (message?: string) => {
    const fallback = "Erro ao salvar caminhão";
    const text = String(message || fallback);
    const isPlacaUnique = /placa/i.test(text) || /duplicate entry/i.test(text);
    setFormErrors({ [isPlacaUnique ? "placa" : "modelo"]: text });
    triggerShake();
  };
  const { isShaking, triggerShake } = useShake(220);

  const formatPlateAsUserTypes = (value: string) => {
    const clean = value.replace(/[^A-Z0-9]/gi, "").toUpperCase();
    if (clean.length > 3) {
      return `${clean.slice(0, 3)}-${clean.slice(3, 7)}`;
    }
    return clean;
  };
  const isValidPlate = (p?: string) => {
    if (!p) return false;
    const plate = p.trim().toUpperCase(); // Assuming normalizePlate is now external or inlined
    return /^[A-Z]{3}-\d{4}$/.test(plate) || /^[A-Z]{3}-?\d[A-Z]\d{2}$/.test(plate);
  };

  // Mutation para criar caminhão
  const criarMutation = useMutation({
    mutationFn: caminhoesService.criarCaminhao,
    onSuccess: (response) => {
      if (response.success) {
        toast.success("Caminhão cadastrado com sucesso!");
        queryClient.invalidateQueries({ queryKey: ["caminhoes"] });
        setIsModalOpen(false);
        endRefresh();
      } else {
        applyUniqueFieldError(response.message || "Erro ao cadastrar caminhão");
        endRefresh();
      }
    },
    onError: (error: any) => {
      const message = error?.message || "Erro ao cadastrar caminhão";
      applyUniqueFieldError(message);
      endRefresh();
    },
  });

  // Mutation para editar caminhão
  const editarMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CriarCaminhaoPayload> }) =>
      caminhoesService.atualizarCaminhao(id, payload),
    onSuccess: (response) => {
      if (response.success) {
        toast.success("Caminhão atualizado com sucesso!");
        queryClient.invalidateQueries({ queryKey: ["caminhoes"] });
        setIsModalOpen(false);
        endRefresh();
      } else {
        applyUniqueFieldError(response.message || "Erro ao atualizar caminhão");
        endRefresh();
      }
    },
    onError: (error: any) => {
      const message = error?.message || "Erro ao atualizar caminhão";
      applyUniqueFieldError(message);
      endRefresh();
    },
  });
  const isSaving = criarMutation.status === "pending" || editarMutation.status === "pending";

  const handleOpenNewModal = () => {
    setEditedCaminhao({
      placa: "",
      placa_carreta: "",
      modelo: "",
      ano_fabricacao: undefined,
      capacidade_toneladas: undefined,
      status: "disponivel",
      km_atual: 0,
      motorista_fixo_id: "",
      ultima_manutencao_data: "",
      proxima_manutencao_km: 0,
      renavam: "",
      chassi: "",
      registro_antt: "",
      validade_seguro: "",
      validade_licenciamento: "",
      tipo_combustivel: undefined,
      tipo_veiculo: undefined,
      proprietario_tipo: undefined,
    });
    setIsEditing(false);
    setSelectedCaminhao(null);
    setAutoFilledFields({});
    setIsModalOpen(true);
  };

  // Abrir modal de edição quando rota /frota/editar/:id for acessada
  const frotaParams = useParams();
  useEffect(() => {
    const idParam = frotaParams.id;
    if (!idParam) return;
    if (!isLoading && caminhoes.length > 0) {
      const found = caminhoes.find((c) => String(c.id) === String(idParam));
      if (found) handleOpenEditModal(found);
    }
  }, [frotaParams.id, isLoading, caminhoes]);



  const handleOpenEditModal = (caminhao: Caminhao) => {
    // Converter campos da API para o formato do formulário
    setEditedCaminhao({
      placa: caminhao.placa,
      placa_carreta: caminhao.placa_carreta || "",
      modelo: caminhao.modelo,
      ano_fabricacao: caminhao.ano_fabricacao,
      capacidade_toneladas: caminhao.capacidade_toneladas,
      status: caminhao.status,
      km_atual: caminhao.km_atual,
      motorista_fixo_id: caminhao.motorista_fixo_id || "",
      ultima_manutencao_data: caminhao.ultima_manutencao_data || "",
      proxima_manutencao_km: caminhao.proxima_manutencao_km || 0,
      renavam: caminhao.renavam || "",
      chassi: caminhao.chassi || "",
      registro_antt: caminhao.registro_antt || "",
      validade_seguro: caminhao.validade_seguro || "",
      validade_licenciamento: caminhao.validade_licenciamento || "",
      tipo_combustivel: caminhao.tipo_combustivel,
      tipo_veiculo: caminhao.tipo_veiculo,
      proprietario_tipo: caminhao.proprietario_tipo,
    });
    setIsEditing(true);
    setSelectedCaminhao(caminhao);
    setAutoFilledFields({});
    setIsModalOpen(true);
    navigate(`/frota/editar/${caminhao.id}`, { replace: false });
  };

  useEffect(() => {
    if (!isModalOpen) {
      const path = window.location.pathname || "";
      if (path.startsWith("/frota/editar/")) {
        navigate("/frota", { replace: true });
      }
      setIsEditing(false);
      setSelectedCaminhao(null);
    }
  }, [isModalOpen, navigate]);

  const handleSave = () => {
    if (isSaving) return;

    const nextErrors: Record<string, string> = {};
    if (!String(editedCaminhao.placa || "").trim()) nextErrors.placa = "Placa é obrigatória.";
    if (!String(editedCaminhao.modelo || "").trim()) nextErrors.modelo = "Modelo é obrigatório.";
    if (!editedCaminhao.tipo_veiculo) nextErrors.tipo_veiculo = "Tipo de veículo é obrigatório.";
    if (!editedCaminhao.proprietario_tipo) nextErrors.proprietario_tipo = "Tipo de proprietário é obrigatório.";

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      triggerShake();
      return;
    }

    // Simple client-side validation to avoid 400 from backend
    const normalizePlate = (p?: string) => (p ? p.trim().toUpperCase() : "");
    const stripNonAlnum = (s: string) => s.replace(/[^A-Z0-9]/gi, "");
    const isValidPlate = (p?: string) => {
      if (!p) return false;
      const plate = normalizePlate(p);
      // Accept traditional format ABC-1234 and Mercosul-like (with or without dash) ABC1D23 or ABC-1D23
      const regexOld = /^[A-Z]{3}-\d{4}$/;
      const regexMercosul = /^[A-Z]{3}-?\d[A-Z]\d{2}$/;
      return regexOld.test(plate) || regexMercosul.test(plate);
    };

    const formatPlateWithDash = (p?: string) => {
      if (!p) return "";
      const up = normalizePlate(p);
      // If already in old format ABC-1234 keep it
      if (/^[A-Z]{3}-\d{4}$/.test(up)) return up;
      // For mercosul-like, remove non-alnum then insert dash after 3 chars: ABC1D23 -> ABC-1D23
      const clean = stripNonAlnum(up);
      if (/^[A-Z]{3}\d[A-Z]\d{2}$/.test(clean)) {
        return `${clean.slice(0, 3)}-${clean.slice(3)}`;
      }
      // Fallback: return uppercased input
      return up;
    };

    setFormErrors({});
    const placaNorm = formatPlateWithDash(editedCaminhao.placa as string);
    if (!placaNorm || !isValidPlate(placaNorm)) {
      setFormErrors({ placa: "Placa inválida. Use formato ABC-1234 ou BWJ-9B60 (Mercosul)." });
      triggerShake();
      return;
    }

    const placaCarreta = formatPlateWithDash(editedCaminhao.placa_carreta as string);
    if (editedCaminhao.placa_carreta && !isValidPlate(placaCarreta)) {
      setFormErrors({ placa_carreta: "Placa da carreta inválida." });
      triggerShake();
      return;
    }

    // Capacidade é opcional. Valida apenas quando preenchida.
    let capacidadeNormalized: number | null = null;
    if (editedCaminhao.capacidade_toneladas !== undefined && editedCaminhao.capacidade_toneladas !== null && String(editedCaminhao.capacidade_toneladas).trim() !== "") {
      const num = Number(editedCaminhao.capacidade_toneladas);
      if (!(num > 0)) {
        setFormErrors({ capacidade_toneladas: "Capacidade deve ser maior que 0" });
        triggerShake();
        return;
      }
      capacidadeNormalized = num;
    } else {
      capacidadeNormalized = null;
    }

    // Normalize fields to match backend schema precisely
    const mapProprietarioTipo = (v?: string | undefined) => {
      if (!v) return undefined;
      // Backend expects: PROPRIO | TERCEIRO | AGREGADO
      if (v === "TERCEIRIZADO") return "TERCEIRO";
      if (v === "PROPRIO") return "PROPRIO";
      if (v === "AGREGADO") return "AGREGADO";
      return v;
    };

    const proprietarioTipo = mapProprietarioTipo(editedCaminhao.proprietario_tipo);
    const motoristaFixoIdFinal =
      proprietarioTipo === "PROPRIO"
        ? (transportadoraContelli?.id || editedCaminhao.motorista_fixo_id || null)
        : (editedCaminhao.motorista_fixo_id ? String(editedCaminhao.motorista_fixo_id) : null);

    const payload: CriarCaminhaoPayload = {
      placa: placaNorm.toUpperCase() as string,
      modelo: String(editedCaminhao.modelo || "").trim().toUpperCase(),
      // Some backends expect year as string — ensure consistent typing
      ano_fabricacao: typeof editedCaminhao.ano_fabricacao === 'number' ? String(editedCaminhao.ano_fabricacao) as any : (editedCaminhao.ano_fabricacao as any),
      capacidade_toneladas: capacidadeNormalized as number,
      tipo_veiculo: editedCaminhao.tipo_veiculo as any,
      status: editedCaminhao.status || "disponivel",
      km_atual: editedCaminhao.km_atual || 0,
      tipo_combustivel: editedCaminhao.tipo_combustivel,
      motorista_fixo_id: motoristaFixoIdFinal,
      proprietario_tipo: proprietarioTipo as any,
      renavam: editedCaminhao.renavam || undefined,
      chassi: editedCaminhao.chassi || undefined,
      registro_antt: editedCaminhao.registro_antt || undefined,
      validade_seguro: editedCaminhao.validade_seguro || undefined,
      validade_licenciamento: editedCaminhao.validade_licenciamento || undefined,
      ultima_manutencao_data: editedCaminhao.ultima_manutencao_data || undefined,
      proxima_manutencao_km: editedCaminhao.proxima_manutencao_km || undefined,
      placa_carreta: (editedCaminhao.tipo_veiculo && ["CARRETA", "BITREM", "TRUCK"].includes(editedCaminhao.tipo_veiculo as string)) ? (placaCarreta ? placaCarreta.toUpperCase() : undefined) : undefined,
    };

    // Normalize optional empty strings to null before sending
    const cleaned = emptyToNull(payload as Record<string, any>, [
      'placa_carreta', 'renavam', 'chassi', 'registro_antt', 'validade_seguro', 'validade_licenciamento'
    ]);

    if (isEditing && selectedCaminhao) {
      editarMutation.mutate({
        id: selectedCaminhao.id,
        payload: cleaned as any,
      });
    } else {
      criarMutation.mutate(cleaned as any);
    }
  };

  const filteredData = caminhoes.filter((caminhao) => {
    const motorista = motoristasDisponiveis.find((m) => m.id === caminhao.motorista_fixo_id);
    const matchesSearch =
      caminhao.placa.toLowerCase().includes(search.toLowerCase()) ||
      caminhao.modelo.toLowerCase().includes(search.toLowerCase()) ||
      (motorista?.nome || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || caminhao.status === statusFilter;
    const matchesFleet =
      fleetFilter === "all" ||
      (fleetFilter === "proprio" && getFleetType(caminhao) === "PROPRIO") ||
      (fleetFilter === "terceiro" && getFleetType(caminhao) === "TERCEIRO");
    return matchesSearch && matchesStatus && matchesFleet;
  });

  const orderedData = [...filteredData].sort((a, b) => {
    const aType = getFleetType(a) === "PROPRIO" ? 0 : 1;
    const bType = getFleetType(b) === "PROPRIO" ? 0 : 1;
    if (aType !== bType) return aType - bType;
    return a.modelo.localeCompare(b.modelo, "pt-BR");
  });

  const fleetSummary = {
    proprio: caminhoes.filter((c) => getFleetType(c) === "PROPRIO").length,
    terceiro: caminhoes.filter((c) => getFleetType(c) === "TERCEIRO").length,
  };
  const emOperacaoCount = caminhoes.filter((c) => c.status === "disponivel" || c.status === "em_viagem").length;
  const emManutencaoCount = caminhoes.filter((c) => c.status === "em_manutencao").length;
  const categoriasAtivasCount = new Set(caminhoes.map((c) => c.tipo_veiculo).filter(Boolean)).size;

  // Lógica de paginação
  const totalPages = Math.ceil(orderedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = orderedData.slice(startIndex, startIndex + itemsPerPage);
  const paginatedProprios = paginatedData.filter((c) => getFleetType(c) === "PROPRIO");
  const paginatedTerceiros = paginatedData.filter((c) => getFleetType(c) === "TERCEIRO");

  // Resetar para página 1 quando aplicar novos filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, fleetFilter]);

  // Limpar marcação de auto-filled quando modal fechar
  useEffect(() => {
    if (!isModalOpen) {
      setAutoFilledFields({});
    }
  }, [isModalOpen]);

  const getMaintenanceStatus = (km: number, proxima: number) => {
    const percentual = (km / proxima) * 100;
    if (percentual >= 90) return "critical";
    if (percentual >= 70) return "warning";
    return "ok";
  };

  const isDocumentExpiringSoon = (dateStr?: string) => {
    if (!dateStr) return false;
    const [day, month, year] = dateStr.split('/');
    const docDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const today = new Date();
    const diffDays = Math.ceil((docDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  };

  const isDocumentExpired = (dateStr?: string) => {
    if (!dateStr) return false;
    const [day, month, year] = dateStr.split('/');
    const docDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const today = new Date();
    return docDate < today;
  };

  const columns = [
    {
      key: "placa",
      header: "Veículo",
      render: (item: Caminhao) => {
        return (
          <div className="flex items-start gap-2 py-1">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 hover:from-primary/30 hover:to-primary/20 transition-all shadow-sm">
              <Truck className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-base text-foreground tracking-wide">{item.placa}</p>
                {item.tipo_veiculo ? (
                  <Badge variant="secondary" className="text-[10px] py-0 px-2">{item.tipo_veiculo}</Badge>
                ) : null}
                <p className="text-xs text-muted-foreground font-medium">{item.modelo}</p>
                {item.placa_carreta ? (
                  <Badge className="text-xs font-semibold">{item.placa_carreta}</Badge>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{item.ano_fabricacao}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (item: Caminhao) => (
        <Badge variant={statusConfig[item.status].variant} className="font-semibold text-xs px-3 py-1.5 whitespace-nowrap">
          {statusConfig[item.status].label}
        </Badge>
      ),
    },
    {
      key: "motorista_fixo_id",
      header: "Proprietário / Transportadora",
      render: (item: Caminhao) => {
        const motorista = motoristasDisponiveis.find(m => m.id === item.motorista_fixo_id);
        return (
          <>
            {motorista ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/60 dark:to-blue-900/40 rounded-md border border-blue-300 dark:border-blue-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="h-5 w-5 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <Truck className="h-3 w-3 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-blue-800 dark:text-blue-200 whitespace-nowrap">
                    {motorista.nome}
                  </span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400">
                    {motorista.tipo === "proprio" ? "Próprio" : "Terceirizado"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md border border-dashed border-muted-foreground/30">
                <span className="text-xs text-muted-foreground italic">
                  Não atribuído
                </span>
              </div>
            )}
          </>
        );
      },
    },
    {
      key: "capacidade",
      header: "Especificações",
      render: (item: Caminhao) => (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Weight className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-base text-foreground">{item.capacidade_toneladas}</span>
              <span className="text-[10px] text-muted-foreground">ton</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Gauge className="h-3.5 w-3.5 text-orange-600 flex-shrink-0" />
            <div className="flex items-baseline gap-1">
              <span className="font-semibold text-xs text-foreground">{item.km_atual.toLocaleString("pt-BR")}</span>
              <span className="text-[10px] text-muted-foreground">km</span>
            </div>
          </div>
          {(item.tipo_combustivel || item.proprietario_tipo) && (
            <div className="flex items-center gap-2">
              <Fuel className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
              {item.tipo_combustivel && (
                <Badge variant="outline" className="text-[10px] font-semibold py-0 px-2">
                  {item.tipo_combustivel}
                </Badge>
              )}
              {item.proprietario_tipo && (
                <Badge
                  variant={item.proprietario_tipo === "PROPRIO" ? "default" : "outline"}
                  className="text-[10px] font-semibold py-0 px-2"
                >
                  {item.proprietario_tipo}
                </Badge>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "documentacao",
      header: "Documentação",
      render: (item: Caminhao) => {
        const seguroExpired = isDocumentExpired(item.validade_seguro || undefined);
        const seguroExpiring = isDocumentExpiringSoon(item.validade_seguro || undefined);
        const licExpired = isDocumentExpired(item.validade_licenciamento || undefined);
        const licExpiring = isDocumentExpiringSoon(item.validade_licenciamento || undefined);
        const hasAlert = seguroExpired || seguroExpiring || licExpired || licExpiring;

        return (
          <div className="space-y-2">
            {item.validade_seguro && (
              <div className={`flex items-center gap-2 px-2 py-1.5 rounded-md ${seguroExpired
                ? "bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-800"
                : seguroExpiring
                  ? "bg-orange-100 dark:bg-orange-950/40 border border-orange-300 dark:border-orange-800"
                  : "bg-muted/40"
                }`}>
                <Shield className={`h-3.5 w-3.5 flex-shrink-0 ${seguroExpired ? "text-red-600" : seguroExpiring ? "text-orange-600" : "text-muted-foreground"
                  }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Seguro</p>
                  <p className={`text-xs font-semibold ${seguroExpired ? "text-red-700 dark:text-red-400"
                    : seguroExpiring ? "text-orange-700 dark:text-orange-400"
                      : "text-foreground"
                    }`}>
                    {item.validade_seguro}
                  </p>
                </div>
                {seguroExpired && <AlertCircle className="h-3.5 w-3.5 text-red-600" />}
                {seguroExpiring && !seguroExpired && <AlertCircle className="h-3.5 w-3.5 text-orange-600" />}
              </div>
            )}
            {item.validade_licenciamento && (
              <div className={`flex items-center gap-2 px-2 py-1.5 rounded-md ${licExpired
                ? "bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-800"
                : licExpiring
                  ? "bg-orange-100 dark:bg-orange-950/40 border border-orange-300 dark:border-orange-800"
                  : "bg-muted/40"
                }`}>
                <FileText className={`h-3.5 w-3.5 flex-shrink-0 ${licExpired ? "text-red-600" : licExpiring ? "text-orange-600" : "text-muted-foreground"
                  }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Licenciamento</p>
                  <p className={`text-xs font-semibold ${licExpired ? "text-red-700 dark:text-red-400"
                    : licExpiring ? "text-orange-700 dark:text-orange-400"
                      : "text-foreground"
                    }`}>
                    {item.validade_licenciamento}
                  </p>
                </div>
                {licExpired && <AlertCircle className="h-3.5 w-3.5 text-red-600" />}
                {licExpiring && !licExpired && <AlertCircle className="h-3.5 w-3.5 text-orange-600" />}
              </div>
            )}
            {!item.validade_seguro && !item.validade_licenciamento && (
              <span className="text-xs text-muted-foreground italic">Não informado</span>
            )}
          </div>
        );
      },
    },
    {
      key: "proxima_manutencao",
      header: "Manutenção",
      render: (item: Caminhao) => {
        if (!item.proxima_manutencao_km) {
          return <span className="text-xs text-muted-foreground italic">Não informado</span>;
        }
        const status = getMaintenanceStatus(item.km_atual, item.proxima_manutencao_km);
        const percentual = ((item.km_atual / item.proxima_manutencao_km) * 100).toFixed(0);
        const kmRestante = (item.proxima_manutencao_km - item.km_atual).toLocaleString("pt-BR");

        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Wrench className={`h-4 w-4 ${status === "critical" ? "text-red-600" : status === "warning" ? "text-yellow-600" : "text-green-600"}`} />
              <span className="text-xs text-muted-foreground">Última: {item.ultima_manutencao_data || "N/A"}</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${status === "critical"
                      ? "bg-gradient-to-r from-red-400 to-red-600"
                      : status === "warning"
                        ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                        : "bg-gradient-to-r from-green-400 to-green-600"
                      }`}
                    style={{ width: `${Math.min(parseInt(percentual), 100)}%` }}
                  />
                </div>
                <span className={`text-xs font-bold ml-2 ${status === "critical"
                  ? "text-red-600"
                  : status === "warning"
                    ? "text-yellow-600"
                    : "text-green-600"
                  }`}>
                  {percentual}%
                </span>
              </div>
              <p className={`text-xs font-medium ${status === "critical"
                ? "text-red-600"
                : status === "warning"
                  ? "text-yellow-600"
                  : "text-green-600"
                }`}>
                {status === "critical" ? "⚠️ CRÍTICO" : status === "warning" ? "⚠️ Atenção" : "✓ OK"} - {kmRestante} km restantes
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "acoes",
      header: "Ações",
      render: (item: Caminhao) => (
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSelectedCaminhao(item);
            }}
            className="gap-1.5 hover:bg-primary/10"
          >
            <Eye className="h-4 w-4" />
            <span className="text-xs">Ver</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleOpenEditModal(item);
            }}
            className="gap-1.5 hover:bg-primary/10"
          >
            <Edit className="h-4 w-4" />
            <span className="text-xs">Editar</span>
          </Button>
        </div>
      ),
    },
  ];

  const listColumns = [
    {
      key: "placa",
      header: "Caminhão",
      render: (item: Caminhao) => {
        const fleetType = getFleetType(item);
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-base text-foreground">{item.placa}</p>
              <Badge variant={fleetType === "PROPRIO" ? "default" : "outline"} className="text-[10px] px-2 py-0 font-semibold">
                {fleetType === "PROPRIO" ? "Frota Própria" : "Terceirizado"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{item.modelo}</p>
          </div>
        );
      },
    },
    {
      key: "motorista",
      header: "Proprietário / Transportadora",
      render: (item: Caminhao) => {
        const fleetType = getFleetType(item);
        const motorista = motoristasDisponiveis.find((m) => m.id === item.motorista_fixo_id);
        if (fleetType === "TERCEIRO" && motorista) {
          return <p className="text-sm font-medium text-foreground">{motorista.nome}</p>;
        }
        return <span className="text-xs text-muted-foreground">Frota própria (sem proprietário definido)</span>;
      },
    },
    {
      key: "status",
      header: "Status",
      render: (item: Caminhao) => (
        <Badge variant={statusConfig[item.status].variant} className="font-semibold text-xs px-3 py-1 whitespace-nowrap">
          {statusConfig[item.status].label}
        </Badge>
      ),
    },
    {
      key: "acoes",
      header: "Ações",
      render: (item: Caminhao) => (
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSelectedCaminhao(item);
            }}
            className="gap-1.5"
          >
            <Eye className="h-4 w-4" />
            <span className="text-xs">Ver</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleOpenEditModal(item);
            }}
            className="gap-1.5"
          >
            <Edit className="h-4 w-4" />
            <span className="text-xs">Editar</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout title="Frota" subtitle="Gestão da frota">
      <RefreshingIndicator isRefreshing={isRefreshing} />
      <PageHeader
        title="Frota de Veículos"
        description="Gestão técnica e operacional da frota Contelli"
        actions={
          <Button onClick={handleOpenNewModal} className="font-bold shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4 mr-2" />
            Novo Caminhão
          </Button>
        }
      />

      {/* Estatísticas Superiores */}
      <FleetSummaryCards
        caminhoes={caminhoes}
        getFleetType={getFleetType}
        emOperacaoCount={emOperacaoCount}
      />

      {/* Barra de Filtros */}
      <FleetFilters
        search={search}
        setSearch={setSearch}
        fleetFilter={fleetFilter}
        setFleetFilter={setFleetFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-2xl border border-dashed border-muted-foreground/20">
          <div className="relative">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <Truck className="h-5 w-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-4 text-sm font-bold text-muted-foreground uppercase tracking-widest">Sincronizando Frota...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {paginatedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-2xl border border-dashed">
              <div className="p-4 rounded-full bg-muted mb-4 text-muted-foreground/50">
                <Truck className="h-10 w-10" />
              </div>
              <p className="text-lg font-bold text-muted-foreground">Nenhum veículo encontrado</p>
              <p className="text-sm text-muted-foreground/60">Tente ajustar seus filtros de busca ou categoria.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedData.map((item) => (
                  <VehicleCard
                    key={item.id}
                    item={item}
                    motorista={motoristasDisponiveis.find(m => m.id === item.motorista_fixo_id)}
                    isProprio={getFleetType(item) === "PROPRIO"}
                    statusConfig={statusConfig}
                    formatVehicleCategory={formatVehicleCategory}
                    onClick={setSelectedCaminhao}
                  />
                ))}
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-6 border-t font-medium">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-black">
                    Página {currentPage} de {totalPages} • {orderedData.length} unidades
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(Math.max(1, currentPage - 1));
                          }}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "font-bold uppercase text-[10px] tracking-widest"}
                        />
                      </PaginationItem>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        const isCurrentPage = page === currentPage;
                        const isVisible = Math.abs(page - currentPage) <= 1 || page === 1 || page === totalPages;

                        if (!isVisible) return null;

                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(page);
                              }}
                              isActive={isCurrentPage}
                              className="font-black"
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
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "font-bold uppercase text-[10px] tracking-widest"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Diálogos de Detalhes e Formulário */}
      <VehicleDetailsDialog
        selectedCaminhao={selectedCaminhao}
        setSelectedCaminhao={setSelectedCaminhao}
        statusConfig={statusConfig}
        motoristasDisponiveis={motoristasDisponiveis}
        onEdit={handleOpenEditModal}
        isShaking={isShaking}
      />

      <VehicleFormModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        isSaving={isSaving}
        isEditing={isEditing}
        editedCaminhao={editedCaminhao}
        setEditedCaminhao={setEditedCaminhao}
        formErrors={formErrors}
        clearFormError={clearFormError}
        handleSave={handleSave}
        motoristasDisponiveis={motoristasDisponiveis}
        transportadoraContelli={transportadoraContelli}
        autoFilledFields={autoFilledFields}
        setAutoFilledFields={setAutoFilledFields}
        formatPlateAsUserTypes={formatPlateAsUserTypes}
        resetFormErrors={resetFormErrors}
        isShaking={isShaking}
      />
    </MainLayout>
  );
}
