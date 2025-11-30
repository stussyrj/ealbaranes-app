import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MapPin, Truck, Calculator, Loader2, Info, Receipt, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import type { VehicleType } from "@shared/schema";

interface QuoteBreakdown {
  origin: {
    address: string;
    coords: { lat: number; lng: number };
    label: string;
  };
  destination: {
    address: string;
    coords: { lat: number; lng: number };
    label: string;
  };
  distance: number;
  duration: number;
  zone: {
    id: string;
    zone: number;
    name: string;
    country: string;
  };
  vehicle: {
    id: string;
    name: string;
    capacity: string;
    multiplier: number;
  };
  pricing: {
    basePrice: number;
    distanceCost: number;
    pricePerKm: number;
    tollSurcharge: number;
    tollCost: number;
    vehicleMultiplier: number;
    subtotal: number;
    extras: { name: string; cost: number }[];
    extrasCost: number;
    minimumPrice: number;
    totalPrice: number;
  };
}

interface QuoteResponse {
  quote: object;
  breakdown: QuoteBreakdown;
}

export function QuoteCalculatorAdvanced() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleTypeId, setVehicleTypeId] = useState("");
  const [destinationCountry, setDestinationCountry] = useState("España");
  const [result, setResult] = useState<QuoteBreakdown | null>(null);
  const [extras, setExtras] = useState({
    urgente: false,
    cargaFragil: false,
    seguroExtra: false,
  });

  const { data: vehicleTypes, isLoading: isLoadingVehicles } = useQuery<VehicleType[]>({
    queryKey: ["/api/vehicle-types"],
  });

  const calculateMutation = useMutation({
    mutationFn: async (data: {
      origin: string;
      destination: string;
      vehicleTypeId: string;
      destinationCountry: string;
      extras: typeof extras;
    }) => {
      const response = await apiRequest("POST", "/api/calculate-quote", data);
      return response.json() as Promise<QuoteResponse>;
    },
    onSuccess: (data) => {
      setResult(data.breakdown);
    },
  });

  const calculateQuote = () => {
    if (!origin || !destination || !vehicleTypeId) return;
    calculateMutation.mutate({
      origin,
      destination,
      vehicleTypeId,
      destinationCountry,
      extras,
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}min`;
  };

  const resetForm = () => {
    setResult(null);
    setOrigin("");
    setDestination("");
    setVehicleTypeId("");
    setExtras({ urgente: false, cargaFragil: false, seguroExtra: false });
    calculateMutation.reset();
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
          {calculateMutation.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {(calculateMutation.error as Error)?.message || "Error al calcular el presupuesto. Verifica las direcciones e intenta de nuevo."}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="origin">Dirección de Origen</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />
                <Input
                  id="origin"
                  placeholder="Ej: Calle Mayor 1, Madrid, España"
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
                  placeholder="Ej: Avenida Diagonal 100, Barcelona, España"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="pl-10"
                  data-testid="input-destination"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>País de Destino (referencia)</Label>
              <Select value={destinationCountry} onValueChange={setDestinationCountry}>
                <SelectTrigger data-testid="select-country">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="España">España</SelectItem>
                  <SelectItem value="Portugal">Portugal</SelectItem>
                  <SelectItem value="Francia">Francia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Vehículo</Label>
              {isLoadingVehicles ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={vehicleTypeId} onValueChange={setVehicleTypeId}>
                  <SelectTrigger data-testid="select-vehicle-type">
                    <Truck className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Selecciona un vehículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleTypes?.map((v) => (
                      <SelectItem key={v.id} value={v.id} data-testid={`option-vehicle-${v.id}`}>
                        <div className="flex flex-col">
                          <span>{v.name}</span>
                          <span className="text-xs text-muted-foreground">{v.capacity}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Extras Opcionales</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="urgente"
                  checked={extras.urgente}
                  onCheckedChange={(checked) => setExtras({ ...extras, urgente: !!checked })}
                  data-testid="checkbox-urgente"
                />
                <label htmlFor="urgente" className="text-sm cursor-pointer">
                  Envío Urgente (+25%)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cargaFragil"
                  checked={extras.cargaFragil}
                  onCheckedChange={(checked) => setExtras({ ...extras, cargaFragil: !!checked })}
                  data-testid="checkbox-fragil"
                />
                <label htmlFor="cargaFragil" className="text-sm cursor-pointer">
                  Carga Frágil (+10%)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="seguroExtra"
                  checked={extras.seguroExtra}
                  onCheckedChange={(checked) => setExtras({ ...extras, seguroExtra: !!checked })}
                  data-testid="checkbox-seguro"
                />
                <label htmlFor="seguroExtra" className="text-sm cursor-pointer">
                  Seguro Extra (+35€)
                </label>
              </div>
            </div>
          </div>

          <Button
            onClick={calculateQuote}
            disabled={!origin || !destination || !vehicleTypeId || calculateMutation.isPending}
            className="w-full"
            size="lg"
            data-testid="button-calculate-quote"
          >
            {calculateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculando ruta con OpenRouteService...
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

      {result && (
        <Card className="border-primary/50">
          <CardHeader className="bg-primary/5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Receipt className="h-5 w-5" />
                Presupuesto Generado
              </CardTitle>
              <Badge variant="secondary" className="text-sm">
                Zona {result.zone.zone}: {result.zone.name}
              </Badge>
            </div>
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
                    <div className="space-y-2">
                      <p className="font-medium" data-testid="text-origin">{result.origin.label}</p>
                      <p className="font-medium" data-testid="text-destination">{result.destination.label}</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Distancia</p>
                    <p className="text-2xl font-semibold font-mono" data-testid="text-distance">
                      {result.distance} km
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Duración Est.</p>
                    <p className="text-2xl font-semibold font-mono" data-testid="text-duration">
                      {formatDuration(result.duration)}
                    </p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Vehículo</p>
                  <p className="font-medium">{result.vehicle.name}</p>
                  <p className="text-sm text-muted-foreground">{result.vehicle.capacity}</p>
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
                      <p>Precio calculado según la zona y tipo de vehículo</p>
                    </TooltipContent>
                  </Tooltip>
                </h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tarifa base ({result.zone.name})</span>
                    <span className="font-mono">{result.pricing.basePrice.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Distancia ({result.distance}km × {result.pricing.pricePerKm.toFixed(2)}€)
                    </span>
                    <span className="font-mono">{result.pricing.distanceCost.toFixed(2)}€</span>
                  </div>
                  {result.pricing.tollCost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Peajes (+{result.pricing.tollSurcharge}%)
                      </span>
                      <span className="font-mono">{result.pricing.tollCost.toFixed(2)}€</span>
                    </div>
                  )}
                  {result.pricing.vehicleMultiplier !== 1 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Multiplicador vehículo (×{result.pricing.vehicleMultiplier.toFixed(2)})
                      </span>
                      <span className="font-mono text-muted-foreground">aplicado</span>
                    </div>
                  )}
                  
                  {result.pricing.extras.length > 0 && (
                    <>
                      <div className="border-t my-2" />
                      {result.pricing.extras.map((extra, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="text-muted-foreground">{extra.name}</span>
                          <span className="font-mono">{extra.cost.toFixed(2)}€</span>
                        </div>
                      ))}
                    </>
                  )}
                  
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-base">Total</span>
                      <span className="text-3xl font-bold font-mono text-primary" data-testid="text-total-price">
                        {result.pricing.totalPrice.toFixed(2)}€
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Precio mínimo: {result.pricing.minimumPrice.toFixed(2)}€
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
