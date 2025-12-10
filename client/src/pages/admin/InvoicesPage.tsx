import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  FileText, 
  Settings, 
  Plus, 
  Save, 
  Euro,
  Calendar,
  Check,
  Clock,
  XCircle,
  Building2,
  CreditCard,
  Image,
  Truck,
  Download,
  Eye,
  X,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import type { InvoiceTemplate, Invoice, DeliveryNote } from "@shared/schema";

function InvoiceTemplateSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function InvoiceListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface LineItemPrice {
  deliveryNoteId: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface CreateInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CreateInvoiceModal({ open, onOpenChange }: CreateInvoiceModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<"select" | "price" | "review">("select");
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [lineItems, setLineItems] = useState<LineItemPrice[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerTaxId, setCustomerTaxId] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [taxRate, setTaxRate] = useState(21);
  const [paymentDays, setPaymentDays] = useState(30);
  const [includeObservations, setIncludeObservations] = useState(false);

  const { data: deliveryNotes, isLoading: loadingNotes } = useQuery<DeliveryNote[]>({
    queryKey: ["/api/delivery-notes"],
    enabled: open,
  });

  const { data: template } = useQuery<InvoiceTemplate>({
    queryKey: ["/api/invoice-template"],
    enabled: open,
  });

  const signedNotes = deliveryNotes?.filter(
    (note) => note.photo && note.signature && !note.isInvoiced
  ) || [];

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: {
      customerName: string;
      customerAddress?: string;
      customerTaxId?: string;
      customerEmail?: string;
      taxRate: number;
      notes?: string;
      issueDate: string;
      dueDate?: string;
      deliveryNoteIds?: string[];
      lineItems: { deliveryNoteId?: string; description: string; quantity: number; unitPrice: number }[];
    }) => {
      return apiRequest("POST", "/api/invoices", data);
    },
    onSuccess: () => {
      toast({ title: "Factura creada correctamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-notes"] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error al crear factura", 
        description: error.message || "Por favor, inténtalo de nuevo",
        variant: "destructive" 
      });
    },
  });

  const resetForm = () => {
    setStep("select");
    setSelectedNotes([]);
    setLineItems([]);
    setCustomerName("");
    setCustomerAddress("");
    setCustomerTaxId("");
    setCustomerEmail("");
    setNotes("");
    setTaxRate(template?.defaultTaxRate || 21);
    setPaymentDays(30);
    setIncludeObservations(false);
  };

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNotes((prev) =>
      prev.includes(noteId)
        ? prev.filter((id) => id !== noteId)
        : [...prev, noteId]
    );
  };

  const handleProceedToPricing = () => {
    if (selectedNotes.length === 0) {
      toast({ title: "Selecciona al menos un albarán", variant: "destructive" });
      return;
    }
    const selected = signedNotes.filter((note) => selectedNotes.includes(note.id));
    if (selected.length > 0 && !customerName) {
      setCustomerName(selected[0].clientName || "");
    }
    const items: LineItemPrice[] = selected.map((note) => {
      // Format pickup origins
      const pickupOrigins = note.pickupOrigins as { name: string; address: string }[] | null;
      let pickupText = "Sin origen";
      if (pickupOrigins && pickupOrigins.length > 0) {
        pickupText = pickupOrigins
          .map((o) => o.name || o.address || "")
          .filter(Boolean)
          .join(", ");
      }
      
      const destinationText = note.destination || "Sin destino";
      
      // Build description with optional observations
      let description = `Albarán #${note.noteNumber} | Recogida: ${pickupText} | Entrega: ${destinationText}`;
      if (note.vehicleType) {
        description += ` | Vehículo: ${note.vehicleType}`;
      }
      if (includeObservations && note.observations) {
        description += ` | Obs: ${note.observations}`;
      }
      
      return {
        deliveryNoteId: note.id,
        description,
        quantity: 1,
        unitPrice: 0,
      };
    });
    setLineItems(items);
    setStep("price");
  };

  const handleProceedToReview = () => {
    const hasEmptyPrices = lineItems.some((item) => item.unitPrice <= 0);
    if (hasEmptyPrices) {
      toast({ title: "Por favor, introduce el precio para todos los conceptos", variant: "destructive" });
      return;
    }
    if (!customerName.trim()) {
      toast({ title: "El nombre del cliente es obligatorio", variant: "destructive" });
      return;
    }
    setStep("review");
  };

  const handleCreateInvoice = () => {
    const dueDate = addDays(new Date(), paymentDays).toISOString();
    const deliveryNoteIds = lineItems
      .map((item) => item.deliveryNoteId)
      .filter((id): id is string => !!id);
    createInvoiceMutation.mutate({
      customerName,
      customerAddress,
      customerTaxId,
      customerEmail,
      taxRate,
      notes,
      issueDate: new Date().toISOString(),
      dueDate,
      deliveryNoteIds,
      lineItems: lineItems.map((item) => ({
        deliveryNoteId: item.deliveryNoteId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    });
  };

  const updateLineItemPrice = (index: number, price: number) => {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, unitPrice: price } : item))
    );
  };

  const updateLineItemDescription = (index: number, description: string) => {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, description } : item))
    );
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Crear Factura
          </DialogTitle>
          <DialogDescription>
            {step === "select" && "Selecciona los albaranes firmados para incluir en la factura"}
            {step === "price" && "Añade los precios para cada concepto"}
            {step === "review" && "Revisa los datos antes de crear la factura"}
          </DialogDescription>
        </DialogHeader>

        {step === "select" && (
          <div className="space-y-4">
            {loadingNotes ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : signedNotes.length === 0 ? (
              <div className="text-center p-8">
                <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No hay albaranes firmados disponibles para facturar
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                  {signedNotes.map((note) => (
                    <Card
                      key={note.id}
                      className={`cursor-pointer transition-colors ${
                        selectedNotes.includes(note.id) 
                          ? "ring-2 ring-primary" 
                          : "hover-elevate"
                      }`}
                      onClick={() => toggleNoteSelection(note.id)}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        <Checkbox
                          checked={selectedNotes.includes(note.id)}
                          onCheckedChange={() => toggleNoteSelection(note.id)}
                          data-testid={`checkbox-note-${note.id}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Albarán #{note.noteNumber}</span>
                            <Badge variant="default" className="bg-green-500">
                              <Check className="h-3 w-3 mr-1" />
                              Firmado
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {note.clientName} - {note.destination}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {note.date && format(new Date(note.date), "d MMM yyyy", { locale: es })}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="includeObservations"
                      checked={includeObservations}
                      onCheckedChange={(checked) => setIncludeObservations(checked === true)}
                      data-testid="checkbox-include-observations"
                    />
                    <Label htmlFor="includeObservations" className="cursor-pointer text-sm">
                      Incluir observaciones de los albaranes en la descripción
                    </Label>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {step === "price" && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Datos del Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="customerName">Nombre/Razón Social *</Label>
                    <Input
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Empresa Cliente S.L."
                      data-testid="input-customer-name"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="customerTaxId">CIF/NIF</Label>
                    <Input
                      id="customerTaxId"
                      value={customerTaxId}
                      onChange={(e) => setCustomerTaxId(e.target.value)}
                      placeholder="B12345678"
                      data-testid="input-customer-tax-id"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <Label htmlFor="customerAddress">Dirección</Label>
                    <Input
                      id="customerAddress"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Calle Principal 123, 28001 Madrid"
                      data-testid="input-customer-address"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <Label htmlFor="customerEmail">Email</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="cliente@empresa.es"
                      data-testid="input-customer-email"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Conceptos a Facturar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {lineItems.map((item, index) => (
                  <div key={item.deliveryNoteId} className="p-3 bg-muted/50 rounded-lg space-y-2">
                    <div className="space-y-1">
                      <Label>Descripción</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateLineItemDescription(index, e.target.value)}
                        data-testid={`input-description-${index}`}
                      />
                    </div>
                    <div className="flex gap-3 items-end">
                      <div className="flex-1 space-y-1">
                        <Label>Precio unitario (sin IVA)</Label>
                        <div className="relative">
                          <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice || ""}
                            onChange={(e) => updateLineItemPrice(index, parseFloat(e.target.value) || 0)}
                            className="pl-9"
                            placeholder="0.00"
                            data-testid={`input-price-${index}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Configuración</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>IVA (%)</Label>
                    <Select value={taxRate.toString()} onValueChange={(v) => setTaxRate(parseInt(v))}>
                      <SelectTrigger data-testid="select-tax-rate">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0% (Exento)</SelectItem>
                        <SelectItem value="4">4% (Superreducido)</SelectItem>
                        <SelectItem value="10">10% (Reducido)</SelectItem>
                        <SelectItem value="21">21% (General)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Vencimiento</Label>
                    <Select value={paymentDays.toString()} onValueChange={(v) => setPaymentDays(parseInt(v))}>
                      <SelectTrigger data-testid="select-payment-days">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Al contado</SelectItem>
                        <SelectItem value="15">15 días</SelectItem>
                        <SelectItem value="30">30 días</SelectItem>
                        <SelectItem value="60">60 días</SelectItem>
                        <SelectItem value="90">90 días</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Notas adicionales</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Observaciones o notas para la factura..."
                    rows={2}
                    data-testid="input-notes"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Resumen de la Factura</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{customerName}</p>
                  {customerTaxId && <p className="text-sm text-muted-foreground">{customerTaxId}</p>}
                  {customerAddress && <p className="text-sm text-muted-foreground">{customerAddress}</p>}
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Conceptos</p>
                  {lineItems.map((item, index) => (
                    <div key={index} className="flex justify-between py-2 border-b last:border-b-0">
                      <span className="text-sm">{item.description}</span>
                      <span className="font-medium">{item.unitPrice.toFixed(2)} €</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{subtotal.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>IVA ({taxRate}%)</span>
                    <span>{taxAmount.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between font-medium text-lg pt-2 border-t">
                    <span>Total</span>
                    <span>{total.toFixed(2)} €</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    Fecha de vencimiento: {format(addDays(new Date(), paymentDays), "d MMMM yyyy", { locale: es })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {step !== "select" && (
            <Button
              variant="outline"
              onClick={() => setStep(step === "review" ? "price" : "select")}
              data-testid="button-back"
            >
              Atrás
            </Button>
          )}
          {step === "select" && (
            <Button 
              onClick={handleProceedToPricing} 
              disabled={selectedNotes.length === 0}
              data-testid="button-next-pricing"
            >
              Continuar ({selectedNotes.length} seleccionados)
            </Button>
          )}
          {step === "price" && (
            <Button 
              onClick={handleProceedToReview}
              data-testid="button-next-review"
            >
              Revisar Factura
            </Button>
          )}
          {step === "review" && (
            <Button 
              onClick={handleCreateInvoice}
              disabled={createInvoiceMutation.isPending}
              data-testid="button-create-invoice"
            >
              {createInvoiceMutation.isPending ? "Creando..." : "Crear Factura"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TemplateEditor() {
  const { toast } = useToast();
  
  const { data: template, isLoading } = useQuery<InvoiceTemplate>({
    queryKey: ["/api/invoice-template"],
  });

  const [formData, setFormData] = useState<Partial<InvoiceTemplate>>({});

  const updateField = (field: keyof InvoiceTemplate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const saveTemplateMutation = useMutation({
    mutationFn: async (data: Partial<InvoiceTemplate>) => {
      return apiRequest("POST", "/api/invoice-template", data);
    },
    onSuccess: () => {
      toast({ title: "Plantilla guardada correctamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/invoice-template"] });
    },
    onError: () => {
      toast({ title: "Error al guardar plantilla", variant: "destructive" });
    },
  });

  const handleSave = () => {
    const dataToSave = { ...template, ...formData };
    saveTemplateMutation.mutate(dataToSave);
  };

  const getValue = (field: keyof InvoiceTemplate) => {
    if (field in formData) return formData[field] ?? "";
    return template?.[field] ?? "";
  };

  if (isLoading) {
    return <InvoiceTemplateSkeleton />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Datos de la Empresa
          </CardTitle>
          <CardDescription>
            Información que aparecerá en el encabezado de las facturas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nombre de la Empresa</Label>
              <Input
                id="companyName"
                placeholder="Mi Empresa S.L."
                value={getValue("companyName") as string}
                onChange={(e) => updateField("companyName", e.target.value)}
                data-testid="input-company-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyTaxId">CIF/NIF</Label>
              <Input
                id="companyTaxId"
                placeholder="B12345678"
                value={getValue("companyTaxId") as string}
                onChange={(e) => updateField("companyTaxId", e.target.value)}
                data-testid="input-company-tax-id"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="companyAddress">Dirección</Label>
              <Input
                id="companyAddress"
                placeholder="Calle Principal 123"
                value={getValue("companyAddress") as string}
                onChange={(e) => updateField("companyAddress", e.target.value)}
                data-testid="input-company-address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyCity">Ciudad</Label>
              <Input
                id="companyCity"
                placeholder="Madrid"
                value={getValue("companyCity") as string}
                onChange={(e) => updateField("companyCity", e.target.value)}
                data-testid="input-company-city"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyPostalCode">Código Postal</Label>
              <Input
                id="companyPostalCode"
                placeholder="28001"
                value={getValue("companyPostalCode") as string}
                onChange={(e) => updateField("companyPostalCode", e.target.value)}
                data-testid="input-company-postal-code"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyPhone">Teléfono</Label>
              <Input
                id="companyPhone"
                placeholder="+34 912 345 678"
                value={getValue("companyPhone") as string}
                onChange={(e) => updateField("companyPhone", e.target.value)}
                data-testid="input-company-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyEmail">Email</Label>
              <Input
                id="companyEmail"
                type="email"
                placeholder="facturacion@miempresa.es"
                value={getValue("companyEmail") as string}
                onChange={(e) => updateField("companyEmail", e.target.value)}
                data-testid="input-company-email"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Logo de la Empresa
          </CardTitle>
          <CardDescription>
            Sube una imagen de tu logo (PNG, JPEG, etc. - máximo 500KB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logoFile">Seleccionar Logo</Label>
              <Input
                id="logoFile"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 500 * 1024) {
                      toast({
                        title: "Error",
                        description: "La imagen no puede superar 500KB",
                        variant: "destructive",
                      });
                      e.target.value = "";
                      return;
                    }
                    if (!file.type.startsWith("image/")) {
                      toast({
                        title: "Error",
                        description: "Solo se permiten archivos de imagen",
                        variant: "destructive",
                      });
                      e.target.value = "";
                      return;
                    }
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      updateField("logoImageBase64", reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                data-testid="input-logo-file"
              />
            </div>
            {getValue("logoImageBase64") && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center justify-between gap-4">
                  <img
                    src={getValue("logoImageBase64") as string}
                    alt="Vista previa del logo"
                    className="max-h-20 object-contain"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateField("logoImageBase64", "")}
                    data-testid="button-remove-logo"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Eliminar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Datos Bancarios
          </CardTitle>
          <CardDescription>
            Información bancaria para el pago de facturas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Nombre del Banco</Label>
              <Input
                id="bankName"
                placeholder="Banco Santander"
                value={getValue("bankName") as string}
                onChange={(e) => updateField("bankName", e.target.value)}
                data-testid="input-bank-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankSwift">Código SWIFT/BIC</Label>
              <Input
                id="bankSwift"
                placeholder="BSCHESMMXXX"
                value={getValue("bankSwift") as string}
                onChange={(e) => updateField("bankSwift", e.target.value)}
                data-testid="input-bank-swift"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="bankIban">IBAN</Label>
              <Input
                id="bankIban"
                placeholder="ES12 1234 5678 1234 5678 9012"
                value={getValue("bankIban") as string}
                onChange={(e) => updateField("bankIban", e.target.value)}
                data-testid="input-bank-iban"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5" />
            Configuración de Facturación
          </CardTitle>
          <CardDescription>
            Valores por defecto para nuevas facturas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultTaxRate">IVA por defecto (%)</Label>
              <Input
                id="defaultTaxRate"
                type="number"
                min="0"
                max="100"
                value={getValue("defaultTaxRate") as number}
                onChange={(e) => updateField("defaultTaxRate", parseInt(e.target.value) || 21)}
                data-testid="input-default-tax-rate"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultPaymentTerms">Condiciones de Pago</Label>
              <Input
                id="defaultPaymentTerms"
                placeholder="Pago a 30 días"
                value={getValue("defaultPaymentTerms") as string}
                onChange={(e) => updateField("defaultPaymentTerms", e.target.value)}
                data-testid="input-default-payment-terms"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="footerText">Texto del pie de factura</Label>
              <Textarea
                id="footerText"
                placeholder="Gracias por confiar en nosotros. Esta factura es válida como justificante de pago."
                value={getValue("footerText") as string}
                onChange={(e) => updateField("footerText", e.target.value)}
                rows={3}
                data-testid="input-footer-text"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saveTemplateMutation.isPending}
          data-testid="button-save-template"
        >
          <Save className="h-4 w-4 mr-2" />
          {saveTemplateMutation.isPending ? "Guardando..." : "Guardar Plantilla"}
        </Button>
      </div>
    </div>
  );
}

function getStatusBadge(status: string) {
  switch (status) {
    case "paid":
      return <Badge variant="default" className="bg-green-500"><Check className="h-3 w-3 mr-1" />Pagada</Badge>;
    case "pending":
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
    case "overdue":
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Vencida</Badge>;
    case "cancelled":
      return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" />Cancelada</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function InvoiceList() {
  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  if (isLoading) {
    return <InvoiceListSkeleton />;
  }

  if (!invoices || invoices.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No hay facturas</h3>
          <p className="text-muted-foreground mb-4">
            Crea tu primera factura desde un albarán firmado
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {invoices.map((invoice) => (
        <Card key={invoice.id} className="hover-elevate">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Factura #{invoice.invoiceNumber}</span>
                  {getStatusBadge(invoice.status || 'draft')}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {invoice.customerName}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {invoice.issueDate && format(new Date(invoice.issueDate), "d MMM yyyy", { locale: es })}
                  </span>
                  {invoice.dueDate && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Vence: {format(new Date(invoice.dueDate), "d MMM yyyy", { locale: es })}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-lg font-semibold flex items-center gap-1 justify-end">
                    <Euro className="h-4 w-4" />
                    {(invoice.total / 100).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    IVA incl.
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`/api/invoices/${invoice.id}/pdf`, '_blank');
                  }}
                  data-testid={`button-download-pdf-${invoice.id}`}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function InvoicesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="container max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Facturas
          </h1>
          <p className="text-muted-foreground">
            Gestiona tus facturas y configura tu plantilla
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          data-testid="button-create-invoice"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Factura
        </Button>
      </div>

      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices" data-testid="tab-invoices">
            <FileText className="h-4 w-4 mr-2" />
            Facturas
          </TabsTrigger>
          <TabsTrigger value="template" data-testid="tab-template">
            <Settings className="h-4 w-4 mr-2" />
            Plantilla
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <InvoiceList />
        </TabsContent>

        <TabsContent value="template" className="space-y-4">
          <TemplateEditor />
        </TabsContent>
      </Tabs>

      <CreateInvoiceModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </div>
  );
}
