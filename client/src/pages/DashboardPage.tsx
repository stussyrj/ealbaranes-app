import { Calculator, TrendingUp, MapPin, Truck } from "lucide-react";
import { StatCard } from "@/components/StatCard";

export default function DashboardPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Presupuestos" value="0" subtitle="Este mes" icon={Calculator} />
        <StatCard title="Ingresos" value="0€" subtitle="Este mes" icon={TrendingUp} />
        <StatCard title="Dist. Media" value="0 km" subtitle="Por presupuesto" icon={MapPin} />
        <StatCard title="Vehículos" value="4" subtitle="Tipos" icon={Truck} />
      </div>
    </div>
  );
}
