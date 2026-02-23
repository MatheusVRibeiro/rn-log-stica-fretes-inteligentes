import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Truck,
    Edit,
    CalendarDays,
    Weight,
    Gauge,
    Wrench,
    AlertCircle,
    User,
    FileText,
    Shield,
    Fuel,
    Package as PackageIcon,
} from "lucide-react";
import type { Caminhao, Motorista } from "@/types";
import { formatarDocumento } from "@/utils/formatters";
import { cn } from "@/lib/utils";

interface VehicleDetailsDialogProps {
    selectedCaminhao: Caminhao | null;
    setSelectedCaminhao: (val: Caminhao | null) => void;
    statusConfig: Record<string, { label: string; variant: any }>;
    motoristasDisponiveis: Motorista[];
    onEdit: (item: Caminhao) => void;
    isShaking?: boolean;
}

export function VehicleDetailsDialog({
    selectedCaminhao,
    setSelectedCaminhao,
    statusConfig,
    motoristasDisponiveis,
    onEdit,
    isShaking,
}: VehicleDetailsDialogProps) {
    if (!selectedCaminhao) return null;


    const isDocumentExpiringSoon = (dateStr?: string) => {
        if (!dateStr) return false;
        const parts = dateStr.split("/");
        if (parts.length !== 3) return false;
        const [day, month, year] = parts;
        const docDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        const today = new Date();
        const diffDays = Math.ceil((docDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 30 && diffDays >= 0;
    };

    const isDocumentExpired = (dateStr?: string) => {
        if (!dateStr) return false;
        const parts = dateStr.split("/");
        if (parts.length !== 3) return false;
        const [day, month, year] = parts;
        const docDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        const today = new Date();
        return docDate < today;
    };

    const motorista = motoristasDisponiveis.find((m) => m.id === selectedCaminhao.motorista_fixo_id);

    return (
        <Dialog open={!!selectedCaminhao} onOpenChange={() => setSelectedCaminhao(null)}>
            <DialogContent className={`max-w-3xl ${isShaking ? "animate-shake" : ""}`}>
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle>Detalhes do Caminhão</DialogTitle>
                            <DialogDescription>Informações completas sobre o veículo</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <div className="max-h-[calc(90vh-200px)] overflow-y-auto px-1">
                    <div className="space-y-6">
                        {/* Header */}
                        <Card className="p-4 bg-gradient-to-br from-primary/5 to-transparent border-dashed">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                                        <Truck className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold mb-1 tracking-wide uppercase">{selectedCaminhao.placa}</h2>
                                        <p className="text-base font-semibold mb-1.5 text-muted-foreground">{selectedCaminhao.modelo}</p>
                                        <Badge variant={statusConfig[selectedCaminhao.status].variant} className="text-xs font-bold uppercase">
                                            {statusConfig[selectedCaminhao.status].label}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Specs */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Card className="p-3 border-l-4 border-l-blue-500">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <CalendarDays className="h-3.5 w-3.5 text-blue-600" />
                                    <p className="text-xs text-muted-foreground font-bold uppercase">Ano</p>
                                </div>
                                <p className="text-lg font-bold text-blue-600">{selectedCaminhao.ano_fabricacao}</p>
                            </Card>

                            <Card className="p-3 border-l-4 border-l-green-500">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <Weight className="h-3.5 w-3.5 text-green-600" />
                                    <p className="text-xs text-muted-foreground font-bold uppercase">Capacidade</p>
                                </div>
                                <p className="text-lg font-bold text-green-600 font-mono">{selectedCaminhao.capacidade_toneladas} ton</p>
                            </Card>

                            <Card className="p-3 border-l-4 border-l-purple-500">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <Gauge className="h-3.5 w-3.5 text-purple-600" />
                                    <p className="text-xs text-muted-foreground font-bold uppercase">KM Atual</p>
                                </div>
                                <p className="text-lg font-bold text-purple-600 font-mono">
                                    {selectedCaminhao.km_atual.toLocaleString("pt-BR")}
                                </p>
                            </Card>
                        </div>

                        <Separator />

                        {/* Maintenance */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
                                <Wrench className="h-4 w-4" />
                                Manutenção Preventiva
                            </h4>
                            <Card className="p-4 bg-muted/20">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Última Realizada</p>
                                        <p className="font-bold text-sm">{selectedCaminhao.ultima_manutencao_data || "Não informada"}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Próxima em</p>
                                        <p className="font-bold text-sm font-mono">{selectedCaminhao.proxima_manutencao_km?.toLocaleString("pt-BR")} km</p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {motorista && (
                            <>
                                <Separator />
                                <div className="space-y-4">
                                    <h4 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
                                        <User className="h-4 w-4" />
                                        Responsável Atual
                                    </h4>
                                    <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <p className="font-black text-lg text-blue-700 dark:text-blue-400 uppercase">{motorista.nome}</p>
                                                <div className="flex items-center gap-3">
                                                    <Badge variant={motorista.tipo === "proprio" ? "default" : "outline"} className="text-[10px] uppercase font-bold">
                                                        {motorista.tipo === "proprio" ? "Próprio" : "Terceirizado"}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground font-medium">📞 {motorista.telefone}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Documento</p>
                                                <p className="font-mono text-xs font-bold">{formatarDocumento(motorista.documento)}</p>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </>
                        )}

                        <Separator />

                        {/* Documentação */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
                                <FileText className="h-4 w-4" />
                                Dossiê do Veículo
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="p-3 bg-muted/30">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">RENAVAM</p>
                                    <p className="font-mono font-bold text-sm">{selectedCaminhao.renavam || "—"}</p>
                                </Card>
                                <Card className="p-3 bg-muted/30">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Chassi</p>
                                    <p className="font-mono font-bold text-sm uppercase">{selectedCaminhao.chassi || "—"}</p>
                                </Card>
                                <Card className="p-3 bg-muted/30">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">ANTT</p>
                                    <p className="font-mono font-bold text-sm uppercase">{selectedCaminhao.registro_antt || "—"}</p>
                                </Card>
                                <Card className="p-3 bg-muted/30">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Tipo Proprietário</p>
                                    <Badge variant="outline" className="font-bold uppercase text-[10px]">
                                        {selectedCaminhao.proprietario_tipo || "—"}
                                    </Badge>
                                </Card>
                            </div>

                            {/* Validades */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className={cn(
                                    "p-4 border-l-4",
                                    isDocumentExpired(selectedCaminhao.validade_seguro) ? "border-l-red-500 bg-red-50 dark:bg-red-950/10" :
                                        isDocumentExpiringSoon(selectedCaminhao.validade_seguro) ? "border-l-orange-500 bg-orange-50 dark:bg-orange-950/10" : "border-l-primary bg-muted/20"
                                )}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Shield className={cn("h-4 w-4", isDocumentExpired(selectedCaminhao.validade_seguro) ? "text-red-500" : "text-primary")} />
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Validade Seguro</p>
                                    </div>
                                    <p className={cn(
                                        "text-lg font-black font-mono",
                                        isDocumentExpired(selectedCaminhao.validade_seguro) ? "text-red-600" :
                                            isDocumentExpiringSoon(selectedCaminhao.validade_seguro) ? "text-orange-600" : "text-primary"
                                    )}>
                                        {selectedCaminhao.validade_seguro || "—"}
                                    </p>
                                </Card>

                                <Card className={cn(
                                    "p-4 border-l-4",
                                    isDocumentExpired(selectedCaminhao.validade_licenciamento) ? "border-l-red-500 bg-red-50 dark:bg-red-950/10" :
                                        isDocumentExpiringSoon(selectedCaminhao.validade_licenciamento) ? "border-l-orange-500 bg-orange-50 dark:bg-orange-950/10" : "border-l-cyan-500 bg-muted/20"
                                )}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className={cn("h-4 w-4", isDocumentExpired(selectedCaminhao.validade_licenciamento) ? "text-red-500" : "text-cyan-600")} />
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Licenciamento</p>
                                    </div>
                                    <p className={cn(
                                        "text-lg font-black font-mono",
                                        isDocumentExpired(selectedCaminhao.validade_licenciamento) ? "text-red-600" :
                                            isDocumentExpiringSoon(selectedCaminhao.validade_licenciamento) ? "text-orange-600" : "text-cyan-600"
                                    )}>
                                        {selectedCaminhao.validade_licenciamento || "—"}
                                    </p>
                                </Card>
                            </div>
                        </div>

                        <Separator />

                        {/* Técnicas */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
                                <PackageIcon className="h-4 w-4" />
                                Especificações Técnicas
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="p-4 border-l-4 border-l-indigo-500 bg-muted/20">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Truck className="h-4 w-4 text-indigo-600" />
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Configuração</p>
                                    </div>
                                    <p className="text-lg font-black text-indigo-600 uppercase">{selectedCaminhao.tipo_veiculo || "—"}</p>
                                </Card>
                                <Card className="p-4 border-l-4 border-l-amber-500 bg-muted/20">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Fuel className="h-4 w-4 text-amber-600" />
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Combustível</p>
                                    </div>
                                    <p className="text-lg font-black text-amber-600 uppercase">{selectedCaminhao.tipo_combustivel || "—"}</p>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="pt-6 border-t mt-6 flex flex-col sm:flex-row gap-3">
                    <Button variant="outline" onClick={() => setSelectedCaminhao(null)} className="flex-1 font-bold uppercase tracking-wider">
                        Fechar
                    </Button>
                    <Button
                        onClick={() => {
                            onEdit(selectedCaminhao);
                            setSelectedCaminhao(null);
                        }}
                        className="flex-1 gap-2 font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                    >
                        <Edit className="h-4 w-4" />
                        Editar Veículo
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}
