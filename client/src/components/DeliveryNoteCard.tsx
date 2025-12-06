import { useState } from "react";
import { Clock, Truck, User, Calendar, FileText, CheckCircle, Timer, Camera, Edit2, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PickupOrigin } from "@shared/schema";

// Helper to format origin text (name or address)
const formatOriginText = (origin: PickupOrigin): string => {
  if (origin.name && origin.address) return `${origin.name} (${origin.address})`;
  if (origin.name) return origin.name;
  if (origin.address) return origin.address;
  return 'N/A';
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
  const [showAllOrigins, setShowAllOrigins] = useState(false);
  const isSigned = !!note.photo || !!note.signature;
  const hasMultipleOrigins = note.pickupOrigins && note.pickupOrigins.length > 1;
  
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
          <div className="space-y-1">
            <p className="text-sm font-semibold">{note.clientName || 'Cliente N/A'}</p>
            {showWorkerName && (
              <p className="text-xs text-muted-foreground">({note.workerName || 'Trabajador'})</p>
            )}
          </div>

          <div className="bg-muted/20 rounded-md p-2 space-y-1">
            {note.pickupOrigins && note.pickupOrigins.length > 0 ? (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <span className="flex-1 min-w-0 truncate">{formatOriginText(note.pickupOrigins[0])}</span>
                  <ArrowRight className="w-3 h-3 text-primary flex-shrink-0" />
                  <span className="flex-1 min-w-0 truncate text-right">{note.destination || 'N/A'}</span>
                </div>
                
                {hasMultipleOrigins && showAllOrigins && (
                  <div className="space-y-1 pt-1 border-t border-muted-foreground/10">
                    {note.pickupOrigins.slice(1).map((origin, idx) => (
                      <div key={idx + 1} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex-1 min-w-0 truncate">{formatOriginText(origin)}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />
                        <span className="flex-1 min-w-0 truncate text-right">{note.destination || 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {hasMultipleOrigins && (
                  <button
                    onClick={() => setShowAllOrigins(!showAllOrigins)}
                    className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                    data-testid={`button-toggle-origins-${note.id}`}
                  >
                    {showAllOrigins ? (
                      <><ChevronUp className="w-3 h-3" /> Ocultar {note.pickupOrigins.length - 1} recogidas</>
                    ) : (
                      <><ChevronDown className="w-3 h-3" /> Ver {note.pickupOrigins.length - 1} recogidas más</>
                    )}
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>N/A</span>
                <ArrowRight className="w-3 h-3" />
                <span>{note.destination || 'N/A'}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Vehículo</p>
              <p className="font-medium truncate">{note.vehicleType || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Fecha</p>
              <p className="font-medium">{note.date ? formatDate(note.date) : 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Hora</p>
              <p className="font-medium">{note.time || 'N/A'}</p>
            </div>
          </div>

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
