import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Quote, DeliveryNote } from "@shared/schema";

interface DeliveryNoteGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: Quote | null;
  workerId: string | undefined;
}

export function DeliveryNoteGenerator({ open, onOpenChange, quote, workerId }: DeliveryNoteGeneratorProps) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [signatureCanvas, setSignatureCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isSigned, setIsSigned] = useState(false);

  const handleClearSignature = () => {
    if (signatureCanvas) {
      const ctx = signatureCanvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
        setIsSigned(false);
      }
    }
  };

  const handleSignature = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!signatureCanvas) return;
    const ctx = signatureCanvas.getContext("2d");
    if (!ctx) return;
    
    const rect = signatureCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (e.buttons === 1) {
      ctx.lineTo(x, y);
      ctx.stroke();
      setIsSigned(true);
    }
  };

  const handleMouseDown = () => {
    if (signatureCanvas) {
      const ctx = signatureCanvas.getContext("2d");
      if (ctx) {
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
      }
    }
  };

  const handleSubmit = async () => {
    if (!quote || !workerId || !signatureCanvas) {
      console.error("Missing required fields:", { quote: !!quote, workerId, signatureCanvas: !!signatureCanvas });
      return;
    }

    const signatureData = signatureCanvas.toDataURL();
    const payload = {
      quoteId: quote.id,
      workerId,
      status: "signed",
      signature: signatureData,
      signedAt: new Date().toISOString(),
      notes,
    };
    console.log("Payload to send:", payload);

    try {
      const response = await fetch("/api/delivery-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (response.ok) {
        const newDeliveryNote = await response.json();
        setNotes("");
        handleClearSignature();
        
        // Update both caches immediately with the new delivery note
        const workerKey = ["/api/workers", workerId, "delivery-notes"];
        const adminKey = ["/api/delivery-notes"];
        
        // Add to worker's delivery notes
        const workerNotes = queryClient.getQueryData<DeliveryNote[]>(workerKey) || [];
        queryClient.setQueryData(workerKey, [newDeliveryNote, ...workerNotes]);
        
        // Add to admin's delivery notes
        const allNotes = queryClient.getQueryData<DeliveryNote[]>(adminKey) || [];
        queryClient.setQueryData(adminKey, [newDeliveryNote, ...allNotes]);
        
        // Force invalidation to trigger component re-render
        await queryClient.invalidateQueries({ queryKey: workerKey });
        await queryClient.invalidateQueries({ queryKey: adminKey });
        
        // Close modal after data is updated
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error creating delivery note:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generar Albarán</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {quote && (
            <div className="text-sm space-y-1">
              <p><span className="font-semibold">Ruta:</span> {quote.origin} → {quote.destination}</p>
              <p><span className="font-semibold">Distancia:</span> {quote.distance} km</p>
              <p><span className="font-semibold">Cliente:</span> {quote.customerName}</p>
            </div>
          )}

          <Textarea
            placeholder="Notas del servicio..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="resize-none"
            data-testid="textarea-delivery-notes"
          />

          <div>
            <p className="text-sm font-semibold mb-2">Firma del cliente:</p>
            <canvas
              ref={setSignatureCanvas}
              width={500}
              height={200}
              onMouseMove={handleSignature}
              onMouseDown={handleMouseDown}
              className="border-2 border-dashed border-muted-foreground rounded bg-background cursor-crosshair"
              data-testid="canvas-signature"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClearSignature}
              className="flex-1"
              data-testid="button-clear-signature"
            >
              Limpiar Firma
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel-delivery-note"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isSigned}
              className="flex-1 bg-green-600/85 hover:bg-green-700/85 dark:bg-green-600/85 dark:hover:bg-green-700/85 text-white backdrop-blur-sm border border-green-500/40"
              data-testid="button-send-delivery-note"
            >
              Enviar Albarán
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
