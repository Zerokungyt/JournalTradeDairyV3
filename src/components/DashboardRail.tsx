import { BarChart3, BookOpen, ChevronLeft, Database, Settings2, UserRound, Wallet } from 'lucide-react';
import { UserProfile } from '../types';
import NavigationSettings, { NavigationPosition } from './NavigationSettings';

interface DashboardRailProps {
  user: UserProfile;
  activeTab: 'calendar' | 'dashboard';
  setActiveTab: (tab: 'calendar' | 'dashboard') => void;
  onOpenProfile: () => void;
  onOpenCashflow: () => void;
  totalTrades: number;
  overallWinRate: number;
  netEquity: number;
  collapsed: boolean;
  navigationPosition: NavigationPosition;
  onCollapsedChange: (collapsed: boolean) => void;
  onNavigationPositionChange: (position: NavigationPosition) => void;
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
  collapsed,
  navigationPosition,
  onCollapsedChange,
  onNavigationPositionChange,
}: DashboardRailProps) {
  const navClass = (tab: 'calendar' | 'dashboard') =>
    `group flex w-full items-center border-l py-3 text-left transition-all duration-300 ${collapsed ? 'justify-center px-2' : 'justify-between px-4'} ${
      activeTab === tab
        ? 'border-[#c7a76a] bg-[#c7a76a]/[.07] text-stone-100'
        : 'border-transparent text-stone-500 hover:border-white/15 hover:text-stone-200'
    }`;

  return (
    <aside className="sticky top-5 hidden h-[calc(100vh-2.5rem)] min-h-[620px] flex-col border border-white/10 bg-[#0d0d0b]/95 transition-[width] duration-300 lg:flex">
      <div className={`border-b border-white/10 transition-all duration-300 ${collapsed ? 'px-2 py-4' : 'px-5 py-5'}`}>
        <div className={`flex items-center ${collapsed ? 'flex-col gap-3' : 'justify-between gap-3'}`}>
          <div className="flex items-baseline text-[#d9bc82]" aria-label="JTD edition 03">
          <span className="text-xl font-semibold tracking-[-.08em]">JTD</span>
            <span className={`ml-1 overflow-hidden font-mono text-[8px] tracking-[.08em] text-stone-500 transition-all duration-300 ${collapsed ? 'max-w-0 opacity-0' : 'max-w-8 opacity-100'}`}>03</span>
          </div>
          <div className={`flex items-center gap-1.5 ${collapsed ? 'flex-col' : ''}`}>
            <NavigationSettings
              position={navigationPosition}
              collapsed={collapsed}
              onPositionChange={onNavigationPositionChange}
              onCollapsedChange={onCollapsedChange}
              align="left"
            />
            <button
              type="button"
              onClick={() => onCollapsedChange(!collapsed)}
              className="grid h-9 w-9 place-items-center border border-white/10 text-stone-500 transition hover:border-[#c7a76a]/50 hover:text-[#d9bc82]"
              aria-label={collapsed ? 'ขยายแถบเมนู' : 'ย่อแถบเมนู'}
              title={collapsed ? 'ขยายแถบเมนู' : 'ย่อแถบเมนู'}
            >
              <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : 'rotate-0'}`} />
            </button>
          </div>
        </div>
        <div className={`overflow-hidden transition-all duration-300 ${collapsed ? 'max-h-0 opacity-0' : 'max-h-16 opacity-100'}`}>
          <h1 className="mt-2 whitespace-nowrap text-sm font-medium text-stone-100">Journal Trade Daily</h1>
          <p className="mt-1 whitespace-nowrap font-mono text-[8px] uppercase tracking-[.18em] text-stone-600">Private research workspace</p>
        </div>
      </div>

      <nav className="space-y-1 px-2 py-4" aria-label="เมนูหลัก">
        <button type="button" onClick={() => setActiveTab('calendar')} className={navClass('calendar')} title={collapsed ? 'Journal' : undefined}>
          <span className="flex items-center gap-3 text-xs font-medium"><BookOpen className="h-4 w-4 shrink-0" /> <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${collapsed ? 'max-w-0 opacity-0' : 'max-w-28 opacity-100'}`}>Journal</span></span>
          <span className={`overflow-hidden font-mono text-[9px] text-stone-600 transition-all duration-300 ${collapsed ? 'max-w-0 opacity-0' : 'max-w-8 opacity-100'}`}>01</span>
        </button>
        <button type="button" onClick={() => setActiveTab('dashboard')} className={navClass('dashboard')} title={collapsed ? 'Analysis' : undefined}>
          <span className="flex items-center gap-3 text-xs font-medium"><BarChart3 className="h-4 w-4 shrink-0" /> <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${collapsed ? 'max-w-0 opacity-0' : 'max-w-28 opacity-100'}`}>Analysis</span></span>
          <span className={`overflow-hidden font-mono text-[9px] text-stone-600 transition-all duration-300 ${collapsed ? 'max-w-0 opacity-0' : 'max-w-8 opacity-100'}`}>02</span>
        </button>
        <button type="button" onClick={onOpenCashflow} className={`group flex w-full items-center border-l border-transparent py-3 text-left text-stone-500 transition-all duration-300 hover:border-white/15 hover:text-stone-200 ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`} title={collapsed ? 'Capital ledger' : undefined}>
          <span className="flex items-center gap-3 text-xs font-medium"><Wallet className="h-4 w-4 shrink-0" /> <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${collapsed ? 'max-w-0 opacity-0' : 'max-w-28 opacity-100'}`}>Capital ledger</span></span>
          <span className={`overflow-hidden font-mono text-[9px] text-stone-600 transition-all duration-300 ${collapsed ? 'max-w-0 opacity-0' : 'max-w-8 opacity-100'}`}>03</span>
        </button>
      </nav>

      <div className={`grid grid-cols-1 divide-y divide-white/10 border-y border-white/10 font-mono text-[9px] transition-all duration-300 ${collapsed ? 'mx-2 text-center' : 'mx-5'}`}>
        <div className={`py-3 ${collapsed ? 'block' : 'flex items-center justify-between'}`} title={`Entries ${totalTrades}`}><span className={`text-stone-600 ${collapsed ? 'block text-[7px]' : ''}`}>{collapsed ? 'TRD' : 'ENTRIES'}</span><b className="font-medium text-stone-300">{totalTrades}</b></div>
        <div className={`py-3 ${collapsed ? 'block' : 'flex items-center justify-between'}`} title={`Win rate ${overallWinRate.toFixed(1)}%`}><span className={`text-stone-600 ${collapsed ? 'block text-[7px]' : ''}`}>{collapsed ? 'WR' : 'WIN RATE'}</span><b className="font-medium text-[#d9bc82]">{overallWinRate.toFixed(collapsed ? 0 : 1)}%</b></div>
        <div className={`py-3 ${collapsed ? 'block' : 'flex items-center justify-between'}`} title={`Equity $${netEquity.toLocaleString('en-US')}`}><span className={`text-stone-600 ${collapsed ? 'block text-[7px]' : ''}`}>{collapsed ? 'EQ' : 'EQUITY'}</span><b className={`font-medium text-emerald-300 ${collapsed ? 'text-[8px]' : ''}`}>{collapsed ? `$${Math.round(netEquity / 1000)}k` : `$${netEquity.toLocaleString('en-US', { maximumFractionDigits: 2 })}`}</b></div>
      </div>

      <div className="mt-auto">
        <div className={`mb-4 flex items-center font-mono text-[8px] uppercase tracking-[.12em] text-stone-600 ${collapsed ? 'mx-2 justify-center' : 'mx-5 gap-2'}`} title="Local archive · Ready">
          <Database className="h-3 w-3 shrink-0 text-[#bda778]" /> <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${collapsed ? 'max-w-0 opacity-0' : 'max-w-36 opacity-100'}`}>Local archive · Ready</span>
        </div>
        <button type="button" onClick={onOpenProfile} className={`group flex w-full items-center border-t border-white/10 bg-white/[.018] text-left transition-all duration-300 hover:bg-white/[.035] ${collapsed ? 'justify-center p-3' : 'gap-3 p-4'}`} title={collapsed ? `${user.displayName} · เปิดโปรไฟล์` : undefined}>
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName} className={`shrink-0 rounded-full border border-white/15 object-cover grayscale-[15%] transition-all duration-300 group-hover:border-[#c7a76a]/60 group-hover:grayscale-0 ${collapsed ? 'h-10 w-10' : 'h-12 w-12'}`} />
          ) : (
            <span className={`grid shrink-0 place-items-center rounded-full border border-stone-300 bg-stone-100 text-stone-700 transition-all duration-300 ${collapsed ? 'h-10 w-10' : 'h-12 w-12'}`} aria-label="ยังไม่ได้ตั้งรูปโปรไฟล์">
              <UserRound className="h-6 w-6 fill-stone-700 stroke-stone-700" />
            </span>
          )}
          <span className={`min-w-0 flex-1 overflow-hidden whitespace-nowrap transition-all duration-300 ${collapsed ? 'max-w-0 opacity-0' : 'max-w-40 opacity-100'}`}>
            <b className="block truncate text-sm font-medium text-stone-100">{user.displayName}</b>
            <small className="mt-1 block truncate font-mono text-[8px] uppercase tracking-[.12em] text-[#bda778]">{user.tradingPlan || 'Personal Playbook'}</small>
          </span>
          <Settings2 className={`h-4 w-4 shrink-0 text-stone-600 transition-all duration-300 group-hover:text-[#c7a76a] ${collapsed ? 'w-0 opacity-0' : 'opacity-100'}`} />
        </button>
      </div>
    </aside>
  );
}
