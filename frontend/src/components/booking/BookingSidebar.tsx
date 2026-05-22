import { MapPin, Calendar, ChevronRight } from 'lucide-react';
import { formatVND, formatDate } from '@/utils/formatters';
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
  totalDays: number;
  lineItems: PriceLineItem[];
  totalAmount: number;
  actionLabel: string;
  actionDisabled?: boolean;
  onAction: () => void;
}

export default function BookingSidebar({
  vehicle, pickupLocation, returnLocation,
  startDate, endDate,
  lineItems, totalAmount,
  actionLabel, actionDisabled = false, onAction,
}: BookingSidebarProps) {
  return (
    <aside className="w-full lg:w-[400px] shrink-0">
      <div className="sticky top-24 bg-white rounded-[2.5rem] p-6 shadow-xl border border-gray-100 flex flex-col gap-6">
        <h3 className="text-xl font-black text-gray-900 border-b border-gray-100 pb-4 px-2">Tóm tắt đơn</h3>

        {/* Vehicle info */}
        <div className="flex gap-4 items-center bg-[#f4f8f7] p-3 rounded-2xl">
          <img src={vehicle.image} alt={vehicle.name} className="w-24 h-16 object-cover rounded-xl shadow-sm" />
          <div>
            <h4 className="font-black text-gray-900">{vehicle.name}</h4>
            <p className="text-xs text-gray-500 font-bold mt-1">{vehicle.type}</p>
          </div>
        </div>

        {/* Location & dates */}
        <div className="space-y-4 px-2">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#f4f8f7] flex items-center justify-center shrink-0 mt-0.5">
              <MapPin size={14} className="text-[#78ad44]" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400">Nhận xe</p>
              <p className="text-sm font-bold text-gray-900">{pickupLocation}</p>
              <p className="text-xs text-gray-500 mt-0.5">{formatDate(startDate)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#f4f8f7] flex items-center justify-center shrink-0 mt-0.5">
              <Calendar size={14} className="text-[#78ad44]" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400">Trả xe</p>
              <p className="text-sm font-bold text-gray-900">{returnLocation}</p>
              <p className="text-xs text-gray-500 mt-0.5">{formatDate(endDate)}</p>
            </div>
          </div>
        </div>

        {/* Price breakdown */}
        <div className="border-t border-gray-100 pt-5 px-2">
          {lineItems.map((item, i) => (
            <div key={i} className="flex justify-between items-center text-sm font-bold text-gray-600 mb-3">
              <span>{item.label}</span>
              <span>{formatVND(item.amount)}</span>
            </div>
          ))}

          <div className="flex justify-between items-center text-lg font-black text-gray-900 mt-6 bg-[#212529] text-white p-4 rounded-xl">
            <span>Tổng cộng</span>
            <span className="text-[#78ad44]">{formatVND(totalAmount)}</span>
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
