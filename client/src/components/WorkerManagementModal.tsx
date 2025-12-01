import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, Plus, Trash2 } from "lucide-react";
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
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const { data: workers = [] } = useQuery<Worker[]>({
    queryKey: ["/api/workers"],
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/workers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workers"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workers"] });
      toast({ title: "Actualizado", description: "Estado del trabajador actualizado" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "No se pudo actualizar el trabajador", variant: "destructive" });
    },
  });

  const handleCreateWorker = async () => {
    if (!formData.name || !formData.email) {
      toast({ title: "Error", description: "Nombre y email son requeridos", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Administrar Trabajadores</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lista de trabajadores */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Trabajadores Activos ({workers.filter((w) => w.isActive).length})</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {workers.filter((w) => w.isActive).map((worker) => (
                <Card key={worker.id} className="hover-elevate">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{worker.name}</p>
                        <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {worker.email}
                          </span>
                          {worker.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {worker.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActiveMutation.mutate({ id: worker.id, isActive: worker.isActive || false })}
                        className="text-xs"
                        data-testid={`button-deactivate-worker-${worker.id}`}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Desactivar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Trabajadores inactivos */}
          {workers.filter((w) => !w.isActive).length > 0 && (
            <div className="space-y-3 mt-6 pt-6 border-t">
              <h3 className="font-semibold text-sm">Trabajadores Inactivos ({workers.filter((w) => !w.isActive).length})</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {workers.filter((w) => !w.isActive).map((worker) => (
                  <Card key={worker.id} className="opacity-60">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-muted-foreground">{worker.name}</p>
                          <Badge variant="outline" className="text-xs mt-1">Inactivo</Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleActiveMutation.mutate({ id: worker.id, isActive: worker.isActive || false })}
                          className="text-xs"
                          data-testid={`button-activate-worker-${worker.id}`}
                        >
                          Activar
                        </Button>
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
            <Card className="mt-4">
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
