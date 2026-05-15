import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;       // 0-5
  maxStars?: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}

export default function RatingStars({ rating, maxStars = 5, size = 16, showValue = true, className = '' }: RatingStarsProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: maxStars }).map((_, i) => {
        const fill = Math.min(1, Math.max(0, rating - i));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            {/* Background star (empty) */}
            <Star size={size} className="text-gray-200 absolute inset-0" />
            {/* Foreground star (filled) */}
            {fill > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star size={size} className="text-[#f99200] fill-current" />
              </span>
            )}
          </span>
        );
      })}
      {showValue && (
        <span className="ml-1 text-sm font-bold text-gray-700">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}
