import { MapPin, Clock, Truck, User, Calendar, FileText, CheckCircle, Timer, Camera, Edit2, ArrowRight, CircleDot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PickupOrigin } from "@shared/schema";

// Helper to format a single origin for display
const formatOriginDisplay = (origin: PickupOrigin): { name: string; address: string } => {
  return {
    name: origin.name || '',
    address: origin.address || ''
  };
};

interface DeliveryNoteCardProps {
  note: {
    id: string;
    noteNumber?: number;
    clientName?: string | null;
    pickupOrigins?: PickupOrigin[] | null;
    destination?: string | null;
    vehicleType?: string | null;
    date?: string | null;
    time?: string | null;
    observations?: string | null;
    waitTime?: number | null;
    photo?: string | null;
    signature?: string | null;
    signedAt?: string | null;
    status?: string;
    workerName?: string | null;
  };
  showWorkerName?: boolean;
  showPhoto?: boolean;
  showActions?: boolean;
  isPending?: boolean;
  onPhotoClick?: () => void;
  onEditClick?: () => void;
  onAddPhotoClick?: () => void;
}

export function DeliveryNoteCard({
  note,
  showWorkerName = false,
  showPhoto = true,
  showActions = false,
  isPending = false,
  onPhotoClick,
  onEditClick,
  onAddPhotoClick,
}: DeliveryNoteCardProps) {
  const isSigned = !!note.photo || !!note.signature;
  
  const formatWaitTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatSignedDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="rounded-lg border border-muted-foreground/10 bg-slate-50 dark:bg-slate-900/30 overflow-hidden shadow-sm">
      {showPhoto && note.photo && (
        <div 
          className="w-full h-32 sm:h-40 bg-muted cursor-pointer hover:opacity-90 transition-opacity"
          onClick={onPhotoClick}
        >
          <img 
            src={note.photo} 
            alt="Albarán firmado" 
            className="w-full h-full object-cover"
            data-testid={`img-delivery-note-${note.id}`}
          />
        </div>
      )}
      
      <div className="p-3 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span 
            className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded"
            data-testid={`note-number-${note.id}`}
          >
            Albarán #{note.noteNumber || '—'}
          </span>
          <Badge 
            className={isSigned 
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 no-default-hover-elevate no-default-active-elevate"
              : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 no-default-hover-elevate no-default-active-elevate"
            }
            data-testid={`badge-status-${note.id}`}
          >
            {isSigned ? (
              <><CheckCircle className="w-3 h-3 mr-1" /> Firmado</>
            ) : (
              <><Clock className="w-3 h-3 mr-1" /> Pendiente</>
            )}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="bg-muted/20 rounded-md p-2 space-y-1.5">
            <div className="flex items-start gap-2">
              <div className="flex flex-col items-center gap-0.5 pt-0.5">
                <CircleDot className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                {(note.pickupOrigins && note.pickupOrigins.length > 1) && (
                  <div className="w-0.5 h-3 bg-muted-foreground/30 rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium">
                  {note.pickupOrigins && note.pickupOrigins.length > 1 ? `Recogidas (${note.pickupOrigins.length})` : 'Recogida'}
                </p>
                {note.pickupOrigins && note.pickupOrigins.length > 0 ? (
                  <div className="space-y-1">
                    {note.pickupOrigins.map((origin, idx) => {
                      const { name, address } = formatOriginDisplay(origin);
                      return (
                        <div key={idx} className="text-sm">
                          {name && <span className="font-medium">{name}</span>}
                          {name && address && <span className="text-muted-foreground"> · </span>}
                          {address && <span className="text-muted-foreground text-xs">{address}</span>}
                          {!name && !address && <span className="text-muted-foreground">N/A</span>}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">N/A</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 pl-1">
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Entrega</p>
                <p className="text-sm font-medium">{note.destination || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="text-sm font-medium truncate">{note.clientName || 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Truck className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Vehículo</p>
                <p className="text-sm font-medium truncate">{note.vehicleType || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Fecha</p>
                <p className="text-sm font-medium">{note.date ? formatDate(note.date) : 'N/A'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Hora</p>
                <p className="text-sm font-medium">{note.time || 'N/A'}</p>
              </div>
            </div>
          </div>

          {showWorkerName && (
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Trabajador</p>
                <p className="text-sm font-medium truncate">{note.workerName || 'Desconocido'}</p>
              </div>
            </div>
          )}

          {note.waitTime && note.waitTime > 0 && (
            <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-md p-2">
              <Timer className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-amber-700 dark:text-amber-300">Tiempo de Espera</p>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                  {formatWaitTime(note.waitTime)}
                </p>
              </div>
            </div>
          )}

          {note.signedAt && isSigned && (
            <div className="flex items-start gap-2 bg-green-50 dark:bg-green-900/20 rounded-md p-2">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-green-700 dark:text-green-300">Firmado</p>
                <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                  {formatSignedDate(note.signedAt)}
                </p>
              </div>
            </div>
          )}

          {note.observations && (
            <div className="flex items-start gap-2 bg-muted/30 rounded-md p-2">
              <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Observaciones</p>
                <p className="text-sm line-clamp-2">{note.observations}</p>
              </div>
            </div>
          )}
        </div>

        {showActions && isPending && (
          <div className="flex gap-2 pt-1">
            {onEditClick && (
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1"
                onClick={onEditClick}
                data-testid={`button-edit-${note.id}`}
              >
                <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                Editar
              </Button>
            )}
            {onAddPhotoClick && (
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1"
                onClick={onAddPhotoClick}
                data-testid={`button-add-photo-${note.id}`}
              >
                <Camera className="w-3.5 h-3.5 mr-1.5" />
                Foto
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
