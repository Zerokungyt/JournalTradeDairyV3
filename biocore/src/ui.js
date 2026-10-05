export function mountBioCore(root, adapter) {
  if (!root || !adapter) throw new Error('BIOCORE requires a root element and adapter');
  const views = [
    ['home','ภาพรวม','home'],
    ['chapters','ฝึกแยกบท','grid'],
    ['mock','จำลองสอบ','clock'],
    ['daily','Daily Bio','calendar'],
    ['mistakes','Mistake Bank','bookmark'],
    ['priority','Priority Map','target'],
    ['analytics','วิเคราะห์ผล','chart'],
    ['search','ค้นหา','search']
  ];
  const iconPaths = {
    home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
    bookmark:'<path d="M5 3h14v18l-7-4-7 4z"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    chart:'<path d="M3 20h18M6 16v-5m6 5V5m6 11V8"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
    arrow:'<path d="M4 12h16m-7-7 7 7-7 7"/>',
    chevron:'<path d="m9 18 6-6-6-6"/>',
    check:'<path d="m4 12 5 5L20 6"/>',
    alert:'<circle cx="12" cy="12" r="9"/><path d="M12 7v6m0 4h.01"/>'
  };
  const icon = name => `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8">${iconPaths[name] || iconPaths.grid}</svg>`;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const fmt = value => value == null || !Number.isFinite(Number(value)) ? '—' : new Intl.NumberFormat('th-TH',{maximumFractionDigits:1}).format(Number(value));
  const pct = value => Math.max(0, Math.min(100, Number(value) || 0));
  const bar = value => `<div class="bar" role="meter" aria-valuenow="${pct(value)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct(value)}%"></i></div>`;
  const src = type => ({
    official:['Official','official'],
    drive:['Study Material',''],
    adapted:['Inspired by A-Level',''],
    generated:['Generated Practice','']
  }[type] || ['Practice','']);
  const sourceTag = q => {
    const [label, klass] = src(q.sourceType);
    return `<span class="source-tag ${klass}">${esc(label)}</span>`;
  };
  const questionStatements = q => q.statements || q.choices || [];
  const complete = (q, a) => q.type === 'complex'
    ? Array.isArray(a) && a.length === 3 && a.every(v => typeof v === 'boolean')
    : Number.isInteger(a) && a >= 0 && a < 5;
  const answerLabel = (q,a) => {
    if (!complete(q,a)) return 'ยังไม่ตอบ';
    return q.type === 'complex' ? a.map(x => x ? 'ถูก' : 'ผิด').join(' · ') : `${'ABCDE'[a]} — ${q.choices[a]}`;
  };
  const domainName = id => ({ecology:'ความหลากหลายและสิ่งแวดล้อม',cell:'หน่วยพื้นฐานของสิ่งมีชีวิต',human:'ระบบสัตว์และมนุษย์',plant:'โครงสร้างและหน้าที่ของพืช',genetics:'พันธุศาสตร์และวิวัฒนาการ'}[id] || id);
  const errorLabels = {knowledge:'Knowledge Gap',confusion:'Concept Confusion',misread:'Misread',calculation:'Calculation',reasoning:'Reasoning',trap:'Trap'};
  const state = {
    view:'home', dashboard:null, catalog:[], analytics:null, priorities:null, mistakes:null,
    searchResults:[], searchQuery:'', searchBusy:false, selectedDomain:null, selectedSubchapter:'all',
    session:null, result:null, feedback:{}, drafts:{}, error:'', busy:false, confirmSubmit:false,
    mistakeFilter:'all', setup:{difficulty:3,count:10,type:'mixed',mode:'practice'},
    mock:{variant:'full',count:40,difficulty:3,durationMinutes:90,domain:'all'}
  };
  let timerId = null;
  const showError = error => {
    state.error = error?.message || String(error || 'เกิดข้อผิดพลาด');
    state.busy = false;
    render();
  };
  const run = async task => {
    if (state.busy) return;
    state.busy = true; state.error = ''; render();
    try { await task(); }
    catch (error) { showError(error); return; }
    state.busy = false; render();
  };
  const navButton = ([id,label,glyph]) => `<button type="button" class="nav-button ${state.view === id || (id === 'chapters' && state.view === 'chapter') ? 'active' : ''}" data-action="nav" data-view="${id}" aria-current="${state.view === id ? 'page' : 'false'}">${icon(glyph)}<span>${label}</span></button>`;
  const mobileNav = `<nav class="mobile-nav" aria-label="ทางลัดบนมือถือ">${views.filter(([id])=>['home','chapters','mock','daily','analytics'].includes(id)).map(([id,label,glyph])=>`<button type="button" class="${state.view===id?'active':''}" data-action="nav" data-view="${id}">${icon(glyph)}<span>${label}</span></button>`).join('')}</nav>`;
  const layout = (body,title) => `<div class="shell"><aside class="sidebar"><div class="brand"><span class="brand-mark">B</span><span><strong>BIOCORE</strong><small>A-Level Biology · TCAS70</small></span></div><div class="nav-group">LEARN</div>${views.slice(0,4).map(navButton).join('')}<div class="nav-group">INSIGHTS</div>${views.slice(4).map(navButton).join('')}<div class="sidebar-foot">Master Biology. Diagnose Weakness.<br>Attack the Exam.</div></aside><div class="main"><header class="topbar"><p class="eyebrow">${esc(title || 'A-Level Biology Training System')}</p><div class="top-actions"><button class="btn quiet small" type="button" data-action="nav" data-view="search">${icon('search')}<span>ค้นหา</span></button></div></header><main class="content">${state.error ? `<div class="error" role="alert">${esc(state.error)}</div>` : ''}${body}</main></div></div>${mobileNav}${state.confirmSubmit ? submitModal() : ''}`;
  const empty = (title,detail,button='') => `<div class="empty"><strong>${esc(title)}</strong><span>${esc(detail)}</span>${button ? `<div style="margin-top:16px">${button}</div>` : ''}</div>`;
  const head = (kicker,title,subtitle='') => `<div class="page-head"><div><span class="eyebrow">${esc(kicker)}</span><h1>${esc(title)}</h1>${subtitle ? `<p class="lead">${esc(subtitle)}</p>` : ''}</div></div>`;
  const stat = (label,value,note='') => `<div class="card stat"><div class="stat-label">${esc(label)}</div><div class="stat-value">${esc(value)}</div><div class="stat-note">${esc(note)}</div></div>`;
  const home = () => {
    const d = state.dashboard || {};
    const noData = d.questionsSolved == null || d.questionsSolved === 0;
    return layout(`
      <section class="card hero"><div><span class="eyebrow">BIOCORE / TCAS70</span><h1>Master Biology.<br>Diagnose Weakness.<br>Attack the Exam.</h1><p class="lead">ฝึกโจทย์อย่างมีเป้าหมาย รู้ว่าพลาดเพราะอะไร และเลือกบทที่ควรเก็บต่อจากผลของคุณ</p><div class="hero-actions"><button class="btn primary" data-action="nav" data-view="chapters">เริ่มฝึกแยกบท ${icon('arrow')}</button><button class="btn" data-action="nav" data-view="mock">เริ่มจำลองสอบ</button></div></div><div class="hero-aside"><span class="eyebrow">NEXT RECOMMENDED</span><strong>${esc(d.nextRecommended || (noData ? 'เริ่มจาก Core Biology' : 'ดูแผนการเรียน'))}</strong><small>${esc(d.nextReason || (noData ? 'ระบบจะปรับลำดับเมื่อมีผลการทำโจทย์' : ''))}</small><button class="text-link" data-action="nav" data-view="priority">ดู Priority Map →</button></div></section>
      <div class="section-head"><h2>ภาพรวมการเรียน</h2><small>${noData ? 'ยังไม่มีประวัติการทำโจทย์' : 'คำนวณจากประวัติจริงของคุณ'}</small></div>
      <div class="grid stats">${stat('Exam Readiness',d.readiness==null?'—':`${fmt(d.readiness)}%`,'ประเมินจากการฝึกและ Mock')}${stat('Current Mastery',d.mastery==null?'—':`${fmt(d.mastery)}%`,'ความชำนาญรวม')}${stat('Mock Best',d.mockBest==null?'—':`${fmt(d.mockBest)} / 100`,'คะแนนสูงสุด')}${stat('Questions Solved',fmt(d.questionsSolved ?? 0),'ข้อที่ตอบแล้ว')}${stat('Current Streak',d.streak==null?'—':`${fmt(d.streak)} วัน`,'วันที่ฝึกต่อเนื่อง')}</div>
      <div class="section-head"><h2>Continue Learning</h2></div>
      <div class="grid three">
        ${state.session ? `<button class="card action-card" data-action="resumeSession"><span class="kicker">ACTIVE SESSION</span><h3>ทำชุดที่ค้างต่อ</h3><p>${esc(state.session.title||'Question Workspace')}</p><span class="arrow">→</span></button>` : ''}${actionCard('01 / DAILY','Daily Bio','ทบทวน Core, จุดอ่อน และข้อที่เคยผิด','daily')}
        ${actionCard('02 / PRACTICE','Practice by Chapter','เลือกบท ระดับความยาก และจำนวนข้อ','chapters')}
        ${actionCard('03 / EXAM','A-Level Mock Exam','จำลองข้อสอบ 40 ข้อใน 90 นาที','mock')}
        ${actionCard('04 / REVIEW','Mistake Bank','กลับไปแก้ข้อที่พลาดและระบุสาเหตุ','mistakes')}
        ${actionCard('05 / ANALYTICS','Performance Analytics','ดูความแม่นยำและพัฒนาการจริง','analytics')}
        ${actionCard('06 / STRATEGY','Priority Map','รู้ว่าควรเก็บบทไหนก่อน','priority')}
      </div>
      ${d.weakestArea ? `<div class="section-head"><h2>จุดที่ควรกลับไปดู</h2></div><div class="note"><strong>${esc(d.weakestArea)}</strong>${d.weakestReason ? ` — ${esc(d.weakestReason)}` : ''}</div>` : ''}
    `,'ภาพรวม');
  };
  const actionCard = (kicker,title,desc,view) => `<button class="card action-card" type="button" data-action="nav" data-view="${view}"><span class="kicker">${esc(kicker)}</span><h3>${esc(title)}</h3><p>${esc(desc)}</p><span class="arrow" aria-hidden="true">→</span></button>`;
  const chapters = () => layout(`${head('PRACTICE / CHAPTERS','ฝึกแยกบท','เลือก Domain แล้วลงลึกถึง Subchapter ก่อนเริ่มชุดฝึก')}${state.catalog.length ? `<div class="grid chapter-grid">${state.catalog.map((c,i)=>`<button class="card chapter-card" type="button" data-action="chapter" data-domain="${esc(c.id)}"><span class="kicker">${String(i+1).padStart(2,'0')} / BIOLOGY</span><h3>${esc(c.title || domainName(c.id))}</h3><p>${esc(c.description || '')}</p><div class="chapter-meta"><span>${fmt(c.questionCount)} ข้อ</span><span>${c.mastery == null ? 'ยังไม่มี Mastery' : `Mastery ${fmt(c.mastery)}`}</span><span>เป้าหมาย ${esc(c.weightRange || 'ตาม Blueprint')}</span></div></button>`).join('')}</div>` : empty('กำลังเตรียมหมวดเนื้อหา','ยังไม่มีข้อมูลหมวดที่พร้อมใช้งาน')}`,'ฝึกแยกบท');
  const chapterPage = () => {
    const chapter = state.catalog.find(c=>c.id===state.selectedDomain);
    if (!chapter) return chapters();
    const subs = chapter.subchapters || [];
    const available=(chapter.availability || []).filter(q => (state.selectedSubchapter==='all' || q.subchapter===state.selectedSubchapter) && q.difficulty===state.setup.difficulty && (state.setup.type==='mixed' || q.type===state.setup.type)).length;
    const selectedCount=state.setup.count==='unlimited' ? available : Math.min(Number(state.setup.count),available);
    return layout(`
      <button class="text-link" type="button" data-action="nav" data-view="chapters">← ทุกบท</button>
      ${head('PRACTICE / CHAPTER',chapter.title || domainName(chapter.id),chapter.description || '')}
      <div class="setup"><div>
        <div class="card card-pad"><h3>เลือกหัวข้อย่อย</h3><div class="sub-list"><button class="sub-item ${state.selectedSubchapter==='all'?'selected':''}" type="button" data-action="subchapter" data-subchapter="all"><span>ทุกหัวข้อในบทนี้</span><small>${fmt(chapter.questionCount)} ข้อ</small></button>${subs.map(s=>`<button class="sub-item ${state.selectedSubchapter===s.id?'selected':''}" type="button" data-action="subchapter" data-subchapter="${esc(s.id)}" ${s.questionCount===0?'disabled':''}><span>${esc(s.title || s.name || s.id)}</span><small>${s.mastery==null ? `${fmt(s.questionCount)} ข้อ` : `Mastery ${fmt(s.mastery)}%`}</small></button>`).join('')}</div></div>
        <div class="card card-pad" style="margin-top:16px"><h3>ตั้งค่าชุดฝึก</h3>
          ${fieldSegment('Difficulty','difficulty',[[1,'1 Foundation'],[2,'2 Basic'],[3,'3 A-Level'],[4,'4 Hard'],[5,'5 Nightmare']],state.setup.difficulty)}
          ${fieldSegment('จำนวนข้อ','count',[[5,'5'],[10,'10'],[20,'20'],[30,'30'],['unlimited','Unlimited']],state.setup.count)}
          ${fieldSegment('Question Type','type',[['mcq','Multiple Choice'],['complex','Complex Choice'],['mixed','Mixed']],state.setup.type)}
          ${fieldSegment('Mode','mode',[['practice','Practice Mode'],['exam','Exam Mode']],state.setup.mode)}
          <p class="note">คลังโจทย์ที่ตรงเงื่อนไขมี ${fmt(available)} ข้อ · ชุดนี้จะใช้ ${fmt(selectedCount)} ข้อ</p>\n          <button class="btn primary" type="button" data-action="startChapter" ${(state.busy||available===0)?'disabled':''}>เริ่มทำโจทย์ ${icon('arrow')}</button>
        </div>
      </div><aside class="card card-pad"><span class="eyebrow">SESSION SUMMARY</span><h3 style="margin-top:15px">${esc(chapter.title || domainName(chapter.id))}</h3><div class="summary-list"><div><span>หัวข้อ</span><strong>${esc(state.selectedSubchapter==='all'?'ทุกหัวข้อ':subs.find(s=>s.id===state.selectedSubchapter)?.title || state.selectedSubchapter)}</strong></div><div><span>ระดับ</span><strong>${fmt(state.setup.difficulty)} / 5</strong></div><div><span>ข้อ</span><strong>${state.setup.count==='unlimited'?'ไม่จำกัด':fmt(state.setup.count)}</strong></div><div><span>เฉลย</span><strong>${state.setup.mode==='practice'?'หลังตอบแต่ละข้อ':'หลังส่งชุด'}</strong></div></div><p class="note" style="margin-top:18px">ข้อสอบแต่ละข้อแสดงแหล่งที่มาอย่างชัดเจน ข้อที่สร้างขึ้นใหม่ไม่แสดงเป็น Official</p></aside></div>
    `,'ฝึกแยกบท');
  };
  const fieldSegment = (title,field,options,current) => `<div class="field"><span>${esc(title)}</span><div class="segment">${options.map(([v,label])=>`<button type="button" class="${String(current)===String(v)?'selected':''}" data-action="setup" data-field="${field}" data-value="${esc(v)}" aria-pressed="${String(current)===String(v)}">${esc(label)}</button>`).join('')}</div></div>`;
  const mock = () => layout(`
    ${head('SIMULATION / A-LEVEL','A-Level Bio Mock Exam','ฝึกสภาพสอบจริง พร้อมตัวจับเวลาและตรวจคะแนนตาม Blueprint')}
    <div class="grid three">
      ${mockCard('full','Full Mock','40 ข้อ · 90 นาที · 100 คะแนน','35 Multiple Choice + 5 Complex Choice')}
      ${mockCard('half','Half Mock','20 ข้อ · 45 นาที','ชุดย่อเพื่อฝึกการจัดเวลา')}
      ${mockCard('custom','Custom Mock','กำหนดเอง','เลือกบท ความยาก จำนวนข้อ และเวลา')}
    </div>
    ${state.mock.variant==='custom' ? `<div class="card card-pad" style="margin-top:18px;max-width:760px"><h3>ตั้งค่า Custom Mock</h3><div class="grid two"><label class="field"><span>บท</span><select data-field="mockDomain"><option value="all">ทุกบท</option>${state.catalog.map(c=>`<option value="${esc(c.id)}" ${state.mock.domain===c.id?'selected':''}>${esc(c.title || domainName(c.id))}</option>`).join('')}</select></label><label class="field"><span>Difficulty</span><select data-field="mockDifficulty">${[1,2,3,4,5].map(n=>`<option value="${n}" ${state.mock.difficulty===n?'selected':''}>Level ${n}</option>`).join('')}</select></label><label class="field"><span>จำนวนข้อ</span><input type="number" min="1" max="100" value="${esc(state.mock.count)}" data-field="mockCount"></label><label class="field"><span>เวลา (นาที)</span><input type="number" min="1" max="240" value="${esc(state.mock.durationMinutes)}" data-field="mockTime"></label></div></div>` : ''}
    <div style="margin-top:20px"><button class="btn primary" data-action="startMock" ${state.busy?'disabled':''}>เริ่ม ${state.mock.variant==='full'?'Full Mock':state.mock.variant==='half'?'Half Mock':'Custom Mock'} ${icon('arrow')}</button></div>
    <div class="note" style="margin-top:22px;max-width:760px">Full Mock: Multiple Choice 35 ข้อ ข้อละ 2.4 คะแนน; Complex Choice 5 ข้อ ข้อละ 3.2 คะแนน (ถูก 2 ข้อย่อยได้ 1.6 คะแนน)</div>
  `,'จำลองสอบ');
  const mockCard = (id,title,detail,note) => `<button type="button" class="card chapter-card ${state.mock.variant===id?'selected':''}" data-action="mockVariant" data-variant="${id}" aria-pressed="${state.mock.variant===id}"><span class="kicker">${esc(id.toUpperCase())}</span><h3>${esc(title)}</h3><p>${esc(detail)}</p><div class="chapter-meta"><span>${esc(note)}</span></div></button>`;
  const daily = () => layout(`
    ${head('REVIEW / DAILY BIO','Daily Bio','ประมาณ 10 ข้อต่อวัน: Core Recall, จุดอ่อน, ข้อผิดเก่า และ Challenge')}
    <div class="grid two"><div class="card card-pad"><span class="eyebrow">TODAY'S REVIEW</span><h2 style="margin:14px 0">ทบทวนให้ความรู้คงอยู่</h2><p class="lead">ระบบจัดข้อจากแนวคิดพื้นฐาน ความผิดพลาด และช่วงเวลาที่ควรกลับมาทวน ตามประวัติการทำของคุณ</p><div class="summary-list"><div><span>Core Recall</span><strong>4 ข้อ</strong></div><div><span>Weakness</span><strong>3 ข้อ</strong></div><div><span>Previous Mistakes</span><strong>2 ข้อ</strong></div><div><span>Challenge</span><strong>1 ข้อ</strong></div></div><button class="btn primary" style="margin-top:20px" data-action="startDaily" ${state.busy?'disabled':''}>เริ่ม Daily Bio ${icon('arrow')}</button></div><div class="card card-pad"><h3>หลักการทบทวน</h3><p class="muted">หัวข้อที่ตอบผิดจะกลับมาเร็วขึ้น เมื่อทำถูกซ้ำหลายครั้ง ระยะห่างของการทบทวนจะเพิ่มขึ้น</p><div class="note">ชุดวันนี้สร้างจาก Question Bank ที่มีจริง หากข้อในหมวดใดไม่พอ ระบบจะบอกจำนวนที่จัดได้ตามจริง</div></div></div>
  `,'Daily Bio');
  const mistakes = () => {
    const rows = (state.mistakes || []).filter(x=>state.mistakeFilter==='all' || x.errorType===state.mistakeFilter);
    return layout(`
      ${head('REVIEW / MISTAKE BANK','Mistake Bank','เห็นข้อที่เคยผิด คำตอบที่เลือก และสาเหตุที่ต้องแก้')}
      <div class="inline-actions" style="margin-bottom:18px"><label class="field" style="margin:0;min-width:220px"><span>Filter by error type</span><select data-field="mistakeFilter"><option value="all">ทุกประเภท</option>${Object.entries(errorLabels).map(([id,label])=>`<option value="${id}" ${state.mistakeFilter===id?'selected':''}>${esc(label)}</option>`).join('')}</select></label>${rows.length ? `<button class="btn primary" type="button" data-action="startMistakes">ฝึกข้อที่เคยผิด</button>` : ''}</div>
      ${rows.length ? `<div class="table-list">${rows.map((m,i)=>`<article class="card card-pad"><div class="inline-actions" style="justify-content:space-between"><span class="eyebrow">${esc(m.domain ? domainName(m.domain) : m.chapter || '')} / ${esc(m.subchapter || '')}</span><span class="pill">ผิด ${fmt(m.count || 1)} ครั้ง</span></div><h3 style="margin:13px 0">${esc(m.question || `Question ${m.questionId}`)}</h3><div class="grid two"><div><small>คำตอบของคุณ</small><p>${esc(m.userAnswerLabel || m.userAnswer || '—')}</p></div><div><small>คำตอบที่ถูก</small><p>${esc(m.correctAnswerLabel || m.correctAnswer || '—')}</p></div></div><div class="inline-actions"><small>${esc(m.date ? new Date(m.date).toLocaleDateString('th-TH') : '')}</small><span class="pill">${esc(errorLabels[m.errorType] || m.errorType || 'ยังไม่ระบุสาเหตุ')}</span>${adapter.markMistakeError ? `<select aria-label="ระบุสาเหตุที่ผิด" data-field="errorType" data-mistake="${esc(m.id || m.questionId)}"><option value="">ระบุสาเหตุ</option>${Object.entries(errorLabels).map(([id,label])=>`<option value="${id}" ${m.errorType===id?'selected':''}>${esc(label)}</option>`).join('')}</select>` : ''}</div></article>`).join('')}</div>` : empty('ยังไม่มีข้อผิดในรายการนี้','เมื่อทำโจทย์และตอบผิด ข้อจะเข้ามาใน Mistake Bank',`<button class="btn primary" data-action="nav" data-view="chapters">เริ่มฝึกโจทย์</button>`)}
    `,'Mistake Bank');
  };
  const priorities = () => {
    const rows = state.priorities || [];
    const tiers = [['MUST MASTER','ต้องแม่นก่อน'],['HIGH YIELD','คะแนนคุ้มค่า'],['SECONDARY','เรียนต่อเมื่อ Core แน่น'],['FINAL POLISH','เก็บรายละเอียดเพิ่มคะแนน']];
    return layout(`
      ${head('STRATEGY / PRIORITY MAP','A-Level Bio Priority Map','จัดลำดับจากน้ำหนักข้อสอบ ความเป็นพื้นฐาน ผลของคุณ และความถี่ของข้อผิด')}
      ${state.dashboard?.questionsSolved ? '' : `<div class="note">แผนนี้เป็นลำดับเริ่มต้นจากโครงสร้างเนื้อหา เมื่อมีผลการทำโจทย์ จุดอ่อนส่วนตัวจะเปลี่ยนลำดับให้อัตโนมัติ</div>`}
      ${rows.length ? tiers.map(([tier,desc])=>{const set=rows.filter(x=>x.tier===tier);return set.length ? `<h2 class="priority-tier">${tier} / ${desc}</h2><div class="grid two">${set.map((r,i)=>`<article class="card priority-item"><div class="inline-actions" style="justify-content:space-between"><span class="eyebrow">${esc(r.domain ? domainName(r.domain) : 'CORE BIOLOGY')}</span><span class="score">${r.priorityScore==null?'':fmt(r.priorityScore)}</span></div><h3>${esc(r.title || r.concept || r.topic)}</h3>${r.accuracy==null?'':`<p class="muted">Accuracy ${fmt(r.accuracy)}%</p>`}<ul>${(r.reasons||[]).map(v=>`<li>${esc(v)}</li>`).join('')}</ul><div class="note">${esc(r.action || 'ทบทวนแนวคิดหลักแล้วทำโจทย์อีกชุด')}</div>${r.domain ? `<button class="text-link" style="margin-top:14px" data-action="chapter" data-domain="${esc(r.domain)}">ไปยังบทนี้ →</button>` : ''}</article>`).join('')}</div>` : ''}).join('') : empty('ยังจัดลำดับไม่ได้','ไม่มีข้อมูล Blueprint หรือหัวข้อพร้อมใช้งาน')}
    `,'Priority Map');
  };
  const analytics = () => {
    const a = state.analytics || {};
    const list = (data,title,formatter=x=>`${fmt(x.value)}%`) => `<div class="card card-pad"><h3>${esc(title)}</h3>${data?.length ? data.map(row=>`<div class="metric-row"><span>${esc(row.label)}</span><strong>${formatter(row)}</strong>${bar(row.value)}<small>${row.attempts == null ? '' : `${fmt(row.attempts)} attempts`}</small></div>`).join('') : empty('ยังไม่มีข้อมูล','เริ่มทำโจทย์เพื่อดูผลวิเคราะห์')}</div>`;
    return layout(`
      ${head('PERFORMANCE / ANALYTICS','Performance Analytics','สรุปจากผลการทำโจทย์จริง โดยไม่เติมข้อมูลตัวอย่าง')}
      <div class="grid stats">${stat('Exam Readiness',a.readiness==null?'—':`${fmt(a.readiness)}%`)}${stat('Average Time',a.averageTimeSeconds==null?'—':`${fmt(a.averageTimeSeconds)} วินาที`)}${stat('Questions Solved',fmt(a.questionsSolved ?? 0))}${stat('Mock Attempts',fmt(a.mockCount ?? 0))}${stat('Current Mastery',a.mastery==null?'—':`${fmt(a.mastery)}%`)}</div>
      <div class="grid two" style="margin-top:18px">${list(a.byDomain,'Accuracy by Chapter')}${list(a.byDifficulty,'Accuracy by Difficulty')}</div>
      <div class="grid two" style="margin-top:18px"><div class="card card-pad"><h3>Mock Score History</h3>${a.mockHistory?.length ? `<div class="table-list">${a.mockHistory.map(x=>`<div class="list-row"><div><strong>${esc(x.label || 'Mock Exam')}</strong><small>${esc(x.date || '')}</small></div><strong>${fmt(x.score)} / ${fmt(x.maxPoints || 100)}</strong></div>`).join('')}</div>` : empty('ยังไม่มี Mock Score','ทำ Mock Exam ครั้งแรกเพื่อเริ่มติดตามคะแนน')}</div><div class="card card-pad"><h3>Most Missed Concepts</h3>${a.mostMissed?.length ? `<div class="table-list">${a.mostMissed.map(x=>`<div class="list-row"><strong>${esc(x.label || x.concept)}</strong><span class="pill">${fmt(x.count)} ครั้ง</span></div>`).join('')}</div>` : empty('ยังไม่มีข้อมูลข้อผิด','ข้อที่ตอบผิดจะช่วยระบุ Concept ที่ต้องทวน')}</div></div>
      <div class="grid two" style="margin-top:18px">${list(a.masteryHeatmap,'Mastery Heatmap')}${list(a.difficultyHeatmap,'Difficulty Heatmap')}</div>
      ${a.overTime?.length ? `<div class="section-head"><h2>Accuracy over Time</h2></div><div class="card card-pad"><div class="table-list">${a.overTime.map(x=>`<div class="metric-row"><span>${esc(x.label)}</span><strong>${fmt(x.value)}%</strong>${bar(x.value)}</div>`).join('')}</div></div>` : ''}
      ${a.mostImproved?.length ? `<div class="section-head"><h2>Most Improved Concepts</h2></div><div class="table-list">${a.mostImproved.map(x=>`<div class="list-row"><strong>${esc(x.label || x.concept)}</strong><span>${fmt(x.delta)} จุด</span></div>`).join('')}</div>` : ''}
    `,'วิเคราะห์ผล');
  };
  const search = () => layout(`
    ${head('DISCOVER / SEARCH','ค้นหาเนื้อหาและโจทย์','ค้นหา Concept, Chapter, Practice Questions, Mistakes และ Mastery')}
    <form class="search-form" id="search-form"><label class="sr-only" for="query">คำค้นหา</label><input class="search-input" id="query" name="query" type="search" placeholder="เช่น mitosis, ADH, การสังเคราะห์โปรตีน" value="${esc(state.searchQuery)}"><button class="btn primary" type="submit">ค้นหา</button></form>
    <div style="margin-top:20px">${state.searchBusy ? '<p class="muted">กำลังค้นหา…</p>' : state.searchQuery ? (state.searchResults.length ? `<div class="table-list">${state.searchResults.map((r,i)=>`<div class="list-row"><div><span class="eyebrow">${esc(r.kind || 'CONCEPT')}</span><strong>${esc(r.title || r.label)}</strong><small>${esc(r.meta || '')}</small></div><button class="btn small" type="button" data-action="searchOpen" data-index="${i}">เปิด ${icon('chevron')}</button></div>`).join('')}</div>` : empty('ไม่พบผลการค้นหา','ลองใช้คำสำคัญอื่นหรือชื่อบท')) : empty('เริ่มค้นหา','ผลลัพธ์จะแยก Concept, บท, โจทย์ และข้อที่เคยผิด')}</div>
  `,'ค้นหา');
  const workspace = () => {
    const s = state.session;
    if (!s) return home();
    const q = s.questions[s.index || 0];
    if (!q) return layout(empty('ไม่มีโจทย์ในชุดนี้','กลับไปเลือกชุดฝึกอีกครั้ง'),'Question Workspace');
    const exam = s.examMode === true || s.mode === 'mock' || s.mode === 'exam';
    const answer = state.drafts[q.id] ?? s.answers?.[q.id];
    const feedback = state.feedback[q.id] || s.feedback?.[q.id];
    const answered = s.questions.filter(x=>complete(x,s.answers?.[x.id])).length;
    const marked = new Set(s.markedIds || []);
    const elapsedSeconds = Math.max(0,Math.floor((Date.now() - s.startedAt)/1000));
    const timeLeft = s.durationSeconds == null ? null : Math.max(0,s.durationSeconds-elapsedSeconds);
    const remaining = `${s.questions.length - answered} ข้อยังไม่ตอบ`;
    const body = `
      <div class="workspace"><header class="workspace-bar"><div class="brand"><span class="brand-mark">B</span><span><strong>BIOCORE</strong><small>${esc(s.title || 'Question Workspace')}</small></span></div><div class="inline-actions"><span class="pill">${esc(exam?'EXAM MODE':'PRACTICE MODE')}</span>${timeLeft==null?'':`<span class="timer ${timeLeft<300?'urgent':''}" data-timer>${formatSeconds(timeLeft)}</span>`}<button class="btn small quiet" type="button" data-action="exitSession">ออกจากชุด</button></div></header>
      <main class="workspace-layout"><div>
        <div class="question-top"><span>QUESTION ${fmt((s.index||0)+1)} / ${fmt(s.questions.length)}</span><span>${esc(domainName(q.domain))} · Level ${fmt(q.difficulty)}</span></div>
        <article class="card question-panel">${sourceTag(q)}<h1>${esc(q.question)}</h1>
          ${q.type==='complex' ? `<div class="choices">${questionStatements(q).map((statement,i)=>`<div class="statement"><p><strong>${i+1}.</strong> ${esc(statement)}</p><div class="segment"><button type="button" class="${answer?.[i]===true?'selected':''}" data-action="complex" data-part="${i}" data-value="true" aria-pressed="${answer?.[i]===true}">ถูก</button><button type="button" class="${answer?.[i]===false?'selected':''}" data-action="complex" data-part="${i}" data-value="false" aria-pressed="${answer?.[i]===false}">ผิด</button></div></div>`).join('')}</div>` : `<div class="choices">${(q.choices||[]).map((choice,i)=>`<button type="button" class="choice ${answer===i?'selected':''}" data-action="choice" data-choice="${i}" aria-pressed="${answer===i}"><span class="letter">${'ABCDE'[i]}</span><span>${esc(choice)}</span></button>`).join('')}</div>`}
          ${!exam && feedback ? explanation(q,feedback) : ''}
          <div class="question-footer"><button class="btn quiet" type="button" data-action="review">${marked.has(q.id)?'ยกเลิก Mark for Review':'Mark for Review'}</button><div class="inline-actions"><button class="btn" type="button" data-action="prev" ${(s.index||0)===0?'disabled':''}>ก่อนหน้า</button>${!exam && !feedback ? `<button class="btn primary" type="button" data-action="check" ${!complete(q,answer)?'disabled':''}>ตรวจคำตอบ</button>` : ''}<button class="btn" type="button" data-action="next" ${(s.index||0)>=s.questions.length-1?'disabled':''}>ถัดไป</button></div></div>
        </article></div>
        <aside class="card navigator"><div class="inline-actions" style="justify-content:space-between"><h3>Question Navigator</h3><small>${answered}/${s.questions.length}</small></div><small>${remaining}</small><div class="nav-grid">${s.questions.map((x,i)=>`<button type="button" class="nav-num ${complete(x,s.answers?.[x.id])?'answered':''} ${marked.has(x.id)?'review':''} ${i===(s.index||0)?'current':''}" data-action="jump" data-index="${i}" aria-label="ข้อ ${i+1}${complete(x,s.answers?.[x.id])?' ตอบแล้ว':''}">${i+1}</button>`).join('')}</div><div class="legend"><span><b></b>ตอบแล้ว</span><span><b class="pending"></b>ยังไม่ตอบ</span><span><b class="review"></b>ทวน</span></div><button class="btn primary" style="width:100%;margin-top:20px" type="button" data-action="askSubmit">${exam?'ส่งข้อสอบ':'จบชุดฝึก'}</button></aside>
      </main></div>${state.confirmSubmit?submitModal():''}`;
    return body;
  };
  const explanation = (q,f) => {
    const correct = f.fullyCorrect ?? f.correct;
    const correctAnswer = f.correctAnswer ?? q.correctAnswer;
    return `<section class="feedback ${correct?'':'incorrect'}" aria-live="polite"><h3>${correct?'Correct · ถูกต้อง':'Incorrect · ลองทบทวนอีกครั้ง'}</h3><p><strong>Correct Answer:</strong> ${esc(answerLabel(q,correctAnswer))}</p><h4>WHY?</h4><p>${esc(q.explanation)}</p><h4>CONCEPT</h4><p>${esc((q.concepts||[]).join(' · '))}</p><h4>ANALYZE CHOICES</h4>${questionStatements(q).map((choice,i)=>`<div class="analysis-choice"><strong>${q.type==='complex'?i+1:'ABCDE'[i]}.</strong> ${esc(q.choiceExplanations?.[i] || '')}</div>`).join('')}${q.commonTrap?`<h4>COMMON TRAP</h4><p>${esc(q.commonTrap)}</p>`:''}${q.keyTakeaways?.length?`<h4>WHAT YOU SHOULD REMEMBER</h4><ul>${q.keyTakeaways.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}${q.examTechnique?`<h4>SHORTCUT / EXAM TECHNIQUE</h4><p>${esc(q.examTechnique)}</p>`:''}${q.relatedConcepts?.length?`<h4>RELATED CONCEPTS</h4><p>${esc(q.relatedConcepts.join(' · '))}</p>`:''}</section>`;
  };
  const submitModal = () => {
    const s=state.session;
    const left=s ? s.questions.filter(q=>!complete(q,s.answers?.[q.id])).length : 0;
    return `<div class="modal-backdrop" role="presentation"><div class="card modal" role="dialog" aria-modal="true" aria-labelledby="submit-title"><h2 id="submit-title">ส่งชุดนี้เลยหรือไม่?</h2><p>${left ? `คุณยังมี ${left} ข้อที่ยังไม่ตอบ สามารถส่งได้และข้อว่างจะได้ 0 คะแนน` : 'ตรวจคำตอบและบันทึกผลการทำชุดนี้'}</p><div class="inline-actions"><button class="btn" data-action="cancelSubmit">กลับไปทำต่อ</button><button class="btn primary" data-action="submit">ส่งและดูผล</button></div></div></div>`;
  };
  const result = () => {
    const r = state.result;
    if (!r) return home();
    const domainRows = r.domainPerformance || [];
    return layout(`
      ${head('EXAM / RESULTS','ผลการทำชุด','คะแนนและแนวคิดที่ควรกลับไปเก็บ')}
      <div class="card result-hero"><div><span class="eyebrow">${esc(r.title || 'SESSION RESULT')}</span><h2 style="margin:14px 0 9px">ทำเสร็จแล้ว</h2><p class="muted">${fmt(r.correctCount)} / ${fmt(r.totalQuestions)} ข้อตอบครบถูก · ใช้เวลา ${formatSeconds(r.elapsedSeconds || 0)}${r.durationSeconds?` / ${formatSeconds(r.durationSeconds)}`:''}</p></div><div class="result-score">${fmt(r.points)} <small>/ ${fmt(r.maxPoints)}</small></div></div>
      <div class="grid two" style="margin-top:18px"><div class="card card-pad"><h3>Domain Performance</h3>${domainRows.length ? domainRows.map(x=>`<div class="metric-row"><span>${esc(x.label || domainName(x.domain))}</span><strong>${fmt(x.accuracy)}%</strong>${bar(x.accuracy)}<small>${fmt(x.correct)} / ${fmt(x.total)} ข้อ</small></div>`).join('') : empty('ยังไม่มีข้อมูลแยก Domain','ทำชุดที่มีหลาย Domain เพื่อดูผลแยกบท')}</div><div class="card card-pad"><h3>ควรเก็บอะไรต่อ?</h3>${r.recommendations?.length ? r.recommendations.map(x=>`<div class="list-row"><div><strong>${esc(x.title || x.concept)}</strong><small>${esc(x.action || x.reason || '')}</small></div></div>`).join('') : `<p class="muted">ดู Priority Map ที่คำนวณจากผลการทำล่าสุด</p>`}<button class="btn" style="margin-top:18px" data-action="nav" data-view="priority">เปิด Priority Map</button></div></div>
      ${r.items?.length ? `<div class="section-head"><h2>Review Questions</h2></div><div class="table-list">${r.items.map((item,i)=>`<details class="card card-pad"><summary style="cursor:pointer"><strong>ข้อ ${i+1} · ${esc(item.fullyCorrect?'Correct':'Review')}</strong> — ${esc(item.question?.question || item.questionText || '')}</summary>${item.question ? explanation(item.question,item) : `<p class="muted">${esc(item.explanation || '')}</p>`}</details>`).join('')}</div>` : ''}
      <div class="inline-actions" style="margin-top:22px"><button class="btn primary" data-action="nav" data-view="chapters">ฝึกต่อ</button><button class="btn" data-action="nav" data-view="analytics">ดู Analytics</button></div>
    `,'ผลการสอบ');
  };
  const formatSeconds = value => {
    const sec=Math.max(0,Math.floor(Number(value)||0));
    return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;
  };
  function render() {
    const page = ({
      home,chapters,chapter:chapterPage,mock,daily,mistakes,priority:priorities,
      analytics,search,workspace,result
    })[state.view] || home;
    root.innerHTML=page();
    if (state.view==='workspace') {
      if (timerId) clearInterval(timerId);
      timerId=setInterval(() => {
        const s=state.session;
        if (!s || s.durationSeconds == null) return;
        const left=Math.max(0,s.durationSeconds-Math.floor((Date.now()-s.startedAt)/1000));
        const node=root.querySelector('[data-timer]');
        if (node) { node.textContent=formatSeconds(left); node.classList.toggle('urgent',left<300); }
        if (left===0 && !state.busy) finishSession(true);
      },1000);
    } else if (timerId) {
      clearInterval(timerId); timerId=null;
    }
  }
  async function navigate(view) {
    state.view=view;state.error='';state.confirmSubmit=false;render();
    const loaders={home:['dashboard','overview'],chapters:['catalog','catalog'],mock:['catalog','catalog'],mistakes:['mistakes','mistakes'],priority:['priorities','priorities'],analytics:['analytics','analytics']};
    const entry=loaders[view];
    if (entry && adapter[entry[1]]) {
      try { state[entry[0]]=await adapter[entry[1]](); render(); }
      catch(error) { showError(error); }
    }
  }
  async function begin(config) {
    await run(async () => {
      const session=await adapter.startSession(config);
      if (!session?.questions?.length) throw new Error('ไม่มีโจทย์ที่ตรงกับเงื่อนไขนี้');
      state.session={...session,index:session.index||0,answers:session.answers||{},markedIds:session.markedIds||[]};
      state.feedback=session.feedback||{};state.drafts={};state.view='workspace';
    });
  }
  async function saveSelection(q,answer) {
    const s=state.session;
    const exam=s.examMode===true || s.mode==='mock' || s.mode==='exam';
    if (!exam) { if (complete(q,s.answers?.[q.id])) return; state.drafts[q.id]=answer;render();return; }
    await run(async()=>{state.session=await adapter.saveAnswer(s.id,q.id,answer);});
  }
  async function checkAnswer() {
    const s=state.session,q=s.questions[s.index||0],answer=state.drafts[q.id] ?? s.answers?.[q.id];
    if (!complete(q,answer)) return;
    await run(async()=>{
      if (!complete(q,s.answers?.[q.id])) state.session=await adapter.saveAnswer(s.id,q.id,answer);
      state.feedback[q.id]=await adapter.revealPractice(s.id,q.id);
      delete state.drafts[q.id];
    });
  }
  async function finishSession(auto=false) {
    if (!state.session || state.busy) return;
    state.confirmSubmit=false;
    await run(async()=>{
      state.result=await adapter.finish(state.session.id,{auto});
      state.session=null;
      state.view='result';
      if (adapter.overview) state.dashboard=await adapter.overview();
    });
  }
  root.addEventListener('click', async event => {
    const el=event.target.closest('[data-action]');
    if (!el || !root.contains(el)) return;
    const action=el.dataset.action;
    if (action==='nav') return navigate(el.dataset.view);
    if (action==='chapter') {state.selectedDomain=el.dataset.domain;state.selectedSubchapter='all';state.view='chapter';render();return;}
    if (action==='subchapter') {state.selectedSubchapter=el.dataset.subchapter;render();return;}
    if (action==='setup') {const {field,value}=el.dataset;state.setup[field]=['difficulty','count'].includes(field)&&value!=='unlimited'?Number(value):value;render();return;}
    if (action==='mockVariant') {state.mock.variant=el.dataset.variant;render();return;}
    if (action==='startChapter') return begin({kind:'chapter',mode:state.setup.mode,domain:state.selectedDomain,subchapter:state.selectedSubchapter==='all'?null:state.selectedSubchapter,difficulty:state.setup.difficulty,count:state.setup.count==='unlimited'?null:state.setup.count,questionType:state.setup.type});
    if (action==='startMock') return begin({kind:'mock',mode:'exam',variant:state.mock.variant,domain:state.mock.variant==='custom'&&state.mock.domain!=='all'?state.mock.domain:null,difficulty:state.mock.variant==='custom'?state.mock.difficulty:null,count:state.mock.variant==='full'?40:state.mock.variant==='half'?20:state.mock.count,durationSeconds:state.mock.variant==='full'?5400:state.mock.variant==='half'?2700:state.mock.durationMinutes*60});
    if (action==='startDaily') return begin({kind:'daily',mode:'practice'});
    if (action==='startMistakes') return begin({kind:'mistakes',mode:'practice',questionIds:(state.mistakes||[]).filter(x=>state.mistakeFilter==='all'||x.errorType===state.mistakeFilter).map(x=>x.questionId)});
    if (action==='choice' || action==='complex') {
      const s=state.session,q=s.questions[s.index||0];
      if (action==='choice') return saveSelection(q,Number(el.dataset.choice));
      const current=state.drafts[q.id] ?? s.answers?.[q.id] ?? [null,null,null];
      const answer=[...current];answer[Number(el.dataset.part)]=el.dataset.value==='true';
      return saveSelection(q,answer);
    }
    if (action==='check') return checkAnswer();
    if (action==='jump' || action==='prev' || action==='next') {
      const s=state.session;
      const index=action==='jump'?Number(el.dataset.index):Math.max(0,Math.min(s.questions.length-1,(s.index||0)+(action==='next'?1:-1)));
      if (adapter.setIndex) { try { state.session=await adapter.setIndex(s.id,index); } catch(error) { showError(error); return; } } else state.session={...s,index}; render(); return;
    }
    if (action==='review') return run(async()=>{
      const s=state.session,q=s.questions[s.index||0];
      state.session=await adapter.markReview(s.id,q.id);
    });
    if (action==='askSubmit') {state.confirmSubmit=true;render();return;}
    if (action==='cancelSubmit') {state.confirmSubmit=false;render();return;}
    if (action==='submit') return finishSession();
    if (action==='exitSession') {state.view='home';state.confirmSubmit=false;render();return;}
    if (action==='resumeSession') {state.view='workspace';render();return;}
    if (action==='searchOpen') {
      const item=state.searchResults[Number(el.dataset.index)];
      if (!item) return;
      if (item.kind==='chapter' || item.domain && !item.concept && !item.questionId) {state.selectedDomain=item.domain||item.id;state.selectedSubchapter='all';state.view='chapter';render();return;}
      if (item.kind==='mistake') return navigate('mistakes');
      if (item.kind==='mastery') return navigate('analytics');
      return begin({kind:'search',mode:'practice',concept:item.concept||item.title||item.label,questionIds:item.questionId?[item.questionId]:null,count:5});
    }
  });
  root.addEventListener('change', async event => {
    const el=event.target;
    const field=el.dataset.field;
    if (field==='mockDomain') state.mock.domain=el.value;
    if (field==='mockDifficulty') state.mock.difficulty=Number(el.value);
    if (field==='mockCount') state.mock.count=Math.max(1,Math.min(100,Number(el.value)||1));
    if (field==='mockTime') state.mock.durationMinutes=Math.max(1,Math.min(240,Number(el.value)||1));
    if (field==='mistakeFilter') {state.mistakeFilter=el.value;render();}
    if (field==='errorType' && adapter.markMistakeError) await run(async()=>{await adapter.markMistakeError(el.dataset.mistake,el.value);state.mistakes=await adapter.mistakes();});
  });
  root.addEventListener('submit', async event => {
    if (event.target.id!=='search-form') return;
    event.preventDefault();
    const query=event.target.querySelector('[name=query]').value.trim();
    state.searchQuery=query;
    if (!query) {state.searchResults=[];render();return;}
    state.searchBusy=true;render();
    try {state.searchResults=await adapter.search(query);}
    catch(error) {showError(error);return;}
    state.searchBusy=false;render();
  });
  render();
  Promise.allSettled([adapter.overview?.(),Promise.resolve([]),adapter.resume?.()]).then(results=>{
    const [overview,catalog,resume]=results;
    if (overview.status==='fulfilled') state.dashboard=overview.value;
    if (catalog.status==='fulfilled') state.catalog=catalog.value || [];
    if (resume.status==='fulfilled' && resume.value?.questions?.length) {
      state.session=resume.value;
      state.feedback=resume.value.feedback||{};
      state.view='workspace';
    }
    render();
  });
  return {navigate,render,dispose(){if(timerId)clearInterval(timerId);root.innerHTML='';}};
}
