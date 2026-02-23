import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Truck, Phone, Mail, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Motorista } from "@/types";

interface MotoristasCardsProps {
    data: Motorista[];
    onSelectMotorista: (motorista: Motorista) => void;
    getDriverInitials: (name: string) => string;
    maskDocumento: (doc?: string | null) => string;
    toNumber: (value: any) => number;
    formatarTelefone: (telefone: string) => string;
    statusConfig: Record<string, { label: string; variant: any }>;
    tipoMotoristaConfig: Record<string, { label: string; variant: any }>;
}

export function MotoristasCards({
    data,
    onSelectMotorista,
    getDriverInitials,
    maskDocumento,
    toNumber,
    formatarTelefone,
    statusConfig,
    tipoMotoristaConfig,
}: MotoristasCardsProps) {
    if (data.length === 0) {
        return (
            <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center">
                <p className="text-sm text-muted-foreground">Nenhum motorista encontrado</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.map((item) => (
                <Card
                    key={item.id}
                    className="group p-4 rounded-xl border border-border/60 bg-gradient-to-br from-card to-muted/20 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectMotorista(item)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onSelectMotorista(item);
                        }
                    }}
                >
                    <div className="flex items-start gap-3">
                        <Avatar className="h-11 w-11 border border-primary/15">
                            <AvatarFallback className="bg-gradient-to-br from-primary/15 to-primary/5 text-primary font-semibold text-base">
                                {getDriverInitials(item.nome)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="font-semibold text-foreground leading-tight truncate">{item.nome}</p>
                                    <p className="text-xs text-muted-foreground">{maskDocumento(item.documento)}</p>
                                </div>
                                <span
                                    className={cn(
                                        "h-2 w-2 rounded-full mt-1",
                                        item.status === "ativo" && "bg-green-500",
                                        item.status === "inativo" && "bg-red-500",
                                        item.status === "ferias" && "bg-yellow-500"
                                    )}
                                />
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <Badge variant={statusConfig[item.status]?.variant || "default"} className="text-[10px]">
                                    {statusConfig[item.status]?.label || "Status"}
                                </Badge>
                                <Badge
                                    variant={tipoMotoristaConfig[item.tipo]?.variant || "outline"}
                                    className={cn(
                                        "text-[10px]",
                                        item.tipo === "terceirizado" && "bg-emerald-600 text-white border-emerald-600"
                                    )}
                                >
                                    {item.tipo === "terceirizado" ? "Terceirizado" : "Próprio"}
                                </Badge>
                                {item.caminhao_atual && (
                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 dark:bg-blue-950/40 rounded-md text-[10px] text-blue-600 dark:text-blue-300">
                                        <Truck className="h-3 w-3" />
                                        {item.caminhao_atual}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-3 flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5" />
                                <span className="font-medium text-foreground">
                                    {item.telefone ? formatarTelefone(item.telefone) : "Sem Telefone"}
                                </span>
                            </span>
                            <span className="inline-flex items-center gap-2 min-w-0">
                                <Mail className="h-3.5 w-3.5" />
                                <span className="truncate">{item.email || "Sem e-mail"}</span>
                            </span>
                        </div>
                        {item.endereco && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5" />
                                <span className="truncate">{item.endereco}</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/50 grid grid-cols-3 gap-2">
                        <div>
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Receita total</p>
                            <p className="text-sm font-semibold text-profit">
                                R$ {toNumber(item.receita_gerada).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Viagens</p>
                            <p className="text-sm font-semibold text-primary">
                                {toNumber(item.viagens_realizadas)}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Media/viagem</p>
                            <p className="text-sm font-semibold text-foreground">
                                R$ {(
                                    toNumber(item.receita_gerada) /
                                    Math.max(toNumber(item.viagens_realizadas), 1)
                                ).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}
