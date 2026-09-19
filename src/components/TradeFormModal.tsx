import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Calendar, Check, ChevronDown, Image as ImageIcon, Pencil, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { motion } from 'motion/react';
import { Trade, TradeDirection, TradeEmotion, TradeEntryStyle, TradeOutcome } from '../types';
import {
  EXIT_TYPES,
  OPTIONAL_CONFIRMATIONS,
  OUTCOME_LABELS,
  TRADE_TECHNIQUES,
  TRADE_TIMEFRAMES,
  getPriceKeysForTechnique,
  getTradeOutcome,
  getTradePriceKey,
  getTradeTechnique,
} from '../lib/tradeTaxonomy';

interface TradeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trade: Omit<Trade, 'id' | 'createdAt'> & { id?: string }) => void;
  onDelete?: (tradeId: string) => void;
  selectedDate: string;
  userId: string;
  activeTrade?: Trade | null;
}

const EMOTIONS: { id: TradeEmotion; code: string; name: string }[] = [
  { id: 'fear', code: 'FR', name: 'กลัว' },
  { id: 'overconfident', code: 'OC', name: 'มั่นใจเกิน' },
  { id: 'calm', code: 'CL', name: 'สงบ' },
  { id: 'greedy', code: 'GR', name: 'โลภ' },
  { id: 'patient', code: 'PT', name: 'ใจเย็น' },
  { id: 'other', code: 'OT', name: 'อื่น ๆ' },
];

const OUTCOMES: TradeOutcome[] = ['win', 'loss', 'breakeven', 'breakeven_plus'];
const fieldClass = 'w-full border border-white/10 bg-[#0b0c0a] px-3 py-2.5 text-sm text-stone-100 outline-none transition focus:border-[#c7a76a]/70';

function parseOptionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function outcomeTone(outcome: TradeOutcome) {
  if (outcome === 'win') return 'border-emerald-400/60 bg-emerald-500/10 text-emerald-300';
  if (outcome === 'loss') return 'border-rose-400/60 bg-rose-500/10 text-rose-300';
  return 'border-[#c7a76a]/60 bg-[#c7a76a]/10 text-[#d9bc82]';
}

