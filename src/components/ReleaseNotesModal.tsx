import { useEffect } from 'react';
import { ArrowRight, Check, X } from 'lucide-react';
import { motion } from 'motion/react';

export const RELEASE_VERSION = '3.0.9';
export const RELEASE_SEEN_KEY = 'jtd_seen_release_version';

interface ReleaseNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RELEASE_SECTIONS = [
  {
    number: '01',
    title: 'Trade record',
    subtitle: 'A structured research workflow',
    items: [
      'Technique-first records with dedicated Price Keys',
      'Independent Technique combinations and custom systems',
      'WIN, LOSS, BE and BE+ outcomes with planned RRR',
      'Optional confirmations, Realized R, MFE and MAE',
    ],
  },
  {
    number: '02',
    title: 'Visual evidence',
    subtitle: 'The complete story of every trade',
    items: [
      'Separate Before and After chart evidence',
      'After charts remain the cover image in compact history',
      'Full records reveal a labeled Before to After sequence',
      'Independent upload, replacement and removal controls',
    ],
  },
  {
    number: '03',
    title: 'Research & analytics',
    subtitle: 'Turn records into inspectable evidence',
    items: [
      'Technique to Price Key to Trade research archive',
      'Win rate, P&L, expectancy and maximum drawdown',
      'Live equity curve derived from journal records',
      'Trader psychology and emotion performance review',
    ],
  },
  {
    number: '04',
    title: 'Workspace',
    subtitle: 'Designed around the way you review',
    items: [
      'Switchable top navigation and persistent side rail',
      'Animated compact navigation for tablet workspaces',
      'Always-available profile and personal journal identity',
      'Local-first archive with versioned backup and restore',
    ],
  },
];

const REFINEMENTS = [
  'Neutral default profile avatar',
  'Responsive calendar and daily trade rail',
  'Cleaner settings placement and overflow behavior',
  'One deliberate edit action per trade record',
];

export default function ReleaseNotesModal({ isOpen, onClose }: ReleaseNotesModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/85 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-labelledby="release-ledger-title">
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="ปิดรายละเอียดเวอร์ชัน" />
      <motion.article
        initial={{ opacity: 0, scale: 0.985, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.24 }}
        className="relative flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden border border-white/10 bg-[#0d0e0c] shadow-2xl shadow-black/60"
      >
        <div className="h-px shrink-0 bg-[#c7a76a]" />
        <header className="flex shrink-0 items-start justify-between gap-5 border-b border-white/10 bg-[#0a0b09] px-5 py-5 sm:px-7 sm:py-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-mono text-[9px] uppercase tracking-[.22em] text-[#c7a76a]">Release ledger</p>
              <span className="border border-[#c7a76a]/30 px-2 py-1 font-mono text-[8px] uppercase tracking-[.14em] text-[#d9bc82]">Final V3 patch</span>
            </div>
            <h2 id="release-ledger-title" className="mt-3 font-display text-3xl font-normal tracking-[-.035em] text-[#efede7] sm:text-5xl">
              JournalTradeDaily <span className="italic text-[#c7a76a]">V{RELEASE_VERSION}</span>
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-stone-500">The research journal is ready. บันทึกสมมติฐาน เก็บหลักฐาน และให้ข้อมูลตัดสินคุณภาพของกระบวนการ</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center border border-white/10 text-stone-500 transition hover:border-white/25 hover:text-stone-100" aria-label="ปิด">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7 sm:py-7">
          <div className="grid gap-px border border-white/10 bg-white/10 md:grid-cols-2">
            {RELEASE_SECTIONS.map((section) => (
              <section key={section.number} className="bg-[#0d0e0c] p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <span className="font-mono text-[9px] text-[#c7a76a]">{section.number}</span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-stone-100">{section.title}</h3>
                    <p className="mt-1 font-mono text-[8px] uppercase tracking-[.12em] text-stone-600">{section.subtitle}</p>
                  </div>
                </div>
                <ul className="mt-5 space-y-3">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-3 text-xs leading-5 text-stone-400">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#bda778]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <section className="mt-6 border-l border-[#c7a76a]/45 bg-white/[.018] px-5 py-4">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#c7a76a]">Refinements</p>
                <h3 className="mt-1 text-sm font-medium text-stone-200">รายละเอียดเล็ก ๆ ที่ทำให้ใช้งานจริงได้ดีขึ้น</h3>
              </div>
              <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {REFINEMENTS.map((item) => <span key={item} className="flex items-center gap-2 text-[11px] text-stone-500"><ArrowRight className="h-3 w-3 text-stone-700" /> {item}</span>)}
              </div>
            </div>
          </section>
        </div>

        <footer className="flex shrink-0 flex-col gap-2 border-t border-white/10 bg-[#0a0b09] px-5 py-4 font-mono text-[8px] uppercase tracking-[.15em] text-stone-600 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <span>Released · 20 September 2026</span>
          <span>Designed &amp; developed by <b className="font-medium text-[#c7a76a]">LucasTD</b></span>
        </footer>
      </motion.article>
    </div>
  );
}
