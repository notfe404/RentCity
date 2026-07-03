import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../LandingPage/Header';
import Footer from '../LandingPage/Footer';
import { CheckCircle2, FileText, Home, Clock3, Shield, CalendarDays, CarFront } from 'lucide-react';
import { toast } from 'sonner';

import { getMyBooking } from '@/services/bookingApi';
import { BOOKING_STATUS_META, DEPOSIT_STATUS_META, getBookingDurationLabel, getBookingVehicleImage, getBookingVehicleName } from '@/utils/bookingMapper';
import { formatDateTime, formatVND } from '@/utils/formatters';
import type { ApiBookingResponse } from '@/types';

export default function PaymentResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<ApiBookingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await getMyBooking(id);
        if (!cancelled) {
          setBooking(data);
        }
      } catch {
        if (!cancelled) {
          toast.error('Could not load booking result');
          navigate('/my-bookings', { replace: true });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  const content = useMemo(() => {
    if (!booking) {
      return null;
    }

    switch (booking.status) {
      case 'PENDING':
        return {
          title: 'Booking Created',
          description: 'Your booking has been recorded and is waiting for the next step.',
          accentClass: 'text-orange-500',
          iconBg: 'bg-[#fff7e8]',
          iconColor: 'text-orange-500',
          icon: <Clock3 size={48} />,
        };
      case 'CONFIRMED':
        return {
          title: 'Booking Confirmed',
          description: 'Your vehicle has been reserved successfully. You can review all booking information below.',
          accentClass: 'text-[#78ad44]',
          iconBg: 'bg-[#e9f2eb]',
          iconColor: 'text-[#78ad44]',
          icon: <CheckCircle2 size={48} />,
        };
      case 'PAID':
        return {
          title: 'Security Deposit Paid',
          description: 'The vehicle security deposit has been recorded. The booking is ready for staff handover.',
          accentClass: 'text-emerald-600',
          iconBg: 'bg-emerald-50',
          iconColor: 'text-emerald-600',
          icon: <CheckCircle2 size={48} />,
        };
      case 'COMPLETED':
        return {
          title: booking.finalPaymentStatus === 'PAID' ? 'Final Rental Payment Paid' : 'Vehicle Return Completed',
          description: booking.finalPaymentStatus === 'PAID'
            ? 'The remaining rental amount and any overdue fees have been paid.'
            : 'The return report has been recorded. Please complete the remaining payment request.',
          accentClass: 'text-[#78ad44]',
          iconBg: 'bg-[#e9f2eb]',
          iconColor: 'text-[#78ad44]',
          icon: <CheckCircle2 size={48} />,
        };
      case 'CANCELLED':
        return {
          title: 'Booking Cancelled',
          description: 'This booking is no longer active. You can still view the booking details for history.',
          accentClass: 'text-red-500',
          iconBg: 'bg-red-50',
          iconColor: 'text-red-500',
          icon: <Clock3 size={48} />,
        };
      default:
        return {
          title: 'Booking Result',
          description: 'Your booking information is ready.',
          accentClass: 'text-[#78ad44]',
          iconBg: 'bg-[#e9f2eb]',
          iconColor: 'text-[#78ad44]',
          icon: <CheckCircle2 size={48} />,
        };
    }
  }, [booking]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
        <Header />
        <div className="flex-1 flex items-center justify-center text-gray-500 font-bold">Loading booking result...</div>
        <Footer />
      </div>
    );
  }

  if (!booking || !content) {
    return null;
  }

  const statusMeta = BOOKING_STATUS_META[booking.status];
  const depositMeta = DEPOSIT_STATUS_META[booking.depositStatus];
  const vehicleName = getBookingVehicleName(booking);
  const vehicleImage = getBookingVehicleImage(booking);
  const durationLabel = getBookingDurationLabel(booking);
  const extraServiceLabels = [
    booking.insuranceSelected ? 'Insurance' : null,
    (booking.childSeatQuantity ?? 0) > 0 ? `Child seat x ${booking.childSeatQuantity}` : null,
    booking.gpsSelected ? 'GPS' : null,
  ].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <Header />

      <div className="flex-1 py-32 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="max-w-5xl mx-auto bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl border border-gray-100 overflow-hidden relative"
        >
          <div className="absolute -top-24 -right-24 w-52 h-52 bg-[#B4D581] opacity-20 blur-3xl rounded-full" />
          <div className="absolute top-1/2 -left-24 w-48 h-48 bg-[#49B096] opacity-10 blur-3xl rounded-full" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.2fr_0.9fr] gap-10">
            <div className="space-y-8">
              <div className="flex items-start gap-5">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.25 }}
                  className={`w-24 h-24 rounded-full flex items-center justify-center border-4 border-white shadow-lg ${content.iconBg} ${content.iconColor}`}
                >
                  {content.icon}
                </motion.div>
                <div className="pt-2">
                  <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-3">{content.title}</h1>
                  <p className="text-gray-500 font-medium leading-relaxed max-w-xl">{content.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-[#f4f8f7] p-5 rounded-2xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Booking Code</p>
                  <p className="text-2xl font-black text-[#78ad44] tracking-wide">{booking.bookingCode}</p>
                </div>
                <div className="bg-[#f4f8f7] p-5 rounded-2xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Booking Status</p>
                  <p className={`text-lg font-black ${statusMeta.color}`}>{statusMeta.label}</p>
                </div>
                <div className="bg-[#f4f8f7] p-5 rounded-2xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Reservation Fee</p>
                  <p className="text-2xl font-black text-[#78ad44]">{formatVND(booking.depositAmount)}</p>
                </div>
                <div className="bg-[#f4f8f7] p-5 rounded-2xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Reservation Fee Status</p>
                  <p className={`text-lg font-black ${depositMeta.color}`}>{depositMeta.label}</p>
                </div>
                <div className="bg-[#f4f8f7] p-5 rounded-2xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Vehicle Deposit</p>
                  <p className="text-2xl font-black text-emerald-600">{formatVND(booking.securityDepositAmount)}</p>
                  <p className="mt-1 text-xs font-bold text-gray-500">{booking.securityDepositStatus.replaceAll('_', ' ')}</p>
                </div>
                {booking.finalPaymentStatus !== 'NOT_DUE' && (
                  <div className="bg-[#f4f8f7] p-5 rounded-2xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Payment on Return</p>
                    <p className="text-2xl font-black text-[#78ad44]">{formatVND(booking.finalRentalAmount)}</p>
                    <p className="mt-1 text-xs font-bold text-gray-500">{booking.finalPaymentStatus.replaceAll('_', ' ')}</p>
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm">
                <h2 className="text-xl font-black text-gray-900 mb-5">Rental Schedule</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CalendarDays size={18} className="text-[#78ad44] mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Pick-up</p>
                      <p className="text-sm font-black text-gray-900">{formatDateTime(booking.startTime)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CalendarDays size={18} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Return</p>
                      <p className="text-sm font-black text-gray-900">{formatDateTime(booking.endTime)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield size={18} className="text-[#78ad44] mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Free Cancellation Until</p>
                      <p className="text-sm font-black text-gray-900">{formatDateTime(booking.freeCancelUntil)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate(`/my-bookings/${booking.id}`)}
                  className="flex-1 px-8 py-4 bg-[#212529] hover:bg-[#111] text-white font-bold rounded-2xl transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  <FileText size={18} /> Details booking
                </button>
                <button
                  onClick={() => navigate('/my-bookings')}
                  className="flex-1 px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-2xl transition-colors border-2 border-gray-200 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} /> My Bookings
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-2xl transition-colors border-2 border-gray-200 flex items-center justify-center gap-2"
                >
                  <Home size={18} /> Home
                </button>
              </div>
            </div>

            <aside className="bg-[#f4f8f7] rounded-[2rem] p-6 border border-gray-100">
              <h3 className="text-xl font-black text-gray-900 mb-5">Vehicle Information</h3>
              <div className="rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100 mb-5">
                {vehicleImage ? (
                  <img src={vehicleImage} alt={vehicleName} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400">
                    <CarFront size={36} />
                  </div>
                )}
                <div className="p-5">
                  <p className="text-lg font-black text-gray-900">{vehicleName}</p>
                  <p className="text-sm font-bold text-gray-400 mt-1">{booking.vehicleLicensePlate ?? 'No license plate yet'}</p>
                </div>
              </div>

              <div className="space-y-3 text-sm font-bold text-gray-600">
                <div className="flex justify-between items-center">
                  <span>Rental Duration</span>
                  <span className="text-gray-900">{durationLabel}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Rental Price</span>
                  <span className="text-gray-900">{formatVND(booking.baseAmount)}</span>
                </div>
                {(booking.extraServicesAmount ?? 0) > 0 && (
                  <div className="flex justify-between items-start gap-4">
                    <span>
                      Extra services
                      {extraServiceLabels && (
                        <span className="mt-0.5 block text-xs font-semibold text-gray-400">{extraServiceLabels}</span>
                      )}
                    </span>
                    <span className="shrink-0 text-gray-900">{formatVND(booking.extraServicesAmount)}</span>
                  </div>
                )}
                {(booking.deliveryFeeAmount ?? 0) > 0 && (
                  <div className="flex justify-between items-center">
                    <span>Delivery Fee</span>
                    <span className="text-gray-900">{formatVND(booking.deliveryFeeAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span>Reservation Fee (30%)</span>
                  <span className={content.accentClass}>{formatVND(booking.depositAmount)}</span>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-gray-200 flex justify-between items-center bg-white p-4 rounded-xl">
                <span className="font-black text-gray-700">Booking Total</span>
                <span className="text-2xl font-black text-[#78ad44]">{formatVND(booking.totalAmount)}</span>
              </div>
            </aside>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
