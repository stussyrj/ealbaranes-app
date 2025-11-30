import { QuoteCalculatorAdvanced } from "@/components/QuoteCalculatorAdvanced";

export default function QuotePage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Nuevo Presupuesto</h1>
        <p className="text-muted-foreground mt-1">
          Calcula el precio del transporte introduciendo origen, destino y tipo de vehículo
        </p>
      </div>
      <QuoteCalculatorAdvanced />
    </div>
  );
}
