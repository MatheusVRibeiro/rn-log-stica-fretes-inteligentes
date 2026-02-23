import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Truck, Info, CalendarDays, Weight, Gauge, Fuel, AlertCircle, User, Shield, FileText, Wrench } from "lucide-react";
import { ModalSubmitFooter } from "@/components/shared/ModalSubmitFooter";
import { FieldError, fieldErrorClass } from "@/components/shared/FieldError";
import { cn } from "@/lib/utils";
import type { Caminhao, CriarCaminhaoPayload, Motorista } from "@/types";

interface VehicleFormModalProps {
    isModalOpen: boolean;
    setIsModalOpen: (open: boolean) => void;
    isSaving: boolean;
    isEditing: boolean;
    editedCaminhao: Partial<CriarCaminhaoPayload>;
    setEditedCaminhao: (val: Partial<CriarCaminhaoPayload>) => void;
    formErrors: Record<string, string>;
    clearFormError: (field: string) => void;
    handleSave: () => void;
    motoristasDisponiveis: Motorista[];
    transportadoraContelli?: Motorista;
    autoFilledFields: { placa?: boolean; motorista?: boolean; proprietario_tipo?: boolean };
    setAutoFilledFields: (val: any) => void;
    formatPlateAsUserTypes: (value: string) => string;
    resetFormErrors: () => void;
    isShaking: boolean;
}

