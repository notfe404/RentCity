import { formatVND } from '@/utils/formatters';

interface PriceTagProps {
  amount: number;
  suffix?: string;       // "/day", "/hours"
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function PriceTag({ amount, suffix = '/day', size = 'md', className = '' }: PriceTagProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <span className={`font-black text-[#78ad44] ${sizeClasses[size]} ${className}`}>
      {formatVND(amount)}
      {suffix && <span className="text-gray-400 font-medium text-xs ml-0.5">{suffix}</span>}
    </span>
  );
}
