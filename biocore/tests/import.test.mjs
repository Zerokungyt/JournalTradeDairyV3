import test from 'node:test';
import assert from 'node:assert/strict';
import {deterministicQuestionId,stageQuestionImport,validateImportRecord} from '../src/import/question-import.js';

const sample = {
  type:'mcq', domain:'cell', chapter:'Fundamental Unit of Life', subchapter:'Membrane transport',
  concepts:['osmosis'], difficulty:3, sourceType:'generated', sourceReference:'BIOCORE original practice',
  question:'เม็ดเลือดแดงอยู่ในสารละลายที่มีความเข้มข้นต่ำกว่าภายในเซลล์ จะเกิดอะไรขึ้น?',
  choices:['น้ำเข้าสู่เซลล์','น้ำออกจากเซลล์','กลูโคสออก','ไม่มีน้ำเคลื่อน','เซลล์สร้างผนัง'],
  correctAnswer:0, explanation:'น้ำเคลื่อนผ่านเยื่อหุ้มจากสารละลายที่มีศักย์น้ำสูงกว่าเข้าสู่เซลล์',
  choiceExplanations:['ถูก','ทิศทางตรงข้าม','ไม่เกี่ยว','น้ำยังเคลื่อน','เซลล์สัตว์ไม่มีผนัง'],
  keyTakeaways:['น้ำไหลจาก hypotonic เข้าสู่เซลล์'], reviewStatus:'approved'
};

test('deterministic IDs are stable and vary with question content',()=>{
  assert.equal(deterministicQuestionId(sample),deterministicQuestionId({...sample}));
  assert.notEqual(deterministicQuestionId(sample),deterministicQuestionId({...sample,question:'คำถามอีกข้อ'}));
});

test('review gate and duplicate prevention',()=>{
  const text=JSON.stringify([sample,{...sample,id:'another-id'}]);
  const result=stageQuestionImport(text);
  assert.equal(result.ready.length,1);
  assert.equal(result.rejected.length,1);
  assert.match(result.rejected[0].errors.join(' '),/Duplicate/);
  const pending=stageQuestionImport(JSON.stringify([{...sample,reviewStatus:'pending'}]));
  assert.equal(pending.ready.length,0);
  assert.equal(pending.pending.length,1);
});

test('official label requires provenance verification',()=>{
  const official={...sample,sourceType:'official',sourceReference:'https://www.mytcas.com/example'};
  assert.match(validateImportRecord(official).join(' '),/Official provenance/);
  assert.equal(validateImportRecord(official,{allowVerifiedOfficial:true}).length,0);
});

test('malformed imports are rejected',()=>{
  assert.equal(stageQuestionImport('{').rejected.length,1);
  assert.equal(stageQuestionImport('{"foo":1}').rejected.length,1);
  assert.match(validateImportRecord({...sample,choices:['A','A','B','C','D']}).join(' '),/unique/);
});