export function VehicleFormModal({
    isModalOpen,
    setIsModalOpen,
    isSaving,
    isEditing,
    editedCaminhao,
    setEditedCaminhao,
    formErrors,
    clearFormError,
    handleSave,
    motoristasDisponiveis,
    transportadoraContelli,
    autoFilledFields,
    setAutoFilledFields,
    formatPlateAsUserTypes,
    resetFormErrors,
    isShaking,
}: VehicleFormModalProps) {
    return (
        <Dialog
            open={isModalOpen}
            onOpenChange={(open) => {
                if (isSaving) return;
                setIsModalOpen(open);
                resetFormErrors();
            }}
        >
            <DialogContent className={`max-w-4xl max-h-[90vh] overflow-hidden flex flex-col ${isShaking ? "animate-shake" : ""}`}>
                <DialogHeader className="px-6 pt-6">
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Truck className="h-6 w-5 text-primary" />
                        </div>
                        {isEditing ? "Editar Veículo" : "Novo Cadastro de Frota"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Atualize o prontuário técnico do veículo abaixo." : "Registre um novo veículo na frota preenchendo as especificações."}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8">
                    {/* Seção: Identificação e Prontuário */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-0.5 w-8 bg-primary rounded-full" />
                            <h3 className="font-black uppercase tracking-widest text-xs text-muted-foreground">Identificação e Prontuário</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="placa" className="font-bold text-xs uppercase flex items-center gap-2">
                                    <Info className="h-3.5 w-3.5 text-primary" />
                                    Placa do Veículo *
                                </Label>
                                <Input
                                    id="placa"
                                    placeholder="ABC-1234"
                                    maxLength={8}
                                    value={editedCaminhao.placa || ""}
                                    className={cn(
                                        "font-bold uppercase tracking-wider text-base h-11",
                                        autoFilledFields.placa ? "bg-blue-50/50 dark:bg-blue-900/20 border-blue-200" : "",
                                        fieldErrorClass(formErrors.placa)
                                    )}
                                    onChange={(e) => {
                                        const value = formatPlateAsUserTypes(e.target.value);
                                        setEditedCaminhao({ ...editedCaminhao, placa: value });
                                        setAutoFilledFields({});
                                        clearFormError("placa");
                                    }}
                                />
                                <FieldError message={formErrors.placa} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tipoVeiculo" className="font-bold text-xs uppercase flex items-center gap-2">
                                    <Truck className="h-3.5 w-3.5 text-primary" />
                                    Configuração de Eixos *
                                </Label>
                                <Select
                                    value={editedCaminhao.tipo_veiculo || ""}
                                    onValueChange={(value: "TRUCK" | "TOCO" | "CARRETA" | "BITREM") => {
                                        setEditedCaminhao({ ...editedCaminhao, tipo_veiculo: value });
                                        clearFormError("tipo_veiculo");
                                    }}
                                >
                                    <SelectTrigger className={cn("h-11 font-bold uppercase text-xs", fieldErrorClass(formErrors.tipo_veiculo))}>
                                        <SelectValue placeholder="Selecione o tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CARRETA">Carreta</SelectItem>
                                        <SelectItem value="TRUCK">Truck</SelectItem>
                                        <SelectItem value="TOCO">Toco</SelectItem>
                                        <SelectItem value="BITREM">Bitrem</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FieldError message={formErrors.tipo_veiculo} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="modelo" className="font-bold text-xs uppercase flex items-center gap-2">
                                    <Truck className="h-3.5 w-3.5 text-primary" />
                                    Marca e Modelo *
                                </Label>
                                <Input
                                    id="modelo"
                                    placeholder="EX: VOLVO FH 540"
                                    className={cn("uppercase h-11 font-bold text-sm", fieldErrorClass(formErrors.modelo))}
                                    value={editedCaminhao.modelo || ""}
                                    onChange={(e) => {
                                        setEditedCaminhao({ ...editedCaminhao, modelo: e.target.value.toUpperCase() });
                                        clearFormError("modelo");
                                    }}
                                />
                                <FieldError message={formErrors.modelo} />
                            </div>

                            {editedCaminhao.tipo_veiculo && ["CARRETA", "BITREM", "TRUCK"].includes(editedCaminhao.tipo_veiculo) && (
                                <div className="space-y-2">
                                    <Label htmlFor="placaCarreta" className="font-bold text-xs uppercase flex items-center gap-2 text-blue-600">
                                        <Info className="h-3.5 w-3.5" />
                                        Placa do Implemento (Carreta)
                                    </Label>
                                    <Input
                                        id="placaCarreta"
                                        placeholder="CRT-5678"
                                        className={cn("h-11 font-bold uppercase tracking-wider", fieldErrorClass(formErrors.placa_carreta))}
                                        maxLength={8}
                                        value={editedCaminhao.placa_carreta || ""}
                                        onChange={(e) => {
                                            const formatted = formatPlateAsUserTypes(e.target.value);
                                            setEditedCaminhao({ ...editedCaminhao, placa_carreta: formatted });
                                            clearFormError("placa_carreta");
                                        }}
                                    />
                                    <FieldError message={formErrors.placa_carreta} />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="anoFabricacao" className="font-bold text-xs uppercase flex items-center gap-2">
                                    <CalendarDays className="h-3.5 w-3.5 text-primary" />
                                    Ano de Fabr.
                                </Label>
                                <Select
                                    value={(editedCaminhao.ano_fabricacao ? String(editedCaminhao.ano_fabricacao) : "")}
                                    onValueChange={(value) => {
                                        setEditedCaminhao({ ...editedCaminhao, ano_fabricacao: value ? parseInt(value) : undefined });
                                        clearFormError("ano_fabricacao");
                                    }}
                                >
                                    <SelectTrigger className={cn("h-11 font-bold", fieldErrorClass(formErrors.ano_fabricacao))}>
                                        <SelectValue placeholder="Ano" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(() => {
                                            const startYear = 1970;
                                            const current = new Date().getFullYear();
                                            return Array.from({ length: current - startYear + 1 }, (_, i) => current - i).map((yr) => (
                                                <SelectItem key={yr} value={String(yr)}>{yr}</SelectItem>
                                            ));
                                        })()}
                                    </SelectContent>
                                </Select>
                                <FieldError message={formErrors.ano_fabricacao} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="capacidadeToneladas" className="font-bold text-xs uppercase flex items-center gap-2">
                                    <Weight className="h-3.5 w-3.5 text-primary" />
                                    Capacidade (Ton)
                                </Label>
                                <div className="relative group">
                                    <Input
                                        id="capacidadeToneladas"
                                        type="number"
                                        placeholder="40"
                                        min="1"
                                        className={cn("h-11 font-black pr-12", fieldErrorClass(formErrors.capacidade_toneladas))}
                                        value={editedCaminhao.capacidade_toneladas || ""}
                                        onChange={(e) => {
                                            setEditedCaminhao({ ...editedCaminhao, capacidade_toneladas: parseFloat(e.target.value) || 0 });
                                            clearFormError("capacidade_toneladas");
                                        }}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded">
                                        Ton
                                    </div>
                                </div>
                                <FieldError message={formErrors.capacidade_toneladas} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="kmAtual" className="font-bold text-xs uppercase flex items-center gap-2">
                                    <Gauge className="h-3.5 w-3.5 text-primary" />
                                    KM Atual *
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="kmAtual"
                                        type="number"
                                        placeholder="0"
                                        min="0"
                                        className="h-11 font-black pr-12"
                                        value={editedCaminhao.km_atual || ""}
                                        onChange={(e) => setEditedCaminhao({ ...editedCaminhao, km_atual: parseInt(e.target.value) || 0 })}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded">
                                        Km
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="tipoCombustivel" className="font-bold text-xs uppercase flex items-center gap-2">
                                    <Fuel className="h-3.5 w-3.5 text-primary" />
                                    Tipo de Combustível
                                </Label>
                                <Select
                                    value={editedCaminhao.tipo_combustivel || ""}
                                    onValueChange={(value: any) => setEditedCaminhao({ ...editedCaminhao, tipo_combustivel: value })}
                                >
                                    <SelectTrigger className="h-11 font-bold uppercase text-xs">
                                        <SelectValue placeholder="Selecione o combustível" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DIESEL">🚛 Diesel</SelectItem>
                                        <SelectItem value="GASOLINA">⛽ Gasolina</SelectItem>
                                        <SelectItem value="ETANOL">🌱 Etanol</SelectItem>
                                        <SelectItem value="GNV">💨 GNV</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="proprietarioTipo" className="font-bold text-xs uppercase flex items-center gap-2">
                                    <Info className="h-3.5 w-3.5 text-primary" />
                                    Propriedade do Veículo
                                </Label>
                                <Select
                                    value={editedCaminhao.proprietario_tipo || ""}
                                    onValueChange={(value: "PROPRIO" | "TERCEIRO" | "AGREGADO") => {
                                        const isChangingFromProprio = editedCaminhao.proprietario_tipo === "PROPRIO";
                                        const shouldClearAutoOwner =
                                            value !== "PROPRIO" &&
                                            isChangingFromProprio &&
                                            Boolean(transportadoraContelli?.id) &&
                                            String(editedCaminhao.motorista_fixo_id || "") === String(transportadoraContelli?.id || "");

                                        setEditedCaminhao({
                                            ...editedCaminhao,
                                            proprietario_tipo: value,
                                            motorista_fixo_id:
                                                value === "PROPRIO"
                                                    ? (transportadoraContelli?.id || editedCaminhao.motorista_fixo_id)
                                                    : (shouldClearAutoOwner ? undefined : editedCaminhao.motorista_fixo_id),
                                        });
                                        clearFormError("proprietario_tipo");
                                    }}
                                >
                                    <SelectTrigger className={cn(
                                        "h-11 font-bold uppercase text-xs",
                                        autoFilledFields.proprietario_tipo ? "bg-blue-50/50 dark:bg-blue-900/20" : "",
                                        fieldErrorClass(formErrors.proprietario_tipo)
                                    )}>
                                        <SelectValue placeholder="Selecione o tipo de proprietário" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PROPRIO">🏢 Próprio (Caminhão da Empresa)</SelectItem>
                                        <SelectItem value="TERCEIRO">🤝 Terceiro (Transportadora Externa)</SelectItem>
                                        <SelectItem value="AGREGADO">🏠 Agregado (Proprietário Fixo)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FieldError message={formErrors.proprietario_tipo} />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Seção: Gestão Operacional */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-0.5 w-8 bg-blue-500 rounded-full" />
                            <h3 className="font-black uppercase tracking-widest text-xs text-muted-foreground text-blue-500">Gestão Operacional</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="status" className="font-bold text-xs uppercase flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                    Status Operacional *
                                </Label>
                                <Select
                                    value={editedCaminhao.status || "disponivel"}
                                    onValueChange={(value: any) => setEditedCaminhao({ ...editedCaminhao, status: value })}
                                >
                                    <SelectTrigger className="h-11 font-bold uppercase text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="disponivel">🟢 Disponível para Carga</SelectItem>
                                        <SelectItem value="em_viagem">🔵 Em Viagem (Carregado)</SelectItem>
                                        <SelectItem value="em_manutencao">🟡 Em Manutenção Técnica</SelectItem>
                                        <SelectItem value="inativo">⚪ Inativo / Fora de Operação</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="motoristaFixoId" className="font-bold text-xs uppercase flex items-center gap-2 text-blue-600">
                                    <User className="h-3.5 w-3.5" />
                                    Responsável / Titular
                                </Label>
                                <Select
                                    value={editedCaminhao.motorista_fixo_id || "___none___"}
                                    onValueChange={(value) =>
                                        setEditedCaminhao({
                                            ...editedCaminhao,
                                            motorista_fixo_id: value === "___none___" ? undefined : value
                                        })
                                    }
                                >
                                    <SelectTrigger id="motoristaFixoId" className={cn("h-11 font-bold", autoFilledFields.motorista ? "bg-blue-50/50 dark:bg-blue-900/20" : "")}>
                                        <SelectValue placeholder="Selecione o responsável" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="___none___">❌ Sem responsável definido</SelectItem>
                                        {motoristasDisponiveis
                                            .filter(m => m.status === "ativo")
                                            .map((motorista) => (
                                                <SelectItem key={motorista.id} value={motorista.id}>
                                                    <div className="flex flex-col text-left">
                                                        <span className="font-bold uppercase text-xs">{motorista.nome}</span>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {motorista.tipo === "proprio" ? "Próprio" : "Terceirizado"} • {motorista.telefone}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Seção: Documentação e Prazos */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-0.5 w-8 bg-orange-500 rounded-full" />
                            <h3 className="font-black uppercase tracking-widest text-xs text-muted-foreground text-orange-500">Documentação e Prazos</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="renavam" className="font-bold text-xs uppercase flex items-center gap-2">
                                    <FileText className="h-3.5 w-3.5 text-orange-500" />
                                    RENAVAM do Cavalo
                                </Label>
                                <Input
                                    id="renavam"
                                    placeholder="11 dígitos"
                                    className="font-mono h-11"
                                    maxLength={20}
                                    value={editedCaminhao.renavam || ""}
                                    onChange={(e) => setEditedCaminhao({ ...editedCaminhao, renavam: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="chassi" className="font-bold text-xs uppercase flex items-center gap-2">
                                    <FileText className="h-3.5 w-3.5 text-orange-500" />
                                    Número do Chassi
                                </Label>
                                <Input
                                    id="chassi"
                                    placeholder="Ex: 9BW..."
                                    className="font-mono h-11 uppercase"
                                    maxLength={30}
                                    value={editedCaminhao.chassi || ""}
                                    onChange={(e) => setEditedCaminhao({ ...editedCaminhao, chassi: e.target.value.toUpperCase() })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="validadeSeguro" className="font-bold text-xs uppercase flex items-center gap-2">
                                    <Shield className="h-3.5 w-3.5 text-orange-500" />
                                    Validade do Seguro
                                </Label>
                                <Input
                                    id="validadeSeguro"
                                    placeholder="DD/MM/AAAA"
                                    className="h-11 font-bold"
                                    value={editedCaminhao.validade_seguro || ""}
                                    onChange={(e) => setEditedCaminhao({ ...editedCaminhao, validade_seguro: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="validadeLicenciamento" className="font-bold text-xs uppercase flex items-center gap-2">
                                    <FileText className="h-3.5 w-3.5 text-orange-500" />
                                    Próximo Licenciamento
                                </Label>
                                <Input
                                    id="validadeLicenciamento"
                                    placeholder="DD/MM/AAAA"
                                    className="h-11 font-bold"
                                    value={editedCaminhao.validade_licenciamento || ""}
                                    onChange={(e) => setEditedCaminhao({ ...editedCaminhao, validade_licenciamento: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Seção: Manutenção Preventiva */}
                    <div className="space-y-6 pb-6">
                        <div className="flex items-center gap-3">
                            <div className="h-0.5 w-8 bg-red-500 rounded-full" />
                            <h3 className="font-black uppercase tracking-widest text-xs text-muted-foreground text-red-500">Manutenção Preventiva</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="ultimaManutencaoData" className="font-bold text-xs uppercase flex items-center gap-2">
                                    <Wrench className="h-3.5 w-3.5 text-red-500" />
                                    Data da Última Mant. *
                                </Label>
                                <Input
                                    id="ultimaManutencaoData"
                                    placeholder="DD/MM/AAAA"
                                    className="h-11 font-bold"
                                    value={editedCaminhao.ultima_manutencao_data || ""}
                                    onChange={(e) => setEditedCaminhao({ ...editedCaminhao, ultima_manutencao_data: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="proximaManutencaoKm" className="font-bold text-xs uppercase flex items-center gap-2">
                                    <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                                    KM para Alerta de Mant. *
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="proximaManutencaoKm"
                                        type="number"
                                        placeholder="250000"
                                        min="0"
                                        className="h-11 font-black pr-12 text-red-600"
                                        value={editedCaminhao.proxima_manutencao_km || ""}
                                        onChange={(e) => setEditedCaminhao({ ...editedCaminhao, proxima_manutencao_km: parseInt(e.target.value) || 0 })}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-red-600 uppercase bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">
                                        Km
                                    </div>
                                </div>
                            </div>
                        </div>

                        {editedCaminhao.km_atual !== undefined && editedCaminhao.proxima_manutencao_km !== undefined && editedCaminhao.proxima_manutencao_km > 0 && (
                            <div className="p-4 bg-muted/40 rounded-xl border border-dashed">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Progresso até Manutenção</span>
                                    <span className="text-sm font-black text-foreground">
                                        {((editedCaminhao.km_atual / editedCaminhao.proxima_manutencao_km) * 100).toFixed(0)}%
                                    </span>
                                </div>
                                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full transition-all duration-700",
                                            (editedCaminhao.km_atual / editedCaminhao.proxima_manutencao_km) * 100 >= 90
                                                ? "bg-red-500"
                                                : (editedCaminhao.km_atual / editedCaminhao.proxima_manutencao_km) * 100 >= 70
                                                    ? "bg-orange-500"
                                                    : "bg-green-500"
                                        )}
                                        style={{ width: `${Math.min((editedCaminhao.km_atual / editedCaminhao.proxima_manutencao_km) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-muted/20">
                    <ModalSubmitFooter
                        onCancel={() => {
                            setIsModalOpen(false);
                            resetFormErrors();
                        }}
                        onSubmit={handleSave}
                        isSubmitting={isSaving}
                        submitLabel={isEditing ? "Salvar Alterações" : "Cadastrar Veículo"}
                    />
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
