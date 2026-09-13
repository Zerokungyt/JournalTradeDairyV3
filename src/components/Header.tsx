import { BarChart3, BookOpen, Settings2, UserRound, Wallet } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  user: UserProfile;
  activeTab: 'calendar' | 'dashboard';
  setActiveTab: (tab: 'calendar' | 'dashboard') => void;
  onOpenProfile: () => void;
  onOpenCashflow: () => void;
  totalTrades: number;
  overallWinRate: number;
  netEquity?: number;
}

export default function Header({ user, activeTab, setActiveTab, onOpenProfile, onOpenCashflow, totalTrades, overallWinRate, netEquity }: HeaderProps) {
  const tabClass = (tab: 'calendar' | 'dashboard') => `relative flex flex-1 items-center justify-center gap-2 px-4 py-3 text-[11px] font-medium uppercase tracking-[.12em] transition md:flex-none ${activeTab === tab ? 'text-[#d9bc82] after:absolute after:inset-x-4 after:bottom-0 after:h-px after:bg-[#c7a76a]' : 'text-stone-500 hover:text-stone-200'}`;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a09]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3 sm:px-7">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="flex shrink-0 items-baseline border-r border-[#c7a76a]/40 pr-3.5 text-[#d9bc82]" aria-label="JTD edition 03">
            <span className="text-lg font-semibold tracking-[-.08em]">JTD</span>
            <span className="ml-1 font-mono text-[7px] tracking-[.08em] text-stone-500">03</span>
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-medium tracking-[-.02em] text-stone-100 sm:text-base">Journal Trade Daily</h1>
            <p className="font-mono text-[8px] uppercase tracking-[.22em] text-stone-500">Independent trade journal · Est. 2026</p>
          </div>
        </div>

        <div className="hidden items-center divide-x divide-white/10 border-x border-white/10 font-mono text-[10px] lg:flex">
          <span className="px-5 text-stone-500">ENTRIES <b className="ml-2 font-medium text-stone-200">{totalTrades}</b></span>
          <span className="px-5 text-stone-500">WIN RATE <b className="ml-2 font-medium text-[#d9bc82]">{overallWinRate.toFixed(1)}%</b></span>
          <span className="px-5 text-stone-500">EQUITY <b className="ml-2 font-medium text-emerald-300">${(netEquity ?? user.startingCapital).toLocaleString('en-US', { maximumFractionDigits: 2 })}</b></span>
        </div>

        <button onClick={onOpenProfile} className="group flex items-center gap-2.5 text-left">
          <span className="hidden sm:block"><b className="block max-w-32 truncate text-xs font-medium text-stone-200">{user.displayName}</b><small className="block max-w-32 truncate font-mono text-[8px] uppercase tracking-[.12em] text-stone-500">Private workspace</small></span>
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName} className="h-9 w-9 rounded-full border border-white/15 object-cover grayscale-[20%] transition group-hover:border-[#c7a76a]/60 group-hover:grayscale-0" />
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-full border border-stone-300 bg-stone-100 text-stone-700 transition group-hover:border-white group-hover:bg-white" aria-label="ยังไม่ได้ตั้งรูปโปรไฟล์">
              <UserRound className="h-5 w-5 fill-stone-700 stroke-stone-700" />
            </span>
          )}
          <Settings2 className="h-3.5 w-3.5 text-stone-600 transition group-hover:text-[#c7a76a]" />
        </button>
      </div>

      <div className="border-t border-white/[.06]">
        <div className="mx-auto flex max-w-[1440px] items-stretch justify-between px-2 sm:px-7">
          <nav className="flex min-w-0 flex-1 items-center md:flex-none">
            <button onClick={() => setActiveTab('calendar')} className={tabClass('calendar')}><BookOpen className="h-3.5 w-3.5" /> Journal</button>
            <button onClick={() => setActiveTab('dashboard')} className={tabClass('dashboard')}><BarChart3 className="h-3.5 w-3.5" /> Analysis</button>
          </nav>
          <button onClick={onOpenCashflow} className="flex items-center gap-2 border-l border-white/10 px-4 font-mono text-[9px] uppercase tracking-[.14em] text-stone-500 transition hover:text-[#d9bc82]">
            <Wallet className="h-3.5 w-3.5" /><span className="hidden sm:inline">Capital ledger</span>
          </button>
        </div>
      </div>
    </header>
  );
}
