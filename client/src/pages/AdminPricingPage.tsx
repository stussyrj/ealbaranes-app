import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Info } from "lucide-react";
import { AnimatedPageBackground } from "@/components/AnimatedPageBackground";

export default function AdminPricingPage() {
  return (
    <div className="relative p-6 space-y-6">
      <AnimatedPageBackground />
      <div className="relative z-10">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold">Administración de Precios</h1>
          <p className="text-muted-foreground mt-1">
            Configura las tarifas por tipo de vehículo
          </p>
        </div>
        
        <Card>
          <CardHeader className="bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <CardTitle>Gestión de Tarifas</CardTitle>
                <CardDescription>
                  Los precios se configuran por tipo de vehículo
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              El nuevo sistema de precios funciona por tipo de vehículo:
            </p>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="font-mono bg-muted px-2 py-1 rounded">Dirección</span>
                <span className="text-muted-foreground">Tarifa base por salida/dirección</span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono bg-muted px-2 py-1 rounded">€/km</span>
                <span className="text-muted-foreground">Precio por kilómetro recorrido</span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono bg-muted px-2 py-1 rounded">Mínimo</span>
                <span className="text-muted-foreground">Precio mínimo garantizado por envío</span>
              </li>
            </ul>
            <p className="text-xs text-muted-foreground mt-6 pt-4 border-t">
              <strong>Fórmula:</strong> Precio = max(Mínimo, Dirección + (Km × €/km))
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Accede a la sección <strong>Tipos de Vehículo</strong> para editar las tarifas específicas de cada servicio.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
