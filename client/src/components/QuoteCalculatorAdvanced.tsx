import { useState, useEffect } from "react";
import { MapPin, Calculator, Loader2, Receipt, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import type { VehicleType } from "@shared/schema";

export function QuoteCalculatorAdvanced() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [vehicles, setVehicles] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    fetch("/api/vehicle-types", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data)) setVehicles(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const calculate = async () => {
    if (!origin || !destination || !vehicleId) return;
    setCalculating(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/calculate-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination, vehicleTypeId: vehicleId }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Error en el cálculo");
      const data = await res.json();
      setResult(data.breakdown || null);
    } catch (e: any) {
      setError(e.message || "Error al calcular");
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculadora de Presupuesto
          </CardTitle>
          <CardDescription>
            Calcula el precio automáticamente con origen, destino y vehículo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="origin">Origen</Label>
              <Input
                id="origin"
                placeholder="Ej: Madrid"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                data-testid="input-origin"
              />
            </div>
            <div>
              <Label htmlFor="destination">Destino</Label>
              <Input
                id="destination"
                placeholder="Ej: Barcelona"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                data-testid="input-destination"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="vehicle">Vehículo</Label>
            {loading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <select
                id="vehicle"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                data-testid="select-vehicle-type"
              >
                <option value="">Selecciona un vehículo</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <Button
            onClick={calculate}
            disabled={!origin || !destination || !vehicleId || calculating}
            className="w-full"
            data-testid="button-calculate-quote"
          >
            {calculating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculando...
              </>
            ) : (
              <>
                <Calculator className="mr-2 h-4 w-4" />
                Calcular
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Presupuesto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Origen</p>
                <p className="font-medium" data-testid="text-origin">
                  {result.origin?.label || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Destino</p>
                <p className="font-medium" data-testid="text-destination">
                  {result.destination?.label || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Distancia</p>
                <p className="text-lg font-semibold" data-testid="text-distance">
                  {(result.distance || 0).toFixed(1)} km
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vehículo</p>
                <p className="font-medium">{result.vehicle?.name || "—"}</p>
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Tarifa: </span>
                <span>{(result.pricing?.basePrice || 0).toFixed(2)}€</span>
              </div>
              <div className="flex justify-between">
                <span>Distancia: </span>
                <span>{(result.pricing?.distanceCost || 0).toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total: </span>
                <span data-testid="text-total-price">
                  {(result.pricing?.totalPrice || 0).toFixed(2)}€
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setResult(null);
                setOrigin("");
                setDestination("");
                setVehicleId("");
              }}
              className="w-full"
              data-testid="button-new-quote"
            >
              Nuevo Cálculo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
