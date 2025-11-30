import { useState } from "react";
import { Calculator, TrendingUp, MapPin, Truck, Search } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DashboardPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchNumber, setSearchNumber] = useState("");

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

  const handleCancel = async (id: string) => {
    await fetch(`/api/quotes/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "canceled" }), credentials: "include" });
    setQuotes(quotes.map(q => q.id === id ? { ...q, status: "canceled" } : q));
  };

  const pendingQuotes = quotes.filter((q) => q.status === "pending");
  const confirmedQuotes = quotes.filter((q) => q.status === "confirmed");
  const approvedQuotes = quotes.filter((q) => q.status === "approved");
  const rejectedQuotes = quotes.filter((q) => q.status === "rejected");
  const canceledQuotes = quotes.filter((q) => q.status === "canceled");
  const totalDistance = approvedQuotes.reduce((sum, q) => sum + (q.distance || 0), 0);
  const avgDistance = approvedQuotes.length > 0 ? (totalDistance / approvedQuotes.length).toFixed(1) : "0";
  const totalRevenue = approvedQuotes.reduce((sum, q) => sum + (q.totalPrice || 0), 0);

  const getQuoteNumber = (id: string) => id.slice(0, 8).toUpperCase();

  const filteredConfirmedQuotes = confirmedQuotes.filter(q => 
    searchNumber === "" || getQuoteNumber(q.id).includes(searchNumber.toUpperCase())
  );

  const filteredPendingQuotes = pendingQuotes.filter(q => 
    searchNumber === "" || getQuoteNumber(q.id).includes(searchNumber.toUpperCase())
  );

  const filteredApprovedQuotes = approvedQuotes.filter(q => 
    searchNumber === "" || getQuoteNumber(q.id).includes(searchNumber.toUpperCase())
  );

  const filteredRejectedQuotes = rejectedQuotes.filter(q => 
    searchNumber === "" || getQuoteNumber(q.id).includes(searchNumber.toUpperCase())
  );

  const filteredCanceledQuotes = canceledQuotes.filter(q => 
    searchNumber === "" || getQuoteNumber(q.id).includes(searchNumber.toUpperCase())
  );

  const renderQuoteCard = (quote: any, showActions = false) => (
    <div key={quote.id} className="border rounded p-4 bg-slate-50 dark:bg-slate-900">
      <div className="flex justify-between items-start mb-3">
        <div className="text-xs font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
          Nº {getQuoteNumber(quote.id)}
        </div>
      </div>
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
      <div className="border-t pt-3 mb-3 space-y-2">
        {quote.customerName && (
          <p className="text-sm"><span className="text-muted-foreground">Cliente: </span><span className="font-medium">{quote.customerName}</span></p>
        )}
        {quote.phoneNumber && (
          <p className="text-sm"><span className="text-muted-foreground">Teléfono: </span><a href={`tel:${quote.phoneNumber}`} className="text-blue-600 dark:text-blue-400 hover:underline">{quote.phoneNumber}</a></p>
        )}
        {quote.observations && (
          <p className="text-sm"><span className="text-muted-foreground">Observaciones: </span><span className="text-xs">{quote.observations}</span></p>
        )}
      </div>
      {showActions && (
        <div className="flex gap-2">
          <Button onClick={() => handleApprove(quote.id)} className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white text-sm" data-testid={`button-approve-${quote.id}`}>Aprobar</Button>
          <Button onClick={() => handleReject(quote.id)} className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white text-sm" data-testid={`button-reject-${quote.id}`}>Rechazar</Button>
          <Button onClick={() => window.location.href = `tel:${quote.phoneNumber}`} className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-sm" data-testid={`button-call-${quote.id}`}>Llamar</Button>
        </div>
      )}
      {quote.status === "approved" && !showActions && (
        <div className="flex gap-2 mt-3">
          <div className="flex-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm p-2 rounded text-center font-medium">Aprobada</div>
          <Button onClick={() => handleCancel(quote.id)} className="bg-gray-600 hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-700 text-white text-sm" data-testid={`button-cancel-${quote.id}`}>Cancelar</Button>
        </div>
      )}
      {quote.status === "approved" && showActions && (
        <div className="mt-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm p-2 rounded text-center font-medium">Aprobada</div>
      )}
      {quote.status === "rejected" && (
        <div className="mt-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm p-2 rounded text-center font-medium">Rechazada</div>
      )}
      {quote.status === "canceled" && (
        <div className="mt-3 bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 text-sm p-2 rounded text-center font-medium">Cancelada</div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Buscar por nº presupuesto..." 
            value={searchNumber} 
            onChange={(e) => setSearchNumber(e.target.value)}
            className="pl-10"
            data-testid="input-search-quote"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Ingresos" value={`${totalRevenue.toFixed(2)}€`} subtitle="Aprobados" icon={Truck} />
        <StatCard title="Dist. Media" value={`${avgDistance} km`} subtitle="Por presupuesto" icon={MapPin} />
        <StatCard title="En revisión" value={confirmedQuotes.length.toString()} subtitle="Pendientes" icon={TrendingUp} />
        <StatCard title="Aprobados" value={approvedQuotes.length.toString()} subtitle="Confirmados" icon={Calculator} />
        <StatCard title="Presupuestos" value={quotes.length.toString()} subtitle="Totales" icon={Calculator} />
      </div>

      {(filteredConfirmedQuotes.length > 0 || filteredPendingQuotes.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Solicitudes Pendientes de Revisión ({(filteredConfirmedQuotes.length + filteredPendingQuotes.length).toString()})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredConfirmedQuotes.length > 0 && (
                <>
                  <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Por revisar ({filteredConfirmedQuotes.length})</div>
                  {filteredConfirmedQuotes.map((quote) => renderQuoteCard(quote, true))}
                </>
              )}
              {filteredPendingQuotes.length > 0 && (
                <>
                  {filteredConfirmedQuotes.length > 0 && <div className="border-t my-4"></div>}
                  <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Presupuestos sin confirmar ({filteredPendingQuotes.length})</div>
                  {filteredPendingQuotes.map((quote) => (
                    <div key={quote.id} className="border rounded p-4 bg-slate-50 dark:bg-slate-900 opacity-60">
                      <div className="flex justify-between items-start mb-3">
                        <div className="text-xs font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                          Nº {getQuoteNumber(quote.id)}
                        </div>
                      </div>
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
                      <div className="text-xs text-muted-foreground text-center p-2 bg-yellow-100/30 dark:bg-yellow-900/20 rounded">Pendiente de confirmación del cliente</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {(filteredApprovedQuotes.length > 0 || filteredRejectedQuotes.length > 0 || filteredCanceledQuotes.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Solicitudes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {filteredApprovedQuotes.length > 0 && (
              <div>
                <h3 className="font-semibold text-green-600 dark:text-green-400 mb-3">Aprobadas ({filteredApprovedQuotes.length})</h3>
                <div className="space-y-3">
                  {filteredApprovedQuotes.map((quote) => renderQuoteCard(quote, false))}
                </div>
              </div>
            )}
            {filteredRejectedQuotes.length > 0 && (
              <div>
                {filteredApprovedQuotes.length > 0 && <div className="border-t my-4"></div>}
                <h3 className="font-semibold text-red-600 dark:text-red-400 mb-3">Rechazadas ({filteredRejectedQuotes.length})</h3>
                <div className="space-y-3">
                  {filteredRejectedQuotes.map((quote) => renderQuoteCard(quote, false))}
                </div>
              </div>
            )}
            {filteredCanceledQuotes.length > 0 && (
              <div>
                {(filteredApprovedQuotes.length > 0 || filteredRejectedQuotes.length > 0) && <div className="border-t my-4"></div>}
                <h3 className="font-semibold text-gray-600 dark:text-gray-400 mb-3">Canceladas ({filteredCanceledQuotes.length})</h3>
                <div className="space-y-3">
                  {filteredCanceledQuotes.map((quote) => renderQuoteCard(quote, false))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
