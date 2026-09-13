import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Percent,
  Wallet,
  Activity,
  Award,
  Heart,
  Save,
  Check,
  ChevronRight,
  TrendingDown,
  Coins,
  ShieldCheck,
} from 'lucide-react';
import { Trade, TradeEmotion, UserProfile, CashflowRecord } from '../types';
import { DEFAULT_TECHNIQUES } from '../lib/db';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

interface DashboardViewProps {
  user: UserProfile;
  trades: Trade[];
  cashflows?: CashflowRecord[];
  onUpdateCapital: (capital: number) => void;
}

export default function DashboardView({ user, trades, cashflows = [], onUpdateCapital }: DashboardViewProps) {
  const [capitalInput, setCapitalInput] = useState(user.startingCapital.toString());
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveCapital = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(capitalInput);
    if (!isNaN(parsed) && parsed > 0) {
      onUpdateCapital(parsed);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const netCashflow = useMemo(() => {
    return cashflows.reduce((sum, c) => sum + (c.type === 'deposit' ? c.amount : -c.amount), 0);
  }, [cashflows]);

  // 1. Quant Stats Computations
  const stats = useMemo(() => {
    const total = trades.length;
    const currentBalance = user.startingCapital + netCashflow + (trades.reduce((sum, t) => sum + t.profitLoss, 0));

    if (total === 0) {
      return {
        total: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 0,
        totalPnL: 0,
        currentBalance,
        avgRRR: 0,
        expectancy: 0,
        maxDrawdown: 0,
      };
    }

    const winsList = trades.filter((t) => t.profitLoss > 0);
    const lossesList = trades.filter((t) => t.profitLoss < 0);

    const winsCount = winsList.length;
    const lossesCount = lossesList.length;
    const winRate = (winsCount / total) * 100;

    const totalWinSum = winsList.reduce((sum, t) => sum + t.profitLoss, 0);
    const totalLossSum = Math.abs(lossesList.reduce((sum, t) => sum + t.profitLoss, 0));

    const avgWin = winsCount > 0 ? totalWinSum / winsCount : 0;
    const avgLoss = lossesCount > 0 ? totalLossSum / lossesCount : 0;

    const profitFactor = totalLossSum > 0 ? totalWinSum / totalLossSum : totalWinSum > 0 ? 999 : 0;
    const totalPnL = trades.reduce((sum, t) => sum + t.profitLoss, 0);
    const expectancy = totalPnL / total;
    let equity = user.startingCapital;
    let peak = equity;
    let maxDrawdown = 0;
    [...trades].sort((a, b) => a.createdAt - b.createdAt).forEach((trade) => {
      equity += trade.profitLoss;
      peak = Math.max(peak, equity);
      if (peak > 0) maxDrawdown = Math.max(maxDrawdown, ((peak - equity) / peak) * 100);
    });

    // Calculate Average Risk Reward Ratio (TP / SL ratio)
    const avgRRR = trades.reduce((acc, t) => {
      const rrr = t.sl > 0 ? t.tp / t.sl : 1;
      return acc + rrr;
    }, 0) / total;

    return {
      total,
      wins: winsCount,
      losses: lossesCount,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      totalPnL,
      currentBalance,
      avgRRR,
      expectancy,
      maxDrawdown,
    };
  }, [trades, user.startingCapital, netCashflow]);

  // 2. Technique Statistics Analysis
  const techniqueStats = useMemo(() => {
    const map: Record<string, { wins: number; losses: number; count: number; totalPnL: number }> = {};

    trades.forEach((trade) => {
      if (!map[trade.technique]) {
        map[trade.technique] = { wins: 0, losses: 0, count: 0, totalPnL: 0 };
      }
      map[trade.technique].count += 1;
      map[trade.technique].totalPnL += trade.profitLoss;
      if (trade.profitLoss > 0) {
        map[trade.technique].wins += 1;
      } else {
        map[trade.technique].losses += 1;
      }
    });

    return Object.entries(map).map(([name, item]) => {
      const winRate = item.count > 0 ? (item.wins / item.count) * 100 : 0;
      return {
        name,
        count: item.count,
        wins: item.wins,
        losses: item.losses,
        totalPnL: item.totalPnL,
        winRate,
      };
    }).sort((a, b) => b.winRate - a.winRate);
  }, [trades]);

  // 3. Emotion Analysis Data
  const emotionData = useMemo(() => {
    const map: Record<TradeEmotion, number> = {
      fear: 0,
      overconfident: 0,
      calm: 0,
      greedy: 0,
      patient: 0,
      other: 0,
    };

    trades.forEach((t) => {
      if (map[t.emotion] !== undefined) {
        map[t.emotion] += 1;
      } else {
        map.other += 1;
      }
    });

    const labelMap: Record<TradeEmotion, string> = {
      fear: '😨 กลัว (Fear)',
      overconfident: '😎 มั่นใจเกิน (Overconfident)',
      calm: '🧘 สงบ (Calm)',
      greedy: '🤑 โลภ (Greed)',
      patient: '⏳ ใจเย็น (Patient)',
      other: '😐 อื่นๆ (Other)',
    };

    const colors: Record<TradeEmotion, string> = {
      fear: '#EF4444',          // red
      overconfident: '#3B82F6',  // blue
      calm: '#38BDF8',          // sky cyan
      greedy: '#06B6D4',         // cyan
      patient: '#8B5CF6',        // purple
      other: '#6B7280',          // grey
    };

    return Object.entries(map)
      .filter(([_, val]) => val > 0)
      .map(([key, val]) => ({
        name: labelMap[key as TradeEmotion],
        value: val,
        color: colors[key as TradeEmotion],
      }));
  }, [trades]);

  // 4. Cumulative Returns over time data
  const cumulativeData = useMemo(() => {
    // Sort trades chronologically to build growth curve
    const chronologicalTrades = [...trades].sort((a, b) => a.createdAt - b.createdAt);
    let currentBal = user.startingCapital;

    const points = [{
      name: 'Start',
      balance: currentBal,
      pnl: 0,
    }];

    chronologicalTrades.forEach((t, idx) => {
      currentBal += t.profitLoss;
      points.push({
        name: `ไม้ ${idx + 1}`,
        balance: currentBal,
        pnl: t.profitLoss,
      });
    });

    return points;
  }, [trades, user.startingCapital]);

  // 5. Individual trade performance bars data
  const barChartData = useMemo(() => {
    return [...trades]
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((t, idx) => ({
        name: `ไม้ ${idx + 1}`,
        PnL: t.profitLoss,
        date: t.date,
      }));
  }, [trades]);

  // 6. Best Profit Days Analysis (Daily, Weekly, Monthly) & Historical Monthly Tracker
  const bestDaysAnalysis = useMemo(() => {
    if (trades.length === 0) {
      return {
        bestDayAllTime: null,
        bestDayThisWeek: null,
        bestDayThisMonth: null,
        monthlyHistory: [],
      };
    }

    // Group trades by local date string (YYYY-MM-DD)
    const dailyMap: Record<string, { dateStr: string; pnl: number; count: number; trades: Trade[] }> = {};

    trades.forEach((t) => {
      // Use local date from createdAt or t.date
      const localDateStr = t.date || new Date(t.createdAt).toLocaleDateString('sv-SE');
      if (!dailyMap[localDateStr]) {
        dailyMap[localDateStr] = { dateStr: localDateStr, pnl: 0, count: 0, trades: [] };
      }
      dailyMap[localDateStr].pnl += t.profitLoss;
      dailyMap[localDateStr].count += 1;
      dailyMap[localDateStr].trades.push(t);
    });

    const dailyList = Object.values(dailyMap).map((d) => {
      const pnlPercent = user.startingCapital > 0 ? (d.pnl / user.startingCapital) * 100 : 0;
      return {
        ...d,
        pnlPercent,
      };
    });

    // Current local date helpers
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthStr = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Calculate current week start date (Monday)
    const dayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon
    const diffToMon = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monDate = new Date(now.setDate(diffToMon));
    const weekStartStr = monDate.toLocaleDateString('sv-SE');

    // Helper to get best profit day (or worst loss day if all days are <= 0)
    const getBestOrWorstDay = (list: typeof dailyList) => {
      if (list.length === 0) return null;
      const positiveDays = list.filter((d) => d.pnl > 0);
      if (positiveDays.length > 0) {
        // Has profit days -> pick the max profit
        return [...positiveDays].sort((a, b) => b.pnl - a.pnl)[0];
      } else {
        // All days are losses/0 -> pick the largest loss (most negative PnL)
        return [...list].sort((a, b) => a.pnl - b.pnl)[0];
      }
    };

    // All time best / worst day
    const bestDayAllTime = getBestOrWorstDay(dailyList);

    // Best / worst day this month
    const thisMonthDays = dailyList.filter((d) => d.dateStr.startsWith(currentMonthStr));
    const bestDayThisMonth = getBestOrWorstDay(thisMonthDays);

    // Best / worst day this week
    const thisWeekDays = dailyList.filter((d) => d.dateStr >= weekStartStr);
    const bestDayThisWeek = getBestOrWorstDay(thisWeekDays);

    // Monthly historical grouping YYYY-MM
    const monthlyMap: Record<string, typeof dailyList> = {};
    dailyList.forEach((d) => {
      const monthKey = d.dateStr.substring(0, 7); // e.g. "2025-01"
      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = [];
      monthlyMap[monthKey].push(d);
    });

    const THAI_MONTH_NAMES = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    const monthlyHistory = Object.entries(monthlyMap)
      .sort((a, b) => b[0].localeCompare(a[0])) // Most recent month first
      .map(([monthKey, monthDays]) => {
        const [year, mStr] = monthKey.split('-');
        const monthNum = parseInt(mStr, 10) - 1;
        const thaiLabel = `${THAI_MONTH_NAMES[monthNum] || mStr} ${parseInt(year, 10) + 543}`;
        
        const hasPositive = monthDays.some((d) => d.pnl > 0);
        const sortedDays = [...monthDays].sort((a, b) => {
          if (hasPositive) {
            return b.pnl - a.pnl; // Profit days first (highest profit at index 0)
          } else {
            return a.pnl - b.pnl; // Worst loss first (largest loss / most negative at index 0)
          }
        });
        const monthBestDay = sortedDays[0];
        const monthTotalPnL = monthDays.reduce((acc, d) => acc + d.pnl, 0);
        const monthTotalPnLPercent = user.startingCapital > 0 ? (monthTotalPnL / user.startingCapital) * 100 : 0;
        const monthTradeCount = monthDays.reduce((acc, d) => acc + d.count, 0);

        return {
          monthKey,
          thaiLabel,
          monthBestDay,
          monthTotalPnL,
          monthTotalPnLPercent,
          monthTradeCount,
          days: sortedDays,
        };
      });

    return {
      bestDayAllTime,
      bestDayThisWeek,
      bestDayThisMonth,
      monthlyHistory,
    };
  }, [trades, user.startingCapital]);

  const [selectedHistoryMonth, setSelectedHistoryMonth] = useState<string | null>(null);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Starting Capital config & Current Bal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Starting Capital Setup Form */}
        <div className="bg-[#0D1222] p-6 rounded-2xl border border-sky-500/15 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-5 w-5 text-sky-400" />
              <h3 className="font-display font-bold text-sm text-zinc-200">กรอกต้นทุนปั้นพอร์ตแรกเริ่ม</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              กำหนดทุนเริ่มต้นของคุณเพื่อคำนวณกราฟผลตอบแทนสะสมและการเติบโตอย่างเป็นรูปธรรม
            </p>
          </div>

          <form onSubmit={handleSaveCapital} className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2 text-zinc-500 font-mono text-sm">$</span>
              <input
                type="number"
                value={capitalInput}
                onChange={(e) => setCapitalInput(e.target.value)}
                placeholder="เช่น 10000"
                className="w-full bg-[#080B15] border border-sky-500/15 focus:border-sky-400 rounded-xl pl-7 pr-3 py-1.5 text-sm text-zinc-100 focus:outline-none font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-zinc-950 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-md shadow-sky-500/15"
            >
              {isSaved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
              {isSaved ? 'บันทึกแล้ว' : 'บันทึก'}
            </button>
          </form>
        </div>

        {/* Compound Capital Displays */}
        <div className="bg-[#0D1222] p-6 rounded-2xl border border-sky-500/15 shadow-2xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
            <Coins className="h-6 w-6 text-sky-400" />
          </div>
          <div>
            <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">พอร์ตปัจจุบัน (Balance)</p>
            <h4 className="text-2xl font-bold font-mono text-sky-400 mt-1 neon-blue-glow">
              ${stats.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h4>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              การเติบโต: <span className={stats.totalPnL >= 0 ? 'text-sky-400 font-semibold' : 'text-rose-400 font-semibold'}>
                {stats.totalPnL >= 0 ? '+' : ''}
                {stats.totalPnL >= 0 ? ((stats.totalPnL / user.startingCapital) * 100).toFixed(1) : ((stats.totalPnL / user.startingCapital) * 100).toFixed(1)}%
              </span>
            </p>
          </div>
        </div>

        <div className="bg-[#0D1222] p-6 rounded-2xl border border-sky-500/15 shadow-2xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
            <ShieldCheck className="h-6 w-6 text-sky-400" />
          </div>
          <div>
            <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">เป้าหมาย RRR เฉลี่ยตามแผน</p>
            <h4 className="text-2xl font-bold font-mono text-sky-400 mt-1 neon-blue-glow">
              1 : {stats.avgRRR.toFixed(2)}
            </h4>
            <p className="text-[10px] text-zinc-400 mt-0.5">คุมระดับกำไรคุ้มค่าความเสี่ยงสม่ำเสมอ</p>
          </div>
        </div>
      </div>

      {/* Grid of Quant Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-[#0D1222]/80 p-4 rounded-xl border border-sky-500/10 text-center">
          <Percent className="h-5 w-5 text-sky-400 mx-auto mb-1.5" />
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Win Rate (อัตราการชนะ)</p>
          <p className="text-xl font-bold text-zinc-100 mt-1 font-mono">{stats.winRate.toFixed(1)}%</p>
          <p className="text-[9px] text-zinc-400 mt-1">ชนะ {stats.wins} จาก {stats.total} ครั้ง</p>
        </div>

        <div className="bg-[#0D1222]/80 p-4 rounded-xl border border-sky-500/10 text-center">
          <TrendingUp className="h-5 w-5 text-sky-400 mx-auto mb-1.5" />
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">กำไรเฉลี่ยไม้ชนะ</p>
          <p className="text-xl font-bold text-sky-400 mt-1 font-mono">+${stats.avgWin.toFixed(0)}</p>
          <p className="text-[9px] text-zinc-400 mt-1">จำนวนไม้บวกทั้งหมด: {stats.wins}</p>
        </div>

        <div className="bg-[#0D1222]/80 p-4 rounded-xl border border-sky-500/10 text-center">
          <TrendingDown className="h-5 w-5 text-rose-400 mx-auto mb-1.5" />
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">ขาดทุนเฉลี่ยไม้แพ้</p>
          <p className="text-xl font-bold text-rose-400 mt-1 font-mono">-${stats.avgLoss.toFixed(0)}</p>
          <p className="text-[9px] text-zinc-400 mt-1">จำนวนไม้ลบทั้งหมด: {stats.losses}</p>
        </div>

        <div className="bg-[#0D1222]/80 p-4 rounded-xl border border-sky-500/10 text-center">
          <Activity className="h-5 w-5 text-indigo-400 mx-auto mb-1.5" />
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Profit Factor (สัดส่วนกำไร)</p>
          <p className="text-xl font-bold text-indigo-400 mt-1 font-mono">
            {stats.profitFactor === 999 ? '∞' : stats.profitFactor.toFixed(2)}
          </p>
          <p className="text-[9px] text-zinc-400 mt-1">สัดส่วนความเสี่ยงรวมเทียบยอดชนะ</p>
        </div>

        <div className="bg-[#0D1222]/80 p-4 rounded-xl border border-sky-500/10 text-center">
          <Coins className="h-5 w-5 text-emerald-400 mx-auto mb-1.5" />
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Expectancy / Trade</p>
          <p className={`text-xl font-bold mt-1 font-mono ${stats.expectancy >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {stats.expectancy >= 0 ? '+' : '-'}${Math.abs(stats.expectancy).toFixed(2)}
          </p>
          <p className="text-[9px] text-zinc-400 mt-1">ค่าเฉลี่ยผลลัพธ์ต่อหนึ่งรายการ</p>
        </div>

        <div className="bg-[#0D1222]/80 p-4 rounded-xl border border-sky-500/10 text-center">
          <ShieldCheck className="h-5 w-5 text-amber-400 mx-auto mb-1.5" />
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Max Drawdown</p>
          <p className="text-xl font-bold text-amber-300 mt-1 font-mono">{stats.maxDrawdown.toFixed(2)}%</p>
          <p className="text-[9px] text-zinc-400 mt-1">การลดลงสูงสุดจากจุดสูงสุด</p>
        </div>
      </div>

      {/* BEST PROFIT DAYS HIGHLIGHT CARDS (Weekly / Monthly / All-Time) */}
      <div className="bg-[#0D1222] p-6 rounded-2xl border border-sky-500/15 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-sky-500/10 pb-3">
          <div>
            <h3 className="font-display font-bold text-base text-zinc-100 flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-400" />
              <span>สถิติกำไรวันสูงสุด (% Return Best Days - Local Time)</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              ติดตามวันที่ทำกำไรเปอร์เซ็นต์สูงสุดประจำสัปดาห์ เดือน และสถิติตลอดกาล
            </p>
          </div>
          <span className="text-[10px] bg-emerald-500/15 text-emerald-300 font-mono font-bold px-2.5 py-1 rounded-full border border-emerald-500/20">
            LOCAL TIME RESET
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Best Day This Week */}
          <div className="bg-[#080B15] p-4 rounded-xl border border-sky-500/10 relative overflow-hidden group hover:border-sky-400/30 transition-all">
            <p className="text-[10px] font-mono text-sky-400 uppercase tracking-wider font-semibold">
              🏆 {bestDaysAnalysis.bestDayThisWeek && bestDaysAnalysis.bestDayThisWeek.pnl < 0 ? 'วันขาดทุนสูงสุดสัปดาห์นี้' : 'วันกำไรสูงสุดสัปดาห์นี้'}
            </p>
            {bestDaysAnalysis.bestDayThisWeek ? (
              <div className="mt-2 space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className={`text-xl font-bold font-mono ${bestDaysAnalysis.bestDayThisWeek.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {bestDaysAnalysis.bestDayThisWeek.pnl >= 0 ? '+' : '-'}${Math.abs(bestDaysAnalysis.bestDayThisWeek.pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${bestDaysAnalysis.bestDayThisWeek.pnl >= 0 ? 'text-emerald-300 bg-emerald-500/20' : 'text-rose-300 bg-rose-500/20'}`}>
                    {bestDaysAnalysis.bestDayThisWeek.pnlPercent >= 0 ? '+' : ''}{bestDaysAnalysis.bestDayThisWeek.pnlPercent.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono pt-1">
                  <span>วันที่ {bestDaysAnalysis.bestDayThisWeek.dateStr}</span>
                  <span>{bestDaysAnalysis.bestDayThisWeek.count} ไม้</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 mt-3 font-mono">ยังไม่มีการเทรดในสัปดาห์นี้</p>
            )}
          </div>

          {/* Best Day This Month */}
          <div className="bg-[#080B15] p-4 rounded-xl border border-sky-500/10 relative overflow-hidden group hover:border-sky-400/30 transition-all">
            <p className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-semibold">
              👑 {bestDaysAnalysis.bestDayThisMonth && bestDaysAnalysis.bestDayThisMonth.pnl < 0 ? 'วันขาดทุนสูงสุดเดือนนี้' : 'วันกำไรสูงสุดเดือนนี้'}
            </p>
            {bestDaysAnalysis.bestDayThisMonth ? (
              <div className="mt-2 space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className={`text-xl font-bold font-mono ${bestDaysAnalysis.bestDayThisMonth.pnl >= 0 ? 'text-amber-300' : 'text-rose-400'}`}>
                    {bestDaysAnalysis.bestDayThisMonth.pnl >= 0 ? '+' : '-'}${Math.abs(bestDaysAnalysis.bestDayThisMonth.pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${bestDaysAnalysis.bestDayThisMonth.pnl >= 0 ? 'text-amber-300 bg-amber-500/20' : 'text-rose-300 bg-rose-500/20'}`}>
                    {bestDaysAnalysis.bestDayThisMonth.pnlPercent >= 0 ? '+' : ''}{bestDaysAnalysis.bestDayThisMonth.pnlPercent.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono pt-1">
                  <span>วันที่ {bestDaysAnalysis.bestDayThisMonth.dateStr}</span>
                  <span>{bestDaysAnalysis.bestDayThisMonth.count} ไม้</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 mt-3 font-mono">ยังไม่มีการเทรดในเดือนนี้</p>
            )}
          </div>

          {/* All Time Best Day */}
          <div className="bg-[#080B15] p-4 rounded-xl border border-sky-500/10 relative overflow-hidden group hover:border-sky-400/30 transition-all">
            <p className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider font-semibold">
              🚀 {bestDaysAnalysis.bestDayAllTime && bestDaysAnalysis.bestDayAllTime.pnl < 0 ? 'วันขาดทุนสูงสุดตลอดกาล (ALL-TIME)' : 'วันกำไรสูงสุดตลอดกาล (ALL-TIME)'}
            </p>
            {bestDaysAnalysis.bestDayAllTime ? (
              <div className="mt-2 space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className={`text-xl font-bold font-mono ${bestDaysAnalysis.bestDayAllTime.pnl >= 0 ? 'text-indigo-300' : 'text-rose-400'}`}>
                    {bestDaysAnalysis.bestDayAllTime.pnl >= 0 ? '+' : '-'}${Math.abs(bestDaysAnalysis.bestDayAllTime.pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${bestDaysAnalysis.bestDayAllTime.pnl >= 0 ? 'text-indigo-300 bg-indigo-500/20' : 'text-rose-300 bg-rose-500/20'}`}>
                    {bestDaysAnalysis.bestDayAllTime.pnlPercent >= 0 ? '+' : ''}{bestDaysAnalysis.bestDayAllTime.pnlPercent.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono pt-1">
                  <span>วันที่ {bestDaysAnalysis.bestDayAllTime.dateStr}</span>
                  <span>{bestDaysAnalysis.bestDayAllTime.count} ไม้</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 mt-3 font-mono">ยังไม่มีข้อมูลการเทรด</p>
            )}
          </div>
        </div>
      </div>

      {/* HISTORICAL MONTHLY BEST DAYS VIEW (ดูย้อนหลังแต่ละเดือนกำไรวันไหนเยอะสุด) */}
      <div className="bg-[#0D1222] p-6 rounded-2xl border border-sky-500/15 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-sky-500/10 pb-3">
          <div>
            <h3 className="font-display font-bold text-base text-zinc-100 flex items-center gap-2">
              <Coins className="h-5 w-5 text-sky-400" />
              <span>ประวัติสรุปวันทำผลงานสูงสุดแยกตามรายเดือน (Monthly Historical Best Days)</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              ดูประวัติย้อนหลังของทุกเดือนว่าวันไหนทำผลงานได้ดีที่สุด พร้อมภาพรวมกำไร/ขาดทุนรายเดือน
            </p>
          </div>
        </div>

        {bestDaysAnalysis.monthlyHistory.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 text-xs font-mono">
            ยังไม่มีประวัติการเทรดในอดีต บันทึกไม้เทรดแรกของคุณเพื่อเริ่มสะสมสถิติรายเดือน
          </div>
        ) : (
          <div className="space-y-3">
            {bestDaysAnalysis.monthlyHistory.map((m) => {
              const isExpanded = selectedHistoryMonth === m.monthKey;
              return (
                <div
                  key={m.monthKey}
                  className="bg-[#080B15] rounded-xl border border-sky-500/10 overflow-hidden transition-all hover:border-sky-500/20"
                >
                  <div
                    onClick={() => setSelectedHistoryMonth(isExpanded ? null : m.monthKey)}
                    className="p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-sky-500/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center font-bold font-mono text-sky-400 text-sm">
                        {m.monthKey.split('-')[1]}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-200">{m.thaiLabel}</h4>
                        <p className="text-[11px] text-zinc-400 font-mono">
                          เทรดรวม {m.monthTradeCount} ไม้ | {m.monthTotalPnL >= 0 ? 'กำไรรวมเดือนนี้:' : 'ขาดทุนรวมเดือนนี้:'}{' '}
                          <span className={m.monthTotalPnL >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {m.monthTotalPnL >= 0 ? '+' : '-'}${Math.abs(m.monthTotalPnL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({m.monthTotalPnLPercent >= 0 ? '+' : ''}{m.monthTotalPnLPercent.toFixed(1)}%)
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Month Best Day Badge */}
                    <div className="flex items-center gap-3">
                      {m.monthBestDay && (
                        <div className={`text-right px-3 py-1.5 rounded-lg border ${
                          m.monthBestDay.pnl >= 0 
                            ? 'bg-emerald-950/40 border-emerald-500/30' 
                            : 'bg-rose-950/40 border-rose-500/30'
                        }`}>
                          <p className="text-[10px] text-zinc-400 font-mono uppercase">
                            {m.monthBestDay.pnl >= 0 ? 'วันกำไรสูงสุด' : 'วันขาดทุนสูงสุด'}
                          </p>
                          <p className={`text-xs font-mono font-bold ${m.monthBestDay.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {m.monthBestDay.dateStr}: {m.monthBestDay.pnl >= 0 ? '+' : '-'}${Math.abs(m.monthBestDay.pnl).toLocaleString()} ({m.monthBestDay.pnlPercent >= 0 ? '+' : ''}{m.monthBestDay.pnlPercent.toFixed(1)}%)
                          </p>
                        </div>
                      )}
                      <ChevronRight className={`h-5 w-5 text-zinc-500 transition-transform ${isExpanded ? 'rotate-90 text-sky-400' : ''}`} />
                    </div>
                  </div>

                  {/* Expanded Monthly Days List */}
                  {isExpanded && (
                    <div className="p-4 border-t border-sky-500/10 bg-[#0A0E1A]/60 space-y-2">
                      <h5 className="text-xs font-mono text-sky-400 uppercase font-bold mb-2">
                        {m.monthBestDay && m.monthBestDay.pnl < 0 ? `ลำดับวันขาดทุนสูงสุดในเดือน ${m.thaiLabel}:` : `ลำดับวันทำกำไรสูงสุดในเดือน ${m.thaiLabel}:`}
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {m.days.map((day, idx) => (
                          <div
                            key={day.dateStr}
                            className={`p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between ${
                              idx === 0 
                                ? day.pnl >= 0 ? 'bg-amber-950/20 border-amber-500/40 text-amber-300' : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                                : day.pnl >= 0 
                                  ? 'bg-[#080B15] border-emerald-500/20 text-emerald-400' 
                                  : 'bg-[#080B15] border-rose-500/20 text-rose-400'
                            }`}
                          >
                            <div>
                              <span className="font-bold">{idx === 0 ? '👑 ' : ''}{day.dateStr}</span>
                              <span className="text-[10px] text-zinc-500 ml-2">({day.count} ไม้)</span>
                            </div>
                            <span className="font-bold">
                              {day.pnl >= 0 ? '+' : '-'}${Math.abs(day.pnl).toLocaleString()} ({day.pnlPercent >= 0 ? '+' : ''}{day.pnlPercent.toFixed(1)}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cumulative returns chart */}
        <div className="bg-[#0D1222] p-6 rounded-2xl border border-sky-500/15 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-sm text-zinc-200">กราฟแสดงผลตอบแทนสะสมย้อนหลัง (Compounding Return)</h3>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">การเจริญเติบโตของเงินทุนแรกเริ่ม</p>
            </div>
            <span className="text-[10px] bg-sky-500/15 text-sky-300 px-2 py-0.5 rounded font-mono font-bold">REAL-TIME</span>
          </div>

          <div className="h-72 w-full">
            {trades.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-500 text-xs font-mono">
                ไม่มีข้อมูลแสดงผล ให้ทำบันทึกเทรดก่อน
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cumulativeData}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#38BDF8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#475569" fontSize={10} fontClassName="font-mono" />
                  <YAxis stroke="#475569" fontSize={10} fontClassName="font-mono" domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#080B15', borderColor: '#1E293B', borderRadius: '8px' }}
                    labelStyle={{ color: '#a1a1aa', fontWeight: 'bold', fontSize: '11px' }}
                    itemStyle={{ color: '#38BDF8', fontSize: '12px' }}
                    formatter={(value: any) => [`$${parseFloat(value).toLocaleString()}`, 'ยอดเงินคงเหลือ']}
                  />
                  <Area type="monotone" dataKey="balance" stroke="#38BDF8" strokeWidth={2} fillOpacity={1} fill="url(#colorBalance)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* PnL Individual Bars */}
        <div className="bg-[#0D1222] p-6 rounded-2xl border border-sky-500/15 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-sm text-zinc-200">กราฟประวัติกำไรขาดทุนรายไม้ (PnL Per Trade)</h3>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">ปริมาณขนาดและทิศทางผลตอบแทน</p>
            </div>
            <span className="text-[10px] bg-rose-500/15 text-rose-400 px-2 py-0.5 rounded font-mono font-bold">ANALYSIS</span>
          </div>

          <div className="h-72 w-full">
            {trades.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-500 text-xs font-mono">
                ไม่มีข้อมูลแสดงผล ให้ทำบันทึกเทรดก่อน
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <XAxis dataKey="name" stroke="#475569" fontSize={10} />
                  <YAxis stroke="#475569" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#080B15', borderColor: '#1E293B', borderRadius: '8px' }}
                    labelStyle={{ color: '#a1a1aa', fontSize: '11px' }}
                    itemStyle={{ fontSize: '12px' }}
                    formatter={(value: any) => [`$${parseFloat(value).toLocaleString()}`, 'กำไร/ขาดทุน']}
                  />
                  <Bar dataKey="PnL">
                    {barChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.PnL >= 0 ? '#38BDF8' : '#EF4444'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Technique Winrates + Emotions Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Technique Winrates Table (Quant Analysis) */}
        <div className="bg-[#0D1222] p-6 rounded-2xl border border-sky-500/15 shadow-2xl lg:col-span-7">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-sky-400" />
            <div>
              <h3 className="font-display font-bold text-sm text-zinc-200">วินเรทแยกตามเทคนิคที่ใช้ (Technique Performance)</h3>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">วัดผลว่าสัญญากลยุทธ์ไหนสร้างกำไรสูงสุด</p>
            </div>
          </div>

          {techniqueStats.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs font-mono">
              ยังไม่มีข้อมูลแยกประเภทเทคนิค กรุณาบันทึกไม้เทรดเพื่อทำการแยกสถิติ
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-sky-500/10 text-zinc-400 font-mono">
                    <th className="py-3 px-2">ชื่อเทคนิคการเทรด</th>
                    <th className="py-3 px-2 text-center">จำนวนครั้ง</th>
                    <th className="py-3 px-2 text-center">ชนะ-แพ้</th>
                    <th className="py-3 px-2 text-right">วินเรท (Winrate)</th>
                    <th className="py-3 px-2 text-right">กำไรรวม (USD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-500/10 font-sans">
                  {techniqueStats.map((tech) => (
                    <tr key={tech.name} className="hover:bg-[#080B15]/50 transition-colors">
                      <td className="py-3.5 px-2 font-semibold text-zinc-200">{tech.name}</td>
                      <td className="py-3.5 px-2 text-center font-mono text-zinc-400">{tech.count}</td>
                      <td className="py-3.5 px-2 text-center font-mono">
                        <span className="text-sky-400 font-semibold">{tech.wins}</span>
                        <span className="text-zinc-600 mx-1">/</span>
                        <span className="text-rose-400 font-semibold">{tech.losses}</span>
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <span className={`font-bold font-mono ${tech.winRate >= 60 ? 'text-sky-400' : tech.winRate >= 40 ? 'text-sky-300' : 'text-rose-400'}`}>
                          {tech.winRate.toFixed(0)}%
                        </span>
                      </td>
                      <td className={`py-3.5 px-2 text-right font-mono font-bold ${tech.totalPnL >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>
                        {tech.totalPnL >= 0 ? '+' : ''}${tech.totalPnL.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Emotion breakdown analysis */}
        <div className="bg-[#0D1222] p-6 rounded-2xl border border-sky-500/15 shadow-2xl lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-5 w-5 text-sky-400" />
              <div>
                <h3 className="font-display font-bold text-sm text-zinc-200">กราฟวิเคราะห์สภาวะทางอารมณ์ (Trader Psychology)</h3>
                <p className="text-[10px] text-zinc-400 font-mono mt-0.5">ตรวจสอบอารมณ์ส่วนใหญ่ที่คุณเปิดไม้</p>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              นักลงทุนชั้นยอดจะมีระเบียบวินัยทางอารมณ์ ค้นพบว่าอารมณ์แบบไหนทำกำไรได้ดีที่สุดสำหรับพอร์ตของคุณ
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Pie Chart visual */}
            <div className="h-44 w-full flex items-center justify-center">
              {emotionData.length === 0 ? (
                <div className="text-zinc-500 text-xs font-mono">ไม่มีข้อมูล</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={emotionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {emotionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* List labels */}
            <div className="space-y-2">
              {emotionData.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center sm:text-left">ใส่บันทึกอารมณ์ในไม้เพื่อวิเคราะห์</p>
              ) : (
                emotionData.map((emo) => (
                  <div key={emo.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: emo.color }} />
                      <span className="text-zinc-200 font-medium truncate max-w-[110px]">{emo.name}</span>
                    </div>
                    <span className="font-mono font-bold text-zinc-300 bg-[#080B15] px-1.5 py-0.2 rounded border border-sky-500/10">
                      {emo.value} ครั้ง
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
