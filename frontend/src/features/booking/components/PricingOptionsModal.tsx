import React from 'react';
import type { PricingOption } from '../types/pricing.types';
import { formatVND } from '../utils/pricingFormatter';

interface Props {
  open: boolean;
  options: PricingOption[];
  recommended: PricingOption;
  onSelect?: (opt: PricingOption) => void;
  onClose: () => void;
}

export const PricingOptionsModal: React.FC<Props> = ({
  open,
  options,
  recommended,
  onSelect,
  onClose,
}) => {
  if (!open) return null;

  const handleSelect = (opt: PricingOption) => {
    if (onSelect) onSelect(opt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-2"
        >
          <svg width="18" height="18" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M13 1L1 13M1 1l12 12" />
          </svg>
        </button>

        <h3 className="text-xl font-bold text-gray-900 mb-4">Chọn phương án giá</h3>
        <p className="text-sm text-gray-500 mb-6">
          Hệ thống đã chọn phương án tiết kiệm nhất cho bạn. Tuy nhiên, bạn có thể chọn các gói khác phù hợp với nhu cầu.
        </p>

        <div className="space-y-3">
          {/* Recommended Option */}
          <div
            onClick={() => handleSelect(recommended)}
            className="cursor-pointer border-2 border-blue-500 bg-blue-50 rounded-xl p-4 flex justify-between items-center transition-all hover:bg-blue-100"
          >
            <div>
              <div className="text-blue-700 font-bold mb-1">⭐ {recommended.label}</div>
              <div className="text-sm text-blue-600/80">{recommended.breakdown.detail}</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-700">{formatVND(recommended.finalAmount)}</div>
            </div>
          </div>

          {/* Alternative Options */}
          {options.map((opt, idx) => (
            <div
              key={idx}
              onClick={() => handleSelect(opt)}
              className="cursor-pointer border border-gray-200 hover:border-blue-300 rounded-xl p-4 flex justify-between items-center transition-all"
            >
              <div>
                <div className="text-gray-800 font-medium mb-1">{opt.label}</div>
                <div className="text-xs text-gray-500">{opt.breakdown.detail}</div>
              </div>
              <div className="text-right">
                <div className="text-base font-bold text-gray-900">{formatVND(opt.finalAmount)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
