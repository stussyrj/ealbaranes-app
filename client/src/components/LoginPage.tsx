import { useState } from "react";
import { Truck, MapPin, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiGoogle, SiGithub } from "react-icons/si";

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (provider: string) => {
    setIsLoading(true);
    console.log(`Login with ${provider} triggered`);
    // todo: remove mock functionality - implement actual OAuth login
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 1000);
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary" />
        <div className="relative z-10 flex flex-col justify-center p-12 text-primary-foreground">
          <div className="flex items-center gap-3 mb-8">
            <Truck className="h-12 w-12" />
            <h1 className="text-4xl font-semibold">TransQuote</h1>
          </div>
          <h2 className="text-3xl font-semibold mb-6">
            Sistema Profesional de Presupuestos de Transporte
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-foreground/20 rounded-lg">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-medium text-lg">Cálculo Automático de Distancias</h3>
                <p className="text-primary-foreground/80">
                  Integración con OpenRouteService para rutas precisas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-foreground/20 rounded-lg">
                <Calculator className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-medium text-lg">Reglas de Precios Personalizadas</h3>
                <p className="text-primary-foreground/80">
                  Configure tarifas por km, zonas y tipos de vehículo
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4 lg:hidden">
              <Truck className="h-8 w-8 text-primary" />
              <span className="text-2xl font-semibold">TransQuote</span>
            </div>
            <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
            <CardDescription>
              Accede a tu cuenta para gestionar presupuestos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full gap-3"
              onClick={() => handleLogin("Google")}
              disabled={isLoading}
              data-testid="button-login-google"
            >
              <SiGoogle className="h-5 w-5" />
              Continuar con Google
            </Button>
            <Button
              variant="outline"
              className="w-full gap-3"
              onClick={() => handleLogin("GitHub")}
              disabled={isLoading}
              data-testid="button-login-github"
            >
              <SiGithub className="h-5 w-5" />
              Continuar con GitHub
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Powered by Replit Auth
                </span>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Al iniciar sesión, aceptas nuestros términos de servicio y política de privacidad.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
