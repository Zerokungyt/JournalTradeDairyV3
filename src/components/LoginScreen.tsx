import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Lock, 
  User, 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  Database, 
  Sparkles, 
  BarChart3, 
  Calendar as CalendarIcon, 
  Brain,
  Settings,
  ChevronDown,
  ChevronUp,
  LogIn,
  UserPlus,
  KeyRound,
  ArrowLeft,
  Check,
  RefreshCw
} from 'lucide-react';
import { UserProfile } from '../types';
import { dbService, PROFILE_AVATARS } from '../lib/db';
import { motion, AnimatePresence } from 'motion/react';
import { hasFirebaseConfig, firebaseConfig, saveFirebaseConfig, clearFirebaseConfig } from '../lib/firebase';

interface LoginScreenProps {
  onAuthSuccess: (user: UserProfile) => void;
}

export default function LoginScreen({ onAuthSuccess }: LoginScreenProps) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [startingCapital, setStartingCapital] = useState(10000);
  const [selectedAvatar, setSelectedAvatar] = useState(PROFILE_AVATARS[0]);

  // OTP & Forgot password states
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [simulatedNotice, setSimulatedNotice] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);

  // Messages
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Firebase drawer
  const [isConfigExpanded, setIsConfigExpanded] = useState(false);
  const [cfgApiKey, setCfgApiKey] = useState(firebaseConfig.apiKey);
  const [cfgAuthDomain, setCfgAuthDomain] = useState(firebaseConfig.authDomain);
  const [cfgProjectId, setCfgProjectId] = useState(firebaseConfig.projectId);
  const [cfgStorageBucket, setCfgStorageBucket] = useState(firebaseConfig.storageBucket);
  const [cfgMessagingSenderId, setCfgMessagingSenderId] = useState(firebaseConfig.messagingSenderId);
  const [cfgAppId, setCfgAppId] = useState(firebaseConfig.appId);

  // Timer countdown for OTP resend
  useEffect(() => {
    let timer: any;
    if (otpTimer > 0) {
      timer = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpTimer]);

  // Handle Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email || !email.includes('@')) {
      setErrorMessage('กรุณากรอกอีเมลที่ถูกต้อง (เช่น trader@example.com)');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setIsLoading(true);

    try {
      let user: UserProfile;
      if (isLoginTab) {
        user = await dbService.loginUser(email, password);
        setSuccessMessage('เข้าสู่ระบบสำเร็จ ยินดีต้อนรับกลับ!');
      } else {
        user = await dbService.registerUser(email, displayName || email.split('@')[0], startingCapital, password);
        setSuccessMessage('ลงทะเบียนบัญชีเทรดเดอร์สำเร็จ!');
      }

      setTimeout(() => {
        onAuthSuccess(user);
      }, 800);
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Login Handler
  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const user = await dbService.loginWithGoogle();
      setSuccessMessage(`เข้าสู่ระบบด้วย Google Account (${user.email}) สำเร็จ!`);
      setTimeout(() => {
        onAuthSuccess(user);
      }, 800);
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Guest Login
  const handleGuestLogin = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);
    try {
      const guestEmail = `trader_${Math.random().toString(36).substring(2, 7)}@journal.io`;
      const user = await dbService.registerUser(guestEmail, 'Trader Guest', 10000, 'password123');
      setSuccessMessage('เข้าใช้งานในโหมดทดลองใช้สำเร็จ!');
      setTimeout(() => {
        onAuthSuccess(user);
      }, 600);
    } catch (err: any) {
      setErrorMessage('ไม่สามารถสร้างบัญชีทดลองได้');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Send OTP
  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!otpEmail || !otpEmail.includes('@')) {
      setErrorMessage('กรุณากรอกอีเมลที่ถูกต้องเพื่อรับรหัส OTP');
      return;
    }

    setIsLoading(true);
    try {
      const res = await dbService.sendOTP(otpEmail);
      setGeneratedOtp(res.otpCode);
      setSimulatedNotice(res.message);
      setSuccessMessage('ระบบทำการจำลองส่งรหัส OTP 6 หลักไปยังอีเมลของคุณแล้ว');
      setForgotStep(2);
      setOtpTimer(60);
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการส่ง OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!otpCodeInput || otpCodeInput.trim().length < 6) {
      setErrorMessage('กรุณากรอกรหัส OTP 6 หลักให้ครบถ้วน');
      return;
    }

    try {
      dbService.verifyOTP(otpEmail, otpCodeInput.trim());
      setSuccessMessage('ยืนยันรหัส OTP ถูกต้อง! กรุณาตั้งรหัสผ่านใหม่');
      setForgotStep(3);
    } catch (err: any) {
      setErrorMessage(err.message || 'รหัส OTP ไม่ถูกต้อง');
    }
  };

  // Handle Reset Password Submit
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('รหัสผ่านใหม่ต้องยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setIsLoading(true);
    try {
      const user = await dbService.resetPasswordWithOTP(otpEmail, otpCodeInput, newPassword);
      setSuccessMessage('รีเซ็ตรหัสผ่านสำเร็จเรียบร้อย! กำลังพาคุณเข้าสู่ระบบ...');
      setTimeout(() => {
        onAuthSuccess(user);
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการตั้งรหัสผ่านใหม่');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      saveFirebaseConfig({
        apiKey: cfgApiKey.trim(),
        authDomain: cfgAuthDomain.trim(),
        projectId: cfgProjectId.trim(),
        storageBucket: cfgStorageBucket.trim(),
        messagingSenderId: cfgMessagingSenderId.trim(),
        appId: cfgAppId.trim(),
      });
      setSuccessMessage('บันทึกคอนฟิก Firebase สำเร็จ! กำลังรีโหลดแอป...');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setErrorMessage('ไม่สามารถเซฟคอนฟิกได้');
    }
  };

  const handleClearConfig = () => {
    clearFirebaseConfig();
    setSuccessMessage('คืนค่าเริ่มต้นเรียบร้อยแล้ว! กำลังรีโหลดแอป...');
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="min-h-screen bg-[#050811] text-zinc-100 flex flex-col justify-between p-4 md:p-8 relative overflow-hidden font-sans">
      {/* Background Decorative Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-sky-500/10 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-indigo-500/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Top Header / Branding */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between z-10 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 p-0.5 shadow-lg shadow-sky-500/20">
            <div className="h-full w-full bg-[#0B0F1D] rounded-[10px] flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-sky-400" />
            </div>
          </div>
          <div>
            <span className="font-display font-bold text-lg text-zinc-100 tracking-tight">
              Journal<span className="text-sky-400">Dairy</span>Trade
            </span>
            <span className="text-[10px] font-mono text-sky-400/60 block uppercase tracking-wider">
              Professional Trading Journal
            </span>
          </div>
        </div>

        {/* Database Status Tag */}
        <div className="hidden sm:flex items-center gap-2">
          {hasFirebaseConfig ? (
            <span className="flex items-center gap-1.5 text-xs font-mono text-sky-300 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full">
              <ShieldCheck className="h-3.5 w-3.5" /> FIREBASE AUTH (LIVE)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              <Database className="h-3.5 w-3.5" /> LOCAL STORAGE SYSTEM
            </span>
          )}
        </div>
      </header>

      {/* Main Login / Signup Portal */}
      <main className="max-w-md w-full mx-auto my-auto z-10 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-[#0D1222] border border-sky-500/15 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative overflow-hidden backdrop-blur-xl"
        >
          {/* Top Emerald Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500" />

          {/* Messages */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/80 text-rose-300 rounded-xl text-xs font-semibold mb-4 leading-relaxed">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="p-3 bg-sky-950/40 border border-sky-800/80 text-sky-300 rounded-xl text-xs font-semibold mb-4 leading-relaxed">
              {successMessage}
            </div>
          )}

          {/* ================= FORGOT PASSWORD / OTP MODE ================= */}
          {isForgotPasswordMode ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-sky-500/10 pb-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPasswordMode(false);
                    setForgotStep(1);
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-semibold transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" /> กลับสู่หน้าเข้าสู่ระบบ
                </button>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                  ขั้นตอนที่ {forgotStep}/3
                </span>
              </div>

              <div className="text-center space-y-1">
                <h2 className="font-display font-bold text-xl text-zinc-100 flex items-center justify-center gap-2">
                  <KeyRound className="h-5 w-5 text-sky-400" /> ลืมรหัสผ่าน (กู้คืนด้วย OTP)
                </h2>
                <p className="text-xs text-zinc-400">
                  {forgotStep === 1 && 'กรอกอีเมลของคุณเพื่อขอรับรหัสยืนยัน OTP 6 หลัก'}
                  {forgotStep === 2 && `ป้อนรหัส OTP 6 หลักที่ถูกส่งไปยัง ${otpEmail}`}
                  {forgotStep === 3 && 'กำหนดรหัสผ่านใหม่เพื่อใช้ในการเข้าสู่ระบบ'}
                </p>
              </div>

              {/* Progress Stepper */}
              <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[10px]">
                <div className={`py-1 rounded-lg border ${forgotStep >= 1 ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-bold' : 'bg-zinc-900 text-zinc-600 border-white/5'}`}>
                  1. ขอ OTP
                </div>
                <div className={`py-1 rounded-lg border ${forgotStep >= 2 ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-bold' : 'bg-zinc-900 text-zinc-600 border-white/5'}`}>
                  2. ยืนยันรหัส
                </div>
                <div className={`py-1 rounded-lg border ${forgotStep >= 3 ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-bold' : 'bg-zinc-900 text-zinc-600 border-white/5'}`}>
                  3. ตั้งรหัสใหม่
                </div>
              </div>

              {/* Step 1: Request OTP */}
              {forgotStep === 1 && (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
                      อีเมลที่ลงทะเบียนไว้
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                      <input
                        type="email"
                        required
                        value={otpEmail}
                        onChange={(e) => setOtpEmail(e.target.value)}
                        placeholder="trader@example.com"
                        className="w-full bg-[#080B15] border border-sky-500/15 focus:border-sky-400 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 hover:from-sky-300 hover:to-blue-400 text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? 'กำลังส่งรหัส OTP...' : 'ส่งรหัส OTP ไปยังอีเมล'}
                  </button>
                </form>
              )}

              {/* Step 2: Verify OTP */}
              {forgotStep === 2 && (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  {/* Simulated OTP Inbox Notice */}
                  {generatedOtp && (
                    <div className="p-3.5 bg-sky-950/60 border border-sky-500/30 rounded-xl text-xs space-y-2">
                      <div className="flex items-center gap-1.5 text-sky-300 font-bold">
                        <Mail className="h-4 w-4" /> จำลองการส่งอีเมล OTP สำเร็จ!
                      </div>
                      <p className="text-zinc-300 text-[11px] leading-relaxed">
                        รหัส OTP สำหรับกู้คืนรหัสผ่านของคุณคือ:{' '}
                        <span className="font-mono font-bold text-sky-300 bg-sky-500/20 border border-sky-500/30 px-2 py-0.5 rounded text-sm tracking-wider">
                          {generatedOtp}
                        </span>
                      </p>
                      <button
                        type="button"
                        onClick={() => setOtpCodeInput(generatedOtp)}
                        className="text-[10px] font-mono text-sky-400 hover:text-sky-300 underline cursor-pointer flex items-center gap-1"
                      >
                        ⚡ คลิกใส่รหัส OTP {generatedOtp} อัตโนมัติ
                      </button>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
                        ป้อนรหัส OTP 6 หลัก
                      </label>
                      <button
                        type="button"
                        onClick={() => handleSendOTP()}
                        disabled={otpTimer > 0 || isLoading}
                        className="text-[10px] font-mono text-sky-400 hover:underline disabled:opacity-50 cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        {otpTimer > 0 ? `ขออีกครั้งใน (${otpTimer}s)` : 'ส่งรหัสอีกครั้ง'}
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpCodeInput}
                      onChange={(e) => setOtpCodeInput(e.target.value)}
                      placeholder="123456"
                      className="w-full bg-[#080B15] border border-sky-500/15 focus:border-sky-400 rounded-xl px-4 py-2.5 text-center text-lg font-mono font-bold text-sky-300 tracking-[0.5em] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 hover:from-sky-300 hover:to-blue-400 text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
                  >
                    ยืนยันรหัส OTP
                  </button>
                </form>
              )}

              {/* Step 3: Set New Password */}
              {forgotStep === 3 && (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
                      รหัสผ่านใหม่ (New Password)
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="ป้อนอย่างน้อย 6 ตัวอักษร"
                        className="w-full bg-[#080B15] border border-sky-500/15 focus:border-sky-400 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
                      ยืนยันรหัสผ่านใหม่ (Confirm Password)
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="ป้อนรหัสผ่านซ้ำอีกครั้ง"
                        className="w-full bg-[#080B15] border border-sky-500/15 focus:border-sky-400 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 hover:from-sky-300 hover:to-blue-400 text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    {isLoading ? 'กำลังรีเซ็ตรหัสผ่าน...' : 'บันทึกรหัสผ่านใหม่และเข้าสู่ระบบ'}
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* ================= LOGIN & REGISTER MODE ================= */
            <>
              {/* Form Header */}
              <div className="text-center space-y-2 mb-6">
                <h1 className="font-display font-bold text-2xl text-zinc-100">
                  {isLoginTab ? 'เข้าสู่ระบบบันทึกการเทรด' : 'สร้างบัญชีเทรดเดอร์ใหม่'}
                </h1>
                <p className="text-xs text-zinc-400">
                  {isLoginTab 
                    ? 'ป้อนชื่อผู้ใช้/อีเมลและรหัสผ่านเพื่อล็อกอินใช้งานข้อมูลในเครื่องของคุณ' 
                    : 'สร้างบัญชีใช้งานในเครื่องฟรี บันทึกรูปโปรไฟล์ และจัดเก็บข้อมูลปลอดภัยในเครื่อง'}
                </p>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-500/10 border border-sky-500/20 rounded-full text-[10px] font-mono text-sky-300">
                    <Database className="h-3 w-3" /> ข้อมูลและบัญชีถูกจัดเก็บในเครื่องของคุณ (Local Client-Side Storage)
                  </span>
                </div>
              </div>

              {/* Quick Guest Access Button */}
              <button
                type="button"
                onClick={handleGuestLogin}
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-emerald-400 via-teal-500 to-sky-500 hover:from-emerald-300 hover:to-teal-400 text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 mb-4"
              >
                <User className="h-4 w-4" />
                <span>เข้าใช้งานทันทีแบบ Guest (ไม่ต้องใช้อีเมล)</span>
              </button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-sky-500/10"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-wider">
                  <span className="bg-[#0D1222] px-2 text-zinc-500">หรือใช้บัญชีส่วนตัว (Username/Email & Password)</span>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="grid grid-cols-2 bg-[#080B15] p-1.5 rounded-2xl border border-sky-500/10 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginTab(true);
                    setErrorMessage('');
                  }}
                  className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isLoginTab
                      ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-zinc-950 shadow-md shadow-sky-500/20'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <LogIn className="h-3.5 w-3.5" /> เข้าสู่ระบบ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginTab(false);
                    setErrorMessage('');
                  }}
                  className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    !isLoginTab
                      ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-zinc-950 shadow-md shadow-sky-500/20'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <UserPlus className="h-3.5 w-3.5" /> สมัครสมาชิก
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
                    อีเมล (Email)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="trader@example.com"
                      className="w-full bg-[#080B15] border border-sky-500/15 focus:border-sky-400 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none transition-all font-sans"
                    />
                  </div>
                </div>

                {/* Password with Forgot Password link */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
                      รหัสผ่าน (Password)
                    </label>
                    {isLoginTab && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPasswordMode(true);
                          setOtpEmail(email);
                          setErrorMessage('');
                          setSuccessMessage('');
                        }}
                        className="text-[11px] font-mono text-sky-400 hover:text-sky-300 hover:underline transition-colors cursor-pointer"
                      >
                        ลืมรหัสผ่าน?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#080B15] border border-sky-500/15 focus:border-sky-400 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none transition-all font-sans"
                    />
                  </div>
                </div>

                {/* Extra Register Fields */}
                {!isLoginTab && (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
                        ชื่อเทรดเดอร์ (Display Name)
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                        <input
                          type="text"
                          required
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="เช่น Lukin Trader"
                          className="w-full bg-[#080B15] border border-sky-500/15 focus:border-sky-400 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
                        เงินทุนเริ่มต้นพอร์ต ($ USD)
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                        <input
                          type="number"
                          required
                          value={startingCapital}
                          onChange={(e) => setStartingCapital(Number(e.target.value))}
                          placeholder="10000"
                          className="w-full bg-[#080B15] border border-sky-500/15 focus:border-sky-400 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none transition-all font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
                        เลือกรูปอวาตาร์ประจำตัว
                      </label>
                      <div className="flex gap-2 justify-between">
                        {PROFILE_AVATARS.map((avatarUrl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedAvatar(avatarUrl)}
                            className={`relative h-12 w-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                              selectedAvatar === avatarUrl ? 'border-sky-400 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 mt-4 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 hover:from-sky-300 hover:to-blue-400 text-zinc-950 font-bold text-sm rounded-xl shadow-lg shadow-sky-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="animate-pulse">กำลังประมวลผล...</span>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      {isLoginTab ? 'เข้าสู่ระบบ' : 'สร้างบัญชีใหม่'}
                    </>
                  )}
                </button>
              </form>

              {/* Quick Demo Login Option */}
              <div className="mt-4 pt-4 border-t border-sky-500/10 text-center">
                <button
                  type="button"
                  onClick={handleGuestLogin}
                  disabled={isLoading}
                  className="w-full py-2 bg-[#080B15] hover:bg-[#11172A] text-zinc-400 hover:text-sky-300 rounded-xl text-xs font-semibold transition-all border border-sky-500/10 cursor-pointer flex items-center justify-center gap-2"
                >
                  <User className="h-3.5 w-3.5 text-sky-400" /> ทดลองเข้าใช้งานทันที (Guest Account)
                </button>
              </div>
            </>
          )}

          {/* Drawer for Custom Firebase Config */}
          <div className="mt-5 pt-3 border-t border-sky-500/10">
            <button
              type="button"
              onClick={() => setIsConfigExpanded(!isConfigExpanded)}
              className="w-full flex items-center justify-between text-[11px] font-mono text-zinc-400 hover:text-sky-300 transition-colors"
            >
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                <Settings className="h-3.5 w-3.5 text-sky-400" /> การตั้งค่า Firebase Database
              </span>
              {isConfigExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            <AnimatePresence>
              {isConfigExpanded && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleSaveConfig}
                  className="space-y-3 mt-3 overflow-hidden"
                >
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    คุณสามารถป้อนคีย์การเชื่อมต่อ Firebase ของคุณเพื่อบันทึกข้อมูลออนไลน์:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <input
                      type="password"
                      value={cfgApiKey}
                      onChange={(e) => setCfgApiKey(e.target.value)}
                      placeholder="API KEY"
                      className="w-full bg-[#080B15] border border-sky-500/10 rounded-lg px-2.5 py-1.5 text-zinc-300 font-mono"
                    />
                    <input
                      type="text"
                      value={cfgProjectId}
                      onChange={(e) => setCfgProjectId(e.target.value)}
                      placeholder="PROJECT ID"
                      className="w-full bg-[#080B15] border border-sky-500/10 rounded-lg px-2.5 py-1.5 text-zinc-300 font-mono"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    {hasFirebaseConfig && (
                      <button
                        type="button"
                        onClick={handleClearConfig}
                        className="px-2.5 py-1 text-[10px] bg-rose-950/20 text-rose-400 border border-rose-900/40 rounded-lg hover:bg-rose-950/40"
                      >
                        ล้างคอนฟิก
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-3 py-1 text-[10px] bg-sky-400 text-zinc-950 font-bold rounded-lg hover:bg-sky-300"
                    >
                      บันทึกคอนฟิก
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Value Proposition Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[#0D1222]/80 border border-sky-500/10 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0 text-sky-400">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-200">Quant Analysis</p>
              <p className="text-[10px] text-zinc-400">คำนวณ Winrate และ RRR</p>
            </div>
          </div>

          <div className="bg-[#0D1222]/80 border border-sky-500/10 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0 text-sky-400">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-200">Calendar View</p>
              <p className="text-[10px] text-zinc-400">บันทึกแยกไม้ในปฏิทิน</p>
            </div>
          </div>

          <div className="bg-[#0D1222]/80 border border-sky-500/10 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0 text-sky-400">
              <Brain className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-200">Psychology Journal</p>
              <p className="text-[10px] text-zinc-400">บันทึกสภาวะอารมณ์</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="max-w-6xl w-full mx-auto text-center py-4 border-t border-sky-500/10 text-[10px] font-mono text-zinc-500 uppercase tracking-wider z-10">
        © 2026 JournalDairyTrade. Luxury Blue Trading Discipline System.
      </footer>
    </div>
  );
}
