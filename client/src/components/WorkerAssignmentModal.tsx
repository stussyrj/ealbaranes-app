import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import type { Worker, Quote } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface WorkerAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: Quote | null;
}

export function WorkerAssignmentModal({ open, onOpenChange, quote }: WorkerAssignmentModalProps) {
  const [selectedWorkerId, setSelectedWorkerId] = useState("");

  const { data: workers = [] } = useQuery({
    queryKey: ["/api/workers"],
  });

  const assignMutation = useMutation({
    mutationFn: async (workerId: string) => {
      if (!quote) throw new Error("Quote not found");
      const response = await apiRequest("PATCH", `/api/quotes/${quote.id}/assign-worker`, {
        workerId,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      setSelectedWorkerId("");
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar Trabajador</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {quote && (
            <div className="text-sm text-muted-foreground">
              <p>{quote.origin} → {quote.destination}</p>
            </div>
          )}
          <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
            <SelectTrigger data-testid="select-worker">
              <SelectValue placeholder="Selecciona un trabajador" />
            </SelectTrigger>
            <SelectContent>
              {(workers as Worker[]).map((worker) => (
                <SelectItem key={worker.id} value={worker.id}>
                  {worker.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel-assignment"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => assignMutation.mutate(selectedWorkerId)}
              disabled={!selectedWorkerId || assignMutation.isPending}
              className="flex-1 bg-green-600/85 hover:bg-green-700/85 dark:bg-green-600/85 dark:hover:bg-green-700/85 text-white backdrop-blur-sm border border-green-500/40"
              data-testid="button-assign-worker"
            >
              {assignMutation.isPending ? "Asignando..." : "Asignar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
