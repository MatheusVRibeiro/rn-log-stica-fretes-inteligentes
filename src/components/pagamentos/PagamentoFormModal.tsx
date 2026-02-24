import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { AlertCircle, Calendar, DollarSign, Paperclip, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ModalSubmitFooter } from "@/components/shared/ModalSubmitFooter";
import { fieldErrorClass, parseBRDateToLocalDate } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import { FieldError } from "@/components/shared/FieldError";
import type { Motorista } from "@/types"; // We will replace these later if they don't exist

export interface PagamentoFormModalProps {
    isModalOpen: boolean;
    setIsModalOpen: (open: boolean) => void;
    isEditing: boolean;
    isSaving: boolean;
    isShaking: boolean;
    editedPagamento: any;
    setEditedPagamento: (pag: any) => void;
    formErrors: any;
    clearFormError: (field: string) => void;
    resetFormErrors: () => void;
    motoristasComPendentes: any[];
    fretesDisponiveis: any[];
    selectedFretes: string[];
    handleToggleFrete: (freteId: string) => void;
    motoristaSelecionado: any | undefined;
    isInternalCostFlow: boolean;
    isInternalCostConfirmed: boolean;
    setIsInternalCostConfirmed: (val: boolean) => void;
    metodoPagamentoAtual: string;
    fretesNaoPagos: any[];
    getCustosByFreteRef: (freteId: string) => any[];
    getTotalCustosByFreteRef: (freteId: string) => number;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    selectedFile: File | null;
    selectedFileIsImage: boolean;
    selectedFileIsPdf: boolean;
    selectedFilePreview: string | null;
    autoEmitirGuia: boolean;
    setAutoEmitirGuia: (val: boolean) => void;
    handleSave: () => void;
    handleMotoristaChange: (motoristaId: string) => void;
}

