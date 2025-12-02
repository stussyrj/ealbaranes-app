import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnimatedPageBackground } from "@/components/AnimatedPageBackground";
import { Users } from "lucide-react";

const WORKERS = [
  {
    id: "worker-jose",
    name: "José",
    email: "jose@empresa.com",
    description: "Trabajador de transporte de carga general",
  },
  {
    id: "worker-luis",
    name: "Luis",
    email: "luis@empresa.com",
    description: "Especialista en entregas urgentes",
  },
  {
    id: "worker-miguel",
    name: "Miguel",
    email: "miguel@empresa.com",
    description: "Coordinador de rutas y logística",
  },
];

export default function WorkerSelection() {
  const { user, setUser } = useAuth();
  const [, setLocation] = useLocation();

  const handleSelectWorker = (workerId: string) => {
    if (user) {
      const updatedUser = { ...user, workerId };
      setUser(updatedUser);
      setLocation("/");
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6">
      <AnimatedPageBackground />
      <div className="relative z-10 w-full max-w-sm sm:max-w-2xl">
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Selecciona tu Perfil</h1>
          <p className="text-xs sm:text-sm text-muted-foreground px-2">
            Elige cuál trabajador eres
          </p>
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
          {WORKERS.map((worker) => (
            <Card key={worker.id} className="hover-elevate cursor-pointer transition-all active:scale-95" onClick={() => handleSelectWorker(worker.id)}>
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-lg sm:text-xl">{worker.name}</CardTitle>
                <CardDescription className="text-xs sm:text-sm">{worker.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{worker.description}</p>
                <Button
                  onClick={() => handleSelectWorker(worker.id)}
                  className="w-full bg-purple-600/85 hover:bg-purple-700/85 dark:bg-purple-600/85 dark:hover:bg-purple-700/85 text-white text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2 rounded-lg backdrop-blur-sm border border-purple-500/40"
                  data-testid={`button-select-worker-${worker.id}`}
                >
                  {worker.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 sm:mt-12 p-4 sm:p-6 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
          <h2 className="font-semibold mb-3 text-sm sm:text-base">¿Cómo funciona?</h2>
          <ul className="text-xs sm:text-sm space-y-2 text-muted-foreground">
            <li>→ Selecciona tu perfil de trabajador</li>
            <li>→ Accede a tu dashboard personalizado</li>
            <li>→ Ve tus servicios (pendientes, firmados, entregados)</li>
            <li>→ Genera albaranes digitales con firma</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
