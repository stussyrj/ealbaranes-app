import { memo, useState } from "react";
import { Clock, FileText, CheckCircle, Timer, Camera, Edit2, ChevronDown, ChevronUp, MapPin, Navigation, User, Trash2, RotateCcw, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { downloadFile } from "@/lib/queryClient";
import type { PickupOrigin } from "@shared/schema";

const RouteDisplay = ({ origin }: { origin: PickupOrigin }) => {
  const from = origin.name || 'N/A';
  const to = origin.address || 'N/A';
  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 items-start text-sm">
      <span className="text-muted-foreground text-xs flex items-center gap-1 pt-0.5">
        <MapPin className="w-3 h-3 text-blue-500 flex-shrink-0" />
      </span>
      <span className="truncate font-medium" title={from}>{from}</span>
      <span className="text-muted-foreground text-xs flex items-center gap-1 pt-0.5">
        <Navigation className="w-3 h-3 text-green-500 flex-shrink-0" />
      </span>
      <span className="truncate font-medium" title={to}>{to}</span>
    </div>
  );
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
    originSignature?: string | null;
    originSignatureDocument?: string | null;
    originSignedAt?: string | null;
    destinationSignature?: string | null;
    destinationSignatureDocument?: string | null;
    destinationSignedAt?: string | null;
    status?: string;
    workerName?: string | null;
  };
  showWorkerName?: boolean;
  showPhoto?: boolean;
  showActions?: boolean;
  isPending?: boolean;
  showDeleteButton?: boolean;
  showRestoreButton?: boolean;
  isDeleting?: boolean;
  isRestoring?: boolean;
  onPhotoClick?: () => void;
  onEditClick?: () => void;
  onAddPhotoClick?: () => void;
  onDeleteClick?: () => void;
  onRestoreClick?: () => void;
}

export const DeliveryNoteCard = memo(function DeliveryNoteCard({
  note,
  showWorkerName = false,
  showPhoto = true,
  showActions = false,
  isPending = false,
  showDeleteButton = false,
  showRestoreButton = false,
  isDeleting = false,
  isRestoring = false,
  onPhotoClick,
  onEditClick,
  onAddPhotoClick,
  onDeleteClick,
  onRestoreClick,
}: DeliveryNoteCardProps) {
  const [showAllOrigins, setShowAllOrigins] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Fully signed requires: origin document + destination document + photo (new dual signature system)
  const isFullySigned = (note.originSignatureDocument && note.destinationSignatureDocument && note.photo) ||
                        (!!note.photo && !!note.signature); // Legacy: photo + signature
  // Partially signed = only origin is signed (new system)
  const isPartialSigned = (note.originSignature && note.originSignatureDocument) && !isFullySigned;
  const isSigned = isFullySigned;
  
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

  const handleDownloadPdf = async () => {
    if (!isSigned) return;
    setIsDownloading(true);
    try {
      const filename = `Albaran_${note.noteNumber}_${note.clientName?.replace(/\s+/g, '_') || 'cliente'}.pdf`;
      await downloadFile(`/api/delivery-notes/${note.id}/pdf`, filename);
    } catch (error) {
      console.error('Error descargando PDF:', error);
    } finally {
      setIsDownloading(false);
    }
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
      
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span 
            className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded"
            data-testid={`note-number-${note.id}`}
          >
            Albarán #{note.noteNumber || '—'}
          </span>
          <div className="flex items-center gap-2">
            {isSigned && (
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                title="Descargar PDF"
                data-testid={`button-download-pdf-${note.id}`}
              >
                <Download className="w-3.5 h-3.5" />
              </Button>
            )}
            <Badge 
              className={isSigned 
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 no-default-hover-elevate no-default-active-elevate"
                : isPartialSigned
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 no-default-hover-elevate no-default-active-elevate"
                  : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 no-default-hover-elevate no-default-active-elevate"
              }
              data-testid={`badge-status-${note.id}`}
            >
              {isSigned ? (
                <><CheckCircle className="w-3 h-3 mr-1" /> Firmado</>
              ) : isPartialSigned ? (
                <><MapPin className="w-3 h-3 mr-1" /> Origen firmado</>
              ) : (
                <><Clock className="w-3 h-3 mr-1" /> Pendiente</>
              )}
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-sm font-semibold">{note.clientName || 'Cliente N/A'}</p>
            {showWorkerName && (
              <p className="text-xs text-muted-foreground">({note.workerName || 'Trabajador'})</p>
            )}
          </div>

          <div className="bg-muted/20 rounded-md p-3 space-y-2">
            {note.pickupOrigins && note.pickupOrigins.length > 0 ? (
              <>
                <div className="space-y-1">
                  <div className="text-sm">
                    <RouteDisplay origin={note.pickupOrigins[0]} />
                  </div>
                </div>
                
                {hasMultipleOrigins && showAllOrigins && (
                  <div className="space-y-1 pt-1">
                    {note.pickupOrigins.slice(1).map((origin, idx) => (
                      <div key={idx + 1} className="text-sm">
                        <RouteDisplay origin={origin} />
                      </div>
                    ))}
                  </div>
                )}
                
                {hasMultipleOrigins && (
                  <button
                    onClick={() => setShowAllOrigins(!showAllOrigins)}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                    data-testid={`button-toggle-origins-${note.id}`}
                  >
                    {showAllOrigins ? (
                      <><ChevronUp className="w-3 h-3" /> Ocultar {note.pickupOrigins.length - 1} tramos</>
                    ) : (
                      <><ChevronDown className="w-3 h-3" /> Ver {note.pickupOrigins.length - 1} tramos más</>
                    )}
                  </button>
                )}
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                Sin ruta definida
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


          {(note.signedAt || note.originSignedAt || note.destinationSignedAt) && isSigned && (
            <div className="flex items-start gap-2 bg-green-50 dark:bg-green-900/20 rounded-md p-2">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-green-700 dark:text-green-300">Firmado</p>
                <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                  {formatSignedDate(note.destinationSignedAt || note.signedAt || '')}
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

        {showActions && (isPending || isPartialSigned) && (
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

        {showDeleteButton && onDeleteClick && (
          <div className="pt-1">
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={onDeleteClick}
              disabled={isDeleting}
              data-testid={`button-delete-${note.id}`}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              {isDeleting ? "Borrando..." : "Borrar"}
            </Button>
          </div>
        )}

        {showRestoreButton && onRestoreClick && (
          <div className="pt-1">
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/20"
              onClick={onRestoreClick}
              disabled={isRestoring}
              data-testid={`button-restore-${note.id}`}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              {isRestoring ? "Restaurando..." : "Restaurar"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});
