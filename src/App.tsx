import { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import CalendarView from './components/CalendarView';
import DashboardView from './components/DashboardView';
import TradeFormModal from './components/TradeFormModal';
import AuthProfileModal from './components/AuthProfileModal';
import CashflowModal from './components/CashflowModal';
import { dbService } from './lib/db';
import { Trade, UserProfile } from './types';
import { Clock, Database } from 'lucide-react';


export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => dbService.getCurrentUser());
  const [trades, setTrades] = useState<Trade[]>([]);
  const [cashflows, setCashflows] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'calendar' | 'dashboard'>('calendar');

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isCashflowModalOpen, setIsCashflowModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  const [activeTrade, setActiveTrade] = useState<Trade | null>(null);

  // Realtime clock state
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Reload helpers
  const reloadData = (userId: string) => {
    setTrades(dbService.getTrades(userId));
    setCashflows(dbService.getCashflows(userId));
  };

  // Local-first: migrate existing V2.5 data and open directly into the workspace.
  useEffect(() => {
    const user = dbService.getCurrentUser();
    setCurrentUser(user);
    reloadData(user.uid);
  }, []);


  // Trade actions
  const handleSaveTrade = (tradeData: Omit<Trade, 'id' | 'createdAt'> & { id?: string }) => {
    const activeUser = currentUser;
    tradeData.userId = activeUser.uid;
    dbService.addTrade(tradeData);
    if (tradeData.date) {
      setSelectedDate(tradeData.date);
    }
    reloadData(activeUser.uid);
  };

  const handleDeleteTrade = (tradeId: string) => {
    dbService.deleteTrade(tradeId);
    reloadData(currentUser.uid);
  };

  const handleUpdateCapital = (capital: number) => {
    dbService.updateStartingCapital(currentUser.uid, capital);
    // Reload user profile
    const updated = dbService.getCurrentUser();
    if (updated) {
      setCurrentUser(updated);
    }
  };

  // Open Add Trade Modal
  const handleAddTradeForDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setActiveTrade(null);
    setIsTradeModalOpen(true);
  };

  // Open View Trade Modal
  const handleViewTrade = (trade: Trade) => {
    setSelectedDate(trade.date);
    setActiveTrade(trade);
    setIsTradeModalOpen(true);
  };

  // Header quick metrics calculations
  const headerStats = useMemo(() => {
    const total = trades.length;
    if (total === 0) return { count: 0, winRate: 0 };
    const wins = trades.filter((t) => t.profitLoss > 0).length;
    return {
      count: total,
      winRate: (wins / total) * 100,
    };
  }, [trades]);

  // Net Equity calculation (Starting Capital + Total Trade PnL + Net Cashflows)
  const netEquity = useMemo(() => {
    const totalTradePnL = trades.reduce((sum, t) => sum + t.profitLoss, 0);
    const netCashflow = cashflows.reduce((sum, c) => sum + (c.type === 'deposit' ? c.amount : -c.amount), 0);
    return currentUser.startingCapital + totalTradePnL + netCashflow;
  }, [currentUser, trades, cashflows]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-transparent font-sans text-stone-100 selection:bg-[#c7a76a] selection:text-stone-950">
      {/* Main App Header */}
      <Header
        user={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProfile={() => setIsAuthModalOpen(true)}
        onOpenCashflow={() => setIsCashflowModalOpen(true)}
        totalTrades={headerStats.count}
        overallWinRate={headerStats.winRate}
        netEquity={netEquity}
      />

      {/* Main Container Content */}
      <main className="z-10 mx-auto w-full max-w-[1440px] flex-1 space-y-7 px-3 py-6 sm:px-7 sm:py-10">
        <section className="grid border-b border-white/10 pb-7 lg:grid-cols-[1fr_420px] lg:items-end lg:gap-16 lg:pb-10">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="editorial-kicker">Private journal / {now.getFullYear()}</span>
              <span className="h-px w-10 bg-[#c7a76a]/40" />
              <span className="font-mono text-[9px] uppercase tracking-[.16em] text-stone-600">{activeTab === 'calendar' ? 'Entry index' : 'Research summary'}</span>
            </div>
            <h2 className="max-w-3xl font-display text-[clamp(2.7rem,7vw,6.2rem)] font-normal leading-[.82] tracking-[-.055em] text-[#efede7]">
              Process is the <span className="italic text-[#c7a76a]">edge.</span>
            </h2>
          </div>
          <div className="mt-7 border-l border-[#c7a76a]/35 pl-5 lg:mt-0">
            <p className="editorial-kicker">Review framework</p>
            <p className="mt-3 max-w-md text-sm leading-6 text-stone-400">
              {currentUser.bio || 'บันทึกสมมติฐาน ตรวจสอบกระบวนการ และปล่อยให้ข้อมูลเป็นผู้ตัดสินผลลัพธ์'}
            </p>
            <div className="mt-5 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.1em] text-stone-600">
              <Clock className="h-3 w-3 text-[#c7a76a]" />
              Bangkok · {now.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })} · {now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </section>

        {/* Tab Sections */}
        <div>
          {activeTab === 'calendar' ? (
            <CalendarView
              trades={trades}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onViewTrade={handleViewTrade}
              onAddTradeForDate={handleAddTradeForDate}
              onDeleteTrade={handleDeleteTrade}
            />
          ) : (
            <DashboardView
              user={currentUser}
              trades={trades}
              cashflows={cashflows}
              onUpdateCapital={handleUpdateCapital}
            />
          )}
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="border-t border-white/10 px-4 py-7 font-mono text-[9px] uppercase tracking-[.16em] text-stone-600">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 sm:flex-row">
          <p>Journal Trade Daily · Edition 03 · 2026</p>
          <div className="flex items-center gap-5">
            <span>Designed for deliberate review</span>
            <span className="flex items-center gap-1.5 text-[#bda778]"><Database className="h-3 w-3" /> Local archive</span>
          </div>
        </div>
      </footer>

      {/* Modals Container */}
      {currentUser && (
        <TradeFormModal
          isOpen={isTradeModalOpen}
          onClose={() => setIsTradeModalOpen(false)}
          onSave={handleSaveTrade}
          onDelete={handleDeleteTrade}
          selectedDate={selectedDate}
          userId={currentUser.uid}
          activeTrade={activeTrade}
        />
      )}

      <AuthProfileModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onProfileChange={setCurrentUser}
        onDataRestore={() => reloadData(currentUser.uid)}
      />

      {currentUser && (
        <CashflowModal
          isOpen={isCashflowModalOpen}
          onClose={() => setIsCashflowModalOpen(false)}
          userId={currentUser.uid}
          cashflows={cashflows}
          onCashflowChange={() => reloadData(currentUser.uid)}
        />
      )}
    </div>
  );
}
