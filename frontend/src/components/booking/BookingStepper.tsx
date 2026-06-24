import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface BookingStepperProps {
  currentStep: 1 | 2 | 3;
}

const STEPS = [
  { label: 'Details' },
  { label: 'Confirm' },
  { label: 'Payment' },
];

export default function BookingStepper({ currentStep }: BookingStepperProps) {
  return (
    <div className="flex items-center justify-center max-w-2xl mx-auto mb-12">
      <div className="flex items-center w-full">
        {STEPS.map((step, idx) => {
          const stepNum = idx + 1;
          const isCompleted = currentStep > stepNum;
          const isActive = currentStep >= stepNum;

          return (
            <div key={step.label} className="flex items-center flex-1 last:flex-initial">
              {/* Step circle + label */}
              <div className={`flex flex-col items-center relative z-10 ${isActive ? 'text-[#78ad44]' : 'text-gray-400'}`}>
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: isActive ? '#78ad44' : '#e5e7eb',
                    scale: isActive ? 1 : 0.95,
                  }}
                  transition={{ duration: 0.3 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 ${
                    isActive ? 'text-white shadow-lg shadow-[#78ad44]/30' : 'text-gray-500'
                  }`}
                >
                  {isCompleted ? <Check size={18} /> : stepNum}
                </motion.div>
                <span className="text-xs font-bold uppercase tracking-wider whitespace-nowrap">{step.label}</span>
              </div>

              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div className="flex-1 h-1 mx-4 rounded-full bg-gray-200 overflow-hidden">
                  <motion.div
                    initial={false}
                    animate={{ width: currentStep > stepNum ? '100%' : '0%' }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    className="h-full bg-[#78ad44] rounded-full"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
