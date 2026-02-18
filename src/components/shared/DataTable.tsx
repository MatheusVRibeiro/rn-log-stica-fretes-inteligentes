import { ReactNode, useMemo, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => ReactNode;
  className?: string;
  mobileVisible?: boolean;
  searchable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  highlightNegative?: (item: T) => boolean;
  mobileCardTitle?: (item: T) => ReactNode;
  enableGlobalSearch?: boolean;
  globalSearchPlaceholder?: string;
  virtualized?: boolean;
  virtualizedHeight?: number;
  rowHeight?: number;
}

const highlightTerm = (value: string, term: string) => {
  if (!term) return value;
  const index = value.toLowerCase().indexOf(term.toLowerCase());
  if (index < 0) return value;

  const start = value.slice(0, index);
  const match = value.slice(index, index + term.length);
  const end = value.slice(index + term.length);

  return (
    <>
      {start}
      <mark className="bg-warning/30 rounded px-0.5">{match}</mark>
      {end}
    </>
  );
};

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  emptyMessage = "Nenhum registro encontrado",
  highlightNegative,
  mobileCardTitle,
  enableGlobalSearch = false,
  globalSearchPlaceholder = "Buscar em todos os campos...",
  virtualized = false,
  virtualizedHeight = 460,
  rowHeight = 56,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchableColumns = columns.filter((col) => col.searchable !== false);

  const filteredData = useMemo(() => {
    if (!enableGlobalSearch || !searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();

    return data.filter((item) =>
      searchableColumns.some((column) => {
        const raw = (item as Record<string, unknown>)[column.key];
        return String(raw ?? "").toLowerCase().includes(term);
      })
    );
  }, [data, enableGlobalSearch, searchTerm, searchableColumns]);

  if (filteredData.length === 0) {
    return (
      <div className="space-y-3">
        {enableGlobalSearch && (
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={globalSearchPlaceholder}
            className="max-w-sm"
          />
        )}
        <div className="bg-card rounded-xl border p-12 text-center animate-fade-in">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  const mobileColumns = columns.filter((col, idx) => col.mobileVisible !== false && idx < 4).slice(0, 4);

  const visibleRows = virtualized
    ? Math.ceil(virtualizedHeight / rowHeight) + 6
    : filteredData.length;
  const startIndex = virtualized ? Math.max(0, Math.floor(scrollTop / rowHeight) - 3) : 0;
  const endIndex = Math.min(filteredData.length, startIndex + visibleRows);
  const visibleData = filteredData.slice(startIndex, endIndex);
  const topSpacer = startIndex * rowHeight;
  const bottomSpacer = (filteredData.length - endIndex) * rowHeight;

  return (
    <>
      {enableGlobalSearch && (
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={globalSearchPlaceholder}
          className="max-w-sm mb-3"
        />
      )}

      <div className="space-y-3 md:hidden animate-fade-in">
        {filteredData.map((item, index) => {
          const isNegative = highlightNegative?.(item);
          return (
            <Card
              key={index}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.98] min-h-11",
                isNegative && "bg-loss/5 border-loss/20 hover:bg-loss/10",
                !isNegative && "hover:border-primary/30"
              )}
              onClick={() => onRowClick?.(item)}
            >
              <CardContent className="p-4 sm:p-5 space-y-3">
                {mobileCardTitle ? (
                  <div className="font-semibold text-base border-b pb-2 mb-2">{mobileCardTitle(item)}</div>
                ) : (
                  <div className="font-semibold text-base border-b pb-2 mb-2">
                    {columns[0].render
                      ? columns[0].render(item, index)
                      : highlightTerm(String((item as Record<string, unknown>)[columns[0].key] ?? ""), searchTerm)}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {mobileColumns.slice(1).map((column) => (
                    <div key={column.key} className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{column.header}</p>
                      <div className={cn("text-sm font-medium", column.className)}>
                        {column.render
                          ? column.render(item, index)
                          : highlightTerm(String((item as Record<string, unknown>)[column.key] ?? ""), searchTerm)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="hidden md:block bg-card rounded-xl border animate-fade-in shadow-sm">
        <div
          ref={containerRef}
          className="w-full overflow-auto"
          style={virtualized ? { maxHeight: virtualizedHeight } : undefined}
          onScroll={(event) => setScrollTop((event.currentTarget as HTMLDivElement).scrollTop)}
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-muted/50 to-muted/30 hover:bg-muted/50 border-b-2">
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn("font-bold text-foreground text-sm uppercase tracking-wide", column.className)}
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {virtualized && topSpacer > 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} style={{ height: topSpacer }} className="p-0" />
                </TableRow>
              )}

              {visibleData.map((item, index) => {
                const absoluteIndex = startIndex + index;
                const isNegative = highlightNegative?.(item);
                return (
                  <TableRow
                    key={absoluteIndex}
                    className={cn(
                      "cursor-pointer transition-all duration-200 border-b hover:border-primary/20",
                      isNegative && "bg-loss/5 hover:bg-loss/10",
                      !isNegative && "hover:bg-primary/5 hover:shadow-sm"
                    )}
                    onClick={() => onRowClick?.(item)}
                  >
                    {columns.map((column) => (
                      <TableCell key={column.key} className={cn("py-3 px-4", column.className)}>
                        {column.render
                          ? column.render(item, absoluteIndex)
                          : highlightTerm(String((item as Record<string, unknown>)[column.key] ?? ""), searchTerm)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}

              {virtualized && bottomSpacer > 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} style={{ height: bottomSpacer }} className="p-0" />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}
