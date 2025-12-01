import { useState, useEffect } from "react";
import { Calculator, TrendingUp, MapPin, Truck, Search } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DriverDoorAnimation } from "@/components/DriverDoorAnimation";
import { useToast } from "@/hooks/use-toast";
import { AnimatedPageBackground } from "@/components/AnimatedPageBackground";
import { WorkerAssignmentModal } from "@/components/WorkerAssignmentModal";

export default function DashboardPage() {
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchNumber, setSearchNumber] = useState("");
  const [showAnimation, setShowAnimation] = useState(true);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);

  useEffect(() => {
    const hasSeenAnimation = sessionStorage.getItem("hasSeenAdminAnimation");
    if (hasSeenAnimation) {
      setShowAnimation(false);
    }
  }, []);

  return (
    <div className="relative">
      <AnimatedPageBackground />
      <DashboardContent
        quotes={quotes}
        setQuotes={setQuotes}
        loading={loading}
        setLoading={setLoading}
        searchNumber={searchNumber}
        setSearchNumber={setSearchNumber}
        showAnimation={showAnimation}
        setShowAnimation={setShowAnimation}
        toast={toast}
      />
    </div>
  );
}

interface DashboardContentProps {
  quotes: any[];
  setQuotes: (quotes: any[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  searchNumber: string;
  setSearchNumber: (search: string) => void;
  showAnimation: boolean;
  setShowAnimation: (show: boolean) => void;
  toast: any;
}

function DashboardContent({ quotes, setQuotes, loading, setLoading, searchNumber, setSearchNumber, showAnimation, setShowAnimation, toast }: DashboardContentProps) {
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);

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
    const res = await fetch(`/api/quotes/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "approved" }), credentials: "include" });
    const data = await res.json();
    if (!res.ok) {
      toast({ title: "No se puede aprobar", description: data.error, variant: "destructive" });
      return;
    }
    setQuotes(quotes.map((q: any) => q.id === id ? { ...q, status: "approved" } : q));
    toast({ title: "Aprobado", description: "Presupuesto aprobado correctamente", variant: "default" });
  };

  const handleReject = async (id: string) => {
    await fetch(`/api/quotes/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "rejected" }), credentials: "include" });
    setQuotes(quotes.map((q: any) => q.id === id ? { ...q, status: "rejected" } : q));
  };

  const handleCancel = async (id: string) => {
    await fetch(`/api/quotes/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "canceled" }), credentials: "include" });
    setQuotes(quotes.map((q: any) => q.id === id ? { ...q, status: "canceled" } : q));
  };

  const handleAssignWorker = (quote: any) => {
    setSelectedQuote(quote);
    setAssignmentModalOpen(true);
  };

  const pendingQuotes = quotes.filter((q: any) => q.status === "pending");
  const confirmedQuotes = quotes.filter((q: any) => q.status === "confirmed");
  const approvedQuotes = quotes.filter((q: any) => q.status === "approved");
  const rejectedQuotes = quotes.filter((q: any) => q.status === "rejected");
  const canceledQuotes = quotes.filter((q: any) => q.status === "canceled");
  const totalDistance = approvedQuotes.reduce((sum: number, q: any) => sum + (q.distance || 0), 0);
  const avgDistance = approvedQuotes.length > 0 ? (totalDistance / approvedQuotes.length).toFixed(1) : "0";
  const totalRevenue = approvedQuotes.reduce((sum: number, q: any) => sum + (q.totalPrice || 0), 0);

  const getQuoteNumber = (id: string) => id.slice(0, 8).toUpperCase();

  const filteredConfirmedQuotes = confirmedQuotes.filter((q: any) => 
    searchNumber === "" || getQuoteNumber(q.id).includes(searchNumber.toUpperCase())
  );

  const filteredPendingQuotes = pendingQuotes.filter((q: any) => 
    searchNumber === "" || getQuoteNumber(q.id).includes(searchNumber.toUpperCase())
  );

  const filteredApprovedQuotes = approvedQuotes.filter((q: any) => 
    searchNumber === "" || getQuoteNumber(q.id).includes(searchNumber.toUpperCase())
  );

  const filteredRejectedQuotes = rejectedQuotes.filter((q: any) => 
    searchNumber === "" || getQuoteNumber(q.id).includes(searchNumber.toUpperCase())
  );

  const filteredCanceledQuotes = canceledQuotes.filter((q: any) => 
    searchNumber === "" || getQuoteNumber(q.id).includes(searchNumber.toUpperCase())
  );

  const renderQuoteCard = (quote: any, showActions = false) => (
    <div key={quote.id} className="border rounded p-4 bg-slate-50 dark:bg-slate-900">
      <div className="flex justify-between items-start mb-3">
        <div className="text-xs font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
          Nº {getQuoteNumber(quote.id)}
        </div>
        {quote.isUrgent && <div className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded">Urgente (+25%)</div>}
      </div>
      
      <div className="mb-3 p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
        <p className="text-xs text-muted-foreground mb-2 font-semibold">SOLICITUD</p>
        {quote.createdAt && (
          <p className="text-xs"><span className="text-muted-foreground">Fecha y hora: </span><span className="font-mono font-medium">{new Date(quote.createdAt).toLocaleString("es-ES", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span></p>
        )}
      </div>
      
      <div className="mb-3 p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
        <p className="text-xs text-muted-foreground mb-2 font-semibold">RECOGIDA SOLICITADA</p>
        {quote.pickupTime && (
          <p className="text-xs"><span className="text-muted-foreground">Fecha y hora: </span><span className="font-mono font-medium">{quote.pickupTime}</span></p>
        )}
      </div>
      
      <div className="mb-3 p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
        <p className="text-xs text-muted-foreground mb-2 font-semibold">RUTA</p>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <p className="text-xs text-muted-foreground">Origen</p>
            <p className="text-sm font-medium">{quote.origin}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Destino</p>
            <p className="text-sm font-medium">{quote.destination}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Distancia</p>
            <p className="font-medium">{(quote.distance || 0).toFixed(1)} km</p>
          </div>
          <div>
            <p className="text-muted-foreground">Duración</p>
            <p className="font-medium">{quote.duration || 0} min</p>
          </div>
          <div>
            <p className="text-muted-foreground">Vehículo</p>
            <p className="font-medium">{quote.vehicleTypeName}</p>
          </div>
        </div>
      </div>
      
      <div className="mb-3 p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
        <p className="text-xs text-muted-foreground mb-2 font-semibold">PRECIO</p>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Distancia ({(quote.distance || 0).toFixed(1)} km × {(quote.distanceCost / quote.distance).toFixed(2)}€):</span>
            <span className="font-mono">{(quote.distanceCost || 0).toFixed(2)}€</span>
          </div>
          {quote.directionCost > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dirección:</span>
              <span className="font-mono">{(quote.directionCost || 0).toFixed(2)}€</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-1">
            <span className="text-muted-foreground">Subtotal:</span>
            <span className="font-mono font-medium">{((quote.distanceCost || 0) + (quote.directionCost || 0)).toFixed(2)}€</span>
          </div>
          {quote.isUrgent && (
            <div className="flex justify-between text-orange-600 dark:text-orange-400">
              <span>Con urgencia (+25%):</span>
              <span className="font-mono font-medium">{(quote.totalPrice || 0).toFixed(2)}€</span>
            </div>
          )}
          {!quote.isUrgent && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-mono font-medium text-green-600 dark:text-green-400">{(quote.totalPrice || 0).toFixed(2)}€</span>
            </div>
          )}
          {quote.isUrgent && (
            <div className="flex justify-between border-t pt-1 text-green-600 dark:text-green-400">
              <span className="font-semibold">TOTAL A PAGAR:</span>
              <span className="font-mono font-bold">{(quote.totalPrice || 0).toFixed(2)}€</span>
            </div>
          )}
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
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => handleApprove(quote.id)} className="flex-1 bg-green-600/85 hover:bg-green-700/85 dark:bg-green-600/85 dark:hover:bg-green-700/85 text-white text-xs md:text-sm px-2 py-1.5 md:px-4 md:py-2 rounded-lg backdrop-blur-sm border border-green-500/40" data-testid={`button-approve-${quote.id}`}>Aprobar</Button>
          <Button onClick={() => handleReject(quote.id)} className="flex-1 bg-red-600/85 hover:bg-red-700/85 dark:bg-red-600/85 dark:hover:bg-red-700/85 text-white text-xs md:text-sm px-2 py-1.5 md:px-4 md:py-2 rounded-lg backdrop-blur-sm border border-red-500/40" data-testid={`button-reject-${quote.id}`}>Rechazar</Button>
          <Button onClick={() => window.location.href = `tel:${quote.phoneNumber}`} className="flex-1 bg-blue-600/85 hover:bg-blue-700/85 dark:bg-blue-600/85 dark:hover:bg-blue-700/85 text-white text-xs md:text-sm px-2 py-1.5 md:px-4 md:py-2 rounded-lg backdrop-blur-sm border border-blue-500/40" data-testid={`button-call-${quote.id}`}>Llamar</Button>
          <Button onClick={() => handleAssignWorker(quote)} className="flex-1 bg-purple-600/85 hover:bg-purple-700/85 dark:bg-purple-600/85 dark:hover:bg-purple-700/85 text-white text-xs md:text-sm px-2 py-1.5 md:px-4 md:py-2 rounded-lg backdrop-blur-sm border border-purple-500/40" data-testid={`button-assign-worker-${quote.id}`}>Asignar Trabajador</Button>
        </div>
      )}
      {quote.status === "approved" && !showActions && (
        <div className="flex gap-2 mt-3">
          <div className="flex-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs md:text-sm p-2 rounded text-center font-medium">Aprobada</div>
          <Button onClick={() => handleCancel(quote.id)} className="bg-gray-600/85 hover:bg-gray-700/85 dark:bg-gray-600/85 dark:hover:bg-gray-700/85 text-white text-xs md:text-sm px-2 py-1.5 md:px-4 md:py-2 rounded-lg backdrop-blur-sm border border-gray-500/40" data-testid={`button-cancel-${quote.id}`}>Cancelar</Button>
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

  if (showAnimation) {
    return (
      <DriverDoorAnimation
        onComplete={() => {
          sessionStorage.setItem("hasSeenAdminAnimation", "true");
          setShowAnimation(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-4 p-3 md:space-y-6 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0">
        <h1 className="text-2xl md:text-3xl font-semibold">Dashboard</h1>
        <div className="relative w-full md:w-72">
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
      <div className="grid grid-cols-2 gap-2 md:gap-4 md:grid-cols-3 lg:grid-cols-5">
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
                  {filteredConfirmedQuotes.map((quote: any) => renderQuoteCard(quote, true))}
                </>
              )}
              {filteredPendingQuotes.length > 0 && (
                <>
                  {filteredConfirmedQuotes.length > 0 && <div className="border-t my-4"></div>}
                  <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Solicitudes para revisar ({filteredPendingQuotes.length})</div>
                  {filteredPendingQuotes.map((quote: any) => renderQuoteCard(quote, true))}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <WorkerAssignmentModal open={assignmentModalOpen} onOpenChange={setAssignmentModalOpen} quote={selectedQuote} />

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
                  {filteredApprovedQuotes.map((quote: any) => renderQuoteCard(quote, false))}
                </div>
              </div>
            )}
            {filteredRejectedQuotes.length > 0 && (
              <div>
                {filteredApprovedQuotes.length > 0 && <div className="border-t my-4"></div>}
                <h3 className="font-semibold text-red-600 dark:text-red-400 mb-3">Rechazadas ({filteredRejectedQuotes.length})</h3>
                <div className="space-y-3">
                  {filteredRejectedQuotes.map((quote: any) => renderQuoteCard(quote, false))}
                </div>
              </div>
            )}
            {filteredCanceledQuotes.length > 0 && (
              <div>
                {(filteredApprovedQuotes.length > 0 || filteredRejectedQuotes.length > 0) && <div className="border-t my-4"></div>}
                <h3 className="font-semibold text-gray-600 dark:text-gray-400 mb-3">Canceladas ({filteredCanceledQuotes.length})</h3>
                <div className="space-y-3">
                  {filteredCanceledQuotes.map((quote: any) => renderQuoteCard(quote, false))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
