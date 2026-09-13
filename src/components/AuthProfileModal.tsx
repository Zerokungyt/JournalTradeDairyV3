import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  User, 
  Mail, 
  DollarSign, 
  Check, 
  LogOut, 
  Lock, 
  Settings, 
  ShieldCheck, 
  Database,
  ChevronDown,
  ChevronUp,
  Upload,
  KeyRound,
  ArrowLeft,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { UserProfile } from '../types';
import { dbService, PROFILE_AVATARS } from '../lib/db';
import { motion, AnimatePresence } from 'motion/react';
import { hasFirebaseConfig, firebaseConfig, saveFirebaseConfig, clearFirebaseConfig } from '../lib/firebase';

interface AuthProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onAuthSuccess: (user: UserProfile) => void;
  onLogout: () => void;
}

export default function AuthProfileModal({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
  onLogout,
}: AuthProfileModalProps) {
  // Modal active tab for logged-in users: 'profile' | 'change-password'
  const [profileTab, setProfileTab] = useState<'profile' | 'change-password'>('profile');

  // Modal active state for logged-out users
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);

  // Ref for custom file uploader
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [startingCapital, setStartingCapital] = useState(10000);

  // Edit Profile fields
  const [editName, setEditName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [editCapital, setEditCapital] = useState(10000);

  // Password Change fields in profile modal
  const [changeNewPassword, setChangeNewPassword] = useState('');
  const [changeConfirmPassword, setChangeConfirmPassword] = useState('');

  // OTP & Forgot password states
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);

  // Status indicators
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigExpanded, setIsConfigExpanded] = useState(false);

  // Firebase Config fields for local editor
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

  // Sync edit profile fields when user loads
  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.displayName);
      setSelectedAvatar(currentUser.photoURL);
      setEditCapital(currentUser.startingCapital);
    } else {
      // Clear fields
      setEmail('');
      setPassword('');
      setDisplayName('');
      setStartingCapital(10000);
    }
    setProfileTab('profile');
    setIsForgotPasswordMode(false);
    setForgotStep(1);
    setChangeNewPassword('');
    setChangeConfirmPassword('');
    setErrorMessage('');
    setSuccessMessage('');
  }, [currentUser, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage('ขนาดรูปภาพต้องไม่เกิน 2MB เพื่อประสิทธิภาพและความรวดเร็วในการบันทึกข้อมูล');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedAvatar(event.target.result as string);
          setSuccessMessage('โหลดรูปภาพส่วนตัวของคุณสำเร็จ! อย่าลืมกด "บันทึกข้อมูล"');
          setErrorMessage('');
        }
      };
      reader.onerror = () => {
        setErrorMessage('ไม่สามารถอ่านไฟล์รูปภาพได้');
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  // Handle Async Login / Register Submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email || !email.includes('@')) {
      setErrorMessage('กรุณากรอกอีเมลที่ถูกต้อง');
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
        setSuccessMessage('เข้าสู่ระบบสำเร็จเรียบร้อย!');
      } else {
        user = await dbService.registerUser(email, displayName, startingCapital, password);
        setSuccessMessage('ลงทะเบียนและเข้าใช้งานสำเร็จ!');
      }

      setTimeout(() => {
        onAuthSuccess(user);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบ');
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
        onClose();
      }, 800);
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Edit Profile Save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!currentUser) return;
    if (!editName.trim()) {
      setErrorMessage('กรุณากรอกชื่อแสดงผล');
      return;
    }

    try {
      const updated = dbService.updateProfile(
        currentUser.uid,
        editName,
        selectedAvatar,
        editCapital
      );
      setSuccessMessage('อัปเดตข้อมูลส่วนตัวเสร็จสมบูรณ์!');
      onAuthSuccess(updated);

      setTimeout(() => {
        setSuccessMessage('');
      }, 2500);
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  // Handle Change Password in Profile Modal
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!changeNewPassword || changeNewPassword.length < 6) {
      setErrorMessage('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (changeNewPassword !== changeConfirmPassword) {
      setErrorMessage('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setIsLoading(true);
    try {
      await dbService.changePassword(changeNewPassword);
      setSuccessMessage('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว!');
      setChangeNewPassword('');
      setChangeConfirmPassword('');
    } catch (err: any) {
      setErrorMessage(err.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
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
      setSuccessMessage('ระบบจำลองส่งรหัส OTP 6 หลักไปยังอีเมลของคุณเรียบร้อยแล้ว');
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
      setErrorMessage('กรุณากรอกรหัส OTP 6 หลัก');
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

    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setErrorMessage('รหัสผ่านใหม่ต้องยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setErrorMessage('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setIsLoading(true);
    try {
      const user = await dbService.resetPasswordWithOTP(otpEmail, otpCodeInput, forgotNewPassword);
      setSuccessMessage('รีเซ็ตรหัสผ่านสำเร็จ! กำลังเข้าสู่ระบบ...');
      setTimeout(() => {
        onAuthSuccess(user);
        onClose();
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
      setSuccessMessage('บันทึกคอนฟิก Firebase สำเร็จ! กำลังรีโหลดแอปพลิเคชัน...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setErrorMessage('ไม่สามารถเซฟคอนฟิกได้');
    }
  };

  const handleClearConfig = () => {
    clearFirebaseConfig();
    setSuccessMessage('คืนค่าเริ่มต้นเรียบร้อยแล้ว! กำลังรีโหลดแอปพลิเคชัน...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="relative bg-[#0F0F12] border border-sky-500/20 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl my-8"
      >
        {/* Top accent bar */}
        <div className="h-[3px] bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600" />

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-sky-500/10">
          <div>
            <h2 className="font-display text-base font-bold text-zinc-100">
              {currentUser ? 'จัดการบัญชีส่วนตัว' : 'เข้าสู่ระบบ / สมัครสมาชิก'}
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
              {hasFirebaseConfig ? (
                <span className="flex items-center gap-1 text-[10px] font-mono text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded font-medium">
                  <ShieldCheck className="h-3 w-3" /> FIREBASE AUTH (ONLINE)
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-medium">
                  <Database className="h-3 w-3" /> LOCAL STORAGE (DEV)
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#080B15] hover:bg-[#11172A] text-zinc-400 hover:text-sky-300 border border-sky-500/10 transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {/* Status Banners */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/80 text-rose-300 rounded-xl text-xs font-semibold leading-relaxed">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="p-3 bg-sky-950/40 border border-sky-500/30 text-sky-300 rounded-xl text-xs font-semibold leading-relaxed">
              {successMessage}
            </div>
          )}

          {currentUser ? (
            // ================= LOGGED IN PROFILE & CHANGE PASSWORD =================
            <div className="space-y-5">
              {/* Profile Sub-Tab Selector */}
              <div className="grid grid-cols-2 bg-[#080B15] p-1 rounded-xl border border-sky-500/10">
                <button
                  type="button"
                  onClick={() => {
                    setProfileTab('profile');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    profileTab === 'profile'
                      ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-zinc-950 shadow-md'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <User className="h-3.5 w-3.5" /> ข้อมูลโปรไฟล์
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileTab('change-password');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    profileTab === 'change-password'
                      ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-zinc-950 shadow-md'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <KeyRound className="h-3.5 w-3.5" /> เปลี่ยนรหัสผ่าน
                </button>
              </div>

              {profileTab === 'profile' ? (
                /* Profile Edit Form */
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {/* Avatar Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">เลือกรูปโปรไฟล์ของคุณ</label>
                    <div className="flex justify-between items-center bg-[#080B15]/60 p-3 rounded-xl border border-sky-500/10">
                      <img
                        src={selectedAvatar}
                        alt="Current profile avatar"
                        className="h-14 w-14 rounded-full border-2 border-sky-400/50 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex gap-2 items-center">
                        {PROFILE_AVATARS.map((avUrl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedAvatar(avUrl)}
                            className={`h-9 w-9 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                              selectedAvatar === avUrl ? 'border-sky-400 scale-105 shadow-md shadow-sky-500/20' : 'border-transparent hover:border-sky-500/30'
                            }`}
                          >
                            <img src={avUrl} alt="avatar option" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          </button>
                        ))}
                        
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="h-9 w-9 rounded-full bg-[#080B15] border border-dashed border-sky-500/30 flex items-center justify-center text-zinc-400 hover:text-sky-300 hover:border-sky-400 transition-all cursor-pointer hover:bg-[#11172A]"
                          title="อัปโหลดรูปภาพของคุณเอง"
                        >
                          <Upload className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Display Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">ชื่อแสดงผล (Display Name)</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="เช่น Lukin Trader"
                        className="w-full bg-[#080B15] border border-sky-500/15 focus:border-sky-400 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Email Read-only */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider">อีเมลบัญชี</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-600" />
                      <input
                        type="email"
                        disabled
                        value={currentUser.email}
                        className="w-full bg-[#080B15]/50 border border-sky-500/10 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Starting Capital */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">ต้นทุนเริ่มต้นพอร์ต ($ USD)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                      <input
                        type="number"
                        required
                        value={editCapital}
                        onChange={(e) => setEditCapital(Number(e.target.value))}
                        className="w-full bg-[#080B15] border border-sky-500/15 focus:border-sky-400 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-sky-500/10">
                    <button
                      type="button"
                      onClick={() => {
                        onLogout();
                        onClose();
                      }}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-950/20 hover:bg-rose-950/50 border border-rose-900/50 hover:border-rose-800 text-rose-400 text-xs font-bold transition-all cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      ออกจากระบบ
                    </button>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-[#080B15] hover:bg-[#11172A] text-zinc-400 border border-sky-500/10 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        ปิด
                      </button>
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 hover:from-sky-300 hover:to-blue-400 text-zinc-950 font-bold text-xs rounded-xl shadow shadow-sky-500/15 transition-all cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" />
                        บันทึกข้อมูล
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                /* Change Password Form inside profile modal */
                <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                  <div className="p-3 bg-sky-950/20 border border-sky-500/20 rounded-xl text-xs text-sky-300 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <KeyRound className="h-3.5 w-3.5" /> เปลี่ยนรหัสผ่านสำหรับ {currentUser.email}
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      กรอกรหัสผ่านใหม่ที่คุณต้องการใช้งาน (ความยาวอย่างน้อย 6 ตัวอักษร)
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">รหัสผ่านใหม่ (New Password)</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={changeNewPassword}
                        onChange={(e) => setChangeNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#080B15] border border-sky-500/15 focus:border-sky-400 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">ยืนยันรหัสผ่านใหม่ (Confirm Password)</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={changeConfirmPassword}
                        onChange={(e) => setChangeConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#080B15] border border-sky-500/15 focus:border-sky-400 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-sky-500/10">
                    <button
                      type="button"
                      onClick={() => setProfileTab('profile')}
                      className="px-4 py-2 bg-[#080B15] hover:bg-[#11172A] text-zinc-400 border border-sky-500/10 rounded-xl text-xs font-semibold"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-5 py-2 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 hover:from-sky-300 hover:to-blue-400 text-zinc-950 font-bold text-xs rounded-xl shadow shadow-sky-500/15 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? 'กำลังบันทึก...' : 'อัปเดตรหัสผ่านใหม่'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            // ================= LOG IN / REGISTER / FORGOT PASSWORD MODAL =================
            <div className="space-y-5">
              {isForgotPasswordMode ? (
                /* Forgot password flow inside modal */
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-sky-500/10 pb-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPasswordMode(false);
                        setForgotStep(1);
                        setErrorMessage('');
                        setSuccessMessage('');
                      }}
                      className="flex items-center gap-1.5 text-xs text-sky-400 font-semibold cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4" /> กลับสู่หน้าเข้าสู่ระบบ
                    </button>
                    <span className="text-[10px] font-mono text-zinc-500">ขั้นตอน {forgotStep}/3</span>
                  </div>

                  <div className="text-center">
                    <h3 className="font-bold text-sm text-zinc-100 flex items-center justify-center gap-1.5">
                      <KeyRound className="h-4 w-4 text-sky-400" /> ลืมรหัสผ่าน (กู้คืนด้วย OTP)
                    </h3>
                  </div>

                  {forgotStep === 1 && (
                    <form onSubmit={handleSendOTP} className="space-y-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-mono text-zinc-400">อีเมลที่ลงทะเบียนไว้</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                          <input
                            type="email"
                            required
                            value={otpEmail}
                            onChange={(e) => setOtpEmail(e.target.value)}
                            placeholder="trader@example.com"
                            className="w-full bg-[#080B15] border border-sky-500/15 focus:border-sky-400 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 focus:outline-none"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2.5 bg-gradient-to-r from-sky-400 to-blue-500 text-zinc-950 font-bold text-xs rounded-xl cursor-pointer"
                      >
                        {isLoading ? 'กำลังส่ง OTP...' : 'ส่งรหัส OTP ไปยังอีเมล'}
                      </button>
                    </form>
                  )}

                  {forgotStep === 2 && (
                    <form onSubmit={handleVerifyOTP} className="space-y-3">
                      {generatedOtp && (
                        <div className="p-3 bg-sky-950/60 border border-sky-500/30 rounded-xl text-xs space-y-1.5">
                          <p className="text-sky-300 font-bold flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" /> อีเมลจำลองส่ง OTP สำเร็จ!
                          </p>
                          <p className="text-zinc-300 text-[11px]">
                            รหัส OTP คือ: <span className="font-mono font-bold text-sky-300 bg-sky-500/20 px-2 py-0.5 rounded">{generatedOtp}</span>
                          </p>
                          <button
                            type="button"
                            onClick={() => setOtpCodeInput(generatedOtp)}
                            className="text-[10px] text-sky-400 hover:underline cursor-pointer"
                          >
                            ⚡ ใส่รหัส OTP {generatedOtp} อัตโนมัติ
                          </button>
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="block text-xs font-mono text-zinc-400">ป้อนรหัส OTP 6 หลัก</label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={otpCodeInput}
                          onChange={(e) => setOtpCodeInput(e.target.value)}
                          placeholder="123456"
                          className="w-full bg-[#080B15] border border-sky-500/15 focus:border-sky-400 rounded-xl px-3 py-2 text-center text-base font-mono font-bold text-sky-300 tracking-[0.4em] focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-gradient-to-r from-sky-400 to-blue-500 text-zinc-950 font-bold text-xs rounded-xl cursor-pointer"
                      >
                        ยืนยันรหัส OTP
                      </button>
                    </form>
                  )}

                  {forgotStep === 3 && (
                    <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-mono text-zinc-400">รหัสผ่านใหม่</label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          placeholder="อย่างน้อย 6 ตัวอักษร"
                          className="w-full bg-[#080B15] border border-sky-500/15 focus:border-sky-400 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-mono text-zinc-400">ยืนยันรหัสผ่านใหม่</label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={forgotConfirmPassword}
                          onChange={(e) => setForgotConfirmPassword(e.target.value)}
                          placeholder="ป้อนรหัสผ่านซ้ำอีกครั้ง"
                          className="w-full bg-[#080B15] border border-sky-500/15 focus:border-sky-400 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2.5 bg-gradient-to-r from-sky-400 to-blue-500 text-zinc-950 font-bold text-xs rounded-xl cursor-pointer"
                      >
                        {isLoading ? 'กำลังรีเซ็ต...' : 'บันทึกรหัสผ่านใหม่'}
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                /* Standard Login / Register form */
                <>
                  <button
                    type="button"
                    onClick={async () => {
                      setErrorMessage('');
                      setIsLoading(true);
                      try {
                        const guestEmail = `trader_${Math.random().toString(36).substring(2, 7)}@journal.io`;
                        const user = await dbService.registerUser(guestEmail, 'Trader Guest', 10000, 'password123');
                        setSuccessMessage('เข้าใช้งานในโหมด Guest สำเร็จ!');
                        setTimeout(() => {
                          onAuthSuccess(user);
                          onClose();
                        }, 600);
                      } catch (err: any) {
                        setErrorMessage('ไม่สามารถสร้างบัญชี Guest ได้');
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-sky-500 hover:from-emerald-300 hover:to-teal-400 text-zinc-950 font-bold text-xs rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    <span>เข้าใช้งานทันทีแบบ Guest (Guest Account)</span>
                  </button>

                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-sky-500/10"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-mono">
                      <span className="bg-[#0F0F12] px-2 text-zinc-500">หรือใช้บัญชีส่วนตัว (Username/Email & Password)</span>
                    </div>
                  </div>

                  {/* Tab Selector */}
                  <div className="flex bg-[#080B15] p-1 rounded-xl border border-sky-500/10">
                    <button
                      type="button"
                      onClick={() => {
                        setIsLoginTab(true);
                        setErrorMessage('');
                      }}
                      className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        isLoginTab ? 'bg-[#11172A] text-sky-300 border border-sky-500/20 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      เข้าสู่ระบบ
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsLoginTab(false);
                        setErrorMessage('');
                      }}
                      className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        !isLoginTab ? 'bg-[#11172A] text-sky-300 border border-sky-500/20 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      สมัครสมาชิกใหม่
                    </button>
                  </div>

                  <form onSubmit={handleAuthSubmit} className="space-y-3">
                    {/* Email Field */}
                    <div className="space-y-1">
                      <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">อีเมล (Email)</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="user@example.com"
                          className="w-full bg-[#080B15] border border-sky-500/15 focus:border-sky-400 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 focus:outline-none font-sans"
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">รหัสผ่าน (Password)</label>
                        {isLoginTab && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsForgotPasswordMode(true);
                              setOtpEmail(email);
                              setErrorMessage('');
                              setSuccessMessage('');
                            }}
                            className="text-[11px] font-mono text-sky-400 hover:underline cursor-pointer"
                          >
                            ลืมรหัสผ่าน?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-[#080B15] border border-sky-500/15 focus:border-sky-400 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 focus:outline-none font-sans"
                        />
                      </div>
                    </div>

                    {/* Additional fields for register */}
                    {!isLoginTab && (
                      <>
                        <div className="space-y-1">
                          <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">ชื่อแสดงผลของคุณ (Display Name)</label>
                          <div className="relative">
                            <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                            <input
                              type="text"
                              required
                              value={displayName}
                              onChange={(e) => setDisplayName(e.target.value)}
                              placeholder="เช่น Lukin Trader"
                              className="w-full bg-[#080B15] border border-sky-500/15 focus:border-sky-400 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 focus:outline-none font-sans"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">ต้นทุนเริ่มต้นพอร์ต ($ USD)</label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                            <input
                              type="number"
                              required
                              value={startingCapital}
                              onChange={(e) => setStartingCapital(Number(e.target.value))}
                              className="w-full bg-[#080B15] border border-sky-500/15 focus:border-sky-400 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 focus:outline-none font-mono"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 mt-2 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 hover:from-sky-300 hover:to-blue-400 text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <span>กำลังประมวลผล...</span>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          {isLoginTab ? 'เข้าสู่ระบบ' : 'ลงทะเบียนใช้งาน'}
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          )}

          {/* Drawer for Custom Firebase Config */}
          <div className="mt-4 pt-3 border-t border-sky-500/10">
            <button
              type="button"
              onClick={() => setIsConfigExpanded(!isConfigExpanded)}
              className="w-full flex items-center justify-between text-[11px] font-mono text-zinc-400 hover:text-sky-300 transition-colors"
            >
              <span className="flex items-center gap-1 font-bold uppercase tracking-wider">
                <Settings className="h-3 w-3 text-sky-400" /> การตั้งค่า Firebase Database
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
                  className="space-y-2 mt-3 overflow-hidden"
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
                      className="w-full bg-[#080B15] border border-sky-500/10 rounded-lg px-2 py-1 text-zinc-300 font-mono"
                    />
                    <input
                      type="text"
                      value={cfgProjectId}
                      onChange={(e) => setCfgProjectId(e.target.value)}
                      placeholder="PROJECT ID"
                      className="w-full bg-[#080B15] border border-sky-500/10 rounded-lg px-2 py-1 text-zinc-300 font-mono"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    {hasFirebaseConfig && (
                      <button
                        type="button"
                        onClick={handleClearConfig}
                        className="px-2 py-1 text-[10px] bg-rose-950/20 text-rose-400 border border-rose-900/40 rounded-lg hover:bg-rose-950/40"
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
        </div>
      </motion.div>
    </div>
  );
}
