export interface AdaptiveTopicSelection {
  topicId: string;
  reason: 'weak' | 'strong' | 'new';
}

export interface NextQuestionResult {
  questionId: string;
  topicId: string;
  difficulty: number;
}
