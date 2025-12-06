import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, MailOpen, CheckCheck, FileText, Clock, RefreshCw, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Message } from "@shared/schema";

export default function MessagesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading, refetch, isRefetching } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      return apiRequest("PATCH", `/api/messages/${messageId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", "/api/messages/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
      toast({
        title: "Mensajes marcados",
        description: "Todos los mensajes han sido marcados como leídos",
      });
    },
  });

  const unreadCount = messages.filter(m => !m.read).length;

  const getMessageIcon = (type: string, read: boolean) => {
    if (type === "delivery_note_signed") {
      return <CheckCheck className="h-5 w-5 text-green-600 dark:text-green-400" />;
    }
    if (type === "delivery_note_created") {
      return <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    }
    return read ? 
      <MailOpen className="h-5 w-5 text-muted-foreground" /> : 
      <Mail className="h-5 w-5 text-primary" />;
  };

  const getMessageTypeBadge = (type: string) => {
    if (type === "delivery_note_signed") {
      return <Badge variant="outline" className="text-green-600 border-green-600 dark:text-green-400 dark:border-green-400">Firmado</Badge>;
    }
    if (type === "delivery_note_created") {
      return <Badge variant="outline" className="text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400">Nuevo</Badge>;
    }
    return <Badge variant="outline">Mensaje</Badge>;
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mensajes</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} mensaje${unreadCount > 1 ? 's' : ''} sin leer` : 'Todos los mensajes leídos'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            data-testid="button-refresh-messages"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              data-testid="button-mark-all-read"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Marcar todos leídos
            </Button>
          )}
        </div>
      </div>

      {messages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No hay mensajes</p>
            <p className="text-muted-foreground text-sm">Los mensajes aparecerán aquí cuando se creen o firmen albaranes</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <Card 
              key={message.id}
              className={`transition-all cursor-pointer hover-elevate ${!message.read ? 'border-primary/50 bg-primary/5' : ''}`}
              onClick={() => {
                if (!message.read) {
                  markAsReadMutation.mutate(message.id);
                }
              }}
              data-testid={`card-message-${message.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getMessageIcon(message.type, !!message.read)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className={`font-medium ${!message.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {message.title}
                      </h3>
                      {getMessageTypeBadge(message.type)}
                      {!message.read && (
                        <Badge variant="default" className="text-xs">Nuevo</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {message.body}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(message.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
