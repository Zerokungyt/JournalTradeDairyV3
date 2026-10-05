import { assembleFullMock, assembleHalfMock, assembleMock, selectAdaptiveQuestions, selectDailyQuestions, dueConceptsFromReviews, calculateMastery, deriveTopicStats, rankPriorities } from "../engine.js";
import { taxonomy } from "../data/taxonomy.js";
const day = timestamp => new Date(timestamp).toISOString().slice(0,10);
const label = domain => taxonomy.find(item => item.id === domain)?.titleTh || domain;
function conceptMastery(attempts) {
  const names = new Set(attempts.flatMap(a => a.concepts || []));
  return Object.fromEntries([...names].map(name => [name,calculateMastery(attempts.filter(a => a.concepts?.includes(name))).score]));
}
export function selectQuestions(config, bank, state, now = Date.now()) {
  const seed = day(now) + ":" + state.attempts.length + ":" + (config.kind || "");
  let questions = [], title = "", mode = config.mode === "practice" ? "practice" : "exam";
  if (config.kind === "mock") {
    mode = "mock";
    if (config.variant === "full") {
      questions = assembleFullMock(bank,seed);
      title = "A-Level Bio · Full Mock";
    } else if (config.variant === "half") {
      questions = assembleHalfMock(bank,seed);
      title = "A-Level Bio · Half Mock";
    } else {
      const candidates = bank.filter(q => (!config.domain || q.domain === config.domain) && (!config.difficulty || q.difficulty === config.difficulty));
      const count = Math.min(Math.max(1,Number(config.count) || 20),candidates.length);
      const complexCount = Math.min(Math.round(count/8),candidates.filter(q => q.type === "complex").length);
      const mcCount = candidates.filter(q => q.type === "mcq").length;
      const neededComplex = Math.max(complexCount,count-mcCount);
      questions = assembleMock(candidates,{count,complexCount:neededComplex,seed});
      title = "A-Level Bio · Custom Mock";
    }
  } else if (config.kind === "chapter") {
    const candidates = bank.filter(q => q.domain === config.domain &&
      (!config.subchapter || q.subchapter === config.subchapter) &&
      (!config.difficulty || q.difficulty === config.difficulty) &&
      (config.questionType === "mixed" || !config.questionType || q.type === config.questionType));
    const count = config.count == null ? candidates.length : Math.min(Number(config.count),candidates.length);
    const masteryByConcept = conceptMastery(state.attempts);
    questions = selectAdaptiveQuestions(candidates,{count,masteryByConcept,dueConcepts:dueConceptsFromReviews(state.reviews,now),
      mistakeQuestionIds:state.mistakes.map(m => m.questionId),difficulty:config.difficulty || 3,seed});
    title = (config.subchapter || label(config.domain)) + (mode === "practice" ? " · Practice" : " · Exam");
  } else if (config.kind === "daily") {
    mode = "practice";
    const priorities = rankPriorities(deriveTopicStats(bank,state.attempts,now),now).slice(0,12);
    const weakChapters = new Set(priorities.filter(x => x.mastery != null && x.mastery < 65).map(x => x.id));
    const weakConcepts = [...new Set(bank.filter(q => weakChapters.has(q.subchapter)).flatMap(q => q.concepts || []))];
    const coreConcepts = [...new Set(bank.filter(q => q.difficulty <= 2).flatMap(q => q.concepts || []))];
    const answeredTodayIds = state.attempts.filter(a => day(a.timestamp) === day(now)).map(a => a.questionId);
    questions = selectDailyQuestions(bank,{coreConcepts,weakConcepts,mistakeQuestionIds:state.mistakes.map(m => m.questionId),
      dueConcepts:dueConceptsFromReviews(state.reviews,now),answeredTodayIds,seed}).map(p => p.question);
    title = "Daily Bio";
  } else if (config.kind === "mistakes") {
    mode = "practice";
    const ids = config.questionIds?.length ? config.questionIds : state.mistakes.map(m => m.questionId);
    const byId = new Map(bank.map(q => [q.id,q]));
    questions = ids.map(id => byId.get(id)).filter(Boolean);
    title = "Mistake Bank · Review";
  } else if (config.kind === "search") {
    mode = "practice";
    const ids = new Set(config.questionIds || []);
    const matches = bank.filter(q => ids.has(q.id) || (config.concept && (q.concepts || []).some(c => c.toLocaleLowerCase().includes(String(config.concept).toLocaleLowerCase()))));
    questions = matches.slice(0,Math.max(1,Number(config.count) || 5));
    title = "Search · Practice";
  } else throw new Error("Unknown session kind: " + config.kind);
  if (!questions.length) throw new Error("ไม่มีโจทย์ที่ตรงกับเงื่อนไขนี้ กรุณาปรับบท ระดับ หรือประเภทข้อ");
  return { questions, title, mode };
}
