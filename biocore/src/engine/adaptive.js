import { stableOrder, dedupeQuestions, DOMAIN_WEIGHTS, hash } from "./base.js";
export function recommendNextDifficulty(recentAttempts, current = 3) {
  const atLevel = recentAttempts.filter(a => a.difficulty === current).sort((a,b) => b.timestamp-a.timestamp);
  const ratio = a => a.points/a.maxPoints;
  if (atLevel.length >= 3 && atLevel.slice(0,3).every(a => ratio(a) >= 0.8))
    return { difficulty: Math.min(5,current+1), reason: "ทำถูกต่อเนื่อง เพิ่มระดับเพื่อฝึกการวิเคราะห์" };
  if (atLevel.length >= 2 && atLevel.slice(0,2).every(a => ratio(a) <= 0.4))
    return { difficulty: Math.max(1,current-1), reason: "ทบทวน prerequisite และลดระดับชั่วคราว" };
  return { difficulty: current, reason: "ฝึกระดับปัจจุบันต่อเพื่อให้ผลเสถียร" };
}
export function selectAdaptiveQuestions(pool, options = {}) {
  const { count = 10, masteryByConcept = {}, dueConcepts = [], mistakeQuestionIds = [], answeredIds = [], difficulty = 3, seed = "adaptive" } = options;
  const due = new Set(dueConcepts), mistakes = new Set(mistakeQuestionIds), answered = new Set(answeredIds);
  return stableOrder(dedupeQuestions(pool).filter(q => !answered.has(q.id)),seed)
    .map(q => {
      const weakness = q.concepts.length ? q.concepts.reduce((sum,c) => sum + (100-(masteryByConcept[c] ?? 50))/100,0)/q.concepts.length : 0.5;
      const dueBonus = q.concepts.some(c => due.has(c)) ? 0.8 : 0;
      const mistakeBonus = mistakes.has(q.id) ? 0.7 : 0;
      const yieldScore = q.examWeight ?? DOMAIN_WEIGHTS[q.domain];
      const levelFit = 1 - Math.min(1,Math.abs(q.difficulty-difficulty)/4);
      return { q, score: 2*weakness + dueBonus + mistakeBonus + yieldScore + 0.5*levelFit };
    }).sort((a,b) => b.score-a.score || hash(seed+a.q.id)-hash(seed+b.q.id)).slice(0,count).map(x => x.q);
}
export function selectDailyQuestions(pool, options = {}) {
  const { coreConcepts = [], weakConcepts = [], mistakeQuestionIds = [], dueConcepts = [], answeredTodayIds = [], seed = "daily" } = options;
  const core = new Set(coreConcepts), weak = new Set(weakConcepts), mistakes = new Set(mistakeQuestionIds), due = new Set(dueConcepts), answered = new Set(answeredTodayIds);
  const available = stableOrder(dedupeQuestions(pool).filter(q => !answered.has(q.id)),seed);
  const selected = new Map();
  const picks = [];
  function take(reason, limit, predicate) {
    const candidates = available.filter(q => !selected.has(q.id) && predicate(q)).sort((a,b) => Number(b.concepts.some(c => due.has(c))) - Number(a.concepts.some(c => due.has(c))) || hash(seed+a.id)-hash(seed+b.id));
    for (const q of candidates.slice(0,limit)) { selected.set(q.id,true); picks.push({ question: q, reason }); }
  }
  take("mistake",2,q => mistakes.has(q.id));
  take("challenge",1,q => q.difficulty >= 4);
  take("weakness",3,q => q.concepts.some(c => weak.has(c)));
  take("core",4,q => q.difficulty <= 2 && q.concepts.some(c => core.has(c)));
  take("mixed",10-picks.length,() => true);
  const order = { core:0, weakness:1, mistake:2, challenge:3, mixed:4 };
  return picks.sort((a,b) => order[a.reason]-order[b.reason]);
}
