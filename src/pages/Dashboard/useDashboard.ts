import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../services/Store';
import { getDashboardCounts, getQuizzes, getQuizRankList } from '../../services/SuperSalesAction';
import type { QuizRecord } from '../Quiz/Constant';
import type { QuizRankListEntry } from './Constant';

export const useDashboard = () => {
    const dispatch = useDispatch();

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
    };
};
