import { useState } from "react";
import { Plus, Pencil, Trash2, Check, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

interface VehicleType {
  id: string;
  name: string;
  description: string;
  capacity: string;
  priceMultiplier: number;
  isActive: boolean;
}

// todo: remove mock functionality - replace with actual vehicle types from API
const initialVehicles: VehicleType[] = [
  { id: "1", name: "Furgoneta", description: "Ideal para envíos pequeños y mudanzas urbanas", capacity: "Hasta 800kg / 8m³", priceMultiplier: 1.0, isActive: true },
  { id: "2", name: "Camión Pequeño", description: "Para cargas medianas y distancias cortas", capacity: "Hasta 3.5t / 20m³", priceMultiplier: 1.15, isActive: true },
  { id: "3", name: "Camión Mediano", description: "Transporte regional de mercancías", capacity: "Hasta 7.5t / 40m³", priceMultiplier: 1.35, isActive: true },
  { id: "4", name: "Camión Grande", description: "Cargas pesadas y largas distancias", capacity: "Hasta 12t / 60m³", priceMultiplier: 1.55, isActive: true },
  { id: "5", name: "Tráiler", description: "Transporte de gran volumen nacional e internacional", capacity: "Hasta 24t / 90m³", priceMultiplier: 1.85, isActive: true },
];

export function VehicleTypesAdmin() {
  const [vehicles, setVehicles] = useState<VehicleType[]>(initialVehicles);
  const [editingVehicle, setEditingVehicle] = useState<VehicleType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleSave = () => {
    if (!editingVehicle) return;
    
    if (editingVehicle.id) {
      setVehicles(vehicles.map(v => v.id === editingVehicle.id ? editingVehicle : v));
    } else {
      setVehicles([...vehicles, { ...editingVehicle, id: Date.now().toString() }]);
    }
    setIsDialogOpen(false);
    setEditingVehicle(null);
    console.log("Vehicle saved:", editingVehicle);
  };

  const handleDelete = (id: string) => {
    setVehicles(vehicles.filter(v => v.id !== id));
    setDeleteConfirm(null);
    console.log("Vehicle deleted:", id);
  };

  const toggleActive = (id: string) => {
    setVehicles(vehicles.map(v => v.id === id ? { ...v, isActive: !v.isActive } : v));
  };

  const openNewVehicle = () => {
    setEditingVehicle({
      id: "",
      name: "",
      description: "",
      capacity: "",
      priceMultiplier: 1.0,
      isActive: true,
    });
    setIsDialogOpen(true);
  };

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
                Gestiona los tipos de vehículo disponibles y sus multiplicadores de precio
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
                  <TableHead>Descripción</TableHead>
                  <TableHead>Capacidad</TableHead>
                  <TableHead className="text-right">Multiplicador</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((vehicle) => (
                  <TableRow key={vehicle.id} data-testid={`row-vehicle-${vehicle.id}`}>
                    <TableCell className="font-medium">{vehicle.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {vehicle.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{vehicle.capacity}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ×{vehicle.priceMultiplier.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={vehicle.isActive}
                        onCheckedChange={() => toggleActive(vehicle.id)}
                        data-testid={`switch-active-${vehicle.id}`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirm(vehicle.id)}
                          data-testid={`button-delete-${vehicle.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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
              {editingVehicle?.id ? "Editar Vehículo" : "Nuevo Tipo de Vehículo"}
            </DialogTitle>
            <DialogDescription>
              Configure las características y precio del tipo de vehículo
            </DialogDescription>
          </DialogHeader>
          {editingVehicle && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={editingVehicle.name}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, name: e.target.value })}
                  placeholder="Ej: Camión Frigorífico"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={editingVehicle.description}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, description: e.target.value })}
                  placeholder="Descripción del tipo de vehículo..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Capacidad</Label>
                  <Input
                    value={editingVehicle.capacity}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, capacity: e.target.value })}
                    placeholder="Ej: Hasta 5t / 30m³"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Multiplicador de Precio</Label>
                  <Input
                    type="number"
                    step="0.05"
                    value={editingVehicle.priceMultiplier}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, priceMultiplier: parseFloat(e.target.value) || 1 })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Check className="mr-2 h-4 w-4" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este tipo de vehículo? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
