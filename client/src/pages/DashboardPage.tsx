import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, MapPin, Truck, Users, X, Download, Share2 } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DriverDoorAnimation } from "@/components/DriverDoorAnimation";
import { useToast } from "@/hooks/use-toast";
import { AnimatedPageBackground } from "@/components/AnimatedPageBackground";
import { WorkerAssignmentModal } from "@/components/WorkerAssignmentModal";
import { WorkerManagementModal } from "@/components/WorkerManagementModal";
import { Badge } from "@/components/ui/badge";
import html2canvas from "html2canvas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DashboardPage() {
  const { toast } = useToast();
  const [showAnimation, setShowAnimation] = useState(true);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [workerManagementOpen, setWorkerManagementOpen] = useState(false);
  const [deliveryNotesModalOpen, setDeliveryNotesModalOpen] = useState(false);
  const [deliveryNotesType, setDeliveryNotesType] = useState<"pending" | "signed">("pending");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const deliveryNoteRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const captureAndPreviewDeliveryNote = async (note: any) => {
    try {
      const element = deliveryNoteRefs.current[note.id];
      if (!element) {
        toast({ title: "Error", description: "No se pudo capturar el albarán", variant: "destructive" });
        return;
      }

      const canvas = await html2canvas(element, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
      const imageData = canvas.toDataURL("image/png");
      setPreviewImage(imageData);
      setPreviewModalOpen(true);
    } catch (error) {
      console.error("Error capturing delivery note:", error);
      toast({ title: "Error", description: "Error al capturar el albarán", variant: "destructive" });
    }
  };

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
  
  const signedDeliveryNotes = Array.isArray(deliveryNotes) ? deliveryNotes.filter((n: any) => n.photo) : [];
  const pendingDeliveryNotes = Array.isArray(deliveryNotes) ? deliveryNotes.filter((n: any) => !n.photo) : [];
  
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs sm:text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Distancia</p>
            <p className="font-semibold text-sm sm:text-base">{(quote.distance || 0).toFixed(1)} km</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Precio</p>
            <p className="font-semibold text-sm sm:text-base">{(quote.totalPrice || 0).toFixed(2)}€</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Cliente</p>
            <p className="font-semibold text-xs line-clamp-1">{quote.customerName}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Teléfono</p>
            <p className="font-semibold text-xs line-clamp-1">{quote.phoneNumber}</p>
          </div>
        </div>
        {showAssignBtn && !quote.assignedWorkerId && (
          <Button
            onClick={() => handleAssignWorker(quote)}
            className="w-full bg-purple-600/85 hover:bg-purple-700/85 dark:bg-purple-600/85 dark:hover:bg-purple-700/85 text-white h-10 sm:h-9 text-sm sm:text-base rounded-lg backdrop-blur-sm border border-purple-500/40"
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
      <div className="relative z-10 space-y-3 sm:space-y-6 p-3 sm:p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 sm:gap-3">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold">Dashboard Presupuestos</h1>
        </div>

        <div className="grid grid-cols-2 gap-2 md:gap-4 md:grid-cols-3 lg:grid-cols-4">
          <StatCard title="Pendientes" value={totalPendingCount.toString()} subtitle="Sin asignar" icon={TrendingUp} />
          <StatCard title="Firmados" value={totalSignedCount.toString()} subtitle="Completados" icon={MapPin} />
          <button
            onClick={() => setWorkerManagementOpen(true)}
            className="group relative overflow-hidden rounded-md border border-muted-foreground/10 bg-slate-50 dark:bg-slate-900/30 p-3 sm:p-4 text-left transition-all hover-elevate"
            data-testid="button-manage-workers"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Administrar</p>
                <h3 className="text-base sm:text-lg md:text-xl font-bold mt-1">Trabajadores</h3>
              </div>
              <Users className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-blue-500 opacity-70" />
            </div>
          </button>
        </div>

        {(pendingQuotes.length > 0 || pendingDeliveryNotes.length > 0) && (
          <Card>
            <CardHeader className="py-3 sm:py-4">
              <CardTitle className="text-base sm:text-lg">Pendientes ({totalPendingCount})</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="grid gap-3 sm:gap-4">
                {pendingQuotes.map((quote: any) => renderQuoteCard(quote, true))}
              </div>
              {pendingDeliveryNotes.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <Button
                    onClick={() => {
                      setDeliveryNotesType("pending");
                      setDeliveryNotesModalOpen(true);
                    }}
                    variant="outline"
                    className="w-full"
                    data-testid="button-view-pending-albaranes"
                  >
                    Ver {pendingDeliveryNotes.length} Albarán{pendingDeliveryNotes.length !== 1 ? "es" : ""} Pendiente{pendingDeliveryNotes.length !== 1 ? "s" : ""}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {(signedQuotes.length > 0 || signedDeliveryNotes.length > 0) && (
          <Card>
            <CardHeader className="py-3 sm:py-4">
              <CardTitle className="text-base sm:text-lg">Firmados ({totalSignedCount})</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="grid gap-3 sm:gap-4">
                {signedQuotes.map((quote: any) => renderQuoteCard(quote, false))}
              </div>
              {signedDeliveryNotes.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <Button
                    onClick={() => {
                      setDeliveryNotesType("signed");
                      setDeliveryNotesModalOpen(true);
                    }}
                    variant="outline"
                    className="w-full"
                    data-testid="button-view-signed-albaranes"
                  >
                    Ver {signedDeliveryNotes.length} Albarán{signedDeliveryNotes.length !== 1 ? "es" : ""} Firmado{signedDeliveryNotes.length !== 1 ? "s" : ""}
                  </Button>
                </div>
              )}
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

      <Dialog open={deliveryNotesModalOpen} onOpenChange={setDeliveryNotesModalOpen}>
        <DialogContent className="max-w-md max-h-[95vh] overflow-y-auto w-screen sm:w-[95vw] h-screen sm:h-auto p-2 sm:p-3 sm:rounded-lg rounded-none">
          <DialogHeader className="pb-1 sticky top-0 bg-background z-10">
            <DialogTitle className="text-base sm:text-lg">
              Albaranes {deliveryNotesType === "pending" ? "Pendientes" : "Firmados"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {(deliveryNotesType === "pending" ? pendingDeliveryNotes : signedDeliveryNotes).map((note: any) => (
              <div key={note.id} ref={(el) => { deliveryNoteRefs.current[note.id] = el; }} className="rounded-lg border border-border bg-card overflow-hidden">
                {/* Header - Compacto */}
                <div className="flex justify-between items-start p-1.5 sm:p-2 border-b border-border/50 gap-1">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs sm:text-sm truncate">{note.destination || 'Sin destino'}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{note.clientName || 'Sin cliente'}</p>
                  </div>
                  <Badge className={`text-[10px] flex-shrink-0 h-5 ${deliveryNotesType === "pending" ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300" : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"}`}>
                    {deliveryNotesType === "pending" ? "Pte." : "✓"}
                  </Badge>
                </div>

                {/* Content - Compacto */}
                <div className="p-1.5 sm:p-2 space-y-1">
                  {/* Foto PRIMERO - Grande */}
                  {note.photo && (
                    <div className="mb-1.5">
                      <img src={note.photo} alt="Albarán" className="w-full rounded max-h-40 object-cover" />
                    </div>
                  )}

                  {/* Trabajador */}
                  <div className="bg-muted/30 rounded p-1.5">
                    <p className="text-[9px] text-muted-foreground font-semibold mb-0.5">TRABAJADOR</p>
                    <p className="font-medium text-[11px]">{(note as any).workerName || 'Desconocido'}</p>
                  </div>

                  {/* Ruta - Compacto */}
                  <div className="space-y-1 sm:grid sm:grid-cols-2 sm:gap-1">
                    <div className="bg-muted/30 rounded p-1.5">
                      <p className="text-[9px] text-muted-foreground font-semibold mb-0.5">ORIGEN</p>
                      <p className="font-medium text-[11px] line-clamp-1">{note.pickupOrigin || 'N/A'}</p>
                    </div>
                    <div className="bg-muted/30 rounded p-1.5">
                      <p className="text-[9px] text-muted-foreground font-semibold mb-0.5">DESTINO</p>
                      <p className="font-medium text-[11px] line-clamp-1">{note.destination || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Vehículo y Fecha - Compacto */}
                  <div className="space-y-1 sm:grid sm:grid-cols-2 sm:gap-1">
                    <div className="bg-muted/30 rounded p-1.5">
                      <p className="text-[9px] text-muted-foreground font-semibold mb-0.5">VEHÍCULO</p>
                      <p className="font-medium text-[11px]">{note.vehicleType || 'N/A'}</p>
                    </div>
                    <div className="bg-muted/30 rounded p-1.5">
                      <p className="text-[9px] text-muted-foreground font-semibold mb-0.5">FECHA</p>
                      <p className="font-medium text-[11px]">{note.date ? new Date(note.date).toLocaleDateString('es-ES') : 'N/A'}</p>
                    </div>
                  </div>

                  {/* Hora y Observaciones - Compacto */}
                  <div className="space-y-1 sm:grid sm:grid-cols-2 sm:gap-1">
                    <div className="bg-muted/30 rounded p-1.5">
                      <p className="text-[9px] text-muted-foreground font-semibold mb-0.5">HORA</p>
                      <p className="font-medium text-[11px]">{note.time || 'N/A'}</p>
                    </div>
                    <div className="bg-muted/30 rounded p-1.5">
                      <p className="text-[9px] text-muted-foreground font-semibold mb-0.5">OBS.</p>
                      <p className="text-[11px] line-clamp-1">{note.observations || '-'}</p>
                    </div>
                  </div>

                  {/* Firma */}
                  {deliveryNotesType === "signed" && note.signedAt && (
                    <div className="bg-muted/30 rounded p-1.5">
                      <p className="text-[9px] text-muted-foreground font-semibold mb-0.5">FIRMADO</p>
                      <p className="font-medium text-[10px]">{new Date(note.signedAt).toLocaleString('es-ES')}</p>
                    </div>
                  )}

                  {/* Share buttons - Solo para albaranes firmados */}
                  {deliveryNotesType === "signed" && note.photo && (
                    <div className="border-t border-border/30 pt-1 mt-1 flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-[10px] h-7"
                        onClick={() => captureAndPreviewDeliveryNote(note)}
                        data-testid={`button-download-delivery-note-${note.id}`}
                      >
                        <Download className="w-2.5 h-2.5 mr-0.5" />
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-[10px] h-7"
                        onClick={() => {
                          const element = deliveryNoteRefs.current[note.id];
                          if (element && navigator.share) {
                            html2canvas(element, { scale: 2, backgroundColor: "#ffffff" }).then(canvas => {
                              canvas.toBlob(blob => {
                                const file = new File([blob!], `alban-${note.destination}.png`, { type: "image/png" });
                                navigator.share({ files: [file], title: `Albarán - ${note.destination}` });
                              });
                            });
                          } else {
                            toast({ title: "Info", description: "La función compartir no está disponible en tu navegador" });
                          }
                        }}
                        data-testid={`button-share-delivery-note-${note.id}`}
                      >
                        <Share2 className="w-2.5 h-2.5 mr-0.5" />
                        Compartir
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      {previewModalOpen && previewImage && (
        <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
          <DialogContent className="max-w-sm max-h-[90vh] overflow-hidden w-screen sm:w-full h-screen sm:h-auto p-0 sm:p-0 sm:rounded-lg rounded-none flex flex-col bg-background border-0 sm:border">
            <div className="flex-1 overflow-hidden flex flex-col bg-black/90 sm:bg-background">
              <div className="flex-1 flex items-center justify-center p-2 bg-black">
                <img src={previewImage} alt="Albarán" className="w-auto h-auto max-w-full max-h-[80vh] object-contain" />
              </div>
              <div className="flex-shrink-0 bg-background border-t border-border p-2 space-y-2">
                <div className="flex gap-1 flex-col sm:flex-row">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => {
                      window.open(previewImage, "_blank");
                    }}
                    data-testid="button-open-preview"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Abrir
                  </Button>
                  {navigator.share && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => {
                        fetch(previewImage)
                          .then(res => res.blob())
                          .then(blob => {
                            const file = new File([blob], "alaban.png", { type: "image/png" });
                            navigator.share({ files: [file], title: "Albarán" });
                          });
                      }}
                      data-testid="button-share-preview"
                    >
                      <Share2 className="w-3 h-3 mr-1" />
                      Compartir
                    </Button>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground text-center">
                  Click derecho → Guardar imagen como
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
