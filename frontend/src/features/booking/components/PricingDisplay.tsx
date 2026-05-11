import React, { useState } from 'react';
import { usePricing } from '../hooks/usePricing';
import { SavingsBadge } from './SavingsBadge';
import { PricingOptionsModal } from './PricingOptionsModal';
import { formatVND } from '../utils/pricingFormatter';
import type { PricingOption } from '../types/pricing.types';

interface Props {
  carId: number | string;
  startTime: string | null;
  endTime: string | null;
  onSelectOption?: (opt: PricingOption) => void;
}

export const PricingDisplay: React.FC<Props> = ({
  carId,
  startTime,
  endTime,
  onSelectOption,
}) => {
  const { data, isLoading, error } = usePricing({ carId, startTime, endTime });
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [selectedOption, setSelectedOption] = useState<PricingOption | null>(null);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-8 bg-gray-300 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600 text-sm">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const currentOption = selectedOption || data.recommended;
  const isRecommendedSelected = currentOption === data.recommended;

  const handleSelectOption = (opt: PricingOption) => {
    setSelectedOption(opt);
    if (onSelectOption) onSelectOption(opt);
  };

  return (
    <div className={`rounded-lg border p-4 ${isRecommendedSelected ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm text-gray-600">
          {currentOption.breakdown.detail}
        </span>
        <span className={`text-2xl font-bold ${isRecommendedSelected ? 'text-blue-700' : 'text-gray-900'}`}>
          {formatVND(currentOption.finalAmount)}
        </span>
      </div>

      {isRecommendedSelected && data.savings.amount > 0 && (
        <div className="mb-3">
          <SavingsBadge
            amount={data.savings.amount}
            percentage={data.savings.percentage}
          />
        </div>
      )}

      {data.alternatives.length > 0 && (
        <button
          onClick={() => setShowAlternatives(true)}
          className="text-sm text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors"
        >
          {isRecommendedSelected ? `Xem các phương án khác (${data.alternatives.length})` : 'Quay lại xem phương án khuyến nghị'}
        </button>
      )}

      <PricingOptionsModal
        open={showAlternatives}
        options={data.alternatives}
        recommended={data.recommended}
        onSelect={handleSelectOption}
        onClose={() => setShowAlternatives(false)}
      />
    </div>
  );
};
