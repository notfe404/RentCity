export type PricingMode = 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'MIXED';

export interface PricingOption {
  mode: PricingMode;
  baseAmount: number;
  surcharge: number;
  discount: number;
  finalAmount: number;
  breakdown: {
    months?: number;
    weeks?: number;
    days?: number;
    hours?: number;
    detail: string;
  };
  label: string;
}

export interface PricingResult {
  recommended: PricingOption;
  alternatives: PricingOption[];
  savings: {
    amount: number;
    percentage: number;
    comparedTo: PricingMode;
  };
  totalHours: number;
  validUntil: string;
}
