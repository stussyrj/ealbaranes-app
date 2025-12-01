import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnimatedPageBackground } from "@/components/AnimatedPageBackground";
import type { Quote } from "@shared/schema";

export default function WorkerDashboard() {
  const { user } = useAuth();

  const { data: orders = [] } = useQuery<Quote[]>({
    queryKey: ["/api/workers", user?.workerId || "", "orders"],
    enabled: !!user?.workerId,
  });

  return (
    <div className="relative">
      <AnimatedPageBackground />
      <div className="relative z-10 space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold">Mis Pedidos</h1>
          <p className="text-muted-foreground">Trabajador: {user?.username}</p>
        </div>

        {(orders as Quote[]).length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No hay pedidos asignados</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {orders.map((order: Quote) => (
              <Card key={order.id} className="hover-elevate">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {order.origin} → {order.destination}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Distancia</p>
                      <p className="font-semibold">{order.distance} km</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Precio</p>
                      <p className="font-semibold">{order.totalPrice.toFixed(2)}€</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cliente</p>
                      <p className="font-semibold">{order.customerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estado</p>
                      <p className="font-semibold capitalize">{order.status}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button 
                      className="flex-1 bg-blue-600/85 hover:bg-blue-700/85 dark:bg-blue-600/85 dark:hover:bg-blue-700/85 text-white px-4 py-2 rounded-lg backdrop-blur-sm border border-blue-500/40"
                      data-testid={`button-view-details-${order.id}`}
                    >
                      Ver Detalles
                    </Button>
                    <Button 
                      className="flex-1 bg-green-600/85 hover:bg-green-700/85 dark:bg-green-600/85 dark:hover:bg-green-700/85 text-white px-4 py-2 rounded-lg backdrop-blur-sm border border-green-500/40"
                      data-testid={`button-generate-delivery-note-${order.id}`}
                    >
                      Generar Albarán
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
