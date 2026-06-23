import { useRef, useState } from 'react';
import { Eraser } from 'lucide-react';

interface Props {
  label: string;
  disabled?: boolean;
  onChange: (file: File | null) => void;
}

export default function SignaturePad({ label, disabled = false, onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = canvasRef.current!;
    canvas.setPointerCapture(event.pointerId);
    const ctx = canvas.getContext('2d')!;
    const p = point(event);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    drawingRef.current = true;
  };

  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || disabled) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    const p = point(event);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#111827';
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setHasSignature(true);
  };

  const finish = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current!;
    canvas.toBlob((blob) => {
      onChange(blob ? new File([blob], 'signature.png', { type: 'image/png' }) : null);
    }, 'image/png');
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange(null);
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs font-bold text-gray-600">{label} *</label>
        <button type="button" onClick={clear} disabled={disabled || !hasSignature} className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-red-500 disabled:opacity-40">
          <Eraser size={13} /> Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={600}
        height={180}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={finish}
        className="h-32 w-full touch-none rounded-xl border-2 border-dashed border-gray-200 bg-white cursor-crosshair"
        aria-label={label}
      />
      {!hasSignature && <p className="mt-1 text-[11px] font-bold text-red-500">Signature is required</p>}
    </div>
  );
}
