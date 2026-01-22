import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";

const drivers = [
  { name: "Carlos Silva", revenue: 89500, trips: 24, trend: 12 },
  { name: "João Oliveira", revenue: 78200, trips: 21, trend: 8 },
  { name: "Pedro Santos", revenue: 72100, trips: 19, trend: 5 },
  { name: "André Costa", revenue: 65800, trips: 17, trend: -2 },
  { name: "Lucas Ferreira", revenue: 58400, trips: 15, trend: 3 },
];

export function DriversRanking() {
  return (
    <div className="bg-card rounded-xl border p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-foreground">Top Motoristas</h3>
          <p className="text-sm text-muted-foreground">Por receita gerada</p>
        </div>
        <Badge variant="secondary">Este mês</Badge>
      </div>
      <div className="space-y-4">
        {drivers.map((driver, index) => (
          <div
            key={driver.name}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <span className="text-sm font-bold text-muted-foreground w-5">
              {index + 1}º
            </span>
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {driver.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{driver.name}</p>
              <p className="text-sm text-muted-foreground">{driver.trips} viagens</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-foreground">
                R$ {driver.revenue.toLocaleString("pt-BR")}
              </p>
              <div className="flex items-center justify-end gap-1">
                <TrendingUp
                  className={`h-3 w-3 ${
                    driver.trend >= 0 ? "text-profit" : "text-loss"
                  }`}
                />
                <span
                  className={`text-xs ${
                    driver.trend >= 0 ? "text-profit" : "text-loss"
                  }`}
                >
                  {driver.trend >= 0 ? "+" : ""}
                  {driver.trend}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
