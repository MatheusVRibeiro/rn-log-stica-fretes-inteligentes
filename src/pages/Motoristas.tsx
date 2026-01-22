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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, TrendingUp } from "lucide-react";

interface Motorista {
  id: string;
  nome: string;
  cpf: string;
  status: "ativo" | "inativo" | "ferias";
  receitaGerada: number;
  viagensRealizadas: number;
  dataAdmissao: string;
}

const motoristasData: Motorista[] = [
  {
    id: "1",
    nome: "Carlos Silva",
    cpf: "123.456.789-00",
    status: "ativo",
    receitaGerada: 89500,
    viagensRealizadas: 24,
    dataAdmissao: "15/03/2020",
  },
  {
    id: "2",
    nome: "João Oliveira",
    cpf: "234.567.890-11",
    status: "ativo",
    receitaGerada: 78200,
    viagensRealizadas: 21,
    dataAdmissao: "22/08/2019",
  },
  {
    id: "3",
    nome: "Pedro Santos",
    cpf: "345.678.901-22",
    status: "ferias",
    receitaGerada: 72100,
    viagensRealizadas: 19,
    dataAdmissao: "10/01/2021",
  },
  {
    id: "4",
    nome: "André Costa",
    cpf: "456.789.012-33",
    status: "ativo",
    receitaGerada: 65800,
    viagensRealizadas: 17,
    dataAdmissao: "05/06/2022",
  },
  {
    id: "5",
    nome: "Lucas Ferreira",
    cpf: "567.890.123-44",
    status: "inativo",
    receitaGerada: 58400,
    viagensRealizadas: 15,
    dataAdmissao: "18/11/2018",
  },
];

const statusConfig = {
  ativo: { label: "Ativo", variant: "active" as const },
  inativo: { label: "Inativo", variant: "inactive" as const },
  ferias: { label: "Férias", variant: "warning" as const },
};

export default function Motoristas() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMotorista, setSelectedMotorista] = useState<Motorista | null>(null);

  const filteredData = motoristasData.filter((motorista) => {
    const matchesSearch =
      motorista.nome.toLowerCase().includes(search.toLowerCase()) ||
      motorista.cpf.includes(search);
    const matchesStatus =
      statusFilter === "all" || motorista.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: "nome",
      header: "Motorista",
      render: (item: Motorista) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-primary/10 text-primary">
              {item.nome
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{item.nome}</p>
            <p className="text-sm text-muted-foreground">{item.cpf}</p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item: Motorista) => (
        <Badge variant={statusConfig[item.status].variant}>
          {statusConfig[item.status].label}
        </Badge>
      ),
    },
    {
      key: "receitaGerada",
      header: "Receita Gerada",
      render: (item: Motorista) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-profit">
            R$ {item.receitaGerada.toLocaleString("pt-BR")}
          </span>
          <TrendingUp className="h-4 w-4 text-profit" />
        </div>
      ),
    },
    {
      key: "viagensRealizadas",
      header: "Viagens",
      render: (item: Motorista) => (
        <span className="text-muted-foreground">{item.viagensRealizadas} viagens</span>
      ),
    },
    {
      key: "dataAdmissao",
      header: "Admissão",
      render: (item: Motorista) => (
        <span className="text-muted-foreground">{item.dataAdmissao}</span>
      ),
    },
  ];

  // Simulated freight history
  const historicoFretes = [
    { id: "#1250", rota: "SP → RJ", data: "20/01/2025", valor: "R$ 15.000" },
    { id: "#1245", rota: "PR → SC", data: "15/01/2025", valor: "R$ 8.500" },
    { id: "#1240", rota: "MG → DF", data: "10/01/2025", valor: "R$ 12.000" },
  ];

  return (
    <MainLayout title="Motoristas" subtitle="Gestão de motoristas">
      <PageHeader
        title="Motoristas"
        description="Gerencie sua equipe de motoristas"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Motorista
          </Button>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nome ou CPF..."
      >
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
            <SelectItem value="ferias">Férias</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>

      <DataTable<Motorista>
        columns={columns}
        data={filteredData}
        onRowClick={(item) => setSelectedMotorista(item)}
        emptyMessage="Nenhum motorista encontrado"
      />

      {/* Driver Detail Modal */}
      <Dialog open={!!selectedMotorista} onOpenChange={() => setSelectedMotorista(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Motorista</DialogTitle>
          </DialogHeader>
          {selectedMotorista && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {selectedMotorista.nome
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xl font-bold">{selectedMotorista.nome}</p>
                  <p className="text-muted-foreground">{selectedMotorista.cpf}</p>
                  <Badge
                    variant={statusConfig[selectedMotorista.status].variant}
                    className="mt-1"
                  >
                    {statusConfig[selectedMotorista.status].label}
                  </Badge>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-profit/5 border border-profit/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Receita Gerada</p>
                  <p className="text-xl font-bold text-profit">
                    R$ {selectedMotorista.receitaGerada.toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Viagens</p>
                  <p className="text-xl font-bold text-primary">
                    {selectedMotorista.viagensRealizadas}
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Admissão</p>
                  <p className="text-xl font-bold">{selectedMotorista.dataAdmissao}</p>
                </div>
              </div>

              {/* Freight History */}
              <div>
                <h4 className="font-semibold mb-4">Histórico de Fretes</h4>
                <div className="space-y-2">
                  {historicoFretes.map((frete) => (
                    <div
                      key={frete.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-sm">{frete.id}</span>
                        <span>{frete.rota}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">{frete.data}</span>
                        <span className="font-medium text-profit">{frete.valor}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
