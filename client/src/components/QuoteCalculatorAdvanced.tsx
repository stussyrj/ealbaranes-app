import { useState, useEffect } from "react";
import { MapPin, Calculator, Loader2, Info, Receipt, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import type { VehicleType } from "@shared/schema";

export function QuoteCalculatorAdvanced() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleTypeId, setVehicleTypeId] = useState("");
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [resultData, setResultData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const response = await fetch("/api/vehicle-types", { credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          setVehicleTypes(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("Error loading vehicles:", e);
      } finally {
        setIsLoadingVehicles(false);
      }
    };
    loadVehicles();
  }, []);

  const handleCalculate = async () => {
    if (!origin.trim() || !destination.trim() || !vehicleTypeId) return;
    
    setIsLoading(true);
    setErrorMsg("");
    setResultData(null);

    try {
      const response = await fetch("/api/calculate-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: origin.trim(),
          destination: destination.trim(),
          vehicleTypeId,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Error al calcular el presupuesto");
      }

      const data = await response.json();
      if (data && data.breakdown) {
        setResultData(data.breakdown);
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Error al calcular el presupuesto");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResultData(null);
    setOrigin("");
    setDestination("");
    setVehicleTypeId("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Calculadora de Presupuesto
          </CardTitle>
          <CardDescription>
            Introduce origen, destino y tipo de vehículo para calcular el presupuesto automáticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {errorMsg && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="origin">Dirección de Origen</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />
                <Input
                  id="origin"
                  placeholder="Ej: Calle Mayor 1, Madrid"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="pl-10"
                  data-testid="input-origin"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Dirección de Destino</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-600" />
                <Input
                  id="destination"
                  placeholder="Ej: Avenida Diagonal 100, Barcelona"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="pl-10"
                  data-testid="input-destination"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicle">Tipo de Vehículo</Label>
            {isLoadingVehicles ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <select
                id="vehicle"
                value={vehicleTypeId}
                onChange={(e) => setVehicleTypeId(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                data-testid="select-vehicle-type"
              >
                <option value="">Selecciona un vehículo</option>
                {vehicleTypes.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <Button
            onClick={handleCalculate}
            disabled={!origin || !destination || !vehicleTypeId || isLoading}
            className="w-full"
            size="lg"
            data-testid="button-calculate-quote"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculando...
              </>
            ) : (
              <>
                <Calculator className="mr-2 h-4 w-4" />
                Calcular Presupuesto
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {resultData && (
        <Card className="border-primary/50">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Receipt className="h-5 w-5" />
              Presupuesto Generado
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Ruta</p>
                  <div className="flex items-start gap-2 mt-1">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <div className="w-0.5 h-8 bg-border" />
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                    </div>
                    <div className="space-y-2 min-w-0">
                      <p className="font-medium truncate" data-testid="text-origin">
                        {resultData?.origin?.label || "Origen"}
                      </p>
                      <p className="font-medium truncate" data-testid="text-destination">
                        {resultData?.destination?.label || "Destino"}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Distancia</p>
                    <p className="text-2xl font-semibold font-mono" data-testid="text-distance">
                      {Number(resultData?.distance || 0).toFixed(1)} km
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Duración</p>
                    <p className="text-2xl font-semibold font-mono" data-testid="text-duration">
                      {resultData?.duration ? `${Math.floor(resultData.duration / 60)}h ${Math.round(resultData.duration % 60)}min` : "—"}
                    </p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Vehículo</p>
                  <p className="font-medium">{resultData?.vehicle?.name || "—"}</p>
                  <p className="text-sm text-muted-foreground">{resultData?.vehicle?.capacity || ""}</p>
                </div>
              </div>

              <div className="space-y-4 p-4 bg-card border rounded-lg">
                <h4 className="font-semibold flex items-center gap-2">
                  Desglose de Precio
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Precio = max(Mínimo, Dirección + (km × €/km))</p>
                    </TooltipContent>
                  </Tooltip>
                </h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dirección</span>
                    <span className="font-mono">{Number(resultData?.pricing?.basePrice || 0).toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Distancia ({Number(resultData?.distance || 0).toFixed(1)} km × {Number(resultData?.pricing?.pricePerKm || 0).toFixed(2)}€/km)
                    </span>
                    <span className="font-mono">{Number(resultData?.pricing?.distanceCost || 0).toFixed(2)}€</span>
                  </div>
                  
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total</span>
                      <span className="text-3xl font-bold font-mono text-primary" data-testid="text-total-price">
                        {Number(resultData?.pricing?.totalPrice || 0).toFixed(2)}€
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Mínimo: {Number(resultData?.pricing?.minimumPrice || 0).toFixed(2)}€
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 flex-wrap">
              <Button data-testid="button-save-quote">
                Guardar Presupuesto
              </Button>
              <Button variant="outline" data-testid="button-print-quote">
                Imprimir / PDF
              </Button>
              <Button variant="outline" onClick={handleReset} data-testid="button-new-quote">
                Nuevo Cálculo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
