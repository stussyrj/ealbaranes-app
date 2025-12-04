import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, User, Lock, Mail, Building2, Loader2, CheckCircle, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { refetchUser } = useAuth();
  const { toast } = useToast();
  
  const [verificationPending, setVerificationPending] = useState<{email: string; message: string} | null>(null);
  
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
  });
  
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const registerMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/register", {
        username: data.username,
        email: data.email,
        password: data.password,
        companyName: data.companyName,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al registrar");
      }
      return response.json();
    },
    onSuccess: async (data) => {
      if (data.requiresVerification) {
        setVerificationPending({
          email: data.email,
          message: data.message,
        });
      } else {
        await refetchUser();
        toast({
          title: "Cuenta creada",
          description: "Tu cuenta ha sido creada exitosamente. Bienvenido a eAlbarán!",
        });
        setLocation("/");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptedTerms) {
      toast({
        title: "Error",
        description: "Debes aceptar los términos y condiciones para continuar",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (verificationPending) {
    return (
      <div className="min-h-screen flex">
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-background overflow-y-auto">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl" data-testid="text-verification-title">Verifica tu Email</CardTitle>
              <CardDescription className="text-base">
                {verificationPending.message}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Hemos enviado un enlace de verificación a:</p>
                <p className="font-medium" data-testid="text-verification-email">{verificationPending.email}</p>
              </div>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Por favor, revisa tu bandeja de entrada (y la carpeta de spam) y haz click en el enlace para activar tu cuenta.</p>
                <p>El enlace expira en 24 horas.</p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => resendMutation.mutate(verificationPending.email)}
                disabled={resendMutation.isPending}
                data-testid="button-resend-verification"
              >
                {resendMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reenviar email de verificación
                  </>
                )}
              </Button>
              <Link href="/login" className="w-full">
                <Button variant="ghost" className="w-full" data-testid="link-go-to-login">
                  Ir a Iniciar Sesión
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>

        <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-8">
          <div className="max-w-md text-center text-primary-foreground">
            <div className="mx-auto mb-8 h-20 w-20 rounded-full bg-primary-foreground/10 flex items-center justify-center">
              <CheckCircle className="h-10 w-10" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Casi listo</h1>
            <p className="text-lg opacity-90 mb-6">
              Solo falta un paso para empezar a usar eAlbarán
            </p>
            <div className="space-y-3 text-left bg-primary-foreground/10 rounded-lg p-4">
              <p className="text-sm">
                <strong>Paso 1:</strong> Revisa tu email
              </p>
              <p className="text-sm">
                <strong>Paso 2:</strong> Haz click en el enlace de verificación
              </p>
              <p className="text-sm">
                <strong>Paso 3:</strong> Inicia sesión y empieza a trabajar
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-background overflow-y-auto">
        <Card className="w-full max-w-md mx-auto my-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Crear Cuenta de Empresa</CardTitle>
            <CardDescription>
              Registra tu empresa para gestionar presupuestos y albaranes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nombre de la Empresa</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="companyName"
                    name="companyName"
                    type="text"
                    placeholder="Mi Empresa de Transportes"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="pl-10"
                    data-testid="input-company-name"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    data-testid="input-email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Nombre de Usuario</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="admin"
                    value={formData.username}
                    onChange={handleChange}
                    className="pl-10"
                    data-testid="input-username"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10"
                    data-testid="input-password"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Repite tu contraseña"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10"
                    data-testid="input-confirm-password"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={registerMutation.isPending}
                data-testid="button-register"
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creando cuenta...
                  </>
                ) : (
                  "Crear Cuenta"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground text-center">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-primary hover:underline" data-testid="link-login">
                Iniciar Sesión
              </Link>
            </p>
            <p className="text-xs text-muted-foreground text-center">
              Al registrarte, aceptas nuestros términos de servicio y política de privacidad.
            </p>
          </CardFooter>
        </Card>
      </div>

      <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-8">
        <div className="max-w-md text-center text-primary-foreground">
          <div className="mx-auto mb-8 h-20 w-20 rounded-full bg-primary-foreground/10 flex items-center justify-center">
            <Truck className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold mb-4">eAlbarán</h1>
          <p className="text-lg opacity-90 mb-6">
            Sistema profesional de gestión de albaranes digitales de transporte
          </p>
          <div className="space-y-3 text-left bg-primary-foreground/10 rounded-lg p-4">
            <p className="text-sm">
              <strong>Albaranes digitales:</strong> Crea albaranes con fotos y firmas electrónicas
            </p>
            <p className="text-sm">
              <strong>Control total:</strong> Supervisa todos los albaranes de tu empresa
            </p>
            <p className="text-sm">
              <strong>Gestión de equipo:</strong> Crea trabajadores y asigna servicios
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
