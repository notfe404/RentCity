import { useState, useEffect } from 'react';
import type { PricingResult, PricingOption } from '../types/pricing.types';
import { useRentalDuration } from './useRentalDuration';

interface UsePricingParams {
  carId: number | string;
  startTime: string | null;
  endTime: string | null;
  enabled?: boolean;
}

// Giả lập bảng giá cho một xe (VD: Toyota Vios)
const MOCK_RULES = {
  hourly_rate: 80000,
  daily_rate: 800000,
  weekly_rate: 5000000,
  monthly_rate: 18000000,
};

export const usePricing = ({
  carId,
  startTime,
  endTime,
  enabled = true,
}: UsePricingParams) => {
  const [data, setData] = useState<PricingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalHours = useRentalDuration(startTime, endTime);

  useEffect(() => {
    if (!enabled || !startTime || !endTime || totalHours <= 0) {
      setData(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    // Mock API Call
    setTimeout(() => {
      if (!isMounted) return;

      try {
        // Thuật toán Best Price Mock
        const priceA = totalHours * MOCK_RULES.hourly_rate;

        const fullDays = Math.floor(totalHours / 24);
        const remainHours = totalHours - fullDays * 24;
        let priceB = fullDays * MOCK_RULES.daily_rate + remainHours * MOCK_RULES.hourly_rate;
        // Logic làm tròn lên ngày
        if (remainHours * MOCK_RULES.hourly_rate > MOCK_RULES.daily_rate) {
           priceB = (fullDays + 1) * MOCK_RULES.daily_rate;
        }

        const fullWeeks = Math.floor(totalHours / (24 * 7));
        const remainHoursC = totalHours - fullWeeks * 168;
        const remainDaysC = Math.floor(remainHoursC / 24);
        const remainHrsC = remainHoursC - remainDaysC * 24;
        const priceC = fullWeeks * MOCK_RULES.weekly_rate + remainDaysC * MOCK_RULES.daily_rate + remainHrsC * MOCK_RULES.hourly_rate;

        const fullMonths = Math.floor(totalHours / (24 * 30));
        const remainHoursD = totalHours - fullMonths * 720;
        const remainWeeksD = Math.floor(remainHoursD / 168);
        const remainDaysD = Math.floor((remainHoursD - remainWeeksD * 168) / 24);
        const remainHrsD = remainHoursD % 24;
        const priceD = fullMonths * MOCK_RULES.monthly_rate + remainWeeksD * MOCK_RULES.weekly_rate + remainDaysD * MOCK_RULES.daily_rate + remainHrsD * MOCK_RULES.hourly_rate;

        const alternatives: PricingOption[] = [
          {
            mode: 'HOURLY',
            baseAmount: priceA,
            surcharge: 0,
            discount: 0,
            finalAmount: priceA,
            breakdown: { hours: totalHours, detail: `${totalHours} giờ × 80.000đ` },
            label: 'Theo giờ',
          },
          {
            mode: 'DAILY',
            baseAmount: priceB,
            surcharge: 0,
            discount: 0,
            finalAmount: priceB,
            breakdown: { days: fullDays, hours: remainHours, detail: `${fullDays} ngày × 800.000đ + ${remainHours} giờ × 80.000đ` },
            label: 'Theo ngày',
          },
        ];

        if (fullWeeks > 0) {
          alternatives.push({
            mode: 'WEEKLY',
            baseAmount: priceC,
            surcharge: 0,
            discount: 0,
            finalAmount: priceC,
            breakdown: { weeks: fullWeeks, days: remainDaysC, hours: remainHrsC, detail: `${fullWeeks} tuần × 5.000.000đ + ...` },
            label: 'Theo tuần',
          });
        }
        
        if (fullMonths > 0) {
           alternatives.push({
            mode: 'MONTHLY',
            baseAmount: priceD,
            surcharge: 0,
            discount: 0,
            finalAmount: priceD,
            breakdown: { months: fullMonths, weeks: remainWeeksD, detail: `${fullMonths} tháng × 18.000.000đ + ...` },
            label: 'Theo tháng',
           });
        }

        const bestOption = alternatives.reduce((min, opt) => opt.finalAmount < min.finalAmount ? opt : min, alternatives[0]);
        // Cập nhật lại nhãn cho recommended
        bestOption.label = 'Khuyến nghị — Tiết kiệm nhất';
        bestOption.mode = 'MIXED'; // Giả sử là MIXED

        const savingsAmount = alternatives[0].finalAmount - bestOption.finalAmount; // So với gói giờ

        setData({
          recommended: bestOption,
          alternatives: alternatives.filter(a => a !== bestOption),
          savings: {
            amount: savingsAmount,
            percentage: savingsAmount > 0 ? (savingsAmount / alternatives[0].finalAmount) * 100 : 0,
            comparedTo: 'HOURLY',
          },
          totalHours,
          validUntil: new Date(Date.now() + 5 * 60000).toISOString(),
        });
      } catch (err) {
        setError('Có lỗi xảy ra khi tính giá');
      } finally {
        setIsLoading(false);
      }
    }, 800); // Giả lập delay mạng

    return () => {
      isMounted = false;
    };
  }, [carId, startTime, endTime, totalHours, enabled]);

  return { data, isLoading, error };
};
