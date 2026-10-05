import test from "node:test";
import assert from "node:assert/strict";
import { scoreQuestion, scoreExam, assembleFullMock, assembleHalfMock, remainingSeconds, elapsedSeconds, formatTime, moveQuestion, navigatorSummary, dedupeQuestions, stableQuestionId, validateQuestion } from "../src/engine.js";
import { domains, mc, complex, fullBank } from "./fixtures.mjs";
test("multiple choice awards 2.4 only for the single correct answer", () => {
  const q = mc("mc");
  assert.deepEqual(scoreQuestion(q,0), { points:2.4,maxPoints:2.4,correctParts:1,totalParts:1,fullyCorrect:true,answered:true });
  assert.equal(scoreQuestion(q,1).points,0);
  assert.equal(scoreQuestion(q,undefined).answered,false);
});
test("complex choice awards 3.2, 1.6, or zero by number of correct statements", () => {
  const q = complex("cx");
  assert.equal(scoreQuestion(q,[true,false,true]).points,3.2);
  assert.equal(scoreQuestion(q,[true,false,false]).points,1.6);
  assert.equal(scoreQuestion(q,[true,true,false]).points,0);
  assert.equal(scoreQuestion(q,[true,false,null]).points,1.6);
  assert.equal(scoreQuestion(q,[true,false,null]).answered,false);
});
test("full mock has exact blueprint distribution and 100 available points", () => {
  const questions = assembleFullMock(fullBank(),"fixture");
  assert.equal(questions.length,40);
  assert.equal(questions.filter(q => q.type === "mcq").length,35);
  assert.equal(questions.filter(q => q.type === "complex").length,5);
  assert.deepEqual(Object.fromEntries(domains.map(d => [d,questions.filter(q => q.domain === d).length])),
    { ecology:6,cell:7,human:13,plant:7,genetics:7 });
  assert.equal(scoreExam(questions).maxPoints,100);
  const answers = Object.fromEntries(questions.map(q => [q.id,q.correctAnswer]));
  assert.equal(scoreExam(questions,answers).points,100);
  answers[questions[0].id] = 1;
  answers[questions.at(-1).id] = [true,false,false];
  assert.equal(scoreExam(questions,answers).points,96);
});
test("timer survives refresh using absolute start time and freezes on submit", () => {
  const start = 1_000_000;
  assert.equal(remainingSeconds(start,5400,start),5400);
  assert.equal(remainingSeconds(start,5400,start+30_000),5370);
  assert.equal(remainingSeconds(start,5400,start+6_000_000),0);
  assert.equal(remainingSeconds(start,5400,start+6_000_000,start+45_000),5355);
  assert.equal(elapsedSeconds(start,5400,start+6_000_000,start+45_000),45);
  assert.equal(formatTime(5400),"90:00");
});
test("navigator counts partial complex answers as unanswered and clamps bounds", () => {
  const questions = [mc("a"),complex("b"),mc("c")];
  const byId = Object.fromEntries(questions.map(q => [q.id,q]));
  const nav = navigatorSummary(["a","b","c"],{a:0,b:[true,false,null]},["b"],1,byId);
  assert.equal(nav.answered,1);
  assert.equal(nav.unanswered,2);
  assert.equal(nav.marked,1);
  assert.equal(nav.statuses[1].current,true);
  assert.equal(moveQuestion(0,-1,3),0);
  assert.equal(moveQuestion(2,1,3),2);
});
test("duplicate prevention detects same content and conflicting IDs", () => {
  const a = mc("id-a"), b = {...a,id:"id-b"};
  assert.equal(dedupeQuestions([a,b]).length,1);
  assert.equal(stableQuestionId(a),stableQuestionId(b));
  assert.throws(() => dedupeQuestions([a,{...a,question:"Different item"}]),/Conflicting question ID/);
  assert.throws(() => dedupeQuestions([a,{...a,id:"id-c",correctAnswer:1}]),/Conflicting answer/);
  assert.deepEqual(validateQuestion(complex("valid")),[]);
});
test("half mock preserves domain emphasis with 20 questions", () => {
  const questions = assembleHalfMock(fullBank(),"half");
  assert.equal(questions.length,20);
  assert.equal(questions.filter(q => q.type === "complex").length,3);
  assert.equal(questions.filter(q => q.domain === "human").length,7);
  assert.equal(scoreExam(questions).maxPoints,50.4);
});
