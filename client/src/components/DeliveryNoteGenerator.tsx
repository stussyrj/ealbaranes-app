import { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Eraser, MapPin, Navigation } from "lucide-react";
import type { Quote, DeliveryNote } from "@shared/schema";

interface SignatureCanvasProps {
  onSignatureChange: (hasSignature: boolean, dataUrl: string) => void;
  label: string;
}

function SignatureCanvas({ onSignatureChange, label }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const getCoordinates = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const touch = e.touches[0];
      if (!touch) return null;
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    lastPointRef.current = coords;
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  }, [getCoordinates]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const lastPoint = lastPointRef.current;
    if (!lastPoint) {
      lastPointRef.current = coords;
      return;
    }

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    lastPointRef.current = coords;
    
    if (!hasSignature) {
      setHasSignature(true);
      onSignatureChange(true, canvas?.toDataURL("image/png") || "");
    }
  }, [isDrawing, getCoordinates, hasSignature, onSignatureChange]);

  const stopDrawing = useCallback(() => {
    if (isDrawing && canvasRef.current) {
      onSignatureChange(true, canvasRef.current.toDataURL("image/png"));
    }
    setIsDrawing(false);
    lastPointRef.current = null;
  }, [isDrawing, onSignatureChange]);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    setHasSignature(false);
    onSignatureChange(false, "");
  }, [onSignatureChange]);

  const initCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
  }, []);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={(el) => {
            (canvasRef as any).current = el;
            initCanvas(el);
          }}
          width={400}
          height={120}
          className="w-full touch-none cursor-crosshair"
          style={{ touchAction: "none" }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          data-testid={`canvas-signature-${label.toLowerCase().replace(/\s/g, '-')}`}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={clearSignature}
        className="w-full"
        data-testid={`button-clear-${label.toLowerCase().replace(/\s/g, '-')}`}
      >
        <Eraser className="w-3.5 h-3.5 mr-1.5" />
        Borrar firma
      </Button>
    </div>
  );
}

interface DeliveryNoteGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: Quote | null;
  workerId: string | undefined;
}

