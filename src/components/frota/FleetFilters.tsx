import { FilterBar } from "@/components/shared/FilterBar";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface FleetFiltersProps {
    search: string;
    setSearch: (val: string) => void;
    fleetFilter: "all" | "proprio" | "terceiro";
    setFleetFilter: (val: "all" | "proprio" | "terceiro") => void;
    statusFilter: string;
    setStatusFilter: (val: string) => void;
}

export function FleetFilters({
    search,
    setSearch,
    fleetFilter,
    setFleetFilter,
    statusFilter,
    setStatusFilter,
}: FleetFiltersProps) {
    return (
        <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por placa, modelo ou proprietário..."
        >
            <div className="inline-flex items-center rounded-md border bg-muted/30 p-1 mr-2">
                <Button
                    type="button"
                    size="sm"
                    variant={fleetFilter === "all" ? "default" : "ghost"}
                    className="h-8 px-3 text-xs"
                    onClick={() => setFleetFilter("all")}
                >
                    Todos
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant={fleetFilter === "proprio" ? "default" : "ghost"}
                    className="h-8 px-3 text-xs"
                    onClick={() => setFleetFilter("proprio")}
                >
                    Própria
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant={fleetFilter === "terceiro" ? "default" : "ghost"}
                    className="h-8 px-3 text-xs"
                    onClick={() => setFleetFilter("terceiro")}
                >
                    Terceirizada
                </Button>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="disponivel">Disponível</SelectItem>
                    <SelectItem value="em_viagem">Em Viagem</SelectItem>
                    <SelectItem value="em_manutencao">Em Manutenção</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
            </Select>
        </FilterBar>
    );
}
