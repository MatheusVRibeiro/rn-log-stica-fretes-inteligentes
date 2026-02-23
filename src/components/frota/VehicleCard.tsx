import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Wrench, FileWarning, AlertTriangle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Caminhao, Motorista } from "@/types";

interface VehicleCardProps {
    item: Caminhao;
    motorista?: Motorista;
    isProprio: boolean;
    statusConfig: Record<string, { label: string; variant: any }>;
    formatVehicleCategory: (type?: Caminhao["tipo_veiculo"]) => string;
    onClick: (item: Caminhao) => void;
}

export function VehicleCard({
    item,
    motorista,
    isProprio,
    statusConfig,
    formatVehicleCategory,
    onClick,
}: VehicleCardProps) {


    const isDocumentExpiringSoon = (dateStr?: string) => {
        if (!dateStr) return false;
        const parts = dateStr.split('/');
        if (parts.length !== 3) return false;
        const [day, month, year] = parts;
        const docDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        const today = new Date();
        const diffDays = Math.ceil((docDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 30 && diffDays >= 0;
    };

    const isDocumentExpired = (dateStr?: string) => {
        if (!dateStr) return false;
        const parts = dateStr.split('/');
        if (parts.length !== 3) return false;
        const [day, month, year] = parts;
        const docDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        const today = new Date();
        return docDate < today;
    };


    const hasDocAlert = isDocumentExpired(item.validade_seguro) ||
        isDocumentExpired(item.validade_licenciamento) ||
        isDocumentExpiringSoon(item.validade_seguro) ||
        isDocumentExpiringSoon(item.validade_licenciamento);

    const isCriticalDoc = isDocumentExpired(item.validade_seguro) || isDocumentExpired(item.validade_licenciamento);

    return (
        <Card
            className={cn(
                "group relative overflow-hidden p-5 rounded-xl border bg-gradient-to-br from-card to-muted/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                isProprio ? "border-l-4 border-l-primary/60" : "border-l-4 border-l-foreground/20"
            )}
            onClick={() => onClick(item)}
        >
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center transition-colors duration-300",
                        isProprio ? "bg-primary/10 group-hover:bg-primary/20" : "bg-muted/60 group-hover:bg-muted/80"
                    )}>
                        <Truck className={cn("h-5 w-5", isProprio ? "text-primary" : "text-foreground/70")} />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-lg tracking-tight uppercase">{item.placa}</h3>
                        <p className="text-xs text-muted-foreground truncate font-medium">{item.modelo}</p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <Badge variant={statusConfig[item.status].variant} className="text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider">
                        {statusConfig[item.status].label}
                    </Badge>
                    {hasDocAlert && (
                        <div className={cn(
                            "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                            isCriticalDoc ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                        )}>
                            <FileWarning className="h-3 w-3" />
                            Doc
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="flex flex-col gap-1 px-2 py-1.5 rounded-lg bg-muted/40">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground/70">Categoria</span>
                    <span className="text-xs font-bold truncate">{formatVehicleCategory(item.tipo_veiculo)}</span>
                </div>
                <div className="flex flex-col gap-1 px-2 py-1.5 rounded-lg bg-muted/40 text-right">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground/70">Capacidade</span>
                    <span className="text-xs font-bold">{item.capacidade_toneladas} ton</span>
                </div>
            </div>


            <div className="mt-auto group-hover:bg-muted/50 transition-colors duration-300 rounded-lg border bg-muted/30 px-3 py-2.5">
                <div className="flex items-center gap-2 mb-1">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <p className="text-[10px] uppercase font-bold text-muted-foreground/70">Responsável</p>
                </div>
                <p className="text-sm font-bold leading-tight text-foreground truncate">
                    {motorista?.nome || "Sem responsável definido"}
                </p>
            </div>

            {item.placa_carreta && (
                <div className="absolute bottom-0 right-0 p-1">
                    <Badge variant="outline" className="text-[9px] bg-background/50 backdrop-blur-sm border-dashed">
                        Carreta: {item.placa_carreta}
                    </Badge>
                </div>
            )}
        </Card>
    );
}
