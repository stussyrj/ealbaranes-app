import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Users, 
  Download, 
  MessageSquare, 
  Camera, 
  Pen, 
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Truck,
  Euro
} from "lucide-react";

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  details: string[];
}

const companySteps: OnboardingStep[] = [
  {
    title: "Bienvenido a eAlbarán",
    description: "Tu herramienta para gestionar albaranes de transporte digitales",
    icon: <Truck className="w-16 h-16 text-primary" />,
    details: [
      "Gestiona todos los albaranes de tu empresa",
      "Supervisa el trabajo de tus trabajadores",
      "Descarga informes en PDF",
      "Recibe notificaciones en tiempo real"
    ]
  },
  {
    title: "Panel Principal",
    description: "Visualiza el estado de todos tus albaranes",
    icon: <FileText className="w-16 h-16 text-primary" />,
    details: [
      "Ve los albaranes pendientes y firmados",
      "Filtra por fechas para buscar albaranes específicos",
      "Marca albaranes como facturados",
      "Descarga albaranes en formato PDF"
    ]
  },
  {
    title: "Gestión de Trabajadores",
    description: "Crea y administra a tu equipo",
    icon: <Users className="w-16 h-16 text-primary" />,
    details: [
      "Añade nuevos trabajadores con nombre, email y contraseña",
      "Cada trabajador puede crear albaranes con tu cuenta",
      "Los albaranes se asignan automáticamente al trabajador",
      "Puedes desactivar trabajadores cuando sea necesario"
    ]
  },
  {
    title: "Sistema de Mensajes",
    description: "Mantente informado de la actividad",
    icon: <MessageSquare className="w-16 h-16 text-primary" />,
    details: [
      "Recibe notificaciones cuando se crean albaranes",
      "Alerta cuando un trabajador firma un albarán",
      "Revisa el historial de actividad",
      "Los mensajes no leídos se muestran en el menú"
    ]
  },
  {
    title: "Descargar Albaranes",
    description: "Exporta tus datos fácilmente",
    icon: <Download className="w-16 h-16 text-primary" />,
    details: [
      "Descarga albaranes firmados en PDF con foto y firma",
      "Exporta albaranes facturados por separado",
      "Genera listados de albaranes pendientes",
      "Cada PDF incluye todos los datos del albarán"
    ]
  },
  {
    title: "Sistema de Facturación",
    description: "Convierte albaranes en facturas profesionales",
    icon: <Euro className="w-16 h-16 text-primary" />,
    details: [
      "Configura tu plantilla de factura con logo y datos",
      "Selecciona albaranes firmados para facturar",
      "Añade líneas de artículos para servicios adicionales",
      "Genera PDFs profesionales y gestiona estados de pago"
    ]
  }
];

const workerSteps: OnboardingStep[] = [
  {
    title: "Bienvenido a eAlbarán",
    description: "Tu aplicación para crear albaranes digitales",
    icon: <Truck className="w-16 h-16 text-primary" />,
    details: [
      "Crea albaranes digitales de forma rápida",
      "Firma albaranes con foto y firma digital",
      "Consulta tus albaranes en cualquier momento",
      "Todo queda registrado automáticamente"
    ]
  },
  {
    title: "Crear Albarán",
    description: "Registra un nuevo servicio de transporte",
    icon: <FileText className="w-16 h-16 text-primary" />,
    details: [
      "Pulsa 'Crear Albarán' para empezar",
      "Añade el nombre del cliente",
      "Indica los puntos de recogida y entrega",
      "Selecciona el tipo de vehículo y añade observaciones"
    ]
  },
  {
    title: "Añadir Fotografía",
    description: "Documenta el servicio con una foto",
    icon: <Camera className="w-16 h-16 text-primary" />,
    details: [
      "Usa la cámara de tu móvil para tomar una foto",
      "La foto puede ser del documento físico o la mercancía",
      "Las fotos se comprimen automáticamente",
      "Se requiere foto para marcar el albarán como firmado"
    ]
  },
  {
    title: "Firma Digital",
    description: "El cliente firma directamente en la pantalla",
    icon: <Pen className="w-16 h-16 text-primary" />,
    details: [
      "El cliente firma con el dedo en tu dispositivo",
      "La firma se guarda de forma segura",
      "Puede borrar y repetir si es necesario",
      "Se requiere firma para completar el albarán"
    ]
  },
  {
    title: "Albarán Completado",
    description: "Cuando tiene foto Y firma está listo",
    icon: <CheckCircle className="w-16 h-16 text-green-500" />,
    details: [
      "Un albarán está 'Firmado' solo cuando tiene AMBOS",
      "La foto documenta el servicio",
      "La firma confirma la recepción",
      "Tu empresa recibe una notificación automática"
    ]
  }
];

interface OnboardingTutorialProps {
  isOpen: boolean;
  onComplete: () => void;
  userType: "company" | "worker";
}

export function OnboardingTutorial({ isOpen, onComplete, userType }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = userType === "company" ? companySteps : workerSteps;
  const step = steps[currentStep];

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg" hideCloseButton onInteractOutside={(e) => e.preventDefault()}>
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
            {steps.map((_, index) => (
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
                onClick={handleSkip}
                className="text-muted-foreground"
                data-testid="button-skip-tutorial"
              >
                Saltar
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                data-testid="button-previous-step"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
            )}
            
            <Button
              onClick={handleNext}
              size="sm"
              data-testid="button-next-step"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  Empezar
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
