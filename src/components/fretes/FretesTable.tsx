import { Dispatch, SetStateAction } from "react";
import { DataTable } from "@/components/shared/DataTable";
import { formatFreteCodigo, toNumber } from "@/utils/formatters";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";

interface Frete {
    id: string;
    codigoFrete?: string;
    origem: string;
    destino: string;
    motorista: string;
    motoristaId: string;
    caminhao: string;
    caminhaoId: string;
    mercadoria: string;
    mercadoriaId: string;
    fazendaId?: string;
    fazendaNome?: string;
    variedade?: string;
    dataFrete: string;
    quantidadeSacas: number;
    toneladas: number;
    valorPorTonelada: number;
    receita: number;
    custos: number;
    resultado: number;
    ticket?: string;
    numeroNotaFiscal?: string;
}

interface FretesTableProps {
    columns: any[]; // The generic columns from the parent
    paginatedData: Frete[];
    filteredData: Frete[];
    setSelectedFrete: (frete: Frete) => void;
    currentPage: number;
    setCurrentPage: Dispatch<SetStateAction<number>>;
    totalPages: number;
}

export function FretesTable({
    columns,
    paginatedData,
    filteredData,
    setSelectedFrete,
    currentPage,
    setCurrentPage,
    totalPages,
}: FretesTableProps) {
    return (
        <>
            <DataTable<Frete>
                columns={columns}
                data={paginatedData}
                onRowClick={(item) => setSelectedFrete(item)}
                highlightNegative={(item) => toNumber(item.resultado) < 0}
                emptyMessage="Nenhum frete encontrado com os filtros aplicados"
                mobileCardTitle={(item) => (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-primary">{formatFreteCodigo(item)}</span>
                        <span className="text-xs text-muted-foreground">{item.dataFrete}</span>
                    </div>
                )}
            />

            {/* Pagination */}
            {totalPages > 1 && (
                <>
                    {/* Mobile Pagination: Simple Prev/Next */}
                    <div className="mt-6 md:hidden">
                        <div className="flex items-center justify-between mb-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                            >
                                Anterior
                            </Button>
                            <span className="text-sm text-muted-foreground font-medium">
                                {currentPage} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Próxima
                            </Button>
                        </div>
                        <p className="text-xs text-center text-muted-foreground">
                            {filteredData.length} registros
                        </p>
                    </div>

                    {/* Desktop Pagination: Full */}
                    <div className="mt-6 hidden md:flex items-center justify-center gap-4">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setCurrentPage(Math.max(1, currentPage - 1));
                                        }}
                                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                                    />
                                </PaginationItem>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                    const isCurrentPage = page === currentPage;
                                    const isVisible =
                                        Math.abs(page - currentPage) <= 1 ||
                                        page === 1 ||
                                        page === totalPages;

                                    if (!isVisible) {
                                        return null;
                                    }

                                    if (page === 2 && currentPage > 3) {
                                        return (
                                            <PaginationItem key="ellipsis-start">
                                                <PaginationEllipsis />
                                            </PaginationItem>
                                        );
                                    }

                                    if (
                                        page === totalPages - 1 &&
                                        currentPage < totalPages - 2
                                    ) {
                                        return (
                                            <PaginationItem key="ellipsis-end">
                                                <PaginationEllipsis />
                                            </PaginationItem>
                                        );
                                    }

                                    return (
                                        <PaginationItem key={page}>
                                            <PaginationLink
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setCurrentPage(page);
                                                }}
                                                isActive={isCurrentPage}
                                            >
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                    );
                                })}

                                <PaginationItem>
                                    <PaginationNext
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setCurrentPage(Math.min(totalPages, currentPage + 1));
                                        }}
                                        className={
                                            currentPage === totalPages ? "pointer-events-none opacity-50" : ""
                                        }
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                        <div className="text-xs text-muted-foreground flex items-center">
                            Página {currentPage} de {totalPages} • {filteredData.length} registros
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
