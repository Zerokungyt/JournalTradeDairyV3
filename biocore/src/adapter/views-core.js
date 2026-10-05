import { taxonomy } from "../data/taxonomy.js";
import { calculateMastery, deriveTopicStats, rankPriorities } from "../engine.js";
export const th = id => taxonomy.find(d => d.id === id)?.titleTh || id;
const pct = value => value == null ? null : Math.round(value * 100);
const accuracy = attempts => attempts.length ? attempts.filter(a => a.fullyCorrect).length / attempts.length : null;
export const dateKey = timestamp => new Date(timestamp).toISOString().slice(0,10);
export function answerLabel(question, answer) {
  if (answer == null) return "—";
  if (question?.type === "complex") {
    if (!Array.isArray(answer)) return "—";
    return answer.map((value,index) => (index+1) + ": " + (value === true ? "ถูก" : value === false ? "ผิด" : "—")).join(" · ");
  }
  if (!Number.isInteger(answer)) return "—";
  return String.fromCharCode(65+answer) + (question?.choices?.[answer] ? " — " + question.choices[answer] : "");
}
export function catalogView(bank,state) {
  return taxonomy.map(domain => {
    const questions = bank.filter(q => q.domain === domain.id);
    const attempts = state.attempts.filter(a => a.domain === domain.id);
    return { id:domain.id, title:domain.titleTh, description:domain.title,
      weightRange:domain.targetQuestions[0] + "–" + domain.targetQuestions[1] + " ข้อ",
      questionCount:questions.length, mastery:calculateMastery(attempts).score,
      availability:questions.map(q => ({subchapter:q.subchapter,difficulty:q.difficulty,type:q.type})),
      subchapters:[...new Set([...domain.subchapters,...questions.map(q => q.subchapter)])].map(name => ({
        id:name,title:name,questionCount:questions.filter(q => q.subchapter === name).length,
        mastery:calculateMastery(attempts.filter(a => a.subchapter === name)).score
      })) };
  });
}
export function prioritiesView(bank,state) {
  const ranked = rankPriorities(deriveTopicStats(bank,state.attempts));
  return ranked.map((topic,index) => {
    const rank = (index+1)/Math.max(1,ranked.length);
    const tier = rank <= 0.2 ? "MUST MASTER" : rank <= 0.5 ? "HIGH YIELD" : rank <= 0.8 ? "SECONDARY" : "FINAL POLISH";
    const sample = state.attempts.filter(a => a.subchapter === topic.id);
    return { title:topic.label, domain:topic.domain, tier, priorityScore:topic.priorityScore,
      accuracy:pct(accuracy(sample)), reasons:topic.reasons.length ? topic.reasons : ["หัวข้อที่ควรประเมินและทบทวนตามน้ำหนักข้อสอบ"],
      action:topic.action, subchapter:topic.id };
  });
}
export function mistakesView(bank,state) {
  const byId = new Map(bank.map(q => [q.id,q]));
  const errorMap = { "Knowledge Gap":"knowledge", "Concept Confusion":"confusion", "Misread":"misread", "Calculation":"calculation", "Reasoning":"reasoning", "Trap":"trap" };
  return [...state.mistakes].sort((a,b) => b.lastWrongAt-a.lastWrongAt).map(item => {
    const q = byId.get(item.questionId);
    return { id:item.questionId,questionId:item.questionId,question:q?.question || item.questionId,
      domain:item.domain,subchapter:item.subchapter,userAnswerLabel:answerLabel(q,item.lastAnswer),
      correctAnswerLabel:answerLabel(q,item.correctAnswer),count:item.wrongCount,date:new Date(item.lastWrongAt).toISOString(),
      errorType:errorMap[item.errorType] || null,resolved:Boolean(item.resolvedAt) };
  });
}
