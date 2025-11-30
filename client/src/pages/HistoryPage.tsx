import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HistoryPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Historial de Presupuestos</h1>
        <p className="text-muted-foreground mt-1">
          Consulta y gestiona todos tus presupuestos anteriores
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Tus Presupuestos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Aún no tienes presupuestos guardados
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
