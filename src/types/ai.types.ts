export interface GenerateExplanationRequest {
  studentId: string;
  courseId: string;
  topicId: string;
  questionId: string;
  selectedAnswer: string;
}

export interface FocusPlanRequest {
  studentId: string;
  courseId: string;
}
