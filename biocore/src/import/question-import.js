export const SOURCE_TYPES = Object.freeze(['official','drive','generated','adapted']);
export const DOMAIN_KEYS = Object.freeze(['ecology','cell','human','plant','genetics']);

const normalized = value => String(value ?? '').normalize('NFKC').toLocaleLowerCase('th-TH').replace(/\s+/g,' ').trim();
const hash32 = value => {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash,16777619);
  }
  return (hash >>> 0).toString(16).padStart(8,'0');
};

export function deterministicQuestionId(record) {
  const signature = [
    record.sourceType, record.sourceReference, record.type, record.domain,
    normalized(record.question), ...(record.type === 'complex' ? record.statements ?? [] : record.choices ?? [])
  ].join('|');
  return `bio-${hash32(signature)}`;
}

export function validateImportRecord(record,{allowVerifiedOfficial=false}={}) {
  const errors = [];
  if (!record || typeof record !== 'object' || Array.isArray(record)) return ['Question must be an object'];
  if (!['mcq','complex'].includes(record.type)) errors.push('Unsupported question type');
  if (!DOMAIN_KEYS.includes(record.domain)) errors.push('Unknown domain');
  if (!Number.isInteger(record.difficulty) || record.difficulty < 1 || record.difficulty > 5) errors.push('Difficulty must be 1–5');
  if (!normalized(record.question)) errors.push('Question text is required');
  if (!SOURCE_TYPES.includes(record.sourceType)) errors.push('Source type is required');
  if (!normalized(record.sourceReference)) errors.push('Source reference is required');
  if (record.sourceType === 'official' && !allowVerifiedOfficial) errors.push('Official provenance requires explicit verification');
  if (record.type === 'mcq') {
    if (!Array.isArray(record.choices) || record.choices.length !== 5 || record.choices.some(x=>!normalized(x))) errors.push('MCQ requires five nonempty choices');
    else if (new Set(record.choices.map(normalized)).size !== 5) errors.push('MCQ choices must be unique');
    if (!Number.isInteger(record.correctAnswer) || record.correctAnswer < 0 || record.correctAnswer > 4) errors.push('MCQ answer must be an index 0–4');
  }
  if (record.type === 'complex') {
    const statements = record.statements ?? record.choices;
    if (!Array.isArray(statements) || statements.length !== 3 || statements.some(x=>!normalized(x))) errors.push('Complex choice requires three statements');
    if (!Array.isArray(record.correctAnswer) || record.correctAnswer.length !== 3 || record.correctAnswer.some(x=>typeof x !== 'boolean')) errors.push('Complex answer requires three booleans');
  }
  const expected = record.type === 'complex' ? 3 : 5;
  if (!Array.isArray(record.choiceExplanations) || record.choiceExplanations.length !== expected || record.choiceExplanations.some(x=>!normalized(x))) errors.push('Choice explanations must match the number of choices');
  if (!normalized(record.explanation)) errors.push('Mechanism explanation is required');
  if (!Array.isArray(record.concepts) || record.concepts.length < 1) errors.push('At least one concept is required');
  if (!Array.isArray(record.keyTakeaways) || record.keyTakeaways.length < 1) errors.push('At least one takeaway is required');
  return errors;
}

/** Stage reviewed JSON records. ZIP extraction and scientific review are external steps. */
export function stageQuestionImport(jsonText,existingQuestions=[],options={}) {
  let parsed;
  try { parsed = JSON.parse(jsonText); } catch { return {ready:[],pending:[],rejected:[{index:-1,errors:['Invalid JSON']}]} ; }
  const records = Array.isArray(parsed) ? parsed : parsed?.questions;
  if (!Array.isArray(records)) return {ready:[],pending:[],rejected:[{index:-1,errors:['Expected an array or {questions: []}']}]} ;
  const knownIds = new Set(existingQuestions.map(x=>x.id));
  const knownStems = new Set(existingQuestions.map(x=>normalized(x.question)));
  const ready=[],pending=[],rejected=[];
  records.forEach((item,index)=>{
    const record = {...item};
    const errors = validateImportRecord(record,options);
    record.id ||= deterministicQuestionId(record);
    if (knownIds.has(record.id) || knownStems.has(normalized(record.question))) errors.push('Duplicate question ID or stem');
    if (errors.length) { rejected.push({index,record,errors}); return; }
    knownIds.add(record.id);
    knownStems.add(normalized(record.question));
    if (record.reviewStatus === 'approved') ready.push(record);
    else pending.push({index,record,reason:'Scientific and rights review required'});
  });
  return {ready,pending,rejected};
}
