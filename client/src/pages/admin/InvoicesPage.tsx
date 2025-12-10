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
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { InvoiceTemplate, Invoice } from "@shared/schema";

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
            URL de la imagen del logo (opcional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="logoUrl">URL del Logo</Label>
            <Input
              id="logoUrl"
              placeholder="https://miempresa.es/logo.png"
              value={getValue("logoUrl") as string}
              onChange={(e) => updateField("logoUrl", e.target.value)}
              data-testid="input-logo-url"
            />
            {getValue("logoUrl") && (
              <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                <img
                  src={getValue("logoUrl") as string}
                  alt="Vista previa del logo"
                  className="max-h-20 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
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
              <div className="text-right">
                <p className="text-lg font-semibold flex items-center gap-1 justify-end">
                  <Euro className="h-4 w-4" />
                  {(invoice.total / 100).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  IVA incl.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function InvoicesPage() {
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
    </div>
  );
}
