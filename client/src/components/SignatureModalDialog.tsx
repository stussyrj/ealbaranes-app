import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Eraser, X } from "lucide-react";

interface SignatureModalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (signature: string) => void;
  initialSignature?: string;
  title: string;
}

export function SignatureModalDialog({
  open,
  onOpenChange,
  onConfirm,
  initialSignature,
  title,
}: SignatureModalDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const hasSignatureRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to fill available space
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Initialize canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Load initial signature if exists
    if (initialSignature && initialSignature.length > 100) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        hasSignatureRef.current = true;
      };
      img.src = initialSignature;
    }
  }, [open, initialSignature]);

  const getCoordinates = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      const touch = e.touches[0];
      if (!touch) return null;
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    isDrawingRef.current = true;
    lastPointRef.current = coords;
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  }, [getCoordinates]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const lastPoint = lastPointRef.current;
    if (!lastPoint) {
      lastPointRef.current = coords;
      return;
    }

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    lastPointRef.current = coords;

    if (!hasSignatureRef.current) {
      hasSignatureRef.current = true;
    }
  }, [getCoordinates]);

  const stopDrawing = useCallback(() => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    hasSignatureRef.current = false;
  }, []);

  const handleConfirm = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas && hasSignatureRef.current) {
      const dataUrl = canvas.toDataURL("image/png");
      onConfirm(dataUrl);
      onOpenChange(false);
    }
  }, [onConfirm, onOpenChange]);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 flex flex-col gap-4">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="flex-1 border-2 border-gray-300 rounded-md cursor-crosshair bg-white"
            data-testid="canvas-signature-modal"
          />
          <div className="flex gap-2 justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={clearCanvas}
              className="gap-2"
              data-testid="button-clear-signature-modal"
            >
              <Eraser className="w-4 h-4" />
              Limpiar
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="gap-2"
                data-testid="button-cancel-signature-modal"
              >
                <X className="w-4 h-4" />
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={!hasSignatureRef.current}
                className="gap-2"
                data-testid="button-confirm-signature-modal"
              >
                <Check className="w-4 h-4" />
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
