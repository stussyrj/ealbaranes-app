import { useState } from "react";
import { Truck, MapPin, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

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
              className="w-full gap-3 bg-blue-900 hover:bg-blue-950 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-6 py-3 rounded-lg"
              onClick={() => handleLogin("Google")}
              disabled={isLoading}
              data-testid="button-login-google"
            >
              <GoogleIcon className="h-5 w-5" />
              Continuar con Google
            </Button>
            <Button
              className="w-full gap-3 bg-blue-900 hover:bg-blue-950 dark:bg-blue-700 dark:hover:bg-blue-800 text-white px-6 py-3 rounded-lg"
              onClick={() => handleLogin("GitHub")}
              disabled={isLoading}
              data-testid="button-login-github"
            >
              <GithubIcon className="h-5 w-5" />
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
