import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../services/Store';
import { getDashboardCounts, getQuizRankList } from '../../services/LearningAction';
import superSalesAPI from '../../services/LearningAPI';
import { useToastMessages } from '../../components/ToastMessages/useToastMessages';
import type { QuizRecord } from '../Quiz/Constant';
import { RANK_QUIZ_TYPE_COMPETITIVE, type QuizRankListEntry } from './Constant';

// Pulls a filename out of a Content-Disposition header (e.g. attachment; filename="rank-list.xlsx")
const parseFileNameFromContentDisposition = (contentDisposition: string | undefined): string | null => {
    if (!contentDisposition) return null;
    const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
};

// Strips characters that aren't safe in a downloaded filename; collapses repeats so "Group - 2" -> "Group-2"
const toSafeFileNameSegment = (value: string): string =>
    value.trim().replace(/[^a-zA-Z0-9_]+/g, '-').replace(/^-+|-+$/g, '');

// School and Previous Year quizzes are always Free, so that is what the rank list request sends for them
const NON_COMPETITIVE_QUIZ_TO_VIEW = 'Free';

// What identifies a quiz in the dropdown besides its title, depending on the kind of quiz
const quizOptionLabel = (quiz: QuizRecord): string => {
    const context = quiz.quizType === 'school'
        ? [quiz.subject, quiz.standard ? `${quiz.standard}th` : '', quiz.part].filter(Boolean).join(' ')
        : quiz.quizType === 'previousYear'
            ? [quiz.folderName, quiz.subFolderName].filter(Boolean).join(' / ')
            : [quiz.courseName, quiz.batchTitle].filter(Boolean).join(' - ');
    return context ? `${quiz.title} (${context})` : quiz.title;
};