export default function TradeFormModal({ isOpen, onClose, onSave, onDelete, selectedDate, userId, activeTrade }: TradeFormModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const isViewMode = !!activeTrade && !isEditing;
  const [date, setDate] = useState(selectedDate);
  const [technique, setTechnique] = useState<string>(TRADE_TECHNIQUES[0]);
  const [customTechnique, setCustomTechnique] = useState('');
  const [setup, setSetup] = useState(getPriceKeysForTechnique(TRADE_TECHNIQUES[0])[0]);
  const [customSetup, setCustomSetup] = useState('');
  const [direction, setDirection] = useState<TradeDirection>('buy');
  const [timeframe, setTimeframe] = useState('M15');
  const [entryStyle, setEntryStyle] = useState<TradeEntryStyle>('direct');
  const [confirmations, setConfirmations] = useState<string[]>([]);
  const [tpInput, setTpInput] = useState('1000');
  const [slInput, setSlInput] = useState('250');
  const [outcome, setOutcome] = useState<TradeOutcome>('win');
  const [exitType, setExitType] = useState(EXIT_TYPES[0]);
  const [amountInput, setAmountInput] = useState('0');
  const [realizedR, setRealizedR] = useState('');
  const [mfe, setMfe] = useState('');
  const [mae, setMae] = useState('');
  const [reason, setReason] = useState('');
  const [emotion, setEmotion] = useState<TradeEmotion>('calm');
  const [imageUrl, setImageUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [researchOpen, setResearchOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsEditing(false);
    setConfirmDelete(false);
    setIsSaving(false);
    setSaveSuccess(false);
    setSaveError(null);
    setResearchOpen(false);
    if (activeTrade) {
      const savedTechnique = getTradeTechnique(activeTrade);
      const isTechniquePreset = (TRADE_TECHNIQUES as readonly string[]).includes(savedTechnique);
      const normalizedTechnique = isTechniquePreset ? savedTechnique : 'อื่น ๆ';
      const savedSetup = getTradePriceKey(activeTrade);
      const isSetupPreset = getPriceKeysForTechnique(normalizedTechnique).includes(savedSetup);
      setDate(activeTrade.date);
      setTechnique(normalizedTechnique);
      setCustomTechnique(isTechniquePreset ? '' : savedTechnique);
      setSetup(isSetupPreset ? savedSetup : 'อื่น ๆ');
      setCustomSetup(isSetupPreset ? '' : savedSetup);
      setDirection(activeTrade.direction || 'buy');
      setTimeframe(activeTrade.timeframe || 'M15');
      setEntryStyle(activeTrade.entryStyle || 'direct');
      setConfirmations(activeTrade.confirmations || []);
      setTpInput(String(activeTrade.tp ?? 1000));
      setSlInput(String(activeTrade.sl ?? 250));
      setOutcome(getTradeOutcome(activeTrade));
      setExitType(activeTrade.exitType || EXIT_TYPES[0]);
      setAmountInput(String(Math.abs(activeTrade.profitLoss)));
      setRealizedR(activeTrade.realizedR === undefined ? '' : String(activeTrade.realizedR));
      setMfe(activeTrade.mfe === undefined ? '' : String(activeTrade.mfe));
      setMae(activeTrade.mae === undefined ? '' : String(activeTrade.mae));
      setReason(activeTrade.reason || '');
      setEmotion(activeTrade.emotion || 'calm');
      setImageUrl(activeTrade.imageUrl || '');
      setNotes(activeTrade.notes || '');
    } else {
      setDate(selectedDate || new Date().toISOString().split('T')[0]);
      setTechnique(TRADE_TECHNIQUES[0]); setCustomTechnique('');
      setSetup(getPriceKeysForTechnique(TRADE_TECHNIQUES[0])[0]); setCustomSetup(''); setDirection('buy'); setTimeframe('M15');
      setEntryStyle('direct'); setConfirmations([]); setTpInput('1000'); setSlInput('250');
      setOutcome('win'); setExitType(EXIT_TYPES[0]); setAmountInput('0'); setRealizedR('');
      setMfe(''); setMae(''); setReason(''); setEmotion('calm'); setImageUrl(''); setNotes('');
    }
  }, [activeTrade, selectedDate, isOpen]);

  if (!isOpen) return null;

  const compressImageFile = (file: File): Promise<string> => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 900 / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const context = canvas.getContext('2d');
        if (!context) return resolve(String(event.target?.result || ''));
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = () => resolve(String(event.target?.result || ''));
      img.src = String(event.target?.result || '');
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });

  const receiveImage = async (file?: File) => {
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      if (compressed) setImageUrl(compressed);
    } catch (error) {
      console.warn('Error compressing image:', error);
    }
  };

  const toggleConfirmation = (value: string) => setConfirmations((current) => current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value]);

  const selectOutcome = (value: TradeOutcome) => {
    setOutcome(value);
    if (value === 'breakeven') setAmountInput('0');
  };

  const handleTechniqueChange = (value: string) => {
    setTechnique(value);
    setCustomTechnique('');
    setSetup(getPriceKeysForTechnique(value)[0]);
    setCustomSetup('');
  };

  const priceKeyOptions = getPriceKeysForTechnique(technique);
  const cleanTechnique = technique === 'อื่น ๆ' ? customTechnique.trim() || 'อื่น ๆ' : technique;
  const cleanSetup = setup === 'อื่น ๆ' ? customSetup.trim() || 'อื่น ๆ' : setup;
  const tp = Math.abs(Number(tpInput.replace(/,/g, '')) || 0);
  const sl = Math.abs(Number(slInput.replace(/,/g, '')) || 0);
  const plannedRrr = sl > 0 ? tp / sl : 0;
  const absoluteAmount = Math.abs(Number(amountInput.replace(/,/g, '')) || 0);
  const calculatedPnL = outcome === 'loss' ? -absoluteAmount : outcome === 'breakeven' ? 0 : absoluteAmount;
  const viewPnL = activeTrade ? activeTrade.profitLoss : calculatedPnL;

  const handleSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    event?.stopPropagation();
    if (isSaving) return;
    try {
      setIsSaving(true);
      setSaveError(null);
      onSave({
        id: activeTrade?.id, userId: userId || 'local_owner', date: date || selectedDate,
        technique: cleanTechnique, strategy: cleanTechnique, setup: cleanSetup, direction, timeframe, entryStyle, confirmations,
        tp, sl, outcome, exitType, profitLoss: calculatedPnL,
        realizedR: parseOptionalNumber(realizedR), mfe: parseOptionalNumber(mfe), mae: parseOptionalNumber(mae),
        reason: reason.trim(), emotion, imageUrl, notes: notes.trim(),
      });
      setSaveSuccess(true);
      setTimeout(() => { setIsSaving(false); setSaveSuccess(false); onClose(); }, 300);
    } catch (error) {
      setIsSaving(false);
      setSaveError(error instanceof Error ? error.message : 'บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่');
    }
  };

  const executeDelete = () => {
    if (!activeTrade || !onDelete) return;
    onDelete(activeTrade.id);
    setConfirmDelete(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-3 backdrop-blur-sm sm:p-5">
      <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.22 }} className="relative flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden border border-white/10 bg-[#0f100e]">
        <div className="h-px shrink-0 bg-[#c7a76a]" />
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 bg-[#0b0c0a] px-4 py-4 sm:px-6">
          <div>
            <p className="editorial-kicker">Trade record</p>
            <h2 className="mt-2 flex items-center gap-2 font-display text-xl font-normal text-stone-100">
              {isViewMode ? <Search className="h-4 w-4 text-[#c7a76a]" /> : isEditing ? <Pencil className="h-4 w-4 text-[#c7a76a]" /> : <Plus className="h-4 w-4 text-[#c7a76a]" />}
              {isViewMode ? 'รายละเอียดไม้เทรด' : isEditing ? 'แก้ไขไม้เทรด' : 'บันทึกไม้เทรด'}
            </h2>
            <p className="mt-1 font-mono text-[10px] text-stone-500">{date} · {cleanTechnique} · {cleanSetup}</p>
          </div>
          <div className="flex items-center gap-2">
            {activeTrade && !isEditing && <button type="button" onClick={() => setIsEditing(true)} className="border border-[#c7a76a]/35 px-3 py-2 text-xs text-[#d9bc82] transition hover:bg-[#c7a76a]/10">แก้ไข</button>}
            <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center border border-white/10 text-stone-500 transition hover:border-white/25 hover:text-stone-100" aria-label="ปิด"><X className="h-4 w-4" /></button>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {isViewMode ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-5">
                  <div className="bg-[#0d0e0c] p-4"><p className="font-mono text-[9px] uppercase tracking-wider text-stone-500">Technique</p><p className="mt-2 text-sm font-medium text-stone-100">{cleanTechnique}</p></div>
                  <div className="bg-[#0d0e0c] p-4"><p className="font-mono text-[9px] uppercase tracking-wider text-stone-500">Price Key</p><p className="mt-2 text-sm font-medium text-stone-100">{cleanSetup}</p></div>
                  <div className="bg-[#0d0e0c] p-4"><p className="font-mono text-[9px] uppercase tracking-wider text-stone-500">Outcome</p><p className={`mt-2 font-mono text-sm font-medium ${outcome === 'loss' ? 'text-rose-300' : outcome === 'win' ? 'text-emerald-300' : 'text-[#d9bc82]'}`}>{OUTCOME_LABELS[outcome]}</p></div>
                  <div className="bg-[#0d0e0c] p-4"><p className="font-mono text-[9px] uppercase tracking-wider text-stone-500">Realized P&amp;L</p><p className={`mt-2 font-mono text-sm font-medium ${viewPnL < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>{viewPnL >= 0 ? '+' : '-'}${Math.abs(viewPnL).toLocaleString('en-US', { maximumFractionDigits: 2 })}</p></div>
                  <div className="bg-[#0d0e0c] p-4"><p className="font-mono text-[9px] uppercase tracking-wider text-stone-500">Planned RRR</p><p className="mt-2 font-mono text-sm font-medium text-[#d9bc82]">1 : {plannedRrr.toFixed(2)}</p></div>
                </div>
                <div className="grid gap-5 md:grid-cols-[1fr_1.15fr]">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="border-l border-[#c7a76a]/35 pl-3"><p className="font-mono text-[9px] uppercase text-stone-500">Direction</p><p className="mt-1 text-stone-200">{direction.toUpperCase()}</p></div>
                      <div className="border-l border-[#c7a76a]/35 pl-3"><p className="font-mono text-[9px] uppercase text-stone-500">Entry</p><p className="mt-1 text-stone-200">{entryStyle === 'direct' ? 'Direct entry' : 'Confirmed entry'}</p></div>
                      <div className="border-l border-[#c7a76a]/35 pl-3"><p className="font-mono text-[9px] uppercase text-stone-500">Key timeframe</p><p className="mt-1 text-stone-200">{timeframe}</p></div>
                      <div className="border-l border-[#c7a76a]/35 pl-3"><p className="font-mono text-[9px] uppercase text-stone-500">Exit</p><p className="mt-1 text-stone-200">{exitType || 'ไม่ได้ระบุ'}</p></div>
                    </div>
                    <div><p className="font-mono text-[9px] uppercase text-stone-500">Optional confirmation</p><div className="mt-2 flex flex-wrap gap-1.5">{confirmations.length ? confirmations.map((item) => <span key={item} className="border border-white/10 px-2 py-1 text-[10px] text-stone-300">{item}</span>) : <span className="text-xs text-stone-600">Direct entry · ไม่มี confirmation</span>}</div></div>
                    <div><p className="font-mono text-[9px] uppercase text-stone-500">Entry thesis</p><p className="mt-2 whitespace-pre-wrap border border-white/10 bg-[#0b0c0a] p-3 text-sm leading-6 text-stone-300">{reason || 'ไม่ได้ระบุ'}</p></div>
                    <div><p className="font-mono text-[9px] uppercase text-stone-500">Research note</p><p className="mt-2 whitespace-pre-wrap border border-white/10 bg-[#0b0c0a] p-3 text-sm leading-6 text-stone-300">{notes || 'ไม่ได้ระบุ'}</p></div>
                  </div>
                  <div><p className="mb-2 font-mono text-[9px] uppercase text-stone-500">Chart evidence</p>{imageUrl ? <img src={imageUrl} alt="Trade chart" className="max-h-[380px] w-full border border-white/10 bg-[#0b0c0a] object-contain" /> : <div className="grid min-h-[230px] place-items-center border border-dashed border-white/10 text-stone-700"><ImageIcon className="h-8 w-8" /></div>}</div>
                </div>
              </div>
            ) : (
              <div className="space-y-7">
                <section className="space-y-4">
                  <div className="flex flex-wrap items-baseline gap-3"><span className="font-mono text-[10px] text-[#c7a76a]">01</span><h3 className="text-sm font-medium text-stone-100">Technique &amp; Price Key</h3><span className="text-xs text-stone-600">เลือกศาสตร์หลักก่อน แล้วระบุโมเดลที่ใช้เข้าไม้</span></div>
                  <div className="grid gap-4 sm:grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)]">
                    <label className="space-y-1.5"><span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-stone-500"><Calendar className="h-3 w-3" /> วันที่</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className={fieldClass} /></label>
                    <label className="space-y-1.5"><span className="font-mono text-[9px] uppercase tracking-wider text-stone-500">Technique</span><select value={technique} onChange={(event) => handleTechniqueChange(event.target.value)} className={fieldClass}>{TRADE_TECHNIQUES.map((item) => <option key={item}>{item}</option>)}</select></label>
                    <label className="space-y-1.5"><span className="font-mono text-[9px] uppercase tracking-wider text-stone-500">Price Key / Entry model</span><select value={setup} onChange={(event) => { setSetup(event.target.value); setCustomSetup(''); }} className={fieldClass}>{priceKeyOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
                  </div>
                  {(technique === 'อื่น ๆ' || setup === 'อื่น ๆ') && <div className="grid gap-4 sm:grid-cols-2">
                    {technique === 'อื่น ๆ' && <label className="block space-y-1.5"><span className="font-mono text-[9px] uppercase tracking-wider text-stone-500">ชื่อ Technique</span><input value={customTechnique} onChange={(event) => setCustomTechnique(event.target.value)} placeholder="ระบุชื่อศาสตร์หรือระบบหลัก" className={fieldClass} /></label>}
                    {setup === 'อื่น ๆ' && <label className="block space-y-1.5"><span className="font-mono text-[9px] uppercase tracking-wider text-stone-500">ชื่อ Price Key</span><input value={customSetup} onChange={(event) => setCustomSetup(event.target.value)} placeholder="ระบุชื่อ Entry model" className={fieldClass} /></label>}
                  </div>}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5"><span className="font-mono text-[9px] uppercase tracking-wider text-stone-500">Direction</span><div className="grid grid-cols-2 gap-2">{(['buy', 'sell'] as TradeDirection[]).map((item) => <button key={item} type="button" onClick={() => setDirection(item)} className={`border px-3 py-2.5 text-xs font-medium uppercase transition ${direction === item ? 'border-[#c7a76a] bg-[#c7a76a]/10 text-stone-100' : 'border-white/10 text-stone-500 hover:text-stone-200'}`}>{item}</button>)}</div></div>
                    <label className="space-y-1.5"><span className="font-mono text-[9px] uppercase tracking-wider text-stone-500">Key timeframe</span><select value={timeframe} onChange={(event) => setTimeframe(event.target.value)} className={fieldClass}>{TRADE_TIMEFRAMES.map((item) => <option key={item}>{item}</option>)}</select></label>
                    <div className="space-y-1.5"><span className="font-mono text-[9px] uppercase tracking-wider text-stone-500">Entry style</span><div className="grid grid-cols-2 gap-2">{(['direct', 'confirmed'] as TradeEntryStyle[]).map((item) => <button key={item} type="button" onClick={() => setEntryStyle(item)} className={`border px-2 py-2.5 text-xs transition ${entryStyle === item ? 'border-[#c7a76a] bg-[#c7a76a]/10 text-stone-100' : 'border-white/10 text-stone-500 hover:text-stone-200'}`}>{item === 'direct' ? 'Direct' : 'Confirmed'}</button>)}</div></div>
                  </div>
                </section>

                <section className="space-y-4 border-t border-white/10 pt-6">
                  <div className="flex flex-wrap items-baseline gap-3"><span className="font-mono text-[10px] text-[#c7a76a]">02</span><h3 className="text-sm font-medium text-stone-100">Plan & outcome</h3><span className="text-xs text-stone-600">เก็บแผนเดิมแยกจากผลจริง</span></div>
                  <div className="grid gap-3 sm:grid-cols-[1fr_1fr_170px]">
                    <label className="space-y-1.5"><span className="font-mono text-[9px] uppercase tracking-wider text-stone-500">Initial SL · points</span><input inputMode="decimal" value={slInput} onChange={(event) => setSlInput(event.target.value.replace(/[^0-9.]/g, ''))} className={fieldClass} /></label>
                    <label className="space-y-1.5"><span className="font-mono text-[9px] uppercase tracking-wider text-stone-500">Initial TP · points</span><input inputMode="decimal" value={tpInput} onChange={(event) => setTpInput(event.target.value.replace(/[^0-9.]/g, ''))} className={fieldClass} /></label>
                    <div className="border-l-2 border-[#c7a76a] bg-[#c7a76a]/[.05] px-4 py-3"><p className="font-mono text-[9px] uppercase text-stone-500">Planned RRR</p><p className="mt-1 font-mono text-lg text-[#d9bc82]">1 : {plannedRrr.toFixed(2)}</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{OUTCOMES.map((item) => <button key={item} type="button" onClick={() => selectOutcome(item)} className={`border px-3 py-3 font-mono text-xs transition ${outcome === item ? outcomeTone(item) : 'border-white/10 text-stone-500 hover:border-white/25 hover:text-stone-200'}`}>{OUTCOME_LABELS[item]}</button>)}</div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-1.5"><span className="font-mono text-[9px] uppercase tracking-wider text-stone-500">Realized net P&amp;L · USD</span><div className="relative"><span className={`absolute left-3 top-2.5 font-mono text-sm ${outcome === 'loss' ? 'text-rose-300' : 'text-emerald-300'}`}>{outcome === 'loss' ? '-$' : '+$'}</span><input disabled={outcome === 'breakeven'} inputMode="decimal" value={amountInput} onChange={(event) => setAmountInput(event.target.value.replace(/[^0-9.]/g, ''))} className={`${fieldClass} pl-9 disabled:text-stone-600`} /></div></label>
                    <label className="space-y-1.5"><span className="font-mono text-[9px] uppercase tracking-wider text-stone-500">Exit type</span><select value={exitType} onChange={(event) => setExitType(event.target.value)} className={fieldClass}>{EXIT_TYPES.map((item) => <option key={item}>{item}</option>)}</select></label>
                  </div>
                </section>

                <section className="space-y-4 border-t border-white/10 pt-6">
                  <div className="flex flex-wrap items-baseline gap-3"><span className="font-mono text-[10px] text-[#c7a76a]">03</span><h3 className="text-sm font-medium text-stone-100">Review</h3><span className="text-xs text-stone-600">สั้นพอให้บันทึกได้ทุกไม้</span></div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-1.5"><span className="font-mono text-[9px] uppercase tracking-wider text-stone-500">เหตุผลที่ Key นี้มีนัยสำคัญ</span><textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="เช่น Classic V ที่ Swing Low H4 · Fresh level" className={`${fieldClass} resize-none`} /></label>
                    <div className="space-y-1.5"><span className="font-mono text-[9px] uppercase tracking-wider text-stone-500">Emotion</span><div className="grid grid-cols-3 gap-1.5">{EMOTIONS.map((item) => <button key={item.id} type="button" onClick={() => setEmotion(item.id)} className={`border px-2 py-2 text-left transition ${emotion === item.id ? 'border-[#c7a76a] bg-[#c7a76a]/10 text-stone-100' : 'border-white/10 text-stone-500 hover:text-stone-200'}`}><span className="block font-mono text-[8px] text-[#bda778]">{item.code}</span><span className="text-[11px]">{item.name}</span></button>)}</div></div>
                  </div>
                </section>

                <details open={researchOpen} onToggle={(event) => setResearchOpen(event.currentTarget.open)} className="border-t border-white/10 pt-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm text-[#d9bc82]"><span>Advanced research · ตัวเลือกเสริม</span><ChevronDown className={`h-4 w-4 transition ${researchOpen ? 'rotate-180' : ''}`} /></summary>
                  <div className="mt-5 space-y-5">
                    <div><p className="font-mono text-[9px] uppercase tracking-wider text-stone-500">Optional confirmation</p><div className="mt-2 flex flex-wrap gap-2">{OPTIONAL_CONFIRMATIONS.map((item) => <button key={item} type="button" onClick={() => toggleConfirmation(item)} className={`border px-3 py-2 text-[11px] transition ${confirmations.includes(item) ? 'border-[#c7a76a] bg-[#c7a76a]/10 text-stone-100' : 'border-white/10 text-stone-500 hover:text-stone-200'}`}>{item}</button>)}</div></div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className="space-y-1.5"><span className="font-mono text-[9px] uppercase text-stone-500">Realized R</span><input inputMode="decimal" value={realizedR} onChange={(event) => setRealizedR(event.target.value)} placeholder="เช่น -1 หรือ 3.2" className={fieldClass} /></label>
                      <label className="space-y-1.5"><span className="font-mono text-[9px] uppercase text-stone-500">MFE · R</span><input inputMode="decimal" value={mfe} onChange={(event) => setMfe(event.target.value)} placeholder="เช่น 4" className={fieldClass} /></label>
                      <label className="space-y-1.5"><span className="font-mono text-[9px] uppercase text-stone-500">MAE · R</span><input inputMode="decimal" value={mae} onChange={(event) => setMae(event.target.value)} placeholder="เช่น -0.25" className={fieldClass} /></label>
                    </div>
                    <label className="block space-y-1.5"><span className="font-mono text-[9px] uppercase tracking-wider text-stone-500">Research note</span><textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="สิ่งที่ต้องทบทวนหลังจบไม้" className={`${fieldClass} resize-none`} /></label>
                  </div>
                </details>

                <section className="space-y-3 border-t border-white/10 pt-5">
                  <div className="flex items-center justify-between"><p className="font-mono text-[9px] uppercase tracking-wider text-stone-500">Chart evidence</p>{imageUrl && <button type="button" onClick={() => setImageUrl('')} className="text-[10px] text-rose-400">ลบภาพ</button>}</div>
                  <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr]">
                    <div onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={(event) => { event.preventDefault(); setIsDragging(false); receiveImage(event.dataTransfer.files?.[0]); }} onClick={() => fileInputRef.current?.click()} className={`grid min-h-[116px] cursor-pointer place-items-center border border-dashed p-4 text-center transition ${isDragging ? 'border-[#c7a76a] bg-[#c7a76a]/10 text-[#d9bc82]' : 'border-white/10 text-stone-500 hover:border-white/25'}`}>
                      <div><Upload className="mx-auto h-5 w-5" /><p className="mt-2 text-xs">แตะเพื่ออัปโหลด หรือลากรูปมาวาง</p></div><input ref={fileInputRef} type="file" accept="image/*" onChange={(event) => receiveImage(event.target.files?.[0])} className="hidden" />
                    </div>
                    {imageUrl ? <img src={imageUrl} alt="Trade preview" className="h-[116px] w-full border border-white/10 bg-[#0b0c0a] object-contain" /> : <div className="grid min-h-[116px] place-items-center border border-white/10 bg-[#0b0c0a] text-stone-700"><ImageIcon className="h-6 w-6" /></div>}
                  </div>
                </section>
              </div>
            )}
          </div>

          <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-white/10 bg-[#0b0c0a] px-4 py-3 sm:px-6">
            {confirmDelete ? (
              <div className="flex w-full flex-col gap-3 border border-rose-500/30 bg-rose-950/20 p-3 sm:flex-row sm:items-center sm:justify-between"><span className="flex items-center gap-2 text-xs text-rose-300"><AlertTriangle className="h-4 w-4" /> ลบไม้เทรดนี้อย่างถาวร?</span><div className="flex gap-2"><button type="button" onClick={() => setConfirmDelete(false)} className="border border-white/10 px-3 py-2 text-xs text-stone-300">ยกเลิก</button><button type="button" onClick={executeDelete} className="bg-rose-600 px-3 py-2 text-xs font-medium text-white">ยืนยันลบ</button></div></div>
            ) : isViewMode ? (
              <>{onDelete ? <button type="button" onClick={() => setConfirmDelete(true)} className="border border-rose-500/25 px-3 py-2 text-xs text-rose-400"><Trash2 className="inline h-3.5 w-3.5" /> ลบไม้</button> : <span />}<button type="button" onClick={onClose} className="border border-white/10 px-4 py-2 text-xs text-stone-300">ปิด</button></>
            ) : (
              <><button type="button" onClick={() => isEditing ? setIsEditing(false) : onClose()} className="border border-white/10 px-4 py-2 text-xs text-stone-400">ยกเลิก</button><div className="flex items-center gap-3">{saveError && <span className="text-xs text-rose-400">{saveError}</span>}<button type="submit" disabled={isSaving} className="flex items-center gap-2 bg-[#c7a76a] px-5 py-2.5 text-xs font-medium text-[#11100c] transition hover:bg-[#d9bc82] disabled:opacity-60">{saveSuccess ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{saveSuccess ? 'บันทึกแล้ว' : isEditing ? 'บันทึกการแก้ไข' : 'บันทึกไม้เทรด'}</button></div></>
            )}
          </footer>
        </form>
      </motion.div>
    </div>
  );
}
