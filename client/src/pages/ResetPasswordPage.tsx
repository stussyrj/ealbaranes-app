import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, ArrowLeft, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AnimatedPageBackground } from "@/components/AnimatedPageBackground";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@assets/83168E40-AC3E-46AD-81C7-83386F999799_1764880592366.png";

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const token = searchParams.get("token");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);
  const { toast } = useToast();

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { token: string; password: string }) => {
      const response = await apiRequest("POST", "/api/reset-password", data);
      const result = await response.json();
      if (!response.ok) {
        if (result.expired) {
          setTokenExpired(true);
        }
        throw new Error(result.error || "Error al restablecer la contraseña");
      }
      return result;
    },
    onSuccess: () => {
      setSuccess(true);
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
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }
    
    if (password.length < 8) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 8 caracteres",
        variant: "destructive",
      });
      return;
    }
    
    if (token) {
      resetPasswordMutation.mutate({ token, password });
    }
  };

  useEffect(() => {
    if (!token) {
      setTokenExpired(true);
    }
  }, [token]);

  return (
    <div className="min-h-screen flex relative bg-background">
      <AnimatedPageBackground />
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative z-10 overflow-y-auto">
        <div className="w-full max-w-md mx-auto my-4 rounded-lg border border-border/50 bg-card/95 dark:bg-card/90 backdrop-blur-sm shadow-lg">
          <div className="flex flex-col space-y-1.5 p-6 text-center">
            <div className="mx-auto mb-4">
              <img 
                src={logoImage} 
                alt="eAlbarán Logo" 
                className="h-12 w-12 rounded-lg object-cover"
              />
            </div>
            <h2 className="text-2xl font-semibold leading-none tracking-tight text-foreground">
              {success ? "Contraseña Actualizada" : tokenExpired ? "Enlace Expirado" : "Nueva Contraseña"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {success 
                ? "Tu contraseña ha sido actualizada correctamente."
                : tokenExpired
                ? "El enlace de recuperación ha expirado o no es válido."
                : "Introduce tu nueva contraseña."
              }
            </p>
          </div>
          
          <div className="p-6 pt-0">
            {success ? (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <Link href="/login">
                  <Button className="w-full gap-2" data-testid="button-go-to-login">
                    Iniciar Sesión
                  </Button>
                </Link>
              </div>
            ) : tokenExpired ? (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Los enlaces de recuperación expiran después de 1 hora por seguridad.
                  </p>
                </div>
                <Link href="/forgot-password">
                  <Button className="w-full" data-testid="button-request-new-link">
                    Solicitar nuevo enlace
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="w-full gap-2" data-testid="link-back-to-login">
                    <ArrowLeft className="h-4 w-4" />
                    Volver a Iniciar Sesión
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">Nueva Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      data-testid="input-new-password"
                      required
                      minLength={8}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-foreground">Confirmar Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Repite tu contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      data-testid="input-confirm-password"
                      required
                      minLength={8}
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={resetPasswordMutation.isPending}
                  data-testid="button-reset-submit"
                >
                  {resetPasswordMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    "Actualizar Contraseña"
                  )}
                </Button>
                
                <div className="text-center pt-4 border-t border-border/50">
                  <Link href="/login">
                    <Button variant="ghost" className="gap-2" data-testid="link-back-to-login-2">
                      <ArrowLeft className="h-4 w-4" />
                      Volver a Iniciar Sesión
                    </Button>
                  </Link>
                </div>
              </form>
            )}
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
          <div className="bg-primary-foreground/10 rounded-lg p-4">
            <p className="text-sm opacity-90">
              Elige una contraseña segura de al menos 8 caracteres. Recomendamos usar una combinación de letras, números y símbolos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
