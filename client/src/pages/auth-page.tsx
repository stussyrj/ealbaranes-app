import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, Lock, User } from "lucide-react";

export default function AuthPage() {
  const { user, login, isLoginPending } = useAuth();
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(username, password);
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md rounded-md border border-muted-foreground/10 bg-slate-50 dark:bg-slate-900/30 shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold leading-none tracking-tight">Iniciar Sesión</h2>
            <p className="text-sm text-muted-foreground">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>
          <div className="p-6 pt-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Tu nombre de usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
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
                    type="password"
                    placeholder="Tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    data-testid="input-password"
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoginPending}
                data-testid="button-login"
              >
                {isLoginPending ? "Iniciando..." : "Iniciar Sesión"}
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-8">
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
