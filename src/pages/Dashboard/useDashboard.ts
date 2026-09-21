import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../services/Store';
import { getDashboardCounts, getQuizzes, getQuizRankList } from '../../services/SuperSalesAction';
import superSalesAPI from '../../services/SuperSalesAPI';
import { useToastMessages } from '../../components/ToastMessages/useToastMessages';
import type { QuizRecord } from '../Quiz/Constant';
import type { QuizRankListEntry } from './Constant';

// Pulls a filename out of a Content-Disposition header (e.g. attachment; filename="rank-list.xlsx")
const parseFileNameFromContentDisposition = (contentDisposition: string | undefined): string | null => {
    if (!contentDisposition) return null;
    const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
};

// Strips characters that aren't safe in a downloaded filename
const toSafeFileNameSegment = (value: string): string => value.trim().replace(/[^a-zA-Z0-9-_]+/g, '-');

export const useDashboard = () => {
    const dispatch = useDispatch();
    const { messages: toastMessages, showError, hideToast } = useToastMessages();
    const [isDownloadingRankList, setIsDownloadingRankList] = useState(false);

    const { DashboardCountsData, QuizzesData, QuizRankListData, apiStatus } = useSelector(
        (state: RootState) => state.superSales
    );

    const [selectedQuizId, setSelectedQuizId] = useState('');

    useEffect(() => {
        dispatch(getDashboardCounts() as any);
        dispatch(getQuizzes({ pageNumber: 1, pageSize: 100 }) as any);
    }, [dispatch]);

    // Rank list is per-quiz, so only fetch once a quiz is picked from the dropdown
    useEffect(() => {
        if (selectedQuizId) {
            dispatch(getQuizRankList({ quizId: selectedQuizId }) as any);
        }
    }, [dispatch, selectedQuizId]);

    const totalCourses: number = DashboardCountsData?.totalCourses ?? 0;
    const totalBatch: number = DashboardCountsData?.totalBatch ?? 0;
    const userCount: number = DashboardCountsData?.totalUsers ?? 0;
    const totalStudyMaterial: number = DashboardCountsData?.totalStudyMaterial ?? 0;
    const totalVideoMaterial: number = DashboardCountsData?.totalVideoMaterial ?? 0;
    const totalQuestion: number = DashboardCountsData?.totalQuestion ?? 0;

    const quizzesArray: QuizRecord[] = Array.isArray(QuizzesData?.items) ? QuizzesData.items : [];
    const rankList: QuizRankListEntry[] = Array.isArray(QuizRankListData) ? QuizRankListData : [];

    // Default to the first quiz once the list loads, if nothing's selected yet
    useEffect(() => {
        if (!selectedQuizId && quizzesArray.length > 0) {
            setSelectedQuizId(quizzesArray[0].id);
        }
    }, [quizzesArray, selectedQuizId]);

    const handleQuizChange = (quizId: string) => {
        setSelectedQuizId(quizId);
    };

    const handleDownloadRankList = async () => {
        if (!selectedQuizId || isDownloadingRankList) return;

        setIsDownloadingRankList(true);
        try {
            const res = await superSalesAPI.getQuizRankListDownload(selectedQuizId);
            const selectedQuiz = quizzesArray.find((quiz) => quiz.id === selectedQuizId);
            const fallbackName = `quiz-rank-list-${toSafeFileNameSegment(selectedQuiz?.courseName || selectedQuizId)}.xlsx`;
            const fileName = parseFileNameFromContentDisposition(res.headers?.['content-disposition']) || fallbackName;

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
        totalQuestion,
        totalStudyMaterial,
        totalVideoMaterial,
        quizzesArray,
        selectedQuizId,
        handleQuizChange,
        rankList,
        rankListLoading: apiStatus?.QuizRankListData?.loading ?? false,
        handleDownloadRankList,
        isDownloadingRankList,
        toastMessages,
        hideToast,
    };
};
