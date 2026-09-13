import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Check, Trash2, Calendar } from 'lucide-react';
import { Trade, TradeEmotion } from '../types';
import { DEFAULT_TECHNIQUES, CHART_PRESETS } from '../lib/db';
import { motion } from 'motion/react';

interface TradeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trade: Omit<Trade, 'id' | 'createdAt'> & { id?: string }) => void;
  onDelete?: (tradeId: string) => void;
  selectedDate: string;
  userId: string;
  activeTrade?: Trade | null; // If provided, modal is in VIEW/EDIT mode
}

export default function TradeFormModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  selectedDate,
  userId,
  activeTrade,
}: TradeFormModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const isViewMode = !!activeTrade && !isEditing;

  // Form states
  const [date, setDate] = useState(selectedDate);
  const [technique, setTechnique] = useState(DEFAULT_TECHNIQUES[0]);
  const [tpInput, setTpInput] = useState<string>('100');
  const [slInput, setSlInput] = useState<string>('50');
  const [tradeResult, setTradeResult] = useState<'win' | 'loss'>('win');
  const [amountInput, setAmountInput] = useState<string>('1000');
  const [reason, setReason] = useState('');
  const [emotion, setEmotion] = useState<TradeEmotion>('calm');
  const [imageUrl, setImageUrl] = useState('');
  const [notes, setNotes] = useState('');

  // UI state
  const [isDragging, setIsDragging] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when modal opens or activeTrade changes
  useEffect(() => {
    setIsEditing(false); // Default to view mode if activeTrade exists
    setConfirmDelete(false); // Reset delete confirmation state
    setIsSaving(false);
    setSaveSuccess(false);
    setSaveError(null);
    if (activeTrade) {
      setDate(activeTrade.date);
      setTechnique(activeTrade.technique || DEFAULT_TECHNIQUES[0]);
      setTpInput(activeTrade.tp !== undefined ? String(activeTrade.tp) : '100');
      setSlInput(activeTrade.sl !== undefined ? String(activeTrade.sl) : '50');
      const isLoss = activeTrade.profitLoss < 0;
      setTradeResult(isLoss ? 'loss' : 'win');
      setAmountInput(String(Math.abs(activeTrade.profitLoss)));
      setReason(activeTrade.reason || '');
      setEmotion(activeTrade.emotion || 'calm');
      setImageUrl(activeTrade.imageUrl || '');
      setNotes(activeTrade.notes || '');
    } else {
      // Default reset for new trade
      setDate(selectedDate || new Date().toISOString().split('T')[0]);
      setTechnique(DEFAULT_TECHNIQUES[0]);
      setTpInput('100');
      setSlInput('50');
      setTradeResult('win');
      setAmountInput('1000');
      setReason('');
      setEmotion('calm');
      setImageUrl(CHART_PRESETS[0].url);
      setNotes('');
    }
  }, [activeTrade, selectedDate, isOpen]);

  if (!isOpen) return null;

  // Compress image to ensure it fits safely inside browser localStorage quota (<100KB)
  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxWidth = 900;
          const maxHeight = 900;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.75));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Convert uploaded image file to compressed base64
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file);
        if (compressed) setImageUrl(compressed);
      } catch (err) {
        console.warn('Error compressing image:', err);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file);
        if (compressed) setImageUrl(compressed);
      } catch (err) {
        console.warn('Error compressing image:', err);
      }
    }
  };

  // Submit handler with safe fallbacks and error handling
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (isSaving) return;

    try {
      setIsSaving(true);
      setSaveError(null);

      const cleanTechnique = (technique || '').trim() || DEFAULT_TECHNIQUES[0] || 'เทคนิคทั่วไป';
      const rawAmount = String(amountInput || '0').replace(/,/g, '').trim();
      const parsedAmount = Math.abs(parseFloat(rawAmount) || 0);
      const finalProfitLoss = tradeResult === 'win' ? parsedAmount : -parsedAmount;
      
      const rawTp = String(tpInput || '0').replace(/,/g, '').trim();
      const rawSl = String(slInput || '0').replace(/,/g, '').trim();
      const parsedTp = Math.abs(parseFloat(rawTp) || 0);
      const parsedSl = Math.abs(parseFloat(rawSl) || 0);
      
      const cleanDate = (date || selectedDate || new Date().toISOString().split('T')[0]).trim();

      onSave({
        id: activeTrade?.id,
        userId: userId || 'user_lukinn',
        date: cleanDate,
        technique: cleanTechnique,
        tp: parsedTp,
        sl: parsedSl,
        profitLoss: finalProfitLoss,
        reason: (reason || '').trim(),
        emotion: emotion || 'calm',
        imageUrl: imageUrl || '',
        notes: (notes || '').trim(),
      });

      setSaveSuccess(true);
      setTimeout(() => {
        setIsSaving(false);
        setSaveSuccess(false);
        onClose();
      }, 300);
    } catch (err: any) {
      console.error('Error saving trade:', err);
      setIsSaving(false);
      setSaveError(err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่');
    }
  };

  // Delete handler - uses in-UI confirmation instead of window.confirm which gets blocked in iframes
  const handleExecuteDelete = () => {
    if (activeTrade && onDelete) {
      onDelete(activeTrade.id);
      setConfirmDelete(false);
      onClose();
    }
  };

  const calculatedPnL = tradeResult === 'win'
    ? Math.abs(parseFloat(amountInput) || 0)
    : -Math.abs(parseFloat(amountInput) || 0);

  const viewPnL = activeTrade ? activeTrade.profitLoss : calculatedPnL;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.3 }}
        className="relative bg-[#0F0F12] border border-sky-500/20 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Top Sky Bar accent */}
        <div className="h-[3px] bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 shrink-0" />

        {/* Modal Header (Fixed at top) */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-sky-500/10 shrink-0 bg-[#0A0D18]/90">
          <div>
            <h2 className="font-display text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
              {isViewMode ? '🔍 รายละเอียดออเดอร์ไม้เทรด' : isEditing ? '✏️ แก้ไขข้อมูลออเดอร์ไม้เทรด' : '➕ บันทึกออเดอร์การเทรดใหม่'}
            </h2>
            <p className="text-xs font-mono text-zinc-400 mt-0.5">ประจำวันที่ {date}</p>
          </div>
          <div className="flex items-center gap-2">
            {activeTrade && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-400/30 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
              >
                ✏️ แก้ไขไม้เทรดนี้
              </button>
            )}
            {activeTrade && isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 bg-[#080B15] hover:bg-[#11172A] text-sky-400 border border-sky-500/20 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                ดูรายละเอียด
              </button>
            )}
            {activeTrade && onDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="p-2 rounded-xl bg-rose-950/20 hover:bg-rose-950/50 text-rose-400 hover:text-rose-300 border border-rose-900/30 transition-colors cursor-pointer"
                title="ลบไม้เทรดนี้"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-[#080B15] hover:bg-[#11172A] text-zinc-400 hover:text-sky-300 border border-sky-500/10 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Content Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          {/* Scrollable Body */}
          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
            {isViewMode ? (
              // ================= VIEW MODE =================
              <div className="space-y-6">
                {/* Main metrics overview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-[#080B15]/80 p-3.5 rounded-xl border border-sky-500/10 text-center">
                    <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">กำไร / ขาดทุน</p>
                    <p className={`text-base sm:text-lg font-bold mt-1 font-mono ${viewPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {viewPnL >= 0 ? '+' : '-'}${Math.abs(viewPnL).toLocaleString('en-US', { minimumFractionDigits: viewPnL % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-[#080B15]/80 p-3.5 rounded-xl border border-sky-500/10 text-center">
                    <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">อารมณ์เข้าเทรด</p>
                    <p className="text-xs sm:text-sm font-semibold text-zinc-200 mt-1 flex items-center justify-center gap-1.5">
                      <span>
                        {emotion === 'fear' && '😨 กลัว'}
                        {emotion === 'overconfident' && '😎 มั่นใจเกิน'}
                        {emotion === 'calm' && '🧘 สงบ'}
                        {emotion === 'greedy' && '🤑 โลภ'}
                        {emotion === 'patient' && '⏳ ใจเย็น'}
                        {emotion === 'other' && '😐 อื่น ๆ'}
                      </span>
                    </p>
                  </div>
                  <div className="bg-[#080B15]/80 p-3.5 rounded-xl border border-sky-500/10 text-center">
                    <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Take Profit (TP)</p>
                    <p className="text-xs sm:text-sm font-semibold text-sky-400 mt-1 font-mono">{activeTrade ? activeTrade.tp : tpInput} pips</p>
                  </div>
                  <div className="bg-[#080B15]/80 p-3.5 rounded-xl border border-sky-500/10 text-center">
                    <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Stop Loss (SL)</p>
                    <p className="text-xs sm:text-sm font-semibold text-zinc-300 mt-1 font-mono">{activeTrade ? activeTrade.sl : slInput} pips</p>
                  </div>
                </div>

                {/* Technique & Reason */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-mono text-zinc-400 uppercase tracking-wider">เทคนิคที่ใช้เข้าเทรด</h4>
                      <p className="text-zinc-200 font-semibold mt-1 bg-[#080B15]/60 border border-sky-500/10 px-3 py-2 rounded-lg">
                        {activeTrade?.technique}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs font-mono text-zinc-400 uppercase tracking-wider">สาเหตุ / แผนการเข้าเทรด</h4>
                      <div className="text-zinc-300 text-sm mt-1 bg-[#080B15]/60 border border-sky-500/10 px-3 py-2 rounded-lg min-h-[70px] whitespace-pre-wrap">
                        {reason || 'ไม่ได้ระบุ'}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-mono text-zinc-400 uppercase tracking-wider">บันทึกเพิ่มเติม (Notes)</h4>
                      <div className="text-zinc-300 text-sm mt-1 bg-[#080B15]/60 border border-sky-500/10 px-3 py-2 rounded-lg min-h-[50px] whitespace-pre-wrap">
                        {notes || 'ไม่ได้บันทึกโน้ตไว้'}
                      </div>
                    </div>
                  </div>

                  {/* Uploaded Chart Screenshot */}
                  <div className="flex flex-col">
                    <h4 className="text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">ภาพแคปหน้าจอกราฟ</h4>
                    {imageUrl ? (
                      <div className="flex-1 relative rounded-xl overflow-hidden bg-[#080B15] border border-sky-500/10 flex items-center justify-center min-h-[180px]">
                        <img
                          src={imageUrl}
                          alt="Trade screenshot"
                          className="max-h-[260px] w-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="flex-1 border border-dashed border-sky-500/10 rounded-xl flex items-center justify-center min-h-[180px] text-zinc-500 bg-[#080B15]">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // ================= CREATE / EDIT MODE =================
              <div className="space-y-5">
                {/* Row 0: Date selector & Technique entry */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-sky-400" /> วันที่เข้าเทรด
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-[#080B15] border border-sky-500/15 focus:border-sky-400 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
                      เทคนิคที่ใช้เข้าเทรด
                    </label>
                    <input
                      type="text"
                      value={technique}
                      onChange={(e) => setTechnique(e.target.value)}
                      placeholder="เช่น EMA Bounce + SR Flip, SMC Order Block..."
                      className="w-full bg-[#080B15] border border-sky-500/15 focus:border-sky-400 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-sky-400 font-sans"
                    />
                  </div>
                </div>

                {/* Quick suggestion chips */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">เทคนิคยอดนิยม (คลิกเลือกได้ทันที):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {DEFAULT_TECHNIQUES.map((tech) => {
                      const isSelected = technique === tech;
                      return (
                        <button
                          key={tech}
                          type="button"
                          onClick={() => setTechnique(tech)}
                          className={`px-2.5 py-1 text-[11px] rounded-full transition-all border cursor-pointer ${
                            isSelected
                              ? 'bg-sky-500/15 border-sky-400 text-sky-300 font-medium'
                              : 'bg-[#080B15] border-sky-500/10 hover:border-sky-400/30 hover:text-zinc-200 text-zinc-400'
                          }`}
                        >
                          {tech}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Row 2: Trade Result Choice (Win/Loss) */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
                    ผลการเทรด (เลือกชนะ/แพ้ ออโต้เครื่องหมาย +/-)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTradeResult('win')}
                      className={`py-2.5 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        tradeResult === 'win'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                          : 'bg-[#080B15] text-zinc-400 border-sky-500/10 hover:border-emerald-500/30'
                      }`}
                    >
                      <span className="text-base">🏆</span>
                      <span>ชนะ (Win / กำไร)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTradeResult('loss')}
                      className={`py-2.5 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        tradeResult === 'loss'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                          : 'bg-[#080B15] text-zinc-400 border-sky-500/10 hover:border-rose-500/30'
                      }`}
                    >
                      <span className="text-base">❌</span>
                      <span>แพ้ (Loss / ขาดทุน)</span>
                    </button>
                  </div>
                </div>

                {/* Row 3: Amount, TP, SL */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
                      จำนวนเงิน <span className="text-zinc-500">(USD)</span>
                    </label>
                    <div className="relative">
                      <span className={`absolute left-3 top-2 font-mono text-sm font-bold ${
                        tradeResult === 'win' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {tradeResult === 'win' ? '+$' : '-$'}
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={amountInput}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/[^0-9.]/g, '');
                          const parts = cleaned.split('.');
                          if (parts.length > 2) return;
                          setAmountInput(cleaned);
                        }}
                        placeholder="เช่น 1000"
                        className={`w-full bg-[#080B15] border border-sky-500/15 focus:border-sky-400 rounded-xl pl-9 pr-14 py-2 text-sm focus:outline-none font-mono font-bold ${
                          tradeResult === 'win' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      />
                      <div className="absolute right-2.5 top-2 flex items-center">
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                          tradeResult === 'win' ? 'text-emerald-300 bg-emerald-500/15' : 'text-rose-300 bg-rose-500/15'
                        }`}>
                          {tradeResult === 'win' ? 'WIN' : 'LOSS'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
                      Take Profit (TP) <span className="text-zinc-500 text-[10px]">(pips)</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={tpInput}
                      onChange={(e) => setTpInput(e.target.value.replace(/[^0-9.]/g, ''))}
                      placeholder="100"
                      className="w-full bg-[#080B15] border border-sky-500/15 focus:border-sky-400 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
                      Stop Loss (SL) <span className="text-zinc-500 text-[10px]">(pips)</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={slInput}
                      onChange={(e) => setSlInput(e.target.value.replace(/[^0-9.]/g, ''))}
                      placeholder="50"
                      className="w-full bg-[#080B15] border border-sky-500/15 focus:border-sky-400 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Row 4: Emotion selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
                    อารมณ์ขณะเปิดออเดอร์ (Emotion)
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[
                      { id: 'fear', name: '😨 กลัว', desc: 'กลัวตกรถ/กลัวขาดทุน' },
                      { id: 'overconfident', name: '😎 มั่นใจเกิน', desc: 'โอเวอร์เทรด/คิดว่าชนะชัวร์' },
                      { id: 'calm', name: '🧘 สงบ', desc: 'เทรดตามระบบสบายใจ' },
                      { id: 'greedy', name: '🤑 โลภ', desc: 'อยากได้คืน/อยากบวกเพิ่ม' },
                      { id: 'patient', name: '⏳ ใจเย็น', desc: 'รอตามแผนอย่างมีวินัย' },
                      { id: 'other', name: '😐 อื่นๆ', desc: 'สับสน/เทรดเบื่อๆ' },
                    ].map((emo) => (
                      <button
                        key={emo.id}
                        type="button"
                        onClick={() => setEmotion(emo.id as TradeEmotion)}
                        title={emo.desc}
                        className={`py-2 px-1 rounded-xl text-center text-xs flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                          emotion === emo.id
                            ? 'bg-sky-500/15 text-sky-300 border-sky-400 shadow-sm font-semibold'
                            : 'bg-[#080B15]/80 text-zinc-400 border-sky-500/10 hover:bg-[#10172A] hover:text-zinc-200'
                        }`}
                      >
                        <span>{emo.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Row 5: Reason & Notes (Optional - never blocking) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
                      สาเหตุ / แผนการเข้าเทรด <span className="text-zinc-500 text-[10px] font-sans normal-case">(ไม่บังคับ)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="เช่น ชนแนวต้าน H4 เกิด RSI Divergence หรือปล่อยว่างได้..."
                      className="w-full bg-[#080B15] border border-sky-500/15 focus:border-sky-400 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-sky-400 font-sans resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
                      บันทึกเพิ่มเติม (Notes) <span className="text-zinc-500 text-[10px] font-sans normal-case">(ไม่บังคับ)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="เช่น ปิดก่อนข่าว หรือ เลื่อน SL กันหน้าทุน..."
                      className="w-full bg-[#080B15] border border-sky-500/15 focus:border-sky-400 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-sky-400 font-sans resize-none"
                    />
                  </div>
                </div>

                {/* Row 6: Screenshot Attachment */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider">
                      แนบรูปภาพกราฟวิเคราะห์ <span className="text-zinc-500 text-[10px] font-sans normal-case">(ไม่บังคับ)</span>
                    </label>
                    <span className="text-[10px] text-sky-400 font-mono font-medium">เลือกจากเทมเพลต หรือ ลากไฟล์</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Preset Choice */}
                    <div className="md:col-span-1 space-y-1.5">
                      <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">ภาพกราฟยอดนิยม</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {CHART_PRESETS.map((p) => (
                          <button
                            key={p.name}
                            type="button"
                            onClick={() => setImageUrl(p.url)}
                            className={`relative h-12 rounded-lg overflow-hidden border bg-[#080B15] transition-all cursor-pointer ${
                              imageUrl === p.url ? 'border-sky-400 ring-1 ring-sky-400' : 'border-sky-500/10 hover:border-sky-400/40'
                            }`}
                          >
                            <img
                              src={p.url}
                              alt={p.name}
                              className="h-full w-full object-cover opacity-60 hover:opacity-90"
                              referrerPolicy="no-referrer"
                            />
                            <span className="absolute bottom-0.5 inset-x-0.5 text-[8px] font-semibold bg-black/70 py-0.5 rounded text-center truncate text-zinc-300">
                              {p.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Drag-n-Drop File Area */}
                    <div className="md:col-span-2">
                      <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">อัปโหลดภาพ หรือ วาง URL ที่นี่</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`border border-dashed rounded-xl flex flex-col items-center justify-center p-2.5 text-center cursor-pointer min-h-[90px] transition-all ${
                            isDragging
                              ? 'border-sky-400 bg-sky-500/10 text-sky-300'
                              : 'border-sky-500/10 bg-[#080B15]/40 text-zinc-400 hover:border-sky-400/40 hover:text-zinc-200'
                          }`}
                        >
                          <Upload className="h-4 w-4 mb-1 text-sky-400" />
                          <span className="text-[10px] font-medium">ลากไฟล์มาที่นี่ หรือคลิกอัปโหลด</span>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                          />
                        </div>

                        {/* URL input / Preview */}
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="วางลิงก์รูปภาพ (URL)"
                            className="w-full bg-[#080B15] border border-sky-500/15 focus:border-sky-400 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none"
                          />
                          {imageUrl ? (
                            <div className="relative h-14 w-full rounded-lg overflow-hidden bg-[#080B15] border border-sky-500/10 flex items-center justify-center">
                              <img
                                src={imageUrl}
                                alt="trade setup preview"
                                className="h-full w-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <button
                                type="button"
                                onClick={() => setImageUrl('')}
                                className="absolute top-1 right-1 p-0.5 rounded bg-black/60 hover:bg-rose-500 text-zinc-400 hover:text-white transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="h-14 w-full rounded-lg border border-sky-500/10 bg-[#080B15]/40 flex items-center justify-center text-zinc-600 text-[11px] font-mono">
                              ไม่มีภาพตัวอย่าง
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions Footer (FIXED at bottom, ALWAYS visible) */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 px-5 sm:px-6 border-t border-sky-500/15 bg-[#0A0D18] shrink-0">
            {confirmDelete ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-2 p-2 bg-rose-950/40 border border-rose-500/30 rounded-xl">
                <div className="flex items-center gap-2 px-1 text-xs text-rose-300 font-semibold">
                  <Trash2 className="h-4 w-4 text-rose-400 shrink-0" />
                  <span>คุณแน่ใจหรือไม่ที่จะลบไม้เทรดนี้? (ไม่สามารถกู้คืนได้)</span>
                </div>
                <div className="flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-3.5 py-1.5 bg-[#080B15] hover:bg-[#11172A] text-zinc-300 border border-sky-500/10 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteDelete}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-rose-600/30 cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    ยืนยันลบไม้
                  </button>
                </div>
              </div>
            ) : isViewMode ? (
              <>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-400/30 transition-colors text-xs font-semibold cursor-pointer"
                  >
                    ✏️ แก้ไขข้อมูลไม้เทรด
                  </button>
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950/20 hover:bg-rose-950/50 text-rose-400 border border-rose-900/50 hover:border-rose-800 transition-colors text-xs font-semibold cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      ลบไม้
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-[#080B15] hover:bg-[#11172A] text-zinc-300 border border-sky-500/10 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (isEditing) {
                        setIsEditing(false); // Return to view mode
                      } else {
                        onClose(); // Close modal
                      }
                    }}
                    className="px-4 sm:px-5 py-2 bg-[#080B15] hover:bg-[#11172A] text-zinc-300 border border-sky-500/10 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                  >
                    {isEditing ? 'ยกเลิกการแก้ไข' : 'ยกเลิก'}
                  </button>
                  {isEditing && activeTrade && onDelete && (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/20 hover:bg-rose-950/50 text-rose-400 border border-rose-900/50 hover:border-rose-800 transition-colors text-xs font-semibold cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      ลบไม้
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {saveError && (
                    <span className="text-[11px] text-rose-400 font-medium">
                      ⚠️ {saveError}
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={isSaving}
                    onClick={(e) => {
                      handleSubmit(e);
                    }}
                    className={`flex items-center gap-1.5 px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-lg transition-all cursor-pointer ${
                      saveSuccess
                        ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                        : 'bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 hover:from-sky-300 hover:to-blue-400 text-zinc-950 shadow-sky-500/20 hover:shadow-sky-500/30 active:scale-95'
                    }`}
                  >
                    {saveSuccess ? (
                      <>
                        <Check className="h-4 w-4 stroke-[3]" />
                        บันทึกสำเร็จ!
                      </>
                    ) : isSaving ? (
                      <>
                        <div className="h-4 w-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                        กำลังบันทึก...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 stroke-[3]" />
                        {isEditing ? 'บันทึกการแก้ไขไม้เทรด' : 'บันทึกไม้เทรดลงสมุด'}
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
