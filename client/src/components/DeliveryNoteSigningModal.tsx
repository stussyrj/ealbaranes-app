import { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Eraser, MapPin, Navigation, FileText, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { DeliveryNote } from "@shared/schema";

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

interface DeliveryNoteSigningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: DeliveryNote | null;
}

export function DeliveryNoteSigningModal({ open, onOpenChange, note }: DeliveryNoteSigningModalProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("origin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  const isOriginComplete = hasOriginSignature && originDocument.trim().length >= 8;
  const isDestinationComplete = hasDestinationSignature && destinationDocument.trim().length >= 8;
  const isFormComplete = isOriginComplete && isDestinationComplete;

  const resetForm = () => {
    setOriginSignature("");
    setOriginDocument("");
    setHasOriginSignature(false);
    setDestinationSignature("");
    setDestinationDocument("");
    setHasDestinationSignature(false);
    setActiveTab("origin");
    setIsSubmitting(false);
  };

  const handleSubmit = async () => {
    if (!note || !isFormComplete) {
      console.error("Missing required fields");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      status: "signed",
      originSignature,
      originSignatureDocument: originDocument.trim().toUpperCase(),
      originSignedAt: new Date().toISOString(),
      destinationSignature,
      destinationSignatureDocument: destinationDocument.trim().toUpperCase(),
      destinationSignedAt: new Date().toISOString(),
    };

    try {
      await apiRequest("PATCH", `/api/delivery-notes/${note.id}`, payload);
      
      await queryClient.invalidateQueries({ queryKey: ["/api/delivery-notes"] });
      if (note.workerId) {
        await queryClient.invalidateQueries({ queryKey: ["/api/workers", note.workerId, "delivery-notes"] });
      }
      
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error signing delivery note:", error);
      setIsSubmitting(false);
    }
  };

  const getFirstOriginName = () => {
    if (note?.pickupOrigins && Array.isArray(note.pickupOrigins) && note.pickupOrigins.length > 0) {
      const first = note.pickupOrigins[0];
      if (typeof first === 'object' && first !== null) {
        return (first as { name?: string; address?: string }).name || (first as { name?: string; address?: string }).address || 'N/A';
      }
    }
    return 'N/A';
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Firmar Albarán #{note?.noteNumber}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {note && (
            <div className="bg-muted/30 rounded-lg p-3 space-y-1.5 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-muted-foreground text-xs">Origen</span>
                  <p className="font-medium truncate">{getFirstOriginName()}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Navigation className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-muted-foreground text-xs">Destino</span>
                  <p className="font-medium truncate">{note.destination || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-muted-foreground/10">
                <span>Cliente: {note.clientName || 'N/A'}</span>
              </div>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="origin" className="relative" data-testid="tab-sign-origin">
                <MapPin className="w-3.5 h-3.5 mr-1.5" />
                Origen
                {isOriginComplete && (
                  <Check className="w-3.5 h-3.5 text-green-500 ml-1.5" />
                )}
              </TabsTrigger>
              <TabsTrigger value="destination" className="relative" data-testid="tab-sign-destination">
                <Navigation className="w-3.5 h-3.5 mr-1.5" />
                Destino
                {isDestinationComplete && (
                  <Check className="w-3.5 h-3.5 text-green-500 ml-1.5" />
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="origin" className="space-y-3 mt-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
                <User className="w-4 h-4 inline mr-1.5" />
                Firma de la persona que <strong>entrega</strong> el material en origen
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sign-origin-document">DNI / NIE / NIF del firmante</Label>
                <Input
                  id="sign-origin-document"
                  placeholder="Ej: 12345678A"
                  value={originDocument}
                  onChange={(e) => setOriginDocument(e.target.value)}
                  className="uppercase"
                  maxLength={15}
                  data-testid="input-sign-origin-document"
                />
                {originDocument.length > 0 && originDocument.length < 8 && (
                  <p className="text-xs text-amber-600">Mínimo 8 caracteres</p>
                )}
              </div>

              <SignatureCanvas 
                onSignatureChange={handleOriginSignatureChange}
                label="Firma origen"
              />

              {isOriginComplete && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setActiveTab("destination")}
                  data-testid="button-next-to-destination"
                >
                  Continuar a Destino
                  <Navigation className="w-4 h-4 ml-2" />
                </Button>
              )}
            </TabsContent>

            <TabsContent value="destination" className="space-y-3 mt-3">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-sm text-green-700 dark:text-green-300">
                <User className="w-4 h-4 inline mr-1.5" />
                Firma de la persona que <strong>recibe</strong> el material en destino
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sign-destination-document">DNI / NIE / NIF del firmante</Label>
                <Input
                  id="sign-destination-document"
                  placeholder="Ej: 12345678A"
                  value={destinationDocument}
                  onChange={(e) => setDestinationDocument(e.target.value)}
                  className="uppercase"
                  maxLength={15}
                  data-testid="input-sign-destination-document"
                />
                {destinationDocument.length > 0 && destinationDocument.length < 8 && (
                  <p className="text-xs text-amber-600">Mínimo 8 caracteres</p>
                )}
              </div>

              <SignatureCanvas 
                onSignatureChange={handleDestinationSignatureChange}
                label="Firma destino"
              />
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
              data-testid="button-cancel-signing"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormComplete || isSubmitting}
              className="flex-1 bg-green-600/85 hover:bg-green-700/85 dark:bg-green-600/85 dark:hover:bg-green-700/85 text-white backdrop-blur-sm border border-green-500/40"
              data-testid="button-confirm-signing"
            >
              <Check className="w-4 h-4 mr-1.5" />
              {isSubmitting ? "Firmando..." : "Firmar Albarán"}
            </Button>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              {isOriginComplete ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40" />
              )}
              Origen
            </div>
            <div className="flex items-center gap-1.5">
              {isDestinationComplete ? (
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
