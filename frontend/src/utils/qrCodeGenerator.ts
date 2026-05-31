/**
 * Generate a fake QR code as data URL (for testing/mock purposes)
 * Uses canvas to draw a pseudo-random QR pattern
 */
export function generateFakeQRCode(text: string, size: number = 250): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return '';
  }

  // White background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);

  // Generate pseudo-random pattern based on input text
  const hash = hashString(text);
  const moduleSize = size / 25; // 25x25 modules
  let hashIndex = 0;

  // Draw QR-like pattern
  ctx.fillStyle = '#000000';
  for (let row = 0; row < 25; row++) {
    for (let col = 0; col < 25; col++) {
      // Skip position detection patterns (top-left, top-right, bottom-left corners)
      if (
        (row < 7 && col < 7) ||
        (row < 7 && col >= 18) ||
        (row >= 18 && col < 7)
      ) {
        continue;
      }

      // Use hash to determine if module is black
      const charCode = hash.charCodeAt(hashIndex % hash.length);
      if (charCode % 2 === 0) {
        ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize - 1, moduleSize - 1);
      }

      hashIndex++;
    }
  }

  // Draw position detection patterns (QR corners) - simplified squares
  drawPositionMarker(ctx, 0, 0, moduleSize);
  drawPositionMarker(ctx, size - 7 * moduleSize, 0, moduleSize);
  drawPositionMarker(ctx, 0, size - 7 * moduleSize, moduleSize);

  return canvas.toDataURL('image/png');
}

function drawPositionMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  moduleSize: number,
) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(x, y, 7 * moduleSize, 7 * moduleSize);

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x + moduleSize, y + moduleSize, 5 * moduleSize, 5 * moduleSize);

  ctx.fillStyle = '#000000';
  ctx.fillRect(x + 2 * moduleSize, y + 2 * moduleSize, 3 * moduleSize, 3 * moduleSize);
}

function hashString(str: string): string {
  let hash = '';
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash += (char * 9884435).toString(16);
  }
  return hash || '0';
}

/**
 * Generate a VNPay mock QR code
 * Format: 00020136080012000600505050403512
 */
export function generateVNPayQRCode(amount: number, bookingCode: string): string {
  const qrContent = `00|99|010111|${bookingCode.slice(-6).padEnd(6, '0')}|${Math.floor(amount)
    .toString()
    .padStart(10, '0')}|VNPayMock`;
  return generateFakeQRCode(qrContent);
}
