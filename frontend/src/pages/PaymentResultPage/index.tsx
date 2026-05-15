import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../LandingPage/Header';
import Footer from '../LandingPage/Footer';
import { CheckCircle2, Copy, FileText, Home } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentResultPage() {
  const navigate = useNavigate();
  const [bookingCode] = useState(() =>
    'RC-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.random().toString(36).substring(2, 6).toUpperCase()
  );

  const copyCode = () => {
    navigator.clipboard.writeText(bookingCode);
    toast.success('Đã sao chép mã đặt xe!');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <Header />

      <div className="flex-1 flex items-center justify-center py-32 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="max-w-xl w-full bg-white rounded-[2.5rem] p-10 md:p-12 shadow-xl border border-gray-100 text-center relative overflow-hidden"
        >
          {/* BG decorations */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#B4D581] opacity-20 blur-3xl rounded-full" />
          <div className="absolute top-1/2 -left-24 w-48 h-48 bg-[#49B096] opacity-10 blur-3xl rounded-full" />

          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-24 h-24 bg-[#e9f2eb] rounded-full mx-auto flex items-center justify-center mb-8 border-4 border-white shadow-lg"
            >
              <CheckCircle2 size={48} className="text-[#78ad44]" />
            </motion.div>

            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-4">
              Thanh toán thành công!
            </h1>
            <p className="text-gray-500 font-medium mb-8 leading-relaxed max-w-sm mx-auto">
              Đơn đặt xe của bạn đã được xác nhận. Email xác nhận đã được gửi tới hộp thư của bạn.
            </p>

            <div className="bg-[#f4f8f7] p-6 rounded-3xl mb-10 flex flex-col md:flex-row items-center justify-between gap-4 border border-gray-100">
              <div className="text-left">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Mã đặt xe</p>
                <p className="text-2xl font-black text-[#78ad44] tracking-wider">{bookingCode}</p>
              </div>
              <button
                onClick={copyCode}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-white text-gray-600 hover:text-gray-900 font-bold px-4 py-2.5 rounded-xl shadow-sm border border-gray-200 transition-colors"
              >
                <Copy size={16} /> Sao chép
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/my-bookings')}
                className="flex-1 shrink-0 px-8 py-4 bg-[#212529] hover:bg-[#111] text-white font-bold rounded-2xl transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <FileText size={18} /> Đơn đặt xe của tôi
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 shrink-0 px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-2xl transition-colors border-2 border-gray-200 flex items-center justify-center gap-2"
              >
                <Home size={18} /> Trang chủ
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
