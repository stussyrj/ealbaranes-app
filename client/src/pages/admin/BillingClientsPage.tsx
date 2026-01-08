import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Building2, Search, X } from "lucide-react";

interface BillingClient {
  id: string;
  tenantId: string;
  commercialName: string;
  legalName: string | null;
  taxId: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ClientFormData {
  commercialName: string;
  legalName: string;
  taxId: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  email: string;
  phone: string;
  notes: string;
}

const emptyFormData: ClientFormData = {
  commercialName: "",
  legalName: "",
  taxId: "",
  address: "",
  city: "",
  postalCode: "",
  country: "España",
  email: "",
  phone: "",
  notes: "",
};

export default function BillingClientsPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<BillingClient | null>(null);
  const [formData, setFormData] = useState<ClientFormData>(emptyFormData);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: clients = [], isLoading } = useQuery<BillingClient[]>({
    queryKey: ["/api/billing-clients"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      const res = await apiRequest("POST", "/api/billing-clients", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al crear cliente");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/billing-clients"] });
      setIsCreateDialogOpen(false);
      setFormData(emptyFormData);
      toast({
        title: "Cliente creado",
        description: "El cliente se ha creado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el cliente",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ClientFormData> }) => {
      const res = await apiRequest("PATCH", `/api/billing-clients/${id}`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al actualizar cliente");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/billing-clients"] });
      setIsEditDialogOpen(false);
      setSelectedClient(null);
      setFormData(emptyFormData);
      toast({
        title: "Cliente actualizado",
        description: "Los datos del cliente se han actualizado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el cliente",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/billing-clients/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al eliminar cliente");
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/billing-clients"] });
      setIsDeleteDialogOpen(false);
      setSelectedClient(null);
      toast({
        title: "Cliente eliminado",
        description: "El cliente se ha eliminado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el cliente",
        variant: "destructive",
      });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.commercialName.trim()) {
      toast({
        title: "Error",
        description: "El nombre comercial es obligatorio",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !formData.commercialName.trim()) {
      toast({
        title: "Error",
        description: "El nombre comercial es obligatorio",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate({ id: selectedClient.id, data: formData });
  };

  const handleDelete = () => {
    if (selectedClient) {
      deleteMutation.mutate(selectedClient.id);
    }
  };

  const openEditDialog = (client: BillingClient) => {
    setSelectedClient(client);
    setFormData({
      commercialName: client.commercialName || "",
      legalName: client.legalName || "",
      taxId: client.taxId || "",
      address: client.address || "",
      city: client.city || "",
      postalCode: client.postalCode || "",
      country: client.country || "España",
      email: client.email || "",
      phone: client.phone || "",
      notes: client.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (client: BillingClient) => {
    setSelectedClient(client);
    setIsDeleteDialogOpen(true);
  };

  const filteredClients = clients.filter(client => {
    const search = searchTerm.toLowerCase();
    return (
      client.commercialName.toLowerCase().includes(search) ||
      (client.legalName && client.legalName.toLowerCase().includes(search)) ||
      (client.taxId && client.taxId.toLowerCase().includes(search)) ||
      (client.city && client.city.toLowerCase().includes(search))
    );
  });

  const ClientFormFields = () => (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="commercialName">Nombre comercial *</Label>
          <Input
            id="commercialName"
            data-testid="input-commercial-name"
            value={formData.commercialName}
            onChange={(e) => setFormData({ ...formData, commercialName: e.target.value })}
            placeholder="Nombre comercial"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="legalName">Razón social</Label>
          <Input
            id="legalName"
            data-testid="input-legal-name"
            value={formData.legalName}
            onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
            placeholder="Razón social"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="taxId">CIF/NIF</Label>
          <Input
            id="taxId"
            data-testid="input-tax-id"
            value={formData.taxId}
            onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
            placeholder="B12345678"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            data-testid="input-email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="facturacion@empresa.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Dirección</Label>
        <Input
          id="address"
          data-testid="input-address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Calle, número, piso..."
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="postalCode">Código postal</Label>
          <Input
            id="postalCode"
            data-testid="input-postal-code"
            value={formData.postalCode}
            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
            placeholder="08001"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Ciudad</Label>
          <Input
            id="city"
            data-testid="input-city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="Barcelona"
          />
        </div>
        <div className="space-y-2 col-span-2 sm:col-span-1">
          <Label htmlFor="country">País</Label>
          <Input
            id="country"
            data-testid="input-country"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            placeholder="España"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Teléfono</Label>
        <Input
          id="phone"
          data-testid="input-phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+34 612 345 678"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          data-testid="input-notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Notas adicionales..."
          rows={2}
        />
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto p-4">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">Cargando clientes...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Clientes de Facturación
              </CardTitle>
              <CardDescription>
                Gestiona los datos de facturación de tus clientes para usar en facturas
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-client" onClick={() => setFormData(emptyFormData)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crear Cliente</DialogTitle>
                  <DialogDescription>
                    Añade un nuevo cliente con sus datos de facturación
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate}>
                  <ClientFormFields />
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      data-testid="button-submit-create"
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending ? "Creando..." : "Crear Cliente"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {clients.length > 0 && (
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                data-testid="input-search-clients"
                placeholder="Buscar por nombre, CIF o ciudad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {clients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No tienes clientes registrados</p>
              <p className="text-sm">Añade tu primer cliente para empezar a facturar más rápido</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No se encontraron clientes con "{searchTerm}"</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden sm:table-cell">CIF/NIF</TableHead>
                    <TableHead className="hidden md:table-cell">Ciudad</TableHead>
                    <TableHead className="hidden lg:table-cell">Email</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id} data-testid={`row-client-${client.id}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{client.commercialName}</div>
                          {client.legalName && client.legalName !== client.commercialName && (
                            <div className="text-xs text-muted-foreground">{client.legalName}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {client.taxId || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {client.city || "-"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {client.email || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-edit-client-${client.id}`}
                            onClick={() => openEditDialog(client)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-delete-client-${client.id}`}
                            onClick={() => openDeleteDialog(client)}
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
          )}
          
          {clients.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              {filteredClients.length} de {clients.length} clientes
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Modifica los datos de facturación del cliente
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <ClientFormFields />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                data-testid="button-submit-edit"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Cliente</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar a "{selectedClient?.commercialName}"? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              data-testid="button-confirm-delete"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
