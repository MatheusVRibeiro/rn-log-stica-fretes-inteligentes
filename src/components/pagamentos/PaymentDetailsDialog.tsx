import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { FileDown, Edit, Calendar, DollarSign, Paperclip, Eye, Trash2 } from "lucide-react";
import { PagamentoMotorista, Frete, Custo } from "@/types";
import { toast } from "sonner";

interface FreteResumo {
    id: string;
    codigoFrete: string;
    codigoFreteRaw?: string;
    motoristaId: string;
    motoristaNome: string;
    proprietarioTipo: "proprio" | "terceirizado" | "agregado";
    dataFrete: string;
    rota: string;
    toneladas: number;
    valorGerado: number;
    pagamentoId?: string | null;
}

interface CustoResumo {
    freteId: string;
    valor: number;
    descricao: string;
}

interface PaymentDetailsDialogProps {
    selectedPagamento: PagamentoMotorista | null;
    setSelectedPagamento: (val: PagamentoMotorista | null) => void;
    statusConfig: Record<string, { label: string; variant: any }>;
    fretesDoPagamento: FreteResumo[];
    getCustosByFreteRef: (freteId: string) => CustoResumo[];
    getTotalCustosByFreteRef: (freteId: string) => number;
    handleExportarPDF: (params: any) => void;
    handleOpenEditModal: (pagamento: PagamentoMotorista) => void;
    getComprovanteUrl: (url: string | undefined) => string | null;
    parseFileType: (fileName: string) => { isImage: boolean; isPdf: boolean };
    setComprovanteDialog: (val: any) => void;
    handleDeletePagamento: (pagamento: PagamentoMotorista) => void;
}

