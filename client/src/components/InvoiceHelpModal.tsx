import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Settings, 
  Plus, 
  FileText, 
  Download, 
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Building2,
  CreditCard,
  Image
} from "lucide-react";

interface HelpStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  details: string[];
}

const helpSteps: HelpStep[] = [
  {
    title: "Configurar Plantilla",
    description: "Personaliza los datos de tu empresa en las facturas",
    icon: <Settings className="w-16 h-16 text-primary" />,
    details: [
      "📝 Pestaña 'Plantilla' - Rellena el nombre de empresa",
      "🏢 Datos Fiscales: CIF/NIF, dirección, teléfono",
      "💳 Información Bancaria: IBAN, referencia banco",
      "🖼️ Logo: Sube tu logo (aparecerá en todas las facturas)"
    ]
  },
  {
    title: "Crear Factura",
    description: "Selecciona albaranes firmados para facturar",
    icon: <Plus className="w-16 h-16 text-primary" />,
    details: [
      "✅ Solo puedes facturar albaranes que tengan FOTO + FIRMA",
      "☑️ Marca los albaranes que quieres incluir",
      "👤 Se propone automáticamente el nombre del cliente",
      "📋 Elige incluir observaciones en la factura"
    ]
  },
  {
    title: "Rellenar Conceptos y Precios",
    description: "Define qué se cobra en cada línea",
    icon: <CreditCard className="w-16 h-16 text-primary" />,
    details: [
      "🚚 Cada albarán = una línea de factura automática",
      "💰 Ingresa el precio para cada servicio (obligatorio)",
      "➕ Añade líneas opcionales: recargos, gastos, retrasos",
      "📊 Sistema calcula automáticamente subtotal, IVA y total"
    ]
  },
  {
    title: "Revisar y Descargar",
    description: "Genera la factura en PDF y gestiona el pago",
    icon: <Download className="w-16 h-16 text-primary" />,
    details: [
      "👁️ Revisa los datos del cliente y direcciones",
      "📄 Vista previa del PDF antes de descargar",
      "💾 Descarga PDF profesional con tu logo y datos",
      "🔄 Puedes cambiar estado: Pendiente → Pagada → Cancelada"
    ]
  },
  {
    title: "Gestionar Facturas",
    description: "Controla el estado de pagos y descargas",
    icon: <FileText className="w-16 h-16 text-primary" />,
    details: [
      "📋 Pestaña 'Mis Facturas' - ve todas tus facturas",
      "🔍 Busca por número, cliente o rango de fechas",
      "💾 Descarga cualquier factura en PDF en cualquier momento",
      "✏️ Actualiza el estado cuando recibas el pago"
    ]
  }
];

interface InvoiceHelpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceHelpModal({ open, onOpenChange }: InvoiceHelpModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = helpSteps[currentStep];

  const handleNext = () => {
    if (currentStep < helpSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onOpenChange(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="modal-invoice-help">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            {step.icon}
          </div>
          <DialogTitle className="text-xl text-center">{step.title}</DialogTitle>
          <DialogDescription className="text-center text-base">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {step.details.map((detail, index) => (
            <div key={index} className="flex items-start gap-3 bg-muted/30 rounded-lg p-3">
              <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-sm">{detail}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-1">
            {helpSteps.map((_, index) => (
              <div 
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
          
          <div className="flex gap-2">
            {currentStep === 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-muted-foreground"
                data-testid="button-close-help"
              >
                Cerrar
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                data-testid="button-previous-help-step"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
            )}
            
            <Button
              onClick={handleNext}
              size="sm"
              data-testid="button-next-help-step"
            >
              {currentStep === helpSteps.length - 1 ? (
                <>
                  Listo
                  <CheckCircle className="w-4 h-4 ml-1" />
                </>
              ) : (
                <>
                  Siguiente
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
