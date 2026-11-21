import { useState, useEffect, useCallback } from 'react';
import superSalesAPI from '../services/LearningAPI';

const errorText = (error: any, fallback: string) => error?.response?.data?.message || error?.message || fallback;

// Options for a Course dropdown and the Batch dropdown that follows it: every course is loaded once, the batches of a
// course when `loadBatches(courseId)` is called (an empty id clears them)
export const useCourseBatchOptions = (showError: (message: string) => void) => {
    const [courses, setCourses] = useState<{ id: string; courseName: string }[]>([]);
    const [batches, setBatches] = useState<{ id: string; title: string }[]>([]);
    const [batchesLoading, setBatchesLoading] = useState(false);

    useEffect(() => {
        superSalesAPI.getCourses()
            .then((res) => setCourses(Array.isArray(res?.data?.data) ? res.data.data : []))
            .catch((error: any) => showError(errorText(error, 'Failed to load courses')));
    }, [showError]);

    const loadBatches = useCallback(async (courseId: string) => {
        if (!courseId) {
            setBatches([]);
            return;
        }
        setBatchesLoading(true);
        try {
            const res = await superSalesAPI.getBatches(courseId, undefined, undefined, 1, 100);
            const items = res?.data?.data?.items;
            setBatches(Array.isArray(items) ? items : []);
        } catch (error: any) {
            setBatches([]);
            showError(errorText(error, 'Failed to load batches'));
        } finally {
            setBatchesLoading(false);
        }
    }, [showError]);

    return { courses, batches, batchesLoading, loadBatches };
};
