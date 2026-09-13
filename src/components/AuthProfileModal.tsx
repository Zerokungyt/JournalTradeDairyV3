import { FormEvent, useEffect, useRef, useState } from 'react';
import { Check, Database, Download, ImagePlus, ShieldCheck, Upload, UserRound, X } from 'lucide-react';
import { UserProfile } from '../types';
import { dbService } from '../lib/db';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
  onDataRestore: () => void;
}

export default function AuthProfileModal({
  isOpen,
  onClose,
  currentUser,
  onProfileChange,
  onDataRestore,
}: ProfileModalProps) {
  const [name, setName] = useState(currentUser.displayName);
  const [plan, setPlan] = useState(currentUser.tradingPlan || 'Personal Playbook');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [capital, setCapital] = useState(String(currentUser.startingCapital));
  const [avatar, setAvatar] = useState(currentUser.photoURL);
  const [message, setMessage] = useState('');
  const avatarInput = useRef<HTMLInputElement>(null);
  const restoreInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(currentUser.displayName);
    setPlan(currentUser.tradingPlan || 'Personal Playbook');
    setBio(currentUser.bio || '');
    setCapital(String(currentUser.startingCapital));
    setAvatar(currentUser.photoURL);
    setMessage('');
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const readAvatar = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setMessage('กรุณาเลือกไฟล์รูปภาพ');
    if (file.size > 8 * 1024 * 1024) return setMessage('รูปโปรไฟล์ต้องมีขนาดไม่เกิน 8 MB');
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const size = Math.min(image.width, image.height);
        const canvas = document.createElement('canvas');
        canvas.width = 420;
        canvas.height = 420;
        const context = canvas.getContext('2d');
        if (!context) return setMessage('ไม่สามารถประมวลผลรูปภาพได้');
        context.drawImage(image, (image.width - size) / 2, (image.height - size) / 2, size, size, 0, 0, 420, 420);
        setAvatar(canvas.toDataURL('image/jpeg', 0.82));
        setMessage('เตรียมรูปเรียบร้อย กดบันทึกเพื่อใช้งาน');
      };
      image.onerror = () => setMessage('ไม่สามารถอ่านรูปภาพนี้ได้');
      image.src = String(reader.result || '');
    };
    reader.onerror = () => setMessage('ไม่สามารถอ่านไฟล์นี้ได้');
    reader.readAsDataURL(file);
  };

  const saveProfile = (event: FormEvent) => {
    event.preventDefault();
    const parsedCapital = Number(capital.replace(/,/g, ''));
    if (!name.trim()) return setMessage('กรุณาใส่ชื่อที่ต้องการแสดง');
    if (!Number.isFinite(parsedCapital) || parsedCapital <= 0) return setMessage('ทุนเริ่มต้นต้องมากกว่า 0');
    try {
      const profile = dbService.updateProfile(currentUser.uid, name, avatar, parsedCapital, plan, bio);
      onProfileChange(profile);
      setMessage('บันทึกโปรไฟล์แล้ว');
    } catch {
      setMessage('พื้นที่เบราว์เซอร์ไม่พอ กรุณา Export backup แล้วลดขนาดข้อมูลรูปภาพ');
    }
  };

  const exportBackup = () => {
    const backup = dbService.createBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `JournalTradeDaily-backup-${backup.exportedAt.slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    localStorage.setItem('jdt_last_backup_at', backup.exportedAt);
    setMessage('ดาวน์โหลดไฟล์สำรองเรียบร้อย');
  };

  const restoreBackup = async (file?: File) => {
    if (!file) return;
    try {
      const value = JSON.parse(await file.text());
      const restored = dbService.restoreBackup(value);
      onProfileChange(restored.profile);
      onDataRestore();
      setMessage(`กู้คืนข้อมูล ${restored.trades.length} รายการเรียบร้อย`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'ไม่สามารถอ่านไฟล์สำรองได้');
    }
  };

  const lastBackup = dbService.getLastBackupAt();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 p-3 backdrop-blur-sm sm:p-8">
      <div className="mx-auto max-w-3xl overflow-hidden border border-white/15 bg-[#11110f]">
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4 sm:px-7">
          <div>
            <p className="editorial-kicker">Journal identity</p>
            <h2 className="mt-2 font-display text-3xl font-normal tracking-[-.03em] text-white">Make the journal yours.</h2>
          </div>
          <button onClick={onClose} aria-label="ปิด" className="rounded-sm border border-white/10 p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-0 md:grid-cols-[1.25fr_.75fr]">
          <form onSubmit={saveProfile} className="space-y-5 p-5 sm:p-7">
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => avatarInput.current?.click()} className="group relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full border border-stone-300 bg-stone-100 text-stone-700 transition hover:border-white hover:bg-white">
                {avatar ? <img src={avatar} alt="รูปโปรไฟล์" className="h-full w-full object-cover" /> : <UserRound className="h-11 w-11 fill-stone-700 stroke-stone-700" />}
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/70 py-1.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100"><ImagePlus className="h-3 w-3" /> เปลี่ยนรูป</span>
              </button>
              <div>
                <p className="font-semibold text-zinc-100">ภาพประจำ Journal</p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-400">อัปโหลดภาพที่ชอบจากเครื่อง ภาพจะอยู่ในเบราว์เซอร์นี้เท่านั้น</p>
                <input ref={avatarInput} type="file" accept="image/*" onChange={(e) => readAvatar(e.target.files?.[0])} className="hidden" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-zinc-300">ชื่อแสดงผล<input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className="field" /></label>
              <label className="space-y-2 text-sm text-zinc-300">ชื่อระบบ/แผน<input value={plan} onChange={(e) => setPlan(e.target.value)} maxLength={40} className="field" /></label>
              <label className="space-y-2 text-sm text-zinc-300 sm:col-span-2">ข้อความประจำตัว<input value={bio} onChange={(e) => setBio(e.target.value)} maxLength={90} className="field" /></label>
              <label className="space-y-2 text-sm text-zinc-300 sm:col-span-2">ทุนเริ่มต้น (USD)<input type="number" min="0.01" step="0.01" value={capital} onChange={(e) => setCapital(e.target.value)} className="field font-mono" /></label>
            </div>

            <button type="submit" className="flex w-full items-center justify-center gap-2 border border-[#c7a76a] bg-[#c7a76a] px-4 py-3 text-sm font-medium text-stone-950 transition hover:bg-[#d9bc82]">
              <Check className="h-4 w-4" /> บันทึกโปรไฟล์
            </button>
          </form>

          <aside className="border-t border-white/8 bg-white/[.025] p-5 sm:p-7 md:border-l md:border-t-0">
            <div className="flex items-center gap-2 text-zinc-100"><Database className="h-5 w-5 text-[#c7a76a]" /><h3 className="font-display text-xl font-normal">Personal archive</h3></div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">ข้อมูลอยู่ในเครื่อง ควรดาวน์โหลดไฟล์สำรองเป็นประจำ โดยเฉพาะก่อนล้างข้อมูลเบราว์เซอร์</p>
            <div className="mt-5 space-y-3">
              <button type="button" onClick={exportBackup} className="vault-button"><Download className="h-4 w-4" /> Export backup</button>
              <button type="button" onClick={() => restoreInput.current?.click()} className="vault-button"><Upload className="h-4 w-4" /> Restore backup</button>
              <input ref={restoreInput} type="file" accept="application/json,.json" onChange={(e) => restoreBackup(e.target.files?.[0])} className="hidden" />
            </div>
            <div className="mt-5 border-l border-emerald-400/35 bg-emerald-400/[.03] p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300"><ShieldCheck className="h-4 w-4" /> LOCAL-FIRST</div>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">ไม่มีบัญชี ไม่มีรหัสผ่าน และไม่มีข้อมูลถูกส่งไป Firebase</p>
            </div>
            <p className="mt-4 text-xs text-zinc-500">สำรองล่าสุด: {lastBackup ? new Date(lastBackup).toLocaleString('th-TH') : 'ยังไม่เคยสำรอง'}</p>
          </aside>
        </div>

        {message && <div className="border-t border-white/8 bg-amber-400/5 px-6 py-3 text-center text-sm text-amber-200">{message}</div>}
      </div>
    </div>
  );
}
