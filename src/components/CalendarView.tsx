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
  PlusCircle
} from 'lucide-react';
import { Trade, TradeEmotion } from '../types';
import { getTradeOutcome, getTradePriceKey, getTradeTechnique } from '../lib/tradeTaxonomy';
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
    const winTrades = monthlyTrades.filter((trade) => getTradeOutcome(trade) === 'win').length;
    const lossTrades = monthlyTrades.filter((trade) => getTradeOutcome(trade) === 'loss').length;
    const decidedTrades = winTrades + lossTrades;
    const winRate = decidedTrades > 0 ? (winTrades / decidedTrades) * 100 : 0;

    return {
      totalPnL,
      winRate,
      count: monthlyTrades.length,
      wins: winTrades,
      losses: lossTrades,
    };
  }, [trades, currentYear, currentMonth]);

  // Compact, language-neutral markers keep dense calendar cells readable.
  const getEmotionMarker = (emotion: TradeEmotion) => {
    switch (emotion) {
      case 'fear': return 'FR';
      case 'overconfident': return 'OC';
      case 'calm': return 'CL';
      case 'greedy': return 'GR';
      case 'patient': return 'PT';
      default: return 'OT';
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
      {/* The detail rail stays narrow so the calendar remains the visual focus. */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        
        {/* Left Side: Calendar Grid */}
        <div className="min-w-0 space-y-6">
          <div className="border border-white/10 bg-[#11110F] p-3 shadow-none sm:p-4">
            <div className="mb-3 flex flex-col items-start justify-between gap-3 border-b border-white/10 pb-3 md:flex-row md:items-center">
              <div className="flex items-center gap-3">
                <button
                  onClick={prevMonth}
                  className="p-2 rounded-sm bg-[#0D0D0B] hover:bg-[#191916] text-zinc-400 hover:text-amber-300 border border-amber-500/10 transition-all cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <h2 className="min-w-[150px] text-center font-display text-xl font-normal text-stone-100 md:text-2xl">
                  {THAI_MONTHS[currentMonth]} {currentYear}
                </h2>
                <button
                  onClick={nextMonth}
                  className="p-2 rounded-sm bg-[#0D0D0B] hover:bg-[#191916] text-zinc-400 hover:text-amber-300 border border-amber-500/10 transition-all cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* High-Fidelity Mini Stats Panel */}
              <div className="grid w-full grid-cols-3 divide-x divide-white/10 border border-white/10 md:w-auto">
                <div className="min-w-0 px-2 py-2 text-center md:min-w-[100px]">
                  <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">เทรดในเดือน</p>
                  <p className="text-sm font-semibold text-zinc-200 mt-1">{monthStats.count} ครั้ง</p>
                </div>
                <div className="min-w-0 px-2 py-2 text-center md:min-w-[100px]">
                  <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                    {monthStats.totalPnL >= 0 ? 'กำไรสุทธิ' : 'ขาดทุนสุทธิ'}
                  </p>
                  <p className={`mt-1 text-sm font-medium ${monthStats.totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {monthStats.totalPnL >= 0 ? '+' : '-'}${Math.abs(monthStats.totalPnL).toLocaleString('en-US', { minimumFractionDigits: monthStats.totalPnL % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="min-w-0 px-2 py-2 text-center md:min-w-[100px]">
                  <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">อัตราการชนะ (Winrate)</p>
                  <p className="text-sm font-bold text-amber-400 mt-1">
                    {monthStats.winRate.toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Days of week header */}
            <div className="mb-1 grid grid-cols-7 gap-px">
              {['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map((dayName, idx) => (
                <div
                  key={idx}
                  className={`py-1.5 text-center font-mono text-[10px] font-medium uppercase tracking-[.08em] ${
                    idx === 0 ? 'text-rose-400' : idx === 6 ? 'text-amber-400' : 'text-zinc-400'
                  }`}
                >
                  {dayName}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-white/[.07]">
              {calendarDays.map((cell, idx) => {
                if (!cell) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="min-h-[64px] bg-[#0a0a09]/70 sm:min-h-[78px] md:min-h-[86px]"
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
                    className={`group relative flex min-h-[64px] cursor-pointer flex-col overflow-hidden p-1.5 transition-colors duration-150 sm:min-h-[78px] sm:p-2 md:min-h-[86px] ${
                      isSelected
                        ? 'bg-[#c7a76a]/10 ring-1 ring-inset ring-[#c7a76a]/70'
                        : 'bg-[#0D0D0B] hover:bg-[#151512]'
                    }`}
                  >
                    {/* Header: Date number & Action Button */}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-mono font-semibold ${
                        isSelected
                          ? 'text-[#d9bc82] font-bold'
                          : cell.dateStr === '2026-07-21'
                          ? 'text-amber-300 bg-amber-500/25 px-1.5 py-0.5 rounded font-bold'
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
                          className="cursor-pointer p-1 text-zinc-600 opacity-40 transition hover:bg-amber-400 hover:text-zinc-950 sm:opacity-0 sm:group-hover:opacity-100"
                        title="เพิ่มบันทึกการเทรด"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Day Trades Content without Image Thumbnails */}
                    <div className="mt-1 flex min-h-0 flex-1 flex-col">
                      {dayTrades.length > 0 ? (
                        <div className="flex min-h-0 flex-1 flex-col font-mono">
                          <div className="flex min-h-0 flex-1 items-center justify-center px-0.5">
                            <span
                              className={`max-w-full truncate text-center text-[9px] font-medium tracking-[-.03em] sm:text-xs lg:text-sm ${dayPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                              title={`กำไร/ขาดทุนรวม: ${dayPnL >= 0 ? '+' : ''}$${dayPnL.toLocaleString()}`}
                            >
                              {formattedPnL}
                            </span>
                          </div>
                          <span
                            className="border-t border-white/[.06] pt-1 text-[8px] tracking-[.04em] text-stone-500 sm:text-[9px]"
                            title={`จำนวน ${dayTrades.length} ไม้ · อารมณ์ ${getEmotionThai(dayTrades[0].emotion)}`}
                          >
                            {dayTrades.length}T&nbsp;&nbsp;·&nbsp;&nbsp;{getEmotionMarker(dayTrades[0].emotion)}
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDate(cell.dateStr);
                            onAddTradeForDate(cell.dateStr);
                          }}
                          className="ml-auto grid h-6 w-6 cursor-pointer place-items-center text-zinc-700 opacity-45 transition hover:bg-[#c7a76a]/10 hover:text-amber-400 sm:opacity-0 sm:group-hover:opacity-100"
                          title="คลิกเพื่อบันทึกไม้เทรดในวันนี้"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Daily Trade Menu & Manager */}
        <div className="flex flex-col space-y-3 border border-amber-500/15 bg-[#11110F] p-4 shadow-none lg:sticky lg:top-28">
          <div className="flex items-center gap-2.5 border-b border-amber-500/10 pb-3">
            <div className="h-9 w-9 rounded-sm bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-zinc-100">เมนูไม้เทรดประจำวัน</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">{formatThaiDate(selectedDate)}</p>
            </div>
          </div>

          {/* Mini Stats for selected date */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#0D0D0B]/80 border border-amber-500/10 p-2.5 rounded-sm text-center">
              <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider">ไม้เทรดทั้งหมด</p>
              <p className="text-sm font-semibold text-zinc-200 mt-0.5">{selectedDateTrades.length} ไม้</p>
            </div>
            <div className="bg-[#0D0D0B]/80 border border-amber-500/10 p-2.5 rounded-sm text-center">
              <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider">
                {selectedDayPnL >= 0 ? 'กำไรรวมไม้' : 'ขาดทุนรวมไม้'}
              </p>
              <p className={`text-sm font-bold mt-0.5 ${selectedDayPnL >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                {selectedDayPnL >= 0 ? '+' : '-'}${Math.abs(selectedDayPnL).toLocaleString('en-US', { minimumFractionDigits: selectedDayPnL % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Trades list or empty state */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {selectedDateTrades.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 border-t border-white/10 py-7 text-center">
                <div className="h-10 w-10 rounded-full bg-[#0D0D0B] flex items-center justify-center text-zinc-500">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-zinc-300">ไม่มีการเข้าเทรดในวันนี้</p>
                  <p className="text-[10px] text-zinc-400">คุณสามารถบันทึกไม้แรกของวันได้เลย</p>
                </div>
                <button
                  type="button"
                  onClick={() => onAddTradeForDate(selectedDate)}
                  className="mt-1 px-4 py-2 bg-[#c7a76a] hover:bg-[#d9bc82] text-zinc-950 rounded-sm text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-none shadow-amber-500/15"
                >
                  <Plus className="h-3.5 w-3.5" /> บันทึกไม้แรก
                </button>
              </div>
            ) : (
              selectedDateTrades.map((trade, idx) => (
                <div
                  key={trade.id}
                  className="bg-[#0D0D0B]/80 border border-amber-500/10 rounded-sm p-3.5 space-y-3 hover:border-amber-400/30 transition-colors group/card"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[9px] font-mono text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                        ไม้ที่ {selectedDateTrades.length - idx}
                      </span>
                      <h4 className="font-semibold text-xs text-zinc-200 mt-1.5 truncate max-w-[160px]" title={`${getTradeTechnique(trade)} · ${getTradePriceKey(trade)}`}>
                        {getTradeTechnique(trade)}
                      </h4>
                      <p className="mt-0.5 max-w-[160px] truncate font-mono text-[9px] text-zinc-500">{getTradePriceKey(trade)}</p>
                    </div>
                    <span className={`text-xs font-mono font-bold ${trade.profitLoss >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {trade.profitLoss >= 0 ? '+' : ''}${trade.profitLoss.toLocaleString()}
                    </span>
                  </div>

                  {trade.imageUrl && (
                    <div className="relative h-20 w-full rounded-sm overflow-hidden bg-black/40 border border-amber-500/10">
                      <img src={trade.imageUrl} alt="trade chart" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}

                  {trade.reason && (
                    <p className="text-[11px] text-zinc-300 leading-relaxed bg-[#0D0D0B]/40 p-2 rounded border border-amber-500/10">
                      {trade.reason}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[10px] font-mono border-t border-amber-500/10 pt-2 text-zinc-400">
                    <div>SL {trade.sl} / TP {trade.tp}</div>
                    <div className="flex items-center gap-1 bg-[#171713] px-1.5 py-0.5 rounded">
                      <span className="font-mono text-[9px] text-amber-400">{getEmotionMarker(trade.emotion)}</span>
                      <span>{getEmotionThai(trade.emotion)}</span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-amber-500/10">
                    <button
                      type="button"
                      onClick={() => onViewTrade(trade)}
                      className="px-2.5 py-1 bg-[#171713] hover:bg-[#22221D] text-zinc-300 hover:text-amber-300 rounded-md text-[10px] transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="h-3 w-3 text-amber-400" /> ดูรายละเอียด
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
              className="w-full py-2 bg-[#c7a76a] hover:bg-[#d9bc82] text-zinc-950 rounded-sm text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-none shadow-amber-500/15"
            >
              <PlusCircle className="h-4 w-4" /> เพิ่มไม้เทรดใหม่ในวันนี้
            </button>
          )}
        </div>

      </div>

      {/* Detail list for current month trades */}
      <div className="bg-[#11110F] p-6 rounded-sm border border-amber-500/15 shadow-none">
        <h3 className="font-display text-base font-bold text-zinc-200 mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-amber-400" />
          ประวัติการเข้าเทรดทั้งหมดในเดือนนี้
        </h3>

        {trades.filter((t) => t.date.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`)).length === 0 ? (
          <div className="text-center py-8 text-zinc-400 border border-dashed border-amber-500/10 rounded-sm flex flex-col items-center justify-center gap-2">
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
                  className="bg-[#0D0D0B]/80 border border-amber-500/10 hover:border-amber-400/30 rounded-sm p-4 flex gap-4 hover:bg-[#11110F] transition-all duration-300 cursor-pointer"
                >
                  {trade.imageUrl && (
                    <img
                      src={trade.imageUrl}
                      alt={`${getTradeTechnique(trade)} · ${getTradePriceKey(trade)}`}
                      className="h-16 w-16 rounded-sm object-cover bg-[#0D0D0B] border border-amber-500/10"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-zinc-400">{trade.date}</span>
                      <span className={`text-xs font-mono font-bold ${trade.profitLoss >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {trade.profitLoss >= 0 ? '+' : ''}${trade.profitLoss.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-zinc-200 truncate mt-1">{getTradeTechnique(trade)}</p>
                    <p className="mt-0.5 truncate font-mono text-[9px] uppercase tracking-wide text-zinc-500">{getTradePriceKey(trade)}</p>
                    <p className="text-xs text-zinc-400 line-clamp-1 mt-1">{trade.reason}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-mono">
                        SL {trade.sl} / TP {trade.tp}
                      </span>
                      <span className="text-[10px] bg-amber-500/15 text-amber-300 px-1.5 py-0.5 rounded font-display font-medium">
                        <span className="mr-1 font-mono text-[9px] text-amber-400">{getEmotionMarker(trade.emotion)}</span> {getEmotionThai(trade.emotion)}
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
