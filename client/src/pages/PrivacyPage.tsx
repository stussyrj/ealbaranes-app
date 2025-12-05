import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/register">
          <Button variant="ghost" className="mb-6" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al registro
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl" data-testid="text-privacy-title">
              Política de Privacidad
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Última actualización: Diciembre 2024
            </p>
          </CardHeader>

          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h3 className="text-lg font-semibold">1. Responsable del Tratamiento</h3>
              <p className="text-muted-foreground">
                El responsable del tratamiento de sus datos personales es eAlbarán, con domicilio en España.
                Puede contactarnos en: privacidad@ealbaranes.es
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold">2. Datos que Recopilamos</h3>
              <p className="text-muted-foreground">
                Recopilamos los siguientes tipos de datos personales:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Datos de identificación: nombre, email, nombre de empresa</li>
                <li>Datos de los albaranes: entregas, fotografías, firmas digitales</li>
                <li>Datos de uso: cómo utiliza nuestro servicio</li>
                <li>Datos de pago: procesados a través de [REDACTED-STRIPE]</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold">3. Finalidad del Tratamiento</h3>
              <p className="text-muted-foreground">
                Sus datos personales serán tratados para:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Gestión de albaranes</li>
                <li>Gestión de su cuenta y suscripción</li>
                <li>Comunicaciones del servicio</li>
                <li>Mejoras internas</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold">4. Base Legal</h3>
              <p className="text-muted-foreground">
                La base del tratamiento es el contrato del servicio y su consentimiento para comunicaciones comerciales.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold">5. Conservación</h3>
              <p className="text-muted-foreground">
                Conservamos sus datos mientras tenga cuenta activa, y 90 días después de eliminarla.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold">6. Seguridad</h3>
              <p className="text-muted-foreground">
                Aplicamos medidas técnicas y organizativas para evitar accesos no autorizados.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold">7. Sus Derechos</h3>
              <p className="text-muted-foreground">Usted puede:</p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Acceder a sus datos</li>
                <li>Rectificarlos</li>
                <li>Solicitar su eliminación</li>
                <li>Oponerse al tratamiento</li>
                <li>Solicitar portabilidad</li>
                <li>Reclamar ante la AEPD</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold">8. Cookies</h3>
              <p className="text-muted-foreground">
                Solo usamos cookies técnicas y de sesión necesarias para autenticación.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold">9. Contacto</h3>
              <p className="text-muted-foreground">
                Para ejercer derechos: privacidad@ealbaranes.es
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}