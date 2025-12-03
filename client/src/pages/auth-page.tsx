import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, Lock, User, Mail, Building2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AnimatedPageBackground } from "@/components/AnimatedPageBackground";

export default function AuthPage() {
  const { user, login, isLoginPending } = useAuth();
  const [, setLocation] = useLocation();
  
  // Empresa form
  const [empresaEmail, setEmpresaEmail] = useState("");
  const [empresaPassword, setEmpresaPassword] = useState("");
  
  // Trabajador form
  const [trabajadorUsername, setTrabajadorUsername] = useState("");
  const [trabajadorPassword, setTrabajadorPassword] = useState("");

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleEmpresaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(empresaEmail, empresaPassword);
  };

  const handleTrabajadorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(trabajadorUsername, trabajadorPassword);
  };

  return (
    <div className="min-h-screen flex relative bg-background">
      <AnimatedPageBackground />
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md rounded-lg border border-border/50 bg-card/95 dark:bg-card/90 backdrop-blur-sm shadow-lg">
          <div className="flex flex-col space-y-1.5 p-6 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold leading-none tracking-tight text-foreground">Iniciar Sesión</h2>
            <p className="text-sm text-muted-foreground">
              Selecciona tu tipo de cuenta para acceder
            </p>
          </div>
          
          <div className="p-6 pt-0">
            <Tabs defaultValue="empresa" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="empresa" className="gap-2" data-testid="tab-empresa">
                  <Building2 className="h-4 w-4" />
                  Soy Empresa
                </TabsTrigger>
                <TabsTrigger value="trabajador" className="gap-2" data-testid="tab-trabajador">
                  <User className="h-4 w-4" />
                  Soy Trabajador
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="empresa">
                <form onSubmit={handleEmpresaSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="empresa-email" className="text-foreground">Email o Usuario</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="empresa-email"
                        type="text"
                        placeholder="tu@email.com o tu usuario"
                        value={empresaEmail}
                        onChange={(e) => setEmpresaEmail(e.target.value)}
                        className="pl-10"
                        data-testid="input-empresa-email"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="empresa-password" className="text-foreground">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="empresa-password"
                        type="password"
                        placeholder="Tu contraseña"
                        value={empresaPassword}
                        onChange={(e) => setEmpresaPassword(e.target.value)}
                        className="pl-10"
                        data-testid="input-empresa-password"
                        required
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoginPending}
                    data-testid="button-empresa-login"
                  >
                    {isLoginPending ? "Iniciando..." : "Iniciar Sesión"}
                  </Button>
                  
                  <div className="text-center pt-4 border-t border-border/50">
                    <p className="text-sm text-muted-foreground mb-2">
                      ¿No tienes cuenta de empresa?
                    </p>
                    <Link href="/register">
                      <Button variant="outline" className="w-full gap-2" data-testid="link-register">
                        <Building2 className="h-4 w-4" />
                        Registrar mi Empresa
                      </Button>
                    </Link>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="trabajador">
                <form onSubmit={handleTrabajadorSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="trabajador-username" className="text-foreground">Usuario</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="trabajador-username"
                        type="text"
                        placeholder="Tu nombre de usuario"
                        value={trabajadorUsername}
                        onChange={(e) => setTrabajadorUsername(e.target.value)}
                        className="pl-10"
                        data-testid="input-trabajador-username"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trabajador-password" className="text-foreground">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="trabajador-password"
                        type="password"
                        placeholder="Tu contraseña"
                        value={trabajadorPassword}
                        onChange={(e) => setTrabajadorPassword(e.target.value)}
                        className="pl-10"
                        data-testid="input-trabajador-password"
                        required
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoginPending}
                    data-testid="button-trabajador-login"
                  >
                    {isLoginPending ? "Iniciando..." : "Iniciar Sesión"}
                  </Button>
                  
                  <div className="text-center pt-4 border-t border-border/50">
                    <p className="text-sm text-muted-foreground">
                      Las cuentas de trabajador son creadas por tu empresa.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Contacta con tu empresa si no tienes acceso.
                    </p>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-primary relative z-10 items-center justify-center p-8">
        <div className="max-w-md text-center text-primary-foreground">
          <div className="mx-auto mb-8 h-20 w-20 rounded-full bg-primary-foreground/10 flex items-center justify-center">
            <Truck className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold mb-4">eAlbarán</h1>
          <p className="text-lg opacity-90 mb-6">
            Sistema de gestión de albaranes digitales de transporte
          </p>
          <div className="space-y-3 text-left bg-primary-foreground/10 rounded-lg p-4">
            <p className="text-sm">
              <strong>Empresas:</strong> Supervisa albaranes, gestiona trabajadores y controla tu negocio
            </p>
            <p className="text-sm">
              <strong>Trabajadores:</strong> Crea albaranes digitales con fotos y firmas electrónicas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
