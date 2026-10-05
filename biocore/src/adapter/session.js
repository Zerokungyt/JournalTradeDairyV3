import { loadQuestions } from "../data/index.js";
import { createStateRepository, createMemoryStorage, recordAttempt, scoreQuestion, scoreExam, elapsedSeconds, remainingSeconds, setMistakeErrorType } from "../engine.js";
import { selectQuestions } from "./selection.js";
import { prioritiesView, th } from "./views.js";
const errorNames = {knowledge:"Knowledge Gap",confusion:"Concept Confusion",misread:"Misread",
calculation:"Calculation",reasoning:"Reasoning",trap:"Trap"};
const nowMs = () => Date.now();
function sessionId() {
return globalThis.crypto?.randomUUID?.() || "bio-session-" + Date.now() + "-" + Math.random().toString(36).slice(2,10);
}
export function createSessionController(storage = (typeof localStorage === "undefined" ? createMemoryStorage() : localStorage)) {
const repo = createStateRepository(storage);
let state = repo.load();
let active = null;
let finishing = null;
const save = () => repo.save(state);
function storeActive() {
if (!active) { state.activeSession = null; save(); return; }
const { questions, ...serializable } = active;
state.activeSession = structuredClone(serializable);
save();
}
function requireSession(id) {
if (!active || active.id !== id) throw new Error("ไม่พบชุดข้อสอบที่กำลังทำ");
return active;
}
function touch(at = nowMs()) {
if (!active) return;
const qid = active.questionIds[active.index];
if (qid) active.timeSpentMs[qid] = (active.timeSpentMs[qid] || 0) + Math.max(0,at-(active.enteredAt || at));
active.enteredAt = at;
}
function timedOut() {
return active?.durationSeconds != null && remainingSeconds(active.startedAt,active.durationSeconds) === 0;
}
async function bankFor(config) {
return loadQuestions(config?.kind === "chapter" ? config.domain : undefined);
}
async function startSession(config) {
const bank = await bankFor(config);
const selected = selectQuestions(config,bank,state);
const startedAt = nowMs();
const durationSeconds = selected.mode === "practice" ? null : config.kind === "mock"
? config.variant === "full" ? 5400 : config.variant === "half" ? 2700
: Math.max(60,Number(config.durationSeconds) || Math.round(selected.questions.length*135))
: Math.max(300,Math.round(selected.questions.length*135));
active = { id:sessionId(),mode:selected.mode,title:selected.title,questions:selected.questions,
questionIds:selected.questions.map(q => q.id),answers:{},markedIds:[],startedAt,durationSeconds,index:0,
feedback:{},revealedIds:[],timeSpentMs:{},enteredAt:startedAt,config };
storeActive();
return active;
}
async function resume() {
if (active) return active;
state = repo.load();
const saved = state.activeSession;
if (!saved) return null;
const bank = await bankFor(saved.config);
const byId = new Map(bank.map(q => [q.id,q]));
const questions = saved.questionIds.map(id => byId.get(id));
if (questions.some(q => !q)) throw new Error("คลังโจทย์เปลี่ยนไปและไม่สามารถกู้ชุดข้อสอบนี้ได้");
active = { feedback:{},revealedIds:[],markedIds:[],timeSpentMs:{},...saved,questions };
return active;
}
function saveAnswer(id,questionId,answer) {
requireSession(id);
if (timedOut() || active.revealedIds.includes(questionId)) return active;
if (!active.questionIds.includes(questionId)) throw new Error("ไม่พบคำถามนี้");
touch();
active.answers[questionId] = Array.isArray(answer) ? [...answer] : answer;
storeActive();
return active;
}
function markReview(id,questionId) {
requireSession(id);
if (timedOut()) return active;
if (!active.questionIds.includes(questionId)) throw new Error("ไม่พบคำถามนี้");
touch();
active.markedIds = active.markedIds.includes(questionId)
? active.markedIds.filter(x => x !== questionId) : [...active.markedIds,questionId];
storeActive();
return active;
}
function setIndex(id,index) {
requireSession(id);
if (timedOut()) return active;
touch();
active.index = Math.min(active.questions.length-1,Math.max(0,Math.floor(Number(index) || 0)));
storeActive();
return active;
}
function revealPractice(id,questionId) {
requireSession(id);
if (active.mode !== "practice") throw new Error("เฉลยได้หลังส่งข้อสอบเท่านั้น");
const question = active.questions.find(q => q.id === questionId);
if (!question) throw new Error("ไม่พบคำถามนี้");
if (active.feedback[questionId]) return active.feedback[questionId];
const answer = active.answers[questionId];
const scored = scoreQuestion(question,answer);
if (!scored.answered) throw new Error("กรุณาตอบให้ครบก่อนดูเฉลย");
touch();
state = recordAttempt(state,question,answer,active.config.kind === "daily" ? "daily" : "practice",
Math.round((active.timeSpentMs[questionId] || 0)/1000),null);
active.feedback[questionId] = scored;
active.revealedIds.push(questionId);
storeActive();
return scored;
}
async function finishInternal(id,{auto = false} = {}) {
if (!active || active.id !== id) {
if (state.lastResult?.sessionId === id) return state.lastResult;
throw new Error("ไม่พบชุดข้อสอบที่กำลังทำ");
}
touch();
const questions = active.questions;
const scored = scoreExam(questions,active.answers);
if (active.mode !== "practice") {
for (const q of questions) state = recordAttempt(state,q,active.answers[q.id],"mock",
Math.round((active.timeSpentMs[q.id] || 0)/1000),null);
} else {
for (const q of questions) if (!active.revealedIds.includes(q.id) && scoreQuestion(q,active.answers[q.id]).answered)
state = recordAttempt(state,q,active.answers[q.id],active.config.kind === "daily" ? "daily" : "practice",
Math.round((active.timeSpentMs[q.id] || 0)/1000),null);
}
const completedAt = nowMs();
const durationSeconds = active.durationSeconds;
const elapsed = durationSeconds == null ? Math.max(0,Math.floor((completedAt-active.startedAt)/1000))
: elapsedSeconds(active.startedAt,durationSeconds,completedAt);
if (active.config.kind === "mock") state.mockHistory = [...state.mockHistory,{
id:active.id,title:active.title,variant:active.config.variant,points:scored.points,maxPoints:scored.maxPoints,
completedAt,durationSeconds,elapsedSeconds:elapsed,auto }];
const bank = await loadQuestions().catch(() => questions);
const recommendations = prioritiesView(bank,state).slice(0,3).map(x => ({title:x.title,action:x.action}));
const result = { sessionId:active.id,title:active.title,points:scored.points,maxPoints:scored.maxPoints,
correctCount:scored.fullyCorrect,totalQuestions:questions.length,elapsedSeconds:elapsed,durationSeconds,
domainPerformance:Object.entries(scored.byDomain).filter(([,row]) => row.count).map(([domain,row]) =>
({domain,label:th(domain),accuracy:Math.round(row.correct/row.count*100),correct:row.correct,total:row.count})),
items:questions.map(question => ({question,answer:active.answers[question.id],...scoreQuestion(question,active.answers[question.id])})),
recommendations };
state.activeSession = null;
state.lastResult = result;
save();
active = null;
return result;
}
function finish(id,options) {
if (finishing?.id === id) return finishing.promise;
const promise = finishInternal(id,options).finally(() => { if (finishing?.id === id) finishing = null; });
finishing = { id,promise };
return promise;
}
function markMistakeError(questionId,errorTypeId) {
state = errorTypeId ? setMistakeErrorType(state,questionId,errorNames[errorTypeId]) : {...state,mistakes:state.mistakes.map(x => x.questionId===questionId ? {...x,errorType:null}:x)};
save();
return state.mistakes.find(x => x.questionId === questionId);
}
return { getState:() => state,resume,startSession,saveAnswer,markReview,setIndex,revealPractice,finish,markMistakeError };
}
