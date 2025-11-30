import { useState } from "react";
import { Calculator, TrendingUp, MapPin, Truck } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  if (!loading && quotes.length === 0) {
    setLoading(true);
    fetch("/api/quotes", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setQuotes(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  const confirmedQuotes = quotes.filter((q) => q.status === "confirmed");
  const totalDistance = quotes.reduce((sum, q) => sum + (q.distance || 0), 0);
  const avgDistance = quotes.length > 0 ? (totalDistance / quotes.length).toFixed(1) : "0";
  const totalRevenue = confirmedQuotes.reduce((sum, q) => sum + (q.totalPrice || 0), 0);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Presupuestos" value={quotes.length.toString()} subtitle="Total" icon={Calculator} />
        <StatCard title="Confirmados" value={confirmedQuotes.length.toString()} subtitle="Este mes" icon={TrendingUp} />
        <StatCard title="Dist. Media" value={`${avgDistance} km`} subtitle="Por presupuesto" icon={MapPin} />
        <StatCard title="Ingresos" value={`${totalRevenue.toFixed(2)}€`} subtitle="Confirmados" icon={Truck} />
      </div>

      {confirmedQuotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Solicitudes Confirmadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {confirmedQuotes.map((quote) => (
                <div key={quote.id} className="border rounded p-4 bg-slate-50 dark:bg-slate-900">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Origen</p>
                      <p className="font-medium text-sm">{quote.origin}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Destino</p>
                      <p className="font-medium text-sm">{quote.destination}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Vehículo</p>
                      <p className="font-medium text-sm">{quote.vehicleTypeName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Precio</p>
                      <p className="font-bold text-green-600 dark:text-green-400">{quote.totalPrice.toFixed(2)}€</p>
                    </div>
                  </div>
                  {quote.pickupTime && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm"><span className="text-muted-foreground">Horario: </span>{quote.pickupTime}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
