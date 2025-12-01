import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { Truck } from "lucide-react";
import { VanDoorsAnimation } from "@/components/VanDoorsAnimation";
import { AnimatedPageBackground } from "@/components/AnimatedPageBackground";

export default function QuotePage() {
  const [name, setName] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [pickupTime, setPickupTime] = useState("");
  const [observations, setObservations] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [quoteId, setQuoteId] = useState<string>("");
  const [showAnimation, setShowAnimation] = useState(true);
  const [lastCalculatedData, setLastCalculatedData] = useState<any>(null);
  const [recalculateTimer, setRecalculateTimer] = useState<NodeJS.Timeout | null>(null);
  const [carrozadoUnavailableUntil, setCarrozadoUnavailableUntil] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedHour, setSelectedHour] = useState("09");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [showCalendar, setShowCalendar] = useState(false);
  const [originSuggestions, setOriginSuggestions] = useState<any[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<any[]>([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  const [suggestionTimer, setSuggestionTimer] = useState<NodeJS.Timeout | null>(null);
  const [hideSuggestionsTimer, setHideSuggestionsTimer] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const hasSeenAnimation = sessionStorage.getItem("hasSeenClientAnimation");
    if (hasSeenAnimation) {
      setShowAnimation(false);
    }
  }, []);

  return (
    <div className="relative">
      <AnimatedPageBackground />
      <QuotePageContent
        name={name}
        setName={setName}
        origin={origin}
        setOrigin={setOrigin}
        destination={destination}
        setDestination={setDestination}
        vehicleId={vehicleId}
        setVehicleId={setVehicleId}
        isUrgent={isUrgent}
        setIsUrgent={setIsUrgent}
        pickupTime={pickupTime}
        setPickupTime={setPickupTime}
        observations={observations}
        setObservations={setObservations}
        phoneNumber={phoneNumber}
        setPhoneNumber={setPhoneNumber}
        vehicles={vehicles}
        setVehicles={setVehicles}
        result={result}
        setResult={setResult}
        loading={loading}
        setLoading={setLoading}
        confirmed={confirmed}
        setConfirmed={setConfirmed}
        quoteId={quoteId}
        setQuoteId={setQuoteId}
        showAnimation={showAnimation}
        setShowAnimation={setShowAnimation}
        lastCalculatedData={lastCalculatedData}
        setLastCalculatedData={setLastCalculatedData}
        recalculateTimer={recalculateTimer}
        setRecalculateTimer={setRecalculateTimer}
        carrozadoUnavailableUntil={carrozadoUnavailableUntil}
        setCarrozadoUnavailableUntil={setCarrozadoUnavailableUntil}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedHour={selectedHour}
        setSelectedHour={setSelectedHour}
        selectedMinute={selectedMinute}
        setSelectedMinute={setSelectedMinute}
        showCalendar={showCalendar}
        setShowCalendar={setShowCalendar}
        originSuggestions={originSuggestions}
        setOriginSuggestions={setOriginSuggestions}
        destSuggestions={destSuggestions}
        setDestSuggestions={setDestSuggestions}
        showOriginSuggestions={showOriginSuggestions}
        setShowOriginSuggestions={setShowOriginSuggestions}
        showDestSuggestions={showDestSuggestions}
        setShowDestSuggestions={setShowDestSuggestions}
        suggestionTimer={suggestionTimer}
        setSuggestionTimer={setSuggestionTimer}
        hideSuggestionsTimer={hideSuggestionsTimer}
        setHideSuggestionsTimer={setHideSuggestionsTimer}
        toast={toast}
      />
    </div>
  );
}

