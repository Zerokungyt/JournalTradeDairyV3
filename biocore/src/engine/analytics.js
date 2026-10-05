import { DOMAIN_IDS, DOMAIN_WEIGHTS, clamp } from "./base.js";
import { calculateMastery } from "./mastery.js";
export function summarizeAnalytics(attempts, mockHistory = []) {
  const groups = (keyFn) => {
    const map = {};
    for (const a of attempts) {
      for (const key of [keyFn(a)].flat()) {
        const row = map[key] || { attempts: 0, correct: 0, points: 0, maxPoints: 0, seconds: 0 };
        row.attempts++; row.correct += Number(a.fullyCorrect); row.points += a.points; row.maxPoints += a.maxPoints; row.seconds += a.elapsedSeconds || 0;
        map[key] = row;
      }
    }
    return Object.fromEntries(Object.entries(map).map(([key,row]) => [key,{ ...row, accuracy: row.attempts ? row.correct/row.attempts : 0, averageSeconds: row.attempts ? Math.round(row.seconds/row.attempts) : 0 }]));
  };
  const byConcept = groups(a => a.concepts?.length ? a.concepts : ["unknown"]);
  const bySubchapter = groups(a => a.subchapter);
  const conceptSeries = {};
  for (const a of attempts) for (const concept of a.concepts || []) (conceptSeries[concept] ||= []).push(a);
  const mostImproved = Object.entries(conceptSeries).filter(([,series]) => series.length >= 4).map(([concept,series]) => {
    const ordered = [...series].sort((a,b) => a.timestamp-b.timestamp);
    const first = ordered.slice(0,2).reduce((sum,a) => sum+a.points/a.maxPoints,0)/2;
    const last = ordered.slice(-2).reduce((sum,a) => sum+a.points/a.maxPoints,0)/2;
    return { concept, improvement: Math.round((last-first)*100), attempts: series.length };
  }).sort((a,b) => b.improvement-a.improvement);
  return {
    byDomain: groups(a => a.domain), byDifficulty: groups(a => String(a.difficulty)),
    bySubchapter, byConcept, byDay: groups(a => new Date(a.timestamp).toISOString().slice(0,10)),
    difficultyHeatmap: groups(a => a.domain + ":" + a.difficulty),
    masteryHeatmap: Object.fromEntries(Object.keys(bySubchapter).map(key => [key,calculateMastery(attempts.filter(a => a.subchapter === key)).score])),
    mostMissed: Object.entries(byConcept).map(([concept,row]) => ({concept,misses:row.attempts-row.correct,attempts:row.attempts})).sort((a,b) => b.misses-a.misses),
    mostImproved, examReadiness: calculateExamReadiness(attempts,mockHistory),
    mockHistory: [...mockHistory].sort((a,b) => a.completedAt-b.completedAt)
  };
}
export function dueConceptsFromReviews(reviews, now = Date.now()) {
  return Object.entries(reviews || {}).filter(([,item]) => item.dueAt <= now).map(([concept]) => concept);
}
export function calculateExamReadiness(attempts, mockHistory = [], now = Date.now()) {
  if (!attempts.length && !mockHistory.length) return null;
  const domainScore = DOMAIN_IDS.reduce((sum,domain) => {
    const sample = attempts.filter(a => a.domain === domain);
    const mastery = calculateMastery(sample,now).score;
    return sum + DOMAIN_WEIGHTS[domain] * (mastery ?? 25);
  },0);
  const recentMocks = [...mockHistory].sort((a,b) => b.completedAt-a.completedAt).slice(0,3);
  const mockScore = recentMocks.length ? recentMocks.reduce((sum,m) => sum + 100*clamp(m.points/m.maxPoints,0,1),0)/recentMocks.length : null;
  return Math.round(clamp(mockScore == null ? domainScore : 0.65*domainScore+0.35*mockScore,0,100));
}
