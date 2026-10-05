# BIOCORE — A-Level Biology Training System

BIOCORE is a Thai language, browser-local Biology training application for TCAS70 preparation. It includes chapter practice, 40 question timed mocks, detailed explanations, review scheduling, mistake tracking, mastery, recommendations, and analytics. Question content is split into domain modules under `src/data`.

## Run

```bash
npm install
npm run dev
```

Open the URL printed by Vite. To verify:

```bash
npm test
npm run build
```

The built static application is in `dist/`. User progress stays in browser localStorage. Clearing site storage clears progress; there is no account sync yet.

## Exam configuration and provenance

The currently implemented exam rules come from the project brief: 35 five choice questions worth 2.4 points each, five three statement complex choice questions worth up to 3.2 points each, 40 questions, and 90 minutes. For complex choice, 3 correct statements earn 3.2, 2 earn 1.6, and fewer earn 0. This yields 100 points. The domain mix is a provisional allocation inside the ranges supplied in the brief. It has **not** been verified against a MyTCAS TCAS70 PDF in this environment.

The Google Drive `A-Level/Bio` folder contains `Biology 🧫.zip` (304,801,395 bytes). The Drive connector cannot materialize it because its streamed download limit is 268,435,456 bytes. The ZIP contents have not been inspected or indexed. Seed questions are original generated practice, visibly labelled **Generated Practice**. They are not official released questions. Official and Drive material must be imported only after provenance and rights review.

## Data contract

Each question has a deterministic ID, type, domain, chapter, subchapter, concepts, difficulty (1–5), cognitive level, exam weight, source type and reference, stem, choices or three statements, answer, mechanism based explanation, choice explanations, common trap, takeaways, exam technique, prerequisites, related concepts, estimated time, and tags. The loader in `src/data/index.js` imports question modules on demand and validates IDs. Reviewed JSON can be staged through `src/import/question-import.js`; ZIP extraction and scientific review must happen before import. New banks can be added without changing the UI.

## Learning logic

Practice reveals the answer and explanation after submission. Exam mode withholds explanations until finishing. Mocks use unique questions, score each answer by the configured rule, and persist the active session. Mastery uses correctness, difficulty, recency, consistency and mock performance. Priorities combine provisional domain exam weights with weakness, concept dependency, errors and recency. Daily Bio selects core, weak, prior mistake and challenge questions and updates review intervals.

No score, readiness percentage or history is invented for a new user. The dashboard shows an empty state until there are real attempts.
