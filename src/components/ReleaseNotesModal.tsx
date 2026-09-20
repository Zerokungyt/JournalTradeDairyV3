import { useEffect, useState } from 'react';
import { ArrowRight, Check, X } from 'lucide-react';
import { motion } from 'motion/react';

export const RELEASE_VERSION = '3.0.9';
export const RELEASE_SEEN_KEY = 'jtd_seen_release_version';
const RELEASE_LANGUAGE_KEY = 'jtd_release_language';

type ReleaseLanguage = 'th' | 'en' | 'zh' | 'de';

interface ReleaseNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LANGUAGE_OPTIONS: { id: ReleaseLanguage; label: string; name: string }[] = [
  { id: 'th', label: 'TH', name: 'ภาษาไทย' },
  { id: 'en', label: 'EN', name: 'English' },
  { id: 'zh', label: 'ZH', name: '中文' },
  { id: 'de', label: 'DE', name: 'Deutsch' },
];

const RELEASE_COPY = {
  th: {
    releaseLabel: 'รายละเอียดเวอร์ชัน', badge: 'แพตช์สุดท้ายของ V3', language: 'ภาษา',
    hero: 'สมุดบันทึกวิจัยพร้อมใช้งานแล้ว บันทึกสมมติฐาน เก็บหลักฐาน และให้ข้อมูลตัดสินคุณภาพของกระบวนการ',
    refinementsLabel: 'รายละเอียดที่ปรับปรุง', refinementsTitle: 'รายละเอียดเล็ก ๆ ที่ทำให้ใช้งานจริงได้ดีขึ้น',
    released: 'เผยแพร่ · 20 กันยายน 2026', credit: 'ออกแบบและพัฒนาโดย', close: 'ปิดรายละเอียดเวอร์ชัน',
    sections: [
      { number: '01', title: 'บันทึกไม้เทรด', subtitle: 'เวิร์กโฟลว์วิจัยที่มีโครงสร้าง', items: ['เลือก Technique ก่อน แล้วจึงบันทึก Price Key ที่ใช้เข้าไม้', 'รองรับ Technique Combo และระบบที่ผู้ใช้สร้างเอง', 'บันทึกผล WIN, LOSS, BE และ BE+ พร้อม Planned RRR', 'เก็บ Confirmation, Realized R, MFE และ MAE เพิ่มเติมได้'] },
      { number: '02', title: 'หลักฐานภาพ', subtitle: 'เก็บเรื่องราวของทุกไม้ให้ครบถ้วน', items: ['แยกภาพกราฟ Before และ After ออกจากกัน', 'ใช้ภาพ After เป็นภาพปกในประวัติแบบย่อ', 'รายละเอียดเต็มแสดงลำดับ Before ไปยัง After อย่างชัดเจน', 'อัปโหลด เปลี่ยน และลบภาพแต่ละฝั่งได้อิสระ'] },
      { number: '03', title: 'การวิจัยและวิเคราะห์', subtitle: 'เปลี่ยนบันทึกให้เป็นหลักฐานที่ตรวจสอบได้', items: ['ศูนย์รวมประวัติ Technique ไปยัง Price Key และไม้เทรด', 'วิเคราะห์ Win rate, P&L, Expectancy และ Maximum Drawdown', 'Equity Curve อัปเดตจากข้อมูลใน Journal', 'วิเคราะห์จิตวิทยาและประสิทธิภาพของแต่ละอารมณ์'] },
      { number: '04', title: 'พื้นที่ทำงาน', subtitle: 'ออกแบบให้เข้ากับวิธีทบทวนของผู้ใช้', items: ['สลับเมนูด้านบนและ Side Rail แบบติดหน้าจอได้', 'เมนูย่อพร้อม Animation สำหรับหน้าจอแท็บเล็ต', 'เข้าถึงโปรไฟล์และตัวตนของ Journal ได้ตลอดเวลา', 'Local-first พร้อม Backup และ Restore แบบมีเวอร์ชัน'] },
    ],
    refinements: ['รูปโปรไฟล์เริ่มต้นแบบเป็นกลาง', 'ปฏิทินและเมนูรายวันรองรับทุกขนาดหน้าจอ', 'แก้ตำแหน่งและการล้นของเมนูตั้งค่า', 'เหลือปุ่มแก้ไขหลักเพียงจุดเดียวต่อหนึ่งไม้'],
  },
  en: {
    releaseLabel: 'Release ledger', badge: 'Final V3 patch', language: 'Language',
    hero: 'The research journal is ready. Record hypotheses, preserve evidence, and let the data judge the quality of the process.',
    refinementsLabel: 'Refinements', refinementsTitle: 'Small details that make the journal better in real use',
    released: 'Released · 20 September 2026', credit: 'Designed & developed by', close: 'Close release details',
    sections: [
      { number: '01', title: 'Trade record', subtitle: 'A structured research workflow', items: ['Technique-first records with dedicated Price Keys', 'Independent Technique combinations and custom systems', 'WIN, LOSS, BE and BE+ outcomes with planned RRR', 'Optional confirmations, Realized R, MFE and MAE'] },
      { number: '02', title: 'Visual evidence', subtitle: 'The complete story of every trade', items: ['Separate Before and After chart evidence', 'After charts remain the cover image in compact history', 'Full records reveal a labeled Before to After sequence', 'Independent upload, replacement and removal controls'] },
      { number: '03', title: 'Research & analytics', subtitle: 'Turn records into inspectable evidence', items: ['Technique to Price Key to Trade research archive', 'Win rate, P&L, expectancy and maximum drawdown', 'Live equity curve derived from journal records', 'Trader psychology and emotion performance review'] },
      { number: '04', title: 'Workspace', subtitle: 'Designed around the way you review', items: ['Switchable top navigation and persistent side rail', 'Animated compact navigation for tablet workspaces', 'Always-available profile and personal journal identity', 'Local-first archive with versioned backup and restore'] },
    ],
    refinements: ['Neutral default profile avatar', 'Responsive calendar and daily trade rail', 'Cleaner settings placement and overflow behavior', 'One deliberate edit action per trade record'],
  },
  zh: {
    releaseLabel: '版本记录', badge: 'V3 最终补丁', language: '语言',
    hero: '交易研究日志已准备就绪。记录假设、保留证据，并让数据评估交易流程的质量。',
    refinementsLabel: '细节优化', refinementsTitle: '让日志在实际使用中更加顺畅的细节改进',
    released: '发布于 · 2026年9月20日', credit: '设计与开发', close: '关闭版本详情',
    sections: [
      { number: '01', title: '交易记录', subtitle: '结构化研究流程', items: ['先选择交易技术，再记录专属 Price Key', '支持多种交易技术自由组合和自定义系统', '以计划 RRR 记录 WIN、LOSS、BE 和 BE+', '可补充确认信号、Realized R、MFE 和 MAE'] },
      { number: '02', title: '图表证据', subtitle: '完整保留每笔交易的过程', items: ['分别保存 Before 与 After 图表', 'After 图表继续作为精简历史记录的封面', '完整记录清楚展示 Before 到 After 的变化', '两张图片均可独立上传、替换和删除'] },
      { number: '03', title: '研究与分析', subtitle: '将记录转化为可检验的证据', items: ['按交易技术、Price Key 和交易逐层查看历史', '分析胜率、P&L、期望值和最大回撤', '根据日志记录实时生成资金曲线', '复盘交易心理与不同情绪的表现'] },
      { number: '04', title: '工作区', subtitle: '围绕你的复盘方式设计', items: ['可切换顶部导航与固定侧边栏', '为平板工作区提供带动画的紧凑导航', '随时访问个人资料与专属日志身份', '本地优先存储，并支持版本化备份与恢复'] },
    ],
    refinements: ['中性的默认头像', '响应式日历与每日交易栏', '更整洁的设置位置与溢出处理', '每笔交易只保留一个明确的编辑入口'],
  },
  de: {
    releaseLabel: 'Versionsprotokoll', badge: 'Letzter V3-Patch', language: 'Sprache',
    hero: 'Das Research-Journal ist bereit. Hypothesen dokumentieren, Belege sichern und die Qualität des Prozesses anhand der Daten bewerten.',
    refinementsLabel: 'Verbesserungen', refinementsTitle: 'Kleine Details für eine bessere Nutzung im Alltag',
    released: 'Veröffentlicht · 20. September 2026', credit: 'Entworfen & entwickelt von', close: 'Versionsdetails schließen',
    sections: [
      { number: '01', title: 'Trade-Journal', subtitle: 'Ein strukturierter Research-Workflow', items: ['Technique zuerst erfassen und den zugehörigen Price Key dokumentieren', 'Freie Technique-Kombinationen und eigene Systeme', 'WIN, LOSS, BE und BE+ inklusive geplantem RRR', 'Optionale Bestätigungen sowie Realized R, MFE und MAE'] },
      { number: '02', title: 'Visuelle Belege', subtitle: 'Die vollständige Geschichte jedes Trades', items: ['Getrennte Before- und After-Chartbilder', 'Das After-Bild bleibt das Titelbild in der kompakten Historie', 'Vollständige Datensätze zeigen die Abfolge Before zu After', 'Beide Bilder lassen sich unabhängig hochladen, ersetzen und löschen'] },
      { number: '03', title: 'Research & Analyse', subtitle: 'Aus Einträgen werden überprüfbare Belege', items: ['Research-Archiv von Technique über Price Key bis zum Trade', 'Auswertung von Win Rate, P&L, Erwartungswert und maximalem Drawdown', 'Live-Equity-Kurve aus den Journal-Einträgen', 'Analyse von Trading-Psychologie und emotionaler Performance'] },
      { number: '04', title: 'Arbeitsbereich', subtitle: 'Für deinen Review-Prozess gestaltet', items: ['Umschaltbare Top-Navigation und dauerhaft sichtbare Seitenleiste', 'Animierte kompakte Navigation für Tablets', 'Profil und persönliche Journal-Identität bleiben stets erreichbar', 'Local-first-Archiv mit versioniertem Backup und Restore'] },
    ],
    refinements: ['Neutrales Standard-Profilbild', 'Responsiver Kalender und tägliche Trade-Leiste', 'Saubere Positionierung und Überlaufbehandlung der Einstellungen', 'Eine eindeutige Bearbeitungsaktion pro Trade'],
  },
} satisfies Record<ReleaseLanguage, {
  releaseLabel: string;
  badge: string;
  language: string;
  hero: string;
  refinementsLabel: string;
  refinementsTitle: string;
  released: string;
  credit: string;
  close: string;
  sections: { number: string; title: string; subtitle: string; items: string[] }[];
  refinements: string[];
}>;

