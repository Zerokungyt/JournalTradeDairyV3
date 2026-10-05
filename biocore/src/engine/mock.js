import { DOMAIN_IDS, FULL_MOCK_QUOTAS, stableOrder, dedupeQuestions, scoreExam, clamp, isAnswered } from "./base.js";
export function assembleFullMock(pool, seed = "full") {
  const unique = dedupeQuestions(pool);
  const result = [], selected = new Set();
  for (const type of ["mcq","complex"]) {
    for (const domain of DOMAIN_IDS) {
      const count = FULL_MOCK_QUOTAS[type][domain];
      const candidates = stableOrder(unique.filter(q => q.type === type && q.domain === domain && !selected.has(q.id)), seed + ":" + type + ":" + domain);
      if (candidates.length < count) throw new Error("Insufficient " + type + " questions in " + domain + ": need " + count + ", have " + candidates.length);
      for (const q of candidates.slice(0,count)) { selected.add(q.id); result.push(q); }
    }
  }
  const mcq = stableOrder(result.filter(q => q.type === "mcq"), seed + ":mcq:order");
  const complex = stableOrder(result.filter(q => q.type === "complex"), seed + ":complex:order");
  const output = [...mcq, ...complex];
  if (output.length !== 40 || scoreExam(output).maxPoints !== 100) throw new Error("Invalid full mock composition");
  return output;
}
export const HALF_MOCK_QUOTAS = Object.freeze({
  mcq: Object.freeze({ ecology: 2, cell: 3, human: 6, plant: 3, genetics: 3 }),
  complex: Object.freeze({ ecology: 1, cell: 0, human: 1, plant: 0, genetics: 1 })
});
export function assembleHalfMock(pool, seed = "half") {
  const unique = dedupeQuestions(pool);
  const result = [];
  for (const type of ["mcq","complex"]) for (const domain of DOMAIN_IDS) {
    const count = HALF_MOCK_QUOTAS[type][domain];
    const candidates = stableOrder(unique.filter(q => q.type === type && q.domain === domain),seed + ":" + type + ":" + domain);
    if (candidates.length < count) throw new Error("Insufficient " + type + " questions in " + domain + " for half mock");
    result.push(...candidates.slice(0,count));
  }
  return [...stableOrder(result.filter(q => q.type === "mcq"),seed + ":mcq:order"),
    ...stableOrder(result.filter(q => q.type === "complex"),seed + ":complex:order")];
}
export function assembleMock(pool, options = {}) {
  const { count = 20, complexCount = Math.round(count / 8), domains = DOMAIN_IDS, difficulty = null, seed = "mock" } = options;
  if (!Number.isInteger(count) || count < 1 || !Number.isInteger(complexCount) || complexCount < 0 || complexCount > count) throw new Error("Invalid mock size");
  const unique = dedupeQuestions(pool).filter(q => domains.includes(q.domain) && (difficulty == null || q.difficulty === difficulty));
  const complex = stableOrder(unique.filter(q => q.type === "complex"), seed + ":complex").slice(0,complexCount);
  const mcq = stableOrder(unique.filter(q => q.type === "mcq"), seed + ":mcq").slice(0,count-complexCount);
  if (complex.length !== complexCount || mcq.length !== count-complexCount) throw new Error("Insufficient questions for mock");
  return [...mcq,...complex];
}
export function remainingSeconds(startedAt, durationSeconds, now = Date.now(), submittedAt = null) {
  return clamp(Math.ceil((Number(startedAt) + durationSeconds * 1000 - Number(submittedAt ?? now)) / 1000), 0, durationSeconds);
}
export function elapsedSeconds(startedAt, durationSeconds, now = Date.now(), submittedAt = null) {
  return clamp(Math.floor((Number(submittedAt ?? now) - Number(startedAt)) / 1000), 0, durationSeconds);
}
export function formatTime(seconds) {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  return String(Math.floor(safe / 60)).padStart(2,"0") + ":" + String(safe % 60).padStart(2,"0");
}
export function moveQuestion(index, delta, length) { return clamp(index + delta, 0, Math.max(0,length-1)); }
export function navigatorSummary(questionIds, answers = {}, markedIds = [], currentIndex = 0, questionById = {}) {
  const marked = new Set(markedIds);
  const statuses = questionIds.map((id,index) => {
    const q = questionById[id];
    const value = answers[id];
    const answered = q ? isAnswered(q, value) : Array.isArray(value) ? value.length === 3 && value.every(x => typeof x === "boolean") : Number.isInteger(value) && value >= 0 && value < 5;
    return { id, answered, marked: marked.has(id), current: index === currentIndex };
  });
  return { answered: statuses.filter(x => x.answered).length, unanswered: statuses.filter(x => !x.answered).length, marked: statuses.filter(x => x.marked).length, currentIndex: clamp(currentIndex,0,Math.max(0,questionIds.length-1)), statuses };
}
