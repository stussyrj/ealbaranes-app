import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AnimatedPageBackground } from "@/components/AnimatedPageBackground";
import { DeliveryNoteGenerator } from "@/components/DeliveryNoteGenerator";
import { Home, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Quote, DeliveryNote } from "@shared/schema";

export default function WorkerDashboard() {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Quote | null>(null);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [createDeliveryOpen, setCreateDeliveryOpen] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    pickupOrigin: "",
    destination: "",
    vehicleType: "Furgoneta",
    date: new Date().toISOString().split("T")[0],
    time: "09:00",
    observations: "",
  });

  const handleBackToSelection = () => {
    if (user) {
      setUser({ ...user, workerId: undefined });
    }
  };

  const { data: orders = [] } = useQuery<Quote[]>({
    queryKey: ["/api/workers", user?.workerId || "", "orders"],
    enabled: !!user?.workerId,
  });

  const { data: deliveryNotes = [] } = useQuery<DeliveryNote[]>({
    queryKey: ["/api/workers", user?.workerId || "", "delivery-notes"],
    enabled: !!user?.workerId,
  });

  const getDeliveryNoteStatus = (quoteId: string) => {
    const note = deliveryNotes.find((n: DeliveryNote) => n.quoteId === quoteId);
    return note?.status || null;
  };

  const pendingOrders = orders.filter((o: Quote) => 
    o.status === "assigned" && !getDeliveryNoteStatus(o.id)
  );

  const signedOrders = orders.filter((o: Quote) => 
    getDeliveryNoteStatus(o.id) === "signed"
  );

  const deliveredOrders = orders.filter((o: Quote) => 
    getDeliveryNoteStatus(o.id) === "delivered"
  );

  const openDeliveryModal = (order: Quote) => {
    setSelectedOrder(order);
    setDeliveryModalOpen(true);
  };

  // Calcular estadísticas
  const confirmedOrders = orders.filter((o: Quote) => 
    o.status === "assigned" || o.status === "confirmed" || o.status === "approved"
  );

  // Solo contar horas de órdenes con albarán firmado o entregado
  const signedOrDeliveredOrders = orders.filter((o: Quote) => {
    const noteStatus = getDeliveryNoteStatus(o.id);
    return noteStatus === "signed" || noteStatus === "delivered";
  });

  const totalRouteMinutes = signedOrDeliveredOrders.reduce((sum: number, order: Quote) => 
    sum + (order.duration || 0), 0
  );

  const getTodayRouteMinutes = () => {
    const today = new Date().toDateString();
    return signedOrDeliveredOrders.reduce((sum: number, order: Quote) => {
      if (order.createdAt) {
        const orderDate = new Date(order.createdAt).toDateString();
        if (orderDate === today) {
          return sum + (order.duration || 0);
        }
      }
      return sum;
    }, 0);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Calcular albaranes del día y del mes
  const getTodayDeliveryNotes = () => {
    const today = new Date().toDateString();
    return deliveryNotes.filter((note: DeliveryNote) => {
      if (note.signedAt) {
        const noteDate = new Date(note.signedAt).toDateString();
        return noteDate === today;
      }
      return false;
    });
  };

  const getMonthDeliveryNotes = () => {
    const now = new Date();
    return deliveryNotes.filter((note: DeliveryNote) => {
      if (note.signedAt) {
        const noteDate = new Date(note.signedAt);
        return noteDate.getMonth() === now.getMonth() && noteDate.getFullYear() === now.getFullYear();
      }
      return false;
    });
  };

  const renderOrderCard = (order: Quote, showGenerateBtn = false) => {
    const noteStatus = getDeliveryNoteStatus(order.id);
    const getStatusColor = (status: string | null) => {
      switch (status) {
        case "pending":
          return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300";
        case "signed":
          return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
        case "delivered":
          return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
        default:
          return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300";
      }
    };

    return (
      <Card key={order.id} className="hover-elevate">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">
                {order.origin} → {order.destination}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Nº {order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge className={`${getStatusColor(noteStatus)}`}>
                {noteStatus === "signed" && "Firmado"}
                {noteStatus === "delivered" && "Entregado"}
                {!noteStatus && "Pendiente"}
              </Badge>
              {order.isUrgent && (
                <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                  Urgente
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Distancia</p>
              <p className="font-semibold">{(order.distance || 0).toFixed(1)} km</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Precio</p>
              <p className="font-semibold">{(order.totalPrice || 0).toFixed(2)}€</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Cliente</p>
              <p className="font-semibold text-xs">{order.customerName}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Teléfono</p>
              <p className="font-semibold text-xs">{order.phoneNumber}</p>
            </div>
          </div>

          {order.pickupTime && (
            <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded">
              <p className="text-xs text-muted-foreground">Recogida solicitada</p>
              <p className="text-sm font-mono">{order.pickupTime}</p>
            </div>
          )}

          {order.observations && (
            <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded">
              <p className="text-xs text-muted-foreground">Observaciones</p>
              <p className="text-sm">{order.observations}</p>
            </div>
          )}

          {showGenerateBtn && !noteStatus && (
            <Button
              onClick={() => openDeliveryModal(order)}
              className="w-full bg-green-600/85 hover:bg-green-700/85 dark:bg-green-600/85 dark:hover:bg-green-700/85 text-white px-4 py-2 rounded-lg backdrop-blur-sm border border-green-500/40"
              data-testid={`button-generate-delivery-note-${order.id}`}
            >
              Generar Albarán
            </Button>
          )}

          {noteStatus && (
            <div className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-center text-sm font-medium">
              Albarán {noteStatus === "signed" ? "Firmado" : "Entregado"}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="relative">
      <AnimatedPageBackground />
      <div className="relative z-10 space-y-6 p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold">Mis Servicios</h1>
            <p className="text-sm text-muted-foreground mt-1">Trabajador: {user?.username}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToSelection}
            className="gap-2 w-full md:w-auto"
            data-testid="button-back-to-worker-selection"
          >
            <Home className="h-4 w-4" />
            Inicio
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 mb-6">
          <Card className="hover-elevate">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Albaranes Totales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Hoy</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {getTodayDeliveryNotes().length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Este Mes</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {getMonthDeliveryNotes().length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate cursor-pointer" onClick={() => setCreateDeliveryOpen(true)}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Hacer Albarán
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center min-h-24">
                <Button
                  className="w-full bg-purple-600/85 hover:bg-purple-700/85 dark:bg-purple-600/85 dark:hover:bg-purple-700/85 text-white"
                  onClick={() => setCreateDeliveryOpen(true)}
                >
                  Crear Nuevo Albarán
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No hay servicios asignados</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="pending" className="relative">
                Pendientes
                {pendingOrders.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingOrders.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="signed">
                Firmados
                {signedOrders.length > 0 && (
                  <span className="ml-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {signedOrders.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="delivered">
                Entregados
                {deliveredOrders.length > 0 && (
                  <span className="ml-2 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {deliveredOrders.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pendingOrders.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">No hay servicios pendientes</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {pendingOrders.map((order: Quote) => renderOrderCard(order, true))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="signed" className="space-y-4">
              {signedOrders.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">No hay servicios firmados</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {signedOrders.map((order: Quote) => renderOrderCard(order, false))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="delivered" className="space-y-4">
              {deliveredOrders.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">No hay servicios entregados</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {deliveredOrders.map((order: Quote) => renderOrderCard(order, false))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <DeliveryNoteGenerator
        open={deliveryModalOpen}
        onOpenChange={setDeliveryModalOpen}
        quote={selectedOrder}
        workerId={user?.workerId}
      />

      <Dialog open={createDeliveryOpen} onOpenChange={setCreateDeliveryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Albarán</DialogTitle>
            <DialogDescription>
              Completa los datos del albarán para registrar la entrega
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nombre del Cliente</label>
              <Input
                placeholder="Ej: Juan García"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Origen (Recogida)</label>
              <Input
                placeholder="Ej: Calle Principal, 123"
                value={formData.pickupOrigin}
                onChange={(e) => setFormData({ ...formData, pickupOrigin: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Destino</label>
              <Input
                placeholder="Ej: Avenida Central, 456"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de Vehículo</label>
              <div className="grid grid-cols-2 gap-2">
                {["Moto", "Furgoneta", "Furgón", "Carrozado"].map((tipo) => (
                  <Button
                    key={tipo}
                    type="button"
                    variant={formData.vehicleType === tipo ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, vehicleType: tipo })}
                    className="text-xs"
                  >
                    {tipo}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Fecha</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Hora</label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Observaciones</label>
              <Textarea
                placeholder="Notas adicionales sobre el albarán..."
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setCreateDeliveryOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  try {
                    if (!user?.workerId) {
                      console.error("No workerId available:", { userId: user?.id, workerId: user?.workerId });
                      return;
                    }

                    const deliveryNoteData = {
                      quoteId: `custom-${Date.now()}`,
                      workerId: user.workerId,
                      clientName: formData.clientName,
                      pickupOrigin: formData.pickupOrigin,
                      destination: formData.destination,
                      vehicleType: formData.vehicleType,
                      date: formData.date,
                      time: formData.time,
                      observations: formData.observations,
                      status: "signed",
                      signedAt: new Date().toISOString(),
                    };
                    
                    console.log("Saving delivery note with:", deliveryNoteData);

                    const response = await fetch("/api/delivery-notes", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(deliveryNoteData),
                      credentials: "include",
                    });

                    if (response.ok) {
                      console.log("Albarán guardado:", deliveryNoteData);
                      // Invalidar la cache para que se recarguen los albaranes
                      queryClient.invalidateQueries({
                        queryKey: ["/api/workers", user?.workerId || "", "delivery-notes"],
                      });
                      setCreateDeliveryOpen(false);
                      setFormData({
                        clientName: "",
                        pickupOrigin: "",
                        destination: "",
                        vehicleType: "Furgoneta",
                        date: new Date().toISOString().split("T")[0],
                        time: "09:00",
                        observations: "",
                      });
                    }
                  } catch (error) {
                    console.error("Error guardando albarán:", error);
                  }
                }}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Guardar Albarán
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
