import { useState } from "react";
import { MapPin, Truck, Calculator, Loader2, Info, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Pricing rules based on user specifications
const pricingZones = [
  { id: 1, name: "Local", country: "España", minKm: 0, maxKm: 10, basePrice: 15, pricePerKm: 0.80, tollSurcharge: 0, minPrice: 15 },
  { id: 2, name: "Local Extendido", country: "España", minKm: 10, maxKm: 50, basePrice: 25, pricePerKm: 0.75, tollSurcharge: 0, minPrice: 25 },
  { id: 3, name: "Regional", country: "España", minKm: 50, maxKm: 200, basePrice: 60, pricePerKm: 0.65, tollSurcharge: 0, minPrice: 60 },
  { id: 4, name: "Inter-regional", country: "España", minKm: 200, maxKm: 800, basePrice: 200, pricePerKm: 0.50, tollSurcharge: 10, minPrice: 120 },
  { id: 5, name: "Internacional Portugal", country: "Portugal", minKm: 0, maxKm: 800, basePrice: 220, pricePerKm: 0.60, tollSurcharge: 15, minPrice: 140 },
  { id: 6, name: "Internacional Francia", country: "Francia", minKm: 0, maxKm: 800, basePrice: 240, pricePerKm: 0.65, tollSurcharge: 20, minPrice: 160 },
];

// todo: remove mock functionality - replace with actual vehicle types from API
const vehicleTypes = [
  { id: "van", name: "Furgoneta", capacity: "800kg / 8m³", multiplier: 1.0 },
  { id: "truck-small", name: "Camión Pequeño (3.5t)", capacity: "3.5t / 20m³", multiplier: 1.15 },
  { id: "truck-medium", name: "Camión Mediano (7.5t)", capacity: "7.5t / 40m³", multiplier: 1.35 },
  { id: "truck-large", name: "Camión Grande (12t)", capacity: "12t / 60m³", multiplier: 1.55 },
  { id: "trailer", name: "Tráiler (24t)", capacity: "24t / 90m³", multiplier: 1.85 },
];

interface QuoteBreakdown {
  origin: string;
  destination: string;
  distance: number;
  duration: number;
  zone: typeof pricingZones[0];
  vehicleType: typeof vehicleTypes[0];
  basePrice: number;
  distanceCost: number;
  tollCost: number;
  vehicleMultiplier: number;
  subtotal: number;
  extras: { name: string; cost: number }[];
  totalPrice: number;
}

export function QuoteCalculatorAdvanced() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [destinationCountry, setDestinationCountry] = useState("España");
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<QuoteBreakdown | null>(null);
  const [extras, setExtras] = useState({
    urgente: false,
    cargaFragil: false,
    seguroExtra: false,
  });

  const getZoneForDistance = (distance: number, country: string) => {
    if (country === "Portugal") {
      return pricingZones.find(z => z.country === "Portugal");
    }
    if (country === "Francia") {
      return pricingZones.find(z => z.country === "Francia");
    }
    return pricingZones.find(z => 
      z.country === "España" && distance >= z.minKm && distance < z.maxKm
    ) || pricingZones[3];
  };

  const calculateQuote = async () => {
    if (!origin || !destination || !vehicleType) return;
    
    setIsCalculating(true);
    console.log("Calculating quote for:", { origin, destination, vehicleType, destinationCountry });
    
    // todo: remove mock functionality - replace with actual OpenRouteService API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const vehicle = vehicleTypes.find((v) => v.id === vehicleType)!;
    const mockDistance = destinationCountry === "España" 
      ? 50 + Math.random() * 300 
      : 200 + Math.random() * 400;
    const distance = Math.round(mockDistance);
    const duration = distance * 1.1;
    
    const zone = getZoneForDistance(distance, destinationCountry)!;
    
    const basePrice = zone.basePrice;
    const distanceCost = distance * zone.pricePerKm;
    const subtotalBeforeTolls = basePrice + distanceCost;
    const tollCost = zone.tollSurcharge > 0 ? subtotalBeforeTolls * (zone.tollSurcharge / 100) : 0;
    const vehicleMultipliedCost = (subtotalBeforeTolls + tollCost) * vehicle.multiplier;
    
    const extrasList: { name: string; cost: number }[] = [];
    if (extras.urgente) extrasList.push({ name: "Envío Urgente (+25%)", cost: vehicleMultipliedCost * 0.25 });
    if (extras.cargaFragil) extrasList.push({ name: "Carga Frágil (+10%)", cost: vehicleMultipliedCost * 0.10 });
    if (extras.seguroExtra) extrasList.push({ name: "Seguro Extra", cost: 35 });
    
    const extrasCost = extrasList.reduce((sum, e) => sum + e.cost, 0);
    let totalPrice = vehicleMultipliedCost + extrasCost;
    
    if (totalPrice < zone.minPrice * vehicle.multiplier) {
      totalPrice = zone.minPrice * vehicle.multiplier;
    }
    
    const quote: QuoteBreakdown = {
      origin,
      destination,
      distance,
      duration: Math.round(duration),
      zone,
      vehicleType: vehicle,
      basePrice,
      distanceCost,
      tollCost,
      vehicleMultiplier: vehicle.multiplier,
      subtotal: subtotalBeforeTolls,
      extras: extrasList,
      totalPrice: Math.round(totalPrice * 100) / 100,
    };
    
    setResult(quote);
    setIsCalculating(false);
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
    setVehicleType("");
    setExtras({ urgente: false, cargaFragil: false, seguroExtra: false });
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

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>País de Destino</Label>
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
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger data-testid="select-vehicle-type">
                  <Truck className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Selecciona un vehículo" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypes.map((v) => (
                    <SelectItem key={v.id} value={v.id} data-testid={`option-vehicle-${v.id}`}>
                      <div className="flex flex-col">
                        <span>{v.name}</span>
                        <span className="text-xs text-muted-foreground">{v.capacity}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            disabled={!origin || !destination || !vehicleType || isCalculating}
            className="w-full"
            size="lg"
            data-testid="button-calculate-quote"
          >
            {isCalculating ? (
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
                Zona {result.zone.id}: {result.zone.name}
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
                      <p className="font-medium" data-testid="text-origin">{result.origin}</p>
                      <p className="font-medium" data-testid="text-destination">{result.destination}</p>
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
                  <p className="font-medium">{result.vehicleType.name}</p>
                  <p className="text-sm text-muted-foreground">{result.vehicleType.capacity}</p>
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
                    <span className="font-mono">{result.basePrice.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Distancia ({result.distance}km × {result.zone.pricePerKm.toFixed(2)}€)
                    </span>
                    <span className="font-mono">{result.distanceCost.toFixed(2)}€</span>
                  </div>
                  {result.tollCost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Peajes (+{result.zone.tollSurcharge}%)
                      </span>
                      <span className="font-mono">{result.tollCost.toFixed(2)}€</span>
                    </div>
                  )}
                  {result.vehicleMultiplier !== 1 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Multiplicador vehículo (×{result.vehicleMultiplier.toFixed(2)})
                      </span>
                      <span className="font-mono text-muted-foreground">aplicado</span>
                    </div>
                  )}
                  
                  {result.extras.length > 0 && (
                    <>
                      <div className="border-t my-2" />
                      {result.extras.map((extra, i) => (
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
                        {result.totalPrice.toFixed(2)}€
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Precio mínimo: {(result.zone.minPrice * result.vehicleMultiplier).toFixed(2)}€
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
