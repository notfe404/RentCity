import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../LandingPage/Header';
import Footer from '../LandingPage/Footer';
import { Shield, Baby, Navigation, Tag, Car, Building2, Truck, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';

import BookingStepper from '@/components/booking/BookingStepper';
import BookingSidebar from '@/components/booking/BookingSidebar';
import { MOCK_LOCATIONS } from '@/data/mockLocations';
import { getCarById } from '@/services/carApi';
import { mapApiCarToDisplayVehicle, type DisplayVehicle } from '@/utils/carMapper';
import { useAuth } from '@/hooks/useAuth';
import { useBooking } from '@/store/bookingStore';
import { formatVND } from '@/utils/formatters';

const EXTRAS = [
  {
    key: 'insurance' as const,
    icon: Shield,
    label: 'Comprehensive insurance',
    desc: 'Covers damage and theft with a 0 VND deductible. Travel with peace of mind.',
    pricePerDay: 200000,
  },
  {
    key: 'childSeat' as const,
    icon: Baby,
    label: 'Child seat (0-4 years)',
    desc: 'European-standard safety seat for infants and young children.',
    pricePerDay: 100000,
  },
  {
    key: 'gps' as const,
    icon: Navigation,
    label: 'GPS Navigation Device',
    desc: 'Dedicated navigation device that does not depend on mobile data.',
    pricePerDay: 50000,
  },
];

export default function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vehicle, setVehicleData] = useState<DisplayVehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const {
    vehicle: bookingVehicle,
    startDate,
    endDate,
    pickupLocationId,
    returnLocationId,
    pickupMethod,
    deliveryAddress,
    extras,
    customerNote,
    promotionCode,
    discountAmount,
    durationLabel,
    totalDays,
    baseAmount,
    deliveryFeeAmount,
    depositAmount,
    totalAmount,
    setVehicle,
    setPickupMethod,
    setDeliveryAddress,
    toggleExtra,
    setChildSeatQuantity,
    setCustomerNote,
    setPromotionCode,
    applyPromotion,
  } = useBooking();

  const [promoTried, setPromoTried] = useState(false);

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
          toast.error('Could not load vehicle from backend');
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

  useEffect(() => {
    if (vehicle && (!bookingVehicle || bookingVehicle.id !== vehicle.id)) {
      setVehicle(vehicle);
    }
  }, [vehicle, bookingVehicle, setVehicle]);

  const applyPromo = () => {
    applyPromotion();
    setPromoTried(true);
  };

  const vehicleBranchName = vehicle?.branchName;
  const pickupName = MOCK_LOCATIONS.find((l) => l.id === pickupLocationId)?.name ?? vehicleBranchName ?? 'Vehicle branch';
  const returnName = MOCK_LOCATIONS.find((l) => l.id === returnLocationId)?.name ?? vehicleBranchName ?? 'Vehicle branch';
  const selectedPickupName = pickupMethod === 'ADDRESS_DELIVERY'
    ? (deliveryAddress.trim() || 'Deliver to address')
    : pickupName;

  const lineItems = [
    { label: `Vehicle Rental (${durationLabel})`, amount: baseAmount },
    ...(extras.insurance ? [{ label: EXTRAS[0].label, amount: EXTRAS[0].pricePerDay * totalDays }] : []),
    ...(extras.childSeat ? [{
      label: `${EXTRAS[1].label} x ${Math.max(1, extras.childSeatQuantity)}`,
      amount: EXTRAS[1].pricePerDay * Math.max(1, extras.childSeatQuantity) * totalDays,
    }] : []),
    ...(extras.gps ? [{ label: EXTRAS[2].label, amount: EXTRAS[2].pricePerDay * totalDays }] : []),
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

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <Header />

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-1">
        <BookingStepper currentStep={1} />

        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1 w-full space-y-8">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-black text-gray-900 mb-6">Renter Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-bold text-gray-700 ml-2 mb-2 block">Full Name</label>
                  <input type="text" defaultValue={user?.fullName ?? ''} className="w-full bg-[#f4f8f7] border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-[#78ad44] outline-none text-gray-700 font-medium" />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 ml-2 mb-2 block">Email</label>
                  <input type="email" defaultValue={user?.email ?? ''} className="w-full bg-[#f4f8f7] border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-[#78ad44] outline-none text-gray-700 font-medium" />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 ml-2 mb-2 block">Phone Number</label>
                  <input type="text" defaultValue={user?.phone ?? ''} className="w-full bg-[#f4f8f7] border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-[#78ad44] outline-none text-gray-700 font-medium" />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 ml-2 mb-2 block">Notes</label>
                  <input
                    type="text"
                    placeholder="Example: Need an extra child seat..."
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    className="w-full bg-[#f4f8f7] border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-[#78ad44] outline-none text-gray-700 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-black text-gray-900 mb-2">Pick-up Method</h2>
              <p className="text-sm font-medium text-gray-500 mb-6">Choose branch pick-up or let RentCity deliver the vehicle to your address.</p>

              <div className="grid gap-4 md:grid-cols-2">
                <label className={`flex cursor-pointer items-start gap-4 rounded-2xl border-2 p-5 transition-all ${
                  pickupMethod === 'BRANCH_PICKUP' ? 'border-[#78ad44] bg-[#f4f8f7]' : 'border-gray-100 hover:border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="pickupMethod"
                    value="BRANCH_PICKUP"
                    checked={pickupMethod === 'BRANCH_PICKUP'}
                    onChange={() => setPickupMethod('BRANCH_PICKUP')}
                    className="mt-1 h-5 w-5 accent-[#78ad44]"
                  />
                  <span>
                    <span className="flex items-center gap-2 font-black text-gray-900"><Building2 size={18} className="text-[#78ad44]" /> Pick up at branch</span>
                    <span className="mt-2 block text-sm font-medium leading-6 text-gray-500">Pick up directly at {pickupName}.</span>
                  </span>
                </label>

                <label className={`flex cursor-pointer items-start gap-4 rounded-2xl border-2 p-5 transition-all ${
                  pickupMethod === 'ADDRESS_DELIVERY' ? 'border-[#78ad44] bg-[#f4f8f7]' : 'border-gray-100 hover:border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="pickupMethod"
                    value="ADDRESS_DELIVERY"
                    checked={pickupMethod === 'ADDRESS_DELIVERY'}
                    onChange={() => setPickupMethod('ADDRESS_DELIVERY')}
                    className="mt-1 h-5 w-5 accent-[#78ad44]"
                  />
                  <span>
                    <span className="flex items-center gap-2 font-black text-gray-900"><Truck size={18} className="text-[#78ad44]" /> Deliver to address</span>
                    <span className="mt-2 block text-sm font-medium leading-6 text-gray-500">RentCity will deliver the vehicle to the address you provide.</span>
                    <span className="mt-1 block text-xs font-bold text-[#78ad44]">Default delivery fee {formatVND(200000)}.</span>
                  </span>
                </label>
              </div>

              {pickupMethod === 'ADDRESS_DELIVERY' && (
                <div className="mt-5">
                  <label htmlFor="delivery-address" className="ml-2 mb-2 block text-sm font-bold text-gray-700">Delivery Address *</label>
                  <textarea
                    id="delivery-address"
                    rows={3}
                    maxLength={500}
                    required
                    value={deliveryAddress}
                    onChange={(event) => setDeliveryAddress(event.target.value)}
                    placeholder="Example: 123 Nguyen Trai, Ben Thanh Ward, District 1, Ho Chi Minh City"
                    className="w-full resize-none rounded-2xl border-0 bg-[#f4f8f7] px-5 py-4 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-[#78ad44]"
                  />
                  <div className="mt-2 flex justify-between px-2 text-xs font-bold">
                    <span className={deliveryAddress.trim() ? 'text-[#56832d]' : 'text-red-500'}>
                      {deliveryAddress.trim() ? 'The address will be confirmed before delivery.' : 'Please enter the delivery address.'}
                    </span>
                    <span className="text-gray-400">{deliveryAddress.length}/500</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-black text-gray-900 mb-6">Extra services</h2>
              <div className="space-y-4">
                {EXTRAS.map((ext) => {
                  const isChildSeat = ext.key === 'childSeat';
                  const selected = extras[ext.key];
                  const quantity = Math.max(1, extras.childSeatQuantity);

                  return (
                    <div
                      key={ext.key}
                      className={`flex items-start p-5 rounded-2xl border-2 transition-all ${
                        selected ? 'border-[#78ad44] bg-[#f4f8f7]' : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleExtra(ext.key)}
                        className="mt-1 w-5 h-5 rounded border-gray-300 text-[#78ad44] focus:ring-[#78ad44] accent-[#78ad44] cursor-pointer"
                      />
                      <div className="ml-4 flex-1">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <span className="font-bold text-gray-900 flex items-center gap-2">
                            <ext.icon size={18} className="text-[#78ad44]" /> {ext.label}
                          </span>
                          <span className="font-black text-[#78ad44]">
                            {formatVND(ext.pricePerDay)} / day{isChildSeat ? ' / seat' : ''}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 font-medium">{ext.desc}</p>

                        {isChildSeat && selected && (
                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <span className="text-sm font-bold text-gray-700">Quantity</span>
                            <div className="flex items-center rounded-xl border border-gray-200 bg-white p-1">
                              <button
                                type="button"
                                onClick={() => setChildSeatQuantity(quantity - 1)}
                                className="grid h-9 w-9 place-items-center rounded-lg text-gray-600 hover:bg-gray-100"
                                aria-label="Decrease child seats"
                              >
                                <Minus size={16} />
                              </button>
                              <input
                                type="number"
                                min={0}
                                max={8}
                                value={extras.childSeatQuantity}
                                onChange={(event) => setChildSeatQuantity(Number(event.target.value))}
                                className="h-9 w-14 border-0 bg-transparent text-center text-sm font-black text-gray-900 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => setChildSeatQuantity(quantity + 1)}
                                className="grid h-9 w-9 place-items-center rounded-lg text-gray-600 hover:bg-gray-100"
                                aria-label="Increase child seats"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                            <span className="text-sm font-black text-[#78ad44]">
                              {formatVND(ext.pricePerDay * quantity * totalDays)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
                <Tag size={22} className="text-[#78ad44]" /> Promo Code
              </h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter promo code..."
                  value={promotionCode}
                  onChange={(e) => {
                    setPromotionCode(e.target.value);
                    setPromoTried(false);
                  }}
                  className="flex-1 bg-[#f4f8f7] border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-[#78ad44] outline-none text-gray-700 font-bold uppercase tracking-wider"
                />
                <button
                  onClick={applyPromo}
                  className="bg-[#212529] hover:bg-[#111] text-white px-6 py-3.5 rounded-2xl font-bold text-sm transition-colors shrink-0"
                >
                  Apply
                </button>
              </div>
              {promoTried && discountAmount > 0 && (
                <p className="mt-3 text-sm font-bold text-[#78ad44]">✓ Discount applied {formatVND(discountAmount)}</p>
              )}
              {promoTried && discountAmount === 0 && promotionCode && (
                <p className="mt-3 text-sm font-bold text-red-500">✕ Invalid code</p>
              )}
              <p className="mt-2 text-xs text-gray-400 font-medium">Try code: RENTCITY10 (10% off)</p>
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
            actionLabel="Continue to Confirmation"
            actionDisabled={pickupMethod === 'ADDRESS_DELIVERY' && !deliveryAddress.trim()}
            onAction={() => navigate(`/booking/${id}/confirm`)}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}
