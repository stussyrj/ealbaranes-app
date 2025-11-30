import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Truck, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { VehicleType, InsertVehicleType } from "@shared/schema";

export function VehicleTypesAdmin() {
  const [editingVehicle, setEditingVehicle] = useState<VehicleType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: allVehicles, isLoading } = useQuery<VehicleType[]>({
    queryKey: ["/api/vehicle-types/all"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertVehicleType) => {
      const response = await apiRequest("POST", "/api/vehicle-types", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-types/all"] });
      setIsDialogOpen(false);
      setEditingVehicle(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertVehicleType> }) => {
      const response = await apiRequest("PUT", `/api/vehicle-types/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-types/all"] });
      setIsDialogOpen(false);
      setEditingVehicle(null);
    },
  });

  const handleSave = () => {
    if (!editingVehicle) return;
    
    const data: InsertVehicleType = {
      name: editingVehicle.name,
      description: editingVehicle.description,
      capacity: editingVehicle.capacity,
      pricePerKm: editingVehicle.pricePerKm,
      directionPrice: editingVehicle.directionPrice || 0,
      minimumPrice: editingVehicle.minimumPrice,
      isActive: editingVehicle.isActive,
    };
    
    if (editingVehicle.id && !editingVehicle.id.startsWith("new-")) {
      updateMutation.mutate({ id: editingVehicle.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleActive = (vehicle: VehicleType) => {
    updateMutation.mutate({ id: vehicle.id, data: { isActive: !vehicle.isActive } });
  };

  const openNewVehicle = () => {
    setEditingVehicle({
      id: "new-" + Date.now(),
      name: "",
      description: "",
      capacity: "",
      pricePerKm: 0.5,
      directionPrice: 0,
      minimumPrice: 5,
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Tipos de Vehículo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                Tipos de Vehículo
              </CardTitle>
              <CardDescription>
                Gestiona los tipos de vehículo: activa/desactiva servicios con el botón de encendido
              </CardDescription>
            </div>
            <Button onClick={openNewVehicle} data-testid="button-add-vehicle">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Vehículo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehículo</TableHead>
                  <TableHead>Capacidad</TableHead>
                  <TableHead className="text-right">€/Km</TableHead>
                  <TableHead className="text-right">Dirección</TableHead>
                  <TableHead className="text-right">Mínimo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allVehicles?.map((vehicle) => (
                  <TableRow key={vehicle.id} data-testid={`row-vehicle-${vehicle.id}`} className={!vehicle.isActive ? "opacity-60" : ""}>
                    <TableCell className="font-medium">{vehicle.name}</TableCell>
                    <TableCell>
                      <Badge variant={vehicle.isActive ? "secondary" : "outline"}>{vehicle.capacity}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {vehicle.pricePerKm.toFixed(2)}€
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {(vehicle.directionPrice || 0).toFixed(2)}€
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {vehicle.minimumPrice.toFixed(2)}€
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={vehicle.isActive ?? true}
                          onCheckedChange={() => toggleActive(vehicle)}
                          data-testid={`switch-active-${vehicle.id}`}
                        />
                        <span className="text-xs text-muted-foreground">
                          {vehicle.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingVehicle(vehicle);
                          setIsDialogOpen(true);
                        }}
                        data-testid={`button-edit-${vehicle.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingVehicle?.id && !editingVehicle.id.startsWith("new-") ? "Editar Vehículo" : "Nuevo Tipo de Vehículo"}
            </DialogTitle>
            <DialogDescription>
              Configure las características y tarifas del tipo de vehículo
            </DialogDescription>
          </DialogHeader>
          {editingVehicle && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={editingVehicle.name}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, name: e.target.value })}
                  placeholder="Ej: Servicio Moto"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={editingVehicle.description || ""}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, description: e.target.value })}
                  placeholder="Descripción del tipo de vehículo..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Capacidad</Label>
                <Input
                  value={editingVehicle.capacity || ""}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, capacity: e.target.value })}
                  placeholder="Ej: Hasta 5 kg, 40x30x40 cm"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Precio/Km (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingVehicle.pricePerKm}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, pricePerKm: parseFloat(e.target.value) || 0 })}
                    placeholder="0.54"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dirección (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingVehicle.directionPrice || 0}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, directionPrice: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mínimo (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingVehicle.minimumPrice}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, minimumPrice: parseFloat(e.target.value) || 0 })}
                    placeholder="7.50"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
