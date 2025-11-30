import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Calculator, Loader2, Info, Receipt, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import type { VehicleType } from "@shared/schema";

interface QuoteResult {
  origin?: {
    label?: string;
  };
  destination?: {
    label?: string;
  };
  distance?: number;
  duration?: number;
  vehicle?: {
    name?: string;
    capacity?: string;
  };
  pricing?: {
    basePrice?: number;
    pricePerKm?: number;
    distanceCost?: number;
    minimumPrice?: number;
    totalPrice?: number;
  };
}

export function QuoteCalculatorAdvanced() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleTypeId, setVehicleTypeId] = useState("");
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { data: vehicleTypes = [], isLoading: isLoadingVehicles } = useQuery<VehicleType[]>({
    queryKey: ["/api/vehicle-types"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/vehicle-types", {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to load vehicle types");
        const json = await response.json();
        return Array.isArray(json) ? json : [];
      } catch (e) {
        console.error("Error loading vehicle types:", e);
        return [];
      }
    },
  });

  const calculateQuote = async () => {
    if (!origin || !destination || !vehicleTypeId) return;
    
    try {
      setIsLoading(true);
      setErrorMsg("");
      setResult(null);

      const response = await fetch("/api/calculate-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: String(origin).trim(),
          destination: String(destination).trim(),
          vehicleTypeId: String(vehicleTypeId).trim(),
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Error al calcular el presupuesto");
      }

      const data = await response.json();
      
      if (data && typeof data === "object" && data.breakdown) {
        setResult(data.breakdown || {});
      } else {
        throw new Error("Respuesta inválida del servidor");
      }
    } catch (error: any) {
      console.error("Error al calcular presupuesto:", error);
      setErrorMsg(String(error?.message || "Error al calcular el presupuesto"));
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (minutes: number | undefined): string => {
    if (typeof minutes !== "number" || isNaN(minutes) || !minutes) return "—";
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}min`;
  };

  const getOriginLabel = (): string => {
    if (!result) return "—";
    return String(result?.origin?.label || "Origen");
  };

  const getDestinationLabel = (): string => {
    if (!result) return "—";
    return String(result?.destination?.label || "Destino");
  };

  const getDistance = (): number => {
    if (!result) return 0;
    const val = Number(result?.distance);
    return isNaN(val) ? 0 : val;
  };

  const getDuration = (): number | undefined => {
    if (!result) return undefined;
    const val = Number(result?.duration);
    return isNaN(val) ? undefined : val;
  };

  const getVehicleName = (): string => {
    if (!result) return "—";
    return String(result?.vehicle?.name || "Vehículo");
  };

  const getVehicleCapacity = (): string => {
    if (!result) return "—";
    return String(result?.vehicle?.capacity || "");
  };

  const getBasePrice = (): number => {
    if (!result) return 0;
    const val = Number(result?.pricing?.basePrice);
    return isNaN(val) ? 0 : val;
  };

  const getPricePerKm = (): number => {
    if (!result) return 0;
    const val = Number(result?.pricing?.pricePerKm);
    return isNaN(val) ? 0 : val;
  };

  const getDistanceCost = (): number => {
    if (!result) return 0;
    const val = Number(result?.pricing?.distanceCost);
    return isNaN(val) ? 0 : val;
  };

  const getMinimumPrice = (): number => {
    if (!result) return 0;
    const val = Number(result?.pricing?.minimumPrice);
    return isNaN(val) ? 0 : val;
  };

  const getTotalPrice = (): number => {
    if (!result) return 0;
    const val = Number(result?.pricing?.totalPrice);
    return isNaN(val) ? 0 : val;
  };

  const resetForm = () => {
    setResult(null);
    setOrigin("");
    setDestination("");
    setVehicleTypeId("");
    setErrorMsg("");
  };

  const selectedVehicle = vehicleTypes?.find(v => v?.id === vehicleTypeId);

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
                {vehicleTypes && Array.isArray(vehicleTypes) && vehicleTypes.map((v) => (
                  <option key={String(v?.id || "")} value={String(v?.id || "")}>
                    {String(v?.name || "Vehículo")}
                  </option>
                ))}
              </select>
            )}
            {selectedVehicle && (
              <p className="text-sm text-muted-foreground">Capacidad: {String(selectedVehicle?.capacity || "—")}</p>
            )}
          </div>

          <Button
            onClick={calculateQuote}
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

      {result && Object.keys(result).length > 0 && (
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
                        {getOriginLabel()}
                      </p>
                      <p className="font-medium truncate" data-testid="text-destination">
                        {getDestinationLabel()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Distancia</p>
                    <p className="text-2xl font-semibold font-mono" data-testid="text-distance">
                      {getDistance().toFixed(1)} km
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Duración</p>
                    <p className="text-2xl font-semibold font-mono" data-testid="text-duration">
                      {formatDuration(getDuration())}
                    </p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Vehículo</p>
                  <p className="font-medium">{getVehicleName()}</p>
                  <p className="text-sm text-muted-foreground">{getVehicleCapacity()}</p>
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
                    <span className="font-mono">{getBasePrice().toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Distancia ({getDistance().toFixed(1)} km × {getPricePerKm().toFixed(2)}€/km)
                    </span>
                    <span className="font-mono">{getDistanceCost().toFixed(2)}€</span>
                  </div>
                  
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total</span>
                      <span className="text-3xl font-bold font-mono text-primary" data-testid="text-total-price">
                        {getTotalPrice().toFixed(2)}€
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Mínimo: {getMinimumPrice().toFixed(2)}€
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
              <Button variant="outline" onClick={resetForm} data-testid="button-new-quote">
                Nuevo Cálculo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
