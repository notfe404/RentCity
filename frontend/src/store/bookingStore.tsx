import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { MockVehicle } from '@/data/mockVehicles';

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
  startDate: string;       // yyyy-mm-dd
  endDate: string;
  extras: BookingExtras;
  customerNote: string;
  promotionCode: string;
  discountAmount: number;
}

interface BookingContextValue extends BookingState {
  totalDays: number;
  baseAmount: number;
  extrasAmount: number;
  totalAmount: number;
  depositAmount: number;

  setVehicle: (v: MockVehicle) => void;
  setPickupLocation: (id: string) => void;
  setReturnLocation: (id: string) => void;
  setStartDate: (d: string) => void;
  setEndDate: (d: string) => void;
  toggleExtra: (key: keyof BookingExtras) => void;
  setCustomerNote: (note: string) => void;
  setPromotionCode: (code: string) => void;
  applyPromotion: () => void;
  reset: () => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

function getDefaultDates() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() + 1);
  const end = new Date(now);
  end.setDate(now.getDate() + 4);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

const INITIAL: BookingState = {
  vehicle: null,
  pickupLocationId: 'loc-02',
  returnLocationId: 'loc-02',
  ...getDefaultDates(),
  extras: { insurance: true, childSeat: false, gps: false },
  customerNote: '',
  promotionCode: '',
  discountAmount: 0,
};

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BookingState>(INITIAL);

  const totalDays = Math.max(1, Math.ceil(
    (new Date(state.endDate).getTime() - new Date(state.startDate).getTime()) / (1000 * 60 * 60 * 24)
  ));
  const baseAmount = (state.vehicle?.price ?? 0) * totalDays;
  const extrasAmount = Object.entries(state.extras).reduce(
    (sum, [key, on]) => sum + (on ? EXTRAS_PRICE[key as keyof BookingExtras] * totalDays : 0), 0
  );
  const totalAmount = Math.max(0, baseAmount + extrasAmount - state.discountAmount);
  const depositAmount = Math.round(totalAmount * 0.3);

  const setVehicle = useCallback((v: MockVehicle) => setState(s => ({ ...s, vehicle: v })), []);
  const setPickupLocation = useCallback((id: string) => setState(s => ({ ...s, pickupLocationId: id })), []);
  const setReturnLocation = useCallback((id: string) => setState(s => ({ ...s, returnLocationId: id })), []);
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

  const reset = useCallback(() => setState(INITIAL), []);

  return (
    <BookingContext.Provider value={{
      ...state, totalDays, baseAmount, extrasAmount, totalAmount, depositAmount,
      setVehicle, setPickupLocation, setReturnLocation, setStartDate, setEndDate,
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
