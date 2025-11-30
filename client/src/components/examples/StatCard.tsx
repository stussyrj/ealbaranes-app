import { StatCard } from "../StatCard";
import { Calculator } from "lucide-react";

export default function StatCardExample() {
  return (
    <StatCard
      title="Presupuestos"
      value="156"
      subtitle="Este mes"
      icon={Calculator}
      trend={{ value: 12, isPositive: true }}
    />
  );
}
