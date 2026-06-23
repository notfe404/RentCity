import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react';
import type { ApiBookingResponse } from '@/types';
import type { HandoverContractPayload } from '@/services/bookingApi';
import SignaturePad from '@/components/contract/SignaturePad';
import { formatDateTime, formatVND } from '@/utils/formatters';

interface Props {
  booking: ApiBookingResponse;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (payload: HandoverContractPayload) => Promise<void>;
}

const POLICY = [
  'Only approved drivers may drive the vehicle. Illegal use, racing, drunk driving, and sub-rental are prohibited.',
  'Accidents, damage, theft, breakdown, and warning lights must be reported to RentCity immediately.',
  'The customer is responsible for traffic fines, lost items, abnormal cleaning, and damage during the rental.',
  'The vehicle must be returned on time with the agreed fuel level. Late return and missing fuel may create extra fees.',
];

export default function HandoverContractModal({ booking, isSaving, onClose, onSubmit }: Props) {
  const [condition, setCondition] = useState<HandoverContractPayload['condition']>('GOOD');
  const [actualHandoverAt, setActualHandoverAt] = useState(toLocalDateTime(new Date()));
  const [odometer, setOdometer] = useState(booking.initialCondition?.odometer ?? 0);
  const [fuelLevel, setFuelLevel] = useState(booking.initialCondition?.fuelLevel ?? 100);
  const [damageFound, setDamageFound] = useState(false);
  const [notes, setNotes] = useState('');
  const [keyCount, setKeyCount] = useState(1);
  const [accessories, setAccessories] = useState('Registration documents, spare tire, tools');
  const [files, setFiles] = useState<File[]>([]);
  const [customerSignature, setCustomerSignature] = useState<File | null>(null);
  const [staffSignature, setStaffSignature] = useState<File | null>(null);
  const [accepted, setAccepted] = useState(false);
  const handoverTimeError = useMemo(() => {
    const selected = new Date(actualHandoverAt);
    if (Number.isNaN(selected.getTime())) return 'Choose the actual handover time';
    if (selected.getTime() < new Date(booking.createdAt).getTime()) {
      return 'Actual handover cannot be before the booking was created';
    }
    if (selected.getTime() > new Date(booking.endTime).getTime()) {
      return 'Actual handover cannot be after the scheduled return time';
    }
    return null;
  }, [actualHandoverAt, booking.createdAt, booking.endTime]);
  const earlyHandoverMinutes = useMemo(() => {
    const selected = new Date(actualHandoverAt);
    if (Number.isNaN(selected.getTime())) return 0;
    return Math.ceil(Math.max(0, new Date(booking.startTime).getTime() - selected.getTime()) / 60_000);
  }, [actualHandoverAt, booking.startTime]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (handoverTimeError || !customerSignature || !staffSignature || files.length === 0 || !accepted) return;
    await onSubmit({
      actualHandoverAt,
      condition,
      odometer,
      fuelLevel,
      damageFound,
      notes,
      keyCount,
      accessories,
      files,
      customerSignature,
      staffSignature,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 bg-[#f8f9fa] p-5">
          <div>
            <h2 className="text-lg font-black text-gray-900">Vehicle handover contract</h2>
            <p className="mt-1 text-xs font-bold text-gray-500">{booking.bookingCode} · {booking.customerName}</p>
          </div>
          <button type="button" onClick={onClose} disabled={isSaving} className="rounded-xl p-2 text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>

        <form onSubmit={submit} className="space-y-5 overflow-y-auto p-5">
          <div className="grid gap-3 rounded-xl bg-[#f4f8f7] p-4 text-sm md:grid-cols-3">
            <div><p className="text-xs font-bold text-gray-400">Vehicle</p><p className="font-black">{booking.vehicleName}</p><p className="text-xs font-bold text-gray-500">{booking.vehicleLicensePlate}</p></div>
            <div><p className="text-xs font-bold text-gray-400">Rental period</p><p className="font-black">{formatDateTime(booking.startTime)}</p><p className="text-xs font-bold text-gray-500">to {formatDateTime(booking.endTime)}</p></div>
            <div><p className="text-xs font-bold text-gray-400">Security deposit paid</p><p className="font-black">{formatVND(booking.securityDepositPaidAmount)}</p><p className="text-xs font-bold text-gray-500">Via {booking.securityDepositCollectionMethod?.replace('_', ' ')}</p></div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Actual handover time">
              <input
                type="datetime-local"
                required
                min={toLocalDateTime(new Date(booking.createdAt))}
                max={toLocalDateTime(new Date(booking.endTime))}
                value={actualHandoverAt}
                onChange={(e) => setActualHandoverAt(e.target.value)}
                className={inputClass}
              />
              {handoverTimeError && <span className="mt-1.5 block text-[11px] font-bold text-red-600">{handoverTimeError}</span>}
            </Field>
            <Field label="Odometer (km)"><input type="number" min={booking.initialCondition?.odometer ?? 0} required value={odometer} onChange={(e) => setOdometer(Number(e.target.value))} className={inputClass} /></Field>
            <Field label="Fuel level (%)"><input type="number" min={0} max={100} required value={fuelLevel} onChange={(e) => setFuelLevel(Number(e.target.value))} className={inputClass} /></Field>
          </div>

          {earlyHandoverMinutes > 0 && !handoverTimeError && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-black">Vehicle is handed over {formatDuration(earlyHandoverMinutes)} early</p>
                <p className="mt-1 text-xs font-medium leading-5">This early usage will be combined with any late-return time and charged as overdue usage when the vehicle is returned.</p>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Overall condition"><select value={condition} onChange={(e) => { const value = e.target.value as typeof condition; setCondition(value); setDamageFound(value === 'DAMAGE'); }} className={inputClass}><option value="GOOD">Good</option><option value="DAMAGE">Existing damage</option></select></Field>
            <Field label="Number of keys"><input type="number" min={0} max={10} required value={keyCount} onChange={(e) => setKeyCount(Number(e.target.value))} className={inputClass} /></Field>
          </div>

          <label className="flex items-center gap-3 text-sm font-bold text-gray-700"><input type="checkbox" checked={damageFound} onChange={(e) => { const checked = e.target.checked; setDamageFound(checked); setCondition(checked ? 'DAMAGE' : 'GOOD'); }} className="h-4 w-4 accent-[#78ad44]" /> Existing damage is recorded</label>
          <Field label="Included accessories"><input value={accessories} maxLength={1000} onChange={(e) => setAccessories(e.target.value)} className={inputClass} /></Field>
          <Field label="Condition notes"><textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} placeholder="Existing scratches, cleanliness, special notes..." /></Field>
          <Field label="Handover photos"><input type="file" accept="image/*" multiple required onChange={(e) => setFiles(Array.from(e.target.files ?? []))} className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-[#e9f2eb] file:px-4 file:py-2 file:font-bold file:text-[#78ad44]" /></Field>

          <div className="rounded-xl border border-gray-200 p-4">
            <h3 className="mb-3 text-sm font-black text-gray-900">Rental policy v1.0</h3>
            <ul className="space-y-2 text-xs font-medium text-gray-600">{POLICY.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#78ad44]" />{item}</li>)}</ul>
          </div>

          <div className="grid gap-5 rounded-xl bg-[#f8f9fa] p-4 md:grid-cols-2">
            <SignaturePad label="Customer signature" disabled={isSaving} onChange={setCustomerSignature} />
            <SignaturePad label="Staff signature" disabled={isSaving} onChange={setStaffSignature} />
          </div>
          <label className="flex items-start gap-3 text-sm font-bold text-gray-700"><input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#78ad44]" /> Customer and staff confirm the information, condition, photos, and policy above.</label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={isSaving} className="flex-1 rounded-xl bg-gray-100 py-3 font-bold text-gray-700">Cancel</button>
            <button type="submit" disabled={isSaving || Boolean(handoverTimeError) || !accepted || files.length === 0 || !customerSignature || !staffSignature} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#78ad44] py-3 font-bold text-white disabled:bg-gray-300">{isSaving && <Loader2 size={16} className="animate-spin" />} Sign and hand over</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs font-bold text-gray-500"><span className="mb-1.5 block">{label} *</span>{children}</label>;
}

const inputClass = 'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium focus:border-[#78ad44] focus:outline-none';

function toLocalDateTime(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} minute(s)`;
  if (minutes === 0) return `${hours} hour(s)`;
  return `${hours} hour(s) ${minutes} minute(s)`;
}
