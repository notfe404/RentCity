import { useEffect, useState } from 'react';
import { CalendarDays, Download, FileText, LoaderCircle, X } from 'lucide-react';
import { toast } from 'sonner';

import { downloadRentalContractPdf } from '@/services/bookingApi';
import type { ApiBookingResponse, RentalContractResponse } from '@/types';
import type { ApiCarConditionResponse } from '@/types/vehicle.types';
import {
  BOOKING_STATUS_META,
  DEPOSIT_STATUS_META,
  getBookingVehicleName,
  getSecurityDepositPaymentLabel,
} from '@/utils/bookingMapper';
import { formatDateTime, formatVND } from '@/utils/formatters';

interface Props {
  booking: ApiBookingResponse;
  contract: RentalContractResponse | null;
  contractError: string | null;
  isLoading: boolean;
  onClose: () => void;
}

const apiBaseUrl = new URL(
  import.meta.env.VITE_API_URL || 'http://localhost:8081/api',
  window.location.origin,
).toString().replace(/\/$/, '');

function resolveMediaUrl(url: string) {
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  if (url.startsWith('/api/')) return `${new URL(apiBaseUrl).origin}${url}`;
  return `${apiBaseUrl}/${url.replace(/^\//, '')}`;
}

function Detail({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3.5">
      <p className="text-[11px] font-black uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-gray-900">{value}</p>
    </div>
  );
}

interface ConditionSectionProps {
  title: string;
  emptyText: string;
  condition?: ApiCarConditionResponse | null;
  occurredAt?: string | null;
  keyCount?: number | null;
  accessories?: string | null;
  customerSignedAt?: string | null;
  staffSignedAt?: string | null;
  staffUserId?: number | null;
}

