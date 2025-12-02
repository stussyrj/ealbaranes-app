import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Truck, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";

interface Price {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: { interval: string } | null;
}

interface Product {
  id: string;
  name: string;
  description: string;
  prices: Price[];
}

export default function PricingPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedInterval, setSelectedInterval] = useState<"month" | "year">("month");

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/stripe/products"],
  });

  const checkoutMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const response = await apiRequest("POST", "/api/stripe/checkout", { priceId });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  const handleSubscribe = (priceId: string) => {
    if (!user) {
      setLocation("/register");
      return;
    }
    checkoutMutation.mutate(priceId);
  };

  const features = [
    "Gestión ilimitada de presupuestos",
    "Asignación de trabajadores",
    "Albaranes digitales con firma",
    "Cálculo automático de distancias",
    "Múltiples tipos de vehículo",
    "Recargo por urgencia",
    "Exportar albaranes como imagen",
    "Soporte por email",
  ];

  const getPrice = (prices: Price[], interval: string) => {
    return prices.find((p) => p.recurring?.interval === interval);
  };

  const formatPrice = (amount: number) => {
    return (amount / 100).toFixed(2).replace(".", ",");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Truck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">DirectTransports Pro</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Gestiona tus presupuestos y albaranes de transporte de forma profesional
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border p-1 bg-muted">
            <button
              onClick={() => setSelectedInterval("month")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedInterval === "month"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="button-monthly"
            >
              Mensual
            </button>
            <button
              onClick={() => setSelectedInterval("year")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedInterval === "year"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="button-yearly"
            >
              Anual
              <span className="ml-1 text-xs text-green-600 dark:text-green-400">-17%</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : products && products.length > 0 ? (
          <div className="max-w-md mx-auto">
            {products.map((product) => {
              const price = getPrice(product.prices, selectedInterval);
              if (!price) return null;

              return (
                <Card key={product.id} className="border-primary">
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{product.name}</CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{formatPrice(price.unit_amount)}€</span>
                      <span className="text-muted-foreground">
                        /{selectedInterval === "month" ? "mes" : "año"}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => handleSubscribe(price.id)}
                      disabled={checkoutMutation.isPending}
                      data-testid="button-subscribe"
                    >
                      {checkoutMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Procesando...
                        </>
                      ) : user ? (
                        "Suscribirse"
                      ) : (
                        "Crear cuenta y suscribirse"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">DirectTransports Pro</CardTitle>
              <CardDescription>Plan de suscripción empresarial</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">
                  {selectedInterval === "month" ? "29,00" : "290,00"}€
                </span>
                <span className="text-muted-foreground">
                  /{selectedInterval === "month" ? "mes" : "año"}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                onClick={() => setLocation("/register")}
                data-testid="button-register"
              >
                Crear cuenta gratuita
              </Button>
            </CardFooter>
          </Card>
        )}

        <p className="text-center text-sm text-muted-foreground mt-8">
          Prueba gratuita de 14 días. Cancela en cualquier momento.
        </p>
      </div>
    </div>
  );
}
