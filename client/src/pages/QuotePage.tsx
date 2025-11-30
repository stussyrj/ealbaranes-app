import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function QuotePage() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [pickupTime, setPickupTime] = useState("");
  const [observations, setObservations] = useState("");
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
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

  const isValidPickupTime = (time: string): boolean => {
    if (!time) return true;
    
    const now = new Date();
    const minimumTime = new Date(now.getTime() + 30 * 60000);
    
    // Convertir a minutos desde medianoche para comparación correcta (incluyendo cambio de día)
    const [hours, minutes] = time.split(":").map(Number);
    const selectedMinutes = hours * 60 + minutes;
    const minimumMinutes = minimumTime.getHours() * 60 + minimumTime.getMinutes();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    
    // Si el mínimo está en el futuro hoy, el usuario debe seleccionar un tiempo en el futuro
    let isValid = false;
    
    if (minimumMinutes > nowMinutes) {
      // El mínimo es hoy (después de la hora actual)
      isValid = selectedMinutes >= minimumMinutes;
    } else {
      // El mínimo es mañana (pasó medianoche), entonces cualquier hora que el usuario seleccione es válida si es >= mínimo
      // O si selecciona una hora "anterior" que será interpretada como mañana
      isValid = selectedMinutes >= minimumMinutes || selectedMinutes <= 1440;
    }
    
    if (!isValid) {
      const minHours = String(minimumTime.getHours()).padStart(2, "0");
      const minMinutes = String(minimumTime.getMinutes()).padStart(2, "0");
      toast({
        title: "Horario inválido",
        description: `Por favor, selecciona un horario de recogida a partir de las ${minHours}:${minMinutes}`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleCalculate = async () => {
    if (pickupTime && !isValidPickupTime(pickupTime)) {
      return;
    }

    const res = await fetch("/api/calculate-quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        origin, 
        destination, 
        vehicleTypeId: vehicleId, 
        isUrgent,
        pickupTime: pickupTime || undefined,
        observations: observations || undefined,
      }),
      credentials: "include",
    });
    const data = await res.json();
    if (data && data.breakdown) {
      setResult(data.breakdown);
    }
  };

  const handleReset = () => {
    setResult(null);
    setOrigin("");
    setDestination("");
    setVehicleId("");
    setIsUrgent(false);
    setPickupTime("");
    setObservations("");
  };

  const minTime = getMinimumPickupTime();

  return (
    <div className="p-6">
      <h1 className="text-3xl mb-4">Nuevo Presupuesto</h1>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Calculadora</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Origen</Label>
            <Input
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Ej: Calle Gran Vía, 45, 28013 Madrid"
            />
          </div>
          <div>
            <Label>Destino</Label>
            <Input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Ej: Paseo de Gràcia, 120, 08008 Barcelona"
            />
          </div>
          <div>
            <Label>Vehículo</Label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full px-3 py-2 border rounded bg-white dark:bg-slate-900 text-black dark:text-white border-gray-300 dark:border-gray-600"
              data-testid="select-vehicle"
            >
              <option value="">Selecciona</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id} data-testid={`option-vehicle-${v.id}`}>
                  {v.name} - {v.capacity}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Horario de Recogida</Label>
            <div className="text-xs text-muted-foreground mb-2">
              Mínimo: {minTime} (necesitamos 30 minutos para llegar al origen)
            </div>
            <Input
              type="time"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              min={minTime}
              placeholder="Ej: 14:30"
              data-testid="input-pickup-time"
            />
          </div>
          <div>
            <Label>Observaciones</Label>
            <Textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Agregar cualquier información relevante para la entrega..."
              rows={3}
              data-testid="textarea-observations"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="urgent"
              checked={isUrgent}
              onCheckedChange={(checked) => setIsUrgent(checked === true)}
              data-testid="checkbox-urgent"
            />
            <Label htmlFor="urgent" className="cursor-pointer text-sm">
              Urgencia (+25%)
            </Label>
          </div>
          <Button onClick={handleCalculate} className="w-full" data-testid="button-calculate">
            Calcular
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Presupuesto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Origen</p>
                <p className="font-medium">{result.origin?.label || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Destino</p>
                <p className="font-medium">{result.destination?.label || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Distancia</p>
                <p className="font-medium">{(result.distance || 0).toFixed(1)} km</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vehículo</p>
                <p className="font-medium">{result.vehicle?.name || "—"}</p>
              </div>
            </div>
            {result.pickupTime && (
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded">
                <p className="text-sm text-muted-foreground">Horario de Recogida</p>
                <p className="font-medium">{result.pickupTime}</p>
              </div>
            )}
            {result.observations && (
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded">
                <p className="text-sm text-muted-foreground">Observaciones</p>
                <p className="text-sm">{result.observations}</p>
              </div>
            )}
            <div className="border-t pt-3 space-y-1">
              <div className="flex justify-between">
                <span>Distancia (€/km):</span>
                <span>{(result.pricing?.pricePerKm || 0).toFixed(2)}€ × {(result.distance || 0).toFixed(1)} km</span>
              </div>
              <div className="flex justify-between">
                <span>Costo de distancia:</span>
                <span>{(result.pricing?.distanceCost || 0).toFixed(2)}€</span>
              </div>
              <div className="flex justify-between">
                <span>Mínimo aplicable:</span>
                <span>{(result.pricing?.minimumPrice || 0).toFixed(2)}€</span>
              </div>
              {result.pricing?.isUrgent && (
                <div className="flex justify-between text-orange-600 dark:text-orange-400">
                  <span>Urgencia (+25%):</span>
                  <span className="font-medium">Aplicado</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>{(result.pricing?.totalPrice || 0).toFixed(2)}€</span>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleReset}
              className="w-full"
              data-testid="button-new-quote"
            >
              Nuevo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
