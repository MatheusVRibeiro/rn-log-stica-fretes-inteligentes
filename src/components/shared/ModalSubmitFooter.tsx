import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

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
  const [isClickLocked, setIsClickLocked] = useState(false);
  const lockTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (lockTimeoutRef.current) {
        window.clearTimeout(lockTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmitClick = () => {
    if (isClickLocked || isSubmitting || disableSubmit) return;
    setIsClickLocked(true);
    onSubmit();
    lockTimeoutRef.current = window.setTimeout(() => {
      setIsClickLocked(false);
      lockTimeoutRef.current = null;
    }, 700);
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
        {cancelLabel}
      </Button>
      <Button onClick={handleSubmitClick} disabled={isSubmitting || disableSubmit || isClickLocked}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </div>
  );
}
