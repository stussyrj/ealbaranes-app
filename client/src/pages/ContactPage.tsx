import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-semibold mb-6">Contacto</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Teléfono
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">+34 600 000 000</p>
            <p className="text-sm text-muted-foreground mt-2">Disponible de 8:00 a 20:00</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">carlos@transporte.com</p>
            <p className="text-sm text-muted-foreground mt-2">Respuesta en 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Ubicación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">Terrassa, Barcelona</p>
            <p className="text-sm text-muted-foreground mt-2">España</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>¿Problema con tu presupuesto?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Si tienes cualquier duda o inconveniente con el cálculo de tu presupuesto, no dudes en ponerte en contacto. 
            Estoy disponible para ayudarte a resolver cualquier problema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
