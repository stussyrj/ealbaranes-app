import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, CheckCircle, XCircle, Loader2, Mail, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type VerificationState = "loading" | "success" | "error" | "expired";

export default function VerifyEmailPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get("token");
  const { toast } = useToast();
  
  const [state, setState] = useState<VerificationState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  
  const verifyMutation = useMutation({
    mutationFn: async (verificationToken: string) => {
      const response = await fetch(`/api/verify-email?token=${encodeURIComponent(verificationToken)}`);
      const data = await response.json();
      if (!response.ok) {
        throw { ...data, status: response.status };
      }
      return data;
    },
    onSuccess: () => {
      setState("success");
    },
    onError: (error: any) => {
      setErrorMessage(error.error || "Error al verificar el email");
      if (error.expired) {
        setState("expired");
      } else {
        setState("error");
      }
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
        description: "Si el email está registrado y pendiente de verificación, recibirás un nuevo enlace.",
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
    if (token) {
      verifyMutation.mutate(token);
    } else {
      setState("error");
      setErrorMessage("No se proporcionó un token de verificación");
    }
  }, [token]);

  const handleResend = (e: React.FormEvent) => {
    e.preventDefault();
    if (resendEmail) {
      resendMutation.mutate(resendEmail);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-background overflow-y-auto">
        {state === "loading" && (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <CardTitle className="text-2xl" data-testid="text-verifying-title">Verificando...</CardTitle>
              <CardDescription className="text-base">
                Estamos verificando tu email, por favor espera un momento.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {state === "success" && (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl" data-testid="text-verified-title">Email Verificado</CardTitle>
              <CardDescription className="text-base">
                Tu cuenta ha sido activada exitosamente. Ya puedes iniciar sesión y empezar a usar eAlbarán.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                <p className="text-sm text-green-700 dark:text-green-300">
                  ¡Bienvenido a eAlbarán! Tu empresa está lista para gestionar albaranes digitales.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/login" className="w-full">
                <Button className="w-full" data-testid="button-go-to-login">
                  Iniciar Sesión
                </Button>
              </Link>
            </CardFooter>
          </Card>
        )}

        {state === "error" && (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-2xl" data-testid="text-error-title">Error de Verificación</CardTitle>
              <CardDescription className="text-base">
                {errorMessage}
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col gap-3">
              <Link href="/register" className="w-full">
                <Button variant="outline" className="w-full" data-testid="link-register">
                  Registrar nueva cuenta
                </Button>
              </Link>
              <Link href="/login" className="w-full">
                <Button variant="ghost" className="w-full" data-testid="link-login">
                  Iniciar Sesión
                </Button>
              </Link>
            </CardFooter>
          </Card>
        )}

        {state === "expired" && (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Mail className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <CardTitle className="text-2xl" data-testid="text-expired-title">Enlace Expirado</CardTitle>
              <CardDescription className="text-base">
                {errorMessage}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResend} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Tu email de registro</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    data-testid="input-resend-email"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={resendMutation.isPending}
                  data-testid="button-resend"
                >
                  {resendMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Solicitar nuevo enlace
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Link href="/login" className="w-full">
                <Button variant="ghost" className="w-full" data-testid="link-login-expired">
                  Volver a Iniciar Sesión
                </Button>
              </Link>
            </CardFooter>
          </Card>
        )}
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
        </div>
      </div>
    </div>
  );
}
