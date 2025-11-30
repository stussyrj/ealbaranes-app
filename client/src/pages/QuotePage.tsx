import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Truck } from "lucide-react";

export default function QuotePage() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [pickupTime, setPickupTime] = useState("");
  const [pickupTimeError, setPickupTimeError] = useState("");
  const [observations, setObservations] = useState("");
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [quoteId, setQuoteId] = useState<string>("");
  const { toast } = useToast();

  if (vehicles.length === 0 && !loading) {
    setLoading(true);
    fetch("/api/vehicle-types", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setVehicles(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  const getMinimumPickupTime = (): string => {
    const now = new Date();
    const minimumTime = new Date(now.getTime() + 30 * 60000);
    const hours = String(minimumTime.getHours()).padStart(2, "0");
    const minutes = String(minimumTime.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const validatePickupTime = (time: string): string => {
    if (!time) return "";
    const now = new Date();
    const minimumTime = new Date(now.getTime() + 30 * 60000);
    const [selectedHours, selectedMinutes] = time.split(":").map(Number);
    const selectedDate = new Date();
    selectedDate.setHours(selectedHours, selectedMinutes, 0);
    if (selectedDate.getTime() < now.getTime()) {
      selectedDate.setDate(selectedDate.getDate() + 1);
    }
    if (selectedDate.getTime() < minimumTime.getTime()) {
      const minHours = String(minimumTime.getHours()).padStart(2, "0");
      const minMinutes = String(minimumTime.getMinutes()).padStart(2, "0");
      return `El horario debe ser a partir de las ${minHours}:${minMinutes}`;
    }
    return "";
  };

  const handleCalculate = async () => {
    if (!origin.trim()) {
      toast({ title: "Campo requerido", description: "Por favor, ingresa el origen", variant: "destructive" });
      return;
    }
    if (!destination.trim()) {
      toast({ title: "Campo requerido", description: "Por favor, ingresa el destino", variant: "destructive" });
      return;
    }
    if (!vehicleId) {
      toast({ title: "Campo requerido", description: "Por favor, selecciona un vehículo", variant: "destructive" });
      return;
    }
    if (pickupTimeError) {
      toast({ title: "Error en horario", description: pickupTimeError, variant: "destructive" });
      return;
    }

    const res = await fetch("/api/calculate-quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin, destination, vehicleTypeId: vehicleId, isUrgent, pickupTime: pickupTime || undefined, observations: observations || undefined }),
      credentials: "include",
    });
    const data = await res.json();
    if (data && data.breakdown) {
      setResult(data.breakdown);
      setQuoteId(data.quote.id);
      setConfirmed(false);
    }
  };

  const handleConfirm = async () => {
    const res = await fetch(`/api/quotes/${quoteId}/confirm`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include" });
    if (res.ok) {
      setConfirmed(true);
      setTimeout(() => { handleReset(); }, 4000);
    }
  };

  const handleReset = () => {
    setResult(null);
    setOrigin("");
    setDestination("");
    setVehicleId("");
    setIsUrgent(false);
    setPickupTime("");
    setPickupTimeError("");
    setObservations("");
    setConfirmed(false);
    setQuoteId("");
  };

  const minTime = getMinimumPickupTime();

  if (confirmed && result) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="truck-animation">
                  <Truck className="w-16 h-16 text-green-500" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">¡Confirmado!</h2>
                <p className="text-foreground">Hemos recibido tu solicitud</p>
                <p className="text-foreground">Estamos en camino...</p>
                <p className="text-sm text-muted-foreground">Número: {quoteId.slice(0, 8)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl mb-4">Nuevo Presupuesto</h1>
      <Card className="mb-6">
        <CardHeader><CardTitle>Calculadora</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Origen</Label>
            <Input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Ej: Calle Gran Vía, 45, 28013 Madrid" />
          </div>
          <div>
            <Label>Destino</Label>
            <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Ej: Paseo de Gràcia, 120, 08008 Barcelona" />
          </div>
          <div>
            <Label>Vehículo</Label>
            <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="w-full px-3 py-2 border rounded bg-white dark:bg-slate-900 text-black dark:text-white border-gray-300 dark:border-gray-600" data-testid="select-vehicle">
              <option value="">Selecciona</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id} data-testid={`option-vehicle-${v.id}`}>{v.name} - {v.capacity}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Horario de Recogida</Label>
            <div className="text-xs text-muted-foreground mb-2">Mínimo: {minTime} (necesitamos 30 minutos para llegar al origen)</div>
            <Input type="time" value={pickupTime} onChange={(e) => { const newTime = e.target.value; const error = validatePickupTime(newTime); setPickupTimeError(error); setPickupTime(newTime); }} min={minTime} placeholder="Ej: 14:30" data-testid="input-pickup-time" className={pickupTimeError ? "border-red-500 focus-visible:ring-red-500" : ""} />
            {pickupTimeError && (<p className="text-sm text-red-500 mt-1">{pickupTimeError}</p>)}
          </div>
          <div>
            <Label>Observaciones</Label>
            <Textarea value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Agregar cualquier información relevante para la entrega..." rows={3} data-testid="textarea-observations" />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="urgent" checked={isUrgent} onCheckedChange={(checked) => setIsUrgent(checked === true)} data-testid="checkbox-urgent" />
            <Label htmlFor="urgent" className="cursor-pointer text-sm">Urgencia (+25%)</Label>
          </div>
          <Button onClick={handleCalculate} className="w-full" data-testid="button-calculate" disabled={!!pickupTimeError}>Calcular</Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader><CardTitle>Presupuesto</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">Origen</p><p className="font-medium">{result.origin?.label || "—"}</p></div>
              <div><p className="text-sm text-muted-foreground">Destino</p><p className="font-medium">{result.destination?.label || "—"}</p></div>
              <div><p className="text-sm text-muted-foreground">Distancia</p><p className="font-medium">{(result.distance || 0).toFixed(1)} km</p></div>
              <div><p className="text-sm text-muted-foreground">Vehículo</p><p className="font-medium">{result.vehicle?.name || "—"}</p></div>
            </div>
            {result.pickupTime && (<div className="bg-slate-50 dark:bg-slate-900 p-3 rounded"><p className="text-sm text-muted-foreground">Horario de Recogida</p><p className="font-medium">{result.pickupTime}</p></div>)}
            {result.observations && (<div className="bg-slate-50 dark:bg-slate-900 p-3 rounded"><p className="text-sm text-muted-foreground">Observaciones</p><p className="text-sm">{result.observations}</p></div>)}
            <div className="border-t pt-3 space-y-1">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tarifa (€/km):</span><span className="font-mono">{(result.pricing?.pricePerKm || 0).toFixed(2)}€ × {(result.distance || 0).toFixed(1)} km</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Importe por distancia:</span><span className="font-mono">{(result.pricing?.distanceCost || 0).toFixed(2)}€</span></div>
              {result.pricing?.directionCost > 0 && (<div className="flex justify-between text-sm"><span className="text-muted-foreground">Dirección:</span><span className="font-mono">{(result.pricing?.directionCost || 0).toFixed(2)}€</span></div>)}
              <div className="flex justify-between text-sm bg-slate-50 dark:bg-slate-900 -mx-3 px-3 py-1"><span className="text-muted-foreground">Subtotal:</span><span className="font-mono font-semibold">{((result.pricing?.distanceCost || 0) + (result.pricing?.directionCost || 0)).toFixed(2)}€</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tarifa mínima aplicable:</span><span className="font-mono">{(result.pricing?.minimumPrice || 0).toFixed(2)}€</span></div>
              {result.pricing?.isUrgent && (<div className="flex justify-between text-sm text-orange-600 dark:text-orange-400"><span>Recargo urgencia (+25%):</span><span className="font-medium">Aplicado</span></div>)}
              <div className="border-t pt-3 flex justify-between"><span className="font-semibold">Precio total a pagar:</span><span className="font-bold text-lg font-mono text-primary">{(result.pricing?.totalPrice || 0).toFixed(2)}€</span></div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} className="w-full" data-testid="button-new-quote">Nuevo</Button>
              <Button onClick={handleConfirm} className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white" data-testid="button-confirm-quote">Confirmar</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
