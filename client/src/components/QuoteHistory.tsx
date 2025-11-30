import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Calendar, MapPin, Truck, Filter, ChevronLeft, ChevronRight, Eye, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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
import type { Quote } from "@shared/schema";

const ITEMS_PER_PAGE = 10;

export function QuoteHistory() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  const { data: quotes, isLoading } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
  });

  const filteredQuotes = quotes?.filter((quote) => {
    const matchesSearch =
      search === "" ||
      quote.origin.toLowerCase().includes(search.toLowerCase()) ||
      quote.destination.toLowerCase().includes(search.toLowerCase()) ||
      quote.vehicleTypeName?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || quote.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const totalPages = Math.ceil(filteredQuotes.length / ITEMS_PER_PAGE);
  const paginatedQuotes = filteredQuotes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatDate = (date: Date | string | null) => {
    if (!date) return "—";
    const d = new Date(date);
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Aprobado</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rechazado</Badge>;
      case "pending":
      default:
        return <Badge variant="secondary">Pendiente</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Presupuestos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Historial de Presupuestos
              </CardTitle>
              <CardDescription>
                {filteredQuotes.length} presupuesto{filteredQuotes.length !== 1 ? "s" : ""} encontrado{filteredQuotes.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por origen, destino o vehículo..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
                data-testid="input-search-quotes"
              />
            </div>
            <Select 
              value={statusFilter} 
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="approved">Aprobado</SelectItem>
                <SelectItem value="rejected">Rechazado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paginatedQuotes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No se encontraron presupuestos</p>
              <p className="text-sm">Crea tu primer presupuesto desde el Dashboard</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Vehículo</TableHead>
                      <TableHead className="text-right">Distancia</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedQuotes.map((quote) => (
                      <TableRow key={quote.id} data-testid={`row-quote-${quote.id}`}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(quote.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-green-600 flex-shrink-0" />
                            <span className="max-w-[150px] truncate">{quote.origin}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-red-600 flex-shrink-0" />
                            <span className="max-w-[150px] truncate">{quote.destination}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Truck className="h-3 w-3 flex-shrink-0" />
                            <span>{quote.vehicleTypeName || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {quote.distance.toFixed(1)} km
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {quote.totalPrice.toFixed(2)}€
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(quote.status)}
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
                              onClick={() => console.log("Duplicate quote:", quote.id)}
                              data-testid={`button-duplicate-${quote.id}`}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      data-testid="button-next-page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedQuote} onOpenChange={() => setSelectedQuote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles del Presupuesto</DialogTitle>
            <DialogDescription>
              Creado el {selectedQuote && formatDate(selectedQuote.createdAt)}
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
                  <p className="font-mono font-semibold">{selectedQuote.distance.toFixed(1)} km</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vehículo</p>
                  <p className="font-medium">{selectedQuote.vehicleTypeName || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Zona</p>
                  <p className="font-medium">{selectedQuote.zoneName || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  {getStatusBadge(selectedQuote.status)}
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Precio base</span>
                  <span className="font-mono">{selectedQuote.basePrice.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Coste distancia</span>
                  <span className="font-mono">{selectedQuote.distanceCost.toFixed(2)}€</span>
                </div>
                {selectedQuote.tollCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Peajes</span>
                    <span className="font-mono">{selectedQuote.tollCost.toFixed(2)}€</span>
                  </div>
                )}
                {selectedQuote.extrasCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Extras</span>
                    <span className="font-mono">{selectedQuote.extrasCost.toFixed(2)}€</span>
                  </div>
                )}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total</span>
                    <span className="text-2xl font-bold font-mono text-primary">
                      {selectedQuote.totalPrice.toFixed(2)}€
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
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
