import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, downloadFile } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Settings, Clock, Truck, Plus, Trash2, Edit2, Database, Download, History, CheckCircle2, XCircle } from "lucide-react";

interface VehicleType {
  id: string;
  name: string;
  tenantId: string | null;
}

interface BackupLog {
  id: string;
  tenantId: string;
  userId: string;
  type: string;
  status: string;
  fileName: string | null;
  fileSize: number | null;
  recordCounts: {
    deliveryNotes: number;
    invoices: number;
    workers: number;
    vehicleTypes: number;
    users: number;
  } | null;
  errorMessage: string | null;
  createdAt: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [waitTimeThreshold, setWaitTimeThreshold] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [newVehicleName, setNewVehicleName] = useState("");
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [backups, setBackups] = useState<BackupLog[]>([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [settingsRes, vehiclesRes] = await Promise.all([
          apiRequest("GET", "/api/tenant/wait-time-threshold"),
          apiRequest("GET", "/api/tenant/vehicle-types")
        ]);
        const settingsData = await settingsRes.json();
        const vehiclesData = await vehiclesRes.json();
        setWaitTimeThreshold(settingsData.waitTimeThreshold || 20);
        // Ensure vehiclesData is an array and filter by isActive
        const types = Array.isArray(vehiclesData) ? vehiclesData.filter((v: any) => v.isActive) : [];
        setVehicleTypes(types);
      } catch (error) {
        console.error("Error loading settings:", error);
        toast({ title: "Error", description: "No se pudieron cargar las configuraciones", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const handleSaveThreshold = async () => {
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

  const handleAddVehicle = async () => {
    if (!newVehicleName.trim()) {
      toast({ title: "Error", description: "Ingresa un nombre para el tipo de vehículo", variant: "destructive" });
      return;
    }

    setIsAddingVehicle(true);
    try {
      const res = await apiRequest("POST", "/api/tenant/vehicle-types", {
        name: newVehicleName.trim(),
        pricePerKm: 0,
        minimumPrice: 0,
        isActive: true
      });
      const newVehicle = await res.json();
      setVehicleTypes([...vehicleTypes, newVehicle]);
      setNewVehicleName("");
      toast({ title: "Éxito", description: "Tipo de vehículo agregado" });
    } catch (error) {
      console.error("Error adding vehicle:", error);
      toast({ title: "Error", description: "Error al agregar el tipo de vehículo", variant: "destructive" });
    } finally {
      setIsAddingVehicle(false);
    }
  };

  const handleUpdateVehicle = async (id: string) => {
    if (!editingName.trim()) {
      toast({ title: "Error", description: "Ingresa un nombre", variant: "destructive" });
      return;
    }

    try {
      const res = await apiRequest("PATCH", `/api/tenant/vehicle-types/${id}`, {
        name: editingName.trim()
      });
      const updated = await res.json();
      setVehicleTypes(vehicleTypes.map(v => v.id === id ? updated : v));
      setEditingId(null);
      setEditingName("");
      toast({ title: "Éxito", description: "Tipo de vehículo actualizado" });
    } catch (error) {
      console.error("Error updating vehicle:", error);
      toast({ title: "Error", description: "Error al actualizar el tipo de vehículo", variant: "destructive" });
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    try {
      await apiRequest("DELETE", `/api/tenant/vehicle-types/${id}`);
      setVehicleTypes(vehicleTypes.filter(v => v.id !== id));
      toast({ title: "Éxito", description: "Tipo de vehículo eliminado" });
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      toast({ title: "Error", description: "Error al eliminar el tipo de vehículo", variant: "destructive" });
    }
  };

  const loadBackupHistory = async () => {
    setIsLoadingBackups(true);
    try {
      const res = await apiRequest("GET", "/api/admin/backups");
      const data = await res.json();
      setBackups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading backup history:", error);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const res = await fetch("/api/admin/backup", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("ealbaran_auth_token") || ""}`,
        },
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Error al crear respaldo");
      }

      const blob = await res.blob();
      const contentDisposition = res.headers.get("Content-Disposition");
      let filename = "backup.json";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast({ title: "Respaldo creado", description: "El archivo se ha descargado correctamente" });
      loadBackupHistory();
    } catch (error) {
      console.error("Error creating backup:", error);
      toast({ title: "Error", description: "Error al crear el respaldo", variant: "destructive" });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

      {/* Tipos de Vehículos */}
      <Card className="bg-slate-50 dark:bg-slate-900/30 border-muted-foreground/10 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <CardTitle className="text-lg">Tipos de Vehículos</CardTitle>
              <CardDescription>Edita los tipos de vehículos disponibles para crear albaranes</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Nuevo tipo de vehículo (ej: Motocicleta, Furgón, etc.)"
                value={newVehicleName}
                onChange={(e) => setNewVehicleName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleAddVehicle();
                }}
                className="h-10 flex-1"
                data-testid="input-vehicle-name"
                disabled={isAddingVehicle}
              />
              <Button
                onClick={handleAddVehicle}
                disabled={isAddingVehicle || !newVehicleName.trim()}
                size="sm"
                data-testid="button-add-vehicle"
              >
                {isAddingVehicle ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar
                  </>
                )}
              </Button>
            </div>

            {vehicleTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay tipos de vehículos. Agrega uno para empezar.
              </p>
            ) : (
              <div className="space-y-2">
                {vehicleTypes.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="flex items-center gap-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-muted-foreground/10"
                  >
                    {editingId === vehicle.id ? (
                      <>
                        <Input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="h-8 flex-1"
                          data-testid={`input-edit-vehicle-${vehicle.id}`}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateVehicle(vehicle.id)}
                          className="h-8"
                          data-testid={`button-confirm-edit-${vehicle.id}`}
                        >
                          Guardar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                          className="h-8"
                          data-testid={`button-cancel-edit-${vehicle.id}`}
                        >
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-medium">{vehicle.name}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(vehicle.id);
                            setEditingName(vehicle.name);
                          }}
                          className="h-8 w-8"
                          data-testid={`button-edit-vehicle-${vehicle.id}`}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteVehicle(vehicle.id)}
                          className="h-8 w-8 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          data-testid={`button-delete-vehicle-${vehicle.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tiempo de Espera */}
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
            onClick={handleSaveThreshold}
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

      {/* Respaldos de Datos */}
      <Card className="bg-slate-50 dark:bg-slate-900/30 border-muted-foreground/10 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div>
              <CardTitle className="text-lg">Respaldos de Datos</CardTitle>
              <CardDescription>Descarga una copia de seguridad de todos tus datos</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium text-green-900 dark:text-green-100">Tu respaldo incluye:</p>
            <ul className="text-xs text-green-800 dark:text-green-200 space-y-1">
              <li>• Todos los albaranes y sus datos</li>
              <li>• Todas las facturas y líneas de detalle</li>
              <li>• Trabajadores y tipos de vehículos</li>
              <li>• Información de usuarios (sin contraseñas)</li>
              <li>• Configuración de la empresa</li>
            </ul>
          </div>

          <Button
            onClick={handleCreateBackup}
            disabled={isCreatingBackup}
            className="w-full sm:w-auto"
            data-testid="button-create-backup"
          >
            {isCreatingBackup ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando respaldo...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Descargar Respaldo Ahora
              </>
            )}
          </Button>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Historial de respaldos</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadBackupHistory}
                disabled={isLoadingBackups}
                data-testid="button-refresh-backups"
              >
                {isLoadingBackups ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Actualizar"
                )}
              </Button>
            </div>

            {backups.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay respaldos registrados. Haz clic en "Descargar Respaldo Ahora" para crear el primero.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {backups.map((backup) => (
                  <div
                    key={backup.id}
                    className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-muted-foreground/10"
                  >
                    {backup.status === "completed" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {formatDate(backup.createdAt)}
                      </p>
                      {backup.recordCounts && (
                        <p className="text-xs text-muted-foreground">
                          {backup.recordCounts.deliveryNotes} albaranes, {backup.recordCounts.invoices} facturas
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(backup.fileSize)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
