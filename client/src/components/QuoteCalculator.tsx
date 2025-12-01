import { useState } from "react";
import { MapPin, Truck, Calculator, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// todo: remove mock functionality - replace with actual vehicle types from API
const vehicleTypes = [
  { id: "van", name: "Furgoneta", pricePerKm: 0.85 },
  { id: "truck-small", name: "Camión Pequeño (3.5t)", pricePerKm: 1.20 },
  { id: "truck-medium", name: "Camión Mediano (7.5t)", pricePerKm: 1.65 },
  { id: "truck-large", name: "Camión Grande (12t)", pricePerKm: 2.10 },
  { id: "trailer", name: "Tráiler (24t)", pricePerKm: 2.85 },
];

interface QuoteResult {
  origin: string;
  destination: string;
  distance: number;
  duration: number;
  vehicleType: string;
  basePrice: number;
  pricePerKm: number;
  totalPrice: number;
}

interface QuoteCalculatorProps {
  onQuoteGenerated?: (quote: QuoteResult) => void;
}

export function QuoteCalculator({ onQuoteGenerated }: QuoteCalculatorProps) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<QuoteResult | null>(null);

  const handleCalculate = async () => {
    if (!origin || !destination || !vehicleType) return;
    
    setIsCalculating(true);
    console.log("Calculating quote for:", { origin, destination, vehicleType });
    
    // todo: remove mock functionality - replace with actual OpenRouteService API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const vehicle = vehicleTypes.find((v) => v.id === vehicleType);
    const mockDistance = 150 + Math.random() * 200;
    const mockDuration = mockDistance * 1.2;
    const basePrice = 25;
    const distancePrice = mockDistance * (vehicle?.pricePerKm || 1);
    
    const quote: QuoteResult = {
      origin,
      destination,
      distance: Math.round(mockDistance),
      duration: Math.round(mockDuration),
      vehicleType: vehicle?.name || "",
      basePrice,
      pricePerKm: vehicle?.pricePerKm || 1,
      totalPrice: Math.round((basePrice + distancePrice) * 100) / 100,
    };
    
    setResult(quote);
    setIsCalculating(false);
    onQuoteGenerated?.(quote);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}min`;
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
            Introduce las direcciones de origen y destino para calcular el presupuesto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="origin">Dirección de Origen</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
            <Select value={vehicleType} onValueChange={setVehicleType}>
              <SelectTrigger data-testid="select-vehicle-type">
                <Truck className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Selecciona un tipo de vehículo" />
              </SelectTrigger>
              <SelectContent>
                {vehicleTypes.map((v) => (
                  <SelectItem key={v.id} value={v.id} data-testid={`option-vehicle-${v.id}`}>
                    {v.name} - {v.pricePerKm.toFixed(2)}€/km
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleCalculate}
            disabled={!origin || !destination || !vehicleType || isCalculating}
            className="w-full bg-blue-600/85 hover:bg-blue-700/85 dark:bg-blue-600/85 dark:hover:bg-blue-700/85 text-white text-lg px-10 py-6 rounded-lg backdrop-blur-sm border border-blue-500/40"
            data-testid="button-calculate-quote"
          >
            {isCalculating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculando ruta...
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
            <CardTitle className="text-xl">Resultado del Presupuesto</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Ruta</p>
                  <p className="font-medium" data-testid="text-route">
                    {result.origin} → {result.destination}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Distancia</p>
                    <p className="text-xl font-semibold font-mono" data-testid="text-distance">
                      {result.distance} km
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duración Estimada</p>
                    <p className="text-xl font-semibold font-mono" data-testid="text-duration">
                      {formatDuration(result.duration)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vehículo</p>
                  <p className="font-medium">{result.vehicleType}</p>
                </div>
              </div>

              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium">Desglose de Precio</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tarifa base</span>
                    <span className="font-mono">{result.basePrice.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Distancia ({result.distance}km × {result.pricePerKm.toFixed(2)}€)
                    </span>
                    <span className="font-mono">
                      {(result.distance * result.pricePerKm).toFixed(2)}€
                    </span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-base">Total</span>
                      <span className="text-2xl font-bold font-mono text-primary" data-testid="text-total-price">
                        {result.totalPrice.toFixed(2)}€
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 flex-wrap">
              <Button className="bg-green-600/85 hover:bg-green-700/85 dark:bg-green-600/85 dark:hover:bg-green-700/85 text-white px-4 py-2 rounded-lg backdrop-blur-sm border border-green-500/40" data-testid="button-save-quote">
                Guardar Presupuesto
              </Button>
              <Button variant="outline" className="px-4 py-2 rounded-lg backdrop-blur-sm border border-slate-300 dark:border-slate-600" data-testid="button-new-quote" onClick={() => setResult(null)}>
                Nuevo Cálculo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
