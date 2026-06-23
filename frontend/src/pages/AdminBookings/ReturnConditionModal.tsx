import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, Loader2, Wrench, X } from 'lucide-react';
import type { ApiBookingResponse } from '@/types';
import type { ReturnConditionPayload } from '@/services/bookingApi';
import { formatDateTime, formatVND } from '@/utils/formatters';
import SignaturePad from '@/components/contract/SignaturePad';

interface Props {
  booking: ApiBookingResponse;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (payload: ReturnConditionPayload) => Promise<void>;
}

export default function ReturnConditionModal({ booking, isSaving, onClose, onSubmit }: Props) {
  const [condition, setCondition] = useState<ReturnConditionPayload['condition']>('GOOD');
  const [initialReturnAt] = useState(() => new Date());
  const [actualReturnDate, setActualReturnDate] = useState(() => toDateInputValue(initialReturnAt));
  const [actualReturnHour, setActualReturnHour] = useState(() => twoDigits(initialReturnAt.getHours()));
  const [actualReturnMinute, setActualReturnMinute] = useState(() => twoDigits(initialReturnAt.getMinutes()));
  const [odometer, setOdometer] = useState(booking.initialCondition?.odometer ?? 0);
  const [fuelLevel, setFuelLevel] = useState(booking.initialCondition?.fuelLevel ?? 100);
  const [damageFound, setDamageFound] = useState(false);
  const [damageSeverity, setDamageSeverity] = useState<'MINOR' | 'MODERATE' | 'MAJOR'>('MINOR');
  const [damageDescription, setDamageDescription] = useState('');
  const hasDamageAssessment = condition === 'DAMAGE' || damageFound;
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [keyCount, setKeyCount] = useState(1);
  const [accessories, setAccessories] = useState('Registration documents, spare tire, tools');
  const [customerSignature, setCustomerSignature] = useState<File | null>(null);
  const [staffSignature, setStaffSignature] = useState<File | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [finalPaymentMethod, setFinalPaymentMethod] = useState<'PAYMENT_REQUEST' | 'CASH'>('PAYMENT_REQUEST');
  const [securityDepositRefundMethod, setSecurityDepositRefundMethod] = useState<'PAYMENT_REQUEST' | 'CASH'>('PAYMENT_REQUEST');
  const selectedReturnTime = useMemo(
    () => combineDateAndTime(actualReturnDate, actualReturnHour, actualReturnMinute),
    [actualReturnDate, actualReturnHour, actualReturnMinute],
  );
  const actualHandoverTime = useMemo(
    () => new Date(booking.actualHandoverAt ?? booking.startTime),
    [booking.actualHandoverAt, booking.startTime],
  );
  const selectableDates = useMemo(
    () => buildSelectableDates(actualHandoverTime),
    [actualHandoverTime],
  );
  const returnTimeError = useMemo(() => {
    if (!selectedReturnTime) {
      return 'Choose the actual return date and time';
    }
    if (selectedReturnTime.getTime() < actualHandoverTime.getTime()) {
      return 'Actual return time cannot be before the actual handover time';
    }
    return null;
  }, [actualHandoverTime, selectedReturnTime]);

  const overdue = useMemo(() => {
    const scheduledReturn = new Date(booking.endTime);
    const scheduledStart = new Date(booking.startTime);
    const earlyHandoverMs = Math.max(0, scheduledStart.getTime() - actualHandoverTime.getTime());
    const lateReturnMs = !selectedReturnTime
      ? 0
      : Math.max(0, selectedReturnTime.getTime() - scheduledReturn.getTime());
    const additionalUsageMs = earlyHandoverMs + lateReturnMs;
    const minutes = Math.ceil(additionalUsageMs / 60_000);
    const billableHours = Math.ceil(additionalUsageMs / 3_600_000);
    const hasPrice = booking.vehiclePricePerDay != null && booking.vehiclePricePerDay > 0;
    const hourlyRate = hasPrice ? Math.ceil(booking.vehiclePricePerDay! / 24) : null;
    const estimatedFee = hourlyRate == null ? null : billableHours * hourlyRate;
    const estimatedPenaltyFee = estimatedFee == null
      ? null
      : Math.ceil((booking.baseAmount + estimatedFee) * 0.15);
    return {
      minutes,
      earlyHandoverMinutes: Math.ceil(earlyHandoverMs / 60_000),
      lateReturnMinutes: Math.ceil(lateReturnMs / 60_000),
      billableHours,
      estimatedFee,
      estimatedPenaltyFee,
      estimatedTotalFee: estimatedFee == null || estimatedPenaltyFee == null
        ? null
        : estimatedFee + estimatedPenaltyFee,
    };
  }, [actualHandoverTime, booking.baseAmount, booking.endTime, booking.startTime, booking.vehiclePricePerDay, selectedReturnTime]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (returnTimeError || !selectedReturnTime || !customerSignature || !staffSignature || !accepted) {
      return;
    }
    await onSubmit({
      condition,
      actualReturnAt: toDateTimeLocalValue(selectedReturnTime),
      odometer,
      fuelLevel,
      damageFound: hasDamageAssessment,
      damageSeverity: hasDamageAssessment ? damageSeverity : undefined,
      damageDescription: hasDamageAssessment ? damageDescription : undefined,
      notes,
      keyCount,
      accessories,
      files,
      customerSignature,
      staffSignature,
      finalPaymentMethod,
      securityDepositRefundMethod: condition === 'GOOD' ? securityDepositRefundMethod : undefined,
    });
  };

  const conditionOptions = [
    { value: 'GOOD' as const, label: 'Good', icon: CheckCircle2, color: 'border-green-500 bg-green-50 text-green-700' },
    { value: 'DAMAGE' as const, label: 'Damage', icon: AlertTriangle, color: 'border-orange-500 bg-orange-50 text-orange-700' },
    { value: 'NEED_MAINTENANCE' as const, label: 'Need maintenance', icon: Wrench, color: 'border-red-500 bg-red-50 text-red-700' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[94vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-[#f8f9fa]">
          <div>
            <h2 className="font-black text-gray-900 text-lg">Return car condition</h2>
            <p className="text-xs font-bold text-gray-500 mt-1">{booking.bookingCode}</p>
          </div>
          <button onClick={onClose} disabled={isSaving} className="p-2 text-gray-400 hover:text-gray-700 rounded-xl">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">Overall condition *</label>
            <div className="grid grid-cols-3 gap-2">
              {conditionOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={option.value === 'GOOD' && hasDamageAssessment}
                  onClick={() => {
                    setCondition(option.value);
                    if (option.value === 'DAMAGE') {
                      setDamageFound(true);
                    }
                  }}
                  className={`rounded-xl border-2 px-2 py-3 text-xs font-black flex flex-col items-center gap-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    condition === option.value
                      ? option.color
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <option.icon size={19} />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className={`rounded-xl border p-4 ${
            overdue.minutes > 0 ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <Clock3 size={18} className={overdue.minutes > 0 ? 'text-orange-600' : 'text-green-600'} />
              <p className={`text-sm font-black ${overdue.minutes > 0 ? 'text-orange-700' : 'text-green-700'}`}>
                 {overdue.minutes > 0 ? 'Additional rental time' : 'No additional rental time'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="font-bold text-gray-500">Scheduled return</p>
                <p className="font-black text-gray-900 mt-1">{formatDateTime(booking.endTime)}</p>
              </div>
              <div>
                <label htmlFor="actual-return-time" className="font-bold text-gray-500">
                  Actual return time *
                </label>
                <div className="grid grid-cols-[0.55fr_0.55fr_1.4fr] gap-1.5 mt-1">
                  <select
                    id="actual-return-time"
                    aria-label="Choose actual return hour"
                    value={actualReturnHour}
                    onChange={(event) => setActualReturnHour(event.target.value)}
                    className={returnPickerClass(returnTimeError)}
                  >
                    {Array.from({ length: 24 }, (_, hour) => twoDigits(hour)).map((hour) => (
                      <option key={hour} value={hour}>{hour}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Choose actual return minute"
                    value={actualReturnMinute}
                    onChange={(event) => setActualReturnMinute(event.target.value)}
                    className={returnPickerClass(returnTimeError)}
                  >
                    {Array.from({ length: 60 }, (_, minute) => twoDigits(minute)).map((minute) => (
                      <option key={minute} value={minute}>{minute}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Choose actual return date"
                    value={actualReturnDate}
                    onChange={(event) => setActualReturnDate(event.target.value)}
                    className={returnPickerClass(returnTimeError)}
                  >
                    {selectableDates.map((date) => (
                      <option key={date.value} value={date.value}>{date.label}</option>
                    ))}
                  </select>
                </div>
                {returnTimeError && (
                  <p className="mt-1 text-[11px] font-bold text-red-600">{returnTimeError}</p>
                )}
              </div>
            </div>
            {overdue.minutes > 0 && (
              <div className="mt-3 pt-3 border-t border-orange-200">
                <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-orange-800">
                  <div className="rounded-lg bg-white/70 p-2.5">
                    <p className="font-bold">Early handover</p>
                    <p className="mt-1 font-black">{formatMinutes(overdue.earlyHandoverMinutes)}</p>
                  </div>
                  <div className="rounded-lg bg-white/70 p-2.5">
                    <p className="font-bold">Late return</p>
                    <p className="mt-1 font-black">{formatMinutes(overdue.lateReturnMinutes)}</p>
                  </div>
                </div>
                {overdue.estimatedFee == null ? (
                  <p className="text-xs font-bold text-red-600">
                    Daily vehicle rate unavailable
                  </p>
                ) : (
                  <div className="space-y-2 text-xs text-orange-700">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">
                         Additional usage fee ({overdue.billableHours} billable hour(s))
                      </span>
                      <span className="font-black">+{formatVND(overdue.estimatedFee)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold">
                        Penalty overdue fee (15%)
                      </span>
                      <span className="font-black">+{formatVND(overdue.estimatedPenaltyFee ?? 0)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-orange-200 text-sm">
                      <span className="font-black">Total overdue fee</span>
                      <span className="font-black">+{formatVND(overdue.estimatedTotalFee ?? 0)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Odometer (km) *</label>
              <input
                type="number"
                min={booking.initialCondition?.odometer ?? 0}
                required
                value={odometer}
                onChange={(event) => setOdometer(Number(event.target.value))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#78ad44]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Fuel level (%) *</label>
              <input
                type="number"
                min={0}
                max={100}
                required
                value={fuelLevel}
                onChange={(event) => setFuelLevel(Number(event.target.value))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#78ad44]"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm font-bold text-gray-700">
            <input
              type="checkbox"
              checked={hasDamageAssessment}
              onChange={(event) => {
                const checked = event.target.checked;
                setDamageFound(checked);
                if (checked && condition === 'GOOD') {
                  setCondition('DAMAGE');
                } else if (!checked && condition === 'DAMAGE') {
                  setCondition('GOOD');
                }
              }}
              className="w-4 h-4 accent-red-500"
            />
            Damage found during return inspection
          </label>
          <p className="-mt-3 text-xs text-gray-400">
            Damage or maintenance returns make the vehicle unavailable until repair or maintenance is resolved.
          </p>

          {hasDamageAssessment && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 space-y-4">
              <div>
                <div>
                  <label className="block text-xs font-bold text-orange-700 mb-1.5">Damage severity *</label>
                  <select
                    required
                    value={damageSeverity}
                    onChange={(event) => setDamageSeverity(event.target.value as typeof damageSeverity)}
                    className="w-full px-3 py-2.5 rounded-lg border border-orange-200 bg-white text-sm font-bold"
                  >
                    <option value="MINOR">Minor</option>
                    <option value="MODERATE">Moderate</option>
                    <option value="MAJOR">Major</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-orange-700 mb-1.5">Damage description *</label>
                <textarea
                  rows={3}
                  required
                  value={damageDescription}
                  onChange={(event) => setDamageDescription(event.target.value)}
                  placeholder="Describe the damage and affected parts..."
                  className="w-full px-3 py-2.5 rounded-lg border border-orange-200 bg-white text-sm font-medium resize-none"
                />
              </div>
              <p className="text-xs text-orange-700">
                The full vehicle security deposit will be retained for repair or maintenance. No separate damage fee is created at return.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">Inspection notes</label>
            <textarea
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Describe cleanliness, scratches, missing accessories, or damage..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#78ad44] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">Return photos *</label>
            <input
              type="file"
              accept="image/*"
              multiple
              required
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
              className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-[#e9f2eb] file:px-4 file:py-2 file:font-bold file:text-[#78ad44]"
            />
            {files.length === 0 && (
              <p className="mt-1.5 text-xs font-bold text-red-600">
                At least one return photo is required.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Returned keys *</label>
              <input type="number" min={0} max={10} required value={keyCount} onChange={(event) => setKeyCount(Number(event.target.value))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#78ad44]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Returned accessories *</label>
              <input required value={accessories} onChange={(event) => setAccessories(event.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#78ad44]" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Return settlement</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-white p-3">
                  <p className="text-xs font-bold text-slate-500">Rental after reservation fee</p>
                  <p className="mt-1 font-black text-slate-900">{formatVND(Math.max(0, booking.baseAmount - booking.reservationFeeAmount))}</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-xs font-bold text-slate-500">Estimated total due now</p>
                  <p className="mt-1 font-black text-[#56832d]">{formatVND(Math.max(0, booking.baseAmount - booking.reservationFeeAmount) + (overdue.estimatedTotalFee ?? 0))}</p>
                </div>
              </div>
            </div>

            <SettlementChoice
              label="Final rental payment method"
              value={finalPaymentMethod}
              onChange={setFinalPaymentMethod}
              requestLabel="Send payment request"
              cashLabel="Customer pays cash"
            />

            {condition === 'GOOD' ? (
              <SettlementChoice
                label={`Refund ${formatVND(booking.securityDepositAmount)} security deposit by`}
                value={securityDepositRefundMethod}
                onChange={setSecurityDepositRefundMethod}
                requestLabel="Electronic refund"
                cashLabel="Cash refund"
              />
            ) : (
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs font-bold leading-5 text-orange-800">
                {formatVND(booking.securityDepositAmount)} security deposit will be retained for fixing or maintenance and recorded in the return contract.
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-[#f8f9fa] p-4 text-xs font-medium text-gray-600 space-y-2">
            <p className="font-black text-gray-900">Return acknowledgement</p>
            <p>The parties confirm the return condition, final rental payment method, and security-deposit resolution shown above.</p>
            <p>The final rental amount equals the booking price minus the reservation fee, plus any overdue charge.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 rounded-xl bg-[#f8f9fa] p-4">
            <SignaturePad label="Customer return signature" disabled={isSaving} onChange={setCustomerSignature} />
            <SignaturePad label="Staff return signature" disabled={isSaving} onChange={setStaffSignature} />
          </div>

          <label className="flex items-start gap-3 text-sm font-bold text-gray-700">
            <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-0.5 w-4 h-4 accent-[#78ad44]" />
            Customer and staff confirm the return record shown above.
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={isSaving} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || Boolean(returnTimeError) || files.length === 0 || !customerSignature || !staffSignature || !accepted}
              className="flex-1 py-3 bg-[#78ad44] text-white font-bold rounded-xl disabled:bg-gray-300 flex items-center justify-center gap-2"
            >
              {isSaving && <Loader2 size={16} className="animate-spin" />}
              Complete return
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SettlementChoice({ label, value, onChange, requestLabel, cashLabel }: {
  label: string;
  value: 'PAYMENT_REQUEST' | 'CASH';
  onChange: (value: 'PAYMENT_REQUEST' | 'CASH') => void;
  requestLabel: string;
  cashLabel: string;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-black text-slate-600">{label} *</p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => onChange('PAYMENT_REQUEST')} className={`rounded-xl border-2 px-3 py-2.5 text-xs font-black ${value === 'PAYMENT_REQUEST' ? 'border-[#78ad44] bg-[#f2f8ec] text-[#56832d]' : 'border-slate-200 bg-white text-slate-500'}`}>
          {requestLabel}
        </button>
        <button type="button" onClick={() => onChange('CASH')} className={`rounded-xl border-2 px-3 py-2.5 text-xs font-black ${value === 'CASH' ? 'border-[#78ad44] bg-[#f2f8ec] text-[#56832d]' : 'border-slate-200 bg-white text-slate-500'}`}>
          {cashLabel}
        </button>
      </div>
    </div>
  );
}

function toDateTimeLocalValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())}`;
}

function combineDateAndTime(dateValue: string, hour: string, minute: string) {
  if (!dateValue || !hour || !minute) {
    return null;
  }

  const date = new Date(`${dateValue}T${hour}:${minute}:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function twoDigits(value: number) {
  return String(value).padStart(2, '0');
}

function formatMinutes(totalMinutes: number) {
  if (totalMinutes <= 0) return 'None';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} minute(s)`;
  if (minutes === 0) return `${hours} hour(s)`;
  return `${hours} hour(s) ${minutes} minute(s)`;
}

function buildSelectableDates(rentalStart: Date) {
  const dates = [];
  const lastDate = new Date(rentalStart);
  lastDate.setFullYear(lastDate.getFullYear() + 1);

  for (const date = new Date(rentalStart); date <= lastDate; date.setDate(date.getDate() + 1)) {
    dates.push({
      value: toDateInputValue(date),
      label: `${twoDigits(date.getDate())}/${twoDigits(date.getMonth() + 1)}/${date.getFullYear()}`,
    });
  }

  return dates;
}

function returnPickerClass(hasError: string | null) {
  return `min-w-0 px-2 py-2 border bg-white rounded-lg text-xs font-black text-gray-900 cursor-pointer focus:outline-none ${
    hasError
      ? 'border-red-400 focus:border-red-500'
      : 'border-gray-200 hover:border-[#78ad44] focus:border-[#78ad44]'
  }`;
}
