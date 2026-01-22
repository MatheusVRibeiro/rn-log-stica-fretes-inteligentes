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
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Eye, Truck } from "lucide-react";

interface Caminhao {
  id: string;
  placa: string;
  modelo: string;
  capacidade: string;
  status: "disponivel" | "em_viagem" | "manutencao";
  kmRodados: number;
}

const caminhoesData: Caminhao[] = [
  {
    id: "1",
    placa: "ABC-1234",
    modelo: "Volvo FH 540",
    capacidade: "40 ton",
    status: "em_viagem",
    kmRodados: 245000,
  },
  {
    id: "2",
    placa: "DEF-5678",
    modelo: "Scania R450",
    capacidade: "35 ton",
    status: "disponivel",
    kmRodados: 180000,
  },
  {
    id: "3",
    placa: "GHI-9012",
    modelo: "Mercedes Actros",
    capacidade: "38 ton",
    status: "manutencao",
    kmRodados: 320000,
  },
  {
    id: "4",
    placa: "JKL-3456",
    modelo: "DAF XF",
    capacidade: "42 ton",
    status: "disponivel",
    kmRodados: 95000,
  },
  {
    id: "5",
    placa: "MNO-7890",
    modelo: "Volvo FH 500",
    capacidade: "40 ton",
    status: "em_viagem",
    kmRodados: 210000,
  },
];

const statusConfig = {
  disponivel: { label: "Disponível", variant: "active" as const },
  em_viagem: { label: "Em Viagem", variant: "inTransit" as const },
  manutencao: { label: "Manutenção", variant: "warning" as const },
};

export default function Caminhoes() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCaminhao, setSelectedCaminhao] = useState<Caminhao | null>(null);

  const filteredData = caminhoesData.filter((caminhao) => {
    const matchesSearch =
      caminhao.placa.toLowerCase().includes(search.toLowerCase()) ||
      caminhao.modelo.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || caminhao.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: "placa",
      header: "Placa",
      render: (item: Caminhao) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Truck className="h-5 w-5 text-primary" />
          </div>
          <span className="font-mono font-semibold">{item.placa}</span>
        </div>
      ),
    },
    { key: "modelo", header: "Modelo" },
    {
      key: "capacidade",
      header: "Capacidade",
      render: (item: Caminhao) => (
        <span className="text-muted-foreground">{item.capacidade}</span>
      ),
    },
    {
      key: "kmRodados",
      header: "KM Rodados",
      render: (item: Caminhao) => (
        <span>{item.kmRodados.toLocaleString("pt-BR")} km</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item: Caminhao) => (
        <Badge variant={statusConfig[item.status].variant}>
          {statusConfig[item.status].label}
        </Badge>
      ),
    },
    {
      key: "acoes",
      header: "Ações",
      render: (item: Caminhao) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCaminhao(item);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout title="Caminhões" subtitle="Gestão da frota">
      <PageHeader
        title="Caminhões"
        description="Gerencie sua frota de veículos"
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Caminhão
          </Button>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por placa ou modelo..."
      >
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="disponivel">Disponível</SelectItem>
            <SelectItem value="em_viagem">Em Viagem</SelectItem>
            <SelectItem value="manutencao">Manutenção</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      <DataTable<Caminhao>
        columns={columns}
        data={filteredData}
        emptyMessage="Nenhum caminhão encontrado"
      />

      {/* New Truck Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Caminhão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="placa">Placa</Label>
              <Input id="placa" placeholder="ABC-1234" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo</Label>
              <Input id="modelo" placeholder="Volvo FH 540" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacidade">Capacidade</Label>
              <Input id="capacidade" placeholder="40 ton" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="km">KM Rodados</Label>
              <Input id="km" type="number" placeholder="0" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setIsModalOpen(false)}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Truck Modal */}
      <Dialog open={!!selectedCaminhao} onOpenChange={() => setSelectedCaminhao(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Caminhão</DialogTitle>
          </DialogHeader>
          {selectedCaminhao && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Truck className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono">
                    {selectedCaminhao.placa}
                  </p>
                  <p className="text-muted-foreground">{selectedCaminhao.modelo}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Capacidade</p>
                  <p className="font-semibold">{selectedCaminhao.capacidade}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">KM Rodados</p>
                  <p className="font-semibold">
                    {selectedCaminhao.kmRodados.toLocaleString("pt-BR")} km
                  </p>
                </div>
                <div className="col-span-2 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    variant={statusConfig[selectedCaminhao.status].variant}
                    className="mt-1"
                  >
                    {statusConfig[selectedCaminhao.status].label}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
