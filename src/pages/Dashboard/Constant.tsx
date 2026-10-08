export const CATEGORY_COLORS = ['#2a78d6', '#eb6834', '#1baf7a'];

// Quiz Rank List filters: which kind of quiz to list, and (Competitive only) whether it is Free or Paid
export const RANK_QUIZ_TYPE_COMPETITIVE = 'competitive';

export const RANK_QUIZ_TYPE_OPTIONS = [
    { value: RANK_QUIZ_TYPE_COMPETITIVE, label: 'Competitive' },
    { value: 'school', label: 'School' },
    { value: 'previousYear', label: 'Previous Year' },
];

export const RANK_QUIZ_TO_VIEW_OPTIONS = [
    { value: 'Free', label: 'Free' },
    { value: 'Paid', label: 'Paid' },
];

export interface QuizRankListEntry {
    rank: number;
    userId: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    correctCount: number;
    totalQuestions: number;
    totalQuiz: number;
    score: string;
    submittedAt: string;
}