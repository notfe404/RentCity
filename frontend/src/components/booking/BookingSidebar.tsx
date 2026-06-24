import { MapPin, Calendar, ChevronRight, ShieldCheck } from 'lucide-react';
import { formatVND, formatDateTime } from '@/utils/formatters';
import type { MockVehicle } from '@/data/mockVehicles';

interface PriceLineItem {
  label: string;
  amount: number;
}

interface BookingSidebarProps {
  vehicle: MockVehicle;
  pickupLocation: string;
  returnLocation: string;
  startDate: string;
  endDate: string;
  durationLabel: string;
  lineItems: PriceLineItem[];
  depositAmount: number;
  securityDepositAmount: number;
  totalAmount: number;
  actionLabel: string;
  actionDisabled?: boolean;
  onAction: () => void;
}

export default function BookingSidebar({
  vehicle,
  pickupLocation,
  returnLocation,
  startDate,
  endDate,
  durationLabel,
  lineItems,
  depositAmount,
  securityDepositAmount,
  totalAmount,
  actionLabel,
  actionDisabled = false,
  onAction,
}: BookingSidebarProps) {
  return (
    <aside className="w-full lg:w-[400px] shrink-0">
      <div className="sticky top-24 bg-white rounded-[2.5rem] p-6 shadow-xl border border-gray-100 flex flex-col gap-6">
        <h3 className="text-xl font-black text-gray-900 border-b border-gray-100 pb-4 px-2">Order Summary</h3>

        <div className="flex gap-4 items-center bg-[#f4f8f7] p-3 rounded-2xl">
          <img src={vehicle.image} alt={vehicle.name} className="w-24 h-16 object-cover rounded-xl shadow-sm" />
          <div>
            <h4 className="font-black text-gray-900">{vehicle.name}</h4>
            <p className="text-xs text-gray-500 font-bold mt-1">{vehicle.type}</p>
          </div>
        </div>

        <div className="space-y-4 px-2">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#f4f8f7] flex items-center justify-center shrink-0 mt-0.5">
              <MapPin size={14} className="text-[#78ad44]" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400">Pick-up</p>
              <p className="text-sm font-bold text-gray-900">{pickupLocation}</p>
              <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(startDate)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#f4f8f7] flex items-center justify-center shrink-0 mt-0.5">
              <Calendar size={14} className="text-[#78ad44]" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400">Return</p>
              <p className="text-sm font-bold text-gray-900">{returnLocation}</p>
              <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(endDate)}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-5 px-2">
          <div className="flex justify-between items-center text-sm font-bold text-gray-600 mb-3">
            <span>Rental Duration</span>
            <span>{durationLabel}</span>
          </div>

          {lineItems.map((item, i) => (
            <div key={i} className="flex justify-between items-center text-sm font-bold text-gray-600 mb-3">
              <span>{item.label}</span>
              <span>{formatVND(item.amount)}</span>
            </div>
          ))}

          <div className="flex justify-between items-center text-lg font-black text-gray-900 mt-6 bg-[#212529] text-white p-4 rounded-xl">
            <span>Total</span>
            <span className="text-[#78ad44]">{formatVND(totalAmount)}</span>
          </div>

          <div className="flex justify-between items-center text-sm font-black text-gray-900 mt-3 bg-[#f4f8f7] p-4 rounded-xl border border-gray-100">
            <span>Reservation fee due (30%)</span>
            <span className="text-[#78ad44]">{formatVND(depositAmount)}</span>
          </div>

          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-amber-700" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3 text-sm font-black text-gray-900">
                  <span>Refundable security deposit</span>
                  <span className="shrink-0 text-amber-700">{formatVND(securityDepositAmount)}</span>
                </div>
                <p className="mt-1.5 text-xs font-bold leading-5 text-amber-800">
                  Not charged now. You only pay this deposit when staff hands over the vehicle. It is refunded after a good return without damage or maintenance issues.
                </p>
              </div>
            </div>
          </div>
        </div>

        <button
          disabled={actionDisabled}
          onClick={onAction}
          className={`w-full text-white font-bold rounded-2xl py-4 transition-colors shadow-lg mt-2 flex justify-center items-center gap-2 ${
            actionDisabled
              ? 'bg-gray-300 cursor-not-allowed shadow-none'
              : 'bg-[#78ad44] hover:bg-[#689938] shadow-[#78ad44]/30'
          }`}
        >
          {actionLabel} <ChevronRight size={18} />
        </button>
      </div>
    </aside>
  );
}
