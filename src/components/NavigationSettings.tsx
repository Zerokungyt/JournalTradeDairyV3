import { useEffect, useRef, useState } from 'react';
import { Check, LayoutPanelTop, PanelLeft, SlidersHorizontal } from 'lucide-react';

export type NavigationPosition = 'sidebar' | 'topbar';

interface NavigationSettingsProps {
  position: NavigationPosition;
  collapsed: boolean;
  onPositionChange: (position: NavigationPosition) => void;
  onCollapsedChange: (collapsed: boolean) => void;
  align?: 'left' | 'right';
}

export default function NavigationSettings({
  position,
  collapsed,
  onPositionChange,
  onCollapsedChange,
  align = 'right',
}: NavigationSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  const positionButtonClass = (value: NavigationPosition) =>
    `relative flex flex-1 flex-col items-start gap-3 border p-3 text-left transition-colors ${
      position === value
        ? 'border-[#c7a76a]/70 bg-[#c7a76a]/[.08] text-stone-100'
        : 'border-white/10 bg-white/[.015] text-stone-500 hover:border-white/20 hover:text-stone-200'
    }`;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className={`grid h-9 w-9 place-items-center border transition-all duration-200 ${
          isOpen
            ? 'rotate-90 border-[#c7a76a]/60 bg-[#c7a76a]/10 text-[#d9bc82]'
            : 'border-white/10 text-stone-500 hover:border-white/20 hover:text-stone-200'
        }`}
        aria-label="ตั้งค่าตำแหน่งเมนู"
        aria-expanded={isOpen}
      >
        <SlidersHorizontal className="h-4 w-4" />
      </button>

      <div
        className={`absolute top-11 z-50 w-[280px] origin-top border border-white/10 bg-[#11110f]/[.98] p-4 shadow-2xl shadow-black/50 backdrop-blur-xl transition-all duration-200 ${
          align === 'right' ? 'right-0' : 'left-0'
        } ${
          isOpen
            ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none -translate-y-1 scale-[.98] opacity-0'
        }`}
        aria-hidden={!isOpen}
      >
        <p className="font-mono text-[9px] uppercase tracking-[.16em] text-[#c7a76a]">Workspace navigation</p>
        <h2 className="mt-1 text-sm font-medium text-stone-100">ตำแหน่งเมนู</h2>
        <p className="mt-1 text-[11px] leading-5 text-stone-500">เลือกพื้นที่ทำงานให้เหมาะกับขนาดหน้าจอของคุณ</p>

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => onPositionChange('sidebar')} className={positionButtonClass('sidebar')}>
            <PanelLeft className="h-5 w-5" />
            <span>
              <b className="block text-[11px] font-medium">ด้านซ้าย</b>
              <small className="mt-0.5 block font-mono text-[8px] uppercase tracking-[.1em] text-stone-600">Side rail</small>
            </span>
            {position === 'sidebar' && <Check className="absolute right-2 top-2 h-3.5 w-3.5 text-[#d9bc82]" />}
          </button>
          <button type="button" onClick={() => onPositionChange('topbar')} className={positionButtonClass('topbar')}>
            <LayoutPanelTop className="h-5 w-5" />
            <span>
              <b className="block text-[11px] font-medium">ด้านบน</b>
              <small className="mt-0.5 block font-mono text-[8px] uppercase tracking-[.1em] text-stone-600">Top bar</small>
            </span>
            {position === 'topbar' && <Check className="absolute right-2 top-2 h-3.5 w-3.5 text-[#d9bc82]" />}
          </button>
        </div>

        {position === 'sidebar' && (
          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
            <span>
              <b className="block text-[11px] font-medium text-stone-300">ขนาดแถบเมนู</b>
              <small className="mt-0.5 block text-[10px] text-stone-600">จอขนาดกลางเริ่มต้นแบบย่อ</small>
            </span>
            <button
              type="button"
              onClick={() => onCollapsedChange(!collapsed)}
              className="border border-white/10 px-3 py-2 font-mono text-[9px] uppercase tracking-[.1em] text-stone-300 transition hover:border-[#c7a76a]/50 hover:text-[#d9bc82]"
            >
              {collapsed ? 'ขยาย' : 'ย่อ'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
