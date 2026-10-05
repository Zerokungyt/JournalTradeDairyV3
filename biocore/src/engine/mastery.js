import { clamp, DOMAIN_WEIGHTS, dedupeQuestions } from "./base.js";
export function calculateMastery(attempts, now = Date.now()) {
  if (!attempts.length) return { score: null, confidence: 0, attempts: 0, accuracy: null };
  const sorted = [...attempts].sort((a,b) => a.timestamp-b.timestamp);
  const ratios = sorted.map(a => clamp(a.points / a.maxPoints,0,1));
  const accuracy = ratios.reduce((a,b) => a+b,0) / ratios.length;
  const recent = sorted.slice(-Math.min(8,sorted.length));
  const recencyWeights = recent.map(a => Math.max(0.01,Math.exp(-Math.max(0,now-a.timestamp) / (30*86400000))));
  const recentScore = recent.reduce((sum,a,i) => sum + clamp(a.points/a.maxPoints,0,1)*recencyWeights[i],0) / recencyWeights.reduce((a,b) => a+b,0);
  const difficultyScore = sorted.reduce((sum,a,i) => sum + ratios[i] * (0.75 + 0.05 * clamp(a.difficulty || 3,1,5)),0) / sorted.length;
  const sample = ratios.slice(-Math.min(8,ratios.length));
  const mean = sample.reduce((a,b) => a+b,0)/sample.length;
  const variance = sample.reduce((sum,n) => sum + (n-mean)**2,0)/sample.length;
  const consistency = sample.length < 3 ? 0.5 : 1-Math.min(1,Math.sqrt(variance));
  const mock = sorted.filter(a => a.mode === "mock");
  const mockScore = mock.length ? mock.reduce((sum,a) => sum+a.points/a.maxPoints,0)/mock.length : accuracy;
  const raw = 0.43*accuracy + 0.27*recentScore + 0.15*difficultyScore + 0.10*consistency + 0.05*mockScore;
  const confidence = Math.min(1,Math.sqrt(sorted.length/10));
  return { score: Math.round(clamp(50+(raw*100-50)*confidence,0,100)), confidence: Math.round(confidence*100)/100,
    attempts: sorted.length, accuracy: Math.round(accuracy*100), recentScore: Math.round(recentScore*100) };
}
export function rankPriorities(topics, now = Date.now()) {
  return topics.map(topic => {
    const weight = topic.examWeight ?? DOMAIN_WEIGHTS[topic.domain] ?? 0.1;
    const weakness = topic.mastery == null ? 0.55 : Math.max(0.12,1-clamp(topic.mastery,0,100)/100);
    const foundation = 1 + Math.min(0.9,(topic.prerequisiteCount || 0)*0.16) + (topic.core ? 0.20 : 0);
    const errors = Math.max(0,topic.errors || 0);
    const frequency = 1 + Math.min(1,errors/5) + Math.min(0.4,(topic.consecutiveErrors || 0)*0.08);
    const days = topic.lastPracticedAt ? Math.max(0,(now-topic.lastPracticedAt)/86400000) : 30;
    const recency = 1 + Math.min(0.5,days/60);
    const priorityScore = Math.round(weight*weakness*foundation*frequency*recency*1000)/10;
    const reasons = [];
    if (topic.mastery != null) reasons.push("Mastery " + topic.mastery + "%");
    if (errors) reasons.push("ผิด " + errors + " ครั้ง");
    if (topic.prerequisiteCount) reasons.push("เป็นพื้นฐานของ " + topic.prerequisiteCount + " หัวข้อ");
    if (days >= 14) reasons.push("ไม่ได้ทบทวน " + Math.floor(days) + " วัน");
    const action = topic.mastery != null && topic.mastery < 55
      ? "ทบทวนพื้นฐานแล้วทำโจทย์ Level 2 จำนวน 10 ข้อ"
      : "ทำโจทย์ Level 3 จำนวน 10 ข้อ";
    return { ...topic, priorityScore, reasons, action };
  }).sort((a,b) => b.priorityScore-a.priorityScore || a.id.localeCompare(b.id));
}
export function deriveTopicStats(questions, attempts, now = Date.now()) {
  const topics = new Map();
  const dependents = new Map();
  for (const q of dedupeQuestions(questions)) {
    const id = q.subchapter || q.chapter;
    if (!topics.has(id)) topics.set(id,{ id, label:id, domain:q.domain, examWeight:q.examWeight ?? DOMAIN_WEIGHTS[q.domain],
      concepts:new Set(), core:false });
    const row = topics.get(id);
    for (const concept of q.concepts || []) row.concepts.add(concept);
    row.core ||= (q.tags || []).includes("core");
    for (const prerequisite of q.prerequisiteConcepts || []) {
      if (!dependents.has(prerequisite)) dependents.set(prerequisite,new Set());
      dependents.get(prerequisite).add(id);
    }
  }
  return [...topics.values()].map(row => {
    const sample = attempts.filter(a => a.subchapter === row.id).sort((a,b) => b.timestamp-a.timestamp);
    const mastery = calculateMastery(sample,now).score;
    const errors = sample.filter(a => !a.fullyCorrect).length;
    let consecutiveErrors = 0;
    for (const a of sample) { if (a.fullyCorrect) break; consecutiveErrors++; }
    const downstream = new Set();
    for (const concept of row.concepts) for (const id of dependents.get(concept) || []) if (id !== row.id) downstream.add(id);
    return { id:row.id, label:row.label, domain:row.domain, examWeight:row.examWeight, core:row.core || downstream.size >= 2,
      prerequisiteCount:downstream.size, mastery, attempts:sample.length, errors, consecutiveErrors,
      lastPracticedAt:sample[0]?.timestamp ?? null };
  });
}
