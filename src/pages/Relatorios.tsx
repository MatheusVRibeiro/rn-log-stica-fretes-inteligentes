import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Download, FileSpreadsheet, FileText } from "lucide-react";

interface RelatorioItem {
  freteId: string;
  rota: string;
  motorista: string;
  dataInicio: string;
  dataFim: string;
  receita: number;
  custos: number;
  resultado: number;
}

const relatoriosData: RelatorioItem[] = [
  {
    freteId: "#1250",
    rota: "São Paulo → Rio de Janeiro",
    motorista: "Carlos Silva",
    dataInicio: "20/01/2025",
    dataFim: "21/01/2025",
    receita: 15000,
    custos: 11000,
    resultado: 4000,
  },
  {
    freteId: "#1249",
    rota: "Curitiba → Florianópolis",
    motorista: "João Oliveira",
    dataInicio: "18/01/2025",
    dataFim: "18/01/2025",
    receita: 8500,
    custos: 6200,
    resultado: 2300,
  },
  {
    freteId: "#1248",
    rota: "Belo Horizonte → Brasília",
    motorista: "Pedro Santos",
    dataInicio: "15/01/2025",
    dataFim: "16/01/2025",
    receita: 12000,
    custos: 8800,
    resultado: 3200,
  },
  {
    freteId: "#1247",
    rota: "São Paulo → Rio de Janeiro",
    motorista: "André Costa",
    dataInicio: "12/01/2025",
    dataFim: "13/01/2025",
    receita: 14000,
    custos: 15680,
    resultado: -1680,
  },
];

export default function Relatorios() {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [motorista, setMotorista] = useState<string>("all");

  const totalReceita = relatoriosData.reduce((acc, r) => acc + r.receita, 0);
  const totalCustos = relatoriosData.reduce((acc, r) => acc + r.custos, 0);
  const totalResultado = relatoriosData.reduce((acc, r) => acc + r.resultado, 0);

  const columns = [
    {
      key: "freteId",
      header: "ID Frete",
      render: (item: RelatorioItem) => (
        <span className="font-mono">{item.freteId}</span>
      ),
    },
    { key: "rota", header: "Rota" },
    { key: "motorista", header: "Motorista" },
    { key: "dataInicio", header: "Início" },
    { key: "dataFim", header: "Fim" },
    {
      key: "receita",
      header: "Receita",
      render: (item: RelatorioItem) => (
        <span className="font-medium text-profit">
          R$ {item.receita.toLocaleString("pt-BR")}
        </span>
      ),
    },
    {
      key: "custos",
      header: "Custos",
      render: (item: RelatorioItem) => (
        <span className="text-loss">
          R$ {item.custos.toLocaleString("pt-BR")}
        </span>
      ),
    },
    {
      key: "resultado",
      header: "Resultado",
      render: (item: RelatorioItem) => (
        <Badge variant={item.resultado >= 0 ? "profit" : "loss"}>
          {item.resultado >= 0 ? "+" : ""}R${" "}
          {item.resultado.toLocaleString("pt-BR")}
        </Badge>
      ),
    },
  ];

  return (
    <MainLayout title="Relatórios" subtitle="Relatórios consolidados">
      <PageHeader
        title="Relatórios"
        description="Exporte relatórios detalhados de operação"
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-card rounded-xl border">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Data Início</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-48 justify-start text-left font-normal",
                  !dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom
                  ? format(dateFrom, "dd/MM/yyyy", { locale: ptBR })
                  : "Selecione"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Data Fim</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-48 justify-start text-left font-normal",
                  !dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo
                  ? format(dateTo, "dd/MM/yyyy", { locale: ptBR })
                  : "Selecione"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Motorista</label>
          <Select value={motorista} onValueChange={setMotorista}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="carlos">Carlos Silva</SelectItem>
              <SelectItem value="joao">João Oliveira</SelectItem>
              <SelectItem value="pedro">Pedro Santos</SelectItem>
              <SelectItem value="andre">André Costa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Gerar Relatório
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-profit/5 border border-profit/20 rounded-xl">
          <p className="text-sm text-muted-foreground">Receita Total</p>
          <p className="text-2xl font-bold text-profit">
            R$ {totalReceita.toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="p-4 bg-loss/5 border border-loss/20 rounded-xl">
          <p className="text-sm text-muted-foreground">Custos Totais</p>
          <p className="text-2xl font-bold text-loss">
            R$ {totalCustos.toLocaleString("pt-BR")}
          </p>
        </div>
        <div
          className={cn(
            "p-4 rounded-xl border",
            totalResultado >= 0
              ? "bg-profit/5 border-profit/20"
              : "bg-loss/5 border-loss/20"
          )}
        >
          <p className="text-sm text-muted-foreground">Resultado</p>
          <p
            className={cn(
              "text-2xl font-bold",
              totalResultado >= 0 ? "text-profit" : "text-loss"
            )}
          >
            {totalResultado >= 0 ? "+" : ""}R${" "}
            {totalResultado.toLocaleString("pt-BR")}
          </p>
        </div>
      </div>

      <DataTable<RelatorioItem>
        columns={columns}
        data={relatoriosData}
        highlightNegative={(item) => item.resultado < 0}
        emptyMessage="Nenhum registro encontrado"
      />
    </MainLayout>
  );
}
