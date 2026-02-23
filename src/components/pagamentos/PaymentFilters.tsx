import { useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, FileDown } from "lucide-react";
import { PeriodoFilter } from "@/components/shared/PeriodoFilter";
import { FilterBar } from "@/components/shared/FilterBar";
import { Motorista } from "@/types";

import { TipoVisualizacao } from "@/hooks/usePeriodoFilter";

interface PaymentFiltersProps {
    filtersOpen: boolean;
    setFiltersOpen: (val: boolean) => void;
    search: string;
    setSearch: (val: string) => void;
    tipoVisualizacao: TipoVisualizacao;
    setTipoVisualizacao: (val: TipoVisualizacao) => void;
    selectedPeriodo: string;
    setSelectedPeriodo: (val: string) => void;
    periodosDisponiveis: string[];
    formatPeriodoLabel: (periodo: string) => string;
    motoristaFilter: string;
    setMotoristaFilter: (val: string) => void;
    statusFilter: string;
    setStatusFilter: (val: string) => void;
    motoristas: { id: string; nome: string }[];
    handleExportarGeralPDF: () => void;
    clearFilters: () => void;
    shortName: (nome: string) => string;
}

export function PaymentFilters({
    filtersOpen,
    setFiltersOpen,
    search,
    setSearch,
    tipoVisualizacao,
    setTipoVisualizacao,
    selectedPeriodo,
    setSelectedPeriodo,
    periodosDisponiveis,
    formatPeriodoLabel,
    motoristaFilter,
    setMotoristaFilter,
    statusFilter,
    setStatusFilter,
    motoristas,
    handleExportarGeralPDF,
    clearFilters,
    shortName,
}: PaymentFiltersProps) {
    return (
        <>
            {/* Mobile Filters */}
            <div className="lg:hidden mb-4">
                <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" className="w-full gap-2">
                            <Filter className="h-4 w-4" />
                            Filtros
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[85vh]">
                        <SheetHeader>
                            <SheetTitle>Filtros e Ações</SheetTitle>
                        </SheetHeader>
                        <div className="mt-6 space-y-4 overflow-y-auto max-h-[calc(85vh-120px)]">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Período</Label>
                                <PeriodoFilter
                                    tipoVisualizacao={tipoVisualizacao}
                                    selectedPeriodo={selectedPeriodo}
                                    periodosDisponiveis={periodosDisponiveis}
                                    formatPeriodoLabel={formatPeriodoLabel}
                                    onTipoChange={setTipoVisualizacao}
                                    onPeriodoChange={setSelectedPeriodo}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Buscar</Label>
                                <Input
                                    placeholder="Buscar por favorecido ou ID de pagamento..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Proprietário / Favorecido</Label>
                                <Select value={motoristaFilter} onValueChange={setMotoristaFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Proprietário / Favorecido" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-64 overflow-y-auto">
                                        <SelectItem value="all">Todos</SelectItem>
                                        {motoristas.map((motorista) => (
                                            <SelectItem key={motorista.id} value={motorista.id}>
                                                {shortName(motorista.nome)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Status do Pagamento</Label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="pendente">Pendente</SelectItem>
                                        <SelectItem value="processando">Processando</SelectItem>
                                        <SelectItem value="pago">Pago</SelectItem>
                                        <SelectItem value="cancelado">Cancelado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 border-t pt-4">
                                <Label className="text-sm font-medium">Ações</Label>
                                <div className="space-y-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            handleExportarGeralPDF();
                                            setFiltersOpen(false);
                                        }}
                                        className="w-full gap-2"
                                    >
                                        <FileDown className="h-4 w-4" />
                                        Exportar PDF
                                    </Button>
                                </div>
                            </div>

                            <div className="pt-2 flex gap-2">
                                <Button variant="outline" onClick={clearFilters} className="flex-1">
                                    Limpar
                                </Button>
                                <Button onClick={() => setFiltersOpen(false)} className="flex-1">
                                    Aplicar
                                </Button>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Desktop Filters */}
            <FilterBar
                className="hidden lg:flex"
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Buscar por favorecido ou ID de pagamento..."
            >
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground block">Proprietário / Favorecido</Label>
                    <Select value={motoristaFilter} onValueChange={setMotoristaFilter}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Proprietário / Favorecido" />
                        </SelectTrigger>
                        <SelectContent className="max-h-64 overflow-y-auto">
                            <SelectItem value="all">Todos</SelectItem>
                            {motoristas.map((motorista) => (
                                <SelectItem key={motorista.id} value={motorista.id}>
                                    {motorista.nome}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground block">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="processando">Processando</SelectItem>
                            <SelectItem value="pago">Pago</SelectItem>
                            <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </FilterBar>
        </>
    );
}