function ConditionSection({
  title,
  emptyText,
  condition,
  occurredAt,
  keyCount,
  accessories,
  customerSignedAt,
  staffSignedAt,
  staffUserId,
}: ConditionSectionProps) {
  if (!condition) {
    return (
      <section className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5">
        <h3 className="font-black text-gray-900">{title}</h3>
        <p className="mt-2 text-sm font-medium text-gray-500">{emptyText}</p>
      </section>
    );
  }

  const isGood = condition.condition === 'GOOD';

  return (
    <section className="rounded-2xl border border-gray-100 bg-[#f4f8f7] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-black text-gray-900">{title}</h3>
          <p className="mt-1 text-xs font-bold text-gray-500">
            {occurredAt ? formatDateTime(occurredAt) : formatDateTime(condition.createdAt)}
          </p>
        </div>
        <span className={`rounded-lg px-3 py-1 text-xs font-black ${
          isGood ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
        }`}>
          {condition.condition.replaceAll('_', ' ')}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Detail label="Odometer" value={`${condition.odometer.toLocaleString()} km`} />
        <Detail label="Fuel level" value={`${condition.fuelLevel}%`} />
        <Detail label="Keys" value={keyCount ?? '-'} />
        <Detail label="Damage" value={condition.damageFound ? 'Recorded' : 'None'} />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Detail label="Accessories" value={accessories || 'None recorded'} />
        <Detail label="Condition notes" value={condition.notes || 'No notes'} />
      </div>

      <div className="mt-3 rounded-xl border border-gray-100 bg-white p-4">
        <p className="text-[11px] font-black uppercase tracking-wider text-gray-400">Signatures</p>
        <div className="mt-2 grid gap-2 text-xs font-bold text-gray-600 sm:grid-cols-2">
          <p>Customer: {customerSignedAt ? formatDateTime(customerSignedAt) : 'Not signed'}</p>
          <p>Staff{staffUserId ? ` #${staffUserId}` : ''}: {staffSignedAt ? formatDateTime(staffSignedAt) : 'Not signed'}</p>
        </div>
      </div>

      {condition.images.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-gray-400">Vehicle photos</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[...condition.images]
              .sort((left, right) => left.displayOrder - right.displayOrder)
              .map((image) => (
                <a
                  key={image.id}
                  href={resolveMediaUrl(image.imageUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                  title="Open full-size vehicle photo"
                >
                  <img
                    src={resolveMediaUrl(image.imageUrl)}
                    alt={`${title} vehicle condition`}
                    className="h-28 w-full object-cover transition-transform hover:scale-105"
                  />
                </a>
              ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default function BookingContractDetailsModal({ booking, contract, contractError, isLoading, onClose }: Props) {
  const [isDownloading, setIsDownloading] = useState(false);
  const statusMeta = BOOKING_STATUS_META[booking.status];
  const depositMeta = DEPOSIT_STATUS_META[booking.depositStatus];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const downloadContract = async () => {
    if (!contract || isDownloading) return;
    setIsDownloading(true);
    try {
      const { data } = await downloadRentalContractPdf(booking.id);
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rentcity-contract-${booking.bookingCode}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast.error('Could not download the rental contract');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label={`Booking ${booking.bookingCode} details`}>
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close booking details" />
      <div className="relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 bg-[#212529] px-5 py-5 text-white sm:px-7">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black">{booking.bookingCode}</h2>
              <span className={`rounded-lg px-2.5 py-1 text-[11px] font-black uppercase ${statusMeta.bg}`}>
                {statusMeta.label}
              </span>
            </div>
            <p className="mt-1 text-xs font-bold text-gray-400">Complete booking and rental contract record</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <div className="overflow-y-auto p-5 sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.35fr]">
            <div className="space-y-5">
              <section>
                <h3 className="mb-3 flex items-center gap-2 font-black text-gray-900"><CalendarDays size={18} className="text-[#78ad44]" /> Booking details</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Detail label="Customer" value={booking.customerName || 'Unknown customer'} />
                  <Detail label="Email" value={booking.customerEmail || '-'} />
                  <Detail label="Vehicle" value={getBookingVehicleName(booking)} />
                  <Detail label="License plate" value={booking.vehicleLicensePlate || '-'} />
                  <Detail label="Pickup" value={formatDateTime(booking.startTime)} />
                  <Detail label="Scheduled return" value={formatDateTime(booking.endTime)} />
                  <Detail label="Actual return" value={booking.actualReturnAt ? formatDateTime(booking.actualReturnAt) : 'Not returned'} />
                  <Detail label="Pickup method" value={booking.pickupMethod === 'ADDRESS_DELIVERY' ? 'Deliver to customer address' : 'Pickup at branch'} />
                  {booking.pickupMethod === 'ADDRESS_DELIVERY' && (
                    <Detail label="Delivery address" value={booking.deliveryAddress || 'Address unavailable'} />
                  )}
                  <Detail label="Pricing mode" value={booking.pricingMode} />
                  <Detail label="Created" value={formatDateTime(booking.createdAt)} />
                  <Detail label="Last updated" value={formatDateTime(booking.updatedAt)} />
                </div>
              </section>

              <section>
                <h3 className="mb-3 font-black text-gray-900">Financial details</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Detail label="Base amount" value={formatVND(booking.baseAmount)} />
                  <Detail label="Reservation fee (30%)" value={`${formatVND(booking.reservationFeeAmount)} - ${depositMeta.label}`} />
                  <Detail label="Vehicle security deposit" value={`${formatVND(booking.securityDepositAmount)} - ${booking.securityDepositStatus.replaceAll('_', ' ')}`} />
                  <Detail label="Security deposit collected" value={`${formatVND(booking.securityDepositPaidAmount)} via ${getSecurityDepositPaymentLabel(booking.securityDepositGateway)}`} />
                  <Detail label="Security deposit resolution" value={`${booking.securityDepositStatus.replaceAll('_', ' ')} via ${booking.securityDepositRefundMethod?.replaceAll('_', ' ') ?? '-'}`} />
                  {booking.securityDepositRepairCost != null && (
                    <Detail label="Actual repair cost" value={formatVND(booking.securityDepositRepairCost)} />
                  )}
                  {booking.securityDepositRepairCost != null && (
                    <Detail label="Security deposit refunded" value={formatVND(booking.securityDepositRefundedAmount)} />
                  )}
                  <Detail label="Final rental amount" value={`${formatVND(booking.finalRentalAmount)} - ${booking.finalPaymentStatus.replaceAll('_', ' ')}`} />
                  <Detail label="Final payment method" value={booking.finalPaymentMethod?.replaceAll('_', ' ') ?? '-'} />
                  <Detail label="Total amount" value={formatVND(booking.totalAmount)} />
                  <Detail label="Outstanding" value={formatVND(booking.outstandingAmount)} />
                  <Detail label="Overdue charge" value={formatVND(booking.totalOverdueFee)} />
                  <Detail label="Damage charge" value={formatVND(booking.damageFee)} />
                </div>
              </section>

              {booking.cancelReason && (
                <section className="rounded-2xl border border-red-100 bg-red-50 p-4">
                  <h3 className="text-sm font-black text-red-700">Cancellation</h3>
                  <p className="mt-1 text-sm font-medium text-red-700">{booking.cancelReason}</p>
                  {booking.cancelledAt && <p className="mt-2 text-xs font-bold text-red-500">{formatDateTime(booking.cancelledAt)}</p>}
                </section>
              )}
            </div>

            <div className="space-y-5">
              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="rounded-xl bg-[#e9f2eb] p-2.5 text-[#56832d]"><FileText size={20} /></span>
                    <div>
                      <h3 className="font-black text-gray-900">Rental contract</h3>
                      <p className="mt-1 text-xs font-bold text-gray-400">
                        {contract ? `${contract.contractNumber} - Policy ${contract.policyVersion}` : 'No signed contract yet'}
                      </p>
                    </div>
                  </div>
                  {contract && (
                    <button type="button" onClick={downloadContract} disabled={isDownloading} className="inline-flex items-center gap-2 rounded-xl bg-[#212529] px-4 py-2.5 text-xs font-bold text-white disabled:bg-gray-300">
                      {isDownloading ? <LoaderCircle size={15} className="animate-spin" /> : <Download size={15} />}
                      Download PDF
                    </button>
                  )}
                </div>

                {isLoading && (
                  <div className="mt-5 flex items-center gap-2 rounded-xl bg-gray-50 p-4 text-sm font-bold text-gray-500">
                    <LoaderCircle size={17} className="animate-spin" /> Loading latest contract details...
                  </div>
                )}
                {!isLoading && contractError && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-600">{contractError}</p>}
                {!isLoading && !contract && !contractError && (
                  <p className="mt-5 rounded-xl bg-gray-50 p-4 text-sm font-medium text-gray-500">The handover contract has not been created for this booking.</p>
                )}
                {contract && (
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-[#f4f8f7] p-4">
                    <span className="text-sm font-bold text-gray-500">Contract status</span>
                    <span className="rounded-lg bg-[#e9f2eb] px-3 py-1 text-xs font-black text-[#56832d]">{contract.status.replaceAll('_', ' ')}</span>
                  </div>
                )}
              </section>

              {contract && (
                <>
                  <ConditionSection
                    title="Handover contract"
                    emptyText="No handover condition was recorded."
                    condition={contract.handoverCondition}
                    occurredAt={contract.handoverAt}
                    keyCount={contract.handoverKeyCount}
                    accessories={contract.handoverAccessories}
                    customerSignedAt={contract.handoverCustomerSignedAt}
                    staffSignedAt={contract.handoverStaffSignedAt}
                    staffUserId={contract.handoverStaffUserId}
                  />
                  <div className="grid gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 sm:grid-cols-2">
                    <Detail label="Contract security deposit" value={formatVND(contract.securityDepositAmount)} />
                    <Detail label="Collected by" value={getSecurityDepositPaymentLabel(contract.securityDepositGateway)} />
                    <Detail label="Deposit result" value={contract.securityDepositStatus?.replaceAll('_', ' ') ?? 'Pending return'} />
                    <Detail label="Refund method" value={contract.securityDepositRefundMethod?.replaceAll('_', ' ') ?? '-'} />
                    {contract.securityDepositRepairCost != null && (
                      <Detail label="Actual repair cost" value={formatVND(contract.securityDepositRepairCost)} />
                    )}
                    {contract.securityDepositRepairCost != null && (
                      <Detail label="Deposit refunded" value={formatVND(contract.securityDepositRefundedAmount)} />
                    )}
                    <Detail label="Final rental settlement" value={formatVND(contract.finalRentalAmount ?? 0)} />
                    <Detail label="Final payment" value={`${contract.finalPaymentStatus?.replaceAll('_', ' ') ?? '-'} via ${contract.finalPaymentMethod?.replaceAll('_', ' ') ?? '-'}`} />
                  </div>
                  <ConditionSection
                    title="Return contract"
                    emptyText="The vehicle has not been returned yet."
                    condition={contract.returnCondition}
                    occurredAt={booking.actualReturnAt}
                    keyCount={contract.returnKeyCount}
                    accessories={contract.returnAccessories}
                    customerSignedAt={contract.returnCustomerSignedAt}
                    staffSignedAt={contract.returnStaffSignedAt}
                    staffUserId={contract.returnStaffUserId}
                  />
                  <details className="rounded-2xl border border-gray-100 bg-white p-5">
                    <summary className="cursor-pointer text-sm font-black text-gray-900">Rental policy</summary>
                    <p className="mt-4 whitespace-pre-line text-sm font-medium leading-6 text-gray-600">{contract.policyText}</p>
                  </details>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
