import test from "node:test";
import assert from "node:assert/strict";
import { createBiocoreAdapter } from "../src/adapter.js";
import { createMemoryStorage } from "../src/engine.js";
import { loadQuestions } from "../src/data/index.js";
test("practice reveal records once and an active session resumes after refresh", async () => {
  const question = (await loadQuestions()).find(q => q.type === "mcq");
  const storage = createMemoryStorage();
  const first = createBiocoreAdapter(storage);
  const session = await first.startSession({kind:"chapter",mode:"practice",domain:question.domain,
    subchapter:question.subchapter,difficulty:question.difficulty,count:5,questionType:"mcq"});
  assert.ok(session.questions.length >= 1);
  const q = session.questions[0];
  first.saveAnswer(session.id,q.id,q.correctAnswer);
  first.markReview(session.id,q.id);
  assert.ok(first.getState().activeSession.markedIds.includes(q.id));
  const reveal = first.revealPractice(session.id,q.id);
  assert.equal(reveal.points,2.4);
  assert.deepEqual(first.revealPractice(session.id,q.id),reveal);
  assert.equal(first.getState().attempts.length,1);
  const restored = createBiocoreAdapter(storage);
  const resumed = await restored.resume();
  assert.equal(resumed.id,session.id);
  assert.equal(resumed.answers[q.id],q.correctAnswer);
  assert.ok(resumed.feedback[q.id]);
  const result = await restored.finish(session.id);
  assert.equal(result.items[0].points,2.4);
  assert.equal(restored.getState().attempts.length,1);
  assert.equal(await restored.resume(),null);
});
test("full mock scores exactly 100 and concurrent submit is idempotent", async () => {
  const storage = createMemoryStorage();
  const adapter = createBiocoreAdapter(storage);
  const session = await adapter.startSession({kind:"mock",mode:"exam",variant:"full",count:40,durationSeconds:5400});
  assert.equal(session.questions.length,40);
  assert.equal(session.durationSeconds,5400);
  for (const q of session.questions) adapter.saveAnswer(session.id,q.id,q.correctAnswer);
  const [first,second] = await Promise.all([adapter.finish(session.id),adapter.finish(session.id)]);
  assert.equal(first.points,100);
  assert.equal(first.maxPoints,100);
  assert.equal(first.correctCount,40);
  assert.equal(second.points,100);
  assert.equal(adapter.getState().attempts.length,40);
  assert.equal(adapter.getState().mockHistory.length,1);
  const analytics = await adapter.analytics();
  assert.equal(analytics.mockCount,1);
  assert.ok(Array.isArray(analytics.byDomain));
  assert.ok(Array.isArray(analytics.masteryHeatmap));
  assert.ok(analytics.byDomain.every(row => row.value >= 0 && row.value <= 100));
  const overview = await adapter.overview();
  assert.equal(overview.mockBest,100);
});
test("catalog includes actual seed subchapters, search, and recommendation data", async () => {
  const adapter = createBiocoreAdapter(createMemoryStorage());
  const catalog = await adapter.catalog();
  const bank = await loadQuestions();
  assert.equal(catalog.length,5);
  for (const q of bank) {
    const domain = catalog.find(d => d.id === q.domain);
    assert.ok(domain?.subchapters.some(s => s.id === q.subchapter && s.questionCount > 0),q.id);
  }
  const priorities = await adapter.priorities();
  assert.ok(priorities.length > 0);
  assert.ok(priorities.every(p => ["MUST MASTER","HIGH YIELD","SECONDARY","FINAL POLISH"].includes(p.tier)));
  const found = await adapter.search(bank[0].subchapter);
  assert.ok(found.length > 0);
});
