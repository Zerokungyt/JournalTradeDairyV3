import { BarChart3, Calendar, FlaskConical, Settings2, Wallet } from 'lucide-react';
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
  const tabClass = (tab: 'calendar' | 'dashboard') => `flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition md:flex-none ${activeTab === tab ? 'border border-cyan-300/30 bg-cyan-300/10 text-cyan-200' : 'border border-transparent text-zinc-400 hover:text-white'}`;

  return (
    <header className="sticky top-0 z-40 border-b border-cyan-400/10 bg-[#050810]/90 px-3 py-3 shadow-lg shadow-black/20 backdrop-blur-xl sm:px-5">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/20 bg-gradient-to-br from-cyan-300/15 to-blue-700/20 shadow-lg shadow-cyan-500/10">
            <FlaskConical className="h-5 w-5 text-cyan-300" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-tight text-zinc-100 sm:text-xl">Journal<span className="text-cyan-300">TradeDaily</span></h1>
            <p className="font-mono text-[9px] uppercase tracking-[.18em] text-cyan-400/60">Decision Intelligence · V3</p>
          </div>
        </div>

        <div className="hidden items-center gap-5 rounded-full border border-cyan-400/10 bg-[#0b1220] px-5 py-2 font-mono text-xs lg:flex">
          <span className="text-zinc-500">TRADES <b className="ml-1 text-zinc-200">{totalTrades}</b></span>
          <span className="text-zinc-500">WIN RATE <b className="ml-1 text-cyan-300">{overallWinRate.toFixed(1)}%</b></span>
          <span className="text-zinc-500">EQUITY <b className="ml-1 text-emerald-300">${(netEquity ?? user.startingCapital).toLocaleString('en-US', { maximumFractionDigits: 2 })}</b></span>
        </div>

        <button onClick={onOpenProfile} className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[.035] p-1.5 pr-2.5 text-left transition hover:border-cyan-300/25 hover:bg-cyan-300/5">
          {user.photoURL ? <img src={user.photoURL} alt={user.displayName} className="h-8 w-8 rounded-lg object-cover" /> : <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-300/10 font-bold text-cyan-200">{user.displayName.slice(0, 1).toUpperCase()}</span>}
          <span className="hidden sm:block"><b className="block max-w-28 truncate text-xs text-zinc-200">{user.displayName}</b><small className="block max-w-28 truncate text-[9px] text-cyan-400/70">{user.tradingPlan || 'Local profile'}</small></span>
          <Settings2 className="h-3.5 w-3.5 text-zinc-500" />
        </button>

        <div className="order-3 flex w-full items-center gap-2 md:order-none md:w-auto">
          <nav className="flex min-w-0 flex-1 items-center rounded-xl border border-white/8 bg-[#0b1220] p-1 md:flex-none">
            <button onClick={() => setActiveTab('calendar')} className={tabClass('calendar')}><Calendar className="h-3.5 w-3.5" /> Journal</button>
            <button onClick={() => setActiveTab('dashboard')} className={tabClass('dashboard')}><BarChart3 className="h-3.5 w-3.5" /> Analytics</button>
          </nav>
          <button onClick={onOpenCashflow} aria-label="จัดการเงินฝากถอน" className="rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-2.5 text-emerald-300 transition hover:bg-emerald-400/10"><Wallet className="h-4 w-4" /></button>
        </div>
      </div>
    </header>
  );
}
