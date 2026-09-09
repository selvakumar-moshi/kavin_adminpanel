export const CATEGORY_COLORS = ['#2a78d6', '#eb6834', '#1baf7a'];

export interface QuizRankListEntry {
    rank: number;
    userId: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    correctCount: number;
    totalQuestions: number;
    score: string;
    submittedAt: string;
}