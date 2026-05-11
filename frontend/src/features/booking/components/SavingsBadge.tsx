import React from 'react';
import { formatVND } from '../utils/pricingFormatter';

interface Props {
  amount: number;
  percentage: number;
}

export const SavingsBadge: React.FC<Props> = ({ amount, percentage }) => {
  if (amount <= 0) return null;

  return (
    <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Tiết kiệm {formatVND(amount)} ({percentage.toFixed(0)}%)
    </span>
  );
};
