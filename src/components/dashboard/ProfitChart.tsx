import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const data = [
  { month: "Jan", lucro: 43000 },
  { month: "Fev", lucro: 43000 },
  { month: "Mar", lucro: 52000 },
  { month: "Abr", lucro: 70000 },
  { month: "Mai", lucro: 78000 },
  { month: "Jun", lucro: 90000 },
];

export function ProfitChart() {
  return (
    <div className="bg-card rounded-xl border p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-foreground">Lucro Mensal</h3>
          <p className="text-sm text-muted-foreground">Evolução do resultado</p>
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [
                `R$ ${value.toLocaleString("pt-BR")}`,
                "Lucro",
              ]}
            />
            <Bar dataKey="lucro" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.lucro >= 0 ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
