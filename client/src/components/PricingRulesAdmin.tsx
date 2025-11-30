import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Check, DollarSign, Loader2 } from "lucide-react";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PricingRule, InsertPricingRule } from "@shared/schema";

export function PricingRulesAdmin() {
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: rules, isLoading } = useQuery<PricingRule[]>({
    queryKey: ["/api/pricing-rules"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertPricingRule) => {
      const response = await apiRequest("POST", "/api/pricing-rules", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-rules"] });
      setIsDialogOpen(false);
      setEditingRule(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertPricingRule> }) => {
      const response = await apiRequest("PUT", `/api/pricing-rules/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-rules"] });
      setIsDialogOpen(false);
      setEditingRule(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/pricing-rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing-rules"] });
      setDeleteConfirm(null);
    },
  });

  const handleSave = () => {
    if (!editingRule) return;
    
    const data: InsertPricingRule = {
      zone: editingRule.zone,
      name: editingRule.name,
      country: editingRule.country,
      minKm: editingRule.minKm,
      maxKm: editingRule.maxKm,
      basePrice: editingRule.basePrice,
      pricePerKm: editingRule.pricePerKm,
      tollSurcharge: editingRule.tollSurcharge,
      minPrice: editingRule.minPrice,
      isActive: editingRule.isActive,
    };
    
    if (editingRule.id && !editingRule.id.startsWith("new-")) {
      updateMutation.mutate({ id: editingRule.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleActive = (rule: PricingRule) => {
    updateMutation.mutate({ id: rule.id, data: { isActive: !rule.isActive } });
  };

  const openNewRule = () => {
    setEditingRule({
      id: "new-" + Date.now(),
      zone: (rules?.length || 0) + 1,
      name: "",
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Reglas de Precios por Zona
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
                {rules?.map((rule) => (
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
                        checked={rule.isActive ?? true}
                        onCheckedChange={() => toggleActive(rule)}
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
              {editingRule?.id && !editingRule.id.startsWith("new-") ? "Editar Zona" : "Nueva Zona de Precios"}
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
            <Button 
              onClick={handleSave} 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
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
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
