import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AnimatedPageBackground } from "@/components/AnimatedPageBackground";
import { 
  Truck, 
  FileText, 
  Camera, 
  PenTool, 
  Users, 
  Shield, 
  Smartphone,
  Clock,
  Download,
  CheckCircle,
  ArrowRight
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Albaranes Digitales",
    description: "Crea albaranes profesionales en segundos desde cualquier dispositivo"
  },
  {
    icon: Camera,
    title: "Fotos de Entrega",
    description: "Adjunta fotos como prueba de entrega directamente desde el móvil"
  },
  {
    icon: PenTool,
    title: "Firma Digital",
    description: "Recoge firmas electrónicas del cliente en el momento de la entrega"
  },
  {
    icon: Users,
    title: "Gestión de Equipo",
    description: "Crea trabajadores y supervisa todos los albaranes de tu empresa"
  },
  {
    icon: Shield,
    title: "Datos Seguros",
    description: "Tus datos están protegidos y accesibles solo para tu empresa"
  },
  {
    icon: Download,
    title: "Exporta Fácilmente",
    description: "Descarga albaranes firmados en PDF o exporta datos a CSV"
  }
];

const benefits = [
  "Sin papel, sin pérdidas de documentos",
  "Acceso desde cualquier dispositivo",
  "Control total de tu flota",
  "Facturación más rápida"
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedPageBackground />
      
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <Truck className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">eAlbarán</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <ThemeToggle />
              <Link href="/login">
                <Button variant="ghost" size="sm" data-testid="link-header-login">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/register" className="hidden sm:block">
                <Button size="sm" data-testid="link-header-register">
                  Registrarse
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="pt-24 pb-16 sm:pt-32 sm:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Smartphone className="h-4 w-4" />
                Disponible en móvil y escritorio
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Gestión de Albaranes
                <span className="text-primary block">100% Digital</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Digitaliza los albaranes de tu empresa de transporte. Tus trabajadores crean albaranes con fotos y firmas desde el móvil, y tú lo controlas todo desde tu panel.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto gap-2" data-testid="button-hero-register">
                    Empezar Gratis
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto" data-testid="button-hero-pricing">
                    Ver Precios
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Prueba gratuita de 14 días. Sin tarjeta de crédito.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Todo lo que necesitas
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Una solución completa para digitalizar la gestión de albaranes de transporte
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="hover-elevate transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                  Simplifica tu trabajo diario
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Olvídate del papeleo. Con eAlbarán, tus trabajadores crean albaranes digitales en segundos y tú tienes control total sobre toda la información.
                </p>
                <ul className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-4 sm:p-6 border border-primary/20">
                  <div className="bg-card rounded-lg shadow-lg overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-border">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">Albarán #0127</p>
                            <p className="text-xs text-muted-foreground">01/12/2024 - 14:30</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium">
                            <Camera className="h-3 w-3" /> Foto
                          </span>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium">
                            <PenTool className="h-3 w-3" /> Firmado
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 sm:p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">Cliente</p>
                          <p className="text-foreground font-medium">Mudanzas Express S.L.</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">Vehículo</p>
                          <p className="text-foreground font-medium">Furgón</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">Origen</p>
                          <p className="text-foreground font-medium">C/ Gran Vía 45, Madrid</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">Destino</p>
                          <p className="text-foreground font-medium">Av. Diagonal 230, Barcelona</p>
                        </div>
                      </div>
                      
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-muted-foreground text-xs mb-1">Observaciones</p>
                        <p className="text-foreground text-sm">Mercancía frágil. Entregar en mano al responsable de almacén.</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-muted-foreground text-xs mb-2">Foto de entrega</p>
                          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden border border-border">
                            <div className="text-center p-3">
                              <Camera className="h-8 w-8 text-muted-foreground/50 mx-auto mb-1" />
                              <p className="text-xs text-muted-foreground">Foto adjunta</p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-2">Firma del cliente</p>
                          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden border border-border">
                            <svg viewBox="0 0 200 80" className="w-full h-full p-2">
                              <path 
                                d="M 20 50 Q 40 20 60 50 T 100 50 Q 120 30 140 50 T 180 40" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                className="text-foreground"
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground">Trabajador: José Martínez</p>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium">
                          <CheckCircle className="h-3 w-3" /> Completado
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Cómo funciona
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Registra tu empresa</h3>
                <p className="text-muted-foreground">
                  Crea tu cuenta de empresa y configura tu equipo de trabajadores
                </p>
              </div>
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Crea albaranes</h3>
                <p className="text-muted-foreground">
                  Tus trabajadores crean albaranes digitales con fotos y firmas
                </p>
              </div>
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Gestiona todo</h3>
                <p className="text-muted-foreground">
                  Supervisa, factura y descarga todos los albaranes desde tu panel
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-8 sm:p-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
                Empieza a digitalizar hoy
              </h2>
              <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
                Únete a las empresas que ya gestionan sus albaranes de forma digital. Configura tu cuenta en menos de 5 minutos.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto gap-2" data-testid="button-cta-register">
                    Crear Cuenta Gratis
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" data-testid="button-cta-pricing">
                    Ver Planes y Precios
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-background py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Truck className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">eAlbarán</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 eAlbarán. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
