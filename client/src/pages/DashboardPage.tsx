import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, MapPin, Truck, X, Download, Share2, FileDown, CheckCircle, Clock } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DriverDoorAnimation } from "@/components/DriverDoorAnimation";
import { useToast } from "@/hooks/use-toast";
import { AnimatedPageBackground } from "@/components/AnimatedPageBackground";
import { WorkerAssignmentModal } from "@/components/WorkerAssignmentModal";
import { Badge } from "@/components/ui/badge";
import html2canvas from "html2canvas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function DashboardPage() {
  const { toast } = useToast();
  const [showAnimation, setShowAnimation] = useState(true);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [albaranesModalOpen, setAlbaranesModalOpen] = useState(false);
  const [albaranesModalType, setAlbaranesModalType] = useState<"pending" | "signed">("pending");
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const deliveryNoteRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const previewDeliveryNote = (photo: string) => {
    if (!photo) {
      toast({ title: "Error", description: "No hay foto disponible", variant: "destructive" });
      return;
    }
    setPreviewImage(photo);
    setAlbaranesModalOpen(false);
    setPreviewModalOpen(true);
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
    <Card key={quote.id} className="hover-elevate bg-slate-50 dark:bg-slate-900/30 border-muted-foreground/10 shadow-sm">
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
      <div className="relative z-10 space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Header con botón de descarga */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold">Panel de Empresa</h1>
            <p className="text-sm text-muted-foreground mt-1 hidden sm:block">Resumen de tu actividad</p>
          </div>
          <button
            onClick={() => setDownloadModalOpen(true)}
            className="rounded-lg border border-muted-foreground/10 bg-slate-50 dark:bg-slate-900/30 p-3 sm:p-4 text-center shadow-sm hover-elevate flex-shrink-0"
            data-testid="button-download-albaranes"
          >
            <FileDown className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
          </button>
        </div>

        {/* Albaranes - Tarjetas clicables que abren detalles */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <button
            onClick={() => { setAlbaranesModalType("pending"); setAlbaranesModalOpen(true); }}
            className="rounded-lg border border-muted-foreground/10 bg-slate-50 dark:bg-slate-900/30 p-4 text-left shadow-sm hover-elevate"
            data-testid="button-view-pending-albaranes"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-bold">{pendingDeliveryNotes.length}</div>
                <p className="text-xs text-muted-foreground truncate">Pendientes</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => { setAlbaranesModalType("signed"); setAlbaranesModalOpen(true); }}
            className="rounded-lg border border-muted-foreground/10 bg-slate-50 dark:bg-slate-900/30 p-4 text-left shadow-sm hover-elevate"
            data-testid="button-view-signed-albaranes"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-bold">{signedDeliveryNotes.length}</div>
                <p className="text-xs text-muted-foreground truncate">Firmados</p>
              </div>
            </div>
          </button>
        </div>

        {/* Presupuestos Pendientes */}
        {pendingQuotes.length > 0 && (
          <Card className="bg-slate-50 dark:bg-slate-900/30 border-muted-foreground/10 shadow-sm">
            <CardHeader className="py-3 px-4 sm:py-4 sm:px-6">
              <CardTitle className="text-sm sm:text-base">Presupuestos Pendientes ({pendingQuotes.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              <div className="space-y-3">
                {pendingQuotes.map((quote: any) => renderQuoteCard(quote, true))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Presupuestos Firmados */}
        {signedQuotes.length > 0 && (
          <Card className="bg-slate-50 dark:bg-slate-900/30 border-muted-foreground/10 shadow-sm">
            <CardHeader className="py-3 px-4 sm:py-4 sm:px-6">
              <CardTitle className="text-sm sm:text-base">Presupuestos Firmados ({signedQuotes.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              <div className="space-y-3">
                {signedQuotes.map((quote: any) => renderQuoteCard(quote, false))}
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

      {/* Modal de Descarga de Albaranes */}
      <Dialog open={downloadModalOpen} onOpenChange={setDownloadModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <FileDown className="h-5 w-5 text-green-500" />
              Descargar Albaranes
            </DialogTitle>
            <DialogDescription>
              Selecciona el tipo de albaranes que quieres descargar para tu respaldo de seguridad.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4 px-4"
              disabled={isDownloading || signedDeliveryNotes.filter((n: any) => n.photo).length === 0}
              onClick={async () => {
                const notesWithPhotos = signedDeliveryNotes.filter((n: any) => n.photo);
                if (notesWithPhotos.length === 0) {
                  toast({ title: "Sin fotos", description: "No hay albaranes firmados con foto para descargar", variant: "destructive" });
                  return;
                }
                setIsDownloading(true);
                toast({ title: "Preparando descarga...", description: `Descargando ${notesWithPhotos.length} foto(s)` });
                try {
                  for (const note of notesWithPhotos) {
                    const response = await fetch(note.photo);
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `albaran-${note.noteNumber || note.id}-firmado-${note.destination || 'destino'}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    await new Promise(resolve => setTimeout(resolve, 300));
                  }
                  toast({ title: "Descarga completada", description: `Se descargaron ${notesWithPhotos.length} foto(s) de albaranes firmados` });
                } catch (error) {
                  console.error("Download error:", error);
                  toast({ title: "Error", description: "No se pudieron descargar los albaranes", variant: "destructive" });
                } finally {
                  setIsDownloading(false);
                  setDownloadModalOpen(false);
                }
              }}
              data-testid="button-download-signed"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold">Albaranes Firmados</p>
                  <p className="text-xs text-muted-foreground">{signedDeliveryNotes.filter((n: any) => n.photo).length} foto(s) disponible(s)</p>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4 px-4"
              disabled={isDownloading || pendingDeliveryNotes.length === 0}
              onClick={async () => {
                if (pendingDeliveryNotes.length === 0) {
                  toast({ title: "Sin albaranes", description: "No hay albaranes pendientes para descargar", variant: "destructive" });
                  return;
                }
                setIsDownloading(true);
                toast({ title: "Preparando descarga...", description: `Generando ${pendingDeliveryNotes.length} albarán(es) pendiente(s)` });
                try {
                  const pendingData = pendingDeliveryNotes.map((note: any) => ({
                    numeroAlbaran: note.noteNumber || '-',
                    origen: note.pickupOrigin || 'N/A',
                    destino: note.destination || 'N/A',
                    cliente: note.clientName || 'N/A',
                    vehiculo: note.vehicleType || 'N/A',
                    fecha: note.date ? new Date(note.date).toLocaleDateString('es-ES') : 'N/A',
                    hora: note.time || 'N/A',
                    trabajador: note.workerName || 'Desconocido',
                    observaciones: note.observations || 'Sin observaciones'
                  }));
                  const csvContent = "data:text/csv;charset=utf-8," 
                    + "Nº Albarán,Origen,Destino,Cliente,Vehículo,Fecha,Hora,Trabajador,Observaciones\n"
                    + pendingData.map((row: any) => Object.values(row).map(v => `"${v}"`).join(",")).join("\n");
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", `albaranes-pendientes-${new Date().toISOString().split('T')[0]}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  toast({ title: "Descarga completada", description: `Se descargó el listado de ${pendingDeliveryNotes.length} albarán(es) pendiente(s)` });
                } catch (error) {
                  console.error("Download error:", error);
                  toast({ title: "Error", description: "No se pudo generar el archivo", variant: "destructive" });
                } finally {
                  setIsDownloading(false);
                  setDownloadModalOpen(false);
                }
              }}
              data-testid="button-download-pending"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold">Albaranes Pendientes</p>
                  <p className="text-xs text-muted-foreground">{pendingDeliveryNotes.length} albarán(es) disponible(s)</p>
                </div>
              </div>
            </Button>
          </div>
          {isDownloading && (
            <div className="flex items-center justify-center py-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-muted-foreground">Descargando...</span>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Albaranes List Modal */}
      <Dialog open={albaranesModalOpen} onOpenChange={setAlbaranesModalOpen}>
        <DialogContent className="max-w-md max-h-[95vh] overflow-y-auto w-screen sm:w-[95vw] h-screen sm:h-auto p-2 sm:p-3 sm:rounded-lg rounded-none">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base sm:text-lg">
              Albaranes {albaranesModalType === "pending" ? "Pendientes" : "Firmados"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {(albaranesModalType === "pending" ? pendingDeliveryNotes : signedDeliveryNotes).map((note: any) => (
              <div key={note.id} className="group relative overflow-hidden rounded-md border border-muted-foreground/10 bg-slate-50 dark:bg-slate-900/30 text-left shadow-sm w-full p-2" ref={(el) => { deliveryNoteRefs.current[note.id] = el as any; }}>
                <div className="space-y-1.5">
                  {/* Note Number Badge */}
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded" data-testid={`note-number-${note.id}`}>
                      Albarán #{note.noteNumber || '—'}
                    </span>
                  </div>
                  
                  {/* Photo on top - compact */}
                  {note.photo && (
                    <div className="mb-1.5 -m-2 mb-2 mt-1">
                      <img src={note.photo} alt="Albarán" className="w-full rounded-t max-h-32 object-cover cursor-pointer hover:opacity-90" onClick={() => previewDeliveryNote(note.photo)} />
                    </div>
                  )}

                  {/* Header - Origin and Destination */}
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <div className="bg-muted/30 rounded min-h-[44px] px-2 flex items-center justify-center">
                      <div className="flex flex-col items-center -translate-y-[7px]">
                        <span className="text-muted-foreground text-[9px] font-semibold leading-none">ORIGEN</span>
                        <span className="font-medium text-[10px] leading-none mt-1">{note.pickupOrigin || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="bg-muted/30 rounded min-h-[44px] px-2 flex items-center justify-center">
                      <div className="flex flex-col items-center -translate-y-[7px]">
                        <span className="text-muted-foreground text-[9px] font-semibold leading-none">DESTINO</span>
                        <span className="font-medium text-[10px] leading-none mt-1">{note.destination || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Details Grid - 3 columns for better spacing */}
                  <div className="grid grid-cols-3 gap-1 text-[10px]">
                    <div className="bg-muted/30 rounded min-h-[44px] px-2 flex items-center justify-center">
                      <div className="flex flex-col items-center -translate-y-[7px]">
                        <span className="text-muted-foreground text-[9px] font-semibold leading-none">CLIENTE</span>
                        <span className="font-medium text-[10px] leading-none mt-1 line-clamp-1">{note.clientName || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="bg-muted/30 rounded min-h-[44px] px-2 flex items-center justify-center">
                      <div className="flex flex-col items-center -translate-y-[7px]">
                        <span className="text-muted-foreground text-[9px] font-semibold leading-none">VEHÍCULO</span>
                        <span className="font-medium text-[10px] leading-none mt-1">{note.vehicleType || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="bg-muted/30 rounded min-h-[44px] px-2 flex items-center justify-center">
                      <div className="flex flex-col items-center -translate-y-[7px]">
                        <span className="text-muted-foreground text-[9px] font-semibold leading-none">FECHA</span>
                        <span className="font-medium text-[10px] leading-none mt-1">{note.date ? new Date(note.date).toLocaleDateString('es-ES') : 'N/A'}</span>
                      </div>
                    </div>
                    <div className="bg-muted/30 rounded min-h-[44px] px-2 flex items-center justify-center">
                      <div className="flex flex-col items-center -translate-y-[7px]">
                        <span className="text-muted-foreground text-[9px] font-semibold leading-none">HORA</span>
                        <span className="font-medium text-[10px] leading-none mt-1">{note.time || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="bg-muted/30 rounded min-h-[44px] px-2 flex items-center justify-center">
                      <div className="flex flex-col items-center -translate-y-[7px]">
                        <span className="text-muted-foreground text-[9px] font-semibold leading-none">TRABAJADOR</span>
                        <span className="font-medium text-[10px] leading-none mt-1 line-clamp-1">{note.workerName || 'Desconocido'}</span>
                      </div>
                    </div>
                    <div className="bg-muted/30 rounded min-h-[44px] px-2 flex items-center justify-center">
                      <div className="flex flex-col items-center -translate-y-[7px]">
                        <span className="text-muted-foreground text-[9px] font-semibold leading-none">OBS.</span>
                        <span className="font-medium text-[10px] leading-none mt-1 line-clamp-1">{note.observations || 'Sin observaciones'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Optional fields - separate 2-column grid for balanced layout */}
                  {((note as any).waitTime || (albaranesModalType === "signed" && note.signedAt)) && (
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      {(note as any).waitTime ? (
                        <div className="bg-muted/30 rounded min-h-[44px] px-2 flex items-center justify-center">
                          <div className="flex flex-col items-center -translate-y-[7px]">
                            <span className="text-muted-foreground text-[9px] font-semibold leading-none">ESPERA</span>
                            <span className="font-medium text-[10px] leading-none mt-1">{Math.floor((note as any).waitTime / 60)}h {(note as any).waitTime % 60}m</span>
                          </div>
                        </div>
                      ) : null}
                      {albaranesModalType === "signed" && note.signedAt && (
                        <div className="bg-muted/30 rounded min-h-[44px] px-2 flex items-center justify-center">
                          <div className="flex flex-col items-center -translate-y-[7px]">
                            <span className="text-muted-foreground text-[9px] font-semibold leading-none">FIRMADO</span>
                            <span className="font-medium text-[9px] leading-none mt-1">{new Date(note.signedAt).toLocaleString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-1 mt-1" data-testid={`buttons-${note.id}`}>
                    {note.photo && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs h-7"
                        onClick={() => previewDeliveryNote(note.photo)}
                        data-testid={`button-view-photo-${note.id}`}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Ver foto
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs h-7"
                      onClick={() => {
                        const element = deliveryNoteRefs.current[note.id];
                        if (element) {
                          const clonedElement = element.cloneNode(true) as HTMLElement;
                          const buttonsDiv = clonedElement.querySelector(`[data-testid="buttons-${note.id}"]`);
                          if (buttonsDiv) {
                            buttonsDiv.remove();
                          }
                          
                          clonedElement.querySelectorAll('.line-clamp-1, .line-clamp-2').forEach((el) => {
                            el.classList.remove('line-clamp-1', 'line-clamp-2');
                            (el as HTMLElement).style.overflow = 'visible';
                            (el as HTMLElement).style.textOverflow = 'clip';
                            (el as HTMLElement).style.whiteSpace = 'normal';
                            (el as HTMLElement).style.display = 'block';
                          });
                          
                          const img = clonedElement.querySelector('img');
                          if (img) {
                            img.style.maxHeight = 'none';
                            img.style.height = 'auto';
                            img.style.objectFit = 'contain';
                          }
                          
                          const originalRect = element.getBoundingClientRect();
                          clonedElement.style.position = "fixed";
                          clonedElement.style.left = "-9999px";
                          clonedElement.style.top = "-9999px";
                          clonedElement.style.width = originalRect.width + "px";
                          clonedElement.style.backgroundColor = "#0f172a";
                          document.body.appendChild(clonedElement);
                          
                          const noteDestination = note.destination;
                          
                          setAlbaranesModalOpen(false);
                          toast({ title: "Procesando...", description: "Preparando imagen para compartir" });
                          
                          setTimeout(async () => {
                            try {
                              const canvas = await html2canvas(clonedElement, { scale: 2, backgroundColor: "#0f172a", useCORS: true, allowTaint: true, logging: false });
                              document.body.removeChild(clonedElement);
                              
                              const blob = await new Promise<Blob>((resolve) => {
                                canvas.toBlob((b) => resolve(b as Blob), "image/png");
                              });
                              const file = new File([blob], `albaran-${noteDestination || 'albaran'}-${new Date().toISOString().split('T')[0]}.png`, { type: "image/png" });
                              if (navigator.share) {
                                await navigator.share({ files: [file], title: "Albarán" });
                              }
                            } catch (error: any) {
                              console.error("Share error:", error);
                              if (error.name !== "AbortError") {
                                toast({ title: "Error", description: "No se pudo compartir el albarán", variant: "destructive" });
                              }
                            }
                          }, 100);
                        }
                      }}
                      data-testid={`button-share-albarane-${note.id}`}
                    >
                      <Share2 className="w-3 h-3 mr-1" />
                      Compartir
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal - Simple Overlay */}
      {previewModalOpen && previewImage && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center p-2 sm:p-4">
          <div className="w-full max-w-lg h-full sm:h-auto sm:max-h-[90vh] flex flex-col bg-background sm:rounded-lg overflow-hidden">
            <div className="flex-1 flex items-center justify-center bg-black overflow-hidden">
              <img src={previewImage} alt="Albarán" className="w-auto h-auto max-w-full max-h-full object-contain" />
            </div>
            <div className="flex-shrink-0 bg-background border-t border-border p-2 space-y-2">
              <div className="flex gap-1 flex-col sm:flex-row">
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
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => {
                    setPreviewModalOpen(false);
                    setAlbaranesModalOpen(true);
                  }}
                  data-testid="button-close-preview"
                >
                  <X className="w-3 h-3 mr-1" />
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
