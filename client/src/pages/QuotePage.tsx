import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function QuotePage() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vehicle-types", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setVehicles(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const calculate = async () => {
    const res = await fetch("/api/calculate-quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin, destination, vehicleTypeId: vehicleId }),
      credentials: "include",
    });
    const data = await res.json();
    if (data && data.breakdown) setResult(data.breakdown);
  };

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
              placeholder="Ej: Madrid"
              data-testid="input-origin"
            />
          </div>
          <div>
            <Label>Destino</Label>
            <Input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Ej: Barcelona"
              data-testid="input-destination"
            />
          </div>
          <div>
            <Label>Vehículo</Label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full px-3 py-2 border rounded bg-white dark:bg-slate-900 text-black dark:text-white border-gray-300 dark:border-gray-600"
              data-testid="select-vehicle-type"
              disabled={loading}
            >
              <option value="">Selecciona</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={calculate} className="w-full" data-testid="button-calculate-quote">
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
                <p className="font-medium" data-testid="text-distance">
                  {(result.distance || 0).toFixed(1)} km
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vehículo</p>
                <p className="font-medium">{result.vehicle?.name || "—"}</p>
              </div>
            </div>
            <div className="border-t pt-3 space-y-1">
              <div className="flex justify-between">
                <span>Tarifa:</span>
                <span>{(result.pricing?.basePrice || 0).toFixed(2)}€</span>
              </div>
              <div className="flex justify-between">
                <span>Distancia:</span>
                <span>{(result.pricing?.distanceCost || 0).toFixed(2)}€</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
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
              Nuevo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
