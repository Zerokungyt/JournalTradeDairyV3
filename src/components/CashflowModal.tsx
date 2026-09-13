import React, { useState } from 'react';
import { 
  X, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Wallet, 
  Calendar, 
  DollarSign, 
  FileText, 
  Plus, 
  Trash2, 
  Sparkles,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';
import { CashflowRecord, CashflowType } from '../types';
import { dbService } from '../lib/db';
import { motion, AnimatePresence } from 'motion/react';

interface CashflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  cashflows: CashflowRecord[];
  onCashflowChange: () => void;
}

export default function CashflowModal({
  isOpen,
  onClose,
  userId,
  cashflows,
  onCashflowChange,
}: CashflowModalProps) {
  const [type, setType] = useState<CashflowType>('deposit');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [deletingCashflowId, setDeletingCashflowId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate totals
  const totalDeposits = cashflows
    .filter((c) => c.type === 'deposit')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalWithdrawals = cashflows
    .filter((c) => c.type === 'withdrawal')
    .reduce((sum, c) => sum + c.amount, 0);

  const netCashflow = totalDeposits - totalWithdrawals;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('กรุณากรอกจำนวนเงินที่ถูกต้อง (มากกว่า 0)');
      return;
    }

    if (!date) {
      setError('กรุณาระบุวันที่');
      return;
    }

    try {
      dbService.addCashflow({
        userId,
        date,
        type,
        amount: numAmount,
        note: note.trim() || (type === 'deposit' ? 'ฝากเงินเข้าพอร์ต' : 'ถอนเงินออกจากพอร์ต'),
      });

      setSuccess(`บันทึกการ${type === 'deposit' ? 'ฝากเงิน' : 'ถอนเงิน'} $${numAmount.toLocaleString()} สำเร็จ!`);
      setAmount('');
      setNote('');
      onCashflowChange();

      setTimeout(() => setSuccess(''), 2500);
    } catch (err: any) {
      setError('ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  const handleDelete = (id: string) => {
    dbService.deleteCashflow(id);
    setDeletingCashflowId(null);
    onCashflowChange();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-[#0F121E] border border-sky-500/20 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8"
      >
        {/* Accent Bar */}
        <div className="h-[3px] bg-gradient-to-r from-emerald-400 via-sky-500 to-indigo-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-sky-500/10 bg-[#0A0D18]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-zinc-100 flex items-center gap-2">
                แผนบันทึกการฝาก-ถอน (Cashflow Manager)
              </h2>
              <p className="text-xs text-zinc-400">
                บริหารสภาพคล่องเงินทุน ปรับเปลี่ยนยอดเงินฝากเข้าและถอนออกจริง
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#080B15] hover:bg-[#11172A] text-zinc-400 hover:text-sky-300 border border-sky-500/10 transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#080B15] border border-emerald-500/20 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <ArrowUpRight className="h-3.5 w-3.5" /> ยอดฝากเงินรวม (Total Deposit)
              </span>
              <p className="text-xl font-mono font-bold text-emerald-300">
                +${totalDeposits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-[#080B15] border border-rose-500/20 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider flex items-center gap-1">
                <ArrowDownRight className="h-3.5 w-3.5" /> ยอดถอนเงินรวม (Total Withdrawal)
              </span>
              <p className="text-xl font-mono font-bold text-rose-300">
                -${totalWithdrawals.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-[#080B15] border border-sky-500/20 rounded-2xl p-4 space-y-1">
              <span className="text-[10px] font-mono text-sky-400 uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" /> กระแสเงินสดสุทธิ (Net Cashflow)
              </span>
              <p className={`text-xl font-mono font-bold ${netCashflow >= 0 ? 'text-sky-300' : 'text-rose-400'}`}>
                {netCashflow >= 0 ? '+' : ''}${netCashflow.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/80 text-rose-300 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 rounded-xl text-xs font-semibold">
              {success}
            </div>
          )}

          {/* Add New Cashflow Form */}
          <form onSubmit={handleSubmit} className="bg-[#080B15] border border-sky-500/15 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> บันทึกการทำรายการใหม่
            </h3>

            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#05070E] rounded-xl border border-sky-500/10">
              <button
                type="button"
                onClick={() => setType('deposit')}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  type === 'deposit'
                    ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                    : 'text-zinc-400 hover:text-emerald-300'
                }`}
              >
                <ArrowUpCircle className="h-4 w-4" /> 🟢 ฝากเงินเข้า (Deposit)
              </button>
              <button
                type="button"
                onClick={() => setType('withdrawal')}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  type === 'withdrawal'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                    : 'text-zinc-400 hover:text-rose-300'
                }`}
              >
                <ArrowDownCircle className="h-4 w-4" /> 🔴 ถอนเงินออก (Withdrawal)
              </button>
            </div>

            {/* Form Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  จำนวนเงิน ($ USD)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="1000.00"
                    className="w-full bg-[#0F121E] border border-sky-500/15 focus:border-sky-400 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  วันที่ทำรายการ
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#0F121E] border border-sky-500/15 focus:border-sky-400 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
                หมายเหตุ / บันทึกเพิ่มเติม
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={type === 'deposit' ? 'เช่น เติมทุนเพิ่มรับเทรนด์ทองคำ' : 'เช่น ถอนกำไรสัปดาห์นี้'}
                  className="w-full bg-[#0F121E] border border-sky-500/15 focus:border-sky-400 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-2.5 font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                type === 'deposit'
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-zinc-950 hover:from-emerald-300 hover:to-teal-400 shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-rose-500 to-red-600 text-white hover:from-rose-400 hover:to-red-500 shadow-rose-500/20'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              บันทึกรายการ{type === 'deposit' ? 'ฝากเงิน' : 'ถอนเงิน'}
            </button>
          </form>

          {/* Cashflow History Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              ประวัติรายการฝาก-ถอน ({cashflows.length} รายการ)
            </h3>

            {cashflows.length === 0 ? (
              <div className="text-center py-8 bg-[#080B15]/50 rounded-2xl border border-dashed border-sky-500/10 text-zinc-500 text-xs">
                ยังไม่มีประวัติการฝากหรือถอนเงินในระบบ
              </div>
            ) : (
              <div className="space-y-2">
                {cashflows.map((cf) => (
                  <div
                    key={cf.id}
                    className="flex items-center justify-between p-3 bg-[#080B15] border border-sky-500/10 hover:border-sky-500/20 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold ${
                        cf.type === 'deposit' 
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                          : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                      }`}>
                        {cf.type === 'deposit' ? <ArrowUpCircle className="h-4 w-4" /> : <ArrowDownCircle className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${cf.type === 'deposit' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {cf.type === 'deposit' ? 'ฝากเงิน' : 'ถอนเงิน'}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500">{cf.date}</span>
                        </div>
                        <p className="text-[11px] text-zinc-400">{cf.note || '-'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-sm font-bold ${cf.type === 'deposit' ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {cf.type === 'deposit' ? '+' : '-'}${cf.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                      {deletingCashflowId === cf.id ? (
                        <div className="flex items-center gap-1 bg-rose-950/70 border border-rose-500/30 px-2 py-0.5 rounded-lg">
                          <span className="text-[10px] text-rose-300">ลบ?</span>
                          <button
                            type="button"
                            onClick={() => handleDelete(cf.id)}
                            className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold cursor-pointer"
                          >
                            ยืนยัน
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCashflowId(null)}
                            className="px-1.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] cursor-pointer"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeletingCashflowId(cf.id)}
                          className="p-1.5 text-zinc-600 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                          title="ลบรายการ"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
