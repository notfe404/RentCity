import { useState } from 'react';
import { Banknote, Loader2, Send, ShieldCheck, X } from 'lucide-react';
import type { ApiBookingResponse, SettlementMethod } from '@/types';
import { formatVND } from '@/utils/formatters';

interface Props {
  booking: ApiBookingResponse;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (method: SettlementMethod) => Promise<void>;
}

export default function SecurityDepositModal({ booking, isSaving, onClose, onSubmit }: Props) {
  const [method, setMethod] = useState<SettlementMethod>('PAYMENT_REQUEST');

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="relative overflow-hidden bg-[#18392f] px-6 py-7 text-white">
          <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full border-[24px] border-white/5" />
          <button type="button" onClick={onClose} disabled={isSaving} className="absolute right-4 top-4 rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white">
            <X size={20} />
          </button>
          <ShieldCheck size={30} className="mb-4 text-[#b7e48a]" />
          <h2 className="text-xl font-black">Collect vehicle security deposit</h2>
          <p className="mt-1 text-sm font-medium text-white/65">{booking.bookingCode} · {booking.vehicleName}</p>
        </div>

        <div className="space-y-5 p-6">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Refundable security deposit</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{formatVND(booking.securityDepositAmount)}</p>
            <p className="mt-2 text-xs font-medium leading-5 text-emerald-800">
              This amount is returned when the vehicle comes back in good condition. It is retained for repair or maintenance when damage is recorded.
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400">Collection method</p>
            <div className="grid grid-cols-2 gap-3">
              <MethodButton active={method === 'PAYMENT_REQUEST'} icon={Send} label="Payment request" hint="Customer pays online" onClick={() => setMethod('PAYMENT_REQUEST')} />
              <MethodButton active={method === 'CASH'} icon={Banknote} label="Cash" hint="Record as paid now" onClick={() => setMethod('CASH')} />
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs font-medium leading-5 text-slate-600">
            The handover action becomes available only after the full security deposit is recorded as paid.
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={isSaving} className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-700">Cancel</button>
            <button type="button" onClick={() => onSubmit(method)} disabled={isSaving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#78ad44] py-3 font-black text-white disabled:bg-slate-300">
              {isSaving && <Loader2 size={16} className="animate-spin" />}
              {method === 'CASH' ? 'Confirm cash deposit' : 'Send payment request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MethodButton({ active, icon: Icon, label, hint, onClick }: {
  active: boolean;
  icon: typeof Send;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={`rounded-2xl border-2 p-4 text-left transition-colors ${active ? 'border-[#78ad44] bg-[#f2f8ec]' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
      <Icon size={20} className={active ? 'text-[#56832d]' : 'text-slate-400'} />
      <p className="mt-3 text-sm font-black text-slate-900">{label}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{hint}</p>
    </button>
  );
}
