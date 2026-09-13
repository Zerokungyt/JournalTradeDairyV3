import { LogOut, User, BarChart3, Calendar, TrendingUp, Wallet } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  user: UserProfile | null;
  activeTab: 'calendar' | 'dashboard';
  setActiveTab: (tab: 'calendar' | 'dashboard') => void;
  onOpenProfile: () => void;
  onOpenCashflow: () => void;
  onLogout: () => void;
  totalTrades: number;
  overallWinRate: number;
  netEquity?: number;
}

export default function Header({
  user,
  activeTab,
  setActiveTab,
  onOpenProfile,
  onOpenCashflow,
  onLogout,
  totalTrades,
  overallWinRate,
  netEquity,
}: HeaderProps) {
  return (
    <header className="border-b border-sky-500/10 bg-[#070A14]/90 backdrop-blur-md sticky top-0 z-40 px-4 py-3 shadow-lg shadow-sky-950/20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 p-[1px] shadow-lg shadow-sky-500/20 flex items-center justify-center">
            <div className="h-full w-full bg-[#0A0E1A] rounded-[11px] flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-sky-400" />
            </div>
          </div>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
              Journal<span className="text-sky-400 font-extrabold tracking-wide">DairyTrade</span>
            </h1>
            <p className="text-[10px] font-mono text-sky-400/60 tracking-wider uppercase">Luxury Quant Trading Suite</p>
          </div>
        </div>

        {/* Quick Stats Banner (For Luxury Touch) */}
        {user && (
          <div className="hidden lg:flex items-center gap-5 px-5 py-1.5 bg-[#0D1222] rounded-full border border-sky-500/15 text-xs font-mono shadow-inner">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">TRADES:</span>
              <span className="text-sky-400 font-bold">{totalTrades}</span>
            </div>
            <div className="h-3 w-[1px] bg-sky-900/40" />
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">WIN RATE:</span>
              <span className={`${overallWinRate >= 50 ? 'text-sky-400' : 'text-rose-400'} font-bold`}>
                {overallWinRate.toFixed(1)}%
              </span>
            </div>
            <div className="h-3 w-[1px] bg-sky-900/40" />
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">NET EQUITY:</span>
              <span className="text-emerald-400 font-bold">${(netEquity ?? user.startingCapital).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}

        {/* Navigation & Profile */}
        <div className="flex items-center gap-3">
          <nav className="flex items-center bg-[#0D1222] p-1 rounded-xl border border-sky-500/15 shadow-sm">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 cursor-pointer ${
                activeTab === 'calendar'
                  ? 'bg-sky-500/15 text-sky-300 border border-sky-400/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              ปฏิทินบันทึกเทรด
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-sky-500/15 text-sky-300 border border-sky-400/30 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              แดชบอร์ดสถิติ
            </button>
            {user && (
              <button
                onClick={onOpenCashflow}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all cursor-pointer ml-1"
                title="จัดการแผนบันทึกการฝาก-ถอนเงิน"
              >
                <Wallet className="h-3.5 w-3.5 text-emerald-400" />
                แผนฝาก-ถอน
              </button>
            )}
          </nav>

          {user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 text-left group cursor-pointer"
              >
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 rounded-full border border-sky-400/40 group-hover:border-sky-400 transition-colors object-cover shadow-sm"
                />
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold text-zinc-200 group-hover:text-sky-300 transition-colors leading-tight">
                    {user.displayName}
                  </p>
                  <p className="text-[9px] font-mono text-sky-400/70 leading-none">Trader Profile</p>
                </div>
              </button>
              <button
                onClick={onLogout}
                title="ออกจากระบบ"
                className="p-2 rounded-xl bg-[#0D1222] hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-sky-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-zinc-950 text-xs font-bold shadow-md shadow-sky-500/20 transition-all cursor-pointer"
            >
              <User className="h-3.5 w-3.5" />
              เข้าสู่ระบบ
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
