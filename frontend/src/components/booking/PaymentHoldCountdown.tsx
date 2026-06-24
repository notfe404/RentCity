import { Clock3 } from 'lucide-react';

interface PaymentHoldCountdownProps {
  remainingSeconds: number | null;
  expired?: boolean;
}

export default function PaymentHoldCountdown({
  remainingSeconds,
  expired = false,
}: PaymentHoldCountdownProps) {
  if (remainingSeconds === null) {
    return null;
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const countdown = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className={`rounded-2xl border p-5 ${
      expired
        ? 'border-red-200 bg-red-50'
        : 'border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50'
    }`}>
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
          expired ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'
        }`}>
          <Clock3 size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-black uppercase tracking-[0.16em] ${
            expired ? 'text-red-600' : 'text-orange-600'
          }`}>
            {expired ? 'Payment time has expired' : 'Remaining booking hold time'}
          </p>
          <p className={`mt-1 font-mono text-4xl font-black tabular-nums ${
            expired ? 'text-red-700' : 'text-gray-900'
          }`}>
            {countdown}
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-600">
            {expired
              ? 'The booking is being automatically cancelled by the system.'
              : 'Please complete the deposit within 15 minutes, otherwise the booking will be automatically cancelled.'}
          </p>
        </div>
      </div>
    </div>
  );
}
