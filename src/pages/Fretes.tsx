import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { FilterBar } from "@/components/shared/FilterBar";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import { StatusTimeline } from "@/components/shared/StatusTimeline";
import { Plus, MapPin, ArrowRight } from "lucide-react";

interface Frete {
  id: string;
  origem: string;
  destino: string;
  motorista: string;
  caminhao: string;
  status: "em_transito" | "concluido" | "pendente" | "cancelado";
  receita: number;
  custos: number;
  resultado: number;
}

const fretesData: Frete[] = [
  {
    id: "#1250",
    origem: "São Paulo, SP",
    destino: "Rio de Janeiro, RJ",
    motorista: "Carlos Silva",
    caminhao: "ABC-1234",
    status: "em_transito",
    receita: 15000,
    custos: 11000,
    resultado: 4000,
  },
  {
    id: "#1249",
    origem: "Curitiba, PR",
    destino: "Florianópolis, SC",
    motorista: "João Oliveira",
    caminhao: "DEF-5678",
    status: "concluido",
    receita: 8500,
    custos: 6200,
    resultado: 2300,
  },
  {
    id: "#1248",
    origem: "Belo Horizonte, MG",
    destino: "Brasília, DF",
    motorista: "Pedro Santos",
    caminhao: "GHI-9012",
    status: "pendente",
    receita: 12000,
    custos: 0,
    resultado: 12000,
  },
  {
    id: "#1247",
    origem: "São Paulo, SP",
    destino: "Rio de Janeiro, RJ",
    motorista: "André Costa",
    caminhao: "JKL-3456",
    status: "concluido",
    receita: 14000,
    custos: 15680,
    resultado: -1680,
  },
  {
    id: "#1246",
    origem: "Porto Alegre, RS",
    destino: "Curitiba, PR",
    motorista: "Lucas Ferreira",
    caminhao: "MNO-7890",
    status: "cancelado",
    receita: 0,
    custos: 500,
    resultado: -500,
  },
];

const statusConfig = {
  em_transito: { label: "Em Trânsito", variant: "inTransit" as const },
  concluido: { label: "Concluído", variant: "completed" as const },
  pendente: { label: "Pendente", variant: "pending" as const },
  cancelado: { label: "Cancelado", variant: "cancelled" as const },
};

export default function Fretes() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedFrete, setSelectedFrete] = useState<Frete | null>(null);

  const filteredData = fretesData.filter((frete) => {
    const matchesSearch =
      frete.origem.toLowerCase().includes(search.toLowerCase()) ||
      frete.destino.toLowerCase().includes(search.toLowerCase()) ||
      frete.motorista.toLowerCase().includes(search.toLowerCase()) ||
      frete.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || frete.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: "id",
      header: "ID",
      render: (item: Frete) => (
        <span className="font-mono text-sm">{item.id}</span>
      ),
    },
    {
      key: "rota",
      header: "Rota",
      render: (item: Frete) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>{item.origem}</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <span>{item.destino}</span>
        </div>
      ),
    },
    { key: "motorista", header: "Motorista" },
    { key: "caminhao", header: "Caminhão" },
    {
      key: "status",
      header: "Status",
      render: (item: Frete) => (
        <Badge variant={statusConfig[item.status].variant}>
          {statusConfig[item.status].label}
        </Badge>
      ),
    },
    {
      key: "receita",
      header: "Receita",
      render: (item: Frete) => (
        <span className="font-medium">
          R$ {item.receita.toLocaleString("pt-BR")}
        </span>
      ),
    },
    {
      key: "custos",
      header: "Custos",
      render: (item: Frete) => (
        <span className="text-muted-foreground">
          R$ {item.custos.toLocaleString("pt-BR")}
        </span>
      ),
    },
    {
      key: "resultado",
      header: "Resultado",
      render: (item: Frete) => (
        <Badge variant={item.resultado >= 0 ? "profit" : "loss"}>
          {item.resultado >= 0 ? "+" : ""}R${" "}
          {item.resultado.toLocaleString("pt-BR")}
        </Badge>
      ),
    },
  ];

  const timelineSteps = [
    { label: "Pedido criado", date: "15/01/2025 - 08:30", completed: true },
    { label: "Carregamento", date: "15/01/2025 - 10:00", completed: true },
    { label: "Em trânsito", date: "15/01/2025 - 11:30", completed: true, current: true },
    { label: "Entrega", completed: false },
    { label: "Conclusão", completed: false },
  ];

  return (
    <MainLayout title="Fretes" subtitle="Gestão de fretes e entregas">
      <PageHeader
        title="Fretes"
        description="Gerencie todos os fretes do sistema"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Frete
          </Button>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por ID, origem, destino ou motorista..."
      >
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="em_transito">Em Trânsito</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      <DataTable<Frete>
        columns={columns}
        data={filteredData}
        onRowClick={(item) => setSelectedFrete(item)}
        highlightNegative={(item) => item.resultado < 0}
        emptyMessage="Nenhum frete encontrado"
      />

      {/* Frete Detail Modal */}
      <Dialog open={!!selectedFrete} onOpenChange={() => setSelectedFrete(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Frete {selectedFrete?.id}</DialogTitle>
          </DialogHeader>
          {selectedFrete && (
            <div className="space-y-6">
              {/* Route Info */}
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium">{selectedFrete.origem}</span>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{selectedFrete.destino}</span>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Motorista</p>
                  <p className="font-medium">{selectedFrete.motorista}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Caminhão</p>
                  <p className="font-medium">{selectedFrete.caminhao}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={statusConfig[selectedFrete.status].variant}>
                    {statusConfig[selectedFrete.status].label}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Resultado</p>
                  <Badge variant={selectedFrete.resultado >= 0 ? "profit" : "loss"}>
                    {selectedFrete.resultado >= 0 ? "+" : ""}R${" "}
                    {selectedFrete.resultado.toLocaleString("pt-BR")}
                  </Badge>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground">Receita</p>
                  <p className="text-xl font-bold text-primary">
                    R$ {selectedFrete.receita.toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="p-4 bg-loss/5 rounded-lg border border-loss/20">
                  <p className="text-sm text-muted-foreground">Custos</p>
                  <p className="text-xl font-bold text-loss">
                    R$ {selectedFrete.custos.toLocaleString("pt-BR")}
                  </p>
                </div>
                <div
                  className={`p-4 rounded-lg border ${
                    selectedFrete.resultado >= 0
                      ? "bg-profit/5 border-profit/20"
                      : "bg-loss/5 border-loss/20"
                  }`}
                >
                  <p className="text-sm text-muted-foreground">Resultado</p>
                  <p
                    className={`text-xl font-bold ${
                      selectedFrete.resultado >= 0 ? "text-profit" : "text-loss"
                    }`}
                  >
                    {selectedFrete.resultado >= 0 ? "+" : ""}R${" "}
                    {selectedFrete.resultado.toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h4 className="font-semibold mb-4">Timeline do Frete</h4>
                <StatusTimeline steps={timelineSteps} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
