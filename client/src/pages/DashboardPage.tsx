import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TrendingUp, MapPin, Truck, X, Download, Share2, FileDown, CheckCircle, Clock, FileText, Plus, Calendar, Filter, Receipt, Banknote, User, Hourglass, RefreshCw, Loader2, Camera, Upload, Archive, Pen, Image } from "lucide-react";
import type { PickupOrigin } from "@shared/schema";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DriverDoorAnimation } from "@/components/DriverDoorAnimation";
import { useToast } from "@/hooks/use-toast";
import { AnimatedPageBackground } from "@/components/AnimatedPageBackground";
import { WorkerAssignmentModal } from "@/components/WorkerAssignmentModal";
import { DeliveryNoteCard } from "@/components/DeliveryNoteCard";
import { AutocompleteInput } from "@/components/AutocompleteInput";
import { SignaturePad } from "@/components/SignaturePad";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DashboardPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAnimation, setShowAnimation] = useState(true);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [albaranesModalOpen, setAlbaranesModalOpen] = useState(false);
  const [albaranesModalType, setAlbaranesModalType] = useState<"pending" | "signed">("pending");
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [createDeliveryOpen, setCreateDeliveryOpen] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    pickupOrigins: [{ name: "", address: "" }] as PickupOrigin[],
    destination: "",
    vehicleType: "Furgoneta",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
    observations: "",
  });
  const deliveryNoteRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [dateFilterStart, setDateFilterStart] = useState<string>("");
  const [dateFilterEnd, setDateFilterEnd] = useState<string>("");
  
  // Photo capture states for signing
  const [capturePhotoOpen, setCapturePhotoOpen] = useState(false);
  const [selectedNoteForPhoto, setSelectedNoteForPhoto] = useState<any>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Digital signature states
  const [captureSignatureOpen, setCaptureSignatureOpen] = useState(false);
  const [selectedNoteForSignature, setSelectedNoteForSignature] = useState<any>(null);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [viewSignatureOpen, setViewSignatureOpen] = useState(false);
  const [signatureToView, setSignatureToView] = useState<string | null>(null);
  
  // Helper function to determine if a note is fully signed (has both photo and signature)
  const isFullySigned = (note: any) => note.photo && note.signature;
  
  const isValidPhoto = (photo: string | null | undefined) => {
    if (!photo) return false;
    return photo.length > 500;
  };
  const getMissingSignatureInfo = (note: any) => {
    if (!note.photo && !note.signature) return "Falta foto y firma";
    if (!note.photo) return "Falta foto";
    if (!note.signature) return "Falta firma digital";
    return null;
  };
  
  // Helper to format a single origin display
  const formatOrigin = (origin: PickupOrigin): string => {
    if (origin.name && origin.address) return `${origin.name} (${origin.address})`;
    if (origin.name) return origin.name;
    if (origin.address) return origin.address;
    return 'N/A';
  };
  
  // Helper to format multiple origins compactly
  const formatOrigins = (origins: PickupOrigin[] | null | undefined, maxDisplay: number = 2): string => {
    if (!origins || origins.length === 0) return 'N/A';
    if (origins.length === 1) return formatOrigin(origins[0]);
    if (origins.length <= maxDisplay) return origins.map(o => formatOrigin(o)).join(', ');
    return `${origins.slice(0, maxDisplay).map(o => formatOrigin(o)).join(', ')} (+${origins.length - maxDisplay})`;
  };
  
  const formatOriginsForPdf = (origins: PickupOrigin[] | null | undefined): string => {
    if (!origins || origins.length === 0) return 'N/A';
    return origins.map(o => formatOrigin(o)).join(' → ');
  };

  const previewDeliveryNote = (photo: string) => {
    if (!photo) {
      toast({ title: "Error", description: "No hay foto disponible", variant: "destructive" });
      return;
    }
    setPreviewImage(photo);
    setAlbaranesModalOpen(false);
    setPreviewModalOpen(true);
  };

  // Compress image to reduce size
  const compressImage = useCallback((file: File, maxWidth: number = 1200, quality: number = 0.7): Promise<string> => {
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
  }, []);

  // Handle file upload for photo with compression
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressedPhoto = await compressImage(file);
      setCapturedPhoto(compressedPhoto);
    }
  }, [compressImage]);

  // Save photo to delivery note
  const savePhotoAndSign = async () => {
    if (!selectedNoteForPhoto || !capturedPhoto) return;
    
    setIsUploadingPhoto(true);
    try {
      const hasSignature = selectedNoteForPhoto.signature;
      
      const response = await fetch(`/api/delivery-notes/${selectedNoteForPhoto.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo: capturedPhoto }),
        credentials: "include",
      });
      
      if (response.ok) {
        const willBeComplete = hasSignature;
        const message = willBeComplete 
          ? "Albarán completamente firmado" 
          : "Foto guardada. Falta firma digital para completar.";
        toast({ title: willBeComplete ? "Firmado" : "Foto guardada", description: message });
        
        await queryClient.invalidateQueries({ queryKey: ["/api/delivery-notes"] });
        
        setCapturePhotoOpen(false);
        setCapturedPhoto(null);
        setSelectedNoteForPhoto(null);
      } else {
        throw new Error("Error al guardar");
      }
    } catch (error) {
      console.error("Error saving photo:", error);
      toast({ title: "Error", description: "No se pudo guardar la foto", variant: "destructive" });
    } finally {
      setIsUploadingPhoto(false);
    }
  };
  
  // Save digital signature to delivery note
  const saveSignature = async (signatureDataUrl: string) => {
    if (!selectedNoteForSignature) return;
    
    setIsUploadingSignature(true);
    try {
      const hasPhoto = selectedNoteForSignature.photo;
      
      const response = await fetch(`/api/delivery-notes/${selectedNoteForSignature.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature: signatureDataUrl }),
        credentials: "include",
      });
      
      if (response.ok) {
        const willBeComplete = hasPhoto;
        const message = willBeComplete 
          ? "Albarán completamente firmado" 
          : "Firma guardada. Falta foto para completar.";
        toast({ title: willBeComplete ? "Firmado" : "Firma guardada", description: message });
        
        await queryClient.invalidateQueries({ queryKey: ["/api/delivery-notes"] });
        
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

  useEffect(() => {
    const hasSeenAnimation = sessionStorage.getItem("hasSeenAdminAnimation");
    if (hasSeenAnimation) {
      setShowAnimation(false);
    }
  }, []);

  const { data: quotes = [], refetch: refetchQuotes } = useQuery({
    queryKey: ["/api/quotes"],
    queryFn: async () => {
      const res = await fetch("/api/quotes", { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("No autorizado");
        }
        throw new Error("Error al cargar datos");
      }
      return res.json();
    },
    retry: false,
    staleTime: 0,
  });

  const { data: deliveryNotes = [], refetch: refetchDeliveryNotes, isLoading: isLoadingNotes, error: notesError } = useQuery({
    queryKey: ["/api/delivery-notes"],
    queryFn: async () => {
      const res = await fetch("/api/delivery-notes", { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("No autorizado");
        }
        throw new Error("Error al cargar albaranes");
      }
      const data = await res.json();
      console.log("Delivery notes loaded:", data?.length || 0, "items");
      return data;
    },
    retry: false,
    staleTime: 0,
  });

  const { data: suggestions = { clients: [], originNames: [], originAddresses: [], destinations: [] } } = useQuery<{ clients: string[], originNames: string[], originAddresses: string[], destinations: string[] }>({
    queryKey: ["/api/delivery-notes/suggestions"],
    queryFn: async () => {
      const res = await fetch("/api/delivery-notes/suggestions", { credentials: "include" });
      if (!res.ok) {
        return { clients: [], originNames: [], originAddresses: [], destinations: [] };
      }
      return res.json();
    },
    retry: false,
    staleTime: 60000,
  });

  // Refetch data when user changes
  useEffect(() => {
    if (user) {
      console.log("User logged in, refetching data...");
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
    }
  }, [user, queryClient]);

  const handleAssignWorker = (quote: any) => {
    setSelectedQuote(quote);
    setAssignmentModalOpen(true);
  };

  const signedQuotes = Array.isArray(quotes) ? quotes.filter((q: any) => q.status === "signed") : [];
  const pendingQuotes = Array.isArray(quotes) ? quotes.filter((q: any) => !q.assignedWorkerId && q.status !== "signed") : [];
  
  // Filter delivery notes by creatorType and status
  const allDeliveryNotes = Array.isArray(deliveryNotes) ? deliveryNotes : [];
  
  // A note is fully signed only when it has BOTH photo AND signature
  // Empresa (admin) created notes
  const empresaPendingNotes = allDeliveryNotes.filter((n: any) => n.creatorType === "admin" && !isFullySigned(n));
  const empresaSignedNotes = allDeliveryNotes.filter((n: any) => n.creatorType === "admin" && isFullySigned(n));
  
  // Trabajadores (worker) created notes
  const trabajadoresPendingNotes = allDeliveryNotes.filter((n: any) => (!n.creatorType || n.creatorType === "worker") && !isFullySigned(n));
  const trabajadoresSignedNotes = allDeliveryNotes.filter((n: any) => (!n.creatorType || n.creatorType === "worker") && isFullySigned(n));
  
  // Total counts - fully signed means has both photo AND signature
  const signedDeliveryNotes = allDeliveryNotes.filter((n: any) => isFullySigned(n));
  const pendingDeliveryNotes = allDeliveryNotes.filter((n: any) => !isFullySigned(n));
  
  // Facturación: Solo albaranes firmados (con foto)
  const invoicedNotes = signedDeliveryNotes.filter((n: any) => n.isInvoiced === true);
  const pendingInvoiceNotes = signedDeliveryNotes.filter((n: any) => !n.isInvoiced);
  
  const totalSignedCount = signedQuotes.length + signedDeliveryNotes.length;
  const totalPendingCount = pendingQuotes.length + pendingDeliveryNotes.length;
  
  // State for modal type (includes empresa/trabajadores split)
  const [albaranesCreatorType, setAlbaranesCreatorType] = useState<"admin" | "worker">("admin");
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceModalType, setInvoiceModalType] = useState<"invoiced" | "pending">("pending");

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
        {/* Header con botón de descarga y refrescar */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold">Panel de Empresa</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Bienvenido, <span className="font-medium text-foreground">{user?.displayName || user?.username}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                refetchDeliveryNotes();
                refetchQuotes();
                toast({ title: "Actualizando datos..." });
              }}
              className="rounded-lg border border-muted-foreground/10 bg-slate-50 dark:bg-slate-900/30 p-3 sm:p-4 text-center shadow-sm hover-elevate flex-shrink-0"
              data-testid="button-refresh-data"
            >
              {isLoadingNotes ? (
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              )}
            </button>
            <button
              onClick={() => setDownloadModalOpen(true)}
              className="rounded-lg border border-muted-foreground/10 bg-slate-50 dark:bg-slate-900/30 p-3 sm:p-4 text-center shadow-sm hover-elevate flex-shrink-0"
              data-testid="button-download-albaranes"
            >
              <FileDown className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
            </button>
          </div>
        </div>

        {/* Sección Empresa - Albaranes creados por la empresa */}
        <div className="space-y-2">
          <h2 className="text-sm sm:text-base font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Mis Albaranes (Empresa)
          </h2>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {/* Crear Albarán */}
            <button
              onClick={() => setCreateDeliveryOpen(true)}
              className="rounded-lg bg-purple-600/85 hover:bg-purple-700/85 p-4 text-left shadow-sm text-white"
              data-testid="button-create-albaran"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm sm:text-base font-bold">Crear</div>
                  <p className="text-[10px] sm:text-xs text-white/80 truncate">Albarán</p>
                </div>
              </div>
            </button>

            {/* Empresa Pendientes */}
            <button
              onClick={() => { setAlbaranesCreatorType("admin"); setAlbaranesModalType("pending"); setAlbaranesModalOpen(true); }}
              className="rounded-lg border border-muted-foreground/10 bg-slate-50 dark:bg-slate-900/30 p-4 text-left shadow-sm hover-elevate"
              data-testid="button-view-empresa-pending"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                  {isLoadingNotes ? (
                    <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400 animate-spin" />
                  ) : (
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xl sm:text-2xl font-bold" data-testid="count-empresa-pending">
                    {isLoadingNotes ? "..." : empresaPendingNotes.length}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Pendientes</p>
                </div>
              </div>
            </button>

            {/* Empresa Firmados */}
            <button
              onClick={() => { setAlbaranesCreatorType("admin"); setAlbaranesModalType("signed"); setAlbaranesModalOpen(true); }}
              className="rounded-lg border border-muted-foreground/10 bg-slate-50 dark:bg-slate-900/30 p-4 text-left shadow-sm hover-elevate"
              data-testid="button-view-empresa-signed"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  {isLoadingNotes ? (
                    <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400 animate-spin" />
                  ) : (
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xl sm:text-2xl font-bold" data-testid="count-empresa-signed">
                    {isLoadingNotes ? "..." : empresaSignedNotes.length}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Firmados</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Sección Trabajadores - Albaranes creados por trabajadores */}
        <div className="space-y-2">
          <h2 className="text-sm sm:text-base font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Albaranes de Trabajadores
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Trabajadores Pendientes */}
            <button
              onClick={() => { setAlbaranesCreatorType("worker"); setAlbaranesModalType("pending"); setAlbaranesModalOpen(true); }}
              className="rounded-lg border border-muted-foreground/10 bg-slate-50 dark:bg-slate-900/30 p-4 text-left shadow-sm hover-elevate"
              data-testid="button-view-trabajadores-pending"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                  {isLoadingNotes ? (
                    <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400 animate-spin" />
                  ) : (
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xl sm:text-2xl font-bold">{isLoadingNotes ? "..." : trabajadoresPendingNotes.length}</div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Pendientes</p>
                </div>
              </div>
            </button>

            {/* Trabajadores Firmados */}
            <button
              onClick={() => { setAlbaranesCreatorType("worker"); setAlbaranesModalType("signed"); setAlbaranesModalOpen(true); }}
              className="rounded-lg border border-muted-foreground/10 bg-slate-50 dark:bg-slate-900/30 p-4 text-left shadow-sm hover-elevate"
              data-testid="button-view-trabajadores-signed"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  {isLoadingNotes ? (
                    <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400 animate-spin" />
                  ) : (
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xl sm:text-2xl font-bold">{isLoadingNotes ? "..." : trabajadoresSignedNotes.length}</div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Firmados</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Sección Estado de Facturación - Solo albaranes firmados */}
        <div className="space-y-2">
          <h2 className="text-sm sm:text-base font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Estado de Facturación
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Cobrados */}
            <button
              onClick={() => { setInvoiceModalType("invoiced"); setInvoiceModalOpen(true); }}
              className="rounded-lg border border-muted-foreground/10 bg-slate-50 dark:bg-slate-900/30 p-4 text-left shadow-sm hover-elevate"
              data-testid="button-view-invoiced"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <Banknote className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-xl sm:text-2xl font-bold">{invoicedNotes.length}</div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Cobrados</p>
                </div>
              </div>
            </button>

            {/* Pendientes de cobro */}
            <button
              onClick={() => { setInvoiceModalType("pending"); setInvoiceModalOpen(true); }}
              className="rounded-lg border border-muted-foreground/10 bg-slate-50 dark:bg-slate-900/30 p-4 text-left shadow-sm hover-elevate"
              data-testid="button-view-pending-invoice"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-xl sm:text-2xl font-bold">{pendingInvoiceNotes.length}</div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Pendientes de cobro</p>
                </div>
              </div>
            </button>
          </div>
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
                toast({ title: "Generando PDF...", description: `Creando documento con ${notesWithPhotos.length} albarán(es)` });
                try {
                  const pdf = new jsPDF('p', 'mm', 'a4');
                  const pageWidth = pdf.internal.pageSize.getWidth();
                  const pageHeight = pdf.internal.pageSize.getHeight();
                  const margin = 15;
                  
                  for (let i = 0; i < notesWithPhotos.length; i++) {
                    const note = notesWithPhotos[i];
                    if (i > 0) pdf.addPage();
                    
                    pdf.setFillColor(124, 58, 237);
                    pdf.rect(0, 0, pageWidth, 35, 'F');
                    pdf.setTextColor(255, 255, 255);
                    pdf.setFontSize(22);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text('eAlbarán', margin, 18);
                    pdf.setFontSize(14);
                    pdf.setFont('helvetica', 'normal');
                    pdf.text(`Albarán #${note.noteNumber || '-'}`, margin, 28);
                    pdf.setFontSize(10);
                    pdf.text('FIRMADO', pageWidth - margin - 20, 18);
                    
                    pdf.setTextColor(0, 0, 0);
                    let yPos = 45;
                    
                    pdf.setFontSize(11);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text('Datos del albarán:', margin, yPos);
                    yPos += 8;
                    
                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(10);
                    const details = [
                      ['Cliente:', note.clientName || 'No especificado'],
                      ['Recogidas:', formatOriginsForPdf(note.pickupOrigins)],
                      ['Destino:', note.destination || 'No especificado'],
                      ['Vehículo:', note.vehicleType || 'No especificado'],
                      ['Fecha:', note.date ? new Date(note.date).toLocaleDateString('es-ES') : 'No especificada'],
                      ['Hora:', note.time || 'No especificada'],
                      ['Trabajador:', note.workerName || 'Desconocido'],
                      ['Observaciones:', note.observations || 'Sin observaciones']
                    ];
                    
                    details.forEach(([label, value]) => {
                      pdf.setFont('helvetica', 'bold');
                      pdf.text(label, margin, yPos);
                      pdf.setFont('helvetica', 'normal');
                      pdf.text(String(value), margin + 30, yPos);
                      yPos += 6;
                    });
                    
                    yPos += 5;
                    pdf.setFont('helvetica', 'bold');
                    pdf.text('Foto del albarán firmado:', margin, yPos);
                    yPos += 5;
                    
                    try {
                      const response = await fetch(note.photo);
                      const blob = await response.blob();
                      const base64 = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(blob);
                      });
                      
                      const imgFormat = base64.includes('data:image/png') ? 'PNG' : 'JPEG';
                      const imgWidth = pageWidth - (margin * 2);
                      const imgHeight = pageHeight - yPos - margin - 15;
                      pdf.addImage(base64, imgFormat, margin, yPos, imgWidth, imgHeight, undefined, 'MEDIUM');
                    } catch (imgError) {
                      pdf.text('(Imagen no disponible)', margin, yPos + 10);
                    }
                    
                    pdf.setFontSize(8);
                    pdf.setTextColor(128, 128, 128);
                    pdf.text(`Generado el ${new Date().toLocaleDateString('es-ES')} - eAlbarán`, margin, pageHeight - 8);
                  }
                  
                  pdf.save(`albaranes-firmados-${new Date().toISOString().split('T')[0]}.pdf`);
                  toast({ title: "PDF generado", description: `Se descargó el PDF con ${notesWithPhotos.length} albarán(es) firmado(s)` });
                } catch (error) {
                  console.error("PDF generation error:", error);
                  toast({ title: "Error", description: "No se pudo generar el PDF", variant: "destructive" });
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
                  <p className="font-semibold">Albaranes Firmados (PDF)</p>
                  <p className="text-xs text-muted-foreground">{signedDeliveryNotes.filter((n: any) => n.photo).length} albarán(es) con foto</p>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4 px-4"
              disabled={isDownloading || invoicedNotes.filter((n: any) => n.photo).length === 0}
              onClick={async () => {
                const notesWithPhotos = invoicedNotes.filter((n: any) => n.photo);
                if (notesWithPhotos.length === 0) {
                  toast({ title: "Sin fotos", description: "No hay albaranes cobrados con foto para descargar", variant: "destructive" });
                  return;
                }
                setIsDownloading(true);
                toast({ title: "Generando PDF...", description: `Creando documento con ${notesWithPhotos.length} albarán(es) cobrado(s)` });
                try {
                  const pdf = new jsPDF('p', 'mm', 'a4');
                  const pageWidth = pdf.internal.pageSize.getWidth();
                  const pageHeight = pdf.internal.pageSize.getHeight();
                  const margin = 15;
                  
                  for (let i = 0; i < notesWithPhotos.length; i++) {
                    const note = notesWithPhotos[i];
                    if (i > 0) pdf.addPage();
                    
                    pdf.setFillColor(16, 185, 129);
                    pdf.rect(0, 0, pageWidth, 35, 'F');
                    pdf.setTextColor(255, 255, 255);
                    pdf.setFontSize(22);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text('eAlbarán', margin, 18);
                    pdf.setFontSize(14);
                    pdf.setFont('helvetica', 'normal');
                    pdf.text(`Albarán #${note.noteNumber || '-'}`, margin, 28);
                    pdf.setFontSize(10);
                    pdf.text('COBRADO', pageWidth - margin - 22, 18);
                    
                    pdf.setTextColor(0, 0, 0);
                    let yPos = 45;
                    
                    pdf.setFontSize(11);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text('Datos del albarán:', margin, yPos);
                    yPos += 8;
                    
                    pdf.setFont('helvetica', 'normal');
                    pdf.setFontSize(10);
                    const details = [
                      ['Cliente:', note.clientName || 'No especificado'],
                      ['Recogidas:', formatOriginsForPdf(note.pickupOrigins)],
                      ['Destino:', note.destination || 'No especificado'],
                      ['Vehículo:', note.vehicleType || 'No especificado'],
                      ['Fecha:', note.date ? new Date(note.date).toLocaleDateString('es-ES') : 'No especificada'],
                      ['Hora:', note.time || 'No especificada'],
                      ['Trabajador:', note.workerName || 'Desconocido'],
                      ['Observaciones:', note.observations || 'Sin observaciones']
                    ];
                    
                    details.forEach(([label, value]) => {
                      pdf.setFont('helvetica', 'bold');
                      pdf.text(label, margin, yPos);
                      pdf.setFont('helvetica', 'normal');
                      pdf.text(String(value), margin + 30, yPos);
                      yPos += 6;
                    });
                    
                    yPos += 5;
                    pdf.setFont('helvetica', 'bold');
                    pdf.text('Foto del albarán cobrado:', margin, yPos);
                    yPos += 5;
                    
                    try {
                      let base64 = note.photo;
                      if (!base64.startsWith('data:image')) {
                        const response = await fetch(note.photo);
                        const blob = await response.blob();
                        base64 = await new Promise<string>((resolve) => {
                          const reader = new FileReader();
                          reader.onloadend = () => resolve(reader.result as string);
                          reader.readAsDataURL(blob);
                        });
                      }
                      
                      const imgFormat = base64.includes('data:image/png') ? 'PNG' : 'JPEG';
                      const imgWidth = pageWidth - (margin * 2);
                      const imgHeight = pageHeight - yPos - margin - 15;
                      pdf.addImage(base64, imgFormat, margin, yPos, imgWidth, imgHeight, undefined, 'MEDIUM');
                    } catch (imgError) {
                      pdf.text('(Imagen no disponible)', margin, yPos + 10);
                    }
                    
                    pdf.setFontSize(8);
                    pdf.setTextColor(128, 128, 128);
                    pdf.text(`Generado el ${new Date().toLocaleDateString('es-ES')} - eAlbarán`, margin, pageHeight - 8);
                  }
                  
                  pdf.save(`albaranes-cobrados-${new Date().toISOString().split('T')[0]}.pdf`);
                  toast({ title: "PDF generado", description: `Se descargó el PDF con ${notesWithPhotos.length} albarán(es) cobrado(s)` });
                } catch (error) {
                  console.error("PDF generation error:", error);
                  toast({ title: "Error", description: "No se pudo generar el PDF", variant: "destructive" });
                } finally {
                  setIsDownloading(false);
                  setDownloadModalOpen(false);
                }
              }}
              data-testid="button-download-invoiced"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <Banknote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold">Albaranes Cobrados (PDF)</p>
                  <p className="text-xs text-muted-foreground">{invoicedNotes.filter((n: any) => n.photo).length} albarán(es) con foto</p>
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
                toast({ title: "Generando PDF...", description: `Creando listado de ${pendingDeliveryNotes.length} albarán(es)` });
                try {
                  const pdf = new jsPDF('p', 'mm', 'a4');
                  const pageWidth = pdf.internal.pageSize.getWidth();
                  const pageHeight = pdf.internal.pageSize.getHeight();
                  const margin = 15;
                  
                  pdf.setFillColor(249, 115, 22);
                  pdf.rect(0, 0, pageWidth, 35, 'F');
                  pdf.setTextColor(255, 255, 255);
                  pdf.setFontSize(22);
                  pdf.setFont('helvetica', 'bold');
                  pdf.text('eAlbarán', margin, 18);
                  pdf.setFontSize(14);
                  pdf.setFont('helvetica', 'normal');
                  pdf.text('Listado de Albaranes Pendientes', margin, 28);
                  pdf.setFontSize(10);
                  pdf.text(new Date().toLocaleDateString('es-ES'), pageWidth - margin - 25, 18);
                  
                  pdf.setTextColor(0, 0, 0);
                  let yPos = 45;
                  
                  pdf.setFontSize(10);
                  pdf.setFont('helvetica', 'bold');
                  pdf.setFillColor(240, 240, 240);
                  pdf.rect(margin, yPos - 4, pageWidth - (margin * 2), 8, 'F');
                  pdf.text('Nº', margin + 2, yPos);
                  pdf.text('Origen', margin + 15, yPos);
                  pdf.text('Destino', margin + 55, yPos);
                  pdf.text('Cliente', margin + 95, yPos);
                  pdf.text('Fecha', margin + 135, yPos);
                  pdf.text('Trabajador', margin + 160, yPos);
                  yPos += 8;
                  
                  pdf.setFont('helvetica', 'normal');
                  pdf.setFontSize(9);
                  
                  for (const note of pendingDeliveryNotes) {
                    if (yPos > pageHeight - 25) {
                      pdf.addPage();
                      yPos = 20;
                      pdf.setFillColor(240, 240, 240);
                      pdf.rect(margin, yPos - 4, pageWidth - (margin * 2), 8, 'F');
                      pdf.setFont('helvetica', 'bold');
                      pdf.text('Nº', margin + 2, yPos);
                      pdf.text('Origen', margin + 15, yPos);
                      pdf.text('Destino', margin + 55, yPos);
                      pdf.text('Cliente', margin + 95, yPos);
                      pdf.text('Fecha', margin + 135, yPos);
                      pdf.text('Trabajador', margin + 160, yPos);
                      yPos += 8;
                      pdf.setFont('helvetica', 'normal');
                    }
                    
                    const truncate = (str: string, len: number) => str && str.length > len ? str.substring(0, len) + '...' : (str || '-');
                    
                    pdf.text(String(note.noteNumber || '-'), margin + 2, yPos);
                    pdf.text(truncate(formatOrigins(note.pickupOrigins, 1), 18), margin + 15, yPos);
                    pdf.text(truncate(note.destination, 18), margin + 55, yPos);
                    pdf.text(truncate(note.clientName, 18), margin + 95, yPos);
                    pdf.text(note.date ? new Date(note.date).toLocaleDateString('es-ES') : '-', margin + 135, yPos);
                    pdf.text(truncate(note.workerName || 'Desconocido', 15), margin + 160, yPos);
                    yPos += 6;
                  }
                  
                  pdf.setFontSize(8);
                  pdf.setTextColor(128, 128, 128);
                  pdf.text(`Total: ${pendingDeliveryNotes.length} albarán(es) pendiente(s) - Generado el ${new Date().toLocaleDateString('es-ES')}`, margin, pageHeight - 8);
                  
                  pdf.save(`albaranes-pendientes-${new Date().toISOString().split('T')[0]}.pdf`);
                  toast({ title: "PDF generado", description: `Se descargó el listado de ${pendingDeliveryNotes.length} albarán(es) pendiente(s)` });
                } catch (error) {
                  console.error("PDF generation error:", error);
                  toast({ title: "Error", description: "No se pudo generar el PDF", variant: "destructive" });
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
                  <p className="font-semibold">Albaranes Pendientes (PDF)</p>
                  <p className="text-xs text-muted-foreground">{pendingDeliveryNotes.length} albarán(es) en listado</p>
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
      <Dialog open={albaranesModalOpen} onOpenChange={(open) => {
        setAlbaranesModalOpen(open);
        if (!open) {
          setDateFilterStart("");
          setDateFilterEnd("");
        }
      }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto overflow-x-hidden w-[95vw] p-3 rounded-lg top-[5vh] translate-y-0">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base sm:text-lg">
              Albaranes {albaranesModalType === "pending" ? "Pendientes" : "Firmados"} - {albaranesCreatorType === "admin" ? "Empresa" : "Trabajadores"}
            </DialogTitle>
          </DialogHeader>
          
          {/* Filtro de fechas */}
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="w-4 h-4" />
              Filtrar por fechas
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Desde</label>
                <Input
                  type="date"
                  value={dateFilterStart}
                  onChange={(e) => setDateFilterStart(e.target.value)}
                  className="h-9 text-sm"
                  data-testid="input-date-filter-start"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Hasta</label>
                <Input
                  type="date"
                  value={dateFilterEnd}
                  onChange={(e) => setDateFilterEnd(e.target.value)}
                  className="h-9 text-sm"
                  data-testid="input-date-filter-end"
                />
              </div>
            </div>
            {(dateFilterStart || dateFilterEnd) && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 w-full"
                onClick={() => { setDateFilterStart(""); setDateFilterEnd(""); }}
                data-testid="button-clear-date-filter"
              >
                <X className="w-3 h-3 mr-1" />
                Limpiar filtro
              </Button>
            )}
          </div>

          <div className="space-y-3 overflow-hidden">
            {(() => {
              let notes: any[] = [];
              if (albaranesCreatorType === "admin") {
                notes = albaranesModalType === "pending" ? empresaPendingNotes : empresaSignedNotes;
              } else {
                notes = albaranesModalType === "pending" ? trabajadoresPendingNotes : trabajadoresSignedNotes;
              }
              
              // Aplicar filtro de fechas
              if (dateFilterStart || dateFilterEnd) {
                notes = notes.filter((note: any) => {
                  if (!note.date) return false;
                  const noteDate = new Date(note.date);
                  if (dateFilterStart) {
                    const startDate = new Date(dateFilterStart);
                    if (noteDate < startDate) return false;
                  }
                  if (dateFilterEnd) {
                    const endDate = new Date(dateFilterEnd);
                    if (noteDate > endDate) return false;
                  }
                  return true;
                });
              }
              
              return notes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {(dateFilterStart || dateFilterEnd) 
                    ? "No hay albaranes en el rango de fechas seleccionado"
                    : "No hay albaranes en esta categoría"
                  }
                </p>
              ) : notes.map((note: any) => (
              <div key={note.id} className="rounded-lg border border-muted-foreground/10 bg-slate-50 dark:bg-slate-900/30 overflow-hidden shadow-sm" ref={(el) => { deliveryNoteRefs.current[note.id] = el as any; }}>
                {note.photo && (
                  <div className="w-full h-32 sm:h-40 bg-muted cursor-pointer hover:opacity-90 transition-opacity" onClick={() => isValidPhoto(note.photo) && previewDeliveryNote(note.photo)}>
                    {isValidPhoto(note.photo) ? (
                      <img src={note.photo} alt="Albarán firmado" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <Camera className="w-8 h-8 mx-auto mb-1 opacity-50" />
                          <p className="text-xs">Imagen no disponible</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="p-3 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded" data-testid={`note-number-${note.id}`}>
                      Albarán #{note.noteNumber || '—'}
                    </span>
                    <div className="flex gap-1 flex-wrap">
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
                      {isFullySigned(note) && (
                        <Badge className={note.isInvoiced 
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 no-default-hover-elevate no-default-active-elevate"
                          : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 no-default-hover-elevate no-default-active-elevate"
                        }>
                          {note.isInvoiced ? (
                            <><Banknote className="w-3 h-3 mr-1" /> Cobrado</>
                          ) : (
                            <><Clock className="w-3 h-3 mr-1" /> Pendiente cobro</>
                          )}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">
                          {note.pickupOrigins && note.pickupOrigins.length > 1 ? `Recogidas (${note.pickupOrigins.length})` : 'Recogida'} → Entrega
                        </p>
                        <p className="text-sm font-medium truncate">{formatOrigins(note.pickupOrigins)} → {note.destination || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      <div className="flex items-start gap-2">
                        <Truck className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Cliente</p>
                          <p className="text-sm font-medium truncate">{note.clientName || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Truck className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Vehículo</p>
                          <p className="text-sm font-medium truncate">{note.vehicleType || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Fecha</p>
                          <p className="text-sm font-medium">{note.date ? new Date(note.date).toLocaleDateString('es-ES') : 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Hora</p>
                          <p className="text-sm font-medium">{note.time || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Truck className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Trabajador</p>
                        <p className="text-sm font-medium truncate">{note.workerName || 'Desconocido'}</p>
                      </div>
                    </div>

                    {note.waitTime && note.waitTime > 0 && (
                      <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-md p-2">
                        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-amber-700 dark:text-amber-300">Tiempo de Espera</p>
                          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                            {Math.floor(note.waitTime / 60)}h {note.waitTime % 60}m
                          </p>
                        </div>
                      </div>
                    )}

                    {isFullySigned(note) && note.signedAt && (
                      <div className="flex items-start gap-2 bg-green-50 dark:bg-green-900/20 rounded-md p-2">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-green-700 dark:text-green-300">Completamente Firmado</p>
                          <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                            {new Date(note.signedAt).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Button to add missing photo or signature */}
                    {!isFullySigned(note) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            data-testid={`button-sign-${note.id}`}
                          >
                            <Pen className="w-3 h-3 mr-1" />
                            Firmar Albarán
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="w-48">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedNoteForPhoto(note);
                              setCapturePhotoOpen(true);
                            }}
                            className="cursor-pointer"
                            data-testid={`menu-add-photo-${note.id}`}
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            {note.photo ? "Cambiar Foto" : "Añadir Foto"}
                            {note.photo && <CheckCircle className="w-3 h-3 ml-auto text-green-500" />}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedNoteForSignature(note);
                              setCaptureSignatureOpen(true);
                            }}
                            className="cursor-pointer"
                            data-testid={`menu-add-signature-${note.id}`}
                          >
                            <Pen className="w-4 h-4 mr-2" />
                            {note.signature ? "Cambiar Firma" : "Añadir Firma Digital"}
                            {note.signature && <CheckCircle className="w-3 h-3 ml-auto text-green-500" />}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

                    {isFullySigned(note) && note.invoicedAt && (
                      <div className="flex items-start gap-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-md p-2">
                        <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-emerald-700 dark:text-emerald-300">Cobrado el</p>
                          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                            {new Date(note.invoicedAt).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )}

                    {note.observations && note.observations.trim() && (
                      <div className="flex items-start gap-2 bg-muted/30 rounded-md p-2">
                        <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">Observaciones</p>
                          <p className="text-sm line-clamp-2">{note.observations}</p>
                        </div>
                      </div>
                    )}

                    {note.signature && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSignatureToView(note.signature);
                          setViewSignatureOpen(true);
                        }}
                        className="w-full text-xs h-7"
                        data-testid={`button-view-signature-${note.id}`}
                      >
                        <Pen className="w-3 h-3 mr-1" />
                        Ver Firma Digital
                      </Button>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1" data-testid={`buttons-${note.id}`}>
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
                  
                  {note.signedAt && (
                    <Button
                      size="sm"
                      variant={note.isInvoiced ? "outline" : "default"}
                      className={`w-full text-xs h-8 ${!note.isInvoiced ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                      onClick={async () => {
                        try {
                          const response = await fetch(`/api/delivery-notes/${note.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              isInvoiced: !note.isInvoiced
                            }),
                            credentials: "include",
                          });

                          if (response.ok) {
                            toast({ 
                              title: note.isInvoiced ? "Marcado como pendiente" : "Marcado como cobrado",
                              description: `Albarán #${note.noteNumber} actualizado`
                            });
                            await queryClient.invalidateQueries({ queryKey: ["/api/delivery-notes"] });
                          } else {
                            const errorData = await response.json().catch(() => ({}));
                            toast({ 
                              title: "Error", 
                              description: errorData.error || "No se pudo actualizar el albarán", 
                              variant: "destructive" 
                            });
                          }
                        } catch (error) {
                          console.error("Error actualizando albarán:", error);
                          toast({ title: "Error", description: "No se pudo actualizar el albarán", variant: "destructive" });
                        }
                      }}
                      data-testid={`button-toggle-invoice-card-${note.id}`}
                    >
                      {note.isInvoiced ? (
                        <>
                          <X className="w-3 h-3 mr-1" />
                          Marcar como pendiente
                        </>
                      ) : (
                        <>
                          <Banknote className="w-3 h-3 mr-1" />
                          Marcar como cobrado
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ));
            })()}
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

      {/* Modal Crear Albarán */}
      <Dialog open={createDeliveryOpen} onOpenChange={setCreateDeliveryOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Albarán</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Cliente <span className="text-destructive">*</span></label>
              <AutocompleteInput
                placeholder="Nombre del cliente"
                value={formData.clientName}
                onChange={(value) => setFormData({ ...formData, clientName: value })}
                suggestions={suggestions.clients}
                data-testid="input-client-name"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Recogida <span className="text-destructive">*</span></label>
                <AutocompleteInput
                  placeholder="Dirección de recogida"
                  value={formData.pickupOrigins[0]?.address || ""}
                  onChange={(value) => {
                    const newOrigins = [...formData.pickupOrigins];
                    if (newOrigins.length === 0) newOrigins.push({ name: "", address: "" });
                    newOrigins[0] = { ...newOrigins[0], address: value };
                    setFormData({ ...formData, pickupOrigins: newOrigins });
                  }}
                  suggestions={suggestions.originAddresses || []}
                  data-testid="input-pickup-origin-0"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Destino <span className="text-destructive">*</span></label>
                <AutocompleteInput
                  placeholder="Dirección de entrega"
                  value={formData.destination}
                  onChange={(value) => setFormData({ ...formData, destination: value })}
                  suggestions={suggestions.destinations}
                  data-testid="input-destination"
                />
              </div>
            </div>
            
            {formData.pickupOrigins.length > 1 && formData.pickupOrigins.slice(1).map((origin, index) => (
              <div key={index + 1} className="flex items-center gap-2">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <AutocompleteInput
                    placeholder={`Recogida ${index + 2}`}
                    value={origin.name}
                    onChange={(value) => {
                      const newOrigins = [...formData.pickupOrigins];
                      newOrigins[index + 1] = { ...newOrigins[index + 1], name: value };
                      setFormData({ ...formData, pickupOrigins: newOrigins });
                    }}
                    suggestions={suggestions.originNames || []}
                    data-testid={`input-pickup-origin-name-${index + 1}`}
                  />
                  <AutocompleteInput
                    placeholder="Dirección"
                    value={origin.address}
                    onChange={(value) => {
                      const newOrigins = [...formData.pickupOrigins];
                      newOrigins[index + 1] = { ...newOrigins[index + 1], address: value };
                      setFormData({ ...formData, pickupOrigins: newOrigins });
                    }}
                    suggestions={suggestions.originAddresses || []}
                    data-testid={`input-pickup-origin-address-${index + 1}`}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const newOrigins = formData.pickupOrigins.filter((_, i) => i !== index + 1);
                    setFormData({ ...formData, pickupOrigins: newOrigins });
                  }}
                  className="h-9 w-9 shrink-0"
                  data-testid={`button-remove-origin-${index + 1}`}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFormData({ ...formData, pickupOrigins: [...formData.pickupOrigins, { name: "", address: "" }] })}
              className="w-full text-xs"
              data-testid="button-add-origin"
            >
              <Plus className="w-3 h-3 mr-1" />
              Añadir otra recogida
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Fecha</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="text-sm"
                  data-testid="input-date"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Hora</label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="text-sm"
                  data-testid="input-time"
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
                    data-testid={`button-vehicle-${tipo.toLowerCase()}`}
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
                  data-testid="input-observations"
                />
              </div>
            </details>
            
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setCreateDeliveryOpen(false)} className="flex-1" data-testid="button-cancel-create">
                Cancelar
              </Button>
              <Button
                disabled={!formData.clientName.trim() || !formData.destination.trim() || (!formData.pickupOrigins[0]?.address?.trim())}
                onClick={async () => {
                  try {
                    const deliveryNoteData = {
                      quoteId: `custom-${Date.now()}`,
                      workerId: user?.id,
                      clientName: formData.clientName.trim(),
                      pickupOrigins: formData.pickupOrigins.filter(o => o.name.trim() !== "" || o.address.trim() !== ""),
                      destination: formData.destination.trim(),
                      vehicleType: formData.vehicleType,
                      date: formData.date,
                      time: formData.time,
                      observations: formData.observations.trim() || null,
                      status: "pending",
                    };

                    const response = await fetch("/api/delivery-notes", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(deliveryNoteData),
                      credentials: "include",
                    });

                    if (response.ok) {
                      const newNote = await response.json();
                      await queryClient.invalidateQueries({ queryKey: ["/api/delivery-notes"] });
                      
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
                      });
                      
                      toast({ title: "Albarán creado", description: `Albarán #${newNote.noteNumber} guardado` });
                    } else {
                      toast({ title: "Error", description: "No se pudo crear el albarán", variant: "destructive" });
                    }
                  } catch (error) {
                    console.error("Error guardando albarán:", error);
                    toast({ title: "Error", description: "No se pudo crear el albarán", variant: "destructive" });
                  }
                }}
                className="flex-1 bg-green-600 hover:bg-green-700"
                data-testid="button-save-albaran"
              >
                Crear Albarán
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Facturación */}
      <Dialog open={invoiceModalOpen} onOpenChange={(open) => {
        setInvoiceModalOpen(open);
        if (!open) {
          setDateFilterStart("");
          setDateFilterEnd("");
        }
      }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto overflow-x-hidden w-[95vw] p-3 rounded-lg top-[5vh] translate-y-0">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              {invoiceModalType === "invoiced" ? (
                <>
                  <Banknote className="h-5 w-5 text-emerald-500" />
                  Albaranes Cobrados
                </>
              ) : (
                <>
                  <Clock className="h-5 w-5 text-amber-500" />
                  Pendientes de Cobro
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {/* Filtro de fechas */}
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="w-4 h-4" />
              Filtrar por fechas
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Desde</label>
                <Input
                  type="date"
                  value={dateFilterStart}
                  onChange={(e) => setDateFilterStart(e.target.value)}
                  className="h-9 text-sm"
                  data-testid="input-invoice-date-filter-start"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Hasta</label>
                <Input
                  type="date"
                  value={dateFilterEnd}
                  onChange={(e) => setDateFilterEnd(e.target.value)}
                  className="h-9 text-sm"
                  data-testid="input-invoice-date-filter-end"
                />
              </div>
            </div>
            {(dateFilterStart || dateFilterEnd) && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 w-full"
                onClick={() => { setDateFilterStart(""); setDateFilterEnd(""); }}
                data-testid="button-clear-invoice-date-filter"
              >
                <X className="w-3 h-3 mr-1" />
                Limpiar filtro
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {(() => {
              let notes: any[] = invoiceModalType === "invoiced" ? invoicedNotes : pendingInvoiceNotes;
              
              // Aplicar filtro de fechas
              if (dateFilterStart || dateFilterEnd) {
                notes = notes.filter((note: any) => {
                  if (!note.date) return false;
                  const noteDate = new Date(note.date);
                  if (dateFilterStart) {
                    const startDate = new Date(dateFilterStart);
                    if (noteDate < startDate) return false;
                  }
                  if (dateFilterEnd) {
                    const endDate = new Date(dateFilterEnd);
                    if (noteDate > endDate) return false;
                  }
                  return true;
                });
              }
              
              return notes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {(dateFilterStart || dateFilterEnd) 
                    ? "No hay albaranes en el rango de fechas seleccionado"
                    : invoiceModalType === "invoiced" 
                      ? "No hay albaranes marcados como cobrados"
                      : "No hay albaranes pendientes de cobro"
                  }
                </p>
              ) : notes.map((note: any) => (
                <div key={note.id} className="rounded-lg border border-muted-foreground/10 bg-slate-50 dark:bg-slate-900/30 overflow-hidden shadow-sm">
                  {note.photo && (
                    <div className="w-full h-24 bg-muted cursor-pointer hover:opacity-90 transition-opacity" onClick={() => isValidPhoto(note.photo) && previewDeliveryNote(note.photo)}>
                      {isValidPhoto(note.photo) ? (
                        <img src={note.photo} alt="Albarán firmado" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <div className="text-center">
                            <Camera className="w-6 h-6 mx-auto mb-1 opacity-50" />
                            <p className="text-xs">No disponible</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                          Albarán #{note.noteNumber}
                        </span>
                        <Badge className={note.isInvoiced ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"}>
                          {note.isInvoiced ? "Cobrado" : "Pendiente"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-xs">
                      <MapPin className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-muted-foreground">
                          {note.pickupOrigins && note.pickupOrigins.length > 1 ? `Recogidas (${note.pickupOrigins.length})` : 'Recogida'} → Entrega
                        </p>
                        <p className="font-medium truncate">{formatOrigins(note.pickupOrigins)} → {note.destination || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-start gap-2">
                        <User className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-muted-foreground">Trabajador</p>
                          <p className="font-medium truncate">{note.workerName || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-muted-foreground">Fecha</p>
                          <p className="font-medium">{note.date || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Truck className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-muted-foreground">Cliente</p>
                          <p className="font-medium truncate">{note.clientName || 'N/A'}</p>
                        </div>
                      </div>
                      {note.waitTime && note.waitTime > 0 && (
                        <div className="flex items-start gap-2">
                          <Hourglass className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-muted-foreground">T. Espera</p>
                            <p className="font-medium text-amber-600 dark:text-amber-400">{note.waitTime} min</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {note.observations && note.observations.trim() && (
                      <div className="flex items-start gap-2 text-xs bg-slate-100 dark:bg-slate-800/50 rounded-md p-2">
                        <FileText className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-muted-foreground">Observaciones</p>
                          <p className="font-medium">{note.observations}</p>
                        </div>
                      </div>
                    )}

                    {note.invoicedAt && (
                      <div className="flex items-start gap-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-md p-2 text-xs">
                        <Banknote className="w-3 h-3 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-emerald-700 dark:text-emerald-300">Cobrado el</p>
                          <p className="font-semibold text-emerald-800 dark:text-emerald-200">
                            {new Date(note.invoicedAt).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )}

                    <Button
                      size="sm"
                      variant={note.isInvoiced ? "outline" : "default"}
                      className={`w-full text-xs h-8 ${!note.isInvoiced ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                      onClick={async () => {
                        try {
                          const response = await fetch(`/api/delivery-notes/${note.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              isInvoiced: !note.isInvoiced
                            }),
                            credentials: "include",
                          });

                          if (response.ok) {
                            toast({ 
                              title: note.isInvoiced ? "Marcado como pendiente" : "Marcado como cobrado",
                              description: `Albarán #${note.noteNumber} actualizado`
                            });
                            await queryClient.invalidateQueries({ queryKey: ["/api/delivery-notes"] });
                          } else {
                            const errorData = await response.json().catch(() => ({}));
                            toast({ 
                              title: "Error", 
                              description: errorData.error || "No se pudo actualizar el albarán", 
                              variant: "destructive" 
                            });
                          }
                        } catch (error) {
                          console.error("Error actualizando albarán:", error);
                          toast({ title: "Error", description: "No se pudo actualizar el albarán", variant: "destructive" });
                        }
                      }}
                      data-testid={`button-toggle-invoice-${note.id}`}
                    >
                      {note.isInvoiced ? (
                        <>
                          <X className="w-3 h-3 mr-1" />
                          Marcar como pendiente
                        </>
                      ) : (
                        <>
                          <Banknote className="w-3 h-3 mr-1" />
                          Marcar como cobrado
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ));
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Capture Dialog for Signing */}
      <Dialog open={capturePhotoOpen} onOpenChange={(open) => {
        setCapturePhotoOpen(open);
        if (!open) {
          setCapturedPhoto(null);
          setSelectedNoteForPhoto(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Firmar Albarán #{selectedNoteForPhoto?.noteNumber}</DialogTitle>
            <DialogDescription>
              Sube o captura una foto del albarán firmado
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {!capturedPhoto && (
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-24 border-dashed border-2 flex flex-col gap-2"
                  data-testid="button-upload-photo"
                >
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span>Subir foto del albarán</span>
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileUpload}
                  data-testid="input-file-photo"
                />
              </div>
            )}

            {capturedPhoto && (
              <div className="relative">
                <img 
                  src={capturedPhoto} 
                  alt="Foto capturada" 
                  className="w-full rounded-lg max-h-64 object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => setCapturedPhoto(null)}
                  className="absolute top-2 right-2"
                  data-testid="button-delete-photo"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setCapturePhotoOpen(false);
                  setCapturedPhoto(null);
                  setSelectedNoteForPhoto(null);
                }}
                className="flex-1"
                data-testid="button-cancel-photo"
              >
                Cancelar
              </Button>
              {capturedPhoto && (
                <Button
                  onClick={savePhotoAndSign}
                  disabled={isUploadingPhoto}
                  className="flex-1"
                  data-testid="button-save-photo"
                >
                  {isUploadingPhoto ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Firmar albarán
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Digital Signature Dialog */}
      <Dialog open={captureSignatureOpen} onOpenChange={(open) => {
        setCaptureSignatureOpen(open);
        if (!open) {
          setSelectedNoteForSignature(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Firma Digital - Albarán #{selectedNoteForSignature?.noteNumber}</DialogTitle>
            <DialogDescription>
              El cliente debe firmar con el dedo o ratón en el recuadro
            </DialogDescription>
          </DialogHeader>
          
          <SignaturePad
            onSave={saveSignature}
            onCancel={() => {
              setCaptureSignatureOpen(false);
              setSelectedNoteForSignature(null);
            }}
          />
          
          {isUploadingSignature && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
              <span>Guardando firma...</span>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Signature Dialog */}
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
    </div>
  );
}
