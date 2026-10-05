export const DOMAINS = Object.freeze(["ecology", "cell", "human", "plant", "genetics"]);
const seedLoaders = {
  ecology: () => import("./seed/ecology.js"),
  cell: () => import("./seed/cell.js"),
  human: () => import("./seed/human.js"),
  plant: () => import("./seed/plant.js"),
  genetics: () => import("./seed/genetics.js"),
};
const cache = new Map();
const domainSet = new Set(DOMAINS);
const normalize = value => String(value ?? "").normalize("NFKC").trim().toLocaleLowerCase();
export function validateQuestion(q) {
  if (!q || typeof q.id !== "string" || !q.id) throw new Error("Question has no deterministic id");
  if (!domainSet.has(q.domain)) throw new Error("Unknown domain: " + q.id);
  if (!Number.isInteger(q.difficulty) || q.difficulty < 1 || q.difficulty > 5) throw new Error("Invalid difficulty: " + q.id);
  if (!["generated", "official", "drive", "adapted"].includes(q.sourceType)) throw new Error("Invalid source type: " + q.id);
  const choices = q.choices?.length ? q.choices : q.statements;
  if (q.type === "mcq") {
    if (choices?.length !== 5 || !Number.isInteger(q.correctAnswer) || q.correctAnswer < 0 || q.correctAnswer > 4) throw new Error("Invalid MC question: " + q.id);
  } else if (q.type === "complex") {
    if (choices?.length !== 3 || q.correctAnswer?.length !== 3 || q.correctAnswer.some(value => typeof value !== "boolean")) throw new Error("Invalid complex question: " + q.id);
  } else throw new Error("Invalid question type: " + q.id);
  if (!q.question || !q.explanation || q.choiceExplanations?.length !== choices.length) throw new Error("Incomplete explanation: " + q.id);
  return q;
}
function selectDomains(domains) {
  const selected = domains == null ? DOMAINS : typeof domains === "string" ? [domains] : [...domains];
  const distinct = [...new Set(selected)];
  for (const domain of distinct) if (!domainSet.has(domain)) throw new Error("Unknown domain: " + domain);
  return distinct;
}
export async function loadQuestions(domains) {
  const selected = selectDomains(domains);
  const key = [...selected].sort().join("|");
  if (!cache.has(key)) cache.set(key, (async () => {
    const seedModules = await Promise.all(selected.map(domain => seedLoaders[domain]()));
    const all = seedModules.flatMap(module => module.questions);
    const ids = new Map(), contents = new Map(), unique = [];
    for (const q of all) {
      validateQuestion(q);
      const choices = q.choices?.length ? q.choices : q.statements;
      const fingerprint = normalize(q.question) + "|" + choices.map(normalize).join("|");
      const priorId = ids.get(q.id);
      if (priorId) {
        if (priorId !== fingerprint) throw new Error("Question id collision: " + q.id);
        continue;
      }
      const priorContent = contents.get(fingerprint);
      if (priorContent) {
        if (JSON.stringify(priorContent.correctAnswer) !== JSON.stringify(q.correctAnswer)) throw new Error("Duplicate question with conflicting answer: " + q.id);
        continue;
      }
      ids.set(q.id, fingerprint);
      contents.set(fingerprint, q);
      unique.push(q);
    }
    return unique;
  })().catch(error => { cache.delete(key); throw error; }));
  return cache.get(key);
}
export async function getQuestionById(id) {
  return (await loadQuestions()).find(q => q.id === id) ?? null;
}
export async function searchQuestions(term, domains) {
  const needle = normalize(term);
  if (!needle) return [];
  return (await loadQuestions(domains)).filter(q => [q.question, q.chapter, q.subchapter, ...(q.concepts || []), ...(q.tags || [])].some(value => normalize(value).includes(needle)));
}
export { taxonomy } from "./taxonomy.js";
