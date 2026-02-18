import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface RevenueVsCostItem {
  mes: string;
  receita: number;
  custos: number;
}

interface RevenueVsCostBarChartProps {
  data: RevenueVsCostItem[];
}

export function RevenueVsCostBarChart({ data }: RevenueVsCostBarChartProps) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
              borderRadius: "8px",
            }}
            formatter={(value: number, name: string) => [
              `R$ ${value.toLocaleString("pt-BR")}`,
              name === "receita" ? "Receita" : "Custos",
            ]}
          />
          <Legend formatter={(value) => (value === "receita" ? "Receita" : "Custos")} />
          <Bar dataKey="receita" fill="hsl(142, 71%, 45%)" radius={[6, 6, 0, 0]} />
          <Bar dataKey="custos" fill="hsl(0, 84%, 60%)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
