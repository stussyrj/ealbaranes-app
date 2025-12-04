import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, AlertTriangle, CheckCircle, Clock, Loader2, Gift } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";

export default function SubscriptionPage() {
  const { user } = useAuth();

  const { data: subscriptionData, isLoading } = useQuery<{
    subscription: any;
    status: string;
    disabled?: boolean;
    message?: string;
    companyName?: string;
  }>({
    queryKey: ["/api/subscription"],
    enabled: !!user?.isAdmin,
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/stripe/portal");
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  const is[REDACTED-STRIPE] = subscriptionData?.disabled === true;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Activa
          </Badge>
        );
      case "past_due":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Pago pendiente
          </Badge>
        );
      case "in_grace":
        return (
          <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Período de gracia
          </Badge>
        );
      case "canceled":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Cancelada
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        );
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Acceso Restringido</CardTitle>
            <CardDescription>
              Solo la cuenta de empresa puede gestionar la suscripción.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (is[REDACTED-STRIPE] {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Gestión de Suscripción</h1>
          
          <div className="space-y-6">
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="h-5 w-5 text-green-600" />
                      Período de Prueba Gratuito
                    </CardTitle>
                    <CardDescription>
                      Disfruta de todas las funciones de eAlbarán sin costo
                    </CardDescription>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Activo
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Gift className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">
                        Acceso completo sin restricciones
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Estás disfrutando de un período de prueba gratuito con acceso a todas 
                        las funcionalidades de eAlbarán. Los pagos estarán disponibles próximamente.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Plan</p>
                    <p className="font-medium">eAlbarán Pro (Prueba)</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <p className="font-medium text-green-600">Prueba Gratuita</p>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Próximamente:</strong> Los pagos y suscripciones estarán disponibles muy pronto. 
                    Te notificaremos cuando puedas activar tu suscripción.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Funciones Incluidas</CardTitle>
                <CardDescription>
                  Todo lo que puedes hacer durante el período de prueba
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Crear albaranes digitales ilimitados
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Añadir fotos y firmas electrónicas
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Gestionar trabajadores
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Descargar albaranes en ZIP
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Control de facturación
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Gestión de Suscripción</h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Tu Suscripción
                    </CardTitle>
                    <CardDescription>
                      Estado actual de tu plan eAlbarán Pro
                    </CardDescription>
                  </div>
                  {subscriptionData && getStatusBadge(subscriptionData.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {user.subscription?.isInGrace && (
                  <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                    <div className="flex gap-3">
                      <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-orange-800 dark:text-orange-200">
                          Período de gracia activo
                        </p>
                        <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                          Tu suscripción ha sido cancelada. Tienes 30 días para reactivarla
                          antes de que tu cuenta pase a modo de solo lectura.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {user.subscription?.isReadOnly && (
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800 dark:text-red-200">
                          Cuenta en modo de solo lectura
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                          No puedes crear nuevos albaranes. Reactiva tu suscripción
                          para continuar usando todas las funciones.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Plan</p>
                    <p className="font-medium">eAlbarán Pro</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <p className="font-medium capitalize">
                      {subscriptionData?.status === "active" ? "Activo" :
                       subscriptionData?.status === "past_due" ? "Pago pendiente" :
                       subscriptionData?.status === "in_grace" ? "Período de gracia" :
                       subscriptionData?.status === "canceled" ? "Cancelado" :
                       subscriptionData?.status || "Sin suscripción"}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => portalMutation.mutate()}
                  disabled={portalMutation.isPending}
                  className="w-full"
                  data-testid="button-manage-subscription"
                >
                  {portalMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Abriendo portal...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Gestionar Suscripción
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Información de Facturación</CardTitle>
                <CardDescription>
                  Gestiona tu método de pago y descarga facturas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Haz clic en "Gestionar Suscripción" para acceder al portal de [REDACTED-STRIPE]
                  donde podrás:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc list-inside">
                  <li>Actualizar tu método de pago</li>
                  <li>Descargar facturas</li>
                  <li>Cambiar tu plan de suscripción</li>
                  <li>Cancelar tu suscripción</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
