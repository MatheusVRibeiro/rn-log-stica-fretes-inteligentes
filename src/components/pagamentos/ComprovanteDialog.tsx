import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ComprovanteDialogProps {
    comprovanteDialog: {
        url: string;
        nome: string;
        isImage: boolean;
        isPdf: boolean;
    } | null;
    setComprovanteDialog: (val: any) => void;
}

export function ComprovanteDialog({
    comprovanteDialog,
    setComprovanteDialog,
}: ComprovanteDialogProps) {
    if (!comprovanteDialog) return null;

    return (
        <Dialog
            open={!!comprovanteDialog}
            onOpenChange={(open) => {
                if (!open) setComprovanteDialog(null);
            }}
        >
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Comprovante</DialogTitle>
                    <DialogDescription className="sr-only">
                        Visualização do arquivo de comprovante.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">{comprovanteDialog.nome}</p>
                    {comprovanteDialog.isImage ? (
                        <img
                            src={comprovanteDialog.url}
                            alt={comprovanteDialog.nome}
                            className="max-h-[70vh] w-full rounded-md object-contain"
                        />
                    ) : comprovanteDialog.isPdf ? (
                        <iframe
                            src={comprovanteDialog.url}
                            title={comprovanteDialog.nome}
                            className="h-[70vh] w-full rounded-md border"
                        />
                    ) : (
                        <div className="space-y-2">
                            <div className="text-sm text-muted-foreground">
                                Não foi possível identificar o tipo do arquivo para preview direto.
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                className="gap-2"
                                onClick={() => window.open(comprovanteDialog.url, "_blank")}
                            >
                                <Download className="h-4 w-4" />
                                Abrir PDF
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
