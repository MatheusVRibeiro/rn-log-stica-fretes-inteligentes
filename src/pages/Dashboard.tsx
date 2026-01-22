import { MainLayout } from "@/components/layout/MainLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { AlertCard } from "@/components/dashboard/AlertCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ProfitChart } from "@/components/dashboard/ProfitChart";
import { DriversRanking } from "@/components/dashboard/DriversRanking";
import { Route, DollarSign, TrendingDown, TrendingUp } from "lucide-react";

export default function Dashboard() {
  return (
    <MainLayout title="Dashboard" subtitle="Visão geral do sistema">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Fretes Ativos"
          value="47"
          icon={<Route className="h-5 w-5" />}
          trend={{ value: 12, isPositive: true }}
        />
        <KPICard
          title="Receita Total"
          value="R$ 295.000"
          icon={<DollarSign className="h-5 w-5" />}
          trend={{ value: 8, isPositive: true }}
        />
        <KPICard
          title="Custos Totais"
          value="R$ 205.000"
          icon={<TrendingDown className="h-5 w-5" />}
          variant="loss"
          trend={{ value: 5, isPositive: false }}
        />
        <KPICard
          title="Lucro Líquido"
          value="R$ 90.000"
          icon={<TrendingUp className="h-5 w-5" />}
          variant="profit"
          trend={{ value: 15, isPositive: true }}
        />
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <AlertCard
          type="danger"
          title="Frete com prejuízo detectado"
          description="O frete #1247 (SP → RJ) está com margem negativa de -12%"
          action="Ver detalhes"
        />
        <AlertCard
          type="warning"
          title="Margem baixa em 3 fretes"
          description="Alguns fretes estão com margem abaixo de 10%. Revise os custos."
          action="Analisar fretes"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RevenueChart />
        <ProfitChart />
      </div>

      {/* Drivers Ranking */}
      <div className="grid grid-cols-1">
        <DriversRanking />
      </div>
    </MainLayout>
  );
}
