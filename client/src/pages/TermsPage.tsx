import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
            <CardTitle className="text-2xl" data-testid="text-terms-title">
              Términos y Condiciones de Uso
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Última actualización: Diciembre 2024
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h3 className="text-lg font-semibold">1. Aceptación de los Términos</h3>
              <p className="text-muted-foreground">
                Al acceder y utilizar eAlbarán, usted acepta estar sujeto a estos términos y condiciones de uso. 
                Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestro servicio.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold">2. Descripción del Servicio</h3>
              <p className="text-muted-foreground">
                eAlbarán es una plataforma de gestión digital de albaranes de transporte que permite a las empresas 
                crear, gestionar y almacenar albaranes digitales con fotografías y firmas electrónicas.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold">3. Registro y Cuenta</h3>
              <p className="text-muted-foreground">
                Para utilizar el servicio, debe registrarse proporcionando información veraz y actualizada. 
                Usted es responsable de mantener la confidencialidad de su cuenta y contraseña.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold">4. Suscripción y Pagos</h3>
              <p className="text-muted-foreground">
                El acceso al servicio requiere una suscripción de pago. Los precios están indicados en nuestra 
                página de precios. Las suscripciones se renuevan automáticamente salvo cancelación previa.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold">5. Uso Aceptable</h3>
              <p className="text-muted-foreground">
                Usted se compromete a utilizar el servicio únicamente para fines legales y de acuerdo con estos 
                términos. No debe utilizar el servicio para actividades ilegales o no autorizadas.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold">6. Propiedad Intelectual</h3>
              <p className="text-muted-foreground">
                El servicio y su contenido original son propiedad de eAlbarán y están protegidos por las leyes 
                de propiedad intelectual aplicables.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold">7. Limitación de Responsabilidad</h3>
              <p className="text-muted-foreground">
                eAlbarán no será responsable de daños indirectos, incidentales o consecuentes que resulten del 
                uso o la imposibilidad de uso del servicio.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold">8. Modificaciones</h3>
              <p className="text-muted-foreground">
                Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán 
                en vigor tras su publicación en el sitio web.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold">9. Contacto</h3>
              <p className="text-muted-foreground">
                Para cualquier consulta sobre estos términos, puede contactarnos en: contacto@ealbaranes.es
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
