import { Button } from "@/components/ui/button";

interface ModalSubmitFooterProps {
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  disableSubmit?: boolean;
}

export function ModalSubmitFooter({
  onCancel,
  onSubmit,
  submitLabel,
  cancelLabel = "Cancelar",
  isSubmitting = false,
  disableSubmit = false,
}: ModalSubmitFooterProps) {
  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
        {cancelLabel}
      </Button>
      <Button onClick={onSubmit} disabled={isSubmitting || disableSubmit}>
        {isSubmitting ? "Salvando..." : submitLabel}
      </Button>
    </div>
  );
}
