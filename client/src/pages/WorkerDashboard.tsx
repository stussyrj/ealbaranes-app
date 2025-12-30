import { useState, useRef, useEffect, lazy, Suspense, useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LightPageBackground } from "@/components/LightPageBackground";

const DriverDoorAnimation = lazy(() => import("@/components/DriverDoorAnimation").then(m => ({ default: m.DriverDoorAnimation })));
const DeliveryNoteGenerator = lazy(() => import("@/components/DeliveryNoteGenerator").then(m => ({ default: m.DeliveryNoteGenerator })));
const SignaturePad = lazy(() => import("@/components/SignaturePad").then(m => ({ default: m.SignaturePad })));
const OnboardingTutorial = lazy(() => import("@/components/OnboardingTutorial").then(m => ({ default: m.OnboardingTutorial })));
import { DeliveryNoteSigningModal } from "@/components/DeliveryNoteSigningModal";
import { FileText, Truck, Clock, Calendar, CheckCircle, Edit2, Camera, Plus, X, Pen, ArrowRight, ChevronDown, ChevronUp, RefreshCcw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient as qc } from "@/lib/queryClient";
import type { Quote, DeliveryNote, PickupOrigin } from "@shared/schema";

export default function WorkerDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showAnimation, setShowAnimation] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Quote | null>(null);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [createDeliveryOpen, setCreateDeliveryOpen] = useState(false);
  const [isCreatingDelivery, setIsCreatingDelivery] = useState(false);
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
  const [viewSignatureOpen, setViewSignatureOpen] = useState(false);
  const [signatureToView, setSignatureToView] = useState<string | null>(null);
  const [captureSignatureOpen, setCaptureSignatureOpen] = useState(false);
  const [selectedNoteForSignature, setSelectedNoteForSignature] = useState<DeliveryNote | null>(null);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  
  // Dual signature signing modal state
  const [signingModalOpen, setSigningModalOpen] = useState(false);
  const [selectedNoteForSigning, setSelectedNoteForSigning] = useState<DeliveryNote | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef(false);
  const [formData, setFormData] = useState({
    clientName: "",
    pickupOrigins: [{ name: "", address: "" }] as PickupOrigin[],
    destination: "",
    vehicleType: "Furgoneta",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
    observations: "",
    waitTime: 0,
  });
  
  // Onboarding tutorial state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingManuallyCompleted, setOnboardingManuallyCompleted] = useState(false);
  
  // Show onboarding if user hasn't completed it (and wasn't manually closed this session)
  useEffect(() => {
    if (user && user.hasCompletedOnboarding === false && !onboardingManuallyCompleted) {
      setShowOnboarding(true);
    }
  }, [user, onboardingManuallyCompleted]);
  
  // Mutation to complete onboarding
  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/user/complete-onboarding");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/user"] });
    },
  });
  
  const handleCompleteOnboarding = () => {
    // Close immediately to prevent race condition with user refetch
    setShowOnboarding(false);
    setOnboardingManuallyCompleted(true);
    completeOnboardingMutation.mutate();
  };
  
  // Helper to format a single origin display
  const formatOrigin = (origin: PickupOrigin): string => {
    const from = origin.name || 'N/A';
    const to = origin.address || 'N/A';
    return `Recogida: ${from} → Entrega: ${to}`;
  };
  
  // Helper to format multiple origins compactly
  const formatOrigins = (origins: PickupOrigin[] | null | undefined, maxDisplay: number = 2): string => {
    if (!origins || origins.length === 0) return 'N/A';
    if (origins.length === 1) return formatOrigin(origins[0]);
    if (origins.length <= maxDisplay) return origins.map(o => formatOrigin(o)).join(', ');
    return `${origins.slice(0, maxDisplay).map(o => formatOrigin(o)).join(', ')} (+${origins.length - maxDisplay})`;
  };
  
  // State for tracking which notes have their origins expanded
  const [expandedOrigins, setExpandedOrigins] = useState<Set<string>>(new Set());
  
  // Toggle expanded origins for a note
  const toggleExpandedOrigins = (noteId: string) => {
    setExpandedOrigins(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  // Use workerId if available, otherwise use user.id as the worker identifier
  const effectiveWorkerId = user?.workerId || user?.id;

  // Compress image to reduce size before upload
  const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedData = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedData);
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Helper function to determine if a note is fully signed (has dual signatures from origin and destination)
  const isFullySigned = (note: DeliveryNote): boolean => {
    // New dual signature system: requires both origin and destination signatures with documents
    const hasNewDualSignatures = Boolean(note.originSignature && note.originSignatureDocument && 
                                  note.destinationSignature && note.destinationSignatureDocument);
    // Legacy: old notes may still use photo + signature
    const hasLegacySignatures = Boolean(note.photo && note.signature);
    return hasNewDualSignatures || hasLegacySignatures;
  };
  
  // Helper to get missing signature info
  const getMissingSignatureInfo = (note: DeliveryNote) => {
    if (!note.photo && !note.signature) return "Falta foto y firma";
    if (!note.photo) return "Falta foto";
    if (!note.signature) return "Falta firma digital";
    return null;
  };

  // Save digital signature
  const saveSignature = async (signatureDataUrl: string) => {
    if (!selectedNoteForSignature) return;
    
    setIsUploadingSignature(true);
    try {
      const hasPhoto = selectedNoteForSignature.photo;
      
      const response = await apiRequest("PATCH", `/api/delivery-notes/${selectedNoteForSignature.id}`, { signature: signatureDataUrl });
      
      if (response.ok) {
        const willBeComplete = hasPhoto;
        const message = willBeComplete 
          ? "Albarán completamente firmado" 
          : "Firma guardada. Falta foto para completar.";
        toast({ title: willBeComplete ? "Firmado" : "Firma guardada", description: message });
        
        await queryClient.invalidateQueries({ queryKey: ["/api/workers", effectiveWorkerId || "", "delivery-notes"] });
        
        setCaptureSignatureOpen(false);
        setSelectedNoteForSignature(null);
      } else {
        throw new Error("Error al guardar");
      }
    } catch (error) {
      console.error("Error saving signature:", error);
      toast({ title: "Error", description: "No se pudo guardar la firma", variant: "destructive" });
    } finally {
      setIsUploadingSignature(false);
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
    queryKey: ["/api/workers", effectiveWorkerId || "", "orders"],
    enabled: !!effectiveWorkerId,
  });

  const { data: deliveryNotes = [], refetch: refetchDeliveryNotes } = useQuery<DeliveryNote[]>({
    queryKey: ["/api/workers", effectiveWorkerId || "", "delivery-notes"],
    enabled: !!effectiveWorkerId,
  });

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
      <Card key={order.id} className="hover-elevate bg-slate-50 dark:bg-slate-900/30 border-muted-foreground/10 shadow-sm">
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
    const noteIsFullySigned = isFullySigned(note);
    const getStatusColor = (fullySigned: boolean) => {
      return fullySigned 
        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
        : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300";
    };

    return (
      <Card key={note.id} className="hover-elevate bg-slate-50 dark:bg-slate-900/30 border-muted-foreground/10 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded" data-testid={`note-number-${note.id}`}>
                  Albarán #{(note as any).noteNumber || '—'}
                </span>
                <Badge className={`${getStatusColor(noteIsFullySigned)}`} data-testid={`badge-status-${note.id}`}>
                  {noteIsFullySigned ? "✓ Firmado" : getMissingSignatureInfo(note) || "Pendiente"}
                </Badge>
              </div>
              <CardTitle className="text-lg line-clamp-2">
                {note.pickupOrigins?.length && note.destination ? `${formatOrigins(note.pickupOrigins)} → ${note.destination}` : (note.quoteId || 'N/A')}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {note.clientName && `Cliente: ${note.clientName}`}
              </p>
            </div>
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

          <div className="bg-muted/20 rounded-md p-2 space-y-1">
            {note.pickupOrigins && note.pickupOrigins.length > 0 ? (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <span className="flex-1 min-w-0 truncate">{formatOrigin(note.pickupOrigins[0])}</span>
                  <ArrowRight className="w-3 h-3 text-primary flex-shrink-0" />
                  <span className="flex-1 min-w-0 truncate text-right">{note.destination || 'N/A'}</span>
                </div>
                
                {note.pickupOrigins.length > 1 && expandedOrigins.has(note.id) && (
                  <div className="space-y-1 pt-1 border-t border-muted-foreground/10">
                    {note.pickupOrigins.slice(1).map((origin, idx) => (
                      <div key={idx + 1} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex-1 min-w-0 truncate">{formatOrigin(origin)}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />
                        <span className="flex-1 min-w-0 truncate text-right">{note.destination || 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {note.pickupOrigins.length > 1 && (
                  <button
                    onClick={() => toggleExpandedOrigins(note.id)}
                    className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                    data-testid={`button-toggle-origins-${note.id}`}
                  >
                    {expandedOrigins.has(note.id) ? (
                      <><ChevronUp className="w-3 h-3" /> Ocultar {note.pickupOrigins.length - 1} recogidas</>
                    ) : (
                      <><ChevronDown className="w-3 h-3" /> Ver {note.pickupOrigins.length - 1} recogidas más</>
                    )}
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>N/A</span>
                <ArrowRight className="w-3 h-3" />
                <span>{note.destination || 'N/A'}</span>
              </div>
            )}
          </div>

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

          {note.signature && (
            <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded">
              <div className="flex items-center justify-between mb-2">
                <p className="text-muted-foreground text-xs">Firma Digital</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSignatureToView(note.signature);
                    setViewSignatureOpen(true);
                  }}
                  className="h-6 text-xs px-2"
                  data-testid={`button-view-signature-${note.id}`}
                >
                  Ver
                </Button>
              </div>
              <img src={note.signature} alt="Firma digital" className="w-full rounded-md max-h-24 object-contain bg-white" />
            </div>
          )}

          {/* Button to open dual signature modal */}
          {!isFullySigned(note) && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSelectedNoteForSigning(note);
                setSigningModalOpen(true);
              }}
              data-testid={`button-sign-${note.id}`}
            >
              <Pen className="w-4 h-4 mr-2" />
              Firmar Albarán
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  if (showAnimation) {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 z-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
        <DriverDoorAnimation 
          onComplete={() => setShowAnimation(false)} 
          userName={user?.displayName || user?.username}
          subtitle="a tu panel de trabajador"
        />
      </Suspense>
    );
  }

  return (
    <div className="relative">
      <LightPageBackground />
      <div className="relative z-10 space-y-6 p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold">Mis Servicios</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                refetchDeliveryNotes();
                toast({ title: "Actualizando datos..." });
              }}
              className="rounded-lg border border-muted-foreground/10 bg-slate-50 dark:bg-slate-900/30 p-3 sm:p-4 text-center shadow-sm hover-elevate flex-shrink-0"
              title="Actualizar datos"
              data-testid="button-refresh-worker"
            >
              <RefreshCcw className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 mb-6">
          <Card className="hover-elevate bg-slate-50 dark:bg-slate-900/30 border-muted-foreground/10 shadow-sm">
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

          <Card className="bg-purple-600/85 hover:bg-purple-700/85 dark:bg-purple-600/85 dark:hover:bg-purple-700/85 text-white border-muted-foreground/10 shadow-sm" onClick={() => setCreateDeliveryOpen(true)} data-testid="button-create-albaran">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white/80 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Hacer Albarán
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center min-h-24">
                <span className="w-full text-center font-medium">
                  Crear Nuevo Albarán
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {orders.length === 0 && deliveryNotes.length === 0 ? (
          <Card className="bg-slate-50 dark:bg-slate-900/30 border-muted-foreground/10 shadow-sm">
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
                <Card className="bg-slate-50 dark:bg-slate-900/30 border-muted-foreground/10 shadow-sm">
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
                <Card className="bg-slate-50 dark:bg-slate-900/30 border-muted-foreground/10 shadow-sm">
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
                <Card className="bg-slate-50 dark:bg-slate-900/30 border-muted-foreground/10 shadow-sm">
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
                <Card className="bg-slate-50 dark:bg-slate-900/30 border-muted-foreground/10 shadow-sm" onClick={() => { setAlbaranesModalType("pending"); setAlbaranesModalOpen(true); }} data-testid="button-view-pending-albaranes-worker">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Albaranes Pendientes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                      {deliveryNotes.filter(n => !isFullySigned(n)).length}
                    </div>
                    <div className="w-full text-center text-sm font-medium">
                      Ver {deliveryNotes.filter(n => !isFullySigned(n)).length} Albaranes Pendientes
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-50 dark:bg-slate-900/30 border-muted-foreground/10 shadow-sm" onClick={() => { setAlbaranesModalType("signed"); setAlbaranesModalOpen(true); }} data-testid="button-view-signed-albaranes-worker">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground">Albaranes Firmados</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {deliveryNotes.filter(n => isFullySigned(n)).length}
                    </div>
                    <div className="w-full text-center text-sm font-medium">
                      Ver {deliveryNotes.filter(n => isFullySigned(n)).length} Albaranes Firmados
                    </div>
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
          <div className="space-y-3">
            {(albaranesModalType === "pending" ? deliveryNotes.filter(n => !isFullySigned(n)) : deliveryNotes.filter(n => isFullySigned(n))).map((note: DeliveryNote) => (
              <div key={note.id} className="rounded-lg border border-muted-foreground/10 bg-slate-50 dark:bg-slate-900/30 overflow-hidden shadow-sm">
                {note.photo && (
                  <div className="w-full h-32 sm:h-40 bg-muted">
                    <img src={note.photo} alt="Albarán firmado" className="w-full h-full object-cover" />
                  </div>
                )}
                
                <div className="p-3 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded" data-testid={`modal-note-number-${note.id}`}>
                      Albarán #{(note as any).noteNumber || '—'}
                    </span>
                    <Badge className={isFullySigned(note) 
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 no-default-hover-elevate no-default-active-elevate"
                      : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 no-default-hover-elevate no-default-active-elevate"
                    }>
                      {isFullySigned(note) ? (
                        <><CheckCircle className="w-3 h-3 mr-1" /> Firmado</>
                      ) : (
                        <><Clock className="w-3 h-3 mr-1" /> {getMissingSignatureInfo(note)}</>
                      )}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">{note.clientName || 'Cliente N/A'}</p>
                    </div>

                    <div className="bg-muted/20 rounded-md p-2 space-y-1">
                      {note.pickupOrigins && note.pickupOrigins.length > 0 ? (
                        <>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="flex-1 min-w-0 truncate">{formatOrigin(note.pickupOrigins[0])}</span>
                            <ArrowRight className="w-3 h-3 text-primary flex-shrink-0" />
                            <span className="flex-1 min-w-0 truncate text-right">{note.destination || 'N/A'}</span>
                          </div>
                          
                          {note.pickupOrigins.length > 1 && expandedOrigins.has(note.id) && (
                            <div className="space-y-1 pt-1 border-t border-muted-foreground/10">
                              {note.pickupOrigins.slice(1).map((origin, idx) => (
                                <div key={idx + 1} className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span className="flex-1 min-w-0 truncate">{formatOrigin(origin)}</span>
                                  <ArrowRight className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />
                                  <span className="flex-1 min-w-0 truncate text-right">{note.destination || 'N/A'}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {note.pickupOrigins.length > 1 && (
                            <button
                              onClick={() => toggleExpandedOrigins(note.id)}
                              className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                              data-testid={`button-toggle-origins-modal-${note.id}`}
                            >
                              {expandedOrigins.has(note.id) ? (
                                <><ChevronUp className="w-3 h-3" /> Ocultar {note.pickupOrigins.length - 1} recogidas</>
                              ) : (
                                <><ChevronDown className="w-3 h-3" /> Ver {note.pickupOrigins.length - 1} recogidas más</>
                              )}
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>N/A</span>
                          <ArrowRight className="w-3 h-3" />
                          <span>{note.destination || 'N/A'}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Vehículo</p>
                        <p className="font-medium truncate">{note.vehicleType || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Fecha</p>
                        <p className="font-medium">{note.date ? new Date(note.date).toLocaleDateString('es-ES') : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Hora</p>
                        <p className="font-medium">{note.time || 'N/A'}</p>
                      </div>
                    </div>

                    {(note as any).waitTime && (note as any).waitTime > 0 && (
                      <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-md p-2">
                        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-amber-700 dark:text-amber-300">Tiempo de Espera</p>
                          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                            {Math.floor((note as any).waitTime / 60)}h {(note as any).waitTime % 60}m
                          </p>
                        </div>
                      </div>
                    )}

                    {note.signedAt && note.photo && (
                      <div className="flex items-start gap-2 bg-green-50 dark:bg-green-900/20 rounded-md p-2">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-green-700 dark:text-green-300">Firmado</p>
                          <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                            {new Date(note.signedAt).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )}

                    {note.observations && (
                      <div className="flex items-start gap-2 bg-muted/30 rounded-md p-2">
                        <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">Observaciones</p>
                          <p className="text-sm line-clamp-2">{note.observations}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {albaranesModalType === "pending" && (
                    <div className="space-y-2 pt-1">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => { 
                            setSelectedNoteToEdit(note); 
                            setFormData({ 
                              clientName: note.clientName || "", 
                              pickupOrigins: note.pickupOrigins || [{ name: "", address: "" }], 
                              destination: note.destination || "", 
                              vehicleType: note.vehicleType || "Furgoneta", 
                              date: note.date || new Date().toISOString().split("T")[0], 
                              time: note.time || "09:00", 
                              observations: note.observations || "", 
                              waitTime: (note as any).waitTime || 0 
                            }); 
                            setEditDeliveryOpen(true); 
                          }}
                          data-testid={`button-edit-${note.id}`}
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                          Editar
                        </Button>
                        {!isFullySigned(note) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setSelectedNoteForSigning(note);
                              setSigningModalOpen(true);
                            }}
                            data-testid={`button-sign-modal-${note.id}`}
                          >
                            <Pen className="w-3.5 h-3.5 mr-1.5" />
                            Firmar
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {albaranesModalType === "signed" && note.signature && (
                    <div className="pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSignatureToView(note.signature);
                          setViewSignatureOpen(true);
                        }}
                        className="w-full text-xs"
                        data-testid={`button-view-signature-modal-${note.id}`}
                      >
                        <Pen className="w-3.5 h-3.5 mr-1.5" />
                        Ver Firma Digital
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Suspense fallback={null}>
        <DeliveryNoteGenerator
          open={deliveryModalOpen}
          onOpenChange={setDeliveryModalOpen}
          quote={selectedOrder}
          workerId={effectiveWorkerId}
        />
      </Suspense>

      {/* Edit Delivery Dialog */}
      <Dialog open={editDeliveryOpen} onOpenChange={setEditDeliveryOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium">Recogidas ({formData.pickupOrigins.length})</label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormData({ ...formData, pickupOrigins: [...formData.pickupOrigins, { name: "", address: "" }] })}
                  className="h-6 text-xs px-2"
                >
                  + Añadir
                </Button>
              </div>
              <div className="space-y-3">
                {formData.pickupOrigins.map((origin, index) => (
                  <div key={index} className="space-y-1 p-2 border rounded-md bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Recogida {index + 1}</span>
                      {formData.pickupOrigins.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newOrigins = formData.pickupOrigins.filter((_, i) => i !== index);
                            setFormData({ ...formData, pickupOrigins: newOrigins });
                          }}
                          className="h-5 w-5 p-0 text-xs"
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                    <Input
                      placeholder="Nombre (ej: Almacén Central)"
                      value={origin.name}
                      onChange={(e) => {
                        const newOrigins = [...formData.pickupOrigins];
                        newOrigins[index] = { ...newOrigins[index], name: e.target.value };
                        setFormData({ ...formData, pickupOrigins: newOrigins });
                      }}
                      className="text-sm"
                    />
                    <Input
                      placeholder="Dirección (ej: Calle Principal, 123)"
                      value={origin.address}
                      onChange={(e) => {
                        const newOrigins = [...formData.pickupOrigins];
                        newOrigins[index] = { ...newOrigins[index], address: e.target.value };
                        setFormData({ ...formData, pickupOrigins: newOrigins });
                      }}
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
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
                      pickupOrigins: formData.pickupOrigins.filter(o => o.name.trim() !== "" || o.address.trim() !== ""),
                      destination: formData.destination,
                      vehicleType: formData.vehicleType,
                      date: formData.date,
                      time: formData.time,
                      observations: formData.observations,
                      waitTime: formData.waitTime || null,
                    };

                    const response = await apiRequest("PATCH", `/api/delivery-notes/${selectedNoteToEdit.id}`, updateData);

                    if (response.status === 403) {
                      alert("No se pueden editar albaranes firmados");
                      return;
                    }

                    if (response.ok) {
                      const updatedNote = await response.json();
                      
                      // Close modal first
                      setEditDeliveryOpen(false);
                      setSelectedNoteToEdit(null);
                      
                      // Show success message
                      toast({ title: "Albarán actualizado", description: "Los cambios se han guardado correctamente" });
                      
                      // Update cache in background
                      const workerKey = ["/api/workers", effectiveWorkerId || "", "delivery-notes"];
                      const adminKey = ["/api/delivery-notes"];
                      
                      const workerNotes = queryClient.getQueryData<DeliveryNote[]>(workerKey) || [];
                      queryClient.setQueryData(workerKey, workerNotes.map(n => n.id === updatedNote.id ? updatedNote : n));
                      
                      const allNotes = queryClient.getQueryData<DeliveryNote[]>(adminKey) || [];
                      queryClient.setQueryData(adminKey, allNotes.map(n => n.id === updatedNote.id ? updatedNote : n));
                      
                      queryClient.invalidateQueries({ queryKey: workerKey });
                      queryClient.invalidateQueries({ queryKey: adminKey });
                    } else {
                      toast({ title: "Error", description: "No se pudo actualizar el albarán", variant: "destructive" });
                    }
                  } catch (error) {
                    console.error("Error updating albarán:", error);
                    toast({ title: "Error", description: "No se pudo actualizar el albarán", variant: "destructive" });
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

      <Dialog open={createDeliveryOpen} onOpenChange={(open) => {
        if (open) {
          isSubmittingRef.current = false;
        }
        setCreateDeliveryOpen(open);
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Albarán</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Cliente <span className="text-destructive">*</span></label>
              <Input
                placeholder="Nombre del cliente"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Ruta <span className="text-destructive">*</span></label>
              
              {formData.pickupOrigins.map((origin, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                  <div className="flex-1 grid grid-cols-[1fr_auto_1fr] gap-1 items-center">
                    <Input
                      placeholder="De..."
                      value={origin.name}
                      onChange={(e) => {
                        const newOrigins = [...formData.pickupOrigins];
                        newOrigins[index] = { ...newOrigins[index], name: e.target.value };
                        setFormData({ ...formData, pickupOrigins: newOrigins });
                      }}
                      className="text-sm"
                    />
                    <span className="text-muted-foreground text-sm px-1">→</span>
                    <Input
                      placeholder="A..."
                      value={origin.address}
                      onChange={(e) => {
                        const newOrigins = [...formData.pickupOrigins];
                        newOrigins[index] = { ...newOrigins[index], address: e.target.value };
                        setFormData({ ...formData, pickupOrigins: newOrigins });
                      }}
                      className="text-sm"
                    />
                  </div>
                  {formData.pickupOrigins.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newOrigins = formData.pickupOrigins.filter((_, i) => i !== index);
                        setFormData({ ...formData, pickupOrigins: newOrigins });
                      }}
                      className="h-8 w-8 shrink-0"
                    >
                      <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </Button>
                  )}
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const lastDestination = formData.pickupOrigins[formData.pickupOrigins.length - 1]?.address || "";
                  setFormData({ 
                    ...formData, 
                    pickupOrigins: [...formData.pickupOrigins, { name: lastDestination, address: "" }] 
                  });
                }}
                className="w-full text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Añadir tramo
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Fecha</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Hora</label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Vehículo</label>
              <div className="grid grid-cols-5 gap-1">
                {["Moto", "Furgoneta", "Furgón", "Carrozado", "Camión"].map((tipo) => (
                  <Button
                    key={tipo}
                    type="button"
                    variant={formData.vehicleType === tipo ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, vehicleType: tipo })}
                    size="sm"
                    className="text-xs px-1"
                  >
                    {tipo}
                  </Button>
                ))}
              </div>
            </div>
            
            <details className="group">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-1">
                <Plus className="w-3 h-3 group-open:rotate-45 transition-transform" />
                Observaciones
              </summary>
              <div className="mt-2">
                <Textarea
                  placeholder="Notas adicionales..."
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  rows={2}
                  className="text-sm"
                />
              </div>
            </details>
            
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setCreateDeliveryOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button
                disabled={!formData.clientName.trim() || !formData.pickupOrigins[0]?.name?.trim() || !formData.pickupOrigins[0]?.address?.trim() || isCreatingDelivery}
                onClick={async () => {
                  if (!effectiveWorkerId) {
                    toast({ title: "Error", description: "Usuario no identificado", variant: "destructive" });
                    return;
                  }

                  setIsCreatingDelivery(true);
                  
                  try {
                    const validRoutes = formData.pickupOrigins.filter(o => o.name.trim() !== "" && o.address.trim() !== "");
                    const lastDestination = validRoutes[validRoutes.length - 1]?.address || "";
                    const deliveryNoteData = {
                      quoteId: `custom-${Date.now()}`,
                      workerId: effectiveWorkerId,
                      clientName: formData.clientName.trim(),
                      pickupOrigins: validRoutes,
                      destination: lastDestination.trim(),
                      vehicleType: formData.vehicleType,
                      date: formData.date,
                      time: formData.time,
                      observations: formData.observations.trim() || null,
                      status: "pending",
                    };

                    const response = await apiRequest("POST", "/api/delivery-notes", deliveryNoteData);
                    console.log("[WorkerDashboard] Create response status:", response.status);
                    const data = await response.json();
                    console.log("[WorkerDashboard] Create response data:", data);
                    
                    if (data && data.id) {
                      const newDeliveryNote = data as DeliveryNote;
                      console.log("[WorkerDashboard] Created delivery note:", newDeliveryNote.noteNumber);
                      toast({ title: "✓ Albarán creado", description: `Albarán #${newDeliveryNote.noteNumber} guardado` });
                      
                      const workerKey = ["/api/workers", effectiveWorkerId, "delivery-notes"];
                      const adminKey = ["/api/delivery-notes"];
                      const workerNotes = queryClient.getQueryData<DeliveryNote[]>(workerKey) || [];
                      queryClient.setQueryData(workerKey, [newDeliveryNote, ...workerNotes]);
                      const allNotes = queryClient.getQueryData<DeliveryNote[]>(adminKey) || [];
                      queryClient.setQueryData(adminKey, [newDeliveryNote, ...allNotes]);
                      
                      setCreateDeliveryOpen(false);
                      const now = new Date();
                      setFormData({
                        clientName: "",
                        pickupOrigins: [{ name: "", address: "" }],
                        destination: "",
                        vehicleType: "Furgoneta",
                        date: now.toISOString().split("T")[0],
                        time: now.toTimeString().slice(0, 5),
                        observations: "",
                        waitTime: 0,
                      });
                    } else {
                      console.error("[WorkerDashboard] Failed to create - missing data or id:", { data, hasId: data?.id });
                      toast({ title: "Error", description: "No se pudo crear el albarán", variant: "destructive" });
                    }
                  } catch (error) {
                    toast({ title: "Error", description: error instanceof Error ? error.message : "Error desconocido", variant: "destructive" });
                  } finally {
                    setIsCreatingDelivery(false);
                  }
                }}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isCreatingDelivery ? "Creando..." : "Crear Albarán"}
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
                <p className="text-xs text-muted-foreground mb-2">
                  {selectedNoteDetail.pickupOrigins && selectedNoteDetail.pickupOrigins.length > 1 ? `Recogidas (${selectedNoteDetail.pickupOrigins.length})` : 'Recogida'}
                </p>
                <p className="text-sm">{formatOrigins(selectedNoteDetail.pickupOrigins) || '-'}</p>
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

              {selectedNoteDetail.signature && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground">Firma Digital</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSignatureToView(selectedNoteDetail.signature);
                        setViewSignatureOpen(true);
                      }}
                      className="h-7 text-xs"
                      data-testid="button-view-signature-detail"
                    >
                      Ver Firma
                    </Button>
                  </div>
                  <img src={selectedNoteDetail.signature} alt="Firma digital" className="w-full rounded-lg max-h-32 object-contain bg-white border" />
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
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const compressedPhoto = await compressImage(file);
                      setCapturedPhoto(compressedPhoto);
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
              {capturedPhoto && capturedPhoto.length > 500 && (
                <Button
                  onClick={async () => {
                    if (!selectedNoteForPhoto || !capturedPhoto) return;
                    
                    if (capturedPhoto.length < 500) {
                      toast({ title: "Error", description: "La foto capturada está corrupta. Inténtalo de nuevo.", variant: "destructive" });
                      setCapturedPhoto(null);
                      return;
                    }
                    
                    try {
                      const now = new Date().toISOString();
                      const response = await apiRequest("PATCH", `/api/delivery-notes/${selectedNoteForPhoto.id}`, { 
                        photo: capturedPhoto,
                        status: "confirmado",
                        signedAt: now
                      });
                      
                      if (response.ok) {
                        const noteWithSignature = await response.json();
                        const workerKey = ["/api/workers", effectiveWorkerId || "", "delivery-notes"];
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

      <Dialog open={viewSignatureOpen} onOpenChange={setViewSignatureOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Firma Digital</DialogTitle>
          </DialogHeader>
          {signatureToView && (
            <div className="bg-white rounded-lg p-4 border">
              <img 
                src={signatureToView} 
                alt="Firma digital" 
                className="w-full object-contain max-h-80"
                data-testid="img-signature-fullview"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Capture Signature Dialog */}
      <Dialog open={captureSignatureOpen} onOpenChange={(open) => {
        if (!open) {
          setCaptureSignatureOpen(false);
          setSelectedNoteForSignature(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Firma Digital del Cliente</DialogTitle>
            <DialogDescription>
              Pide al cliente que firme en el recuadro
            </DialogDescription>
          </DialogHeader>
          <Suspense fallback={<div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div></div>}>
            <SignaturePad
              onSave={saveSignature}
              onCancel={() => {
                setCaptureSignatureOpen(false);
                setSelectedNoteForSignature(null);
              }}
            />
          </Suspense>
          {isUploadingSignature && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
              <p className="text-sm text-muted-foreground">Guardando firma...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Onboarding Tutorial */}
      <Suspense fallback={null}>
        <OnboardingTutorial
          isOpen={showOnboarding}
          onComplete={handleCompleteOnboarding}
          userType="worker"
        />
      </Suspense>
      
      {/* Dual Signature Signing Modal */}
      <DeliveryNoteSigningModal
        open={signingModalOpen}
        onOpenChange={(open) => {
          setSigningModalOpen(open);
          if (!open) setSelectedNoteForSigning(null);
        }}
        note={selectedNoteForSigning}
      />
    </div>
  );
}
