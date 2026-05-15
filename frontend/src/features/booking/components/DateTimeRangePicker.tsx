import React from 'react';

interface Props {
  startTime: string | null;
  endTime: string | null;
  onChangeStart: (val: string) => void;
  onChangeEnd: (val: string) => void;
}

export const DateTimeRangePicker: React.FC<Props> = ({
  startTime,
  endTime,
  onChangeStart,
  onChangeEnd,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
          Nhận xe
        </label>
        <input
          type="datetime-local"
          value={startTime || ''}
          onChange={(e) => onChangeStart(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#49B096] focus:border-transparent outline-none transition-all"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
          Trả xe
        </label>
        <input
          type="datetime-local"
          value={endTime || ''}
          onChange={(e) => onChangeEnd(e.target.value)}
          min={startTime || ''}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#49B096] focus:border-transparent outline-none transition-all"
        />
      </div>
    </div>
  );
};
