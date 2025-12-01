import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { VehicleType } from "@shared/schema";

interface CreateQuoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuoteCreated: () => void;
}

export function CreateQuoteModal({ open, onOpenChange, onQuoteCreated }: CreateQuoteModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    customerName: "",
    phoneNumber: "",
    vehicleTypeId: "",
    isUrgent: false,
    pickupTime: "",
    observations: "",
  });

  const { data: vehicleTypes = [] } = useQuery<VehicleType[]>({
    queryKey: ["/api/vehicle-types"],
  });

  const handleSubmit = async () => {
    if (!formData.origin || !formData.destination || !formData.customerName || !formData.vehicleTypeId) {
      toast({ title: "Campos requeridos", description: "Completa todos los campos obligatorios", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/calculate-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        toast({ title: "Error", description: error.error, variant: "destructive" });
        setLoading(false);
        return;
      }

      toast({ title: "Presupuesto creado", description: "Se ha creado el presupuesto correctamente", variant: "default" });
      setFormData({ origin: "", destination: "", customerName: "", phoneNumber: "", vehicleTypeId: "", isUrgent: false, pickupTime: "", observations: "" });
      onOpenChange(false);
      onQuoteCreated();
    } catch (error) {
      toast({ title: "Error", description: "Error al crear presupuesto", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crear Presupuesto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Origen</label>
              <Input
                placeholder="Dirección de origen"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                data-testid="input-origin"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Destino</label>
              <Input
                placeholder="Dirección de destino"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                data-testid="input-destination"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Nombre del cliente</label>
              <Input
                placeholder="Nombre"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                data-testid="input-customer-name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Teléfono</label>
              <Input
                placeholder="Teléfono"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                data-testid="input-phone"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Vehículo</label>
              <Select value={formData.vehicleTypeId} onValueChange={(value) => setFormData({ ...formData, vehicleTypeId: value })}>
                <SelectTrigger data-testid="select-vehicle">
                  <SelectValue placeholder="Selecciona un vehículo" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Horario recogida (opcional)</label>
              <Input
                type="datetime-local"
                value={formData.pickupTime}
                onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                data-testid="input-pickup-time"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isUrgent}
                onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })}
                data-testid="checkbox-urgent"
              />
              <span className="text-sm font-medium">Servicio urgente (+25%)</span>
            </label>
          </div>

          <div>
            <label className="text-sm font-medium">Observaciones (opcional)</label>
            <Textarea
              placeholder="Detalles adicionales..."
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              data-testid="textarea-observations"
              className="resize-none"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1" data-testid="button-cancel">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-blue-600/85 hover:bg-blue-700/85 dark:bg-blue-600/85 dark:hover:bg-blue-700/85 text-white"
              data-testid="button-create"
            >
              {loading ? "Creando..." : "Crear Presupuesto"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
