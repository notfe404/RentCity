import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { MockVehicle } from '@/data/mockVehicles';
import type { ApiPricingMode, ApiVehiclePickupMethod } from '@/types';
import {
  getDailyRentalAmount,
  getDefaultBookingRange,
  getDurationDays,
  getDurationHours,
  getDurationLabel,
  inferPricingMode,
} from '@/utils/bookingDateTime';

// ============================================================
// Booking Context — Quản lý luồng đặt xe
// ============================================================

interface BookingExtras {
  insurance: boolean;    // Bảo hiểm toàn diện
  childSeat: boolean;    // Ghế trẻ em
  gps: boolean;          // Bộ định vị GPS
}

const EXTRAS_PRICE: Record<keyof BookingExtras, number> = {
  insurance: 200000,   // 200K/ngày
  childSeat: 100000,   // 100K/ngày
  gps: 50000,          // 50K/ngày
};

interface BookingState {
  vehicle: MockVehicle | null;
  pickupLocationId: string;
  returnLocationId: string;
  pickupMethod: ApiVehiclePickupMethod;
  deliveryAddress: string;
  startDate: string;       // yyyy-mm-ddThh:mm
  endDate: string;
  extras: BookingExtras;
  customerNote: string;
  promotionCode: string;
  discountAmount: number;
}

interface BookingContextValue extends BookingState {
  pricingMode: ApiPricingMode;
  totalHours: number;
  totalDays: number;
  durationLabel: string;
  billingUnitLabel: string;
  unitRateAmount: number;
  baseAmount: number;
  extrasAmount: number;
  totalAmount: number;
  depositAmount: number;

  setVehicle: (v: MockVehicle) => void;
  setPickupLocation: (id: string) => void;
  setReturnLocation: (id: string) => void;
  setPickupMethod: (method: ApiVehiclePickupMethod) => void;
  setDeliveryAddress: (address: string) => void;
  setStartDate: (d: string) => void;
  setEndDate: (d: string) => void;
  toggleExtra: (key: keyof BookingExtras) => void;
  setCustomerNote: (note: string) => void;
  setPromotionCode: (code: string) => void;
  applyPromotion: () => void;
  reset: () => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

const INITIAL: BookingState = {
  vehicle: null,
  pickupLocationId: 'loc-cau-giay',
  returnLocationId: 'loc-cau-giay',
  pickupMethod: 'BRANCH_PICKUP',
  deliveryAddress: '',
  ...getDefaultBookingRange(),
  extras: { insurance: true, childSeat: false, gps: false },
  customerNote: '',
  promotionCode: '',
  discountAmount: 0,
};

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BookingState>(INITIAL);

  const pricingMode = inferPricingMode(state.startDate, state.endDate);
  const totalHours = getDurationHours(state.startDate, state.endDate);
  const totalDays = getDurationDays(state.startDate, state.endDate);
  const durationLabel = getDurationLabel(state.startDate, state.endDate, pricingMode);
  const billingUnitLabel = pricingMode === 'HOURLY' ? 'giờ' : 'ngày';
  const unitRateAmount = pricingMode === 'HOURLY'
    ? Math.round((state.vehicle?.price ?? 0) / 24)
    : (state.vehicle?.price ?? 0);
  const baseAmount = pricingMode === 'HOURLY'
    ? unitRateAmount * totalHours
    : getDailyRentalAmount(state.startDate, state.endDate, state.vehicle?.price ?? 0);
  const extrasAmount = Object.entries(state.extras).reduce(
    (sum, [key, on]) => sum + (on ? EXTRAS_PRICE[key as keyof BookingExtras] * totalDays : 0), 0
  );
  const totalAmount = Math.max(0, baseAmount + extrasAmount - state.discountAmount);
  const depositAmount = Math.round(totalAmount * 0.3);

  const setVehicle = useCallback((v: MockVehicle) => setState(s => ({ ...s, vehicle: v })), []);
  const setPickupLocation = useCallback((id: string) => setState(s => ({ ...s, pickupLocationId: id })), []);
  const setReturnLocation = useCallback((id: string) => setState(s => ({ ...s, returnLocationId: id })), []);
  const setPickupMethod = useCallback((method: ApiVehiclePickupMethod) => setState(s => ({
    ...s,
    pickupMethod: method,
    deliveryAddress: method === 'BRANCH_PICKUP' ? '' : s.deliveryAddress,
  })), []);
  const setDeliveryAddress = useCallback((address: string) => setState(s => ({ ...s, deliveryAddress: address })), []);
  const setStartDate = useCallback((d: string) => setState(s => ({ ...s, startDate: d })), []);
  const setEndDate = useCallback((d: string) => setState(s => ({ ...s, endDate: d })), []);
  const toggleExtra = useCallback((key: keyof BookingExtras) =>
    setState(s => ({ ...s, extras: { ...s.extras, [key]: !s.extras[key] } })), []);
  const setCustomerNote = useCallback((note: string) => setState(s => ({ ...s, customerNote: note })), []);
  const setPromotionCode = useCallback((code: string) => setState(s => ({ ...s, promotionCode: code })), []);

  const applyPromotion = useCallback(() => {
    // Mock: mã "RENTCITY10" giảm 10%
    if (state.promotionCode.toUpperCase() === 'RENTCITY10') {
      setState(s => ({ ...s, discountAmount: Math.round(baseAmount * 0.1) }));
    } else {
      setState(s => ({ ...s, discountAmount: 0 }));
    }
  }, [state.promotionCode, baseAmount]);

  const reset = useCallback(() => setState({
    ...INITIAL,
    ...getDefaultBookingRange(),
  }), []);

  return (
    <BookingContext.Provider value={{
      ...state, pricingMode, totalHours, totalDays, durationLabel, billingUnitLabel, unitRateAmount,
      baseAmount, extrasAmount, totalAmount, depositAmount,
      setVehicle, setPickupLocation, setReturnLocation, setStartDate, setEndDate,
      setPickupMethod, setDeliveryAddress,
      toggleExtra, setCustomerNote, setPromotionCode, applyPromotion, reset,
    }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used within BookingProvider');
  return ctx;
}
