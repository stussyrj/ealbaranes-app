import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Check, Eraser, MapPin, Package, AlertTriangle, Clock, ChevronRight, Pen } from "lucide-react";
import type { PickupOrigin, DeliveryNote } from "@shared/schema";

interface PickupSigningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryNote: DeliveryNote | null;
  onPickupSigned: (pickupIndex: number, pickupData: Partial<PickupOrigin>) => Promise<void>;
}

export function PickupSigningModal({
  open,
  onOpenChange,
  deliveryNote,
  onPickupSigned,
}: PickupSigningModalProps) {
  const [selectedPickupIndex, setSelectedPickupIndex] = useState<number | null>(null);
  const [signerName, setSignerName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [observations, setObservations] = useState("");
  const [incidence, setIncidence] = useState("");
  const [hasIncidence, setHasIncidence] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const hasSignatureRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [hasSignature, setHasSignature] = useState(false);

  const pickups = deliveryNote?.pickupOrigins || [];

  useEffect(() => {
    if (open) {
      setSelectedPickupIndex(null);
      setSignerName("");
      setQuantity("");
      setObservations("");
      setIncidence("");
      setHasIncidence(false);
      setIsSigning(false);
      setGeoLocation(null);
      setGeoError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!isSigning) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    hasSignatureRef.current = false;
    setHasSignature(false);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setGeoError(null);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setGeoError("No se pudo obtener la ubicación");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, [isSigning]);

  const getCoordinates = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      const touch = e.touches[0];
      if (!touch) return null;
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    isDrawingRef.current = true;
    lastPointRef.current = coords;
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  }, [getCoordinates]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current) return;
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

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    
    lastPointRef.current = coords;

    if (!hasSignatureRef.current) {
      hasSignatureRef.current = true;
      setHasSignature(true);
    }
  }, [getCoordinates]);

  const stopDrawing = useCallback(() => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    hasSignatureRef.current = false;
    setHasSignature(false);
  }, []);

  const handleConfirmSignature = async () => {
    if (selectedPickupIndex === null || !hasSignatureRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSubmitting(true);
    
    try {
      const signatureData = canvas.toDataURL("image/png");
      const now = new Date().toISOString();
      
      const pickupData: Partial<PickupOrigin> = {
        signature: signatureData,
        signedAt: now,
        status: hasIncidence ? "problem" : "completed",
      };
      
      if (signerName.trim()) pickupData.signerName = signerName.trim();
      if (quantity.trim()) pickupData.quantity = quantity.trim();
      if (observations.trim()) pickupData.observations = observations.trim();
      if (hasIncidence && incidence.trim()) pickupData.incidence = incidence.trim();
      if (geoLocation) pickupData.geoLocation = geoLocation;

      await onPickupSigned(selectedPickupIndex, pickupData);
      
      setSelectedPickupIndex(null);
      setIsSigning(false);
      setSignerName("");
      setQuantity("");
      setObservations("");
      setIncidence("");
      setHasIncidence(false);
    } catch (error) {
      console.error("Error signing pickup:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPickupStatus = (pickup: PickupOrigin) => {
    if (pickup.status === "completed") return { label: "Completado", color: "bg-green-500" };
    if (pickup.status === "problem") return { label: "Con incidencia", color: "bg-yellow-500" };
    return { label: "Pendiente", color: "bg-gray-400" };
  };

  const pendingPickups = pickups.filter(p => p.status !== "completed" && p.status !== "problem");
  const completedPickups = pickups.filter(p => p.status === "completed" || p.status === "problem");

  if (isSigning && selectedPickupIndex !== null) {
    const selectedPickup = pickups[selectedPickupIndex];
    
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pen className="h-5 w-5" />
              Firmar Recogida
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-primary/10 border-2 border-primary rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  {selectedPickupIndex + 1}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Recogida seleccionada</p>
                  <p className="font-semibold">{selectedPickup?.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground pl-11">
                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{selectedPickup?.address || "Sin dirección"}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signerName">Nombre de quien entrega</Label>
              <Input
                id="signerName"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Nombre completo"
                data-testid="input-pickup-signer-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad/Unidades recogidas</Label>
              <Input
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Ej: 3 pallets, 5 cajas"
                data-testid="input-pickup-quantity"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observations">Observaciones</Label>
              <Textarea
                id="observations"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Notas sobre la recogida..."
                rows={2}
                data-testid="input-pickup-observations"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasIncidence"
                  checked={hasIncidence}
                  onChange={(e) => setHasIncidence(e.target.checked)}
                  className="rounded"
                  data-testid="checkbox-has-incidence"
                />
                <Label htmlFor="hasIncidence" className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 cursor-pointer">
                  <AlertTriangle className="h-4 w-4" />
                  Reportar incidencia
                </Label>
              </div>
              {hasIncidence && (
                <Textarea
                  value={incidence}
                  onChange={(e) => setIncidence(e.target.value)}
                  placeholder="Describe la incidencia..."
                  rows={2}
                  className="border-yellow-500"
                  data-testid="input-pickup-incidence"
                />
              )}
            </div>

            {geoLocation && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-green-50 dark:bg-green-900/20 p-2 rounded">
                <MapPin className="h-3 w-3 text-green-600" />
                <span>Ubicación capturada: {geoLocation.lat.toFixed(6)}, {geoLocation.lng.toFixed(6)}</span>
              </div>
            )}
            {geoError && (
              <div className="flex items-center gap-2 text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                <MapPin className="h-3 w-3" />
                <span>{geoError}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label>Firma de quien entrega *</Label>
              <div className="relative border rounded-lg bg-white overflow-hidden" style={{ touchAction: 'none' }}>
                <canvas
                  ref={canvasRef}
                  className="w-full cursor-crosshair"
                  style={{ height: '150px' }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  data-testid="canvas-pickup-signature"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute bottom-2 right-2"
                  onClick={clearCanvas}
                  data-testid="button-clear-pickup-signature"
                >
                  <Eraser className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsSigning(false);
                  setSelectedPickupIndex(null);
                }}
                data-testid="button-cancel-pickup-signing"
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirmSignature}
                disabled={!hasSignature || isSubmitting}
                data-testid="button-confirm-pickup-signature"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Guardando...
                  </span>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Confirmar Recogida
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Gestión de Recogidas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/30 p-3 rounded-lg">
            <p className="text-sm font-medium">Albarán #{deliveryNote?.noteNumber}</p>
            <p className="text-xs text-muted-foreground">{deliveryNote?.clientName}</p>
          </div>

          {pendingPickups.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                Recogidas Pendientes ({pendingPickups.length})
              </h3>
              <div className="space-y-2">
                {pickups.map((pickup, index) => {
                  if (pickup.status === "completed" || pickup.status === "problem") return null;
                  const status = getPickupStatus(pickup);
                  
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedPickupIndex(index);
                        setIsSigning(true);
                      }}
                      className="w-full p-3 rounded-lg border bg-card hover-elevate text-left flex items-center justify-between gap-3"
                      data-testid={`button-pickup-${index}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-muted-foreground">#{index + 1}</span>
                          <Badge variant="outline" className="text-[10px]">
                            <span className={`w-1.5 h-1.5 rounded-full ${status.color} mr-1`} />
                            {status.label}
                          </Badge>
                        </div>
                        <p className="font-medium text-sm truncate">{pickup.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{pickup.address}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {completedPickups.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Recogidas Completadas ({completedPickups.length})
              </h3>
              <div className="space-y-2">
                {pickups.map((pickup, index) => {
                  if (pickup.status !== "completed" && pickup.status !== "problem") return null;
                  const status = getPickupStatus(pickup);
                  
                  return (
                    <div
                      key={index}
                      className="p-3 rounded-lg border bg-muted/30"
                      data-testid={`pickup-completed-${index}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-muted-foreground">#{index + 1}</span>
                        <Badge variant="outline" className="text-[10px]">
                          <span className={`w-1.5 h-1.5 rounded-full ${status.color} mr-1`} />
                          {status.label}
                        </Badge>
                        {pickup.signedAt && (
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(pickup.signedAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-sm">{pickup.name}</p>
                      <p className="text-xs text-muted-foreground">{pickup.address}</p>
                      {pickup.signerName && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Firmado por: {pickup.signerName}
                        </p>
                      )}
                      {pickup.quantity && (
                        <p className="text-xs text-muted-foreground">
                          Cantidad: {pickup.quantity}
                        </p>
                      )}
                      {pickup.incidence && (
                        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-yellow-700 dark:text-yellow-300">
                          <AlertTriangle className="h-3 w-3 inline mr-1" />
                          {pickup.incidence}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {pickups.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No hay recogidas registradas
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
