import { Calculator, TrendingUp, MapPin, Truck } from "lucide-react";
import { StatCard } from "@/components/StatCard";

const mockStats = {
  totalQuotes: 156,
  monthlyRevenue: 24350,
  averageDistance: 245,
  activeVehicles: 5,
};

export default function DashboardPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Resumen de actividad y calculadora de presupuestos
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Presupuestos"
          value={mockStats.totalQuotes}
          subtitle="Este mes"
          icon={Calculator}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Ingresos"
          value={`${mockStats.monthlyRevenue.toLocaleString("es-ES")}€`}
          subtitle="Este mes"
          icon={TrendingUp}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Distancia Media"
          value={`${mockStats.averageDistance} km`}
          subtitle="Por presupuesto"
          icon={MapPin}
        />
        <StatCard
          title="Vehículos Activos"
          value={mockStats.activeVehicles}
          subtitle="Tipos configurados"
          icon={Truck}
        />
      </div>
    </div>
  );
}
