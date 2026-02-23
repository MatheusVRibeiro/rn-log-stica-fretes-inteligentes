import { Dispatch, SetStateAction } from "react";
import { DataTable } from "@/components/shared/DataTable";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from "@/components/ui/pagination";
import { PagamentoMotorista } from "@/types";

interface PagamentosTableProps {
    columns: any[];
    paginatedData: PagamentoMotorista[];
    filteredData: PagamentoMotorista[];
    setSelectedPagamento: (pagamento: PagamentoMotorista) => void;
    currentPage: number;
    setCurrentPage: Dispatch<SetStateAction<number>>;
    totalPages: number;
}

export function PagamentosTable({
    columns,
    paginatedData,
    filteredData,
    setSelectedPagamento,
    currentPage,
    setCurrentPage,
    totalPages,
}: PagamentosTableProps) {
    return (
        <>
            <DataTable<PagamentoMotorista>
                columns={columns}
                data={paginatedData}
                onRowClick={(item) => setSelectedPagamento(item)}
                emptyMessage="Nenhum pagamento encontrado com os filtros aplicados"
            />

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-6 flex flex-col md:flex-row items-center justify-center gap-4">
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
                                    Math.abs(page - currentPage) <= 1 || page === 1 || page === totalPages;

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

                                if (page === totalPages - 1 && currentPage < totalPages - 2) {
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
                                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                    <div className="text-xs text-muted-foreground flex items-center">
                        Página {currentPage} de {totalPages} • {filteredData.length} registros
                    </div>
                </div>
            )}
        </>
    );
}
