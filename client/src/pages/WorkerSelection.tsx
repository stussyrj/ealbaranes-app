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
    email: "jose@directtransports.com",
    description: "Trabajador de transporte de carga general",
  },
  {
    id: "worker-luis",
    name: "Luis",
    email: "luis@directtransports.com",
    description: "Especialista en entregas urgentes",
  },
  {
    id: "worker-miguel",
    name: "Miguel",
    email: "miguel@directtransports.com",
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
    <div className="relative min-h-screen">
      <AnimatedPageBackground />
      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Selecciona tu Perfil de Trabajador</h1>
            <p className="text-muted-foreground">
              Elige cuál trabajador eres para acceder a tu dashboard y servicios asignados
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {WORKERS.map((worker) => (
              <Card key={worker.id} className="hover-elevate cursor-pointer transition-all" onClick={() => handleSelectWorker(worker.id)}>
                <CardHeader>
                  <CardTitle className="text-xl">{worker.name}</CardTitle>
                  <CardDescription className="text-sm">{worker.email}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{worker.description}</p>
                  <Button
                    onClick={() => handleSelectWorker(worker.id)}
                    className="w-full bg-purple-600/85 hover:bg-purple-700/85 dark:bg-purple-600/85 dark:hover:bg-purple-700/85 text-white px-4 py-2 rounded-lg backdrop-blur-sm border border-purple-500/40"
                    data-testid={`button-select-worker-${worker.id}`}
                  >
                    Acceder como {worker.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 p-6 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <h2 className="font-semibold mb-2">¿Cómo funciona?</h2>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>✓ Selecciona el perfil del trabajador que eres</li>
              <li>✓ Accederás a tu dashboard personalizado con tus servicios asignados</li>
              <li>✓ Verás el historial de servicios (pendientes, firmados, entregados)</li>
              <li>✓ Podrás generar albaranes digitales con firma del cliente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
