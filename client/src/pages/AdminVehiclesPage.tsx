import { VehicleTypesAdmin } from "@/components/VehicleTypesAdmin";

export default function AdminVehiclesPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Tipos de Vehículo</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona los servicios disponibles: Moto, Furgoneta, Furgón y Carrozado
        </p>
      </div>
      <VehicleTypesAdmin />
    </div>
  );
}