export function PagamentoFormModal({
    isModalOpen,
    setIsModalOpen,
    isEditing,
    isSaving,
    isShaking,
    editedPagamento,
    setEditedPagamento,
    formErrors,
    clearFormError,
    resetFormErrors,
    motoristasComPendentes,
    fretesDisponiveis,
    selectedFretes,
    handleToggleFrete,
    motoristaSelecionado,
    isInternalCostFlow,
    isInternalCostConfirmed,
    setIsInternalCostConfirmed,
    metodoPagamentoAtual,
    fretesNaoPagos,
    getCustosByFreteRef,
    getTotalCustosByFreteRef,
    handleFileChange,
    selectedFile,
    selectedFileIsImage,
    selectedFileIsPdf,
    selectedFilePreview,
    autoEmitirGuia,
    setAutoEmitirGuia,
    handleSave,
    handleMotoristaChange,
}: PagamentoFormModalProps) {
    return (
        <Dialog
            open={isModalOpen}
            onOpenChange={(open) => {
                if (isSaving) return;
                setIsModalOpen(open);
                resetFormErrors();
            }}
        >
            <DialogContent className={cn("max-w-2xl", isShaking && "animate-shake")}>
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Editar Pagamento" : "Registrar Novo Pagamento"}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        {isEditing ? "Editar dados do pagamento." : "Registrar um novo pagamento."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 max-h-[calc(90vh-200px)] overflow-y-auto px-1">
                    {/* Motorista Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="motorista">Proprietário / Favorecido *</Label>
                        <Select
                            value={editedPagamento.motoristaId || ""}
                            onValueChange={handleMotoristaChange}
                            onOpenChange={(open) => {
                                if (open) clearFormError("motoristaId");
                            }}
                            disabled={isEditing}
                        >
                            <SelectTrigger className={cn(fieldErrorClass(formErrors.motoristaId))}>
                                <SelectValue placeholder="Selecione um proprietário/favorecido" />
                            </SelectTrigger>
                            <SelectContent className="max-h-64 overflow-y-auto">
                                {isEditing ? (
                                    <SelectItem value={editedPagamento.motoristaId || ""}>
                                        {editedPagamento.motoristaNome || "Favorecido"}
                                    </SelectItem>
                                ) : motoristasComPendentes.length === 0 ? (
                                    <SelectItem value="none" disabled>Nenhum favorecido com pagamentos pendentes</SelectItem>
                                ) : (
                                    motoristasComPendentes.map((motorista) => (
                                        <SelectItem key={motorista.id} value={motorista.id}>
                                            {motorista.nome}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        <FieldError message={formErrors.motoristaId} />
                    </div>

                    {/* Seleção de Fretes */}
                    {editedPagamento.motoristaId && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Selecione os fretes para pagamento *</Label>
                                {fretesDisponiveis.length > 0 && (
                                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                                        {fretesDisponiveis.length} frete{fretesDisponiveis.length > 1 ? "s" : ""} {isEditing ? "vinculado" : "aguardando"}
                                    </Badge>
                                )}
                            </div>
                            <FieldError message={formErrors.fretes} />
                            {fretesDisponiveis.length === 0 ? (
                                <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900 flex items-center gap-3">
                                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
                                    <p className="text-sm text-amber-700 dark:text-amber-300">
                                        {isEditing
                                            ? "Este pagamento não possui fretes vinculados."
                                            : "Este favorecido não possui fretes pendentes de pagamento"}
                                    </p>
                                </Card>
                            ) : (
                                <div className="space-y-2">
                                    {fretesDisponiveis.map((frete) => (
                                        <Card
                                            key={frete.id}
                                            className={cn(
                                                "p-4 transition-all border-2",
                                                selectedFretes.includes(frete.id)
                                                    ? "border-green-400 bg-green-50 dark:bg-green-950/20 shadow-sm"
                                                    : "border-border hover:border-green-300 dark:hover:border-green-700 hover:shadow-sm"
                                            )}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => handleToggleFrete(frete.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    handleToggleFrete(frete.id);
                                                }
                                            }}
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <Checkbox
                                                        id={`frete-${frete.id}`}
                                                        checked={selectedFretes.includes(frete.id)}
                                                        onCheckedChange={() => handleToggleFrete(frete.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="h-5 w-5"
                                                        disabled={isEditing}
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                                                {frete.codigoFrete || frete.id}
                                                            </p>
                                                            <span className="text-slate-400 dark:text-slate-500">•</span>
                                                            <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                                                                {frete.rota}
                                                            </p>
                                                            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs ml-auto border-blue-200 dark:border-blue-800">
                                                                Aguardando
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                            📅 {frete.dataFrete} • 📦 {Number(frete.toneladas).toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} toneladas
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2 min-w-max">
                                                    <div className={cn(
                                                        "text-base font-bold px-3 py-1 rounded-lg",
                                                        selectedFretes.includes(frete.id)
                                                            ? "bg-green-500 text-white dark:bg-green-600"
                                                            : "text-green-600 dark:text-green-500"
                                                    )}>
                                                        R$ {frete.valorGerado.toLocaleString("pt-BR")}
                                                    </div>
                                                    <p className={cn(
                                                        "text-xs font-semibold px-2 py-1 rounded",
                                                        selectedFretes.includes(frete.id)
                                                            ? "bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200"
                                                            : "text-slate-400 dark:text-slate-500"
                                                    )}>
                                                        {selectedFretes.includes(frete.id) ? "✓ Selecionado" : "○ Não selecionado"}
                                                    </p>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Fretes Info */}
                    {editedPagamento.toneladas ? (
                        <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Toneladas</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {Number(editedPagamento.toneladas).toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}t
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Fretes</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {editedPagamento.fretes}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        editedPagamento.motoristaId && fretesNaoPagos.length === 0 && (
                            <Card className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900 flex items-center gap-3">
                                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                                <p className="text-sm text-muted-foreground">
                                    Este favorecido não possui fretes pendentes de pagamento
                                </p>
                            </Card>
                        )
                    )}

                    <Separator />

                    {/* Resumo de Valores com Descontos */}
                    {selectedFretes.length > 0 && (
                        <div className="space-y-4">
                            {/* Detalhamento por Frete */}
                            <div className="space-y-3 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-800/40 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Detalhamento de Custos por Frete</p>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {fretesDisponiveis
                                        .filter((f) => selectedFretes.includes(f.id))
                                        .map((frete) => {
                                            const custosFrete = getCustosByFreteRef(frete.id);
                                            const totalCustos = custosFrete.reduce((sum: number, c: any) => sum + c.valor, 0);
                                            const valorLiquido = frete.valorGerado - totalCustos;
                                            return (
                                                <Card key={frete.id} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{frete.codigoFrete || frete.id}</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">{frete.rota}</p>
                                                            <div className="text-right">
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Bruto</p>
                                                                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                                                    R$ {frete.valorGerado.toLocaleString("pt-BR")}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {custosFrete.length > 0 && (
                                                            <div className="border-t border-slate-200 dark:border-slate-700 pt-2 pl-2 space-y-1">
                                                                {custosFrete.map((custo: any, idx: number) => (
                                                                    <div key={idx} className="flex items-center justify-between text-xs">
                                                                        <span className="text-slate-600 dark:text-slate-400">📌 {custo.descricao}</span>
                                                                        <span className="font-semibold text-red-600 dark:text-red-400">
                                                                            -R$ {custo.valor.toLocaleString("pt-BR")}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {totalCustos > 0 && (
                                                            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-2 bg-emerald-50 dark:bg-emerald-950/30 -mx-3 px-3 py-2 rounded">
                                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Líquido do Frete</span>
                                                                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">R$ {valorLiquido.toLocaleString("pt-BR")}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </Card>
                                            );
                                        })}
                                </div>
                            </div>

                            <Separator />

                            {/* Resumo Final de Valores */}
                            <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">Resumo Financeiro</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-slate-600 dark:text-slate-400">Valor Bruto</Label>
                                        <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900 shadow-sm">
                                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                                                R$ {(isEditing ? fretesDisponiveis : fretesNaoPagos)
                                                    .filter((f) => selectedFretes.includes(f.id))
                                                    .reduce((acc, f) => acc + f.valorGerado, 0)
                                                    .toLocaleString("pt-BR")}
                                            </p>
                                            <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">Receita dos fretes</p>
                                        </Card>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-slate-600 dark:text-slate-400">Total de Descontos</Label>
                                        <Card className="p-4 bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900 shadow-sm">
                                            <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                                                {(() => {
                                                    const totalDescontos = selectedFretes
                                                        .reduce((acc, freteId) => {
                                                            return acc + getTotalCustosByFreteRef(freteId);
                                                        }, 0);
                                                    return totalDescontos > 0
                                                        ? `-R$ ${totalDescontos.toLocaleString("pt-BR")}`
                                                        : "R$ 0";
                                                })()}
                                            </p>
                                            <p className="text-xs text-red-600 dark:text-red-500 mt-1">Combustível, pedágio, etc</p>
                                        </Card>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-slate-600 dark:text-slate-400">Valor a Pagar</Label>
                                        <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900 shadow-sm">
                                            <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                                                R$ {(editedPagamento.valorTotal || 0).toLocaleString("pt-BR")}
                                            </p>
                                            <p className="text-xs text-green-600 dark:text-green-500 mt-1">Líquido ao favorecido</p>
                                        </Card>
                                    </div>
                                </div>
                            </div>

                            <Card className="p-5 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-emerald-700 dark:text-emerald-400 font-semibold mb-1">Valor Unitário por Tonelada</p>
                                        <p className="text-3xl font-bold text-emerald-800 dark:text-emerald-300">
                                            R$ {(editedPagamento.valorUnitarioPorTonelada || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-2">
                                            📊 {editedPagamento.toneladas.toFixed(3)}t • Já com descontos incluídos
                                        </p>
                                    </div>
                                    <DollarSign className="h-12 w-12 text-slate-400 opacity-50" />
                                </div>
                            </Card>
                        </div>
                    )}

                    <Separator />

                    {/* Data do Pagamento e Status */}
                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-800/40 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-4">Informações do Pagamento</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">📅 Data do Pagamento *</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal gap-2 px-3 h-11 border-2 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                                        >
                                            <Calendar className="h-4 w-4 text-blue-600" />
                                            {editedPagamento.dataPagamento
                                                ? format(
                                                    parseBRDateToLocalDate(editedPagamento.dataPagamento) || new Date(),
                                                    "dd/MM/yyyy",
                                                    { locale: ptBR }
                                                )
                                                : "Selecione a data"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 align-start" align="start">
                                        <CalendarComponent
                                            mode="single"
                                            selected={
                                                parseBRDateToLocalDate(editedPagamento.dataPagamento)
                                            }
                                            onSelect={(date) => {
                                                if (date) {
                                                    const formattedDate = format(date, "dd/MM/yyyy", { locale: ptBR });
                                                    setEditedPagamento({
                                                        ...editedPagamento,
                                                        dataPagamento: formattedDate,
                                                    });
                                                }
                                            }}
                                            disabled={(date) =>
                                                date > new Date() || date < new Date(2025, 0, 1)
                                            }
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="statusPagamento" className="text-sm font-semibold">📌 Status *</Label>
                                <Select
                                    value={isInternalCostFlow ? "pago" : (editedPagamento.statusPagamento || "pendente")}
                                    onValueChange={(value: "pendente" | "processando" | "pago" | "cancelado") =>
                                        !isInternalCostFlow &&
                                        setEditedPagamento({
                                            ...editedPagamento,
                                            statusPagamento: value,
                                        })
                                    }
                                    disabled={isInternalCostFlow}
                                >
                                    <SelectTrigger className="border-2 hover:border-blue-400 transition-colors h-11">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pendente">⏳ Pendente</SelectItem>
                                        <SelectItem value="processando">⚙️ Processando</SelectItem>
                                        <SelectItem value="pago">✓ Pago</SelectItem>
                                        <SelectItem value="cancelado">✗ Cancelado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Método de Pagamento (somente leitura) */}
                    <div className="space-y-3">
                        <Label htmlFor="metodoPagamento" className="text-sm font-semibold">💳 Método de Pagamento</Label>
                        <Select value={metodoPagamentoAtual} disabled>
                            <SelectTrigger id="metodoPagamento" className="border-2">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pix">PIX</SelectItem>
                                <SelectItem value="transferencia_bancaria">Transferência Bancária</SelectItem>
                            </SelectContent>
                        </Select>

                        <Card
                            className={cn(
                                "p-4 border",
                                metodoPagamentoAtual === "pix"
                                    ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900"
                                    : "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900"
                            )}
                        >
                            {isInternalCostFlow ? (
                                <p className="text-sm text-muted-foreground">
                                    Método definido pelo cadastro do favorecido (fluxo de custo interno).
                                </p>
                            ) : metodoPagamentoAtual === "pix" ? (
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <p className="text-muted-foreground">Dados PIX do favorecido (cadastro)</p>
                                        <Badge variant="outline">PIX</Badge>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Tipo de chave</p>
                                            <p className="font-semibold">
                                                {String(motoristaSelecionado?.chavePixTipo || "Não informado").toUpperCase()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Chave PIX</p>
                                            <p className="font-mono font-semibold break-all">
                                                {motoristaSelecionado?.chavePix || "Não informada"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <p className="text-muted-foreground">Dados bancários do favorecido (cadastro)</p>
                                        <Badge variant="outline">Transferência</Badge>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Banco</p>
                                            <p className="font-semibold">{motoristaSelecionado?.banco || "Não informado"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Agência</p>
                                            <p className="font-mono font-semibold">{motoristaSelecionado?.agencia || "Não informada"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Conta</p>
                                            <p className="font-mono font-semibold">{motoristaSelecionado?.conta || "Não informada"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Tipo de conta</p>
                                            <p className="font-semibold">
                                                {motoristaSelecionado?.tipoConta === "corrente"
                                                    ? "Corrente"
                                                    : motoristaSelecionado?.tipoConta === "poupanca"
                                                        ? "Poupança"
                                                        : "Não informado"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>

                    <Separator />

                    {/* Comprovante Upload */}
                    {isInternalCostFlow ? (
                        <div className="space-y-3">
                            <Label>Fechamento interno</Label>
                            <Card className="p-4 border-primary/30 bg-primary/5">
                                <Button
                                    type="button"
                                    className={cn("w-full h-12 text-base font-semibold", isInternalCostConfirmed && "bg-green-600 hover:bg-green-700")}
                                    onClick={() => setIsInternalCostConfirmed(true)}
                                >
                                    {isInternalCostConfirmed
                                        ? "Fechamento de custo interno confirmado"
                                        : "Confirmar Fechamento de Custo Interno"}
                                </Button>
                                <p className="text-xs text-muted-foreground mt-3">
                                    Este fluxo dispensa comprovante PIX e registra automaticamente a despesa interna.
                                </p>
                            </Card>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <Label>Comprovante de Pagamento</Label>
                            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 hover:border-muted-foreground/50 transition-colors">
                                <input
                                    type="file"
                                    id="comprovante"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                                />
                                <label
                                    htmlFor="comprovante"
                                    className="cursor-pointer flex flex-col items-center gap-2"
                                >
                                    <Paperclip className="h-6 w-6 text-muted-foreground/60" />
                                    <div className="text-center">
                                        <p className="text-sm font-medium">
                                            {selectedFile ? selectedFile.name : "Clique para selecionar ou arraste"}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            PDF ou imagem (JPG, PNG, WEBP) - máx. 5MB
                                        </p>
                                    </div>
                                </label>
                            </div>
                            {selectedFile && (
                                <div className="rounded-lg border border-muted p-3 bg-muted/30">
                                    {selectedFileIsImage && selectedFilePreview ? (
                                        <img
                                            src={selectedFilePreview}
                                            alt="Preview do comprovante"
                                            className="max-h-48 w-full rounded-md object-contain"
                                        />
                                    ) : selectedFileIsPdf && selectedFilePreview ? (
                                        <iframe
                                            src={selectedFilePreview}
                                            title="Preview do comprovante"
                                            className="h-64 w-full rounded-md border"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <FileText className="h-4 w-4" />
                                            <span>Preview não disponível para este arquivo.</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Observações */}
                    <div className="space-y-2">
                        <Label htmlFor="observacoes">Observações</Label>
                        <textarea
                            id="observacoes"
                            className="w-full min-h-24 px-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Digite qualquer observação sobre este pagamento..."
                            value={editedPagamento.observacoes || ""}
                            onChange={(e) =>
                                setEditedPagamento({
                                    ...editedPagamento,
                                    observacoes: e.target.value,
                                })
                            }
                        />
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-3 items-center justify-between mt-4">
                    <div className="flex items-center space-x-2 mr-auto pl-1">
                        <Checkbox
                            id="autoEmitirGuia"
                            checked={autoEmitirGuia}
                            onCheckedChange={(checked) => setAutoEmitirGuia(checked === true)}
                        />
                        <label
                            htmlFor="autoEmitirGuia"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-muted-foreground select-none"
                        >
                            Emitir Guia em PDF após salvar
                        </label>
                    </div>
                    <ModalSubmitFooter
                        onCancel={() => {
                            setIsModalOpen(false);
                            resetFormErrors();
                        }}
                        onSubmit={handleSave}
                        isSubmitting={isSaving}
                        disableSubmit={isSaving}
                        submitLabel={isEditing ? "Salvar Alterações" : "Registrar Pagamento"}
                    />
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
