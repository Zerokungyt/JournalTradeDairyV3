import { BarChart3, BookOpen, Database, Settings2, UserRound, Wallet } from 'lucide-react';
import { UserProfile } from '../types';

interface DashboardRailProps {
  user: UserProfile;
  activeTab: 'calendar' | 'dashboard';
  setActiveTab: (tab: 'calendar' | 'dashboard') => void;
  onOpenProfile: () => void;
  onOpenCashflow: () => void;
  totalTrades: number;
  overallWinRate: number;
  netEquity: number;
}

export default function DashboardRail({
  user,
  activeTab,
  setActiveTab,
  onOpenProfile,
  onOpenCashflow,
  totalTrades,
  overallWinRate,
  netEquity,
}: DashboardRailProps) {
  const navClass = (tab: 'calendar' | 'dashboard') =>
    `group flex w-full items-center justify-between border-l px-4 py-3 text-left transition ${
      activeTab === tab
        ? 'border-[#c7a76a] bg-[#c7a76a]/[.07] text-stone-100'
        : 'border-transparent text-stone-500 hover:border-white/15 hover:text-stone-200'
    }`;

  return (
    <aside className="sticky top-5 hidden h-[calc(100vh-2.5rem)] min-h-[620px] flex-col border border-white/10 bg-[#0d0d0b]/95 lg:flex">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-baseline text-[#d9bc82]" aria-label="JTD edition 03">
          <span className="text-xl font-semibold tracking-[-.08em]">JTD</span>
          <span className="ml-1 font-mono text-[8px] tracking-[.08em] text-stone-500">03</span>
        </div>
        <h1 className="mt-2 text-sm font-medium text-stone-100">Journal Trade Daily</h1>
        <p className="mt-1 font-mono text-[8px] uppercase tracking-[.18em] text-stone-600">Private research workspace</p>
      </div>

      <nav className="space-y-1 px-2 py-4" aria-label="เมนูหลัก">
        <button type="button" onClick={() => setActiveTab('calendar')} className={navClass('calendar')}>
          <span className="flex items-center gap-3 text-xs font-medium"><BookOpen className="h-4 w-4" /> Journal</span>
          <span className="font-mono text-[9px] text-stone-600">01</span>
        </button>
        <button type="button" onClick={() => setActiveTab('dashboard')} className={navClass('dashboard')}>
          <span className="flex items-center gap-3 text-xs font-medium"><BarChart3 className="h-4 w-4" /> Analysis</span>
          <span className="font-mono text-[9px] text-stone-600">02</span>
        </button>
        <button type="button" onClick={onOpenCashflow} className="group flex w-full items-center justify-between border-l border-transparent px-4 py-3 text-left text-stone-500 transition hover:border-white/15 hover:text-stone-200">
          <span className="flex items-center gap-3 text-xs font-medium"><Wallet className="h-4 w-4" /> Capital ledger</span>
          <span className="font-mono text-[9px] text-stone-600">03</span>
        </button>
      </nav>

      <div className="mx-5 grid grid-cols-1 divide-y divide-white/10 border-y border-white/10 font-mono text-[9px]">
        <div className="flex items-center justify-between py-3"><span className="text-stone-600">ENTRIES</span><b className="font-medium text-stone-300">{totalTrades}</b></div>
        <div className="flex items-center justify-between py-3"><span className="text-stone-600">WIN RATE</span><b className="font-medium text-[#d9bc82]">{overallWinRate.toFixed(1)}%</b></div>
        <div className="flex items-center justify-between py-3"><span className="text-stone-600">EQUITY</span><b className="font-medium text-emerald-300">${netEquity.toLocaleString('en-US', { maximumFractionDigits: 2 })}</b></div>
      </div>

      <div className="mt-auto">
        <div className="mx-5 mb-4 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[.12em] text-stone-600">
          <Database className="h-3 w-3 text-[#bda778]" /> Local archive · Ready
        </div>
        <button type="button" onClick={onOpenProfile} className="group flex w-full items-center gap-3 border-t border-white/10 bg-white/[.018] p-4 text-left transition hover:bg-white/[.035]">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName} className="h-12 w-12 shrink-0 rounded-full border border-white/15 object-cover grayscale-[15%] transition group-hover:border-[#c7a76a]/60 group-hover:grayscale-0" />
          ) : (
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-stone-300 bg-stone-100 text-stone-700" aria-label="ยังไม่ได้ตั้งรูปโปรไฟล์">
              <UserRound className="h-6 w-6 fill-stone-700 stroke-stone-700" />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <b className="block truncate text-sm font-medium text-stone-100">{user.displayName}</b>
            <small className="mt-1 block truncate font-mono text-[8px] uppercase tracking-[.12em] text-[#bda778]">{user.tradingPlan || 'Personal Playbook'}</small>
          </span>
          <Settings2 className="h-4 w-4 text-stone-600 transition group-hover:text-[#c7a76a]" />
        </button>
      </div>
    </aside>
  );
}
