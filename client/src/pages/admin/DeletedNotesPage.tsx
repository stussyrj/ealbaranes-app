import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, RotateCcw, Eye, FileText, Calendar, User, MapPin, Truck } from "lucide-react";
import type { DeliveryNote } from "@shared/schema";

interface DeletedNote extends DeliveryNote {
  workerName?: string;
}

export default function DeletedNotesPage() {
  const { toast } = useToast();
  const [selectedNote, setSelectedNote] = useState<DeletedNote | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [noteToRestore, setNoteToRestore] = useState<DeletedNote | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<DeletedNote | null>(null);

  const { data: deletedNotes = [], isLoading } = useQuery<DeletedNote[]>({
    queryKey: ["/api/admin/delivery-notes/deleted"],
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/admin/delivery-notes/${id}/restore`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al restaurar albarán");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/delivery-notes/deleted"] });
      queryClient.invalidateQueries({ queryKey: ["/api/delivery-notes"] });
      setNoteToRestore(null);
      toast({
        title: "Albarán restaurado",
        description: "El albarán se ha restaurado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo restaurar el albarán",
        variant: "destructive",
      });
    },
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/delivery-notes/${id}/permanent`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al eliminar albarán");
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/delivery-notes/deleted"] });
      setNoteToDelete(null);
      toast({
        title: "Albarán eliminado",
        description: "El albarán se ha eliminado permanentemente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el albarán",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Sin fecha";
    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatDeletedAt = (date: Date | string | null | undefined) => {
    if (!date) return "Fecha desconocida";
    try {
      return new Date(date).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Fecha inválida";
    }
  };

  const getOriginText = (note: DeletedNote) => {
    if (note.pickupOrigins && Array.isArray(note.pickupOrigins) && note.pickupOrigins.length > 0) {
      return note.pickupOrigins.map(o => o.name || o.address).join(", ");
    }
    return "Sin origen";
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6" data-testid="loading-deleted-notes">
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Trash2 className="h-6 w-6 text-muted-foreground" />
            <div>
              <CardTitle data-testid="text-deleted-notes-title">Albaranes Eliminados</CardTitle>
              <CardDescription>
                Gestiona los albaranes que han sido eliminados. Puedes restaurarlos o eliminarlos permanentemente.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {deletedNotes.length === 0 ? (
            <div className="text-center py-12" data-testid="empty-deleted-notes">
              <Trash2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No hay albaranes eliminados</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Los albaranes que elimines aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" data-testid="badge-deleted-count">
                  {deletedNotes.length} albarán{deletedNotes.length !== 1 ? "es" : ""} eliminado{deletedNotes.length !== 1 ? "s" : ""}
                </Badge>
              </div>
              <div className="grid gap-4">
                {deletedNotes.map((note) => (
                  <Card key={note.id} className="hover-elevate" data-testid={`card-deleted-note-${note.id}`}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" data-testid={`badge-note-number-${note.id}`}>
                              <FileText className="h-3 w-3 mr-1" />
                              #{note.noteNumber}
                            </Badge>
                            {note.clientName && (
                              <span className="text-sm font-medium truncate" data-testid={`text-client-${note.id}`}>
                                {note.clientName}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(note.date)}
                            </span>
                            {note.workerName && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {note.workerName}
                              </span>
                            )}
                            {note.vehicleType && (
                              <span className="flex items-center gap-1">
                                <Truck className="h-3 w-3" />
                                {note.vehicleType}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{getOriginText(note)}</span>
                            {note.destination && (
                              <>
                                <span className="mx-1">&rarr;</span>
                                <span className="truncate">{note.destination}</span>
                              </>
                            )}
                          </div>
                          <p className="text-xs text-destructive">
                            Eliminado: {formatDeletedAt(note.deletedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedNote(note);
                              setIsDetailsOpen(true);
                            }}
                            data-testid={`button-view-${note.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setNoteToRestore(note)}
                            data-testid={`button-restore-${note.id}`}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setNoteToDelete(note)}
                            data-testid={`button-permanent-delete-${note.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalles del Albarán #{selectedNote?.noteNumber}</DialogTitle>
            <DialogDescription>
              Información completa del albarán eliminado
            </DialogDescription>
          </DialogHeader>
          {selectedNote && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Cliente:</span>
                  <p className="font-medium">{selectedNote.clientName || "Sin cliente"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fecha:</span>
                  <p className="font-medium">{formatDate(selectedNote.date)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Trabajador:</span>
                  <p className="font-medium">{selectedNote.workerName || "Desconocido"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Vehículo:</span>
                  <p className="font-medium">{selectedNote.vehicleType || "Sin especificar"}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Origen:</span>
                  <p className="font-medium">{getOriginText(selectedNote)}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Destino:</span>
                  <p className="font-medium">{selectedNote.destination || "Sin destino"}</p>
                </div>
                {selectedNote.observations && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Observaciones:</span>
                    <p className="font-medium">{selectedNote.observations}</p>
                  </div>
                )}
                <div className="col-span-2 pt-2 border-t">
                  <span className="text-muted-foreground text-xs">Eliminado:</span>
                  <p className="text-destructive text-sm">{formatDeletedAt(selectedNote.deletedAt)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (selectedNote) {
                  setNoteToRestore(selectedNote);
                  setIsDetailsOpen(false);
                }
              }}
              data-testid="button-restore-from-dialog"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedNote) {
                  setNoteToDelete(selectedNote);
                  setIsDetailsOpen(false);
                }
              }}
              data-testid="button-delete-from-dialog"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!noteToRestore} onOpenChange={() => setNoteToRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar albarán</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres restaurar el albarán #{noteToRestore?.noteNumber}? 
              Volverá a aparecer en la lista de albaranes activos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-restore">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => noteToRestore && restoreMutation.mutate(noteToRestore.id)}
              disabled={restoreMutation.isPending}
              data-testid="button-confirm-restore"
            >
              {restoreMutation.isPending ? "Restaurando..." : "Restaurar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!noteToDelete} onOpenChange={() => setNoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar permanentemente</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar permanentemente el albarán #{noteToDelete?.noteNumber}? 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => noteToDelete && permanentDeleteMutation.mutate(noteToDelete.id)}
              disabled={permanentDeleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-permanent-delete"
            >
              {permanentDeleteMutation.isPending ? "Eliminando..." : "Eliminar permanentemente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
