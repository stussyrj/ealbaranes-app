import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ProfileSetupPage() {
  const { user, refetchUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const setupMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/profile-setup", data);
    },
    onSuccess: async () => {
      toast({
        title: "Perfil completado",
        description: "Tu perfil se ha configurado correctamente",
      });
      await refetchUser();
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.error || "Error al completar el perfil",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyName.trim()) {
      toast({ title: "Error", description: "Nombre de empresa requerido", variant: "destructive" });
      return;
    }
    
    if (!username.trim()) {
      toast({ title: "Error", description: "Usuario requerido", variant: "destructive" });
      return;
    }
    
    if (username.length < 3) {
      toast({ title: "Error", description: "Usuario debe tener al menos 3 caracteres", variant: "destructive" });
      return;
    }
    
    if (password.length < 8) {
      toast({ title: "Error", description: "Contraseña debe tener al menos 8 caracteres", variant: "destructive" });
      return;
    }
    
    if (password !== passwordConfirm) {
      toast({ title: "Error", description: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }

    setupMutation.mutate({ companyName, username, password });
  };

  if (!user || !user.setupRequired) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900/20 via-background to-purple-900/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Completa tu Perfil</CardTitle>
          <CardDescription>
            Para completar tu registro, necesitamos algunos datos adicionales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Verificado via Google</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Nombre de Empresa *</Label>
              <Input
                id="companyName"
                placeholder="Tu empresa"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                data-testid="input-company-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Usuario *</Label>
              <Input
                id="username"
                placeholder="Tu nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                data-testid="input-username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">Confirmar Contraseña *</Label>
              <Input
                id="passwordConfirm"
                type="password"
                placeholder="Confirma tu contraseña"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                data-testid="input-password-confirm"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={setupMutation.isPending}
              data-testid="button-complete-setup"
            >
              {setupMutation.isPending ? "Guardando..." : "Completar Perfil"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
