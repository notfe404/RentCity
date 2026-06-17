import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { finalizeDamageAssessment } from '@/services/bookingApi';
import { formatVND } from '@/utils/formatters';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number;
  chargedFee: number;
  estimatedFee: number;
  onSuccess?: () => void;
}

export const FinalizeDamageModal = ({
  isOpen,
  onClose,
  bookingId,
  chargedFee,
  onSuccess,
}: Props) => {
  const [actualFeeStr, setActualFeeStr] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const actualFee = parseInt(actualFeeStr.replace(/\D/g, ''), 10) || 0;
  const refundAmount = Math.max(0, chargedFee - actualFee);
  const outstandingAmount = Math.max(0, actualFee - chargedFee);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (actualFee < 0) {
      toast.warning('Vui lòng nhập chi phí hợp lệ');
      return;
    }
    
    setIsSaving(true);
    try {
      await finalizeDamageAssessment(bookingId, { actualFee });
      if (refundAmount > 0) {
        toast.success(`Đã tự động hoàn trả ${formatVND(refundAmount)} vào ví khách hàng.`);
      } else {
        toast.success('Đã cập nhật chi phí sửa chữa thực tế.');
      }
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể chốt chi phí lúc này.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setActualFeeStr('');
      return;
    }
    const formatted = new Intl.NumberFormat('vi-VN').format(parseInt(raw, 10));
    setActualFeeStr(formatted);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-[#f8f9fa]">
          <div>
            <h2 className="font-black text-gray-900 text-lg">Chốt Chi Phí Sửa Chữa</h2>
            <p className="text-xs font-bold text-gray-500 mt-1">Booking #{bookingId}</p>
          </div>
          <button onClick={onClose} disabled={isSaving} className="p-2 text-gray-400 hover:text-gray-700 rounded-xl">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
            <span className="text-sm font-bold text-gray-500">Khách đã trả / Cọc:</span>
            <span className="font-black text-gray-900">{formatVND(chargedFee)}</span>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">Chi phí thực tế (VNĐ) *</label>
            <input
              type="text"
              required
              placeholder="Nhập chi phí sửa chữa thực tế"
              value={actualFeeStr}
              onChange={handleFeeChange}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className={`rounded-xl border p-4 ${
            refundAmount > 0 ? 'border-green-200 bg-green-50' : 
            outstandingAmount > 0 ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-gray-50'
          }`}>
            {refundAmount > 0 ? (
              <div>
                <p className="text-sm font-bold text-green-700 mb-1">Số tiền hoàn lại:</p>
                <p className="text-lg font-black text-green-700 mb-2">{formatVND(refundAmount)}</p>
                <p className="text-xs font-medium text-green-600">Số tiền này sẽ được hoàn tự động vào Ví điện tử của khách hàng.</p>
              </div>
            ) : outstandingAmount > 0 ? (
              <div>
                <p className="text-sm font-bold text-orange-700 mb-1">Khách cần thanh toán thêm:</p>
                <p className="text-lg font-black text-orange-700 mb-2">{formatVND(outstandingAmount)}</p>
                <p className="text-xs font-medium text-orange-600">Chi phí thực tế lớn hơn số tiền khách đã trả. Hệ thống sẽ ghi nhận công nợ.</p>
              </div>
            ) : (
              <p className="text-xs font-medium text-gray-600">Chi phí thực tế vừa khớp số tiền khách đã trả. Không phát sinh hoàn trả hay thu thêm.</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={isSaving} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl">
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving || !actualFeeStr}
              className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl disabled:bg-gray-300 flex items-center justify-center gap-2 transition-colors"
            >
              {isSaving && <Loader2 size={16} className="animate-spin" />}
              Chốt Chi Phí
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
