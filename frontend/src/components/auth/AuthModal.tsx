import { useState, useEffect, type FormEvent } from 'react';
import { EyeOff, Eye, Facebook, Linkedin, Mail, User as UserIcon, Lock, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useLocation, useNavigate } from 'react-router-dom';

export default function AuthModal() {
  const { isAuthModalOpen, authModalInitialTab, closeAuthModal, openAuthModal, login, register } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [showPasswordHint, setShowPasswordHint] = useState(false);

  // Password rule checks
  const pwRules = {
    length: regPassword.length >= 8,
    uppercase: /[A-Z]/.test(regPassword),
    lowercase: /[a-z]/.test(regPassword),
    noSpecial: /^[a-zA-Z0-9]*$/.test(regPassword) && regPassword.length > 0,
  };

  // Khôi phục auto-open từ ProtectedRoute
  useEffect(() => {
    if (location.state?.openAuth) {
      openAuthModal('login');
      // Xóa flag openAuth nhưng giữ lại đường dẫn from để redirect back
      navigate(location.pathname, { replace: true, state: { from: location.state.from } });
    }
  }, [location.state, navigate, location.pathname, openAuthModal]);

  useEffect(() => {
    if (isAuthModalOpen) {
      setIsLogin(authModalInitialTab === 'login');
      setShowPassword(false);
      setError('');
    }
  }, [isAuthModalOpen, authModalInitialTab]);

  const toggleMode = () => {
    setIsLogin((prev) => !prev);
    setShowPassword(false);
    setError('');
  };

  const handleAuthSuccess = () => {
    const from = location.state?.from?.pathname;
    if (from) {
      navigate(from, { replace: true });
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) { setError('Vui lòng nhập đầy đủ email và mật khẩu.'); return; }
    setError('');
    setIsLoading(true);
    try {
      await login({ email: loginEmail, password: loginPassword });
      toast.success('Đăng nhập thành công! Chào mừng trở lại 👋');
      handleAuthSuccess();
    } catch {
      setError('Email hoặc mật khẩu không đúng. Thử lại nhé!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword || !regPhone) { setError('Vui lòng điền đầy đủ tất cả thông tin.'); return; }
    if (!/^0\d{9}$/.test(regPhone)) { setError('Số điện thoại phải có đúng 10 chữ số và bắt đầu bằng số 0.'); return; }
    if (!/^(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9]{8,}$/.test(regPassword)) { setError('Mật khẩu chưa đúng định dạng. Vui lòng kiểm tra lại hướng dẫn bên dưới.'); return; }
    if (regPassword !== regConfirm) { setError('Mật khẩu xác nhận không khớp.'); return; }
    setError('');
    setIsLoading(true);
    try {
      await register({ email: regEmail, password: regPassword, fullName: regName, phone: regPhone });
      toast.success('Tài khoản đã được tạo! Chào mừng đến với RentCity 🎉');
      handleAuthSuccess();
    } catch (err: unknown) {
      // Lấy thông báo lỗi thực tế từ backend
      const axiosErr = err as { response?: { data?: Record<string, string> | { error?: string } } };
      const data = axiosErr?.response?.data;
      if (data) {
        if ('error' in data && data.error) {
          setError(data.error);
        } else {
          // Validation errors trả về dạng { fieldName: message }
          const fieldErrors = data as Record<string, string>;
          const firstError = Object.values(fieldErrors)[0];
          setError(firstError || 'Đăng ký thất bại. Vui lòng thử lại.');
        }
      } else {
        setError('Đăng ký thất bại. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start md:items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className={`bg-white w-full max-w-[900px] md:min-h-[600px] rounded-2xl shadow-2xl flex flex-col md:flex-row relative overflow-hidden my-auto animate-in zoom-in-95 duration-300 ${!isLogin ? 'md:flex-row-reverse' : ''}`}>
        
        {/* Close Button */}
        <button 
          onClick={closeAuthModal}
          className="absolute top-4 right-4 z-50 text-gray-400 hover:text-gray-700 bg-white/50 backdrop-blur-md hover:bg-gray-100 rounded-full p-2 transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M13 1L1 13M1 1l12 12" />
          </svg>
        </button>

        {/* ── FORM SIDE ── */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 sm:p-12 bg-white">
          <h2 className="text-3xl font-bold text-[#49B096] mb-6">
            {isLogin ? 'Sign in to RentCity' : 'Create Account'}
          </h2>

          {/* Social Icons */}
          <div className="flex gap-4 mb-4">
            <button type="button" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#49B096] hover:text-[#49B096] transition-colors shadow-sm"><Facebook size={18} /></button>
            <button type="button" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:border-[#49B096] hover:text-[#49B096] transition-colors shadow-sm">G+</button>
            <button type="button" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#49B096] hover:text-[#49B096] transition-colors shadow-sm"><Linkedin size={18} /></button>
          </div>
          <p className="text-xs text-gray-400 mb-4">{isLogin ? 'or use your email account:' : 'or use your email for registration:'}</p>

          {/* Error Message */}
          {error && (
            <div className="w-full mb-4 flex items-center gap-2 bg-red-50 text-red-600 text-xs font-medium px-4 py-3 rounded-xl border border-red-100">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          {isLogin ? (
            // ------- LOGIN FORM -------
            <form onSubmit={handleLogin} className="w-full space-y-3">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                <input 
                  type="email" 
                  placeholder="Email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full bg-[#f4f8f7] border-none rounded-md px-12 py-3.5 text-sm focus:ring-1 focus:ring-[#49B096] outline-none text-gray-700"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full bg-[#f4f8f7] border-none rounded-md px-12 py-3.5 text-sm focus:ring-1 focus:ring-[#49B096] outline-none text-gray-700 pr-12"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>

              {/* Demo account hint */}
              <div className="text-[11px] text-gray-400 bg-gray-50 rounded-xl p-3 leading-relaxed">
                <span className="font-bold text-gray-500">Demo accounts:</span><br />
                👤 customer@demo.com / 123456<br />
                👔 staff@demo.com / 123456<br />
                🛡️ admin@demo.com / 123456
              </div>

              <div className="text-center">
                <a href="#" className="text-xs text-gray-500 hover:text-gray-800 border-b border-gray-300 pb-0.5">Forgot your password?</a>
              </div>
              <div className="pt-4 flex justify-center">
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#49B096] hover:bg-[#3d947e] disabled:bg-gray-300 text-white font-bold rounded-full px-12 py-3 transition-colors shadow-md focus:outline-none select-none"
                >
                  {isLoading ? 'Signing in...' : 'SIGN IN'}
                </button>
              </div>
            </form>
          ) : (
            // ------- REGISTER FORM -------
            <form onSubmit={handleRegister} className="w-full space-y-3 max-h-[360px] overflow-y-auto pr-1">
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                <input type="text" placeholder="Full Name" value={regName} onChange={e => setRegName(e.target.value)} className="w-full bg-[#f4f8f7] border-none rounded-md px-12 py-3.5 text-sm focus:ring-1 focus:ring-[#49B096] outline-none text-gray-700" />
              </div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                <input type="email" placeholder="Email" value={regEmail} onChange={e => setRegEmail(e.target.value)} className="w-full bg-[#f4f8f7] border-none rounded-md px-12 py-3.5 text-sm focus:ring-1 focus:ring-[#49B096] outline-none text-gray-700" />
              </div>
              <input type="tel" placeholder="Số điện thoại (VD: 0901234567)" value={regPhone} onChange={e => setRegPhone(e.target.value)} className="w-full bg-[#f4f8f7] border-none rounded-md px-4 py-3.5 text-sm focus:ring-1 focus:ring-[#49B096] outline-none text-gray-700" />
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mật khẩu"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  onFocus={() => setShowPasswordHint(true)}
                  onBlur={() => setShowPasswordHint(false)}
                  className="w-full bg-[#f4f8f7] border-none rounded-md px-12 py-3.5 text-sm focus:ring-1 focus:ring-[#49B096] outline-none text-gray-700"
                />
              </div>
              {/* Password Hint Box */}
              {showPasswordHint && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-[11px] leading-relaxed space-y-1">
                  <p className="font-bold text-gray-600 mb-1">Yêu cầu mật khẩu:</p>
                  <p className={`flex items-center gap-1.5 ${pwRules.length ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className={`inline-block w-3.5 h-3.5 rounded-full border ${pwRules.length ? 'bg-green-500 border-green-500' : 'border-gray-300'} shrink-0`} />
                    Tối thiểu 8 ký tự
                  </p>
                  <p className={`flex items-center gap-1.5 ${pwRules.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className={`inline-block w-3.5 h-3.5 rounded-full border ${pwRules.uppercase ? 'bg-green-500 border-green-500' : 'border-gray-300'} shrink-0`} />
                    Có ít nhất 1 chữ IN HOA (A-Z)
                  </p>
                  <p className={`flex items-center gap-1.5 ${pwRules.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className={`inline-block w-3.5 h-3.5 rounded-full border ${pwRules.lowercase ? 'bg-green-500 border-green-500' : 'border-gray-300'} shrink-0`} />
                    Có ít nhất 1 chữ in thường (a-z)
                  </p>
                  <p className={`flex items-center gap-1.5 ${pwRules.noSpecial ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className={`inline-block w-3.5 h-3.5 rounded-full border ${pwRules.noSpecial ? 'bg-green-500 border-green-500' : 'border-gray-300'} shrink-0`} />
                    Không chứa ký tự đặc biệt (@, #, !...)
                  </p>
                </div>
              )}
              <div className="relative">
                <Check className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                <input type={showPassword ? 'text' : 'password'} placeholder="Re-enter Password" value={regConfirm} onChange={e => setRegConfirm(e.target.value)} className="w-full bg-[#f4f8f7] border-none rounded-md px-12 py-3.5 text-sm focus:ring-1 focus:ring-[#49B096] outline-none text-gray-700" />
              </div>
              <div className="pt-4 flex justify-center">
                <button type="submit" disabled={isLoading} className="bg-[#49B096] hover:bg-[#3d947e] disabled:bg-gray-300 text-white font-bold rounded-full px-12 py-3 transition-colors shadow-md focus:outline-none select-none">
                  {isLoading ? 'Creating...' : 'SIGN UP'}
                </button>
              </div>
            </form>
          )}

          {/* Mobile toggle */}
          <div className="md:hidden pt-6 text-center">
            <p className="text-xs text-gray-500 mb-2">{isLogin ? "Don't have an account?" : "Already have an account?"}</p>
            <button onClick={toggleMode} className="text-[#49B096] font-bold text-sm border-b border-[#49B096]">
              {isLogin ? 'SIGN UP NOW' : 'SIGN IN NOW'}
            </button>
          </div>
        </div>

        {/* ── PROMO SIDE (GREEN) ── */}
        <div className="hidden md:flex w-1/2 bg-[#49B096] text-white flex-col items-center justify-center p-12 text-center relative overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rotate-45" />
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full" />
          <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-white/10 rounded-sm rotate-12" />
          <div className="relative z-10 w-full animate-in zoom-in-95 duration-700">
            {isLogin ? (
              <>
                <h2 className="text-4xl font-bold mb-6 tracking-tight">Hello, Friend!</h2>
                <p className="mb-10 text-white/90 font-medium text-sm leading-relaxed max-w-[80%] mx-auto">Enter your personal details<br/>and start journey with us</p>
                <button onClick={toggleMode} className="border border-white rounded-full px-12 py-3 text-sm font-bold hover:bg-white hover:text-[#49B096] transition-colors focus:outline-none select-none">SIGN UP</button>
              </>
            ) : (
              <>
                <h2 className="text-4xl font-bold mb-6 tracking-tight">Welcome Back!</h2>
                <p className="mb-10 text-white/90 font-medium text-sm leading-relaxed max-w-[80%] mx-auto">To keep connected with us please<br/>login with your personal info</p>
                <button onClick={toggleMode} className="border border-white rounded-full px-12 py-3 text-sm font-bold hover:bg-white hover:text-[#49B096] transition-colors focus:outline-none select-none">SIGN IN</button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
