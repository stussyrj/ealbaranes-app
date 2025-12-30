import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Settings, Clock } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [waitTimeThreshold, setWaitTimeThreshold] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load current settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data: any = await apiRequest("GET", "/api/tenant/wait-time-threshold");
        setWaitTimeThreshold(data.waitTimeThreshold || 20);
      } catch (error) {
        console.error("Error loading settings:", error);
        toast({ title: "Error", description: "No se pudieron cargar las configuraciones", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [toast]);

  const handleSave = async () => {
    if (waitTimeThreshold < 1 || waitTimeThreshold > 240) {
      toast({ title: "Error", description: "El umbral debe estar entre 1 y 240 minutos", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      await apiRequest("PATCH", "/api/tenant/wait-time-threshold", { 
        waitTimeThreshold: parseInt(String(waitTimeThreshold)) 
      });
      toast({ title: "Configuración guardada", description: `Umbral de tiempo de espera actualizado a ${waitTimeThreshold} minutos` });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({ title: "Error", description: "Error al guardar la configuración", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">Configuración</h1>
          <p className="text-sm text-muted-foreground">Gestiona la configuración de tu empresa</p>
        </div>
      </div>

      <Card className="bg-slate-50 dark:bg-slate-900/30 border-muted-foreground/10 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <div>
              <CardTitle className="text-lg">Tiempo de Espera</CardTitle>
              <CardDescription>Configura el umbral mínimo para contabilizar el tiempo de espera en los albaranes</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Umbral mínimo (minutos)</label>
            <p className="text-xs text-muted-foreground mb-2">
              Los tiempos de espera menores a este valor no se incluirán en las observaciones del albarán.
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 max-w-xs">
                <Input
                  type="number"
                  min="1"
                  max="240"
                  value={waitTimeThreshold}
                  onChange={(e) => setWaitTimeThreshold(Number(e.target.value))}
                  className="h-10"
                  data-testid="input-wait-time-threshold"
                  disabled={isSaving}
                />
              </div>
              <span className="text-sm text-muted-foreground">minutos</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Rango permitido: 1 - 240 minutos
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Ejemplo:</p>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Si configuras 20 minutos (valor actual), solo se registrarán tiempos de espera ≥ 20 minutos</li>
              <li>• Si un trabajador se detiene 15 minutos, NO aparecerá en observaciones</li>
              <li>• Si se detiene 25 minutos, aparecerá: "Duración: 25 minutos"</li>
            </ul>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700"
            data-testid="button-save-settings"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Configuración"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