export function PaymentDetailsDialog({
    selectedPagamento,
    setSelectedPagamento,
    statusConfig,
    fretesDoPagamento,
    getCustosByFreteRef,
    getTotalCustosByFreteRef,
    handleExportarPDF,
    handleOpenEditModal,
    getComprovanteUrl,
    parseFileType,
    setComprovanteDialog,
    handleDeletePagamento,
}: PaymentDetailsDialogProps) {
    if (!selectedPagamento) return null;

    return (
        <Dialog open={!!selectedPagamento} onOpenChange={(open) => {
            if (!open) setSelectedPagamento(null);
        }}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Detalhes do Pagamento</DialogTitle>
                    <DialogDescription className="sr-only">
                        Detalhes do pagamento e ações disponíveis.
                    </DialogDescription>
                </DialogHeader>

                {/* Barra de ações — separada do X de fechar */}
                <div className="flex items-center justify-center gap-2 pb-2 border-b">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            handleExportarPDF({
                                pagamentoId: selectedPagamento.id,
                                motoristaId: selectedPagamento.motoristaId,
                                motoristaNome: selectedPagamento.motoristaNome,
                                metodoPagamento: selectedPagamento.metodoPagamento,
                                dataPagamento: selectedPagamento.dataPagamento,
                                freteIds: selectedPagamento.fretesSelecionados || [],
                                totalToneladas: Number(selectedPagamento.toneladas || 0),
                                valorTonelada: Number(selectedPagamento.valorUnitarioPorTonelada || 0),
                                valorTotal: Number(selectedPagamento.valorTotal || 0),
                                tipoRelatorio: selectedPagamento.tipoRelatorio,
                            });
                        }}
                        className="gap-2"
                    >
                        <FileDown className="h-4 w-4" />
                        Reimprimir PDF
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            handleOpenEditModal(selectedPagamento);
                            setSelectedPagamento(null);
                        }}
                        className="gap-2"
                    >
                        <Edit className="h-4 w-4" />
                        Editar
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeletePagamento(selectedPagamento)}
                        className="gap-2"
                    >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                    </Button>
                </div>

                <div className="max-h-[calc(90vh-200px)] overflow-y-auto px-1">
                    <div className="space-y-6">
                        {/* Header */}
                        <Card className="p-4 bg-gradient-to-br from-primary/5 to-transparent">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">ID Pagamento</p>
                                    <p className="text-base font-semibold font-mono text-primary">
                                        {selectedPagamento.id}
                                    </p>
                                </div>
                                <Badge variant={statusConfig[selectedPagamento.statusPagamento]?.variant || "default"} className="text-xs px-2 py-1">
                                    {statusConfig[selectedPagamento.statusPagamento]?.label || selectedPagamento.statusPagamento}
                                </Badge>
                            </div>
                        </Card>

                        {/* Motorista Info */}
                        <div>
                            <h3 className="font-semibold mb-3">Informações do Favorecido</h3>
                            <Card className="p-4 flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                                        {selectedPagamento.motoristaNome
                                            ? selectedPagamento.motoristaNome.split(" ").map((n) => n[0]).join("")
                                            : "F"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="text-lg font-bold">{selectedPagamento.motoristaNome}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Calendar className="h-4 w-4 text-primary" />
                                        <p className="text-sm font-medium">
                                            {selectedPagamento.dataFrete}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <Separator />

                        {/* Fretes Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                                <p className="text-sm text-muted-foreground mb-1">Toneladas</p>
                                <p className="text-3xl font-bold text-blue-600">
                                    {Number(selectedPagamento.toneladas).toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}t
                                </p>
                            </Card>
                            <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900">
                                <p className="text-sm text-muted-foreground mb-1">Fretes</p>
                                <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                                    {selectedPagamento.fretes}
                                </p>
                            </Card>
                            <Card className="p-4 bg-profit/5 border-profit/20">
                                <p className="text-sm text-muted-foreground mb-1">Valor/Tonelada</p>
                                <p className="text-3xl font-bold text-profit">
                                    R$ {selectedPagamento.valorUnitarioPorTonelada}
                                </p>
                            </Card>
                        </div>

                        {/* Fretes com Descontos */}
                        {fretesDoPagamento.length > 0 && (
                            <div>
                                <h3 className="font-semibold mb-3">Fretes com Detalhamento de Custos</h3>
                                <div className="space-y-3">
                                    {fretesDoPagamento.map((frete) => {
                                        const custosFrete = getCustosByFreteRef(frete.id);
                                        const totalCustos = custosFrete.reduce((sum, c) => sum + c.valor, 0);
                                        const valorLiquido = frete.valorGerado - totalCustos;
                                        return (
                                            <Card key={frete.id} className="p-4 bg-muted/30">
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm font-semibold text-foreground">
                                                                {frete.codigoFrete || frete.id} • {frete.rota}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {frete.dataFrete} • {Number(frete.toneladas).toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}t
                                                            </p>
                                                        </div>
                                                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                                            Bruto
                                                        </Badge>
                                                    </div>

                                                    <div className="bg-background p-3 rounded border border-blue-200 dark:border-blue-900">
                                                        <p className="text-sm font-semibold text-blue-600">
                                                            R$ {frete.valorGerado.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </p>
                                                    </div>

                                                    {custosFrete.length > 0 && (
                                                        <>
                                                            <div className="border-t pt-3 space-y-2">
                                                                <p className="text-xs font-semibold text-muted-foreground mb-2">Descontos (Custos Adicionais):</p>
                                                                {custosFrete.map((custo, idx) => (
                                                                    <div key={idx} className="flex items-center justify-between text-sm bg-loss/5 p-2 rounded">
                                                                        <span className="text-muted-foreground">• {custo.descricao}</span>
                                                                        <span className="font-semibold text-loss">
                                                                            -R$ {custo.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                                <div className="flex items-center justify-between text-xs font-semibold pt-2 border-t border-loss/20">
                                                                    <span className="text-loss">Total de Descontos:</span>
                                                                    <span className="text-loss">-R$ {totalCustos.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                                </div>
                                                            </div>

                                                            <div className="bg-profit/5 border border-profit/20 p-3 rounded">
                                                                <p className="text-xs text-muted-foreground mb-1">Valor Líquido (após descontos)</p>
                                                                <p className="text-lg font-bold text-profit">
                                                                    R$ {valorLiquido.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </p>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <Separator />

                        {/* Resumo de Valores com Descontos */}
                        <div>
                            <h3 className="font-semibold mb-3">Resumo Financeiro</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                                <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                                    <p className="text-xs text-muted-foreground mb-1">Valor Bruto (Fretes)</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        R$ {fretesDoPagamento.reduce((acc, f) => acc + f.valorGerado, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </Card>
                                <Card className="p-4 bg-loss/10 border-loss/20">
                                    <p className="text-xs text-muted-foreground mb-1">Total de Descontos</p>
                                    <p className="text-2xl font-bold text-loss">
                                        -R$ {fretesDoPagamento
                                            .reduce((acc, frete) => {
                                                return (
                                                    acc +
                                                    getTotalCustosByFreteRef(frete.id)
                                                );
                                            }, 0)
                                            .toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </Card>
                                <Card className="p-4 bg-profit/5 border-profit/20">
                                    <p className="text-xs text-muted-foreground mb-1">Valor Líquido a Pagar</p>
                                    <p className="text-2xl font-bold text-profit">
                                        R$ {(selectedPagamento.valorTotal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </Card>
                            </div>
                        </div>

                        {/* Value */}
                        <Card className="p-6 bg-gradient-to-br from-profit/10 to-transparent border-profit/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Valor Total a Pagar</p>
                                    <p className="text-4xl font-bold text-profit">
                                        R$ {selectedPagamento.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <DollarSign className="h-16 w-16 text-profit/20" />
                            </div>
                        </Card>

                        {/* Payment Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="p-4">
                                <p className="text-sm text-muted-foreground mb-2">Data do Pagamento</p>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <p className="font-semibold">{selectedPagamento.dataPagamento}</p>
                                </div>
                            </Card>
                            <Card className="p-4">
                                <p className="text-sm text-muted-foreground mb-2">Método de Pagamento</p>
                                <p className="font-semibold">
                                    {selectedPagamento.metodoPagamento === "pix"
                                        ? "PIX"
                                        : "Transferência Bancária"}
                                </p>
                            </Card>
                        </div>

                        {/* Comprovante */}
                        {selectedPagamento.comprovante && (
                            <Card className="p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Paperclip className="h-5 w-5 text-green-600" />
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-0.5">
                                                Comprovante de Pagamento
                                            </p>
                                            <p className="font-semibold text-green-600">
                                                {selectedPagamento.comprovante.nome}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Enviado em {selectedPagamento.comprovante.datadoUpload}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                        onClick={() => {
                                            const url = getComprovanteUrl(selectedPagamento.comprovante?.url);
                                            if (!url) {
                                                toast.error("Comprovante sem URL");
                                                return;
                                            }
                                            setComprovanteDialog({
                                                url,
                                                nome: selectedPagamento.comprovante?.nome || "Comprovante",
                                                ...parseFileType(`${url} ${selectedPagamento.comprovante?.nome || ""}`),
                                            });
                                        }}
                                    >
                                        <Eye className="h-4 w-4" />
                                        Visualizar
                                    </Button>
                                </div>
                            </Card>
                        )}

                        {/* Observações */}
                        {selectedPagamento.observacoes && (
                            <Card className="p-4 bg-muted/50">
                                <p className="text-sm text-muted-foreground mb-2">Observações</p>
                                <p className="text-foreground">{selectedPagamento.observacoes}</p>
                            </Card>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
