import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, User, Mail, Building2, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import logoImage from "@assets/83168E40-AC3E-46AD-81C7-83386F999799_1764880592366.png";
import { AnimatedPageBackground } from "@/components/AnimatedPageBackground";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const { user, login, isLoginPending, loginError, clearLoginError } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Empresa form
  const [empresaEmail, setEmpresaEmail] = useState("");
  const [empresaPassword, setEmpresaPassword] = useState("");
  
  // Trabajador form
  const [trabajadorUsername, setTrabajadorUsername] = useState("");
  const [trabajadorPassword, setTrabajadorPassword] = useState("");

  const resendMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/resend-verification", { email });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al reenviar");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email enviado",
        description: "Si el email está registrado, recibirás un nuevo enlace de verificación.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleEmpresaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearLoginError();
    login(empresaEmail, empresaPassword);
  };

  const handleTrabajadorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearLoginError();
    login(trabajadorUsername, trabajadorPassword);
  };

  const handleResendVerification = () => {
    if (empresaEmail) {
      resendMutation.mutate(empresaEmail);
    }
  };

  return (
    <div className="min-h-screen flex relative bg-background">
      <AnimatedPageBackground />
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative z-10 overflow-y-auto">
        <div className="w-full max-w-md mx-auto my-4 rounded-lg border border-border/50 bg-card/95 dark:bg-card/90 backdrop-blur-sm shadow-lg">
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
                    <div className="flex items-center justify-between">
                      <Label htmlFor="empresa-password" className="text-foreground">Contraseña</Label>
                      <Link href="/forgot-password">
                        <span className="text-xs text-primary hover:underline cursor-pointer" data-testid="link-forgot-password">
                          ¿Olvidaste tu contraseña?
                        </span>
                      </Link>
                    </div>
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
                  {loginError?.code === "EMAIL_NOT_VERIFIED" && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4" data-testid="alert-email-not-verified">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                            Email no verificado
                          </p>
                          <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                            {loginError.message}
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleResendVerification}
                            disabled={resendMutation.isPending || !empresaEmail}
                            className="gap-2"
                            data-testid="button-resend-verification"
                          >
                            {resendMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Enviando...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4" />
                                Reenviar email de verificación
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

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
          <div className="mx-auto mb-8">
            <img 
              src={logoImage} 
              alt="eAlbarán Logo" 
              className="h-20 w-20 rounded-2xl object-cover mx-auto"
            />
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
