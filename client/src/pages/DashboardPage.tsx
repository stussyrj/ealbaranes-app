import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { TrendingUp, Truck, X, Download, Share2, FileDown, CheckCircle, Clock, FileText, Plus, Calendar, Filter, Receipt, Banknote, User, Hourglass, RefreshCw, Loader2, Camera, Upload, Archive, Pen, Image, ArrowRight, ChevronDown, ChevronUp, MapPin, CircleDot, Trash2, RotateCcw, Search } from "lucide-react";
import type { PickupOrigin } from "@shared/schema";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LightPageBackground } from "@/components/LightPageBackground";
import { DeliveryNoteCard } from "@/components/DeliveryNoteCard";
import { AutocompleteInput } from "@/components/AutocompleteInput";

const DriverDoorAnimation = lazy(() => import("@/components/DriverDoorAnimation").then(m => ({ default: m.DriverDoorAnimation })));
const WorkerAssignmentModal = lazy(() => import("@/components/WorkerAssignmentModal").then(m => ({ default: m.WorkerAssignmentModal })));
const SignaturePad = lazy(() => import("@/components/SignaturePad").then(m => ({ default: m.SignaturePad })));
const OnboardingTutorial = lazy(() => import("@/components/OnboardingTutorial").then(m => ({ default: m.OnboardingTutorial })));
import { DeliveryNoteSigningModal } from "@/components/DeliveryNoteSigningModal";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient as qc, getAuthToken, downloadFile } from "@/lib/queryClient";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  const [downloadDateFrom, setDownloadDateFrom] = useState<string>("");
  const [downloadDateTo, setDownloadDateTo] = useState<string>("");
  const [createDeliveryOpen, setCreateDeliveryOpen] = useState(false);
  const [isCreatingDelivery, setIsCreatingDelivery] = useState(false);
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
  const [workerSearchFilter, setWorkerSearchFilter] = useState<string>("");
  
  // Period filter for summary counters (today/month/total)
  const [periodFilter, setPeriodFilter] = useState<"today" | "month" | "total" | null>(null);
  
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
  
  // Dual signature signing modal state
  const [signingModalOpen, setSigningModalOpen] = useState(false);
  const [selectedNoteForSigning, setSelectedNoteForSigning] = useState<any>(null);
  
  // Onboarding tutorial state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingManuallyCompleted, setOnboardingManuallyCompleted] = useState(false);
  const [vehicleTypes, setVehicleTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  
  // Load vehicle types when modal opens (to get fresh data after settings changes)
  useEffect(() => {
    if (!createDeliveryOpen) return;
    
    const loadVehicleTypes = async () => {
      try {
        setIsLoadingVehicles(true);
        const response: any = await apiRequest("GET", "/api/vehicle-types");
        const types = response.types || [];
        setVehicleTypes(types);
        // Set first vehicle as default if available and current value is default
        if (types.length > 0 && (formData.vehicleType === "Furgoneta" || !types.find((t: any) => t.name === formData.vehicleType))) {
          setFormData(prev => ({ ...prev, vehicleType: types[0].name }));
        }
      } catch (error) {
        console.error("Error loading vehicle types:", error);
        // Fallback to defaults
        setVehicleTypes([
          { id: "1", name: "Moto" },
          { id: "2", name: "Furgoneta" },
          { id: "3", name: "Furgón" },
          { id: "4", name: "Carrozado" },
          { id: "5", name: "Camión" }
        ]);
      } finally {
        setIsLoadingVehicles(false);
      }
    };
    
    loadVehicleTypes();
  }, [createDeliveryOpen]);
  
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
  
  // Helper function to determine if a note is fully signed
  // Requires: origin document + destination document + photo (new dual signature system)
  // OR photo + signature (legacy)
  const isFullySigned = (note: any) => {
    const hasNewDualSignatures = note.originSignatureDocument && note.destinationSignatureDocument && note.photo;
    const hasLegacySignatures = note.photo && note.signature;
    return hasNewDualSignatures || hasLegacySignatures;
  };
  
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
  
  // Helper to format a single origin display as JSX with styled labels
  const RouteDisplay = ({ origin }: { origin: PickupOrigin }) => {
    const from = origin.name || 'N/A';
    const to = origin.address || 'N/A';
    return (
      <span>
        <span className="text-muted-foreground">Recogida:</span> {from} <span className="text-muted-foreground">→</span> <span className="text-muted-foreground">Entrega:</span> {to}
      </span>
    );
  };
  
  // Keep string version for PDF generation
  const formatOriginString = (origin: PickupOrigin): string => {
    const from = origin.name || 'N/A';
    const to = origin.address || 'N/A';
    return `Recogida: ${from} → Entrega: ${to}`;
  };
  
  // Helper to format multiple origins compactly
  const formatOrigins = (origins: PickupOrigin[] | null | undefined, maxDisplay: number = 2): string => {
    if (!origins || origins.length === 0) return 'N/A';
    if (origins.length === 1) return formatOriginString(origins[0]);
    if (origins.length <= maxDisplay) return origins.map(o => formatOriginString(o)).join(', ');
    return `${origins.slice(0, maxDisplay).map(o => formatOriginString(o)).join(', ')} (+${origins.length - maxDisplay})`;
  };
  
  // Helper to format a single origin for structured display
  const formatOriginDisplay = (origin: PickupOrigin): { name: string; address: string } => {
    return {
      name: origin.name || '',
      address: origin.address || ''
    };
  };
  
  const formatOriginsForPdf = (origins: PickupOrigin[] | null | undefined): string => {
    if (!origins || origins.length === 0) return 'N/A';
    return origins.map(o => formatOriginString(o)).join('\n');
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
        const img = document.createElement('img') as HTMLImageElement;
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
      
      const response = await apiRequest("PATCH", `/api/delivery-notes/${selectedNoteForPhoto.id}`, { photo: capturedPhoto });
      
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
      
      const response = await apiRequest("PATCH", `/api/delivery-notes/${selectedNoteForSignature.id}`, { signature: signatureDataUrl });
      
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

  // Helper function to get auth headers for fetch calls
  const getAuthHeaders = (): HeadersInit => {
    const token = getAuthToken();
    if (token) {
      return { 'Authorization': `Bearer ${token}` };
    }
    return {};
  };

  const { data: quotes = [], refetch: refetchQuotes } = useQuery({
    queryKey: ["/api/quotes"],
    queryFn: async () => {
      const res = await fetch("/api/quotes", { 
        credentials: "include",
        headers: getAuthHeaders(),
      });
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
      const res = await fetch("/api/delivery-notes", { 
        credentials: "include",
        headers: getAuthHeaders(),
      });
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
      const res = await fetch("/api/delivery-notes/suggestions", { 
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        return { clients: [], originNames: [], originAddresses: [], destinations: [] };
      }
      return res.json();
    },
    retry: false,
    staleTime: 60000,
  });

  // Query for deleted notes (admin only)
  const { data: deletedNotes = [], refetch: refetchDeletedNotes, isLoading: isDeletionLoading } = useQuery({
    queryKey: ["/api/delivery-notes/deleted"],
    queryFn: async () => {
      console.log("[DashboardPage] Fetching deleted notes...");
      const res = await fetch("/api/delivery-notes/deleted", { 
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        console.log("[DashboardPage] Failed to fetch deleted notes:", res.status);
        return [];
      }
      const data = await res.json();
      console.log("[DashboardPage] Deleted notes loaded:", data?.length || 0);
      return data;
    },
    enabled: !!user?.isAdmin,
    retry: false,
    staleTime: 0,
  });

  // Delete delivery note mutation
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      setDeletingNoteId(noteId);
      const res = await apiRequest("DELETE", `/api/delivery-notes/${noteId}`);
      if (!res.ok) {
        throw new Error("Error al borrar albarán");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Albarán borrado", description: "Se ha movido a la papelera" });
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-notes/deleted"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
    onSettled: () => {
      setDeletingNoteId(null);
    },
  });

  // Edit observations state and mutation
  const [editingObservationsId, setEditingObservationsId] = useState<string | null>(null);
  const [editingObservationsText, setEditingObservationsText] = useState("");
  const updateObservationsMutation = useMutation({
    mutationFn: async ({ noteId, observations }: { noteId: string; observations: string }) => {
      const res = await apiRequest("PATCH", `/api/delivery-notes/${noteId}`, { observations: observations.trim() || null });
      if (!res.ok) {
        throw new Error("Error al actualizar observaciones");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Observaciones actualizadas", description: "Los cambios se han guardado" });
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-notes"] });
      setEditingObservationsId(null);
      setEditingObservationsText("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Arrival/Departure time tracking mutations
  const updateTimeMutation = useMutation({
    mutationFn: async ({ noteId, arrivedAt, departedAt }: { noteId: string; arrivedAt?: string; departedAt?: string }) => {
      const body: { arrivedAt?: string | null; departedAt?: string | null } = {};
      if (arrivedAt !== undefined) body.arrivedAt = arrivedAt;
      if (departedAt !== undefined) body.departedAt = departedAt;
      const res = await apiRequest("PATCH", `/api/delivery-notes/${noteId}`, body);
      if (!res.ok) {
        throw new Error("Error al registrar tiempo");
      }
      return res.json();
    },
    onMutate: async ({ noteId, arrivedAt, departedAt }) => {
      // Cancel any outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ["/api/delivery-notes"] });

      // Snapshot previous state for rollback
      const previousData = queryClient.getQueryData<any[]>(["/api/delivery-notes"]);

      // Optimistic update
      queryClient.setQueryData(["/api/delivery-notes"], (old: any[] | undefined) => {
        if (!old) return old;
        return old.map((note) =>
          note.id === noteId
            ? {
                ...note,
                ...(arrivedAt !== undefined && { arrivedAt }),
                ...(departedAt !== undefined && { departedAt }),
              }
            : note
        );
      });

      return { previousData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-notes"] });
    },
    onError: (error: Error, _variables, context: any) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(["/api/delivery-notes"], context.previousData);
      }
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleArrivalDeparture = async (note: any, type: 'arrival' | 'departure') => {
    if (type === 'arrival') {
      const now = new Date().toISOString();
      await updateTimeMutation.mutateAsync({ noteId: note.id, arrivedAt: now });
      toast({ title: "Hora de llegada registrada", description: "Se ha marcado la hora de llegada" });
    } else {
      if (!note.arrivedAt) {
        toast({ title: "Error", description: "Debe marcar primero la hora de llegada", variant: "destructive" });
        return;
      }
      const now = new Date().toISOString();
      const arrived = new Date(note.arrivedAt);
      const departed = new Date(now);
      const durationMs = departed.getTime() - arrived.getTime();
      const durationMinutes = Math.floor(durationMs / 60000);
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      const durationText = `Duración: ${hours}h ${minutes}m`;
      
      await updateTimeMutation.mutateAsync({ 
        noteId: note.id, 
        departedAt: now 
      });
      
      // Only add duration to observations if it's greater than 20 minutes
      if (durationMinutes > 20) {
        let updatedObservations = note.observations || "";
        if (updatedObservations && !updatedObservations.includes("Duración:")) {
          updatedObservations += ` | ${durationText}`;
        } else if (!updatedObservations) {
          updatedObservations = durationText;
        }
        
        await updateObservationsMutation.mutateAsync({
          noteId: note.id,
          observations: updatedObservations,
        });
        toast({ title: "Hora de salida registrada", description: `Duración registrada: ${hours}h ${minutes}m` });
      } else {
        toast({ title: "Hora de salida registrada", description: `Duración: ${minutes}m (no se añade a observaciones por ser menor a 20 minutos)` });
      }
    }
  };

  // Restore delivery note mutation (admin only)
  const [restoringNoteId, setRestoringNoteId] = useState<string | null>(null);
  const restoreNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      setRestoringNoteId(noteId);
      const res = await apiRequest("POST", `/api/delivery-notes/${noteId}/restore`);
      if (!res.ok) {
        throw new Error("Error al restaurar albarán");
      }
      return res.json();
    },
    onSuccess: async () => {
      toast({ title: "Albarán restaurado", description: "El albarán ha sido restaurado" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/delivery-notes"] }),
        refetchDeletedNotes()
      ]);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
    onSettled: () => {
      setRestoringNoteId(null);
    },
  });

  // Permanently delete delivery note mutation (admin only)
  const [permanentlyDeletingNoteId, setPermanentlyDeletingNoteId] = useState<string | null>(null);
  const permanentDeleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      setPermanentlyDeletingNoteId(noteId);
      const res = await apiRequest("DELETE", `/api/delivery-notes/${noteId}/permanent`);
      if (!res.ok) {
        throw new Error("Error al eliminar albarán");
      }
      return res.json();
    },
    onSuccess: async () => {
      toast({ title: "Albarán eliminado", description: "El albarán ha sido eliminado permanentemente" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/delivery-notes"] }),
        refetchDeletedNotes()
      ]);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
    onSettled: () => {
      setPermanentlyDeletingNoteId(null);
    },
  });

  // Deleted notes modal state
  const [deletedNotesModalOpen, setDeletedNotesModalOpen] = useState(false);

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
  
  // Summary counters: Today, This Month, Total (all time)
  // Helper to normalize any date (string or Date) to local YYYY-MM-DD format
  // This handles ISO timestamps by first parsing to Date, then extracting local components
  const normalizeToLocalDateStr = (dateInput: Date | string): string => {
    let d: Date;
    if (typeof dateInput === 'string') {
      // For date-only strings like "2024-12-06", append time to force local parse
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        d = new Date(dateInput + 'T12:00:00');
      } else {
        // For ISO timestamps or other formats, parse normally
        d = new Date(dateInput);
      }
    } else {
      d = dateInput;
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const today = new Date();
  const todayStr = normalizeToLocalDateStr(today);
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const notesCreatedToday = allDeliveryNotes.filter((n: any) => {
    if (!n.date) return false;
    const noteDateStr = normalizeToLocalDateStr(n.date);
    return noteDateStr === todayStr;
  }).length;
  
  const notesCreatedThisMonth = allDeliveryNotes.filter((n: any) => {
    if (!n.date) return false;
    const noteDateStr = normalizeToLocalDateStr(n.date);
    const [noteYear, noteMonth] = noteDateStr.split('-').map(Number);
    return noteMonth === (currentMonth + 1) && noteYear === currentYear;
  }).length;
  
  const totalNotesAllTime = allDeliveryNotes.length;
  
  // Get filtered notes by period for display
  const getNotesForPeriod = (period: "today" | "month" | "total") => {
    if (period === "total") return allDeliveryNotes;
    if (period === "today") {
      return allDeliveryNotes.filter((n: any) => {
        if (!n.date) return false;
        const noteDateStr = normalizeToLocalDateStr(n.date);
        return noteDateStr === todayStr;
      });
    }
    if (period === "month") {
      return allDeliveryNotes.filter((n: any) => {
        if (!n.date) return false;
        const noteDateStr = normalizeToLocalDateStr(n.date);
        const [noteYear, noteMonth] = noteDateStr.split('-').map(Number);
        return noteMonth === (currentMonth + 1) && noteYear === currentYear;
      });
    }
    return allDeliveryNotes;
  };
  
  // Filtered notes based on period selection
  const filteredNotesByPeriod = periodFilter ? getNotesForPeriod(periodFilter) : null;
  
  // Helper to filter notes by date range for downloads
  const filterNotesByDateRange = (notes: any[]) => {
    return notes.filter((n: any) => {
      if (!downloadDateFrom && !downloadDateTo) return true;
      if (!n.date) return false;
      const noteDateStr = normalizeToLocalDateStr(n.date);
      if (downloadDateFrom && noteDateStr < downloadDateFrom) return false;
      if (downloadDateTo && noteDateStr > downloadDateTo) return false;
      return true;
    });
  };
  
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
      <Suspense fallback={<div className="fixed inset-0 bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 z-50 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
        <DriverDoorAnimation
          onComplete={() => {
            sessionStorage.setItem("hasSeenAdminAnimation", "true");
            setShowAnimation(false);
          }}
          userName={user?.displayName || user?.username}
          subtitle="a tu panel de empresa"
        />
      </Suspense>
    );
  }

  return (
    <div className="relative">
      <LightPageBackground />
      <div className="relative z-10 space-y-3 sm:space-y-4 p-3 sm:p-6">
        {/* Header compacto */}
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg sm:text-xl font-semibold">Panel de Empresa</h1>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                refetchDeliveryNotes();
                refetchQuotes();
                toast({ title: "Actualizando datos..." });
              }}
              className="rounded-lg border border-muted-foreground/10 bg-slate-50 dark:bg-slate-900/30 p-2.5 shadow-sm hover-elevate flex-shrink-0"
              data-testid="button-refresh-data"
            >
              {isLoadingNotes ? (
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 text-primary" />
              )}
            </button>
            <button
              onClick={() => setDownloadModalOpen(true)}
              className="rounded-lg border border-muted-foreground/10 bg-slate-50 dark:bg-slate-900/30 p-2.5 shadow-sm hover-elevate flex-shrink-0"
              data-testid="button-download-albaranes"
            >
              <FileDown className="h-4 w-4 text-blue-500" />
            </button>
          </div>
        </div>

        {/* Resumen de Actividad - Compact horizontal strip with flex-wrap */}
        <div className="rounded-lg border border-muted-foreground/10 bg-slate-50 dark:bg-slate-900/30 p-3 shadow-sm">
          <div className="flex items-center justify-around gap-3 flex-wrap">
            <button
              onClick={() => setPeriodFilter(periodFilter === "today" ? null : "today")}
              className={`flex items-center gap-2 p-2 rounded-lg transition-all cursor-pointer hover-elevate ${
                periodFilter === "today" 
                  ? "bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-500" 
                  : ""
              }`}
              data-testid="button-filter-today"
            >
              <div className="h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <div className="text-base font-bold leading-none" data-testid="count-today">
                  {isLoadingNotes ? "..." : notesCreatedToday}
                </div>
                <p className="text-[9px] text-muted-foreground">Hoy</p>
              </div>
            </button>
            <button
              onClick={() => setPeriodFilter(periodFilter === "month" ? null : "month")}
              className={`flex items-center gap-2 p-2 rounded-lg transition-all cursor-pointer hover-elevate ${
                periodFilter === "month" 
                  ? "bg-purple-100 dark:bg-purple-900/50 ring-2 ring-purple-500" 
                  : ""
              }`}
              data-testid="button-filter-month"
            >
              <div className="h-7 w-7 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-left">
                <div className="text-base font-bold leading-none" data-testid="count-month">
                  {isLoadingNotes ? "..." : notesCreatedThisMonth}
                </div>
                <p className="text-[9px] text-muted-foreground">Mes</p>
              </div>
            </button>
            <button
              onClick={() => setPeriodFilter(periodFilter === "total" ? null : "total")}
              className={`flex items-center gap-2 p-2 rounded-lg transition-all cursor-pointer hover-elevate ${
                periodFilter === "total" 
                  ? "bg-indigo-100 dark:bg-indigo-900/50 ring-2 ring-indigo-500" 
                  : ""
              }`}
              data-testid="button-filter-total"
            >
              <div className="h-7 w-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                <Archive className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="text-left">
                <div className="text-base font-bold leading-none" data-testid="count-total">
                  {isLoadingNotes ? "..." : totalNotesAllTime}
                </div>
                <p className="text-[9px] text-muted-foreground">Total</p>
              </div>
            </button>
          </div>
        </div>
        
        {/* Filtered notes display when a period is selected */}
        {periodFilter && filteredNotesByPeriod && (
          <div className="rounded-lg border border-muted-foreground/10 bg-slate-50 dark:bg-slate-900/30 p-3 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Albaranes de {periodFilter === "today" ? "Hoy" : periodFilter === "month" ? "Este Mes" : "Total"}
                <Badge className="ml-1">{filteredNotesByPeriod.length}</Badge>
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPeriodFilter(null)}
                className="h-7 px-2"
                data-testid="button-clear-period-filter"
              >
                <X className="h-4 w-4 text-red-600 dark:text-red-400" />
              </Button>
            </div>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {filteredNotesByPeriod.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay albaranes en este período
                </p>
              ) : (
                filteredNotesByPeriod.map((note: any) => (
                  <DeliveryNoteCard
                    key={note.id}
                    note={note}
                    showWorkerName={true}
                    showPhoto={true}
                    showActions={true}
                    isPending={!isFullySigned(note)}
                    onPhotoClick={() => {
                      if (note.photo) {
                        setPreviewImage(note.photo);
                        setPreviewModalOpen(true);
                      }
                    }}
                    onEditClick={() => {
                      setSelectedNoteForSigning(note);
                      setSigningModalOpen(true);
                    }}
                    onAddPhotoClick={() => {
                      setSelectedNoteForPhoto(note);
                      setCapturePhotoOpen(true);
                    }}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Botón Crear Albarán - Prominente */}
        <button
          onClick={() => setCreateDeliveryOpen(true)}
          className="w-full rounded-lg bg-purple-600 hover:bg-purple-700 p-4 shadow-sm text-white flex items-center justify-center gap-3"
          data-testid="button-create-albaran"
        >
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Plus className="h-5 w-5 text-white" />
          </div>
          <span className="text-base font-semibold">Crear Albarán</span>
        </button>

        {/* Albaranes Grid - Compact 2x2 layout */}
        <div className="space-y-4">
          {/* Empresa y Trabajadores en grid compacto 2x2 */}
          <div className="grid grid-cols-2 gap-3">
            {/* Empresa Pendientes */}
            <button
              onClick={() => { setAlbaranesCreatorType("admin"); setAlbaranesModalType("pending"); setAlbaranesModalOpen(true); }}
              className="rounded-lg border border-muted-foreground/10 bg-slate-50 dark:bg-slate-900/30 p-3 min-h-[52px] shadow-sm hover-elevate"
              data-testid="button-view-empresa-pending"
            >
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                  {isLoadingNotes ? (
                    <Loader2 className="h-4 w-4 text-orange-600 dark:text-orange-400 animate-spin" />
                  ) : (
                    <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-bold leading-none" data-testid="count-empresa-pending">
                    {isLoadingNotes ? "..." : empresaPendingNotes.length}
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">Emp. Pend.</p>
                </div>
              </div>
            </button>
            {/* Empresa Firmados */}
            <button
              onClick={() => { setAlbaranesCreatorType("admin"); setAlbaranesModalType("signed"); setAlbaranesModalOpen(true); }}
              className="rounded-lg border border-muted-foreground/10 bg-slate-50 dark:bg-slate-900/30 p-3 min-h-[52px] shadow-sm hover-elevate"
              data-testid="button-view-empresa-signed"
            >
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  {isLoadingNotes ? (
                    <Loader2 className="h-4 w-4 text-green-600 dark:text-green-400 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-bold leading-none" data-testid="count-empresa-signed">
                    {isLoadingNotes ? "..." : empresaSignedNotes.length}
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">Emp. Firm.</p>
                </div>
              </div>
            </button>
            {/* Trabajadores Pendientes */}
            <button
              onClick={() => { setAlbaranesCreatorType("worker"); setAlbaranesModalType("pending"); setAlbaranesModalOpen(true); }}
              className="rounded-lg border border-muted-foreground/10 bg-slate-50 dark:bg-slate-900/30 p-3 min-h-[52px] shadow-sm hover-elevate"
              data-testid="button-view-trabajadores-pending"
            >
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                  {isLoadingNotes ? (
                    <Loader2 className="h-4 w-4 text-orange-600 dark:text-orange-400 animate-spin" />
                  ) : (
                    <Truck className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-bold leading-none">{isLoadingNotes ? "..." : trabajadoresPendingNotes.length}</div>
                  <p className="text-[10px] text-muted-foreground truncate">Trab. Pend.</p>
                </div>
              </div>
            </button>
            {/* Trabajadores Firmados */}
            <button
              onClick={() => { setAlbaranesCreatorType("worker"); setAlbaranesModalType("signed"); setAlbaranesModalOpen(true); }}
              className="rounded-lg border border-muted-foreground/10 bg-slate-50 dark:bg-slate-900/30 p-3 min-h-[52px] shadow-sm hover-elevate"
              data-testid="button-view-trabajadores-signed"
            >
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  {isLoadingNotes ? (
                    <Loader2 className="h-4 w-4 text-green-600 dark:text-green-400 animate-spin" />
                  ) : (
                    <Truck className="h-4 w-4 text-green-600 dark:text-green-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-bold leading-none">{isLoadingNotes ? "..." : trabajadoresSignedNotes.length}</div>
                  <p className="text-[10px] text-muted-foreground truncate">Trab. Firm.</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Facturación - misma estructura compacta */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { setInvoiceModalType("invoiced"); setInvoiceModalOpen(true); }}
            className="rounded-lg border border-muted-foreground/10 bg-slate-50 dark:bg-slate-900/30 p-3 min-h-[52px] shadow-sm hover-elevate"
            data-testid="button-view-invoiced"
          >
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                <Banknote className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg font-bold leading-none">{invoicedNotes.length}</div>
                <p className="text-[10px] text-muted-foreground truncate">Facturados</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => { setInvoiceModalType("pending"); setInvoiceModalOpen(true); }}
            className="rounded-lg border border-muted-foreground/10 bg-slate-50 dark:bg-slate-900/30 p-3 min-h-[52px] shadow-sm hover-elevate"
            data-testid="button-view-pending-invoice"
          >
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg font-bold leading-none">{pendingInvoiceNotes.length}</div>
                <p className="text-[10px] text-muted-foreground truncate">Pte. cobro</p>
              </div>
            </div>
          </button>
        </div>

        {/* Papelera - Solo visible para admin con albaranes borrados */}
        {user?.isAdmin && Array.isArray(deletedNotes) && deletedNotes.length > 0 && (
          <button
            onClick={() => setDeletedNotesModalOpen(true)}
            className="w-full rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 min-h-[52px] shadow-sm hover-elevate"
            data-testid="button-view-deleted-notes"
          >
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="text-lg font-bold leading-none text-red-700 dark:text-red-300">{deletedNotes.length}</div>
                <p className="text-[10px] text-red-600 dark:text-red-400 truncate">Papelera</p>
              </div>
            </div>
          </button>
        )}

        {/* Presupuestos Pendientes */}
        {pendingQuotes.length > 0 && (
          <Card className="bg-slate-50 dark:bg-slate-900/30 border-muted-foreground/10 shadow-sm">
            <CardHeader className="py-4 px-4 sm:py-5 sm:px-6">
              <CardTitle className="text-sm sm:text-base">Presupuestos Pendientes ({pendingQuotes.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="space-y-4">
                {pendingQuotes.map((quote: any) => renderQuoteCard(quote, true))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Presupuestos Firmados */}
        {signedQuotes.length > 0 && (
          <Card className="bg-slate-50 dark:bg-slate-900/30 border-muted-foreground/10 shadow-sm">
            <CardHeader className="py-4 px-4 sm:py-5 sm:px-6">
              <CardTitle className="text-sm sm:text-base">Presupuestos Firmados ({signedQuotes.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="space-y-4">
                {signedQuotes.map((quote: any) => renderQuoteCard(quote, false))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Suspense fallback={null}>
        <WorkerAssignmentModal
          open={assignmentModalOpen}
          onOpenChange={setAssignmentModalOpen}
          quote={selectedQuote}
        />
      </Suspense>

      {/* Modal de Descarga de Albaranes */}
      <Dialog open={downloadModalOpen} onOpenChange={(open) => {
        setDownloadModalOpen(open);
        if (!open) {
          setDownloadDateFrom("");
          setDownloadDateTo("");
        }
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <FileDown className="h-5 w-5 text-green-500" />
              Descargar Albaranes
            </DialogTitle>
            <DialogDescription>
              Selecciona el tipo de albaranes y el rango de fechas para descargar.
            </DialogDescription>
          </DialogHeader>
          
          {/* Date Range Filter */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Desde</label>
              <Input
                type="date"
                value={downloadDateFrom}
                onChange={(e) => setDownloadDateFrom(e.target.value)}
                className="text-sm"
                data-testid="input-download-date-from"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Hasta</label>
              <Input
                type="date"
                value={downloadDateTo}
                onChange={(e) => setDownloadDateTo(e.target.value)}
                className="text-sm"
                data-testid="input-download-date-to"
              />
            </div>
          </div>
          {(downloadDateFrom || downloadDateTo) && (
            <p className="text-xs text-muted-foreground text-center">
              Mostrando albaranes {downloadDateFrom ? `desde ${new Date(downloadDateFrom).toLocaleDateString('es-ES')}` : ''} 
              {downloadDateFrom && downloadDateTo ? ' ' : ''}
              {downloadDateTo ? `hasta ${new Date(downloadDateTo).toLocaleDateString('es-ES')}` : ''}
            </p>
          )}
          
          <div className="space-y-3 pt-2">
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4 px-4"
              disabled={isDownloading || filterNotesByDateRange(signedDeliveryNotes.filter((n: any) => n.photo)).length === 0}
              onClick={async () => {
                const notesWithPhotos = filterNotesByDateRange(signedDeliveryNotes.filter((n: any) => n.photo));
                if (notesWithPhotos.length === 0) {
                  toast({ title: "Sin fotos", description: "No hay albaranes firmados con foto para descargar", variant: "destructive" });
                  return;
                }
                setIsDownloading(true);
                toast({ title: "Generando PDF...", description: `Creando documento con ${notesWithPhotos.length} albarán(es)` });
                try {
                  const { default: jsPDF } = await import('jspdf');
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
                    
                    pdf.setFont('helvetica', 'bold');
                    pdf.text('Cliente:', margin, yPos);
                    pdf.setFont('helvetica', 'normal');
                    pdf.text(note.clientName || 'No especificado', margin + 30, yPos);
                    yPos += 6;
                    
                    pdf.setFont('helvetica', 'bold');
                    pdf.text('Ruta:', margin, yPos);
                    yPos += 6;
                    
                    if (note.pickupOrigins && note.pickupOrigins.length > 0) {
                      pdf.setFont('helvetica', 'normal');
                      note.pickupOrigins.forEach((origin: PickupOrigin) => {
                        const originName = (origin.name || 'N/A').toString();
                        const originAddress = (origin.address || 'N/A').toString();
                        const pickupLine = `Recogida: ${originName.trim()}`;
                        const deliveryLine = `Entrega: ${originAddress.trim()}`;
                        pdf.text(pickupLine, margin + 5, yPos);
                        pdf.text(deliveryLine, margin + 5, yPos + 4);
                        yPos += 9;
                      });
                    } else {
                      pdf.setFont('helvetica', 'normal');
                      pdf.text('Sin ruta definida', margin + 5, yPos);
                      yPos += 5;
                    }
                    
                    yPos += 2;
                    const otherDetails = [
                      ['Vehículo:', note.vehicleType || 'No especificado'],
                      ['Fecha:', note.date ? new Date(note.date).toLocaleDateString('es-ES') : 'No especificada'],
                      ['Hora:', note.time || 'No especificada'],
                      ['Trabajador:', note.workerName || 'Desconocido'],
                      ['Observaciones:', note.observations || 'Sin observaciones']
                    ];
                    
                    otherDetails.forEach(([label, value]) => {
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
                    
                    const signatureHeight = note.signature ? 35 : 0;
                    const photoMaxHeight = pageHeight - yPos - margin - 20 - signatureHeight;
                    
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
                      pdf.addImage(base64, imgFormat, margin, yPos, imgWidth, photoMaxHeight, undefined, 'MEDIUM');
                      yPos += photoMaxHeight + 5;
                    } catch (imgError) {
                      pdf.text('(Imagen no disponible)', margin, yPos + 10);
                      yPos += 15;
                    }
                    
                    // Dual signature section (Origin and Destination)
                    const hasOriginSig = note.originSignature;
                    const hasDestSig = note.destinationSignature;
                    const hasOldSig = note.signature && !hasOriginSig && !hasDestSig;
                    
                    if (hasOriginSig || hasDestSig || hasOldSig) {
                      pdf.setFont('helvetica', 'bold');
                      pdf.setFontSize(10);
                      pdf.setTextColor(0, 0, 0);
                      pdf.text('Firmas Digitales:', margin, yPos);
                      yPos += 6;
                      
                      const sigWidth = 45;
                      const sigHeight = 22;
                      const colWidth = (pageWidth - margin * 2) / 2;
                      
                      // Origin signature (left column)
                      if (hasOriginSig) {
                        pdf.setFontSize(8);
                        pdf.setFont('helvetica', 'bold');
                        pdf.setTextColor(37, 99, 235);
                        pdf.text('ORIGEN - Entrega:', margin, yPos);
                        pdf.setTextColor(0, 0, 0);
                        pdf.setFont('helvetica', 'normal');
                        pdf.text(`Doc: ${note.originSignatureDocument || 'N/A'}`, margin, yPos + 4);
                        
                        try {
                          let sigBase64 = note.originSignature;
                          if (!sigBase64.startsWith('data:image')) {
                            const sigResponse = await fetch(note.originSignature);
                            const sigBlob = await sigResponse.blob();
                            sigBase64 = await new Promise<string>((resolve) => {
                              const reader = new FileReader();
                              reader.onloadend = () => resolve(reader.result as string);
                              reader.readAsDataURL(sigBlob);
                            });
                          }
                          const sigFormat = sigBase64.includes('data:image/png') ? 'PNG' : 'JPEG';
                          pdf.setFillColor(255, 255, 255);
                          pdf.rect(margin, yPos + 6, sigWidth + 4, sigHeight + 4, 'F');
                          pdf.setDrawColor(180, 180, 180);
                          pdf.rect(margin, yPos + 6, sigWidth + 4, sigHeight + 4, 'S');
                          pdf.addImage(sigBase64, sigFormat, margin + 2, yPos + 8, sigWidth, sigHeight, undefined, 'MEDIUM');
                        } catch (e) {
                          pdf.text('(Firma no disponible)', margin, yPos + 15);
                        }
                      }
                      
                      // Destination signature (right column)
                      if (hasDestSig) {
                        const xOffset = margin + colWidth;
                        pdf.setFontSize(8);
                        pdf.setFont('helvetica', 'bold');
                        pdf.setTextColor(22, 163, 74);
                        pdf.text('DESTINO - Recibe:', xOffset, yPos);
                        pdf.setTextColor(0, 0, 0);
                        pdf.setFont('helvetica', 'normal');
                        pdf.text(`Doc: ${note.destinationSignatureDocument || 'N/A'}`, xOffset, yPos + 4);
                        
                        try {
                          let sigBase64 = note.destinationSignature;
                          if (!sigBase64.startsWith('data:image')) {
                            const sigResponse = await fetch(note.destinationSignature);
                            const sigBlob = await sigResponse.blob();
                            sigBase64 = await new Promise<string>((resolve) => {
                              const reader = new FileReader();
                              reader.onloadend = () => resolve(reader.result as string);
                              reader.readAsDataURL(sigBlob);
                            });
                          }
                          const sigFormat = sigBase64.includes('data:image/png') ? 'PNG' : 'JPEG';
                          pdf.setFillColor(255, 255, 255);
                          pdf.rect(xOffset, yPos + 6, sigWidth + 4, sigHeight + 4, 'F');
                          pdf.setDrawColor(180, 180, 180);
                          pdf.rect(xOffset, yPos + 6, sigWidth + 4, sigHeight + 4, 'S');
                          pdf.addImage(sigBase64, sigFormat, xOffset + 2, yPos + 8, sigWidth, sigHeight, undefined, 'MEDIUM');
                        } catch (e) {
                          pdf.text('(Firma no disponible)', xOffset, yPos + 15);
                        }
                      }
                      
                      // Fallback: Old single signature for legacy notes
                      if (hasOldSig) {
                        pdf.setFontSize(8);
                        pdf.setFont('helvetica', 'bold');
                        pdf.text('Firma del cliente:', margin, yPos);
                        try {
                          let sigBase64 = note.signature;
                          if (!sigBase64.startsWith('data:image')) {
                            const sigResponse = await fetch(note.signature);
                            const sigBlob = await sigResponse.blob();
                            sigBase64 = await new Promise<string>((resolve) => {
                              const reader = new FileReader();
                              reader.onloadend = () => resolve(reader.result as string);
                              reader.readAsDataURL(sigBlob);
                            });
                          }
                          const sigFormat = sigBase64.includes('data:image/png') ? 'PNG' : 'JPEG';
                          pdf.setFillColor(255, 255, 255);
                          pdf.rect(margin, yPos + 4, sigWidth + 4, sigHeight + 4, 'F');
                          pdf.setDrawColor(180, 180, 180);
                          pdf.rect(margin, yPos + 4, sigWidth + 4, sigHeight + 4, 'S');
                          pdf.addImage(sigBase64, sigFormat, margin + 2, yPos + 6, sigWidth, sigHeight, undefined, 'MEDIUM');
                        } catch (e) {
                          pdf.setFont('helvetica', 'normal');
                          pdf.text('(Firma no disponible)', margin, yPos + 10);
                        }
                      }
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
                  <p className="text-xs text-muted-foreground">{filterNotesByDateRange(signedDeliveryNotes.filter((n: any) => n.photo)).length} albarán(es) con foto</p>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4 px-4"
              disabled={isDownloading || filterNotesByDateRange(invoicedNotes.filter((n: any) => n.photo)).length === 0}
              onClick={async () => {
                const notesWithPhotos = filterNotesByDateRange(invoicedNotes.filter((n: any) => n.photo));
                if (notesWithPhotos.length === 0) {
                  toast({ title: "Sin fotos", description: "No hay albaranes facturados con foto para descargar", variant: "destructive" });
                  return;
                }
                setIsDownloading(true);
                toast({ title: "Generando PDF...", description: `Creando documento con ${notesWithPhotos.length} albarán(es) facturado(s)` });
                try {
                  const { default: jsPDF } = await import('jspdf');
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
                    
                    pdf.setFont('helvetica', 'bold');
                    pdf.text('Cliente:', margin, yPos);
                    pdf.setFont('helvetica', 'normal');
                    pdf.text(note.clientName || 'No especificado', margin + 30, yPos);
                    yPos += 6;
                    
                    pdf.setFont('helvetica', 'bold');
                    pdf.text('Ruta:', margin, yPos);
                    yPos += 6;
                    
                    if (note.pickupOrigins && note.pickupOrigins.length > 0) {
                      pdf.setFont('helvetica', 'normal');
                      note.pickupOrigins.forEach((origin: PickupOrigin) => {
                        const originName = (origin.name || 'N/A').toString();
                        const originAddress = (origin.address || 'N/A').toString();
                        const pickupLine = `Recogida: ${originName.trim()}`;
                        const deliveryLine = `Entrega: ${originAddress.trim()}`;
                        pdf.text(pickupLine, margin + 5, yPos);
                        pdf.text(deliveryLine, margin + 5, yPos + 4);
                        yPos += 9;
                      });
                    } else {
                      pdf.setFont('helvetica', 'normal');
                      pdf.text('Sin ruta definida', margin + 5, yPos);
                      yPos += 5;
                    }
                    
                    yPos += 2;
                    const facturadoDetails = [
                      ['Vehículo:', note.vehicleType || 'No especificado'],
                      ['Fecha:', note.date ? new Date(note.date).toLocaleDateString('es-ES') : 'No especificada'],
                      ['Hora:', note.time || 'No especificada'],
                      ['Trabajador:', note.workerName || 'Desconocido'],
                      ['Observaciones:', note.observations || 'Sin observaciones']
                    ];
                    
                    facturadoDetails.forEach(([label, value]) => {
                      pdf.setFont('helvetica', 'bold');
                      pdf.text(label, margin, yPos);
                      pdf.setFont('helvetica', 'normal');
                      pdf.text(String(value), margin + 30, yPos);
                      yPos += 6;
                    });
                    
                    yPos += 5;
                    pdf.setFont('helvetica', 'bold');
                    pdf.text('Foto del albarán facturado:', margin, yPos);
                    yPos += 5;
                    
                    const facturadoSignatureHeight = note.signature ? 35 : 0;
                    const facturadoPhotoMaxHeight = pageHeight - yPos - margin - 20 - facturadoSignatureHeight;
                    
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
                      pdf.addImage(base64, imgFormat, margin, yPos, imgWidth, facturadoPhotoMaxHeight, undefined, 'MEDIUM');
                      yPos += facturadoPhotoMaxHeight + 5;
                    } catch (imgError) {
                      pdf.text('(Imagen no disponible)', margin, yPos + 10);
                      yPos += 15;
                    }
                    
                    // Dual signature section (Origin and Destination)
                    const hasOriginSig2 = note.originSignature;
                    const hasDestSig2 = note.destinationSignature;
                    const hasOldSig2 = note.signature && !hasOriginSig2 && !hasDestSig2;
                    
                    if (hasOriginSig2 || hasDestSig2 || hasOldSig2) {
                      pdf.setFont('helvetica', 'bold');
                      pdf.setFontSize(10);
                      pdf.setTextColor(0, 0, 0);
                      pdf.text('Firmas Digitales:', margin, yPos);
                      yPos += 6;
                      
                      const sigWidth2 = 45;
                      const sigHeight2 = 22;
                      const colWidth2 = (pageWidth - margin * 2) / 2;
                      
                      if (hasOriginSig2) {
                        pdf.setFontSize(8);
                        pdf.setFont('helvetica', 'bold');
                        pdf.setTextColor(37, 99, 235);
                        pdf.text('ORIGEN - Entrega:', margin, yPos);
                        pdf.setTextColor(0, 0, 0);
                        pdf.setFont('helvetica', 'normal');
                        pdf.text(`Doc: ${note.originSignatureDocument || 'N/A'}`, margin, yPos + 4);
                        
                        try {
                          let sigBase64 = note.originSignature;
                          if (!sigBase64.startsWith('data:image')) {
                            const sigResponse = await fetch(note.originSignature);
                            const sigBlob = await sigResponse.blob();
                            sigBase64 = await new Promise<string>((resolve) => {
                              const reader = new FileReader();
                              reader.onloadend = () => resolve(reader.result as string);
                              reader.readAsDataURL(sigBlob);
                            });
                          }
                          const sigFormat = sigBase64.includes('data:image/png') ? 'PNG' : 'JPEG';
                          pdf.setFillColor(255, 255, 255);
                          pdf.rect(margin, yPos + 6, sigWidth2 + 4, sigHeight2 + 4, 'F');
                          pdf.setDrawColor(180, 180, 180);
                          pdf.rect(margin, yPos + 6, sigWidth2 + 4, sigHeight2 + 4, 'S');
                          pdf.addImage(sigBase64, sigFormat, margin + 2, yPos + 8, sigWidth2, sigHeight2, undefined, 'MEDIUM');
                        } catch (e) {
                          pdf.text('(Firma no disponible)', margin, yPos + 15);
                        }
                      }
                      
                      if (hasDestSig2) {
                        const xOffset2 = margin + colWidth2;
                        pdf.setFontSize(8);
                        pdf.setFont('helvetica', 'bold');
                        pdf.setTextColor(22, 163, 74);
                        pdf.text('DESTINO - Recibe:', xOffset2, yPos);
                        pdf.setTextColor(0, 0, 0);
                        pdf.setFont('helvetica', 'normal');
                        pdf.text(`Doc: ${note.destinationSignatureDocument || 'N/A'}`, xOffset2, yPos + 4);
                        
                        try {
                          let sigBase64 = note.destinationSignature;
                          if (!sigBase64.startsWith('data:image')) {
                            const sigResponse = await fetch(note.destinationSignature);
                            const sigBlob = await sigResponse.blob();
                            sigBase64 = await new Promise<string>((resolve) => {
                              const reader = new FileReader();
                              reader.onloadend = () => resolve(reader.result as string);
                              reader.readAsDataURL(sigBlob);
                            });
                          }
                          const sigFormat = sigBase64.includes('data:image/png') ? 'PNG' : 'JPEG';
                          pdf.setFillColor(255, 255, 255);
                          pdf.rect(xOffset2, yPos + 6, sigWidth2 + 4, sigHeight2 + 4, 'F');
                          pdf.setDrawColor(180, 180, 180);
                          pdf.rect(xOffset2, yPos + 6, sigWidth2 + 4, sigHeight2 + 4, 'S');
                          pdf.addImage(sigBase64, sigFormat, xOffset2 + 2, yPos + 8, sigWidth2, sigHeight2, undefined, 'MEDIUM');
                        } catch (e) {
                          pdf.text('(Firma no disponible)', xOffset2, yPos + 15);
                        }
                      }
                      
                      if (hasOldSig2) {
                        pdf.setFontSize(8);
                        pdf.setFont('helvetica', 'bold');
                        pdf.text('Firma del cliente:', margin, yPos);
                        try {
                          let sigBase64 = note.signature;
                          if (!sigBase64.startsWith('data:image')) {
                            const sigResponse = await fetch(note.signature);
                            const sigBlob = await sigResponse.blob();
                            sigBase64 = await new Promise<string>((resolve) => {
                              const reader = new FileReader();
                              reader.onloadend = () => resolve(reader.result as string);
                              reader.readAsDataURL(sigBlob);
                            });
                          }
                          const sigFormat = sigBase64.includes('data:image/png') ? 'PNG' : 'JPEG';
                          pdf.setFillColor(255, 255, 255);
                          pdf.rect(margin, yPos + 4, sigWidth2 + 4, sigHeight2 + 4, 'F');
                          pdf.setDrawColor(180, 180, 180);
                          pdf.rect(margin, yPos + 4, sigWidth2 + 4, sigHeight2 + 4, 'S');
                          pdf.addImage(sigBase64, sigFormat, margin + 2, yPos + 6, sigWidth2, sigHeight2, undefined, 'MEDIUM');
                        } catch (e) {
                          pdf.setFont('helvetica', 'normal');
                          pdf.text('(Firma no disponible)', margin, yPos + 10);
                        }
                      }
                    }
                    
                    pdf.setFontSize(8);
                    pdf.setTextColor(128, 128, 128);
                    pdf.text(`Generado el ${new Date().toLocaleDateString('es-ES')} - eAlbarán`, margin, pageHeight - 8);
                  }
                  
                  pdf.save(`albaranes-facturados-${new Date().toISOString().split('T')[0]}.pdf`);
                  toast({ title: "PDF generado", description: `Se descargó el PDF con ${notesWithPhotos.length} albarán(es) facturado(s)` });
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
                  <p className="font-semibold">Albaranes Facturados (PDF)</p>
                  <p className="text-xs text-muted-foreground">{filterNotesByDateRange(invoicedNotes.filter((n: any) => n.photo)).length} albarán(es) con foto</p>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4 px-4"
              disabled={isDownloading || filterNotesByDateRange(pendingDeliveryNotes).length === 0}
              onClick={async () => {
                const filteredPendingNotes = filterNotesByDateRange(pendingDeliveryNotes);
                if (filteredPendingNotes.length === 0) {
                  toast({ title: "Sin albaranes", description: "No hay albaranes pendientes para descargar en el rango seleccionado", variant: "destructive" });
                  return;
                }
                setIsDownloading(true);
                toast({ title: "Generando PDF...", description: `Creando listado de ${filteredPendingNotes.length} albarán(es)` });
                try {
                  const { default: jsPDF } = await import('jspdf');
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
                  
                  for (const note of filteredPendingNotes) {
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
                    const originDisplay = String(formatOrigins(note.pickupOrigins, 1)).trim();
                    pdf.text(truncate(originDisplay, 18), margin + 15, yPos);
                    pdf.text(truncate(note.destination, 18), margin + 55, yPos);
                    pdf.text(truncate(note.clientName, 18), margin + 95, yPos);
                    pdf.text(note.date ? new Date(note.date).toLocaleDateString('es-ES') : '-', margin + 135, yPos);
                    pdf.text(truncate(note.workerName || 'Desconocido', 15), margin + 160, yPos);
                    yPos += 6;
                  }
                  
                  pdf.setFontSize(8);
                  pdf.setTextColor(128, 128, 128);
                  pdf.text(`Total: ${filteredPendingNotes.length} albarán(es) pendiente(s) - Generado el ${new Date().toLocaleDateString('es-ES')}`, margin, pageHeight - 8);
                  
                  pdf.save(`albaranes-pendientes-${new Date().toISOString().split('T')[0]}.pdf`);
                  toast({ title: "PDF generado", description: `Se descargó el listado de ${filteredPendingNotes.length} albarán(es) pendiente(s)` });
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
                  <p className="text-xs text-muted-foreground">{filterNotesByDateRange(pendingDeliveryNotes).length} albarán(es) en listado</p>
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
          setWorkerSearchFilter("");
        }
      }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto overflow-x-hidden w-[95vw] p-4 rounded-lg top-[5vh] translate-y-0">
          <DialogHeader className="pb-4 border-b border-muted-foreground/10">
            <DialogTitle className="text-lg font-semibold">
              Albaranes {albaranesModalType === "pending" ? "Pendientes" : "Firmados"}
              <span className="text-sm text-muted-foreground ml-2">({albaranesCreatorType === "admin" ? "Empresa" : "Trabajadores"})</span>
            </DialogTitle>
          </DialogHeader>
          
          {/* Filtros compactos */}
          <div className="bg-muted/25 rounded-lg p-2 space-y-2 border border-muted-foreground/5">
            {/* Filtro de fechas - inline compacto */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase">
                <Filter className="w-2.5 h-2.5" />
                Fechas
              </div>
              <div className="flex gap-1.5 items-center">
                <Input
                  type="date"
                  value={dateFilterStart}
                  onChange={(e) => setDateFilterStart(e.target.value)}
                  className="h-7 text-xs flex-1"
                  placeholder="Desde"
                  data-testid="input-date-filter-start"
                />
                <Input
                  type="date"
                  value={dateFilterEnd}
                  onChange={(e) => setDateFilterEnd(e.target.value)}
                  className="h-7 text-xs flex-1"
                  placeholder="Hasta"
                  data-testid="input-date-filter-end"
                />
                {(dateFilterStart || dateFilterEnd) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 px-2 flex-shrink-0"
                    onClick={() => { setDateFilterStart(""); setDateFilterEnd(""); }}
                    data-testid="button-clear-date-filter"
                  >
                    <X className="w-3 h-3 text-red-600 dark:text-red-400" />
                  </Button>
                )}
              </div>
            </div>

            {/* Filtro por nombre de trabajador - solo visible en sección Trabajadores */}
            {albaranesCreatorType === "worker" && (
              <>
                <div className="border-t border-muted-foreground/10"></div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase">
                    <Search className="w-2.5 h-2.5" />
                    Trabajador
                  </div>
                  <div className="relative flex gap-1.5">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                    <Input
                      type="text"
                      placeholder="Buscar..."
                      value={workerSearchFilter}
                      onChange={(e) => setWorkerSearchFilter(e.target.value)}
                      className="h-7 text-xs pl-8 flex-1"
                      data-testid="input-worker-search"
                    />
                    {workerSearchFilter && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 px-2 flex-shrink-0"
                        onClick={() => setWorkerSearchFilter("")}
                        data-testid="button-clear-worker-filter"
                      >
                        <X className="w-3 h-3 text-red-600 dark:text-red-400" />
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="space-y-2 overflow-hidden mt-3">
            {(() => {
              let notes: any[] = [];
              if (albaranesCreatorType === "admin") {
                notes = albaranesModalType === "pending" ? empresaPendingNotes : empresaSignedNotes;
              } else {
                notes = albaranesModalType === "pending" ? trabajadoresPendingNotes : trabajadoresSignedNotes;
              }
              
              // Aplicar filtro de búsqueda por trabajador
              if (workerSearchFilter && albaranesCreatorType === "worker") {
                notes = notes.filter((note: any) => 
                  (note.workerName || "").toLowerCase().includes(workerSearchFilter.toLowerCase())
                );
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
                  {workerSearchFilter && albaranesCreatorType === "worker"
                    ? "No hay albaranes de ese trabajador"
                    : (dateFilterStart || dateFilterEnd) 
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
                            <><Banknote className="w-3 h-3 mr-1" /> Facturado</>
                          ) : (
                            <><Clock className="w-3 h-3 mr-1" /> Pendiente cobro</>
                          )}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">{note.clientName || 'Cliente N/A'}</p>
                      <p className="text-xs text-muted-foreground">({note.workerName || 'Trabajador'})</p>
                    </div>

                    <div className="bg-muted/20 rounded-md p-2 space-y-1.5">
                      {note.pickupOrigins && note.pickupOrigins.length > 0 ? (
                        <>
                          <div className="space-y-1">
                            <div className="text-sm">
                              <RouteDisplay origin={note.pickupOrigins[0]} />
                            </div>
                          </div>
                          
                          {note.pickupOrigins.length > 1 && expandedOrigins.has(note.id) && (
                            <div className="space-y-1 pt-1">
                              {note.pickupOrigins.slice(1).map((origin: PickupOrigin, idx: number) => (
                                <div key={idx + 1} className="text-sm">
                                  <RouteDisplay origin={origin} />
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {note.pickupOrigins.length > 1 && (
                            <button
                              onClick={() => toggleExpandedOrigins(note.id)}
                              className="flex items-center gap-1 text-xs text-primary hover:underline"
                              data-testid={`button-toggle-origins-${note.id}`}
                            >
                              {expandedOrigins.has(note.id) ? (
                                <><ChevronUp className="w-3 h-3" /> Ocultar {note.pickupOrigins.length - 1} tramos</>
                              ) : (
                                <><ChevronDown className="w-3 h-3" /> Ver {note.pickupOrigins.length - 1} tramos más</>
                              )}
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Sin ruta definida
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

                    {isFullySigned(note) && note.invoicedAt && (
                      <div className="flex items-start gap-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-md p-2">
                        <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-emerald-700 dark:text-emerald-300">Facturado el</p>
                          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                            {new Date(note.invoicedAt).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Details Dropdown Menu */}
                    <div className="flex gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs"
                            data-testid={`button-details-menu-${note.id}`}
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            Detalles
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {!isFullySigned(note) && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedNoteForSigning(note);
                                setSigningModalOpen(true);
                              }}
                              data-testid={`menu-sign-${note.id}`}
                            >
                              <Pen className="w-3 h-3 mr-2" />
                              Firmar Albarán
                            </DropdownMenuItem>
                          )}

                          {!isFullySigned(note) && !note.departedAt && (
                            <DropdownMenuItem
                              onClick={() => handleArrivalDeparture(note, note.arrivedAt ? 'departure' : 'arrival')}
                              disabled={updateTimeMutation.isPending}
                              data-testid={`menu-${note.arrivedAt ? 'departure' : 'arrival'}-${note.id}`}
                            >
                              <Clock className="w-3 h-3 mr-2" />
                              {note.arrivedAt ? 'He salido' : 'He llegado'}
                            </DropdownMenuItem>
                          )}

                          {isFullySigned(note) && (
                            <DropdownMenuItem
                              onClick={async () => {
                                try {
                                  const filename = `Albaran_${note.noteNumber}_${note.clientName?.replace(/\s+/g, '_') || 'cliente'}.pdf`;
                                  await downloadFile(`/api/delivery-notes/${note.id}/pdf`, filename);
                                } catch (error) {
                                  console.error('Error descargando PDF:', error);
                                  toast({ title: "Error", description: "No se pudo descargar el PDF", variant: "destructive" });
                                }
                              }}
                              data-testid={`menu-download-pdf-${note.id}`}
                            >
                              <Download className="w-3 h-3 mr-2" />
                              Descargar PDF
                            </DropdownMenuItem>
                          )}

                          {note.signedAt && (
                            <DropdownMenuItem
                              onClick={async () => {
                                try {
                                  const response = await apiRequest("PATCH", `/api/delivery-notes/${note.id}`, { isInvoiced: !note.isInvoiced });
                                  if (response.ok) {
                                    toast({ 
                                      title: note.isInvoiced ? "Marcado como pendiente" : "Marcado como facturado",
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
                              data-testid={`menu-toggle-invoice-${note.id}`}
                            >
                              <Banknote className="w-3 h-3 mr-2" />
                              {note.isInvoiced ? 'Marcar como pendiente' : 'Marcar como facturado'}
                            </DropdownMenuItem>
                          )}

                          {isFullySigned(note) && note.isInvoiced && (
                            <DropdownMenuItem
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
                                      const { default: html2canvas } = await import('html2canvas');
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
                              data-testid={`menu-share-${note.id}`}
                            >
                              <Share2 className="w-3 h-3 mr-2" />
                              Compartir
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem
                            onClick={() => deleteNoteMutation.mutate(note.id)}
                            disabled={deletingNoteId === note.id}
                            className="text-red-600 dark:text-red-400"
                            data-testid={`menu-delete-${note.id}`}
                          >
                            <Trash2 className="w-3 h-3 mr-2" />
                            {deletingNoteId === note.id ? "Borrando..." : "Borrar albarán"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-start gap-2 bg-muted/30 rounded-md p-2">
                      <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Observaciones</p>
                        <p className="text-sm line-clamp-2">{note.observations || "Sin observaciones"}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={() => {
                          setEditingObservationsId(note.id);
                          setEditingObservationsText(note.observations || "");
                        }}
                        data-testid={`button-edit-observations-${note.id}`}
                      >
                        <Pen className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

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
                  <X className="w-3 h-3 mr-1 text-red-600" />
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
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Ruta <span className="text-destructive">*</span></label>
              
              {formData.pickupOrigins.map((origin, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                  <div className="flex-1 grid grid-cols-[1fr_auto_1fr] gap-1 items-center">
                    <AutocompleteInput
                      placeholder="De..."
                      value={origin.name}
                      onChange={(value) => {
                        const newOrigins = [...formData.pickupOrigins];
                        newOrigins[index] = { ...newOrigins[index], name: value };
                        setFormData({ ...formData, pickupOrigins: newOrigins });
                      }}
                      suggestions={suggestions.originNames || []}
                      data-testid={`input-route-from-${index}`}
                    />
                    <span className="text-muted-foreground text-sm px-1">→</span>
                    <AutocompleteInput
                      placeholder="A..."
                      value={origin.address}
                      onChange={(value) => {
                        const newOrigins = [...formData.pickupOrigins];
                        newOrigins[index] = { ...newOrigins[index], address: value };
                        setFormData({ ...formData, pickupOrigins: newOrigins });
                      }}
                      suggestions={suggestions.destinations || []}
                      data-testid={`input-route-to-${index}`}
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
                      data-testid={`button-remove-route-${index}`}
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
                data-testid="button-add-route"
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
              <div className={`grid gap-1 ${vehicleTypes.length <= 3 ? 'grid-cols-3' : vehicleTypes.length <= 5 ? 'grid-cols-5' : 'grid-cols-4'}`}>
                {isLoadingVehicles ? (
                  <div className="col-span-full text-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin inline mr-1" />
                    <span className="text-xs">Cargando...</span>
                  </div>
                ) : vehicleTypes.length === 0 ? (
                  <div className="col-span-full flex items-center justify-center gap-2 py-2">
                    <p className="text-xs text-muted-foreground">No hay tipos de vehículos</p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 rounded-full text-xs"
                          data-testid="button-vehicle-help"
                        >
                          ?
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2" side="top">
                        <Link href="/admin/settings" onClick={() => setCreateDeliveryOpen(false)}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            data-testid="button-add-vehicle-type"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Agregar vehículo
                          </Button>
                        </Link>
                      </PopoverContent>
                    </Popover>
                  </div>
                ) : (
                  vehicleTypes.map((tipo) => (
                    <Button
                      key={tipo.id}
                      type="button"
                      variant={formData.vehicleType === tipo.name ? "default" : "outline"}
                      onClick={() => setFormData({ ...formData, vehicleType: tipo.name })}
                      size="sm"
                      className="text-xs px-1"
                      data-testid={`button-vehicle-${tipo.name.toLowerCase()}`}
                    >
                      {tipo.name}
                    </Button>
                  ))
                )}
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
                disabled={!formData.clientName.trim() || !formData.pickupOrigins[0]?.name?.trim() || !formData.pickupOrigins[0]?.address?.trim() || isCreatingDelivery}
                onClick={async () => {
                  if (isCreatingDelivery) return;
                  setIsCreatingDelivery(true);
                  
                  try {
                    const validRoutes = formData.pickupOrigins.filter(o => o.name.trim() !== "" && o.address.trim() !== "");
                    const lastDestination = validRoutes[validRoutes.length - 1]?.address || "";
                    
                    const deliveryNoteData = {
                      quoteId: `custom-${Date.now()}`,
                      workerId: user?.id,
                      clientName: formData.clientName.trim(),
                      pickupOrigins: validRoutes,
                      destination: lastDestination.trim(),
                      vehicleType: formData.vehicleType,
                      date: formData.date,
                      time: formData.time,
                      observations: formData.observations.trim() || null,
                      status: "pending",
                    };

                    const response = await fetch("/api/delivery-notes", {
                      method: "POST",
                      headers: { 
                        "Content-Type": "application/json",
                        ...getAuthHeaders(),
                      },
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
                  } finally {
                    setIsCreatingDelivery(false);
                  }
                }}
                className="flex-1 bg-green-600 hover:bg-green-700"
                data-testid="button-save-albaran"
              >
                {isCreatingDelivery ? "Creando..." : "Crear Albarán"}
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
                  Albaranes Facturados
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
                <X className="w-3 h-3 mr-1 text-red-600" />
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
                      ? "No hay albaranes marcados como facturados"
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
                          {note.isInvoiced ? "Facturado" : "Pendiente"}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-semibold truncate">{note.clientName || 'Cliente N/A'}</p>
                      <p className="text-xs text-muted-foreground">({note.workerName || 'Trabajador'})</p>
                    </div>

                    <div className="bg-muted/20 rounded-md p-2 space-y-1 text-xs">
                      {note.pickupOrigins && note.pickupOrigins.length > 0 ? (
                        <>
                          <div>
                            <RouteDisplay origin={note.pickupOrigins[0]} />
                          </div>
                          
                          {note.pickupOrigins.length > 1 && expandedOrigins.has(note.id) && (
                            <div className="space-y-1 pt-1">
                              {note.pickupOrigins.slice(1).map((origin: PickupOrigin, idx: number) => (
                                <div key={idx + 1}>
                                  <RouteDisplay origin={origin} />
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {note.pickupOrigins.length > 1 && (
                            <button
                              onClick={() => toggleExpandedOrigins(note.id)}
                              className="flex items-center gap-1 text-xs text-primary hover:underline"
                              data-testid={`button-toggle-origins-grid-${note.id}`}
                            >
                              {expandedOrigins.has(note.id) ? (
                                <><ChevronUp className="w-3 h-3" /> Ocultar</>
                              ) : (
                                <><ChevronDown className="w-3 h-3" /> +{note.pickupOrigins.length - 1}</>
                              )}
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="text-muted-foreground">
                          Sin ruta definida
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Fecha</p>
                        <p className="font-medium">{note.date || 'N/A'}</p>
                      </div>
                      {note.waitTime && note.waitTime > 0 && (
                        <div>
                          <p className="text-muted-foreground">T. Espera</p>
                          <p className="font-medium text-amber-600 dark:text-amber-400">{note.waitTime} min</p>
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
                          <p className="text-emerald-700 dark:text-emerald-300">Facturado el</p>
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
                          const response = await apiRequest("PATCH", `/api/delivery-notes/${note.id}`, { isInvoiced: !note.isInvoiced });

                          if (response.ok) {
                            toast({ 
                              title: note.isInvoiced ? "Marcado como pendiente" : "Marcado como facturado",
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
                          <X className="w-3 h-3 mr-1 text-red-600" />
                          Marcar como pendiente
                        </>
                      ) : (
                        <>
                          <Banknote className="w-3 h-3 mr-1" />
                          Marcar como facturado
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
                  <X className="w-4 h-4 text-white" />
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
          
          <Suspense fallback={<div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
            <SignaturePad
              onSave={saveSignature}
              onCancel={() => {
                setCaptureSignatureOpen(false);
                setSelectedNoteForSignature(null);
              }}
            />
          </Suspense>
          
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
      
      {/* Onboarding Tutorial */}
      <Suspense fallback={null}>
        <OnboardingTutorial
          isOpen={showOnboarding}
          onComplete={handleCompleteOnboarding}
          userType="company"
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

      {/* Deleted Notes Modal (Papelera) */}
      <Dialog open={deletedNotesModalOpen} onOpenChange={setDeletedNotesModalOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto overflow-x-hidden w-[95vw] p-3 rounded-lg top-[5vh] translate-y-0">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Papelera ({Array.isArray(deletedNotes) ? deletedNotes.length : 0})
            </DialogTitle>
            <DialogDescription>
              Albaranes borrados. Puedes restaurarlos para recuperarlos.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            {Array.isArray(deletedNotes) && deletedNotes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay albaranes borrados
              </p>
            ) : (
              Array.isArray(deletedNotes) && deletedNotes.map((note: any) => (
                <div key={note.id} className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10 overflow-hidden shadow-sm">
                  <div className="p-3 space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                        Albarán #{note.noteNumber || '—'}
                      </span>
                      <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 no-default-hover-elevate no-default-active-elevate">
                        <Trash2 className="w-3 h-3 mr-1" /> Borrado
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold">{note.clientName || 'Cliente N/A'}</p>
                      <p className="text-xs text-muted-foreground">({note.workerName || 'Trabajador'})</p>
                      
                      {note.pickupOrigins && note.pickupOrigins[0] && (
                        <div className="bg-muted/20 rounded-md p-2">
                          <div className="text-sm">
                            <RouteDisplay origin={note.pickupOrigins[0]} />
                          </div>
                        </div>
                      )}

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

                      {note.deletedAt && (
                        <div className="flex items-start gap-2 bg-red-100 dark:bg-red-900/20 rounded-md p-2">
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-red-700 dark:text-red-300">Borrado el</p>
                            <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                              {new Date(note.deletedAt).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs h-8 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/20"
                        onClick={() => restoreNoteMutation.mutate(note.id)}
                        disabled={restoringNoteId === note.id}
                        data-testid={`button-restore-${note.id}`}
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        {restoringNoteId === note.id ? "Restaurando..." : "Restaurar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs h-8 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => permanentDeleteNoteMutation.mutate(note.id)}
                        disabled={permanentlyDeletingNoteId === note.id}
                        data-testid={`button-permanent-delete-${note.id}`}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        {permanentlyDeletingNoteId === note.id ? "Eliminando..." : "Eliminar"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para editar observaciones */}
      <Dialog open={editingObservationsId !== null} onOpenChange={(open) => {
        if (!open) {
          setEditingObservationsId(null);
          setEditingObservationsText("");
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Observaciones</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Añade observaciones..."
              value={editingObservationsText}
              onChange={(e) => setEditingObservationsText(e.target.value)}
              rows={4}
              className="text-sm"
              data-testid="input-edit-observations"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setEditingObservationsId(null);
                  setEditingObservationsText("");
                }}
                data-testid="button-cancel-edit-observations"
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  if (editingObservationsId) {
                    updateObservationsMutation.mutate({
                      noteId: editingObservationsId,
                      observations: editingObservationsText,
                    });
                  }
                }}
                disabled={updateObservationsMutation.isPending}
                data-testid="button-save-edit-observations"
              >
                {updateObservationsMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
