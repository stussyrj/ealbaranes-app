import { PricingRulesAdmin } from "@/components/PricingRulesAdmin";

export default function AdminPricingPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Administración de Precios</h1>
        <p className="text-muted-foreground mt-1">
          Configura las tarifas por zona, precios base y recargos
        </p>
      </div>
      <PricingRulesAdmin />
    </div>
  );
}
