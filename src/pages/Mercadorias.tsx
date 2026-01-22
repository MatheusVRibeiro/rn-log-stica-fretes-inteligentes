import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { FilterBar } from "@/components/shared/FilterBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Package, Weight, Ruler, Edit, Trash2 } from "lucide-react";

interface Mercadoria {
  id: string;
  nome: string;
  tipo: string;
  peso: string;
  dimensoes: string;
}

const mercadoriasData: Mercadoria[] = [
  { id: "1", nome: "Grãos de Soja", tipo: "Granel", peso: "25 ton", dimensoes: "A granel" },
  { id: "2", nome: "Caixas de Eletrônicos", tipo: "Carga Seca", peso: "8 ton", dimensoes: "1.2m x 0.8m x 0.6m" },
  { id: "3", nome: "Bobinas de Aço", tipo: "Carga Pesada", peso: "15 ton", dimensoes: "Ø 1.5m x 2m" },
  { id: "4", nome: "Produtos Refrigerados", tipo: "Frigorificada", peso: "12 ton", dimensoes: "Paletes" },
  { id: "5", nome: "Madeira Serrada", tipo: "Carga Seca", peso: "20 ton", dimensoes: "Fardos 3m" },
];

export default function Mercadorias() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredData = mercadoriasData.filter(
    (m) =>
      m.nome.toLowerCase().includes(search.toLowerCase()) ||
      m.tipo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout title="Mercadorias" subtitle="Catálogo de mercadorias">
      <PageHeader
        title="Mercadorias"
        description="Gerencie os tipos de mercadorias transportadas"
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Mercadoria
          </Button>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar mercadoria..."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredData.map((mercadoria) => (
          <Card key={mercadoria.id} className="hover:shadow-md transition-shadow animate-fade-in">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-loss hover:text-loss">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-1">{mercadoria.nome}</h3>
              <p className="text-sm text-muted-foreground mb-4">{mercadoria.tipo}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Weight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Peso:</span>
                  <span className="font-medium">{mercadoria.peso}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Dimensões:</span>
                  <span className="font-medium">{mercadoria.dimensoes}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhuma mercadoria encontrada</p>
        </div>
      )}

      {/* New Merchandise Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Mercadoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" placeholder="Nome da mercadoria" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Input id="tipo" placeholder="Ex: Carga Seca, Frigorificada" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="peso">Peso</Label>
                <Input id="peso" placeholder="Ex: 25 ton" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dimensoes">Dimensões</Label>
                <Input id="dimensoes" placeholder="Ex: 1.2m x 0.8m" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setIsModalOpen(false)}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
