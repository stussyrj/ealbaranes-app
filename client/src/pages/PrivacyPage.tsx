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
                <li>Datos de los albaranes: información de entregas, fotografías, firmas digitales</li>
                <li>Datos de uso: información sobre cómo utiliza nuestro servicio</li>
                <li>Datos de pago: procesados de forma segura a través de [REDACTED-STRIPE]
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold">3. Finalidad del Tratamiento</h3>
              <p className="text-muted-foreground">
                Sus datos personales serán tratados para las siguientes finalidades:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Prestación del servicio de gestión de albaranes</li>
                <li>Gestión de su cuenta y suscripción</li>
                <li>Comunicaciones relacionadas con el servicio</li>
                <li>Mejora de nuestros servicios</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold">4. Base Legal</h3>
              <p className="text-muted-foreground">
                El tratamiento de sus datos se basa en la ejecución de un contrato (la prestación del servicio) 
                y en su consentimiento expreso para las comunicaciones comerciales.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold">5. Conservación de Datos</h3>
              <p className="text-muted-foreground">
                Sus datos se conservarán mientras mantenga su cuenta activa. Tras la cancelación, los datos 
                se mantendrán durante 90 días antes de su eliminación definitiva, excepto aquellos que debamos 
                conservar por obligaciones legales.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold">6. Seguridad</h3>
              <p className="text-muted-foreground">
                Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos personales 
                contra acceso no autorizado, alteración, divulgación o destrucción.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold">7. Sus Derechos</h3>
              <p className="text-muted-foreground">
                De acuerdo con el RGPD, usted tiene derecho a:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Acceder a sus datos personales</li>
                <li>Rectificar datos inexactos</li>
                <li>Solicitar la supresión de sus datos</li>
                <li>Oponerse al tratamiento</li>
                <li>Solicitar la portabilidad de sus datos</li>
                <li>Presentar una reclamación ante la AEPD</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold">8. Cookies</h3>
              <p className="text-muted-foreground">
                Utilizamos cookies técnicas necesarias para el funcionamiento del servicio y cookies de sesión 
                para mantener su autenticación.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold">9. Contacto</h3>
              <p className="text-muted-foreground">
                Para ejercer sus derechos o realizar cualquier consulta sobre el tratamiento de sus datos, 
                puede contactarnos en: privacidad@ealbaranes.es
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
