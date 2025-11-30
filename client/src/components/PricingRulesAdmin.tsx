import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X, DollarSign } from "lucide-react";
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

interface PricingRule {
  id: string;
  name: string;
  zone: number;
  country: string;
  minKm: number;
  maxKm: number;
  basePrice: number;
  pricePerKm: number;
  tollSurcharge: number;
  minPrice: number;
  isActive: boolean;
}

// todo: remove mock functionality - replace with actual pricing rules from API
const initialRules: PricingRule[] = [
  { id: "1", name: "Local", zone: 1, country: "España", minKm: 0, maxKm: 10, basePrice: 15, pricePerKm: 0.80, tollSurcharge: 0, minPrice: 15, isActive: true },
  { id: "2", name: "Local Extendido", zone: 2, country: "España", minKm: 10, maxKm: 50, basePrice: 25, pricePerKm: 0.75, tollSurcharge: 0, minPrice: 25, isActive: true },
  { id: "3", name: "Regional", zone: 3, country: "España", minKm: 50, maxKm: 200, basePrice: 60, pricePerKm: 0.65, tollSurcharge: 0, minPrice: 60, isActive: true },
  { id: "4", name: "Inter-regional", zone: 4, country: "España", minKm: 200, maxKm: 800, basePrice: 200, pricePerKm: 0.50, tollSurcharge: 10, minPrice: 120, isActive: true },
  { id: "5", name: "Internacional Portugal", zone: 5, country: "Portugal", minKm: 0, maxKm: 800, basePrice: 220, pricePerKm: 0.60, tollSurcharge: 15, minPrice: 140, isActive: true },
  { id: "6", name: "Internacional Francia", zone: 6, country: "Francia", minKm: 0, maxKm: 800, basePrice: 240, pricePerKm: 0.65, tollSurcharge: 20, minPrice: 160, isActive: true },
];

export function PricingRulesAdmin() {
  const [rules, setRules] = useState<PricingRule[]>(initialRules);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleSave = () => {
    if (!editingRule) return;
    
    if (editingRule.id) {
      setRules(rules.map(r => r.id === editingRule.id ? editingRule : r));
    } else {
      setRules([...rules, { ...editingRule, id: Date.now().toString() }]);
    }
    setIsDialogOpen(false);
    setEditingRule(null);
    console.log("Rule saved:", editingRule);
  };

  const handleDelete = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
    setDeleteConfirm(null);
    console.log("Rule deleted:", id);
  };

  const toggleActive = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  };

  const openNewRule = () => {
    setEditingRule({
      id: "",
      name: "",
      zone: rules.length + 1,
      country: "España",
      minKm: 0,
      maxKm: 100,
      basePrice: 0,
      pricePerKm: 0,
      tollSurcharge: 0,
      minPrice: 0,
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
                <DollarSign className="h-5 w-5 text-primary" />
                Reglas de Precios por Zona
              </CardTitle>
              <CardDescription>
                Configura las tarifas base, precio por km y recargos para cada zona
              </CardDescription>
            </div>
            <Button onClick={openNewRule} data-testid="button-add-rule">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Zona
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zona</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>País</TableHead>
                  <TableHead className="text-right">Rango (km)</TableHead>
                  <TableHead className="text-right">Base</TableHead>
                  <TableHead className="text-right">€/km</TableHead>
                  <TableHead className="text-right">Peajes</TableHead>
                  <TableHead className="text-right">Mínimo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id} data-testid={`row-rule-${rule.id}`}>
                    <TableCell>
                      <Badge variant="outline">Zona {rule.zone}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell className="text-muted-foreground">{rule.country}</TableCell>
                    <TableCell className="text-right font-mono">
                      {rule.minKm}–{rule.maxKm}
                    </TableCell>
                    <TableCell className="text-right font-mono">{rule.basePrice.toFixed(2)}€</TableCell>
                    <TableCell className="text-right font-mono">{rule.pricePerKm.toFixed(2)}€</TableCell>
                    <TableCell className="text-right font-mono">
                      {rule.tollSurcharge > 0 ? `+${rule.tollSurcharge}%` : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono">{rule.minPrice.toFixed(2)}€</TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={() => toggleActive(rule.id)}
                        data-testid={`switch-active-${rule.id}`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingRule(rule);
                            setIsDialogOpen(true);
                          }}
                          data-testid={`button-edit-${rule.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirm(rule.id)}
                          data-testid={`button-delete-${rule.id}`}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRule?.id ? "Editar Zona" : "Nueva Zona de Precios"}
            </DialogTitle>
            <DialogDescription>
              Configure los parámetros de precios para esta zona
            </DialogDescription>
          </DialogHeader>
          {editingRule && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número de Zona</Label>
                  <Input
                    type="number"
                    value={editingRule.zone}
                    onChange={(e) => setEditingRule({ ...editingRule, zone: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={editingRule.name}
                    onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                    placeholder="Ej: Local, Regional..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>País</Label>
                  <Input
                    value={editingRule.country}
                    onChange={(e) => setEditingRule({ ...editingRule, country: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Km Mínimo</Label>
                  <Input
                    type="number"
                    value={editingRule.minKm}
                    onChange={(e) => setEditingRule({ ...editingRule, minKm: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Km Máximo</Label>
                  <Input
                    type="number"
                    value={editingRule.maxKm}
                    onChange={(e) => setEditingRule({ ...editingRule, maxKm: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Precio Base (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingRule.basePrice}
                    onChange={(e) => setEditingRule({ ...editingRule, basePrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Precio por Km (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingRule.pricePerKm}
                    onChange={(e) => setEditingRule({ ...editingRule, pricePerKm: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Recargo Peajes (%)</Label>
                  <Input
                    type="number"
                    value={editingRule.tollSurcharge}
                    onChange={(e) => setEditingRule({ ...editingRule, tollSurcharge: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Precio Mínimo (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingRule.minPrice}
                    onChange={(e) => setEditingRule({ ...editingRule, minPrice: parseFloat(e.target.value) || 0 })}
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
              ¿Estás seguro de que deseas eliminar esta zona de precios? Esta acción no se puede deshacer.
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
