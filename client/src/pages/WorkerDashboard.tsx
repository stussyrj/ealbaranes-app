import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AnimatedPageBackground } from "@/components/AnimatedPageBackground";
import { DeliveryNoteGenerator } from "@/components/DeliveryNoteGenerator";
import { Home, FileText, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Quote, DeliveryNote } from "@shared/schema";

const WORKERS = [
  { id: "worker-jose", name: "José", email: "jose@directtransports.com", description: "Trabajador de transporte" },
  { id: "worker-luis", name: "Luis", email: "luis@directtransports.com", description: "Especialista en entregas" },
  { id: "worker-miguel", name: "Miguel", email: "miguel@directtransports.com", description: "Coordinador de rutas" },
];

export default function WorkerDashboard() {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Quote | null>(null);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [createDeliveryOpen, setCreateDeliveryOpen] = useState(false);
  const [editDeliveryOpen, setEditDeliveryOpen] = useState(false);
  const [selectedNoteToEdit, setSelectedNoteToEdit] = useState<DeliveryNote | null>(null);
  const [albaranesModalOpen, setAlbaranesModalOpen] = useState(false);
  const [albaranesModalType, setAlbaranesModalType] = useState<"pending" | "signed">("pending");
  const [capturePhotoOpen, setCapturePhotoOpen] = useState(false);
  const [selectedNoteForPhoto, setSelectedNoteForPhoto] = useState<DeliveryNote | null>(null);
  const [selectedNoteDetail, setSelectedNoteDetail] = useState<DeliveryNote | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showCameraPreview, setShowCameraPreview] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    clientName: "",
    pickupOrigin: "",
    destination: "",
    vehicleType: "Furgoneta",
    date: new Date().toISOString().split("T")[0],
    time: "09:00",
    observations: "",
    waitTime: 0,
  });

  const handleSelectWorker = (workerId: string) => {
    if (user) {
      setUser({ ...user, workerId });
    }
  };

  const handleBackToSelection = () => {
    if (user) {
      setUser({ ...user, workerId: undefined });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Setup camera and render to canvas
  useEffect(() => {
    if (!showCameraPreview) {
      // Stop camera when preview is hidden
      if (videoElementRef.current) {
        videoElementRef.current.pause();
        videoElementRef.current.srcObject = null;
      }
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
      return;
    }

    let isMounted = true;
    
    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "environment"
          }
        });
        
        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        setCameraStream(stream);
        
        // Create and setup video element
        if (!videoElementRef.current) {
          const videoEl = document.createElement('video');
          videoEl.autoplay = true;
          videoEl.playsInline = true;
          videoEl.muted = true;
          videoElementRef.current = videoEl;
        }
        
        videoElementRef.current.srcObject = stream;
        await videoElementRef.current.play();
        
        // Start rendering frames to canvas
        const renderFrame = () => {
          if (!isMounted || !videoElementRef.current || !canvasRef.current) return;
          
          const video = videoElementRef.current;
          const canvas = canvasRef.current;
          
          try {
            // Always try to draw, video might have data
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                // Set canvas size to match video
                if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
                }
                // Draw frame
                ctx.drawImage(video, 0, 0);
              }
            }
          } catch (e) {
            console.log("Draw error:", e);
          }
          
          frameIdRef.current = requestAnimationFrame(renderFrame);
        };
        
        frameIdRef.current = requestAnimationFrame(renderFrame);
        
      } catch (error) {
        if (isMounted) {
          console.error("Error accediendo a la cámara:", error);
          alert("No se pudo acceder a la cámara. Asegúrate de permitir el acceso a la cámara.");
          setShowCameraPreview(false);
        }
      }
    };

    setupCamera();
    
    return () => {
      isMounted = false;
    };
  }, [showCameraPreview]);

  // Cleanup camera stream on component unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      if (videoElementRef.current) {
        videoElementRef.current.srcObject = null;
      }
    };
  }, [cameraStream]);

  const { data: orders = [] } = useQuery<Quote[]>({
    queryKey: ["/api/workers", user?.workerId || "", "orders"],
    enabled: !!user?.workerId,
  });

  const { data: deliveryNotes = [] } = useQuery<DeliveryNote[]>({
    queryKey: ["/api/workers", user?.workerId || "", "delivery-notes"],
    enabled: !!user?.workerId,
  });

  // Si no hay workerId, mostrar selección de trabajador
  if (!user?.workerId) {
    return (
      <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6">
        <AnimatedPageBackground />
        <div className="relative z-10 w-full max-w-sm sm:max-w-2xl">
          <div className="text-center mb-8 sm:mb-12">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Selecciona tu Perfil</h1>
            <p className="text-xs sm:text-sm text-muted-foreground px-2">Elige cuál trabajador eres</p>
          </div>

          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            {WORKERS.map((worker) => (
              <Card key={worker.id} className="hover-elevate cursor-pointer transition-all active:scale-95" onClick={() => handleSelectWorker(worker.id)}>
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-lg sm:text-xl">{worker.name}</CardTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground">{worker.email}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{worker.description}</p>
                  <Button
                    onClick={() => handleSelectWorker(worker.id)}
                    className="w-full bg-purple-600/85 hover:bg-purple-700/85 dark:bg-purple-600/85 dark:hover:bg-purple-700/85 text-white text-xs sm:text-sm"
                    data-testid={`button-select-worker-${worker.id}`}
                  >
                    {worker.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getDeliveryNoteStatus = (quoteId: string) => {
    const note = deliveryNotes.find((n: DeliveryNote) => n.quoteId === quoteId);
    return note?.status || null;
  };

  const pendingOrders = orders.filter((o: Quote) => 
    o.status === "assigned" && !getDeliveryNoteStatus(o.id)
  );

  const signedOrders = orders.filter((o: Quote) => 
    getDeliveryNoteStatus(o.id) === "signed"
  );

  const deliveredOrders = orders.filter((o: Quote) => 
    getDeliveryNoteStatus(o.id) === "delivered"
  );

  const openDeliveryModal = (order: Quote) => {
    setSelectedOrder(order);
    setDeliveryModalOpen(true);
  };

  // Calcular estadísticas
  const confirmedOrders = orders.filter((o: Quote) => 
    o.status === "assigned" || o.status === "confirmed" || o.status === "approved"
  );

  // Solo contar horas de órdenes con albarán firmado o entregado
  const signedOrDeliveredOrders = orders.filter((o: Quote) => {
    const noteStatus = getDeliveryNoteStatus(o.id);
    return noteStatus === "signed" || noteStatus === "delivered";
  });

  const totalRouteMinutes = signedOrDeliveredOrders.reduce((sum: number, order: Quote) => 
    sum + (order.duration || 0), 0
  );

  const getTodayRouteMinutes = () => {
    const today = new Date().toDateString();
    return signedOrDeliveredOrders.reduce((sum: number, order: Quote) => {
      if (order.createdAt) {
        const orderDate = new Date(order.createdAt).toDateString();
        if (orderDate === today) {
          return sum + (order.duration || 0);
        }
      }
      return sum;
    }, 0);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Calcular albaranes del día y del mes
  const getTodayDeliveryNotes = () => {
    const today = new Date().toDateString();
    return deliveryNotes.filter((note: DeliveryNote) => {
      if (note.signedAt) {
        const noteDate = new Date(note.signedAt).toDateString();
        return noteDate === today;
      }
      return false;
    });
  };

  const getMonthDeliveryNotes = () => {
    const now = new Date();
    return deliveryNotes.filter((note: DeliveryNote) => {
      if (note.signedAt) {
        const noteDate = new Date(note.signedAt);
        return noteDate.getMonth() === now.getMonth() && noteDate.getFullYear() === now.getFullYear();
      }
      return false;
    });
  };

  const renderOrderCard = (order: Quote, showGenerateBtn = false) => {
    const noteStatus = getDeliveryNoteStatus(order.id);
    const getStatusColor = (status: string | null) => {
      switch (status) {
        case "pending":
          return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300";
        case "signed":
          return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
        case "delivered":
          return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
        default:
          return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300";
      }
    };

    return (
      <Card key={order.id} className="hover-elevate">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">
                {order.origin} → {order.destination}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Nº {order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge className={`${getStatusColor(noteStatus)}`}>
                {noteStatus === "signed" && "Firmado"}
                {noteStatus === "delivered" && "Entregado"}
                {!noteStatus && "Pendiente"}
              </Badge>
              {order.isUrgent && (
                <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                  Urgente
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Distancia</p>
              <p className="font-semibold">{(order.distance || 0).toFixed(1)} km</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Precio</p>
              <p className="font-semibold">{(order.totalPrice || 0).toFixed(2)}€</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Cliente</p>
              <p className="font-semibold text-xs">{order.customerName}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Teléfono</p>
              <p className="font-semibold text-xs">{order.phoneNumber}</p>
            </div>
          </div>

          {order.pickupTime && (
            <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded">
              <p className="text-xs text-muted-foreground">Recogida solicitada</p>
              <p className="text-sm font-mono">{order.pickupTime}</p>
            </div>
          )}

          {order.observations && (
            <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded">
              <p className="text-xs text-muted-foreground">Observaciones</p>
              <p className="text-sm">{order.observations}</p>
            </div>
          )}

          {showGenerateBtn && !noteStatus && (
            <Button
              onClick={() => openDeliveryModal(order)}
              className="w-full bg-green-600/85 hover:bg-green-700/85 dark:bg-green-600/85 dark:hover:bg-green-700/85 text-white px-4 py-2 rounded-lg backdrop-blur-sm border border-green-500/40"
              data-testid={`button-generate-delivery-note-${order.id}`}
            >
              Generar Albarán
            </Button>
          )}

          {noteStatus && (
            <div className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-center text-sm font-medium">
              Albarán {noteStatus === "signed" ? "Firmado" : "Entregado"}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderDeliveryNoteCard = (note: DeliveryNote) => {
    const getStatusColor = (hasPhoto?: boolean) => {
      return hasPhoto 
        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
        : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300";
    };

    return (
      <Card key={note.id} className="hover-elevate">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-2">
                {note.pickupOrigin && note.destination ? `${note.pickupOrigin} → ${note.destination}` : note.quoteId}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {note.clientName && `Cliente: ${note.clientName}`}
              </p>
            </div>
            <Badge className={`${getStatusColor(!!note.photo)}`} data-testid={`badge-status-${note.id}`}>
              {note.photo ? "✓ Firmado" : "Pendiente"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {note.vehicleType && (
              <div>
                <p className="text-muted-foreground text-xs">Vehículo</p>
                <p className="font-semibold">{note.vehicleType}</p>
              </div>
            )}
            {note.date && (
              <div>
                <p className="text-muted-foreground text-xs">Fecha</p>
                <p className="font-semibold">{new Date(note.date).toLocaleDateString('es-ES')}</p>
              </div>
            )}
            {note.time && (
              <div>
                <p className="text-muted-foreground text-xs">Hora</p>
                <p className="font-semibold">{note.time}</p>
              </div>
            )}
            {note.signedAt && (
              <div>
                <p className="text-muted-foreground text-xs">Firmado</p>
                <p className="font-semibold">{new Date(note.signedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            )}
          </div>

          {note.pickupOrigin && (
            <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded text-sm">
              <p className="text-muted-foreground text-xs">Recogida</p>
              <p className="font-semibold">{note.pickupOrigin}</p>
            </div>
          )}

          {note.destination && (
            <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded text-sm">
              <p className="text-muted-foreground text-xs">Entrega</p>
              <p className="font-semibold">{note.destination}</p>
            </div>
          )}

          {note.observations && (
            <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded text-sm">
              <p className="text-muted-foreground text-xs">Observaciones</p>
              <p>{note.observations}</p>
            </div>
          )}

          {note.photo && (
            <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded">
              <p className="text-muted-foreground text-xs mb-2">Fotografía</p>
              <img src={note.photo} alt="Foto del albarán" className="w-full rounded-md max-h-48 object-cover" data-testid={`img-delivery-note-photo-${note.id}`} />
            </div>
          )}

          {!note.photo && (
            <Button
              onClick={() => {
                setSelectedNoteForPhoto(note);
                setCapturePhotoOpen(true);
                setCapturedPhoto(null);
              }}
              variant="outline"
              className="w-full"
              data-testid={`button-add-photo-${note.id}`}
            >
              📸 Agregar Fotografía
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="relative">
      <AnimatedPageBackground />
      <div className="relative z-10 space-y-6 p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold">Mis Servicios</h1>
            <p className="text-sm text-muted-foreground mt-1">Trabajador: {user?.username}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToSelection}
            className="gap-2 w-full md:w-auto"
            data-testid="button-back-to-worker-selection"
          >
            <Home className="h-4 w-4" />
            Inicio
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 mb-6">
          <Card className="hover-elevate">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Albaranes Totales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Hoy</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {getTodayDeliveryNotes().length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Este Mes</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {getMonthDeliveryNotes().length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate cursor-pointer" onClick={() => setCreateDeliveryOpen(true)}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Hacer Albarán
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center min-h-24">
                <Button
                  className="w-full bg-purple-600/85 hover:bg-purple-700/85 dark:bg-purple-600/85 dark:hover:bg-purple-700/85 text-white"
                  onClick={() => setCreateDeliveryOpen(true)}
                >
                  Crear Nuevo Albarán
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {orders.length === 0 && deliveryNotes.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No hay servicios asignados</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue={orders.length > 0 ? "pending" : "albaranes"} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
              {orders.length > 0 && (
                <>
                  <TabsTrigger value="pending" className="relative">
                    Pendientes
                    {pendingOrders.length > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {pendingOrders.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="signed">
                    Firmados
                    {signedOrders.length > 0 && (
                      <span className="ml-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {signedOrders.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="delivered">
                    Entregados
                    {deliveredOrders.length > 0 && (
                      <span className="ml-2 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {deliveredOrders.length}
                      </span>
                    )}
                  </TabsTrigger>
                </>
              )}
              <TabsTrigger value="albaranes">
                Albaranes
                {deliveryNotes.length > 0 && (
                  <span className="ml-2 bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {deliveryNotes.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pendingOrders.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">No hay servicios pendientes</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {pendingOrders.map((order: Quote) => renderOrderCard(order, true))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="signed" className="space-y-4">
              {signedOrders.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">No hay servicios firmados</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {signedOrders.map((order: Quote) => renderOrderCard(order, false))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="delivered" className="space-y-4">
              {deliveredOrders.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">No hay servicios entregados</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {deliveredOrders.map((order: Quote) => renderOrderCard(order, false))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="albaranes" className="space-y-4">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <Card className="hover-elevate cursor-pointer" onClick={() => { setAlbaranesModalType("pending"); setAlbaranesModalOpen(true); }}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Albaranes Pendientes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                      {deliveryNotes.filter(n => !n.photo).length}
                    </div>
                    <Button className="w-full" onClick={() => { setAlbaranesModalType("pending"); setAlbaranesModalOpen(true); }}>
                      Ver {deliveryNotes.filter(n => !n.photo).length} Albaranes Pendientes
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover-elevate cursor-pointer" onClick={() => { setAlbaranesModalType("signed"); setAlbaranesModalOpen(true); }}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Albaranes Firmados</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {deliveryNotes.filter(n => n.photo).length}
                    </div>
                    <Button className="w-full" onClick={() => { setAlbaranesModalType("signed"); setAlbaranesModalOpen(true); }}>
                      Ver {deliveryNotes.filter(n => n.photo).length} Albaranes Firmados
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Albaranes Modal */}
      <Dialog open={albaranesModalOpen} onOpenChange={setAlbaranesModalOpen}>
        <DialogContent className="max-w-md max-h-[95vh] overflow-y-auto w-screen sm:w-[95vw] h-screen sm:h-auto p-2 sm:p-3 sm:rounded-lg rounded-none">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base sm:text-lg">
              Albaranes {albaranesModalType === "pending" ? "Pendientes" : "Firmados"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {(albaranesModalType === "pending" ? deliveryNotes.filter(n => !n.photo) : deliveryNotes.filter(n => n.photo)).map((note: DeliveryNote) => (
              <Card key={note.id} className="p-2 overflow-hidden">
                <div className="space-y-1.5">
                  {note.photo && (
                    <div className="mb-1.5 -m-2 mb-2">
                      <img src={note.photo} alt="Albarán" className="w-full rounded-t max-h-32 object-cover" />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <div className="bg-muted/30 rounded p-2 text-center flex flex-col justify-center">
                      <p className="text-muted-foreground text-[9px] font-semibold">ORIGEN</p>
                      <p className="font-medium text-[10px]">{note.pickupOrigin || 'N/A'}</p>
                    </div>
                    <div className="bg-muted/30 rounded p-2 text-center flex flex-col justify-center">
                      <p className="text-muted-foreground text-[9px] font-semibold">DESTINO</p>
                      <p className="font-medium text-[10px]">{note.destination || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[10px]">
                    <div className="bg-muted/30 rounded p-2 text-center flex flex-col justify-center">
                      <p className="text-muted-foreground text-[9px] font-semibold">CLIENTE</p>
                      <p className="font-medium text-[10px]">{note.clientName || 'N/A'}</p>
                    </div>
                    <div className="bg-muted/30 rounded p-2 text-center flex flex-col justify-center">
                      <p className="text-muted-foreground text-[9px] font-semibold">VEHÍCULO</p>
                      <p className="font-medium text-[10px]">{note.vehicleType || 'N/A'}</p>
                    </div>
                    <div className="bg-muted/30 rounded p-2 text-center flex flex-col justify-center">
                      <p className="text-muted-foreground text-[9px] font-semibold">FECHA</p>
                      <p className="font-medium text-[10px]">{note.date ? new Date(note.date).toLocaleDateString('es-ES') : 'N/A'}</p>
                    </div>
                    <div className="bg-muted/30 rounded p-2 text-center flex flex-col justify-center">
                      <p className="text-muted-foreground text-[9px] font-semibold">HORA</p>
                      <p className="font-medium text-[10px]">{note.time || 'N/A'}</p>
                    </div>
                    <div className="bg-muted/30 rounded p-2 text-center flex flex-col justify-center">
                      <p className="text-muted-foreground text-[9px] font-semibold">OBS.</p>
                      <p className="font-medium text-[10px] line-clamp-1">{note.observations || 'Sin observaciones'}</p>
                    </div>
                  </div>
                  
                  {/* Optional fields - separate 2-column grid for balanced layout */}
                  {((note as any).waitTime || (albaranesModalType === "signed" && note.signedAt)) && (
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      {(note as any).waitTime ? (
                        <div className="bg-muted/30 rounded p-2 text-center flex flex-col justify-center">
                          <p className="text-muted-foreground text-[9px] font-semibold">ESPERA</p>
                          <p className="font-medium text-[10px]">{Math.floor((note as any).waitTime / 60)}h {(note as any).waitTime % 60}m</p>
                        </div>
                      ) : null}
                      {albaranesModalType === "signed" && note.signedAt && (
                        <div className="bg-muted/30 rounded p-2 text-center flex flex-col justify-center">
                          <p className="text-muted-foreground text-[9px] font-semibold">FIRMADO</p>
                          <p className="font-medium text-[9px]">{new Date(note.signedAt).toLocaleString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {albaranesModalType === "pending" && (
                    <div className="flex gap-1 text-xs mt-2">
                      <Button size="sm" variant="outline" className="flex-1 h-7" onClick={() => { setSelectedNoteToEdit(note); setFormData({ clientName: note.clientName || "", pickupOrigin: note.pickupOrigin || "", destination: note.destination || "", vehicleType: note.vehicleType || "Furgoneta", date: note.date || new Date().toISOString().split("T")[0], time: note.time || "09:00", observations: note.observations || "", waitTime: (note as any).waitTime || 0 }); setEditDeliveryOpen(true); }}>Editar</Button>
                      <Button size="sm" variant="outline" className="flex-1 h-7" onClick={() => { setSelectedNoteForPhoto(note); setCapturePhotoOpen(true); }}>📸</Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <DeliveryNoteGenerator
        open={deliveryModalOpen}
        onOpenChange={setDeliveryModalOpen}
        quote={selectedOrder}
        workerId={user?.workerId}
      />

      {/* Edit Delivery Dialog */}
      <Dialog open={editDeliveryOpen} onOpenChange={setEditDeliveryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Albarán</DialogTitle>
            <DialogDescription>
              Modifica los datos del albarán antes de firmarlo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nombre del Cliente</label>
              <Input
                placeholder="Ej: Juan García"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Origen (Recogida)</label>
              <Input
                placeholder="Ej: Calle Principal, 123"
                value={formData.pickupOrigin}
                onChange={(e) => setFormData({ ...formData, pickupOrigin: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Destino</label>
              <Input
                placeholder="Ej: Avenida Central, 456"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de Vehículo</label>
              <div className="grid grid-cols-2 gap-2">
                {["Moto", "Furgoneta", "Furgón", "Carrozado"].map((tipo) => (
                  <Button
                    key={tipo}
                    type="button"
                    variant={formData.vehicleType === tipo ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, vehicleType: tipo })}
                    className="text-xs"
                  >
                    {tipo}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Fecha</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Hora</label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Observaciones</label>
              <Textarea
                placeholder="Notas adicionales sobre el albarán..."
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tiempo de Espera</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="300"
                  value={formData.waitTime > 0 ? formData.waitTime : ""}
                  onChange={(e) => setFormData({ ...formData, waitTime: Math.min(300, Math.max(0, parseInt(e.target.value) || 0)) })}
                  placeholder="Minutos"
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground">
                  {Math.floor(formData.waitTime / 60)}h {formData.waitTime % 60}m
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Máximo 5 horas (300 minutos)</p>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditDeliveryOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  try {
                    if (!selectedNoteToEdit) return;
                    
                    const updateData = {
                      clientName: formData.clientName,
                      pickupOrigin: formData.pickupOrigin,
                      destination: formData.destination,
                      vehicleType: formData.vehicleType,
                      date: formData.date,
                      time: formData.time,
                      observations: formData.observations,
                      waitTime: formData.waitTime || null,
                    };

                    const response = await fetch(`/api/delivery-notes/${selectedNoteToEdit.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(updateData),
                      credentials: "include",
                    });

                    if (response.status === 403) {
                      alert("No se pueden editar albaranes firmados");
                      return;
                    }

                    if (response.ok) {
                      const updatedNote = await response.json();
                      const workerKey = ["/api/workers", user?.workerId || "", "delivery-notes"];
                      const adminKey = ["/api/delivery-notes"];
                      
                      const workerNotes = queryClient.getQueryData<DeliveryNote[]>(workerKey) || [];
                      queryClient.setQueryData(workerKey, workerNotes.map(n => n.id === updatedNote.id ? updatedNote : n));
                      
                      const allNotes = queryClient.getQueryData<DeliveryNote[]>(adminKey) || [];
                      queryClient.setQueryData(adminKey, allNotes.map(n => n.id === updatedNote.id ? updatedNote : n));
                      
                      await queryClient.invalidateQueries({ queryKey: workerKey });
                      await queryClient.invalidateQueries({ queryKey: adminKey });
                      
                      setEditDeliveryOpen(false);
                      setSelectedNoteToEdit(null);
                    } else {
                      alert("Error al actualizar el albarán");
                    }
                  } catch (error) {
                    console.error("Error updating albarán:", error);
                    alert("Error al actualizar el albarán");
                  }
                }}
                className="flex-1"
              >
                Guardar Cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createDeliveryOpen} onOpenChange={setCreateDeliveryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Albarán</DialogTitle>
            <DialogDescription>
              Completa los datos del albarán para registrar la entrega
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nombre del Cliente</label>
              <Input
                placeholder="Ej: Juan García"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Origen (Recogida)</label>
              <Input
                placeholder="Ej: Calle Principal, 123"
                value={formData.pickupOrigin}
                onChange={(e) => setFormData({ ...formData, pickupOrigin: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Destino</label>
              <Input
                placeholder="Ej: Avenida Central, 456"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de Vehículo</label>
              <div className="grid grid-cols-2 gap-2">
                {["Moto", "Furgoneta", "Furgón", "Carrozado"].map((tipo) => (
                  <Button
                    key={tipo}
                    type="button"
                    variant={formData.vehicleType === tipo ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, vehicleType: tipo })}
                    className="text-xs"
                  >
                    {tipo}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Fecha</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Hora</label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Observaciones</label>
              <Textarea
                placeholder="Notas adicionales sobre el albarán..."
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setCreateDeliveryOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  try {
                    if (!user?.workerId) {
                      console.error("No workerId available:", { userId: user?.id, workerId: user?.workerId });
                      return;
                    }

                    const deliveryNoteData = {
                      quoteId: `custom-${Date.now()}`,
                      workerId: user.workerId,
                      clientName: formData.clientName,
                      pickupOrigin: formData.pickupOrigin,
                      destination: formData.destination,
                      vehicleType: formData.vehicleType,
                      date: formData.date,
                      time: formData.time,
                      observations: formData.observations,
                      status: "pending",
                    };
                    
                    console.log("Saving delivery note with:", deliveryNoteData);

                    const response = await fetch("/api/delivery-notes", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(deliveryNoteData),
                      credentials: "include",
                    });

                    if (response.ok) {
                      const newDeliveryNote = await response.json();
                      console.log("Albarán guardado:", newDeliveryNote);
                      
                      // Update both caches immediately with the new delivery note
                      const workerKey = ["/api/workers", user?.workerId || "", "delivery-notes"];
                      const adminKey = ["/api/delivery-notes"];
                      
                      // Add to worker's delivery notes
                      const workerNotes = queryClient.getQueryData<DeliveryNote[]>(workerKey) || [];
                      queryClient.setQueryData(workerKey, [newDeliveryNote, ...workerNotes]);
                      
                      // Add to admin's delivery notes
                      const allNotes = queryClient.getQueryData<DeliveryNote[]>(adminKey) || [];
                      queryClient.setQueryData(adminKey, [newDeliveryNote, ...allNotes]);
                      
                      // Force invalidation to trigger component re-render
                      await queryClient.invalidateQueries({ queryKey: workerKey });
                      await queryClient.invalidateQueries({ queryKey: adminKey });
                      
                      setCreateDeliveryOpen(false);
                      setFormData({
                        clientName: "",
                        pickupOrigin: "",
                        destination: "",
                        vehicleType: "Furgoneta",
                        date: new Date().toISOString().split("T")[0],
                        time: "09:00",
                        observations: "",
                        waitTime: 0,
                      });
                    }
                  } catch (error) {
                    console.error("Error guardando albarán:", error);
                  }
                }}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Guardar Albarán
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalles del Albarán */}
      <Dialog open={!!selectedNoteDetail} onOpenChange={() => setSelectedNoteDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Albarán</DialogTitle>
          </DialogHeader>
          {selectedNoteDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="font-semibold">{selectedNoteDetail.clientName || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vehículo</p>
                  <p className="font-semibold">{selectedNoteDetail.vehicleType || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fecha</p>
                  <p className="font-semibold">{selectedNoteDetail.date ? new Date(selectedNoteDetail.date).toLocaleDateString('es-ES') : '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hora</p>
                  <p className="font-semibold">{selectedNoteDetail.time || '-'}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground mb-2">Recogida</p>
                <p className="text-sm">{selectedNoteDetail.pickupOrigin || '-'}</p>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground mb-2">Entrega</p>
                <p className="text-sm">{selectedNoteDetail.destination || '-'}</p>
              </div>

              {selectedNoteDetail.observations && (
                <div className="border-t pt-4">
                  <p className="text-xs text-muted-foreground mb-2">Observaciones</p>
                  <p className="text-sm">{selectedNoteDetail.observations}</p>
                </div>
              )}

              {selectedNoteDetail.photo && (
                <div className="border-t pt-4">
                  <p className="text-xs text-muted-foreground mb-2">Fotografía</p>
                  <img src={selectedNoteDetail.photo} alt="Foto del albarán" className="w-full rounded-lg max-h-64 object-cover" />
                </div>
              )}

              {selectedNoteDetail.signedAt && (
                <div className="border-t pt-4 bg-green-50 dark:bg-green-950/20 p-3 rounded">
                  <p className="text-xs text-green-600 dark:text-green-400">✓ Firmado el {new Date(selectedNoteDetail.signedAt).toLocaleString('es-ES')}</p>
                </div>
              )}

              {!selectedNoteDetail.photo && (
                <Button
                  onClick={() => {
                    setSelectedNoteForPhoto(selectedNoteDetail);
                    setCapturePhotoOpen(true);
                    setSelectedNoteDetail(null);
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  Agregar Fotografía
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={capturePhotoOpen} onOpenChange={setCapturePhotoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Fotografía del Albarán</DialogTitle>
            <DialogDescription>Captura una foto del albarán</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!showCameraPreview && !capturedPhoto && (
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  data-testid="button-upload-photo"
                >
                  📁 Subir Foto
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const photoData = event.target?.result as string;
                        setCapturedPhoto(photoData);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  data-testid="input-file-photo"
                />
              </div>
            )}


            {capturedPhoto && (
              <div className="relative">
                <img src={capturedPhoto} alt="Foto capturada" className="w-full rounded-lg max-h-48 object-cover" />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setCapturedPhoto(null);
                    setShowCameraPreview(false);
                    if (cameraStream) {
                      cameraStream.getTracks().forEach(track => track.stop());
                      setCameraStream(null);
                    }
                  }}
                  className="absolute top-2 right-2"
                  data-testid="button-delete-photo"
                >
                  ✕
                </Button>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setCapturePhotoOpen(false);
                  setCapturedPhoto(null);
                  setShowCameraPreview(false);
                  setSelectedNoteForPhoto(null);
                  if (cameraStream) {
                    cameraStream.getTracks().forEach(track => track.stop());
                    setCameraStream(null);
                  }
                }} 
                className="flex-1"
                data-testid="button-cancel-photo"
              >
                Cancelar
              </Button>
              {capturedPhoto && (
                <Button
                  onClick={async () => {
                    if (!selectedNoteForPhoto || !capturedPhoto) return;
                    try {
                      const now = new Date().toISOString();
                      const response = await fetch(`/api/delivery-notes/${selectedNoteForPhoto.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ 
                          photo: capturedPhoto,
                          status: "confirmado",
                          signedAt: now
                        }),
                        credentials: "include",
                      });
                      
                      if (response.ok) {
                        const noteWithSignature = await response.json();
                        const workerKey = ["/api/workers", user?.workerId || "", "delivery-notes"];
                        const adminKey = ["/api/delivery-notes"];
                        
                        const workerNotes = queryClient.getQueryData<DeliveryNote[]>(workerKey) || [];
                        const updatedWorkerNotes = workerNotes.map(n => n.id === noteWithSignature.id ? noteWithSignature : n);
                        queryClient.setQueryData(workerKey, updatedWorkerNotes);
                        
                        const allNotes = queryClient.getQueryData<DeliveryNote[]>(adminKey) || [];
                        const updatedAllNotes = allNotes.map(n => n.id === noteWithSignature.id ? noteWithSignature : n);
                        queryClient.setQueryData(adminKey, updatedAllNotes);
                        
                        await queryClient.invalidateQueries({ queryKey: workerKey });
                        await queryClient.invalidateQueries({ queryKey: adminKey });
                        
                        setCapturePhotoOpen(false);
                        setCapturedPhoto(null);
                        setShowCameraPreview(false);
                        setSelectedNoteForPhoto(null);
                        if (cameraStream) {
                          cameraStream.getTracks().forEach(track => track.stop());
                          setCameraStream(null);
                        }
                      }
                    } catch (error) {
                      console.error("Error guardando foto:", error);
                    }
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  data-testid="button-save-photo"
                >
                  Guardar Foto
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
