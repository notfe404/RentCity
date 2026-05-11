import React from 'react';
import type { PricingOption } from '../types/pricing.types';
import { formatVND } from '../utils/pricingFormatter';

interface Props {
  pricingOption: PricingOption | null;
  totalHours: number;
  onCheckout: () => void;
  isLoading?: boolean;
}

export const RentalSummary: React.FC<Props> = ({
  pricingOption,
  totalHours,
  onCheckout,
  isLoading = false,
}) => {
  if (!pricingOption) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="font-bold text-gray-800">Tóm tắt chi phí</h3>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tổng thời gian</span>
          <span className="font-medium text-gray-900">{totalHours} giờ</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Đơn giá áp dụng</span>
          <span className="font-medium text-gray-900">{pricingOption.label}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Chi tiết</span>
          <span className="font-medium text-gray-900">{pricingOption.breakdown.detail}</span>
        </div>

        {pricingOption.surcharge > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Phụ phí (Cuối tuần/Lễ)</span>
            <span className="font-medium text-amber-600">+{formatVND(pricingOption.surcharge)}</span>
          </div>
        )}

        {pricingOption.discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Giảm giá dài hạn</span>
            <span className="font-medium text-green-600">-{formatVND(pricingOption.discount)}</span>
          </div>
        )}

        <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between items-center">
          <span className="font-bold text-gray-800">Tổng cộng</span>
          <span className="text-2xl font-bold text-[#49B096]">{formatVND(pricingOption.finalAmount)}</span>
        </div>

        <button
          onClick={onCheckout}
          disabled={isLoading}
          className="w-full mt-4 bg-[#49B096] hover:bg-[#3d947e] disabled:bg-gray-300 text-white font-bold rounded-lg px-4 py-3 transition-colors shadow-sm"
        >
          {isLoading ? 'Đang xử lý...' : 'Tiến hành thanh toán'}
        </button>
      </div>
    </div>
  );
};
