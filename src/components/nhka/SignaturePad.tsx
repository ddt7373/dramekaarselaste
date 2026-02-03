import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eraser, Check, RotateCcw } from 'lucide-react';

interface SignaturePadProps {
  onSave: (signatureData: string) => void;
  onCancel?: () => void;
  width?: number;
  height?: number;
  label?: string;
  existingSignature?: string;
}

const SignaturePad: React.FC<SignaturePadProps> = ({
  onSave,
  onCancel,
  width = 400,
  height = 200,
  label = 'Teken hier',
  existingSignature
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#002855';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Load existing signature if provided
    if (existingSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setHasSignature(true);
      };
      img.src = existingSignature;
    }
  }, [existingSignature]);

  const getCoordinates = (e: React.TouchEvent | React.MouseEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }
  };

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!isDrawing) return;

    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureData = canvas.toDataURL('image/png');
    onSave(signatureData);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div 
        ref={containerRef}
        className="border-2 border-dashed border-gray-300 rounded-lg p-2 bg-gray-50"
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full bg-white rounded border border-gray-200 touch-none cursor-crosshair"
          style={{ maxWidth: '100%', height: 'auto', aspectRatio: `${width}/${height}` }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <p className="text-xs text-gray-500 text-center mt-2">
          Gebruik jou vinger of stylus om te teken
        </p>
      </div>
      <div className="flex flex-wrap gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearCanvas}
          className="gap-1.5 text-xs sm:text-sm"
        >
          <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden xs:inline">Vee Uit</span>
          <span className="xs:hidden">Vee</span>
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="text-xs sm:text-sm"
          >
            Kanselleer
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          onClick={saveSignature}
          disabled={!hasSignature}
          className="gap-1.5 bg-[#002855] hover:bg-[#002855]/90 text-xs sm:text-sm"
        >
          <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Stoor Handtekening</span>
          <span className="sm:hidden">Stoor</span>
        </Button>
      </div>
    </div>
  );
};

export default SignaturePad;