export function DeliveryNoteGenerator({ open, onOpenChange, quote, workerId }: DeliveryNoteGeneratorProps) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState("origin");
  
  const [originSignature, setOriginSignature] = useState("");
  const [originDocument, setOriginDocument] = useState("");
  const [hasOriginSignature, setHasOriginSignature] = useState(false);
  
  const [destinationSignature, setDestinationSignature] = useState("");
  const [destinationDocument, setDestinationDocument] = useState("");
  const [hasDestinationSignature, setHasDestinationSignature] = useState(false);

  const handleOriginSignatureChange = useCallback((hasSig: boolean, dataUrl: string) => {
    setHasOriginSignature(hasSig);
    setOriginSignature(dataUrl);
  }, []);

  const handleDestinationSignatureChange = useCallback((hasSig: boolean, dataUrl: string) => {
    setHasDestinationSignature(hasSig);
    setDestinationSignature(dataUrl);
  }, []);

  const isFormComplete = hasOriginSignature && originDocument.trim().length >= 8 && 
                          hasDestinationSignature && destinationDocument.trim().length >= 8;

  const resetForm = () => {
    setNotes("");
    setOriginSignature("");
    setOriginDocument("");
    setHasOriginSignature(false);
    setDestinationSignature("");
    setDestinationDocument("");
    setHasDestinationSignature(false);
    setActiveTab("origin");
  };

  const handleSubmit = async () => {
    if (!quote || !workerId || !isFormComplete) {
      console.error("Missing required fields");
      return;
    }

    const payload = {
      quoteId: quote.id,
      workerId,
      clientName: quote.customerName,
      pickupOrigins: [{ name: "", address: quote.origin }],
      destination: quote.destination,
      vehicleType: quote.vehicleTypeName,
      distance: quote.distance,
      status: "signed",
      originSignature,
      originSignatureDocument: originDocument.trim().toUpperCase(),
      originSignedAt: new Date().toISOString(),
      destinationSignature,
      destinationSignatureDocument: destinationDocument.trim().toUpperCase(),
      destinationSignedAt: new Date().toISOString(),
      notes,
    };

    try {
      const response = await fetch("/api/delivery-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (response.ok) {
        const newDeliveryNote = await response.json();
        resetForm();
        
        const workerKey = ["/api/workers", workerId, "delivery-notes"];
        const adminKey = ["/api/delivery-notes"];
        
        const workerNotes = queryClient.getQueryData<DeliveryNote[]>(workerKey) || [];
        queryClient.setQueryData(workerKey, [newDeliveryNote, ...workerNotes]);
        
        const allNotes = queryClient.getQueryData<DeliveryNote[]>(adminKey) || [];
        queryClient.setQueryData(adminKey, [newDeliveryNote, ...allNotes]);
        
        await queryClient.invalidateQueries({ queryKey: workerKey });
        await queryClient.invalidateQueries({ queryKey: adminKey });
        
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error creating delivery note:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Generar Albarán
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {quote && (
            <div className="bg-muted/30 rounded-lg p-3 space-y-1.5 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-muted-foreground text-xs">Origen</span>
                  <p className="font-medium truncate">{quote.origin}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Navigation className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-muted-foreground text-xs">Destino</span>
                  <p className="font-medium truncate">{quote.destination}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-muted-foreground/10">
                <span>Cliente: {quote.customerName}</span>
                <span>{quote.distance} km</span>
              </div>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="origin" className="relative" data-testid="tab-origin">
                <MapPin className="w-3.5 h-3.5 mr-1.5" />
                Origen
                {hasOriginSignature && originDocument.length >= 8 && (
                  <Check className="w-3.5 h-3.5 text-green-500 ml-1.5" />
                )}
              </TabsTrigger>
              <TabsTrigger value="destination" className="relative" data-testid="tab-destination">
                <Navigation className="w-3.5 h-3.5 mr-1.5" />
                Destino
                {hasDestinationSignature && destinationDocument.length >= 8 && (
                  <Check className="w-3.5 h-3.5 text-green-500 ml-1.5" />
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="origin" className="space-y-3 mt-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
                Firma de la persona que <strong>entrega</strong> el material
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="origin-document">DNI / NIE / NIF</Label>
                <Input
                  id="origin-document"
                  placeholder="Ej: 12345678A"
                  value={originDocument}
                  onChange={(e) => setOriginDocument(e.target.value)}
                  className="uppercase"
                  maxLength={15}
                  data-testid="input-origin-document"
                />
              </div>

              <SignatureCanvas 
                onSignatureChange={handleOriginSignatureChange}
                label="Firma origen"
              />

              {hasOriginSignature && originDocument.length >= 8 && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setActiveTab("destination")}
                  data-testid="button-next-destination"
                >
                  Continuar a Destino
                  <Navigation className="w-4 h-4 ml-2" />
                </Button>
              )}
            </TabsContent>

            <TabsContent value="destination" className="space-y-3 mt-3">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-sm text-green-700 dark:text-green-300">
                Firma de la persona que <strong>recibe</strong> el material
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="destination-document">DNI / NIE / NIF</Label>
                <Input
                  id="destination-document"
                  placeholder="Ej: 12345678A"
                  value={destinationDocument}
                  onChange={(e) => setDestinationDocument(e.target.value)}
                  className="uppercase"
                  maxLength={15}
                  data-testid="input-destination-document"
                />
              </div>

              <SignatureCanvas 
                onSignatureChange={handleDestinationSignatureChange}
                label="Firma destino"
              />
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="notes">Observaciones (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Notas del servicio..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none h-16"
              data-testid="textarea-delivery-notes"
            />
          </div>

          <div className="flex gap-2 pt-2">
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
              disabled={!isFormComplete}
              className="flex-1 bg-green-600/85 hover:bg-green-700/85 dark:bg-green-600/85 dark:hover:bg-green-700/85 text-white backdrop-blur-sm border border-green-500/40"
              data-testid="button-send-delivery-note"
            >
              <Check className="w-4 h-4 mr-1.5" />
              Enviar Albarán
            </Button>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              {hasOriginSignature && originDocument.length >= 8 ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40" />
              )}
              Origen
            </div>
            <div className="flex items-center gap-1.5">
              {hasDestinationSignature && destinationDocument.length >= 8 ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40" />
              )}
              Destino
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
