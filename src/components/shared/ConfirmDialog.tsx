import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { AlertTriangle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "warning";
    onConfirm: () => void;
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    variant = "danger",
    onConfirm,
}: ConfirmDialogProps) {
    return (
        <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <AlertDialogPrimitive.Portal>
                {/* Overlay quase transparente com apenas blur */}
                <AlertDialogPrimitive.Overlay
                    className="fixed inset-0 z-50 backdrop-blur-sm bg-transparent data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
                />
                {/* Conteúdo centralizado */}
                <AlertDialogPrimitive.Content
                    className={cn(
                        "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
                        "w-full max-w-md rounded-xl border bg-background shadow-2xl p-6",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out",
                        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                        "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
                        "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
                        "duration-200"
                    )}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div
                            className={cn(
                                "flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0",
                                variant === "danger"
                                    ? "bg-destructive/10 text-destructive"
                                    : "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                            )}
                        >
                            {variant === "danger" ? (
                                <Trash2 className="h-5 w-5" />
                            ) : (
                                <AlertTriangle className="h-5 w-5" />
                            )}
                        </div>
                        <AlertDialogPrimitive.Title className="text-base font-semibold leading-tight">
                            {title}
                        </AlertDialogPrimitive.Title>
                    </div>

                    <AlertDialogPrimitive.Description className="text-sm text-muted-foreground mb-6 pl-[52px]">
                        {description}
                    </AlertDialogPrimitive.Description>

                    <div className="flex justify-end gap-2">
                        <AlertDialogPrimitive.Cancel
                            className={buttonVariants({ variant: "outline" })}
                        >
                            {cancelLabel}
                        </AlertDialogPrimitive.Cancel>
                        <AlertDialogPrimitive.Action
                            onClick={onConfirm}
                            className={cn(
                                buttonVariants(),
                                variant === "danger"
                                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    : "bg-amber-500 text-white hover:bg-amber-600"
                            )}
                        >
                            {confirmLabel}
                        </AlertDialogPrimitive.Action>
                    </div>
                </AlertDialogPrimitive.Content>
            </AlertDialogPrimitive.Portal>
        </AlertDialogPrimitive.Root>
    );
}
