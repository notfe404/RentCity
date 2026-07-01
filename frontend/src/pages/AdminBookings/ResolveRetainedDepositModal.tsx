import { useState } from 'react';
import { Banknote, Loader2, Send, ShieldCheck, X } from 'lucide-react';

import type { ApiBookingResponse } from '@/types';
import type { ResolveRetainedSecurityDepositPayload } from '@/services/bookingApi';
import { formatVND } from '@/utils/formatters';

interface Props {
  booking: ApiBookingResponse;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (payload: ResolveRetainedSecurityDepositPayload) => Promise<void>;
}

export default function ResolveRetainedDepositModal({ booking, isSaving, onClose, onSubmit }: Props) {
  const [repairCostText, setRepairCostText] = useState('');
  const [refundMethod, setRefundMethod] = useState<'PAYMENT_REQUEST' | 'CASH'>('PAYMENT_REQUEST');
  const repairCost = Number(repairCostText || 0);
  const refundableAmount = Math.max(0, booking.securityDepositAmount - repairCost);
  const depositUsed = Math.min(booking.securityDepositAmount, repairCost);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!repairCostText || repairCost < 0) return;
    await onSubmit({
      actualRepairCost: repairCost,
      refundMethod: refundableAmount > 0 ? refundMethod : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-gray-100 bg-[#f8f9fa] p-5">
          <div>
            <h2 className="text-lg font-black text-gray-900">Resolve retained security deposit</h2>
            <p className="mt-1 text-xs font-bold text-gray-500">{booking.bookingCode} · {booking.customerName}</p>
          </div>
          <button type="button" onClick={onClose} disabled={isSaving} className="rounded-xl p-2 text-gray-400 hover:text-gray-700" aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <form onSubmit={submit} className="space-y-5 p-5">
          <div className="flex items-center justify-between rounded-xl border border-orange-200 bg-orange-50 p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-orange-600" size={20} />
              <span className="text-sm font-bold text-orange-800">Retained security deposit</span>
            </div>
            <span className="font-black text-orange-800">{formatVND(booking.securityDepositAmount)}</span>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-black text-gray-600">Actual repair or maintenance cost (VND) *</label>
            <input
              type="number"
              min={0}
              step={1000}
              required
              value={repairCostText}
              onChange={(event) => setRepairCostText(event.target.value)}
              placeholder="Enter the final invoice amount"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-black focus:border-[#78ad44] focus:outline-none focus:ring-2 focus:ring-[#78ad44]/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Summary label="Deposit used" value={formatVND(depositUsed)} tone="orange" />
            <Summary label="Refund to customer" value={formatVND(refundableAmount)} tone="green" />
          </div>

          {refundableAmount > 0 ? (
            <div>
              <p className="mb-2 text-xs font-black text-gray-600">Refund method *</p>
              <div className="grid grid-cols-2 gap-2">
                <MethodButton
                  active={refundMethod === 'PAYMENT_REQUEST'}
                  icon={Send}
                  label="Electronic refund"
                  hint="Record non-cash refund"
                  onClick={() => setRefundMethod('PAYMENT_REQUEST')}
                />
                <MethodButton
                  active={refundMethod === 'CASH'}
                  icon={Banknote}
                  label="Cash refund"
                  hint="Record cash returned"
                  onClick={() => setRefundMethod('CASH')}
                />
              </div>
            </div>
          ) : (
            <p className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs font-bold leading-5 text-orange-800">
              The repair cost uses the full deposit, so no refund will be issued. Any cost above the deposit is recorded but is not charged automatically.
            </p>
          )}

          <p className="text-xs font-medium leading-5 text-gray-500">
            This finalizes the retained deposit once. The repair cost, refunded amount, method, actor, payment record, and contract snapshot are preserved.
          </p>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={isSaving} className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-700">Cancel</button>
            <button type="submit" disabled={isSaving || !repairCostText} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#78ad44] py-3 text-sm font-bold text-white disabled:bg-gray-300">
              {isSaving && <Loader2 size={16} className="animate-spin" />}
              Finalize deposit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Summary({ label, value, tone }: { label: string; value: string; tone: 'orange' | 'green' }) {
  const color = tone === 'green' ? 'text-green-700 bg-green-50 border-green-100' : 'text-orange-700 bg-orange-50 border-orange-100';
  return <div className={`rounded-xl border p-3 ${color}`}><p className="text-[11px] font-bold">{label}</p><p className="mt-1 font-black">{value}</p></div>;
}

function MethodButton({ active, icon: Icon, label, hint, onClick }: {
  active: boolean;
  icon: typeof Send;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={`rounded-xl border-2 p-3 text-left ${active ? 'border-[#78ad44] bg-[#f2f8ec]' : 'border-gray-200 bg-white'}`}>
      <Icon size={17} className={active ? 'text-[#56832d]' : 'text-gray-400'} />
      <p className={`mt-2 text-xs font-black ${active ? 'text-[#56832d]' : 'text-gray-600'}`}>{label}</p>
      <p className="mt-0.5 text-[10px] font-bold text-gray-400">{hint}</p>
    </button>
  );
}
