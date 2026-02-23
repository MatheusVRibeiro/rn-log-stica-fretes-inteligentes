import { Card } from "@/components/ui/card";
import { Truck, AlertCircle } from "lucide-react";
import type { Caminhao } from "@/types";

interface FleetSummaryCardsProps {
    caminhoes: Caminhao[];
    getFleetType: (caminhao: Caminhao) => "PROPRIO" | "TERCEIRO";
    emOperacaoCount: number;
}

export function FleetSummaryCards({ caminhoes, getFleetType, emOperacaoCount }: FleetSummaryCardsProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/40 dark:to-green-900/20 border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-lg bg-green-600 flex items-center justify-center">
                        <Truck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Total de Veículos</p>
                        <p className="text-xl font-bold text-green-700 dark:text-green-400">{caminhoes.length}</p>
                    </div>
                </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
                        <Truck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Frota Própria</p>
                        <p className="text-xl font-bold text-blue-700 dark:text-blue-400">
                            {caminhoes.filter(c => getFleetType(c) === "PROPRIO").length}
                        </p>
                    </div>
                </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-slate-50 to-slate-100/60 dark:from-slate-900/50 dark:to-slate-800/30 border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-lg bg-slate-600 flex items-center justify-center">
                        <Truck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Terceirizados</p>
                        <p className="text-xl font-bold text-slate-700 dark:text-slate-300">
                            {caminhoes.filter(c => getFleetType(c) === "TERCEIRO").length}
                        </p>
                    </div>
                </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/40 dark:to-red-900/20 border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-lg bg-red-600 flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Em Operação</p>
                        <p className="text-xl font-bold text-red-700 dark:text-red-400">
                            {emOperacaoCount}
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
