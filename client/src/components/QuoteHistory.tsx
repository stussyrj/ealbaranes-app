import { useState } from "react";
import { Eye, Copy, Search, Filter, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// todo: remove mock functionality - replace with actual quotes from API
const mockQuotes = [
  {
    id: "Q001",
    date: "2024-01-15",
    origin: "Madrid Centro",
    destination: "Barcelona Zona Franca",
    distance: 621,
    vehicle: "Tráiler (24t)",
    total: 1794.85,
    status: "confirmed",
  },
  {
    id: "Q002",
    date: "2024-01-14",
    origin: "Valencia Puerto",
    destination: "Zaragoza Industrial",
    distance: 298,
    vehicle: "Camión Grande (12t)",
    total: 650.80,
    status: "pending",
  },
  {
    id: "Q003",
    date: "2024-01-13",
    origin: "Bilbao",
    destination: "San Sebastián",
    distance: 102,
    vehicle: "Furgoneta",
    total: 111.70,
    status: "confirmed",
  },
  {
    id: "Q004",
    date: "2024-01-12",
    origin: "Sevilla",
    destination: "Málaga",
    distance: 219,
    vehicle: "Camión Mediano (7.5t)",
    total: 386.35,
    status: "expired",
  },
  {
    id: "Q005",
    date: "2024-01-11",
    origin: "Alicante",
    destination: "Murcia",
    distance: 81,
    vehicle: "Camión Pequeño (3.5t)",
    total: 122.20,
    status: "confirmed",
  },
];

const statusConfig = {
  confirmed: { label: "Confirmado", variant: "default" as const },
  pending: { label: "Pendiente", variant: "secondary" as const },
  expired: { label: "Expirado", variant: "outline" as const },
};

export function QuoteHistory() {
  const [search, setSearch] = useState("");
  const [selectedQuote, setSelectedQuote] = useState<typeof mockQuotes[0] | null>(null);

  const filteredQuotes = mockQuotes.filter(
    (q) =>
      q.origin.toLowerCase().includes(search.toLowerCase()) ||
      q.destination.toLowerCase().includes(search.toLowerCase()) ||
      q.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleDuplicate = (quote: typeof mockQuotes[0]) => {
    console.log("Duplicating quote:", quote.id);
    // todo: remove mock functionality - implement actual quote duplication
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Historial de Presupuestos</CardTitle>
              <CardDescription>
                Consulta y gestiona todos tus presupuestos anteriores
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-64"
                  data-testid="input-search-quotes"
                />
              </div>
              <Button variant="outline" size="icon" data-testid="button-filter">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">
                    <Button variant="ghost" className="gap-1 -ml-3">
                      ID
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" className="gap-1 -ml-3">
                      Fecha
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Ruta</TableHead>
                  <TableHead className="text-right">Distancia</TableHead>
                  <TableHead>Vehículo</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No se encontraron presupuestos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotes.map((quote) => (
                    <TableRow key={quote.id} data-testid={`row-quote-${quote.id}`}>
                      <TableCell className="font-mono text-sm">{quote.id}</TableCell>
                      <TableCell className="text-muted-foreground">{quote.date}</TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <p className="truncate font-medium">{quote.origin}</p>
                          <p className="truncate text-sm text-muted-foreground">
                            → {quote.destination}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">{quote.distance} km</TableCell>
                      <TableCell className="text-sm">{quote.vehicle}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {quote.total.toFixed(2)}€
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[quote.status as keyof typeof statusConfig].variant}>
                          {statusConfig[quote.status as keyof typeof statusConfig].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedQuote(quote)}
                            data-testid={`button-view-${quote.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDuplicate(quote)}
                            data-testid={`button-duplicate-${quote.id}`}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedQuote} onOpenChange={() => setSelectedQuote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles del Presupuesto {selectedQuote?.id}</DialogTitle>
            <DialogDescription>
              Creado el {selectedQuote?.date}
            </DialogDescription>
          </DialogHeader>
          {selectedQuote && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Origen</p>
                  <p className="font-medium">{selectedQuote.origin}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Destino</p>
                  <p className="font-medium">{selectedQuote.destination}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Distancia</p>
                  <p className="font-mono font-semibold">{selectedQuote.distance} km</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vehículo</p>
                  <p className="font-medium">{selectedQuote.vehicle}</p>
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total</span>
                  <span className="text-2xl font-bold font-mono text-primary">
                    {selectedQuote.total.toFixed(2)}€
                  </span>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={() => handleDuplicate(selectedQuote)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicar
                </Button>
                <Button variant="outline" onClick={() => setSelectedQuote(null)}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
