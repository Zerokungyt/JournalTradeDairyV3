import { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import CalendarView from './components/CalendarView';
import DashboardView from './components/DashboardView';
import TradeFormModal from './components/TradeFormModal';
import AuthProfileModal from './components/AuthProfileModal';
import CashflowModal from './components/CashflowModal';
import { dbService } from './lib/db';
import { Trade, UserProfile } from './types';
import { Clock, Database, Sparkles } from 'lucide-react';


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
    <div className="min-h-screen bg-[#050810] text-zinc-100 font-sans flex flex-col selection:bg-cyan-500/30 selection:text-cyan-100 relative overflow-hidden">
      {/* Decorative Elegant Emerald / Ambient glows in the background */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />

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
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-5 py-5 sm:py-8 z-10 space-y-6 sm:space-y-8">
        {/* Quote / Motivational Banner (Fosters Trading Discipline) */}
        <div className="bg-gradient-to-r from-[#0b1220] to-[#090d17] border border-cyan-400/10 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="flex gap-4 items-start">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-zinc-200">
                {currentUser.tradingPlan || 'Alchemist'} Intelligence Desk
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed mt-1">
                {currentUser.bio || 'บันทึกกระบวนการ วัดผลด้วยข้อมูล และทบทวนการตัดสินใจอย่างเป็นระบบ'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 bg-[#0A0A0C]/60 border border-white/5 px-3.5 py-1.5 rounded-xl text-[10px] font-mono text-zinc-400">
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            <span>
              LOCAL TIME: {now.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} {now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>

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
      <footer className="border-t border-white/5 py-6 px-4 bg-[#0A0A0C] text-center text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 JournalTradeDaily V3 · Local-first research journal</p>
          <div className="flex gap-4">
            <span className="flex items-center gap-1 text-cyan-400"><Database className="h-3 w-3" /> Data stays on device</span>
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
