import { useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AnimatedPageBackground } from "@/components/AnimatedPageBackground";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@assets/83168E40-AC3E-46AD-81C7-83386F999799_1764880592366.png";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/forgot-password", { email });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al procesar la solicitud");
      }
      return response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
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
    if (email.trim()) {
      forgotPasswordMutation.mutate(email.trim());
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
            <div className="mx-auto mb-4">
              <img 
                src={logoImage} 
                alt="eAlbarán Logo" 
                className="h-12 w-12 rounded-lg object-cover"
              />
            </div>
            <h2 className="text-2xl font-semibold leading-none tracking-tight text-foreground">
              {submitted ? "Revisa tu correo" : "Recuperar Contraseña"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {submitted 
                ? "Si el email está registrado, recibirás un enlace para restablecer tu contraseña."
                : "Introduce tu email y te enviaremos un enlace para restablecer tu contraseña."
              }
            </p>
          </div>
          
          <div className="p-6 pt-0">
            {submitted ? (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    El enlace de recuperación expira en <strong>1 hora</strong>.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Si no recibes el email, revisa tu carpeta de spam.
                  </p>
                </div>
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
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      data-testid="input-forgot-email"
                      required
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={forgotPasswordMutation.isPending}
                  data-testid="button-forgot-submit"
                >
                  {forgotPasswordMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar enlace de recuperación"
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
              Si no recuerdas tu contraseña, no te preocupes. Te enviaremos un enlace seguro a tu email para que puedas crear una nueva.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
