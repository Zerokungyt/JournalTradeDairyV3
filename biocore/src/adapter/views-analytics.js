import { taxonomy } from "../data/taxonomy.js";
import { calculateMastery, calculateExamReadiness, summarizeAnalytics } from "../engine.js";
import { th, dateKey, prioritiesView, mistakesView } from "./views-core.js";
export function analyticsView(bank,state) {
  const summary = summarizeAnalytics(state.attempts,state.mockHistory);
  const totalTime = state.attempts.reduce((sum,a) => sum+(a.elapsedSeconds || 0),0);
  const byDomain = taxonomy.map(domain => {
    const row = summary.byDomain[domain.id];
    const attempts = state.attempts.filter(a => a.domain === domain.id);
    return { id:domain.id,label:domain.titleTh,value:row ? Math.round(row.accuracy*100) : null,accuracy:row ? Math.round(row.accuracy*100) : null,attempts:row?.attempts || 0,
      mastery:calculateMastery(attempts).score,averageTimeSeconds:row?.averageSeconds ?? null };
  });
  const byDifficulty = [1,2,3,4,5].map(level => {
    const row = summary.byDifficulty[String(level)];
    return { level,label:"Level " + level,value:row ? Math.round(row.accuracy*100) : null,accuracy:row ? Math.round(row.accuracy*100) : null,attempts:row?.attempts || 0,
      averageTimeSeconds:row?.averageSeconds ?? null };
  });
  const overTime = Object.entries(summary.byDay).sort(([a],[b]) => a.localeCompare(b)).map(([label,row]) =>
    ({label,value:Math.round(row.accuracy*100),attempts:row.attempts}));
  return { readiness:summary.examReadiness,averageTimeSeconds:state.attempts.length ? Math.round(totalTime/state.attempts.length) : null,
    questionsSolved:state.attempts.length,mockCount:state.mockHistory.length,mastery:calculateMastery(state.attempts).score,
    byDomain:byDomain.filter(row => row.attempts),byDifficulty:byDifficulty.filter(row => row.attempts),
    masteryHeatmap:Object.entries(summary.masteryHeatmap).map(([label,value]) => ({label,value,attempts:summary.bySubchapter[label]?.attempts || 0})),
    difficultyHeatmap:Object.entries(summary.difficultyHeatmap).map(([key,row]) => ({label:key,value:Math.round(row.accuracy*100),attempts:row.attempts})),
    overTime,mostMissed:summary.mostMissed.slice(0,8).map(x => ({label:x.concept,count:x.misses})),
    mostImproved:summary.mostImproved.slice(0,8).map(x => ({label:x.concept,delta:x.improvement})),
    mockHistory:state.mockHistory.map(m => ({label:m.title || "Mock",date:dateKey(m.completedAt),score:m.points,maxPoints:m.maxPoints})) };
}
export function overviewView(bank,state) {
  const priorities = prioritiesView(bank,state);
  const domainScores = taxonomy.map(d => ({id:d.id,label:d.titleTh,score:calculateMastery(state.attempts.filter(a => a.domain === d.id)).score})).filter(x => x.score != null);
  const weakest = domainScores.sort((a,b) => a.score-b.score)[0];
  const fullMocks = state.mockHistory.filter(m => m.variant === "full");
  const mockBest = fullMocks.length ? Math.max(...fullMocks.map(m => m.points)) : null;
  const days = new Set(state.attempts.map(a => dateKey(a.timestamp)));
  let streak = 0, cursor = new Date();
  if (!days.has(dateKey(cursor.getTime()))) cursor.setUTCDate(cursor.getUTCDate()-1);
  while (days.has(dateKey(cursor.getTime()))) { streak++; cursor.setUTCDate(cursor.getUTCDate()-1); }
  return { readiness:calculateExamReadiness(state.attempts,state.mockHistory),mastery:calculateMastery(state.attempts).score,
    mockBest,questionsSolved:state.attempts.length,streak,weakestArea:weakest?.label || null,
    nextRecommended:priorities[0]?.title || null,nextReason:priorities[0]?.reasons?.join(" · ") || null };
}
export function searchView(bank,state,query) {
  const needle = String(query || "").normalize("NFKC").trim().toLocaleLowerCase();
  if (!needle) return [];
  const matches = text => String(text || "").normalize("NFKC").toLocaleLowerCase().includes(needle);
  const results = [];
  for (const domain of taxonomy) if ([domain.title,domain.titleTh,domain.id].some(matches))
    results.push({kind:"chapter",title:domain.titleTh,meta:"Chapter",domain:domain.id});
  const seenConcepts = new Set();
  for (const q of bank) for (const concept of q.concepts || []) if (matches(concept) && !seenConcepts.has(concept)) {
    seenConcepts.add(concept);results.push({kind:"concept",title:concept,meta:th(q.domain)+" · "+q.subchapter,domain:q.domain,concept});
  }
  for (const q of bank) if ([q.question,q.subchapter,...(q.tags || [])].some(matches))
    results.push({kind:"question",title:q.question.slice(0,110),meta:th(q.domain)+" · Level "+q.difficulty,domain:q.domain,questionId:q.id});
  for (const item of mistakesView(bank,state)) if (matches(item.question) || matches(item.subchapter))
    results.push({kind:"mistake",title:item.question.slice(0,110),meta:"เคยผิด "+item.count+" ครั้ง",domain:item.domain,questionId:item.questionId});
  for (const [subchapter,row] of Object.entries(summarizeAnalytics(state.attempts).bySubchapter)) if (matches(subchapter))
    results.push({kind:"mastery",title:subchapter,meta:"Accuracy "+Math.round(row.accuracy*100)+"%",concept:subchapter});
  return results.slice(0,40);
}
