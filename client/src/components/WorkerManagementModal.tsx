import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Plus, Power, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Worker } from "@shared/schema";

interface WorkerManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkerManagementModal({ open, onOpenChange }: WorkerManagementModalProps) {
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const { data: workers = [] } = useQuery<Worker[]>({
    queryKey: ["/api/workers", { includeInactive: true }],
    queryFn: async () => {
      const response = await fetch("/api/workers?includeInactive=true");
      if (!response.ok) throw new Error("Error al obtener trabajadores");
      return response.json();
    },
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/workers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workers", { includeInactive: true }] });
      toast({ title: "Trabajador creado", description: "Nuevo trabajador agregado correctamente" });
      setFormData({ name: "", email: "", phone: "" });
      setShowCreateForm(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo crear el trabajador", variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/workers/${id}`, { isActive: !isActive });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/workers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workers", { includeInactive: true }] });
      const action = variables.isActive ? "desactivado" : "activado";
      toast({ title: "Actualizado", description: `Trabajador ${action} correctamente` });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo actualizar el trabajador", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/workers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workers", { includeInactive: true }] });
      toast({ title: "Eliminado", description: "Trabajador eliminado permanentemente" });
      setConfirmDeleteId(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo eliminar el trabajador", variant: "destructive" });
    },
  });

  const handleCreateWorker = async () => {
    if (!formData.name || !formData.email) {
      toast({ title: "Error", description: "Nombre y email son requeridos", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleDeleteWorker = (id: string) => {
    if (confirmDeleteId === id) {
      deleteMutation.mutate(id);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const activeWorkers = workers.filter((w) => w.isActive);
  const inactiveWorkers = workers.filter((w) => !w.isActive);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Administrar Trabajadores</DialogTitle>
          <DialogDescription>
            Gestiona el equipo de trabajadores: activa, desactiva o elimina permanentemente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lista de trabajadores activos */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-green-600 dark:text-green-400">
              Trabajadores Activos ({activeWorkers.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activeWorkers.map((worker) => (
                <Card key={worker.id} className="hover-elevate">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{worker.name}</p>
                        <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{worker.email}</span>
                          </span>
                          {worker.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              {worker.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleActiveMutation.mutate({ id: worker.id, isActive: worker.isActive || false })}
                          className="text-xs h-8 px-2 text-orange-600 border-orange-300 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-700 dark:hover:bg-orange-950"
                          disabled={toggleActiveMutation.isPending}
                          data-testid={`button-deactivate-worker-${worker.id}`}
                        >
                          <Power className="h-3 w-3 mr-1" />
                          Desactivar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteWorker(worker.id)}
                          className={`text-xs h-8 px-2 ${
                            confirmDeleteId === worker.id
                              ? "bg-red-600 text-white border-red-600 hover:bg-red-700"
                              : "text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-950"
                          }`}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-worker-${worker.id}`}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          {confirmDeleteId === worker.id ? "Confirmar" : "Borrar"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {activeWorkers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No hay trabajadores activos</p>
              )}
            </div>
          </div>

          {/* Trabajadores inactivos */}
          {inactiveWorkers.length > 0 && (
            <div className="space-y-3 mt-6 pt-6 border-t">
              <h3 className="font-semibold text-sm text-muted-foreground">
                Trabajadores Inactivos ({inactiveWorkers.length})
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {inactiveWorkers.map((worker) => (
                  <Card key={worker.id} className="opacity-70 bg-muted/30">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-muted-foreground truncate">{worker.name}</p>
                            <Badge variant="secondary" className="text-xs">Inactivo</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 truncate">{worker.email}</p>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleActiveMutation.mutate({ id: worker.id, isActive: worker.isActive || false })}
                            className="text-xs h-8 px-2 text-green-600 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-950"
                            disabled={toggleActiveMutation.isPending}
                            data-testid={`button-activate-worker-${worker.id}`}
                          >
                            <Power className="h-3 w-3 mr-1" />
                            Activar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteWorker(worker.id)}
                            className={`text-xs h-8 px-2 ${
                              confirmDeleteId === worker.id
                                ? "bg-red-600 text-white border-red-600 hover:bg-red-700"
                                : "text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-950"
                            }`}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-inactive-worker-${worker.id}`}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            {confirmDeleteId === worker.id ? "Confirmar" : "Borrar"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Formulario crear trabajador */}
          {!showCreateForm && (
            <Button
              onClick={() => setShowCreateForm(true)}
              className="w-full mt-4"
              data-testid="button-show-create-worker-form"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Nuevo Trabajador
            </Button>
          )}

          {showCreateForm && (
            <Card className="mt-4 border-primary/30">
              <CardContent className="p-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Nombre</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nombre del trabajador"
                    className="mt-1"
                    data-testid="input-worker-name"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Email</label>
                  <Input
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                    type="email"
                    className="mt-1"
                    data-testid="input-worker-email"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Teléfono (Opcional)</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="600000000"
                    className="mt-1"
                    data-testid="input-worker-phone"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateWorker}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={createMutation.isPending}
                    data-testid="button-create-worker"
                  >
                    {createMutation.isPending ? "Creando..." : "Crear"}
                  </Button>
                  <Button
                    onClick={() => setShowCreateForm(false)}
                    variant="outline"
                    className="flex-1"
                    data-testid="button-cancel-create-worker"
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
