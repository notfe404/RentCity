import { Calendar } from 'lucide-react';

import {
  clampDateTimeLocalValue,
  combineDateAndTimeParts,
  splitDateTimeLocalValue,
  TIME_OPTIONS_24H,
} from '@/utils/bookingDateTime';

interface DateTime24hFieldProps {
  value: string;
  min?: string;
  onChange: (value: string) => void;
  containerClassName?: string;
  controlsClassName?: string;
  dateInputClassName?: string;
  timeSelectClassName?: string;
  iconClassName?: string;
  iconSize?: number;
}

export default function DateTime24hField({
  value,
  min,
  onChange,
  containerClassName = '',
  controlsClassName = '',
  dateInputClassName = '',
  timeSelectClassName = '',
  iconClassName = '',
  iconSize = 18,
}: DateTime24hFieldProps) {
  const { datePart, timePart } = splitDateTimeLocalValue(value);
  const minDatePart = min ? splitDateTimeLocalValue(min).datePart : undefined;
  const timeOptions = TIME_OPTIONS_24H.includes(timePart) ? TIME_OPTIONS_24H : [timePart, ...TIME_OPTIONS_24H];

  const updateValue = (nextDatePart: string, nextTimePart: string) => {
    onChange(clampDateTimeLocalValue(combineDateAndTimeParts(nextDatePart, nextTimePart), min));
  };

  return (
    <div className={containerClassName}>
      <Calendar className={iconClassName} size={iconSize} />
      <div className={controlsClassName}>
        <input
          type="date"
          value={datePart}
          min={minDatePart}
          onChange={(e) => updateValue(e.target.value, timePart)}
          className={dateInputClassName}
        />
        <select
          value={timePart}
          onChange={(e) => updateValue(datePart, e.target.value)}
          className={timeSelectClassName}
        >
          {timeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
