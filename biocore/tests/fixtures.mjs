export const domains = ["ecology","cell","human","plant","genetics"];
export function mc(id, domain = "cell", difficulty = 3, concept = "core") {
  return { id, type: "mcq", domain, chapter: domain, subchapter: concept, concepts: [concept],
    difficulty, question: "Which result follows in experiment " + id + "?",
    choices: ["result A","result B","result C","result D","result E"], correctAnswer: 0,
    explanation: "Mechanism supports result A.", choiceExplanations: ["yes","no","no","no","no"],
    commonTrap: "Confusing cause and effect.", keyTakeaways: ["Check the control."],
    sourceType: "generated", estimatedTime: 60 };
}
export function complex(id, domain = "cell") {
  return { ...mc(id,domain), type: "complex", choices: [], statements: ["statement A","statement B","statement C"],
    correctAnswer: [true,false,true], choiceExplanations: ["A is true","B is false","C is true"] };
}
export function fullBank() {
  const counts = { ecology: 5, cell: 6, human: 12, plant: 6, genetics: 6 };
  return [...domains.flatMap(d => Array.from({ length: counts[d] }, (_,i) => mc(d+"-m"+i,d))),
    ...domains.map(d => complex(d+"-c",d))];
}
