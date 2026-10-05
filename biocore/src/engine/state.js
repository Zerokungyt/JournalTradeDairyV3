import { clamp, scoreQuestion, ERRORS } from "./base.js";
export function updateReview(item, quality, now = Date.now()) {
  const prior = item || { repetitions: 0, intervalDays: 0, ease: 2.5 };
  const grade = clamp(Math.round(quality),0,5);
  const ease = Math.max(1.3, prior.ease + (0.1 - (5-grade) * (0.08 + (5-grade) * 0.02)));
  const repetitions = grade < 3 ? 0 : prior.repetitions + 1;
  const intervalDays = grade < 3 ? 0.25 : repetitions === 1 ? 1 : repetitions === 2 ? 3 : Math.max(4, Math.round(prior.intervalDays * ease));
  return { repetitions, intervalDays, ease, lastResultAt: now, dueAt: now + intervalDays * 86400000 };
}
export function createInitialState() { return { version: 1, attempts: [], mistakes: [], reviews: {}, mockHistory: [], activeSession: null }; }
export function createStateRepository(storage, key = "biocore-state-v1") {
  return {
    load() {
      const raw = storage.getItem(key);
      if (!raw) return createInitialState();
      try {
        const value = JSON.parse(raw);
        if (value.version !== 1 || !Array.isArray(value.attempts) || !Array.isArray(value.mistakes) || !value.reviews || !Array.isArray(value.mockHistory)) throw new Error("Invalid state");
        return { ...createInitialState(), ...value };
      } catch { return createInitialState(); }
    },
    save(state) { storage.setItem(key, JSON.stringify(state)); return state; },
    update(fn) { const next = fn(this.load()); this.save(next); return next; }
  };
}
export function createMemoryStorage() {
  const data = new Map();
  return { getItem: key => data.has(key) ? data.get(key) : null, setItem: (key,value) => { data.set(key,String(value)); }, removeItem: key => data.delete(key) };
}
export function recordAttempt(state, question, answer, mode = "practice", elapsed = 0, errorType = null, at = Date.now()) {
  const result = scoreQuestion(question, answer);
  const attempt = {
    questionId: question.id, domain: question.domain, chapter: question.chapter, subchapter: question.subchapter,
    concepts: [...question.concepts], difficulty: question.difficulty, answer, points: result.points, maxPoints: result.maxPoints,
    fullyCorrect: result.fullyCorrect, mode, timestamp: at, elapsedSeconds: Math.max(0,Math.floor(elapsed))
  };
  const mistakes = [...state.mistakes];
  const existing = mistakes.findIndex(x => x.questionId === question.id);
  if (!result.fullyCorrect) {
    const previous = existing >= 0 ? mistakes[existing] : null;
    const record = { questionId: question.id, domain: question.domain, subchapter: question.subchapter, difficulty: question.difficulty,
      lastAnswer: answer, correctAnswer: question.correctAnswer, wrongCount: (previous?.wrongCount || 0) + 1,
      firstWrongAt: previous?.firstWrongAt || at, lastWrongAt: at, errorType: ERRORS.has(errorType) ? errorType : previous?.errorType || null,
      resolvedAt: null };
    if (existing >= 0) mistakes[existing] = record; else mistakes.push(record);
  } else if (existing >= 0) {
    mistakes[existing] = { ...mistakes[existing], resolvedAt: at };
  }
  const reviews = { ...state.reviews };
  for (const concept of question.concepts) reviews[concept] = updateReview(reviews[concept], result.fullyCorrect ? 5 : result.points > 0 ? 2 : 0, at);
  return { ...state, attempts: [...state.attempts, attempt], mistakes, reviews };
}
export function setMistakeErrorType(state, questionId, errorType) {
  if (!ERRORS.has(errorType)) throw new Error("Invalid error type");
  return { ...state, mistakes: state.mistakes.map(item => item.questionId === questionId ? { ...item, errorType } : item) };
}
