import { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Eye, 
  TrendingUp, 
  AlertCircle,
  Calendar,
  Trash2,
  Edit3,
  PlusCircle
} from 'lucide-react';
import { Trade, TradeEmotion } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface CalendarViewProps {
  trades: Trade[];
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  onViewTrade: (trade: Trade) => void;
  onAddTradeForDate: (dateStr: string) => void;
  onDeleteTrade: (tradeId: string) => void;
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export default function CalendarView({
  trades,
  selectedDate,
  onSelectDate,
  onViewTrade,
  onAddTradeForDate,
  onDeleteTrade,
}: CalendarViewProps) {
  // Dynamic current date
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [deletingTradeId, setDeletingTradeId] = useState<string | null>(null);

  // Navigate months
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  // Group trades by date
  const tradesByDate = useMemo(() => {
    const map: Record<string, Trade[]> = {};
    trades.forEach((trade) => {
      if (!map[trade.date]) {
        map[trade.date] = [];
      }
      map[trade.date].push(trade);
    });
    return map;
  }, [trades]);

  // Calendar calculations
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  // Create array of calendar day cells
  const calendarDays = useMemo(() => {
    const days: ({ dateStr: string; dayNum: number; isCurrentMonth: boolean } | null)[] = [];

    // Empty spots for previous month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${currentYear}-${monthStr}-${dayStr}`;

      days.push({
        dateStr,
        dayNum: day,
        isCurrentMonth: true,
      });
    }

    return days;
  }, [currentYear, currentMonth, daysInMonth, firstDayIndex]);

  // Stats for the current active month
  const monthStats = useMemo(() => {
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const monthlyTrades = trades.filter((t) => t.date.startsWith(monthPrefix));

    const totalPnL = monthlyTrades.reduce((sum, t) => sum + t.profitLoss, 0);
    const winTrades = monthlyTrades.filter((t) => t.profitLoss > 0).length;
    const lossTrades = monthlyTrades.filter((t) => t.profitLoss < 0).length;
    const winRate = monthlyTrades.length > 0 ? (winTrades / monthlyTrades.length) * 100 : 0;

    return {
      totalPnL,
      winRate,
      count: monthlyTrades.length,
      wins: winTrades,
      losses: lossTrades,
    };
  }, [trades, currentYear, currentMonth]);

  // Emotion color mapper
  const getEmotionEmoji = (emotion: TradeEmotion) => {
    switch (emotion) {
      case 'fear': return '😨';
      case 'overconfident': return '😎';
      case 'calm': return '🧘';
      case 'greedy': return '🤑';
      case 'patient': return '⏳';
      default: return '😐';
    }
  };

  const getEmotionThai = (emotion: TradeEmotion) => {
    switch (emotion) {
      case 'fear': return 'กลัว';
      case 'overconfident': return 'มั่นใจเกิน';
      case 'calm': return 'สงบ';
      case 'greedy': return 'โลภ';
      case 'patient': return 'ใจเย็น';
      default: return 'อื่น ๆ';
    }
  };

  // Helper to format date into Thai readable format
  const formatThaiDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      const year = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return `${day} ${THAI_MONTHS[monthIdx]} ${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Selected date trades
  const selectedDateTrades = useMemo(() => {
    return trades.filter((t) => t.date === selectedDate).sort((a, b) => b.createdAt - a.createdAt);
  }, [trades, selectedDate]);

  const selectedDayPnL = useMemo(() => {
    return selectedDateTrades.reduce((sum, t) => sum + t.profitLoss, 0);
  }, [selectedDateTrades]);

  return (
    <div id="calendar-section" className="space-y-6">
      {/* 2-Column Responsive Layout: Calendar Grid (8 cols) and Daily Trade Menu (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Calendar Grid */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#0D1222] p-5 rounded-2xl border border-sky-500/15 shadow-2xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={prevMonth}
                  className="p-2 rounded-xl bg-[#080B15] hover:bg-[#11172A] text-zinc-400 hover:text-sky-300 border border-sky-500/10 transition-all cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <h2 className="font-display text-lg md:text-xl font-bold text-zinc-100 min-w-[160px] text-center">
                  {THAI_MONTHS[currentMonth]} {currentYear}
                </h2>
                <button
                  onClick={nextMonth}
                  className="p-2 rounded-xl bg-[#080B15] hover:bg-[#11172A] text-zinc-400 hover:text-sky-300 border border-sky-500/10 transition-all cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* High-Fidelity Mini Stats Panel */}
              <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
                <div className="bg-[#080B15]/80 p-3 rounded-xl border border-sky-500/10 text-center min-w-[110px]">
                  <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">เทรดในเดือน</p>
                  <p className="text-sm font-semibold text-zinc-200 mt-1">{monthStats.count} ครั้ง</p>
                </div>
                <div className="bg-[#080B15]/80 p-3 rounded-xl border border-sky-500/10 text-center min-w-[110px]">
                  <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                    {monthStats.totalPnL >= 0 ? 'กำไรสุทธิ' : 'ขาดทุนสุทธิ'}
                  </p>
                  <p className={`text-sm font-bold mt-1 ${monthStats.totalPnL >= 0 ? 'text-sky-400 neon-blue-glow' : 'text-rose-400 neon-red-glow'}`}>
                    {monthStats.totalPnL >= 0 ? '+' : '-'}${Math.abs(monthStats.totalPnL).toLocaleString('en-US', { minimumFractionDigits: monthStats.totalPnL % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-[#080B15]/80 p-3 rounded-xl border border-sky-500/10 text-center min-w-[110px]">
                  <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">อัตราการชนะ (Winrate)</p>
                  <p className="text-sm font-bold text-sky-400 mt-1">
                    {monthStats.winRate.toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map((dayName, idx) => (
                <div
                  key={idx}
                  className={`text-center font-display text-xs font-semibold py-1.5 ${
                    idx === 0 ? 'text-rose-400' : idx === 6 ? 'text-sky-400' : 'text-zinc-400'
                  }`}
                >
                  {dayName}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {calendarDays.map((cell, idx) => {
                if (!cell) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="aspect-square bg-[#080B15]/30 rounded-xl border border-transparent"
                    />
                  );
                }

                const dayTrades = tradesByDate[cell.dateStr] || [];
                const dayPnL = dayTrades.reduce((sum, t) => sum + t.profitLoss, 0);
                const isSelected = cell.dateStr === selectedDate;

                const formattedPnL = Math.abs(dayPnL) >= 1000000
                  ? `${dayPnL >= 0 ? '+' : ''}$${(dayPnL / 1000000).toFixed(1)}M`
                  : Math.abs(dayPnL) >= 100000
                  ? `${dayPnL >= 0 ? '+' : ''}$${(dayPnL / 1000).toFixed(0)}k`
                  : `${dayPnL >= 0 ? '+' : ''}$${dayPnL.toLocaleString('en-US', { minimumFractionDigits: dayPnL % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 })}`;

                return (
                  <div
                    key={cell.dateStr}
                    onClick={() => onSelectDate(cell.dateStr)}
                    className={`group relative rounded-xl border transition-all duration-300 flex flex-col p-2 sm:p-3 min-h-[125px] sm:min-h-[140px] md:min-h-[155px] overflow-hidden justify-between cursor-pointer ${
                      isSelected
                        ? 'border-sky-400 bg-sky-500/15 shadow-[0_0_20px_rgba(56,189,248,0.2)] ring-1 ring-sky-400/40'
                        : 'bg-[#080B15]/60 border-sky-500/10 hover:border-sky-400/30 hover:bg-[#0D1222]'
                    }`}
                  >
                    {/* Header: Date number & Action Button */}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-mono font-semibold ${
                        isSelected
                          ? 'text-zinc-950 bg-sky-300 px-1.5 py-0.5 rounded font-bold'
                          : cell.dateStr === '2026-07-21'
                          ? 'text-sky-300 bg-sky-500/25 px-1.5 py-0.5 rounded font-bold'
                          : 'text-zinc-400'
                      }`}>
                        {cell.dayNum}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDate(cell.dateStr);
                          onAddTradeForDate(cell.dateStr);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md bg-[#080B15] hover:bg-sky-400 hover:text-zinc-950 text-zinc-400 transition-all duration-300 cursor-pointer"
                        title="เพิ่มบันทึกการเทรด"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Day Trades Content without Image Thumbnails */}
                    <div className="flex-1 mt-1 flex flex-col justify-end space-y-1">
                      {dayTrades.length > 0 ? (
                        <div className="space-y-1.5 bg-[#0A0E1A]/90 p-1.5 sm:p-2 rounded-xl border border-sky-500/10">
                          {/* Top Row: Trade Count Badge & Emotion Emoji */}
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] sm:text-[10px] font-mono font-bold text-sky-300 bg-sky-500/20 border border-sky-500/30 px-1.5 py-0.5 rounded-md">
                              {dayTrades.length} ไม้
                            </span>
                            <span className="text-xs" title={`อารมณ์: ${getEmotionThai(dayTrades[0].emotion)}`}>
                              {getEmotionEmoji(dayTrades[0].emotion)}
                            </span>
                          </div>

                          {/* Net Profit / Loss Amount */}
                          <div
                            className={`text-[10px] sm:text-xs font-mono font-bold text-center py-1 px-1 rounded-lg border w-full truncate tracking-tighter sm:tracking-tight ${
                              dayPnL >= 0 
                                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]' 
                                : 'bg-rose-950/40 text-rose-400 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.15)]'
                            }`}
                            title={`กำไร/ขาดทุนรวม: ${dayPnL >= 0 ? '+' : ''}$${dayPnL.toLocaleString()}`}
                          >
                            {formattedPnL}
                          </div>
                        </div>
                      ) : (
                        // Empty state button
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDate(cell.dateStr);
                            onAddTradeForDate(cell.dateStr);
                          }}
                          className="h-12 border border-dashed border-sky-500/15 rounded-xl hover:border-sky-400/50 hover:bg-sky-500/10 flex items-center justify-center transition-all cursor-pointer group/plus"
                          title="คลิกเพื่อบันทึกไม้เทรดในวันนี้"
                        >
                          <Plus className="h-4 w-4 text-zinc-600 group-hover/plus:text-sky-400 group-hover/plus:scale-110 transition-all" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Daily Trade Menu & Manager */}
        <div className="lg:col-span-4 bg-[#0D1222] border border-sky-500/15 rounded-2xl p-5 shadow-2xl flex flex-col space-y-4">
          <div className="flex items-center gap-2.5 border-b border-sky-500/10 pb-3">
            <div className="h-9 w-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-zinc-100">เมนูไม้เทรดประจำวัน</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">{formatThaiDate(selectedDate)}</p>
            </div>
          </div>

          {/* Mini Stats for selected date */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#080B15]/80 border border-sky-500/10 p-2.5 rounded-xl text-center">
              <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider">ไม้เทรดทั้งหมด</p>
              <p className="text-sm font-semibold text-zinc-200 mt-0.5">{selectedDateTrades.length} ไม้</p>
            </div>
            <div className="bg-[#080B15]/80 border border-sky-500/10 p-2.5 rounded-xl text-center">
              <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider">
                {selectedDayPnL >= 0 ? 'กำไรรวมไม้' : 'ขาดทุนรวมไม้'}
              </p>
              <p className={`text-sm font-bold mt-0.5 ${selectedDayPnL >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>
                {selectedDayPnL >= 0 ? '+' : '-'}${Math.abs(selectedDayPnL).toLocaleString('en-US', { minimumFractionDigits: selectedDayPnL % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Trades list or empty state */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {selectedDateTrades.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-sky-500/10 rounded-xl flex flex-col items-center justify-center gap-2.5">
                <div className="h-10 w-10 rounded-full bg-[#080B15] flex items-center justify-center text-zinc-500">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-zinc-300">ไม่มีการเข้าเทรดในวันนี้</p>
                  <p className="text-[10px] text-zinc-400">คุณสามารถบันทึกไม้แรกของวันได้เลย</p>
                </div>
                <button
                  type="button"
                  onClick={() => onAddTradeForDate(selectedDate)}
                  className="mt-1 px-4 py-2 bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-zinc-950 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-sky-500/15"
                >
                  <Plus className="h-3.5 w-3.5" /> บันทึกไม้แรก
                </button>
              </div>
            ) : (
              selectedDateTrades.map((trade, idx) => (
                <div
                  key={trade.id}
                  className="bg-[#080B15]/80 border border-sky-500/10 rounded-xl p-3.5 space-y-3 hover:border-sky-400/30 transition-colors group/card"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[9px] font-mono text-sky-300 bg-sky-500/15 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                        ไม้ที่ {selectedDateTrades.length - idx}
                      </span>
                      <h4 className="font-semibold text-xs text-zinc-200 mt-1.5 truncate max-w-[160px]" title={trade.technique}>
                        {trade.technique}
                      </h4>
                    </div>
                    <span className={`text-xs font-mono font-bold ${trade.profitLoss >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>
                      {trade.profitLoss >= 0 ? '+' : ''}${trade.profitLoss.toLocaleString()}
                    </span>
                  </div>

                  {trade.imageUrl && (
                    <div className="relative h-20 w-full rounded-lg overflow-hidden bg-black/40 border border-sky-500/10">
                      <img src={trade.imageUrl} alt="trade chart" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}

                  {trade.reason && (
                    <p className="text-[11px] text-zinc-300 leading-relaxed bg-[#080B15]/40 p-2 rounded border border-sky-500/10">
                      {trade.reason}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[10px] font-mono border-t border-sky-500/10 pt-2 text-zinc-400">
                    <div>SL {trade.sl} / TP {trade.tp}</div>
                    <div className="flex items-center gap-1 bg-[#10172A] px-1.5 py-0.5 rounded">
                      <span>{getEmotionEmoji(trade.emotion)}</span>
                      <span>{getEmotionThai(trade.emotion)}</span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-sky-500/10">
                    <button
                      type="button"
                      onClick={() => onViewTrade(trade)}
                      className="px-2.5 py-1 bg-[#10172A] hover:bg-[#1A233A] text-zinc-300 hover:text-sky-300 rounded-md text-[10px] transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="h-3 w-3 text-sky-400" /> แก้ไขไม้
                    </button>
                    {deletingTradeId === trade.id ? (
                      <div className="flex items-center gap-1 bg-rose-950/70 border border-rose-500/40 px-2 py-0.5 rounded-md">
                        <span className="text-[10px] text-rose-300 font-semibold">ลบไม้นี้?</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTrade(trade.id);
                            setDeletingTradeId(null);
                          }}
                          className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          ยืนยัน
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingTradeId(null);
                          }}
                          className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] transition-colors cursor-pointer"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingTradeId(trade.id);
                        }}
                        className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 rounded-md text-[10px] transition-all flex items-center gap-1 cursor-pointer border border-rose-500/10 hover:border-transparent"
                        title="ลบไม้เทรดนี้"
                      >
                        <Trash2 className="h-3 w-3" /> ลบไม้
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Add Button if trades are present to encourage multi-trade */}
          {selectedDateTrades.length > 0 && (
            <button
              type="button"
              onClick={() => onAddTradeForDate(selectedDate)}
              className="w-full py-2 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 hover:from-sky-300 hover:to-blue-400 text-zinc-950 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-sky-500/15"
            >
              <PlusCircle className="h-4 w-4" /> เพิ่มไม้เทรดใหม่ในวันนี้
            </button>
          )}
        </div>

      </div>

      {/* Detail list for current month trades */}
      <div className="bg-[#0D1222] p-6 rounded-2xl border border-sky-500/15 shadow-2xl">
        <h3 className="font-display text-base font-bold text-zinc-200 mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-sky-400" />
          ประวัติการเข้าเทรดทั้งหมดในเดือนนี้
        </h3>

        {trades.filter((t) => t.date.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`)).length === 0 ? (
          <div className="text-center py-8 text-zinc-400 border border-dashed border-sky-500/10 rounded-xl flex flex-col items-center justify-center gap-2">
            <AlertCircle className="h-5 w-5 text-zinc-500" />
            <p className="text-xs">ยังไม่มีบันทึกการเทรดสำหรับเดือนนี้ กดปุ่มเครื่องหมายบวกในปฏิทินเพื่อบันทึกเทรดแรกของคุณ</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trades
              .filter((t) => t.date.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`))
              .map((trade) => (
                <div
                  key={trade.id}
                  onClick={() => onViewTrade(trade)}
                  className="bg-[#080B15]/80 border border-sky-500/10 hover:border-sky-400/30 rounded-xl p-4 flex gap-4 hover:bg-[#0D1222] transition-all duration-300 cursor-pointer"
                >
                  {trade.imageUrl && (
                    <img
                      src={trade.imageUrl}
                      alt={trade.technique}
                      className="h-16 w-16 rounded-lg object-cover bg-[#080B15] border border-sky-500/10"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-zinc-400">{trade.date}</span>
                      <span className={`text-xs font-mono font-bold ${trade.profitLoss >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>
                        {trade.profitLoss >= 0 ? '+' : ''}${trade.profitLoss.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-zinc-200 truncate mt-1">{trade.technique}</p>
                    <p className="text-xs text-zinc-400 line-clamp-1 mt-1">{trade.reason}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-mono">
                        SL {trade.sl} / TP {trade.tp}
                      </span>
                      <span className="text-[10px] bg-sky-500/15 text-sky-300 px-1.5 py-0.5 rounded font-display font-medium">
                        {getEmotionEmoji(trade.emotion)} {getEmotionThai(trade.emotion)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
