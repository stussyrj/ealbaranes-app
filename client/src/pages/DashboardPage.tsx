import { useState } from "react";
import { Calculator, TrendingUp, MapPin, Truck } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

  const handleApprove = async (id: string) => {
    await fetch(`/api/quotes/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "approved" }), credentials: "include" });
    setQuotes(quotes.map(q => q.id === id ? { ...q, status: "approved" } : q));
  };

  const handleReject = async (id: string) => {
    await fetch(`/api/quotes/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "rejected" }), credentials: "include" });
    setQuotes(quotes.map(q => q.id === id ? { ...q, status: "rejected" } : q));
  };

  const confirmedQuotes = quotes.filter((q) => q.status === "confirmed");
  const totalDistance = quotes.reduce((sum, q) => sum + (q.distance || 0), 0);
  const avgDistance = quotes.length > 0 ? (totalDistance / quotes.length).toFixed(1) : "0";
  const totalRevenue = confirmedQuotes.reduce((sum, q) => sum + (q.totalPrice || 0), 0);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Presupuestos" value={quotes.length.toString()} subtitle="Total" icon={Calculator} />
        <StatCard title="Confirmados" value={confirmedQuotes.length.toString()} subtitle="Solicitudes" icon={TrendingUp} />
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
                  <div className="grid grid-cols-2 gap-4 mb-3">
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
                  {quote.phoneNumber && (
                    <div className="border-t pt-3 mb-3">
                      <p className="text-sm"><span className="text-muted-foreground">Teléfono: </span><a href={`tel:${quote.phoneNumber}`} className="text-blue-600 dark:text-blue-400 hover:underline">{quote.phoneNumber}</a></p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button onClick={() => handleApprove(quote.id)} className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white text-sm" data-testid={`button-approve-${quote.id}`}>Aprobar</Button>
                    <Button onClick={() => handleReject(quote.id)} className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white text-sm" data-testid={`button-reject-${quote.id}`}>Rechazar</Button>
                    <Button onClick={() => window.location.href = `tel:${quote.phoneNumber}`} className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-sm" data-testid={`button-call-${quote.id}`}>Llamar</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
