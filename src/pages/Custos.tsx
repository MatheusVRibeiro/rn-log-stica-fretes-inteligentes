import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { FilterBar } from "@/components/shared/FilterBar";
import { DataTable } from "@/components/shared/DataTable";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Upload, Fuel, Wrench, FileText, DollarSign, Truck } from "lucide-react";

interface Custo {
  id: string;
  freteId: string;
  tipo: "combustivel" | "manutencao" | "pedagio" | "outros";
  descricao: string;
  valor: number;
  data: string;
  comprovante: boolean;
}

const custosData: Custo[] = [
  {
    id: "1",
    freteId: "#1250",
    tipo: "combustivel",
    descricao: "Abastecimento completo",
    valor: 2500,
    data: "20/01/2025",
    comprovante: true,
  },
  {
    id: "2",
    freteId: "#1250",
    tipo: "pedagio",
    descricao: "Via Dutra - trecho completo",
    valor: 850,
    data: "20/01/2025",
    comprovante: true,
  },
  {
    id: "3",
    freteId: "#1249",
    tipo: "manutencao",
    descricao: "Troca de pneus dianteiros",
    valor: 3200,
    data: "18/01/2025",
    comprovante: true,
  },
  {
    id: "4",
    freteId: "#1249",
    tipo: "combustivel",
    descricao: "Abastecimento parcial",
    valor: 1800,
    data: "17/01/2025",
    comprovante: false,
  },
  {
    id: "5",
    freteId: "#1247",
    tipo: "outros",
    descricao: "Estacionamento",
    valor: 150,
    data: "15/01/2025",
    comprovante: true,
  },
];

const tipoConfig = {
  combustivel: { label: "Combustível", icon: Fuel, color: "text-warning" },
  manutencao: { label: "Manutenção", icon: Wrench, color: "text-loss" },
  pedagio: { label: "Pedágio", icon: Truck, color: "text-primary" },
  outros: { label: "Outros", icon: FileText, color: "text-muted-foreground" },
};

export default function Custos() {
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredData = custosData.filter((custo) => {
    const matchesSearch =
      custo.freteId.toLowerCase().includes(search.toLowerCase()) ||
      custo.descricao.toLowerCase().includes(search.toLowerCase());
    const matchesTipo = tipoFilter === "all" || custo.tipo === tipoFilter;
    return matchesSearch && matchesTipo;
  });

  const totalCustos = custosData.reduce((acc, c) => acc + c.valor, 0);
  const totalCombustivel = custosData
    .filter((c) => c.tipo === "combustivel")
    .reduce((acc, c) => acc + c.valor, 0);
  const totalManutencao = custosData
    .filter((c) => c.tipo === "manutencao")
    .reduce((acc, c) => acc + c.valor, 0);
  const totalPedagio = custosData
    .filter((c) => c.tipo === "pedagio")
    .reduce((acc, c) => acc + c.valor, 0);

  const columns = [
    {
      key: "tipo",
      header: "Tipo",
      render: (item: Custo) => {
        const config = tipoConfig[item.tipo];
        const Icon = config.icon;
        return (
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg bg-muted ${config.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <span>{config.label}</span>
          </div>
        );
      },
    },
    {
      key: "freteId",
      header: "Frete",
      render: (item: Custo) => (
        <span className="font-mono text-primary">{item.freteId}</span>
      ),
    },
    { key: "descricao", header: "Descrição" },
    {
      key: "valor",
      header: "Valor",
      render: (item: Custo) => (
        <span className="font-semibold text-loss">
          R$ {item.valor.toLocaleString("pt-BR")}
        </span>
      ),
    },
    {
      key: "data",
      header: "Data",
      render: (item: Custo) => (
        <span className="text-muted-foreground">{item.data}</span>
      ),
    },
    {
      key: "comprovante",
      header: "Comprovante",
      render: (item: Custo) => (
        <Badge variant={item.comprovante ? "success" : "neutral"}>
          {item.comprovante ? "Anexado" : "Pendente"}
        </Badge>
      ),
    },
  ];

  return (
    <MainLayout title="Custos" subtitle="Gestão de custos operacionais">
      <PageHeader
        title="Custos"
        description="Controle de custos por frete e tipo"
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Custo
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total de Custos"
          value={`R$ ${totalCustos.toLocaleString("pt-BR")}`}
          variant="loss"
          icon={<DollarSign className="h-5 w-5 text-loss" />}
        />
        <StatCard
          label="Combustível"
          value={`R$ ${totalCombustivel.toLocaleString("pt-BR")}`}
          variant="warning"
          icon={<Fuel className="h-5 w-5 text-warning" />}
        />
        <StatCard
          label="Manutenção"
          value={`R$ ${totalManutencao.toLocaleString("pt-BR")}`}
          variant="loss"
          icon={<Wrench className="h-5 w-5 text-loss" />}
        />
        <StatCard
          label="Pedágios"
          value={`R$ ${totalPedagio.toLocaleString("pt-BR")}`}
          variant="primary"
          icon={<Truck className="h-5 w-5 text-primary" />}
        />
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por frete ou descrição..."
      >
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="combustivel">Combustível</SelectItem>
            <SelectItem value="manutencao">Manutenção</SelectItem>
            <SelectItem value="pedagio">Pedágio</SelectItem>
            <SelectItem value="outros">Outros</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      <DataTable<Custo>
        columns={columns}
        data={filteredData}
        emptyMessage="Nenhum custo encontrado"
      />

      {/* New Cost Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Custo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="frete">Frete</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o frete" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1250">#1250 - SP → RJ</SelectItem>
                  <SelectItem value="1249">#1249 - PR → SC</SelectItem>
                  <SelectItem value="1248">#1248 - MG → DF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Custo</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="combustivel">Combustível</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="pedagio">Pedágio</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input id="descricao" placeholder="Descreva o custo" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor">Valor</Label>
              <Input id="valor" type="number" placeholder="0,00" />
            </div>
            <div className="space-y-2">
              <Label>Comprovante</Label>
              <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Clique ou arraste para anexar
                </p>
              </div>
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
    </MainLayout>
  );
}
