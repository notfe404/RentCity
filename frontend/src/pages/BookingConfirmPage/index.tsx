import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../LandingPage/Header';
import Footer from '../LandingPage/Footer';
import { Check, AlertCircle, Car } from 'lucide-react';
import { toast } from 'sonner';

import BookingStepper from '@/components/booking/BookingStepper';
import BookingSidebar from '@/components/booking/BookingSidebar';
import { MOCK_LOCATIONS } from '@/data/mockLocations';
import { useAuth } from '@/hooks/useAuth';
import { getCarById } from '@/services/carApi';
import { createBooking } from '@/services/bookingApi';
import { useBooking } from '@/store/bookingStore';
import { mapApiCarToDisplayVehicle, type DisplayVehicle } from '@/utils/carMapper';
import { toBackendDateTime } from '@/utils/bookingDateTime';
import { formatVND } from '@/utils/formatters';

const EXTRAS_CONFIG = [
  { key: 'insurance' as const, label: 'Comprehensive insurance', pricePerDay: 200000 },
  { key: 'childSeat' as const, label: 'Child seat (0-4 years)', pricePerDay: 100000 },
  { key: 'gps' as const, label: 'GPS Navigation Device', pricePerDay: 50000 },
];

export default function BookingConfirmPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vehicle, setVehicleData] = useState<DisplayVehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    startDate,
    endDate,
    pickupLocationId,
    returnLocationId,
    pickupMethod,
    deliveryAddress,
    extras,
    discountAmount,
    pricingMode,
    durationLabel,
    totalDays,
    baseAmount,
    deliveryFeeAmount,
    depositAmount,
    totalAmount,
    vehicle: bookingVehicle,
  } = useBooking();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await getCarById(id);
        if (!cancelled) {
          setVehicleData(mapApiCarToDisplayVehicle(data));
        }
      } catch {
        if (!cancelled) {
          toast.error('Could not load vehicle');
          setVehicleData(null);
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
  }, [id]);

  const vehicleBranchName = vehicle?.branchName;
  const pickupName = MOCK_LOCATIONS.find((l) => l.id === pickupLocationId)?.name ?? vehicleBranchName ?? 'Vehicle branch';
  const returnName = MOCK_LOCATIONS.find((l) => l.id === returnLocationId)?.name ?? vehicleBranchName ?? 'Vehicle branch';
  const selectedPickupName = pickupMethod === 'ADDRESS_DELIVERY' ? deliveryAddress : pickupName;

  const lineItems = [
    { label: `Vehicle Rental (${durationLabel})`, amount: baseAmount },
    ...(extras.insurance ? [{ label: EXTRAS_CONFIG[0].label, amount: EXTRAS_CONFIG[0].pricePerDay * totalDays }] : []),
    ...(extras.childSeat ? [{
      label: `${EXTRAS_CONFIG[1].label} x ${Math.max(1, extras.childSeatQuantity)}`,
      amount: EXTRAS_CONFIG[1].pricePerDay * Math.max(1, extras.childSeatQuantity) * totalDays,
    }] : []),
    ...(extras.gps ? [{ label: EXTRAS_CONFIG[2].label, amount: EXTRAS_CONFIG[2].pricePerDay * totalDays }] : []),
    ...(deliveryFeeAmount > 0 ? [{ label: 'Delivery Fee', amount: deliveryFeeAmount }] : []),
    ...(discountAmount > 0 ? [{ label: 'Discount', amount: -discountAmount }] : []),
  ];

  if (!vehicle) {
    if (isLoading) {
      return (
        <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
          <Header />
          <div className="flex-1 flex items-center justify-center text-gray-500 font-bold">Loading vehicles...</div>
          <Footer />
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 bg-[#f4f8f7] rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300"><Car size={48} /></div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Vehicle Not Found</h2>
            <p className="text-gray-500 mb-8">The vehicle you are looking for does not exist.</p>
            <button onClick={() => navigate('/search')} className="bg-[#78ad44] text-white px-8 py-3 rounded-full font-bold shadow-lg">Back to Search</button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleCreateBooking = async () => {
    if (!vehicle || !bookingVehicle || isSubmitting) {
      return;
    }

    if (new Date(startDate).getTime() <= Date.now()) {
      toast.error('Pick-up time must be in the future');
      return;
    }

    if (new Date(endDate).getTime() <= new Date(startDate).getTime()) {
      toast.error('Return time must be after pick-up time');
      return;
    }

    if (pickupMethod === 'ADDRESS_DELIVERY' && !deliveryAddress.trim()) {
      toast.error('Please enter the delivery address');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await createBooking({
        vehicleId: Number(vehicle.id),
        startTime: toBackendDateTime(startDate),
        endTime: toBackendDateTime(endDate),
        pricingMode,
        pickupMethod,
        deliveryAddress: pickupMethod === 'ADDRESS_DELIVERY' ? deliveryAddress.trim() : undefined,
        insuranceSelected: extras.insurance,
        childSeatQuantity: extras.childSeat ? Math.max(1, extras.childSeatQuantity) : 0,
        gpsSelected: extras.gps,
      });

      toast.success('Booking created successfully');
      navigate(`/booking/${data.id}/payment`);
    } catch (error) {
      const responseData = (error as { response?: { data?: Record<string, string> } }).response?.data;
      const message =
        responseData?.error
        ?? responseData?.startTime
        ?? responseData?.endTime
        ?? responseData?.vehicleId
        ?? Object.values(responseData ?? {})[0]
        ?? 'Could not create booking';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <Header />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-1">
        <BookingStepper currentStep={2} />

        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1 w-full space-y-8">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
              <h2 className="text-3xl font-black text-gray-900 mb-2">Review Your Booking</h2>
              <p className="text-sm font-medium text-gray-500 mb-8">Please review the information before payment.</p>

              <div className="space-y-6">
                <div className="p-5 border border-gray-100 rounded-2xl bg-[#f4f8f7]">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm font-medium">
                    <div><span className="text-gray-400 block mb-1">Full Name</span><span className="text-gray-900">{user?.fullName ?? 'Guest'}</span></div>
                    <div><span className="text-gray-400 block mb-1">Email</span><span className="text-gray-900">{user?.email ?? '—'}</span></div>
                    <div><span className="text-gray-400 block mb-1">Phone</span><span className="text-gray-900">{user?.phone ?? '—'}</span></div>
                  </div>
                </div>

                <div className="p-5 border border-gray-100 rounded-2xl bg-[#f4f8f7]">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Pick-up Method</h3>
                  <div className="flex items-start gap-3">
                    <Check size={18} className="mt-0.5 shrink-0 text-[#78ad44]" />
                    <div>
                      <p className="text-sm font-black text-gray-900">
                        {pickupMethod === 'ADDRESS_DELIVERY' ? 'Deliver to address' : 'Pick up at branch'}
                      </p>
                      <p className="mt-1 text-sm font-medium leading-6 text-gray-600">{selectedPickupName}</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 border border-gray-100 rounded-2xl bg-[#f4f8f7]">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Selected Services</h3>
                  <ul className="space-y-2 text-sm font-medium text-gray-700">
                    {EXTRAS_CONFIG.map((e) => {
                      const quantity = e.key === 'childSeat' ? Math.max(1, extras.childSeatQuantity) : 1;
                      const selected = extras[e.key];
                      return selected ? (
                        <li key={e.key} className="flex items-center gap-2">
                          <Check size={16} className="text-[#78ad44]" />
                          {e.label}{e.key === 'childSeat' ? ` x ${quantity}` : ''} — {formatVND(e.pricePerDay * quantity * totalDays)}
                        </li>
                      ) : (
                        <li key={e.key} className="flex items-center gap-2 text-gray-400">
                          <XIcon /> {e.label} (Not selected)
                        </li>
                      );
                    })}
                    {deliveryFeeAmount > 0 && (
                      <li className="flex items-center gap-2">
                        <Check size={16} className="text-[#78ad44]" />
                        Delivery Fee — {formatVND(deliveryFeeAmount)}
                      </li>
                    )}
                  </ul>
                </div>

                <div className="p-5 border border-[#78ad44]/30 rounded-2xl bg-[#78ad44]/5 flex items-start gap-4">
                  <AlertCircle className="text-[#78ad44] shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Cancellation Policy</h4>
                    <p className="text-xs font-medium text-gray-600 mt-1 leading-relaxed">
                      The reservation fee is refundable only if the booking is cancelled at least 24 hours before pick-up. The separate vehicle deposit will be collected when the customer picks up the vehicle.
                    </p>
                  </div>
                </div>

                <label className="flex items-start gap-3 mt-6 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-[#78ad44] focus:ring-[#78ad44] accent-[#78ad44]"
                  />
                  <span className="text-sm font-medium text-gray-600 leading-relaxed">
                    I have read and agree to the{' '}
                    <a href="#" className="text-[#78ad44] hover:underline font-bold">Terms of Use</a>{' '}
                    and{' '}
                    <a href="#" className="text-[#78ad44] hover:underline font-bold">Privacy Policy</a>.
                  </span>
                </label>
              </div>
            </div>
          </div>

          <BookingSidebar
            vehicle={vehicle}
            pickupLocation={selectedPickupName}
            returnLocation={returnName}
            startDate={startDate}
            endDate={endDate}
            durationLabel={durationLabel}
            lineItems={lineItems}
            depositAmount={depositAmount}
            securityDepositAmount={vehicle.deposit ?? 0}
            totalAmount={totalAmount}
            actionLabel={isSubmitting ? 'Creating booking...' : 'Create Booking'}
            actionDisabled={!agreed || isSubmitting}
            onAction={handleCreateBooking}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