export default function ReleaseNotesModal({ isOpen, onClose }: ReleaseNotesModalProps) {
  const [language, setLanguage] = useState<ReleaseLanguage>(() => {
    const saved = localStorage.getItem(RELEASE_LANGUAGE_KEY);
    return LANGUAGE_OPTIONS.some((option) => option.id === saved) ? saved as ReleaseLanguage : 'th';
  });
  const copy = RELEASE_COPY[language];

  const changeLanguage = (nextLanguage: ReleaseLanguage) => {
    setLanguage(nextLanguage);
    localStorage.setItem(RELEASE_LANGUAGE_KEY, nextLanguage);
  };

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
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label={copy.close} />
      <motion.article
        initial={{ opacity: 0, scale: 0.985, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.24 }}
        className="relative flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden border border-white/10 bg-[#0d0e0c] shadow-2xl shadow-black/60"
        lang={language}
      >
        <div className="h-px shrink-0 bg-[#c7a76a]" />
        <header className="flex shrink-0 items-start justify-between gap-5 border-b border-white/10 bg-[#0a0b09] px-5 py-5 sm:px-7 sm:py-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-mono text-[9px] uppercase tracking-[.22em] text-[#c7a76a]">{copy.releaseLabel}</p>
              <span className="border border-[#c7a76a]/30 px-2 py-1 font-mono text-[8px] uppercase tracking-[.14em] text-[#d9bc82]">{copy.badge}</span>
            </div>
            <h2 id="release-ledger-title" className="mt-3 font-display text-3xl font-normal tracking-[-.035em] text-[#efede7] sm:text-5xl">
              JournalTradeDaily <span className="italic text-[#c7a76a]">V{RELEASE_VERSION}</span>
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-stone-500">{copy.hero}</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center border border-white/10 text-stone-500 transition hover:border-white/25 hover:text-stone-100" aria-label={copy.close}>
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-[#0a0b09] px-5 py-3 sm:px-7">
          <span className="font-mono text-[8px] uppercase tracking-[.18em] text-stone-600">{copy.language}</span>
          <div className="flex items-center gap-2" role="group" aria-label={copy.language}>
            {LANGUAGE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => changeLanguage(option.id)}
                aria-label={option.name}
                aria-pressed={language === option.id}
                title={option.name}
                className={`grid h-8 w-10 place-items-center border font-mono text-[9px] font-medium tracking-[.08em] transition ${language === option.id ? 'border-[#c7a76a] bg-[#c7a76a] text-[#11100c]' : 'border-[#c7a76a]/30 text-[#bda778] hover:border-[#c7a76a]/75 hover:text-[#e0c88f]'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7 sm:py-7">
          <div className="grid gap-px border border-white/10 bg-white/10 md:grid-cols-2">
            {copy.sections.map((section) => (
              <section key={`${language}-${section.number}`} className="bg-[#0d0e0c] p-5 sm:p-6">
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
                <p className="font-mono text-[9px] uppercase tracking-[.18em] text-[#c7a76a]">{copy.refinementsLabel}</p>
                <h3 className="mt-1 text-sm font-medium text-stone-200">{copy.refinementsTitle}</h3>
              </div>
              <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {copy.refinements.map((item) => <span key={item} className="flex items-center gap-2 text-[11px] text-stone-500"><ArrowRight className="h-3 w-3 text-stone-700" /> {item}</span>)}
              </div>
            </div>
          </section>
        </div>

        <footer className="flex shrink-0 flex-col gap-2 border-t border-white/10 bg-[#0a0b09] px-5 py-4 font-mono text-[8px] uppercase tracking-[.15em] text-stone-600 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <span>{copy.released}</span>
          <span>{copy.credit} <b className="font-medium text-[#c7a76a]">LucasTD</b></span>
        </footer>
      </motion.article>
    </div>
  );
}
