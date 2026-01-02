import { useState, useRef, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Eraser, MapPin, Navigation, FileText, User, Camera, Save } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SignatureModalDialog } from "@/components/SignatureModalDialog";
import type { DeliveryNote } from "@shared/schema";

// TEMPORARY: Disable signature drawing functionality
// Set to false to re-enable digital signatures
const SIGNATURE_DRAWING_DISABLED = true;


interface DeliveryNoteSigningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: DeliveryNote | null;
}

export function DeliveryNoteSigningModal({ open, onOpenChange, note }: DeliveryNoteSigningModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("origin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingOrigin, setIsSavingOrigin] = useState(false);
  
  const [originSignature, setOriginSignature] = useState("");
  const [originDocument, setOriginDocument] = useState("");
  const [hasOriginSignature, setHasOriginSignature] = useState(false);
  const [originAlreadySaved, setOriginAlreadySaved] = useState(false);
  const [originWasModified, setOriginWasModified] = useState(false);
  
  const [destinationSignature, setDestinationSignature] = useState("");
  const [destinationDocument, setDestinationDocument] = useState("");
  const [hasDestinationSignature, setHasDestinationSignature] = useState(false);
  
  // Signature modal
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signatureModalType, setSignatureModalType] = useState<"origin" | "destination">("origin");
  
  // Photo for destination only
  const [destinationPhoto, setDestinationPhoto] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing data when note changes
  useEffect(() => {
    if (note && open) {
      // Load origin signature if exists
      if (note.originSignature) {
        setOriginSignature(note.originSignature);
        setHasOriginSignature(true);
        setOriginAlreadySaved(true);
      }
      if (note.originSignatureDocument) {
        setOriginDocument(note.originSignatureDocument);
      }
      // If origin is already signed, go to destination tab
      if (note.originSignature && note.originSignatureDocument) {
        setActiveTab("destination");
      }
      // Load destination signature if exists (including legacy signature field)
      if (note.destinationSignature) {
        setDestinationSignature(note.destinationSignature);
        setHasDestinationSignature(true);
      } else if (note.signature) {
        // Legacy: map old signature field to destination signature
        setDestinationSignature(note.signature);
        setHasDestinationSignature(true);
      }
      if (note.destinationSignatureDocument) {
        setDestinationDocument(note.destinationSignatureDocument);
      }
      // Load photo if exists - keep it for display
      if (note.photo) {
        setDestinationPhoto(note.photo);
      }
    }
  }, [note, open]);

  const handleOriginSignatureChange = useCallback((hasSig: boolean, dataUrl: string, isInitialLoad?: boolean) => {
    setHasOriginSignature(hasSig);
    setOriginSignature(dataUrl);
    if (!isInitialLoad) {
      setOriginWasModified(true);
      setOriginAlreadySaved(false);
    }
  }, []);

  const handleDestinationSignatureChange = useCallback((hasSig: boolean, dataUrl: string) => {
    setHasDestinationSignature(hasSig);
    setDestinationSignature(dataUrl);
  }, []);

  const handleOriginDocumentChange = useCallback((value: string) => {
    setOriginDocument(value);
    setOriginWasModified(true);
    setOriginAlreadySaved(false);
  }, []);

  const handleSignatureModalConfirm = useCallback((signature: string) => {
    console.log("Signature confirmed:", signatureModalType, signature.length);
    if (signatureModalType === "origin") {
      setOriginSignature(signature);
      setHasOriginSignature(true);
      setOriginWasModified(true);
      setOriginAlreadySaved(false);
    } else {
      setDestinationSignature(signature);
      setHasDestinationSignature(true);
    }
    setSignatureModalOpen(false);
  }, [signatureModalType]);

  // Origin: Solo el documento es obligatorio ahora
  const hasOriginDocument = originDocument.trim().length >= 8;
  const isOriginComplete = hasOriginDocument;
  
  // Destination: Solo el documento y la foto son obligatorios ahora
  const hasDestinationDocument = destinationDocument.trim().length >= 8;
  
  // Photo is required - either we have one in state or on the server
  const hasValidPhoto = destinationPhoto.length > 100 || (note?.photo && note.photo.length > 100);
  // Legacy notes are still considered complete
  const isLegacyComplete = !!(note?.signature && note?.photo && !note?.originSignature);
  // Destination is complete when we have document + photo
  const isDestinationComplete = hasDestinationDocument && hasValidPhoto;
  // Form is complete for submission: both parts complete OR legacy
  const isFormComplete = (isOriginComplete && isDestinationComplete) || isLegacyComplete;

  const resetForm = () => {
    setOriginSignature("");
    setOriginDocument("");
    setHasOriginSignature(false);
    setOriginAlreadySaved(false);
    setOriginWasModified(false);
    setDestinationSignature("");
    setDestinationDocument("");
    setHasDestinationSignature(false);
    setDestinationPhoto("");
    setActiveTab("origin");
    setIsSubmitting(false);
    setIsSavingOrigin(false);
  };

  // Save only origin signature (partial save)
  const handleSaveOrigin = async () => {
    if (!note) {
      console.error("Missing note data");
      return;
    }

    // Validate document exists
    if (!hasOriginDocument) {
      toast({
        title: "Información incompleta",
        description: "Falta el DNI/NIE/NIF del firmante",
        variant: "destructive",
      });
      return;
    }

    const documentTrimmed = originDocument.trim().toUpperCase();
    if (documentTrimmed.length < 8) {
      toast({
        title: "Documento inválido",
        description: "El documento debe tener al menos 8 caracteres",
        variant: "destructive",
      });
      return;
    }

    setIsSavingOrigin(true);

    const payload: Record<string, any> = {
      originSignature,
      originSignatureDocument: documentTrimmed,
      originSignedAt: new Date().toISOString(),
    };

    try {
      // Wait for the save to complete before switching tabs
      await apiRequest("PATCH", `/api/delivery-notes/${note.id}`, payload);
      
      // Only switch tabs and show success after confirmed save
      setOriginAlreadySaved(true);
      setOriginWasModified(false);
      
      toast({
        title: "Firma de origen guardada",
        description: "La firma de origen se guardó correctamente",
      });
      
      // Switch to destination tab after successful save
      setActiveTab("destination");
      
      // Invalidate queries in background
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-notes"] });
      if (note.workerId) {
        queryClient.invalidateQueries({ queryKey: ["/api/workers", note.workerId, "delivery-notes"] });
      }
    } catch (error) {
      console.error("Error saving origin signature:", error);
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar la firma de origen. Intenta de nuevo.",
        variant: "destructive",
      });
      // Don't change tabs on error
    } finally {
      setIsSavingOrigin(false);
    }
  };

  // Handle photo capture for destination
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setDestinationPhoto(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!note) {
      console.error("Missing note data");
      return;
    }

    // Validate what's missing before submit
    if (!isFormComplete) {
      if (!hasOriginDocument) {
        alert("Falta información de origen:\n- DNI/NIE/NIF: Falta");
        return;
      }
      if (!hasDestinationDocument) {
        alert("Falta información de destino:\n- DNI/NIE/NIF: Falta");
        return;
      }
      if (!hasValidPhoto) {
        alert("Falta la foto de entrega. Por favor captura una foto.");
        return;
      }
      console.error("Missing required fields");
      return;
    }

    setIsSubmitting(true);

    // Build payload preserving existing data - only send fields that have values
    const payload: Record<string, any> = {};
    
    // Legacy notes already signed - just close the modal without changes
    if (isLegacyComplete && !isDestinationComplete) {
      // No changes needed for legacy signed notes
      setIsSubmitting(false);
      resetForm();
      onOpenChange(false);
      return;
    }
    
    // Set status to signed only when destination is complete (full dual signature)
    // AND we have a photo (either new or existing on server)
    const photoExists = (destinationPhoto.length > 100) || (note?.photo && note.photo.length > 100);
    if (isDestinationComplete && photoExists) {
      payload.status = "signed";
    }
    
    // Origin signature - only update if we have new data or it wasn't already saved
    if (originSignature && originDocument.trim().length >= 8) {
      payload.originSignature = originSignature;
      payload.originSignatureDocument = originDocument.trim().toUpperCase();
      // Only set originSignedAt if not already set
      if (!note.originSignedAt) {
        payload.originSignedAt = new Date().toISOString();
      }
    }
    
    // Destination signature - only send if we have both signature and document
    if (destinationSignature && destinationDocument.trim().length >= 8) {
      payload.destinationSignature = destinationSignature;
      payload.destinationSignatureDocument = destinationDocument.trim().toUpperCase();
      payload.destinationSignedAt = new Date().toISOString();
      // Also set legacy signature field for compatibility
      payload.signature = destinationSignature;
    }
    
    // Photo - only update if we have a new photo (destinationPhoto has actual data and is different from existing)
    if (destinationPhoto && destinationPhoto.length > 100 && destinationPhoto !== note.photo) {
      payload.photo = destinationPhoto;
    }

    // If no changes to send, just close
    if (Object.keys(payload).length === 0) {
      resetForm();
      onOpenChange(false);
      return;
    }

    // Close modal immediately for fast UX
    resetForm();
    onOpenChange(false);

    // Save in background without blocking UI
    apiRequest("PATCH", `/api/delivery-notes/${note.id}`, payload)
      .then(() => {
        // Invalidate queries in background without await
        queryClient.invalidateQueries({ queryKey: ["/api/delivery-notes"] });
        if (note.workerId) {
          queryClient.invalidateQueries({ queryKey: ["/api/workers", note.workerId, "delivery-notes"] });
        }
      })
      .catch((error) => {
        console.error("Error signing delivery note:", error);
      });
  };

  const getFirstOriginName = () => {
    if (note?.pickupOrigins && Array.isArray(note.pickupOrigins) && note.pickupOrigins.length > 0) {
      const first = note.pickupOrigins[0];
      if (typeof first === 'object' && first !== null) {
        return (first as { name?: string; address?: string }).name || (first as { name?: string; address?: string }).address || 'N/A';
      }
    }
    return 'N/A';
  };

  const hasUnsavedOrigin = isOriginComplete && originWasModified;
  
  const handleClose = (isOpen: boolean) => {
    if (!isOpen && hasUnsavedOrigin) {
      if (window.confirm("ATENCION: Tienes una firma de origen sin guardar.\n\n¿Estás seguro de que quieres cerrar? Se perderán los datos.")) {
        resetForm();
        onOpenChange(false);
      }
    } else {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Firmar Albarán #{note?.noteNumber}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {note && (
            <div className="bg-muted/30 rounded-lg p-3 space-y-1.5 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-muted-foreground text-xs">Origen</span>
                  <p className="font-medium truncate">{getFirstOriginName()}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Navigation className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-muted-foreground text-xs">Destino</span>
                  <p className="font-medium truncate">{note.destination || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-muted-foreground/10">
                <span>Cliente: {note.clientName || 'N/A'}</span>
              </div>
            </div>
          )}

          {/* Legacy signed notes: Read-only view - no form needed */}
          {isLegacyComplete && note && (
            <div className="space-y-4">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-4 text-green-700 dark:text-green-300">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Albarán completamente firmado</span>
                </div>
                <p className="text-sm opacity-80">Este albarán fue firmado con el sistema anterior (foto + firma digital) y no requiere acciones adicionales.</p>
              </div>
              
              {/* Show existing signature */}
              {note.signature && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Firma digital</Label>
                  <div className="border rounded-lg overflow-hidden bg-white">
                    <img 
                      src={note.signature} 
                      alt="Firma" 
                      className="w-full h-24 object-contain"
                    />
                  </div>
                </div>
              )}
              
              {/* Show existing photo */}
              {note.photo && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Foto de entrega</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <img 
                      src={note.photo} 
                      alt="Foto de entrega" 
                      className="w-full h-32 object-cover"
                    />
                  </div>
                </div>
              )}
              
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full"
                data-testid="button-close-legacy"
              >
                Cerrar
              </Button>
            </div>
          )}

          {/* New dual signature form - only show for non-legacy notes */}
          {!isLegacyComplete && (
            <div className="space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="origin" className="relative" data-testid="tab-sign-origin">
                    <MapPin className="w-3.5 h-3.5 mr-1.5" />
                    Origen
                    {isOriginComplete && (
                      <Check className="w-3.5 h-3.5 text-green-500 ml-1.5" />
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="destination" className="relative" data-testid="tab-sign-destination">
                    <Navigation className="w-3.5 h-3.5 mr-1.5" />
                    Destino
                    {isDestinationComplete && (
                      <Check className="w-3.5 h-3.5 text-green-500 ml-1.5" />
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="pt-2">
                <p className="text-xs text-muted-foreground italic text-center">
                  Nota: Ya no se requiere firma digital, solo el documento DNI/NIE/NIF.
                </p>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsContent value="origin" className="space-y-3 mt-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
                <User className="w-4 h-4 inline mr-1.5" />
                Firma de la persona que <strong>entrega</strong> el material en origen
              </div>
              
              {originAlreadySaved && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Firma de origen ya guardada
                </div>
              )}
              
              <div className="space-y-2 w-2/5">
                <Label htmlFor="sign-origin-document">DNI / NIE / NIF del firmante</Label>
                <Input
                  id="sign-origin-document"
                  placeholder="Ej: 12345678A"
                  value={originDocument}
                  onChange={(e) => handleOriginDocumentChange(e.target.value)}
                  className="uppercase"
                  maxLength={15}
                  data-testid="input-sign-origin-document"
                />
                {originDocument.length > 0 && originDocument.length < 8 && (
                  <p className="text-xs text-amber-600">Mínimo 8 caracteres</p>
                )}
              </div>

              {!SIGNATURE_DRAWING_DISABLED && (
                !hasOriginSignature ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-24"
                    onClick={() => {
                      setSignatureModalType("origin");
                      setSignatureModalOpen(true);
                    }}
                    data-testid="button-capture-origin-signature"
                  >
                    <Camera className="w-6 h-6 mr-2" />
                    Capturar firma de origen
                  </Button>
                ) : (
                  <div className="space-y-1">
                    <div className="relative border-3 border-blue-500 dark:border-blue-400 rounded-lg overflow-hidden bg-white h-12 w-24 flex items-center justify-center cursor-pointer hover:shadow-lg transition-shadow" 
                      onClick={() => {
                        setSignatureModalType("origin");
                        setSignatureModalOpen(true);
                      }}>
                      <img 
                        src={originSignature} 
                        alt="Firma de origen" 
                        className="w-full h-full object-contain p-0.5"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors">
                        <Camera className="w-4 h-4 text-blue-500 opacity-0 hover:opacity-100" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center leading-tight">Cambiar</p>
                  </div>
                )
              )}

              <div className="flex gap-2">
                {isOriginComplete && (
                  <Button 
                    variant="default" 
                    className="flex-1"
                    onClick={async () => {
                      if (!originAlreadySaved) {
                        await handleSaveOrigin();
                      } else {
                        setActiveTab("destination");
                      }
                    }}
                    disabled={isSavingOrigin}
                    data-testid="button-next-to-destination"
                  >
                    {isSavingOrigin ? (
                      <>
                        <Save className="w-4 h-4 mr-2 animate-pulse" />
                        Guardando firma...
                      </>
                    ) : (
                      <>
                        {!originAlreadySaved && <Save className="w-4 h-4 mr-2" />}
                        Guardar y Continuar a Destino
                        <Navigation className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="destination" className="space-y-3 mt-3">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-sm text-green-700 dark:text-green-300">
                <User className="w-4 h-4 inline mr-1.5" />
                Firma de la persona que <strong>recibe</strong> el material en destino
              </div>
              
              <div className="space-y-2 w-2/5">
                <Label htmlFor="sign-destination-document">DNI / NIE / NIF del firmante</Label>
                <Input
                  id="sign-destination-document"
                  placeholder="Ej: 12345678A"
                  value={destinationDocument}
                  onChange={(e) => setDestinationDocument(e.target.value)}
                  className="uppercase"
                  maxLength={15}
                  data-testid="input-sign-destination-document"
                />
                {destinationDocument.length > 0 && destinationDocument.length < 8 && (
                  <p className="text-xs text-amber-600">Mínimo 8 caracteres</p>
                )}
              </div>

              {!SIGNATURE_DRAWING_DISABLED && (
                !hasDestinationSignature ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-24"
                    onClick={() => {
                      setSignatureModalType("destination");
                      setSignatureModalOpen(true);
                    }}
                    data-testid="button-capture-destination-signature"
                  >
                    <Camera className="w-6 h-6 mr-2" />
                    Capturar firma de destino
                  </Button>
                ) : (
                  <div className="space-y-1">
                    <div className="relative border-3 border-green-500 dark:border-green-400 rounded-lg overflow-hidden bg-white h-12 w-24 flex items-center justify-center cursor-pointer hover:shadow-lg transition-shadow" 
                      onClick={() => {
                        setSignatureModalType("destination");
                        setSignatureModalOpen(true);
                      }}>
                      <img 
                        src={destinationSignature} 
                        alt="Firma de destino" 
                        className="w-full h-full object-contain p-0.5"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors">
                        <Camera className="w-4 h-4 text-green-500 opacity-0 hover:opacity-100" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center leading-tight">Cambiar</p>
                  </div>
                )
              )}

              {/* Photo capture for destination only */}
              <div className="space-y-2">
                <Label>Foto de entrega {note?.photo ? "(existente)" : "(obligatoria)"}</Label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handlePhotoCapture}
                  className="hidden"
                  data-testid="input-destination-photo"
                />
                {destinationPhoto ? (
                  <div className="relative">
                    <img 
                      src={destinationPhoto} 
                      alt="Foto de entrega" 
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    {note?.photo && destinationPhoto === note.photo && (
                      <div className="absolute bottom-2 left-2 bg-green-600/90 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Foto guardada
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="button-change-photo"
                    >
                      <Camera className="w-4 h-4 mr-1" />
                      Cambiar
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-24 border-dashed"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="button-take-photo"
                  >
                    <Camera className="w-6 h-6 mr-2" />
                    Añadir foto (cámara o galería)
                  </Button>
                )}
              </div>
              </TabsContent>
              </Tabs>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => handleClose(false)}
                  className="flex-1"
                  disabled={isSubmitting}
                  data-testid="button-cancel-signing"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!isFormComplete || isSubmitting}
                  className="flex-1 bg-green-600/85 hover:bg-green-700/85 dark:bg-green-600/85 dark:hover:bg-green-700/85 text-white backdrop-blur-sm border border-green-500/40"
                  data-testid="button-confirm-signing"
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  {isSubmitting ? "Firmando..." : "Firmar Albarán"}
                </Button>
              </div>

              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  {isOriginComplete ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40" />
                  )}
                  Origen
                </div>
                <div className="flex items-center gap-1.5">
                  {isDestinationComplete ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40" />
                  )}
                  Destino + Foto
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      <SignatureModalDialog
        open={signatureModalOpen}
        onOpenChange={setSignatureModalOpen}
        onConfirm={handleSignatureModalConfirm}
        initialSignature={signatureModalType === "origin" ? originSignature : destinationSignature}
        title={signatureModalType === "origin" ? "Capturar firma de origen" : "Capturar firma de destino"}
      />
    </Dialog>
  );
}
