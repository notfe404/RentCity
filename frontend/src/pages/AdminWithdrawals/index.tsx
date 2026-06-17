import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Landmark, Loader2, Search, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import AdminLayout from '@/components/layout/AdminLayout';
import {
  adminCompleteWithdrawalRequest,
  adminGetWithdrawalRequests,
  adminRejectWithdrawalRequest,
} from '@/services/adminApi';
import type { ApiWithdrawalRequest, WithdrawalRequestStatus } from '@/types';
import { formatDateTime, formatVND } from '@/utils/formatters';

type Filter = 'ALL' | WithdrawalRequestStatus;

export default function AdminWithdrawalsPage() {
  const [requests, setRequests] = useState<ApiWithdrawalRequest[]>([]);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeId, setActiveId] = useState<number | null>(null);

  const loadRequests = async () => {
    const { data } = await adminGetWithdrawalRequests();
    setRequests(data);
  };

  useEffect(() => {
    loadRequests()
      .catch(() => toast.error('Could not load withdrawal requests'))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return requests.filter((request) => {
      if (filter !== 'ALL' && request.status !== filter) return false;
      return !keyword
        || request.customerName?.toLowerCase().includes(keyword)
        || request.customerEmail?.toLowerCase().includes(keyword)
        || request.accountNumber.toLowerCase().includes(keyword)
        || request.bankName.toLowerCase().includes(keyword);
    });
  }, [filter, requests, search]);

  const complete = async (request: ApiWithdrawalRequest) => {
    setActiveId(request.id);
    try {
      const { data } = await adminCompleteWithdrawalRequest(request.id);
      setRequests((current) => current.map((item) => item.id === data.id ? data : item));
      toast.success('Withdrawal marked as completed');
    } catch (error) {
      toast.error(apiError(error, 'Could not complete withdrawal'));
    } finally {
      setActiveId(null);
    }
  };

  const reject = async (request: ApiWithdrawalRequest) => {
    const reason = window.prompt('Enter rejection reason');
    if (!reason?.trim()) return;
    setActiveId(request.id);
    try {
      const { data } = await adminRejectWithdrawalRequest(request.id, reason.trim());
      setRequests((current) => current.map((item) => item.id === data.id ? data : item));
      toast.success('Withdrawal rejected and funds returned');
    } catch (error) {
      toast.error(apiError(error, 'Could not reject withdrawal'));
    } finally {
      setActiveId(null);
    }
  };

  return (
    <AdminLayout title="Withdraw Requests">
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Summary label="Pending" value={requests.filter((item) => item.status === 'PENDING').length} color="text-orange-600" />
        <Summary label="Completed" value={requests.filter((item) => item.status === 'COMPLETED').length} color="text-green-600" />
        <Summary label="Pending amount" value={formatVND(requests.filter((item) => item.status === 'PENDING').reduce((sum, item) => sum + item.amount, 0))} color="text-blue-600" />
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Customer, bank, or account number..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white outline-none focus:border-[#78ad44]"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {(['ALL', 'PENDING', 'COMPLETED', 'REJECTED'] as Filter[]).map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`px-4 py-2 rounded-xl text-xs font-black ${filter === item ? 'bg-[#78ad44] text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[980px] text-left">
          <thead className="bg-[#f4f8f7] text-xs uppercase text-gray-400">
            <tr>
              <th className="p-5">Customer</th>
              <th className="p-5">Amount</th>
              <th className="p-5">Bank information</th>
              <th className="p-5">Requested</th>
              <th className="p-5">Status</th>
              <th className="p-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr><td colSpan={6} className="p-12"><Loader2 className="animate-spin mx-auto text-[#78ad44]" /></td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={6} className="p-12 text-center text-gray-400 font-bold"><Landmark className="mx-auto mb-3" />No withdrawal requests</td></tr>
            )}
            {!isLoading && filtered.map((request) => (
              <tr key={request.id} className="hover:bg-gray-50">
                <td className="p-5">
                  <p className="font-black text-gray-900">{request.customerName ?? `User #${request.userId}`}</p>
                  <p className="text-xs text-gray-500">{request.customerEmail}</p>
                </td>
                <td className="p-5 font-black text-blue-600">{formatVND(request.amount)}</td>
                <td className="p-5">
                  <p className="font-bold text-gray-900">{request.bankName}</p>
                  <p className="text-xs text-gray-500">{request.accountHolderName} | {request.accountNumber}</p>
                </td>
                <td className="p-5 text-sm text-gray-500">{formatDateTime(request.createdAt)}</td>
                <td className="p-5">
                  <StatusBadge request={request} />
                  {request.rejectionReason && <p className="text-xs text-red-500 mt-2">{request.rejectionReason}</p>}
                </td>
                <td className="p-5">
                  {request.status === 'PENDING' && (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => reject(request)}
                        disabled={activeId !== null}
                        className="p-2.5 rounded-xl bg-red-50 text-red-600 disabled:text-gray-300"
                        title="Reject"
                      >
                        <XCircle size={18} />
                      </button>
                      <button
                        onClick={() => complete(request)}
                        disabled={activeId !== null}
                        className="px-4 py-2.5 rounded-xl bg-green-600 text-white font-black disabled:bg-gray-300 flex items-center gap-2"
                      >
                        {activeId === request.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        Complete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

function Summary({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 font-bold mt-1">{label}</p>
    </div>
  );
}

function StatusBadge({ request }: { request: ApiWithdrawalRequest }) {
  const style = request.status === 'COMPLETED'
    ? 'bg-green-50 text-green-700'
    : request.status === 'REJECTED'
      ? 'bg-red-50 text-red-700'
      : 'bg-orange-50 text-orange-700';
  return <span className={`inline-flex px-3 py-1 rounded-full text-xs font-black ${style}`}>{request.status}</span>;
}

function apiError(error: unknown, fallback: string) {
  return (error as { response?: { data?: { error?: string } } }).response?.data?.error ?? fallback;
}