export const useDashboard = () => {
    const dispatch = useDispatch();
    const { messages: toastMessages, showError, hideToast } = useToastMessages();
    const [isDownloadingRankList, setIsDownloadingRankList] = useState(false);

    const { DashboardCountsData, QuizRankListData, apiStatus } = useSelector(
        (state: RootState) => state.learning
    );

    // Quiz Rank List filters. Quiz To View (Free / Paid) only applies to Competitive quizzes.
    const [quizType, setQuizType] = useState(RANK_QUIZ_TYPE_COMPETITIVE);
    const [quizToView, setQuizToView] = useState('Paid');
    const [selectedQuizId, setSelectedQuizId] = useState('');
    const [typeQuizzes, setTypeQuizzes] = useState<QuizRecord[]>([]);
    const [quizzesLoading, setQuizzesLoading] = useState(false);

    useEffect(() => {
        dispatch(getDashboardCounts() as any);
    }, [dispatch]);

    // Quizzes of the chosen type (loaded locally, so the Quiz page's own list isn't touched)
    useEffect(() => {
        let cancelled = false;
        setQuizzesLoading(true);
        superSalesAPI.getQuizzes(undefined, undefined, 1, 100, quizType)
            .then((res) => {
                if (cancelled) return;
                const items = res?.data?.data?.items;
                setTypeQuizzes(Array.isArray(items) ? items : []);
            })
            .catch((error: any) => {
                if (!cancelled) showError(error?.response?.data?.message || error?.message || 'Failed to load quizzes');
            })
            .finally(() => {
                if (!cancelled) setQuizzesLoading(false);
            });
        return () => {
            cancelled = true;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quizType]);

    const totalCourses: number = DashboardCountsData?.totalCourses ?? 0;
    const totalBatch: number = DashboardCountsData?.totalBatch ?? 0;
    const userCount: number = DashboardCountsData?.totalUsers ?? 0;
    const totalStudyMaterial: number = DashboardCountsData?.totalStudyMaterial ?? 0;
    const totalVideoMaterial: number = DashboardCountsData?.totalVideoMaterial ?? 0;
    // const totalQuestion: number = DashboardCountsData?.totalQuestion ?? 0;
    const totalQuiz: number = DashboardCountsData?.totalQuiz ?? 0;

    const rankList: QuizRankListEntry[] = Array.isArray(QuizRankListData) ? QuizRankListData : [];

    const showQuizToView = quizType === RANK_QUIZ_TYPE_COMPETITIVE;

    // The quizzes offered in the Quiz dropdown: of the chosen type and, for Competitive, of the chosen Free / Paid
    const filteredQuizzes = typeQuizzes.filter((quiz) => !showQuizToView || quiz.quizToView === quizToView);
    const quizOptions = filteredQuizzes.map((quiz) => ({ value: quiz.id, label: quizOptionLabel(quiz) }));

    // Keep a valid quiz selected: the first one of the list, or none when the filters leave nothing
    useEffect(() => {
        if (!filteredQuizzes.some((quiz) => quiz.id === selectedQuizId)) {
            setSelectedQuizId(filteredQuizzes[0]?.id ?? '');
        }
    }, [filteredQuizzes, selectedQuizId]);

    const selectedQuiz = filteredQuizzes.find((quiz) => quiz.id === selectedQuizId);
    const selectedBatchId = selectedQuiz?.batchId || '';

    // Rank list is per-quiz, so only fetch once a quiz is picked. The request carries the filters in use:
    //   Competitive: ?batchId=..&quizType=competitive&quizToView=Paid|Free   (batchId only for batch-based quizzes)
    //   School / Previous Year: ?quizType=school&quizToView=Free
    const rankQuizToView = showQuizToView ? quizToView : NON_COMPETITIVE_QUIZ_TO_VIEW;
    useEffect(() => {
        if (selectedQuizId) {
            dispatch(getQuizRankList({
                quizId: selectedQuizId,
                batchId: selectedBatchId || undefined,
                quizType,
                quizToView: rankQuizToView,
            }) as any);
        }
    }, [dispatch, selectedQuizId, selectedBatchId, quizType, rankQuizToView]);

    const handleQuizTypeChange = (value: string) => {
        setQuizType(value);
        setSelectedQuizId('');
    };

    const handleQuizToViewChange = (value: string) => {
        setQuizToView(value);
        setSelectedQuizId('');
    };

    const handleQuizChange = (value: string) => {
        setSelectedQuizId(value);
    };

    const handleDownloadRankList = async () => {
        if (!selectedQuizId || isDownloadingRankList) return;

        setIsDownloadingRankList(true);
        try {
            const res = await superSalesAPI.getQuizRankListDownload(selectedQuizId);
            // Quiz-Rank-{CourseName}({BatchTitle}).xlsx for course-based quizzes, Quiz-Rank-{Title}.xlsx for the rest
            const courseSegment = toSafeFileNameSegment(selectedQuiz?.courseName || '');
            const batchSegment = toSafeFileNameSegment(selectedQuiz?.batchTitle || '');
            const titleSegment = toSafeFileNameSegment(selectedQuiz?.title || '');
            const builtName = courseSegment
                ? `Quiz-Rank-${courseSegment}${batchSegment ? `(${batchSegment})` : ''}.xlsx`
                : titleSegment ? `Quiz-Rank-${titleSegment}.xlsx` : '';
            const fileName = builtName
                || parseFileNameFromContentDisposition(res.headers?.['content-disposition'])
                || `Quiz-Rank-${selectedQuizId}.xlsx`;

            const url = URL.createObjectURL(res.data as Blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (error: any) {
            showError(error?.response?.data?.message || error?.message || 'Failed to download rank list');
        } finally {
            setIsDownloadingRankList(false);
        }
    };

    return {
        loading: apiStatus?.DashboardCountsData?.loading ?? false,
        error: apiStatus?.DashboardCountsData?.error ?? null,
        totalCourses,
        totalBatch,
        userCount,
        // totalQuestion,
        totalQuiz,
        totalStudyMaterial,
        totalVideoMaterial,
        quizType,
        quizToView,
        showQuizToView,
        quizOptions,
        quizzesLoading,
        selectedQuizId,
        handleQuizTypeChange,
        handleQuizToViewChange,
        handleQuizChange,
        rankList,
        rankListLoading: apiStatus?.QuizRankListData?.loading ?? false,
        handleDownloadRankList,
        isDownloadingRankList,
        toastMessages,
        hideToast,
    };
};
