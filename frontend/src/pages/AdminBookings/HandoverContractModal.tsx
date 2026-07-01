import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, FileSignature, Loader2, X } from 'lucide-react';
import type { ApiBookingResponse } from '@/types';
import type { HandoverContractPayload } from '@/services/bookingApi';
import SignaturePad from '@/components/contract/SignaturePad';
import { getSecurityDepositPaymentLabel } from '@/utils/bookingMapper';
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
  'The vehicle must be returned on time. Late return may create extra fees.',
];

export default function HandoverContractModal({ booking, isSaving, onClose, onSubmit }: Props) {
  const [step, setStep] = useState<'RECORD' | 'SIGN'>('RECORD');
  const [condition, setCondition] = useState<HandoverContractPayload['condition']>('GOOD');
  const [actualHandoverAt, setActualHandoverAt] = useState(toLocalDateTime(new Date()));
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

  const canReview = !handoverTimeError && files.length > 0;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (step === 'RECORD') {
      if (!canReview) return;
      setStep('SIGN');
      return;
    }
    if (!customerSignature || !staffSignature || !accepted) return;
    await onSubmit({
      actualHandoverAt,
      condition,
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
      <div className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 bg-[#f8f9fa] p-5">
          <div>
            <h2 className="text-lg font-black text-gray-900">Vehicle handover contract</h2>
            <p className="mt-1 text-xs font-bold text-gray-500">{booking.bookingCode} | {booking.customerName}</p>
          </div>
          <button type="button" onClick={onClose} disabled={isSaving} className="rounded-xl p-2 text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>

        <form onSubmit={submit} className="space-y-5 overflow-y-auto p-5">
          {step === 'RECORD' ? (
            <>
              <StepIndicator current={1} />
              <div className="grid gap-3 rounded-xl bg-[#f4f8f7] p-4 text-sm md:grid-cols-3">
                <Summary label="Vehicle" value={booking.vehicleName ?? '-'} detail={booking.vehicleLicensePlate ?? '-'} />
                <Summary label="Rental period" value={formatDateTime(booking.startTime)} detail={`to ${formatDateTime(booking.endTime)}`} />
                <Summary label="Security deposit paid" value={formatVND(booking.securityDepositPaidAmount)} detail={`Via ${getSecurityDepositPaymentLabel(booking.securityDepositGateway)}`} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
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
                <Field label="Overall condition">
                  <select value={condition} onChange={(e) => { const value = e.target.value as typeof condition; setCondition(value); setDamageFound(value === 'DAMAGE'); }} className={inputClass}>
                    <option value="GOOD">Good</option>
                    <option value="DAMAGE">Existing damage</option>
                  </select>
                </Field>
                <Field label="Number of keys">
                  <input type="number" min={0} max={10} required value={keyCount} onChange={(e) => setKeyCount(Number(e.target.value))} className={inputClass} />
                </Field>
              </div>

              <label className="flex items-center gap-3 text-sm font-bold text-gray-700">
                <input type="checkbox" checked={damageFound} onChange={(e) => { const checked = e.target.checked; setDamageFound(checked); setCondition(checked ? 'DAMAGE' : 'GOOD'); }} className="h-4 w-4 accent-[#78ad44]" />
                Existing damage is recorded
              </label>
              <Field label="Included accessories">
                <input value={accessories} maxLength={1000} onChange={(e) => setAccessories(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Condition notes">
                <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} placeholder="Existing scratches, cleanliness, special notes..." />
              </Field>
              <Field label="Handover photos">
                <input type="file" accept="image/*" multiple required onChange={(e) => setFiles(Array.from(e.target.files ?? []))} className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-[#e9f2eb] file:px-4 file:py-2 file:font-bold file:text-[#78ad44]" />
                {files.length === 0 && <span className="mt-1.5 block text-[11px] font-bold text-red-600">At least one handover photo is required.</span>}
              </Field>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} disabled={isSaving} className="flex-1 rounded-xl bg-gray-100 py-3 font-bold text-gray-700">Cancel</button>
                <button type="submit" disabled={isSaving || !canReview} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#78ad44] py-3 font-bold text-white disabled:bg-gray-300"><FileSignature size={16} /> Review contract</button>
              </div>
            </>
          ) : (
            <>
              <StepIndicator current={2} />
              <ContractPaper
                booking={booking}
                actualHandoverAt={actualHandoverAt}
                condition={condition}
                damageFound={damageFound}
                notes={notes}
                keyCount={keyCount}
                accessories={accessories}
                files={files}
              />
              <div className="grid gap-5 rounded-xl bg-[#f8f9fa] p-4 md:grid-cols-2">
                <SignaturePad label="Customer signature" disabled={isSaving} onChange={setCustomerSignature} />
                <SignaturePad label="Staff signature" disabled={isSaving} onChange={setStaffSignature} />
              </div>
              <label className="flex items-start gap-3 text-sm font-bold text-gray-700">
                <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#78ad44]" />
                Customer and staff confirm the information, condition, photos, and policy above.
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep('RECORD')} disabled={isSaving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 font-bold text-gray-700"><ArrowLeft size={16} /> Back to record</button>
                <button type="submit" disabled={isSaving || !accepted || !customerSignature || !staffSignature} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#78ad44] py-3 font-bold text-white disabled:bg-gray-300">{isSaving && <Loader2 size={16} className="animate-spin" />} Sign and hand over</button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

function StepIndicator({ current }: { current: 1 | 2 }) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-2 text-xs font-black">
      <div className={`rounded-lg px-3 py-2 text-center ${current === 1 ? 'bg-[#78ad44] text-white' : 'text-gray-500'}`}>1. Record details</div>
      <div className={`rounded-lg px-3 py-2 text-center ${current === 2 ? 'bg-[#78ad44] text-white' : 'text-gray-500'}`}>2. Review and sign</div>
    </div>
  );
}

function Summary({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div><p className="text-xs font-bold text-gray-400">{label}</p><p className="font-black">{value}</p><p className="text-xs font-bold text-gray-500">{detail}</p></div>;
}

function ContractPaper({
  booking,
  actualHandoverAt,
  condition,
  damageFound,
  notes,
  keyCount,
  accessories,
  files,
}: {
  booking: ApiBookingResponse;
  actualHandoverAt: string;
  condition: HandoverContractPayload['condition'];
  damageFound: boolean;
  notes: string;
  keyCount: number;
  accessories: string;
  files: File[];
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="border-b border-gray-200 pb-4 text-center">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">RentCity Vehicle Rental</p>
        <h3 className="mt-2 text-xl font-black text-gray-900">Vehicle Handover Contract</h3>
        <p className="mt-1 text-xs font-bold text-gray-500">{booking.bookingCode}</p>
      </div>
      <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
        <PaperDetail label="Customer" value={booking.customerName ?? '-'} />
        <PaperDetail label="Vehicle" value={`${booking.vehicleName ?? '-'} (${booking.vehicleLicensePlate ?? '-'})`} />
        <PaperDetail label="Rental period" value={`${formatDateTime(booking.startTime)} to ${formatDateTime(booking.endTime)}`} />
        <PaperDetail label="Actual handover" value={formatDateTime(actualHandoverAt)} />
        <PaperDetail label="Security deposit" value={`${formatVND(booking.securityDepositPaidAmount)} via ${getSecurityDepositPaymentLabel(booking.securityDepositGateway)}`} />
        <PaperDetail label="Condition" value={conditionLabel(condition)} />
        <PaperDetail label="Keys" value={`${keyCount}`} />
        <PaperDetail label="Accessories" value={accessories || '-'} />
      </div>
      <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-gray-400">Condition notes</p>
        <p className="mt-2 whitespace-pre-line text-sm font-medium text-gray-700">{notes || (damageFound ? 'Existing damage recorded.' : 'No extra notes.')}</p>
      </div>
      <PhotoPreviewGrid files={files} title="Handover photos" />
      <div className="mt-4 rounded-xl border border-gray-200 p-4">
        <h3 className="mb-3 text-sm font-black text-gray-900">Rental policy v1.0</h3>
        <ul className="space-y-2 text-xs font-medium text-gray-600">{POLICY.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[#78ad44]" />{item}</li>)}</ul>
      </div>
    </div>
  );
}

function PaperDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 p-3">
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-gray-400">{label}</p>
      <p className="mt-1 font-bold text-gray-900">{value}</p>
    </div>
  );
}

function conditionLabel(value: HandoverContractPayload['condition']) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function PhotoPreviewGrid({ files, title }: { files: File[]; title: string }) {
  const [previews, setPreviews] = useState<Array<{ name: string; url: string }>>([]);

  useEffect(() => {
    const nextPreviews = files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) }));
    setPreviews(nextPreviews);
    return () => nextPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [files]);

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-gray-400">{title}</p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {previews.map((preview) => (
          <figure key={preview.url} className="overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
            <img src={preview.url} alt={preview.name} className="h-28 w-full object-cover" />
            <figcaption className="truncate px-2 py-1 text-[10px] font-bold text-gray-500">{preview.name}</figcaption>
          </figure>
        ))}
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
