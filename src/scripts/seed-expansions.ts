import { SeedCourse, SeedQuestion } from "./lasustech-data";
import { csc101ExpandedQuestions, csc102ExpandedQuestions, csc201ExpandedQuestions } from "./expanded-questions";
import { csc202ExpandedQuestions } from "./expanded-oop";
import {
  csc301ExpandedQuestions,
  csc303ExpandedQuestions,
  csc401ExpandedQuestions,
  csc403ExpandedQuestions,
} from "./expanded-advanced-cs";

export const csQuestionBanks: Record<string, SeedQuestion[]> = {
  CSC101: csc101ExpandedQuestions,
  CSC102: csc102ExpandedQuestions,
  CSC201: csc201ExpandedQuestions,
  CSC202: csc202ExpandedQuestions,
  CSC301: csc301ExpandedQuestions,
  CSC303: csc303ExpandedQuestions,
  CSC401: csc401ExpandedQuestions,
  CSC403: csc403ExpandedQuestions,
};

/**
 * Returns an expanded question pool for any course.
 * If the course has a dedicated expanded CS question bank, returns that (30-50+ questions).
 * If the course only has 4 base questions, procedurally expands them into a 16-question bank
 * (12 MCQs and 4 Theory items) covering core definitions, applications, edge cases, and theory.
 */
export function getExpandedQuestionsForCourse(course: SeedCourse): SeedQuestion[] {
  if (csQuestionBanks[course.code]) {
    return csQuestionBanks[course.code];
  }

  const baseQs = course.qs || [];
  if (baseQs.length === 0) return [];

  const expanded: SeedQuestion[] = [...baseQs];

  // Procedurally generate variations from the base questions to guarantee >= 16 questions per course
  baseQs.forEach((base, idx) => {
    // 1. In-depth Conceptual Variation (MCQ)
    if (base.a && base.b && base.c && base.d && base.ans) {
      expanded.push({
        q: `Regarding ${course.title}: Which of the following best reflects the principles described in: "${base.q.replace(/\?$/, '')}"?`,
        a: base.a,
        b: base.b,
        c: base.c,
        d: base.d,
        ans: base.ans,
        exp: `Concept verification: ${base.exp}`,
      });

      // 2. Practical Application / Scenario Variation (MCQ)
      const options = [base.a, base.b, base.c, base.d];
      const correctText = base[base.ans.toLowerCase() as 'a' | 'b' | 'c' | 'd'] || base.a;
      expanded.push({
        q: `In professional applications of ${course.title}, when evaluating standard practices: What is the most appropriate approach corresponding to "${correctText}"?`,
        a: `Standard protocol implementing: ${correctText}`,
        b: `Bypassing standard verification and using default values`,
        c: `Immediate deprecation without replacement`,
        d: `Manual non-standard override`,
        ans: "A",
        exp: `Professional practice application: ${base.exp}`,
      });

      // 3. True/False or Analytical Comparison (MCQ)
      expanded.push({
        q: `True or False / Analysis in ${course.title}: The primary objective of this topic relates directly to: "${base.exp.split('.')[0]}."`,
        a: "True: This is the established theoretical and practical foundation.",
        b: "False: This concept applies only to unrelated disciplines.",
        c: "False: The concept has been completely deprecated in modern curricula.",
        d: "Neither: The statement is completely ambiguous.",
        ans: "A",
        exp: `Theoretical rationale: ${base.exp}`,
      });
    }

    // 4. In-depth Free-response Theory Prompt
    expanded.push({
      q: `[Theory Analysis - ${course.code}] Critically evaluate the practical and academic importance of the following topic within ${course.title}: "${(base.q || base.exp).slice(0, 100)}...". Discuss methodology, typical constraints, and real-world outcomes.`,
      exp: `Comprehensive theoretical analysis for ${course.title}: Students must articulate fundamental definitions, operational frameworks, and critical evaluation based on: ${base.exp}`,
    });
  });

  return expanded;
}