function QuotePageContent({
  name, setName, origin, setOrigin, destination, setDestination, vehicleId, setVehicleId,
  isUrgent, setIsUrgent, pickupTime, setPickupTime, observations, setObservations, phoneNumber, setPhoneNumber,
  vehicles, setVehicles, result, setResult, loading, setLoading, confirmed, setConfirmed, quoteId, setQuoteId,
  showAnimation, setShowAnimation, lastCalculatedData, setLastCalculatedData, recalculateTimer, setRecalculateTimer,
  carrozadoUnavailableUntil, setCarrozadoUnavailableUntil, selectedDate, setSelectedDate, selectedHour, setSelectedHour,
  selectedMinute, setSelectedMinute, showCalendar, setShowCalendar, originSuggestions, setOriginSuggestions,
  destSuggestions, setDestSuggestions, showOriginSuggestions, setShowOriginSuggestions, showDestSuggestions, setShowDestSuggestions,
  suggestionTimer, setSuggestionTimer, hideSuggestionsTimer, setHideSuggestionsTimer, toast
}: any) {

  // Auto-recalculate when key fields change
  useEffect(() => {
    if (result && lastCalculatedData) {
      const keysChanged = 
        origin !== lastCalculatedData.origin ||
        destination !== lastCalculatedData.destination ||
        vehicleId !== lastCalculatedData.vehicleId ||
        isUrgent !== lastCalculatedData.isUrgent ||
        pickupTime !== lastCalculatedData.pickupTime ||
        observations !== lastCalculatedData.observations;

      if (keysChanged) {
        // Clear previous timer if exists
        if (recalculateTimer) clearTimeout(recalculateTimer);
        
        // Set new timer for auto-recalculate
        const timer = setTimeout(() => {
          if (name && phoneNumber && origin && destination && vehicleId && selectedDate) {
            handleCalculate();
          }
        }, 1000);
        
        setRecalculateTimer(timer);
      }
    }

    return () => {
      if (recalculateTimer) clearTimeout(recalculateTimer);
    };
  }, [origin, destination, vehicleId, isUrgent, pickupTime, observations, result, lastCalculatedData, selectedDate, selectedHour, selectedMinute, name, phoneNumber]);

  if (vehicles.length === 0 && !loading) {
    setLoading(true);
    fetch("/api/vehicle-types", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.types && Array.isArray(d.types)) {
          setVehicles(d.types);
        } else if (Array.isArray(d)) {
          setVehicles(d);
        }
        if (d.carrozadoUnavailableUntil) {
          setCarrozadoUnavailableUntil(new Date(d.carrozadoUnavailableUntil));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  const getMinimumPickupDate = (): Date => {
    const now = new Date();
    return new Date(now.getTime() + 30 * 60000);
  };

  const validatePickupTime = (date: Date | undefined, hour: string, minute: string): string => {
    if (!date) return "Por favor, selecciona una fecha";
    const now = new Date();
    const minimumTime = getMinimumPickupDate();
    const selectedDate = new Date(date);
    selectedDate.setHours(parseInt(hour), parseInt(minute), 0);
    
    if (selectedDate.getTime() < minimumTime.getTime()) {
      const minHours = String(minimumTime.getHours()).padStart(2, "0");
      const minMinutes = String(minimumTime.getMinutes()).padStart(2, "0");
      return `El horario debe ser a partir de las ${minHours}:${minMinutes}`;
    }
    return "";
  };

  const isCarrozadoAvailableAtTime = (hour: string, minute: string): boolean => {
    if (!carrozadoUnavailableUntil || vehicleId !== "carrozado") return true;
    if (!selectedDate) return true;
    const selectedTime = new Date(selectedDate);
    selectedTime.setHours(parseInt(hour), parseInt(minute), 0);
    return selectedTime >= new Date(carrozadoUnavailableUntil);
  };

  const fetchAddressSuggestions = async (input: string, type: "origin" | "destination") => {
    if (!input || input.length < 2) {
      if (type === "origin") {
        setOriginSuggestions([]);
        setShowOriginSuggestions(false);
      } else {
        setDestSuggestions([]);
        setShowDestSuggestions(false);
      }
      return;
    }

    try {
      const res = await fetch(`/api/address-suggestions?q=${encodeURIComponent(input)}`, { credentials: "include" });
      const suggestions = await res.json();
      // Limit to 3 suggestions with postal codes
      const limited = Array.isArray(suggestions) ? suggestions.slice(0, 3) : [];
      if (type === "origin") {
        setOriginSuggestions(limited);
        setShowOriginSuggestions(limited.length > 0);
        
        // Hide suggestions after 2 seconds of receiving them
        if (hideSuggestionsTimer) clearTimeout(hideSuggestionsTimer);
        const hideTimer = setTimeout(() => {
          setShowOriginSuggestions(false);
        }, 2000);
        setHideSuggestionsTimer(hideTimer);
      } else {
        setDestSuggestions(limited);
        setShowDestSuggestions(limited.length > 0);
        
        // Hide suggestions after 2 seconds of receiving them
        if (hideSuggestionsTimer) clearTimeout(hideSuggestionsTimer);
        const hideTimer = setTimeout(() => {
          setShowDestSuggestions(false);
        }, 2000);
        setHideSuggestionsTimer(hideTimer);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const handleOriginChange = (value: string) => {
    setOrigin(value);
    setShowOriginSuggestions(true);
    if (suggestionTimer) clearTimeout(suggestionTimer);
    
    const timer = setTimeout(() => {
      fetchAddressSuggestions(value, "origin");
    }, 300);
    setSuggestionTimer(timer);
  };

  const handleDestinationChange = (value: string) => {
    setDestination(value);
    setShowDestSuggestions(true);
    if (suggestionTimer) clearTimeout(suggestionTimer);
    
    const timer = setTimeout(() => {
      fetchAddressSuggestions(value, "destination");
    }, 300);
    setSuggestionTimer(timer);
  };

  const selectSuggestion = (suggestion: any, type: "origin" | "destination") => {
    if (type === "origin") {
      setOrigin(suggestion.label);
      setShowOriginSuggestions(false);
      setOriginSuggestions([]);
    } else {
      setDestination(suggestion.label);
      setShowDestSuggestions(false);
      setDestSuggestions([]);
    }
  };

  const handleCalculate = async () => {
    if (!name.trim()) {
      toast({ title: "Campo requerido", description: "Por favor, ingresa tu nombre", variant: "destructive" });
      return;
    }
    if (!phoneNumber.trim()) {
      toast({ title: "Campo requerido", description: "Por favor, ingresa tu teléfono", variant: "destructive" });
      return;
    }
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
    if (!selectedDate) {
      toast({ title: "Campo requerido", description: "Por favor, selecciona una fecha", variant: "destructive" });
      return;
    }
    const timeError = validatePickupTime(selectedDate, selectedHour, selectedMinute);
    if (timeError) {
      toast({ title: "Error en horario", description: timeError, variant: "destructive" });
      return;
    }

    // Check carrozado availability if selected
    if (vehicleId === "carrozado") {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const timeStr = `${selectedHour}:${selectedMinute}`;
      const availRes = await fetch("/api/check-carrozado-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleTypeId: "carrozado", pickupTime: `${dateStr} ${timeStr}` }),
        credentials: "include",
      });
      const availData = await availRes.json();
      if (!availData.available) {
        toast({ title: "No disponible", description: "El carrozado no está disponible en el horario solicitado. Selecciona otro vehículo o contacta con nosotros.", variant: "destructive" });
        return;
      }
    }

    const res = await fetch("/api/calculate-quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phoneNumber, origin, destination, vehicleTypeId: vehicleId, isUrgent, pickupTime: pickupTime || undefined, observations: observations || undefined }),
      credentials: "include",
    });
    const data = await res.json();
    if (data && data.breakdown) {
      setResult(data.breakdown);
      setQuoteId(data.quote.id);
      setConfirmed(false);
      setLastCalculatedData({
        origin,
        destination,
        vehicleId,
        isUrgent,
        pickupTime,
        observations
      });
    }
  };

  const handleConfirm = async () => {
    // Just show success - admin will approve it
    setConfirmed(true);
    setTimeout(() => { handleReset(); }, 4000);
  };

  const handleReset = () => {
    setResult(null);
    setName("");
    setOrigin("");
    setDestination("");
    setVehicleId("");
    setIsUrgent(false);
    setPickupTime("");
    setSelectedDate(undefined);
    setSelectedHour("09");
    setSelectedMinute("00");
    setObservations("");
    setPhoneNumber("");
    setConfirmed(false);
    setQuoteId("");
  };

  const minDate = getMinimumPickupDate();
  const pickupTimeError = validatePickupTime(selectedDate, selectedHour, selectedMinute);
  
  useEffect(() => {
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const timeStr = `${selectedHour}:${selectedMinute}`;
      setPickupTime(`${dateStr} ${timeStr}`);
    }
  }, [selectedDate, selectedHour, selectedMinute]);

  if (showAnimation) {
    return (
      <VanDoorsAnimation
        onComplete={() => {
          sessionStorage.setItem("hasSeenClientAnimation", "true");
          setShowAnimation(false);
        }}
      />
    );
  }

  if (confirmed && result) {
    return (
      <div className="relative p-6 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md relative z-10">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="truck-animation">
                  <Truck className="w-16 h-16 text-slate-600 dark:text-slate-400" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300">¡Solicitud Enviada!</h2>
                <p className="text-foreground">Hemos recibido tu solicitud de presupuesto</p>
                <p className="text-foreground">Nuestro equipo la revisará pronto</p>
                <p className="text-sm text-muted-foreground">Número de solicitud: {quoteId.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative space-y-6 p-6">
      <Card className="mb-6">
        <CardHeader><CardTitle>Solicitar Presupuesto</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Manuel Torres" data-testid="input-name" />
          </div>
          <div>
            <Label>Teléfono de Contacto</Label>
            <Input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Ej: 123 456 789" data-testid="input-phone" />
          </div>
          <div className="relative">
            <Label>Origen</Label>
            <Input 
              value={origin} 
              onChange={(e) => handleOriginChange(e.target.value)} 
              onKeyDown={(e) => {
                if (e.key === "Enter" && origin.trim()) {
                  setShowOriginSuggestions(false);
                  setOriginSuggestions([]);
                }
              }}
              placeholder="Ej: Calle Gran Vía, 45, 28013 Madrid" 
              data-testid="input-origin" 
            />
            {showOriginSuggestions && origin.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                {originSuggestions.length > 0 ? (
                  originSuggestions.map((suggestion, idx) => (
                    <div key={idx} onClick={() => selectSuggestion(suggestion, "origin")} className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer text-sm">
                      {suggestion.label}
                    </div>
                  ))
                ) : (
                  <div onClick={() => { setShowOriginSuggestions(false); setOriginSuggestions([]); }} className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-muted-foreground">
                    Usar: <strong>{origin}</strong>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="relative">
            <Label>Destino</Label>
            <Input 
              value={destination} 
              onChange={(e) => handleDestinationChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && destination.trim()) {
                  setShowDestSuggestions(false);
                  setDestSuggestions([]);
                }
              }}
              placeholder="Ej: Paseo de Gràcia, 120, 08008 Barcelona" 
              data-testid="input-destination" 
            />
            {showDestSuggestions && destination.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                {destSuggestions.length > 0 ? (
                  destSuggestions.map((suggestion, idx) => (
                    <div key={idx} onClick={() => selectSuggestion(suggestion, "destination")} className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer text-sm">
                      {suggestion.label}
                    </div>
                  ))
                ) : (
                  <div onClick={() => { setShowDestSuggestions(false); setDestSuggestions([]); }} className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-muted-foreground">
                    Usar: <strong>{destination}</strong>
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <Label>Vehículo</Label>
            <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="w-full px-3 py-2 border rounded bg-white dark:bg-slate-900 text-black dark:text-white border-slate-200 dark:border-slate-700" data-testid="select-vehicle">
              <option value="">Selecciona</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id} data-testid={`option-vehicle-${v.id}`}>
                  {v.name} - {v.capacity}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Fecha y Horario de Recogida</Label>
            <div className="text-xs text-muted-foreground mb-2">Necesitamos 30 minutos para llegar al origen</div>
            
            <Button 
              variant="outline" 
              onClick={() => setShowCalendar(!showCalendar)}
              className="w-full mb-2 text-left"
              data-testid="button-select-date"
            >
              {selectedDate ? selectedDate.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "Selecciona una fecha"}
            </Button>
            
            {showCalendar && (
              <div className="border rounded-lg p-3 mb-3 bg-white dark:bg-slate-900">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setShowCalendar(false);
                  }}
                  disabled={(date) => date < new Date(minDate.toISOString().split("T")[0])}
                  data-testid="calendar-pickup"
                />
              </div>
            )}
            

            {selectedDate && (
              <div className="flex gap-2 mb-3">
                <div className="flex-1">
                  <Label className="text-xs">Hora</Label>
                  <select 
                    value={selectedHour} 
                    onChange={(e) => setSelectedHour(e.target.value)}
                    className="w-full px-2 py-2 border rounded bg-white dark:bg-slate-900 text-sm"
                    data-testid="select-hour"
                  >
                    {Array.from({ length: 16 }, (_, i) => i + 6).map(h => (
                      <option key={h} value={String(h).padStart(2, "0")}>
                        {String(h).padStart(2, "0")}:00
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <Label className="text-xs">Minuto</Label>
                  <select 
                    value={selectedMinute} 
                    onChange={(e) => setSelectedMinute(e.target.value)}
                    className="w-full px-2 py-2 border rounded bg-white dark:bg-slate-900 text-sm"
                    data-testid="select-minute"
                  >
                    {["00", "15", "30", "45"].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            
            
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
          <Button 
            onClick={handleCalculate} 
            className="w-full bg-blue-900 hover:bg-blue-950 dark:bg-blue-700 dark:hover:bg-blue-800 text-white text-base px-6 py-3 rounded-lg" 
            data-testid="button-calculate" 
            disabled={!!pickupTimeError}
          >
            Calcular
          </Button>
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
              <Button variant="outline" onClick={handleReset} className="w-full backdrop-blur-sm border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 md:px-6 md:py-3 text-sm md:text-base" data-testid="button-new-quote">Nueva Solicitud</Button>
              <Button onClick={handleConfirm} className="w-full bg-green-600/85 hover:bg-green-700/85 dark:bg-green-600/85 dark:hover:bg-green-700/85 text-white text-sm md:text-base px-4 py-2 md:px-6 md:py-3 rounded-lg backdrop-blur-sm border border-green-500/40" data-testid="button-confirm-quote">Solicitar</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
