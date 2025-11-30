import { QuoteHistory } from "@/components/QuoteHistory";

export default function HistoryPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Historial de Presupuestos</h1>
        <p className="text-muted-foreground mt-1">
          Consulta y gestiona todos tus presupuestos anteriores
        </p>
      </div>
      <QuoteHistory />
    </div>
  );
}
