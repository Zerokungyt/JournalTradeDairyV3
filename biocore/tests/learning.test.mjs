import test from "node:test";
import assert from "node:assert/strict";
import { calculateMastery, rankPriorities, selectDailyQuestions, createInitialState, createStateRepository, createMemoryStorage, recordAttempt, recommendNextDifficulty, updateReview, selectAdaptiveQuestions, summarizeAnalytics, calculateExamReadiness, dueConceptsFromReviews, deriveTopicStats } from "../src/engine.js";
import { mc } from "./fixtures.mjs";
test("mastery uses evidence volume, difficulty and recent performance", () => {
  const q = mc("mastery");
  const t = Date.UTC(2026,9,4);
  const one = [recordAttempt(createInitialState(),q,0,"practice",30,null,t).attempts[0]];
  const ten = Array.from({length:10},(_,i) => ({...one[0],timestamp:t-i*86400000}));
  const wrong = ten.map(a => ({...a,points:0,fullyCorrect:false}));
  assert.ok(calculateMastery(ten,t).score > calculateMastery(one,t).score);
  assert.ok(calculateMastery(ten,t).score > calculateMastery(wrong,t).score);
  assert.ok(calculateMastery(ten.map(a => ({...a,difficulty:5})),t).score > calculateMastery(ten.map(a => ({...a,difficulty:1})),t).score);
  const deteriorating = ten.map((a,i) => i >= 7 ? {...a,points:0,fullyCorrect:false,timestamp:t+i} : a);
  assert.ok(calculateMastery(deteriorating,t+10).score < calculateMastery(ten,t).score);
});
test("priority ranks personal weakness and repeated errors above equal-weight peers", () => {
  const topics = [
    {id:"dna",domain:"genetics",core:true,prerequisiteCount:3,mastery:35,errors:6,consecutiveErrors:3,lastPracticedAt:0},
    {id:"meiosis",domain:"genetics",core:true,prerequisiteCount:3,mastery:90,errors:0,consecutiveErrors:0,lastPracticedAt:0}
  ];
  const ranked = rankPriorities(topics,Date.UTC(2026,9,4));
  assert.equal(ranked[0].id,"dna");
  assert.ok(ranked[0].priorityScore > ranked[1].priorityScore);
  assert.match(ranked[0].action,/Level 2/);
});
test("Daily Bio chooses 4 core, 3 weak, 2 mistakes, and 1 challenge without repeats", () => {
  const pool = [
    ...Array.from({length:4},(_,i) => mc("core"+i,"cell",2,"core")),
    ...Array.from({length:3},(_,i) => mc("weak"+i,"human",3,"weak")),
    ...Array.from({length:2},(_,i) => mc("mistake"+i,"plant",3,"misc")),
    mc("challenge","genetics",5,"challenge")
  ];
  const picks = selectDailyQuestions(pool,{
    coreConcepts:["core"],weakConcepts:["weak"],mistakeQuestionIds:["mistake0","mistake1"],seed:"2026-10-04"
  });
  assert.equal(picks.length,10);
  assert.equal(new Set(picks.map(p => p.question.id)).size,10);
  assert.deepEqual(Object.fromEntries(["core","weakness","mistake","challenge"].map(reason =>
    [reason,picks.filter(p => p.reason === reason).length])), {core:4,weakness:3,mistake:2,challenge:1});
});
test("persistence round trips attempts, mistake counts, and active exam state", () => {
  const repo = createStateRepository(createMemoryStorage());
  let state = recordAttempt(repo.load(),mc("persist"),1,"practice",38,"Concept Confusion",1234);
  state = {...state,activeSession:{questionIds:["persist"],startedAt:1000,durationSeconds:5400,answers:{persist:1}}};
  repo.save(state);
  assert.equal(repo.load().attempts.length,1);
  assert.equal(repo.load().mistakes[0].wrongCount,1);
  assert.equal(repo.load().mistakes[0].errorType,"Concept Confusion");
  assert.equal(repo.load().activeSession.startedAt,1000);
});
test("adaptive difficulty and spaced repetition respond to outcomes", () => {
  const base = {difficulty:2,timestamp:100,points:2.4,maxPoints:2.4};
  assert.equal(recommendNextDifficulty([base,{...base,timestamp:101},{...base,timestamp:102}],2).difficulty,3);
  assert.equal(recommendNextDifficulty([{...base,points:0},{...base,points:0,timestamp:101}],2).difficulty,1);
  const first = updateReview(null,5,0);
  const second = updateReview(first,5,86400000);
  const failed = updateReview(second,0,2*86400000);
  assert.ok(second.intervalDays > first.intervalDays);
  assert.ok(failed.intervalDays < second.intervalDays);
});
test("adaptive selection favors due, weak, and previous mistakes", () => {
  const pool = [mc("weak","cell",3,"dna"),mc("strong","cell",3,"membrane"),mc("other","cell",3,"other")];
  const picks = selectAdaptiveQuestions(pool,{count:2,difficulty:3,masteryByConcept:{dna:20,membrane:90,other:90},
    dueConcepts:["dna"],mistakeQuestionIds:["weak"],seed:"adaptive"});
  assert.equal(picks[0].id,"weak");
  assert.equal(new Set(picks.map(q => q.id)).size,2);
});
test("analytics includes all concepts and readiness remains honest for new users", () => {
  assert.equal(calculateExamReadiness([]),null);
  const q = {...mc("analytics"),concepts:["transport","osmosis"]};
  const state = recordAttempt(createInitialState(),q,0,"practice",45,null,Date.UTC(2026,9,4));
  const summary = summarizeAnalytics(state.attempts);
  assert.equal(summary.byConcept.transport.attempts,1);
  assert.equal(summary.byConcept.osmosis.attempts,1);
  assert.equal(summary.byDifficulty["3"].averageSeconds,45);
  assert.equal(typeof summary.examReadiness,"number");
  assert.deepEqual(dueConceptsFromReviews({transport:{dueAt:100},osmosis:{dueAt:200}},150),["transport"]);
});
test("topic statistics follow real attempts and prerequisite links", () => {
  const dna = {...mc("dna","genetics",3,"DNA"),subchapter:"DNA",tags:["core"]};
  const mutation = {...mc("mutation","genetics",3,"mutation"),subchapter:"Mutation",prerequisiteConcepts:["DNA"]};
  const failed = recordAttempt(createInitialState(),dna,1,"practice",30,null,1000);
  const topics = deriveTopicStats([dna,mutation],failed.attempts,2000);
  const dnaStats = topics.find(t => t.id === "DNA");
  assert.equal(dnaStats.errors,1);
  assert.equal(dnaStats.consecutiveErrors,1);
  assert.equal(dnaStats.prerequisiteCount,1);
  assert.ok(dnaStats.mastery < 50);
});
