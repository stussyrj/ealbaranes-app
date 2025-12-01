import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, MapPin, Truck, Users } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DriverDoorAnimation } from "@/components/DriverDoorAnimation";
import { useToast } from "@/hooks/use-toast";
import { AnimatedPageBackground } from "@/components/AnimatedPageBackground";
import { WorkerAssignmentModal } from "@/components/WorkerAssignmentModal";
import { WorkerManagementModal } from "@/components/WorkerManagementModal";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { toast } = useToast();
  const [showAnimation, setShowAnimation] = useState(true);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [workerManagementOpen, setWorkerManagementOpen] = useState(false);

  useEffect(() => {
    const hasSeenAnimation = sessionStorage.getItem("hasSeenAdminAnimation");
    if (hasSeenAnimation) {
      setShowAnimation(false);
    }
  }, []);

  const { data: quotes = [] } = useQuery({
    queryKey: ["/api/quotes"],
    queryFn: async () => {
      const res = await fetch("/api/quotes", { credentials: "include" });
      return res.json();
    },
  });

  const { data: deliveryNotes = [] } = useQuery({
    queryKey: ["/api/delivery-notes"],
    queryFn: async () => {
      const res = await fetch("/api/delivery-notes", { credentials: "include" });
      return res.json();
    },
  });

  const handleAssignWorker = (quote: any) => {
    setSelectedQuote(quote);
    setAssignmentModalOpen(true);
  };

  const signedQuotes = Array.isArray(quotes) ? quotes.filter((q: any) => q.status === "signed") : [];
  const pendingQuotes = Array.isArray(quotes) ? quotes.filter((q: any) => !q.assignedWorkerId && q.status !== "signed") : [];
  
  const signedDeliveryNotes = Array.isArray(deliveryNotes) ? deliveryNotes.filter((n: any) => n.status === "signed" && n.photo) : [];
  const pendingDeliveryNotes = Array.isArray(deliveryNotes) ? deliveryNotes.filter((n: any) => n.status !== "signed" || !n.photo) : [];
  
  const totalSignedCount = signedQuotes.length + signedDeliveryNotes.length;
  const totalPendingCount = pendingQuotes.length + pendingDeliveryNotes.length;

  const getQuoteNumber = (id: string) => id.slice(0, 8).toUpperCase();

  const renderQuoteCard = (quote: any, showAssignBtn = false) => (
    <Card key={quote.id} className="hover-elevate">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-xs font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded mb-2 w-fit">
              Nº {getQuoteNumber(quote.id)}
            </div>
            <p className="font-semibold">{quote.origin} → {quote.destination}</p>
          </div>
          <div className="flex gap-2">
            {quote.isUrgent && (
              <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                Urgente
              </Badge>
            )}
            <Badge className={quote.status === "signed" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" : "bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300"}>
              {quote.status === "signed" ? "Firmado" : quote.status === "assigned" ? "Asignado" : "Pendiente"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Distancia</p>
            <p className="font-semibold">{(quote.distance || 0).toFixed(1)} km</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Precio</p>
            <p className="font-semibold">{(quote.totalPrice || 0).toFixed(2)}€</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Cliente</p>
            <p className="font-semibold text-xs">{quote.customerName}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Teléfono</p>
            <p className="font-semibold text-xs">{quote.phoneNumber}</p>
          </div>
        </div>
        {showAssignBtn && !quote.assignedWorkerId && (
          <Button
            onClick={() => handleAssignWorker(quote)}
            className="w-full bg-purple-600/85 hover:bg-purple-700/85 dark:bg-purple-600/85 dark:hover:bg-purple-700/85 text-white px-4 py-2 rounded-lg backdrop-blur-sm border border-purple-500/40"
            data-testid={`button-assign-worker-${quote.id}`}
          >
            Asignar Trabajador
          </Button>
        )}
      </CardContent>
    </Card>
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
    <div className="relative">
      <AnimatedPageBackground />
      <div className="relative z-10 space-y-6 p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-semibold">Dashboard Presupuestos</h1>
        </div>

        <div className="grid grid-cols-2 gap-2 md:gap-4 md:grid-cols-3 lg:grid-cols-4">
          <StatCard title="Pendientes" value={totalPendingCount.toString()} subtitle="Sin asignar" icon={TrendingUp} />
          <StatCard title="Firmados" value={totalSignedCount.toString()} subtitle="Completados" icon={MapPin} />
          <button
            onClick={() => setWorkerManagementOpen(true)}
            className="group relative overflow-hidden rounded-md border border-muted-foreground/10 bg-slate-50 dark:bg-slate-900/30 p-4 text-left transition-all hover-elevate"
            data-testid="button-manage-workers"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Administrar</p>
                <h3 className="text-lg md:text-xl font-bold mt-1">Trabajadores</h3>
              </div>
              <Users className="h-6 w-6 md:h-8 md:w-8 text-blue-500 opacity-70" />
            </div>
          </button>
        </div>

        {(pendingQuotes.length > 0 || pendingDeliveryNotes.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Pendientes ({totalPendingCount})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {pendingQuotes.map((quote: any) => renderQuoteCard(quote, true))}
                {pendingDeliveryNotes.map((note: any) => (
                  <div key={note.id} className="rounded-lg border border-border bg-card p-4 hover-elevate">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold">{note.destination || 'Sin destino'}</p>
                        <p className="text-xs text-muted-foreground">{note.clientName || 'Sin cliente'}</p>
                      </div>
                      <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">Pendiente</Badge>
                    </div>
                    <div className="text-sm space-y-2">
                      <div>{note.vehicleType && <span>{note.vehicleType}</span>}</div>
                      <div>{note.date && <span>{new Date(note.date).toLocaleDateString('es-ES')}</span>}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {(signedQuotes.length > 0 || signedDeliveryNotes.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Firmados ({totalSignedCount})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {signedQuotes.map((quote: any) => renderQuoteCard(quote, false))}
                {signedDeliveryNotes.map((note: any) => (
                  <div key={note.id} className="rounded-lg border border-border bg-card p-4 hover-elevate">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold">{note.destination || 'Sin destino'}</p>
                        <p className="text-xs text-muted-foreground">{note.clientName || 'Sin cliente'}</p>
                      </div>
                      <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">✓ Firmado</Badge>
                    </div>
                    <div className="text-sm space-y-2">
                      <div>{note.vehicleType && <span>{note.vehicleType}</span>}</div>
                      <div>{note.signedAt && <span>Firmado: {new Date(note.signedAt).toLocaleString('es-ES')}</span>}</div>
                      {note.photo && (
                        <div className="pt-2">
                          <img src={note.photo} alt="Albarán" className="w-full rounded-lg max-h-40 object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <WorkerAssignmentModal
        open={assignmentModalOpen}
        onOpenChange={setAssignmentModalOpen}
        quote={selectedQuote}
      />
      
      <WorkerManagementModal
        open={workerManagementOpen}
        onOpenChange={setWorkerManagementOpen}
      />
    </div>
  );
}
