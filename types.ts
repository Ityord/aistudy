export interface Question {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  sourceHint?: string;
  resourceLink?: {
    title: string;
    url: string;
  };
}

export type QuizState = 'idle' | 'loading' | 'active' | 'finished';

export interface IncorrectAnswer extends Question {
  userAnswerIndex: number;
}

// New types for exam specialization
export type Exam = 'JEE' | 'NEET';
export type Subject = 'Physics' | 'Chemistry' | 'Maths' | 'Biology';
export type DifficultyLevel = 'Level 3: Boards' | 'Level 2: Mains/NEET' | 'Level 1: Advanced';

export interface QuizConfig {
  exam: Exam;
  subject: Subject;
  topic: string;
  level: DifficultyLevel;
  mergeTopic?: string;
}

// Updated types for history
export interface QuizHistoryItem {
  id: number; // Using timestamp as ID
  config: QuizConfig;
  score: number;
  totalQuestions: number;
  percentage: number;
  date: number; // Timestamp
}

// New types for suggestions
export interface Book {
  title: string;
  author: string;
  shortDescription: string;
}

export interface YouTubeVideo {
  title: string;
  channel: string;
  link: string;
}

export interface Suggestion {
  books: Book[];
  youtube: YouTubeVideo[];
}

export interface ImprovementTopic {
  topicName: string;
  reason: string;
  resourceLink?: {
    title: string;
    url: string;
  };
}

export interface ImprovementSuggestion {
  topicsToImprove: ImprovementTopic[];
}