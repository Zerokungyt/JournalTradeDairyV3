export const DOMAIN_WEIGHTS = Object.freeze({ ecology: 0.15, cell: 0.175, human: 0.325, plant: 0.175, genetics: 0.175 });
export const FULL_MOCK_QUOTAS = Object.freeze({
  mcq: Object.freeze({ ecology: 5, cell: 6, human: 12, plant: 6, genetics: 6 }),
  complex: Object.freeze({ ecology: 1, cell: 1, human: 1, plant: 1, genetics: 1 })
});
export const POINTS = Object.freeze({ mcq: 2.4, complex: 3.2 });
export const DOMAIN_IDS = Object.keys(DOMAIN_WEIGHTS);
export const ERRORS = new Set(["Knowledge Gap", "Concept Confusion", "Misread", "Calculation", "Reasoning", "Trap"]);
export const round1 = n => Math.round((n + Number.EPSILON) * 10) / 10;
export const clamp = (n, low, high) => Math.min(high, Math.max(low, n));
export const normalize = value => String(value ?? "").normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
export function hash(value, seed = 2166136261) {
  let h = seed >>> 0;
  for (let i = 0; i < value.length; i++) { h ^= value.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function stableOrder(items, seed) { return [...items].sort((a,b) => hash(seed + ":" + a.id) - hash(seed + ":" + b.id) || a.id.localeCompare(b.id)); }
export function questionStatements(question) {
  return question.type === "complex" && Array.isArray(question.statements) && question.statements.length ? question.statements : (question.choices || []);
}
export function questionFingerprint(question) {
  return normalize(question.type) + "|" + normalize(question.question) + "|" + questionStatements(question).map(normalize).sort().join("|");
}
export function stableQuestionId(question) {
  const value = questionFingerprint(question);
  return "bio-" + hash(value).toString(36) + hash(value, 374761393).toString(36);
}
function answerSignature(question) {
  if (question.type === "mcq") return normalize(question.choices?.[question.correctAnswer]);
  const parts = questionStatements(question);
  return parts.map((part,index) => normalize(part) + ":" + String(question.correctAnswer?.[index])).sort().join("|");
}
export function dedupeQuestions(questions) {
  const ids = new Map(), signatures = new Map(), result = [];
  for (const question of questions) {
    const signature = questionFingerprint(question);
    if (ids.has(question.id) && ids.get(question.id) !== signature) throw new Error("Conflicting question ID: " + question.id);
    ids.set(question.id, signature);
    const answer = answerSignature(question);
    if (signatures.has(signature)) {
      if (signatures.get(signature) !== answer) throw new Error("Conflicting answer for duplicate content: " + question.id);
      continue;
    }
    signatures.set(signature,answer);
    result.push(question);
  }
  return result;
}
export function validateQuestion(question) {
  const issues = [];
  if (!question || typeof question !== "object") return ["Question must be an object"];
  if (!question.id || typeof question.id !== "string") issues.push("id");
  if (!["mcq","complex"].includes(question.type)) issues.push("type");
  if (!DOMAIN_IDS.includes(question.domain)) issues.push("domain");
  if (!Number.isInteger(question.difficulty) || question.difficulty < 1 || question.difficulty > 5) issues.push("difficulty");
  if (!question.subchapter || !question.chapter) issues.push("taxonomy");
  if (!Array.isArray(question.concepts) || question.concepts.length === 0) issues.push("concepts");
  if (!question.question || !question.explanation || !question.commonTrap) issues.push("question/explanation/trap");
  if (!Array.isArray(question.keyTakeaways) || question.keyTakeaways.length === 0) issues.push("keyTakeaways");
  if (!["official","drive","generated","adapted"].includes(question.sourceType)) issues.push("sourceType");
  if (question.sourceType === "official" && !question.sourceReference) issues.push("official sourceReference");
  if (!Number.isFinite(question.estimatedTime) || question.estimatedTime <= 0) issues.push("estimatedTime");
  const count = question.type === "mcq" ? 5 : 3;
  const parts = questionStatements(question);
  if (!Array.isArray(parts) || parts.length !== count || parts.some(x => !normalize(x)) || new Set(parts.map(normalize)).size !== count) issues.push(question.type === "complex" ? "statements" : "choices");
  if (!Array.isArray(question.choiceExplanations) || question.choiceExplanations.length !== count || question.choiceExplanations.some(x => !String(x || "").trim())) issues.push("choiceExplanations");
  if (question.type === "mcq" && (!Number.isInteger(question.correctAnswer) || question.correctAnswer < 0 || question.correctAnswer > 4)) issues.push("correctAnswer");
  if (question.type === "complex" && (!Array.isArray(question.correctAnswer) || question.correctAnswer.length !== 3 || question.correctAnswer.some(x => typeof x !== "boolean"))) issues.push("correctAnswer");
  return issues;
}
export function validateQuestionBank(questions) {
  const issues = [];
  for (const q of questions) for (const issue of validateQuestion(q)) issues.push(q?.id + ": " + issue);
  try { dedupeQuestions(questions); } catch (error) { issues.push(error.message); }
  return issues;
}
export function isAnswered(question, answer) {
  if (question.type === "mcq") return Number.isInteger(answer) && answer >= 0 && answer < 5;
  return Array.isArray(answer) && answer.length === 3 && answer.every(x => typeof x === "boolean");
}
export function scoreQuestion(question, answer) {
  const maxPoints = POINTS[question.type];
  if (question.type === "mcq") {
    const answered = isAnswered(question, answer);
    const correctParts = answered && answer === question.correctAnswer ? 1 : 0;
    return { points: correctParts ? maxPoints : 0, maxPoints, correctParts, totalParts: 1, fullyCorrect: correctParts === 1, answered };
  }
  const parts = Array.isArray(answer) ? answer : [];
  const correctParts = [0,1,2].reduce((total,index) => total + (typeof parts[index] === "boolean" && parts[index] === question.correctAnswer[index] ? 1 : 0), 0);
  const points = correctParts === 3 ? 3.2 : correctParts === 2 ? 1.6 : 0;
  return { points, maxPoints, correctParts, totalParts: 3, fullyCorrect: correctParts === 3, answered: isAnswered(question, answer) };
}
export function scoreExam(questions, answers = {}) {
  const items = questions.map(question => ({ questionId: question.id, domain: question.domain, ...scoreQuestion(question, answers[question.id]) }));
  const points = round1(items.reduce((sum,item) => sum + item.points, 0));
  const maxPoints = round1(items.reduce((sum,item) => sum + item.maxPoints, 0));
  const fullyCorrect = items.filter(item => item.fullyCorrect).length;
  const byDomain = Object.fromEntries(DOMAIN_IDS.map(id => [id, { points: 0, maxPoints: 0, correct: 0, count: 0 }]));
  for (const item of items) {
    const row = byDomain[item.domain];
    row.points = round1(row.points + item.points);
    row.maxPoints = round1(row.maxPoints + item.maxPoints);
    row.correct += Number(item.fullyCorrect);
    row.count++;
  }
  return { points, maxPoints, fullyCorrect, totalQuestions: questions.length, accuracy: questions.length ? fullyCorrect / questions.length : 0, unanswered: items.filter(item => !item.answered).length, byDomain, items };
}
