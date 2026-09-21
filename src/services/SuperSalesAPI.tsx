import Super_Sales from "../config/Axios";

class SuperSalesAPI {
    getSSLogin(email: string, password: string) {
        return Super_Sales.post(`/Auth/login`, { email, password });
    }

    getRegister(firstName: string, lastName: string, phoneNumber: string, email: string, password: string) {
        return Super_Sales.post(`/Login/register`, { firstName, lastName, phoneNumber, email, password });
    }

    getUsers(searchTerm?: string, globalFilter?: Record<string, string>, pageNumber?: number, pageSize?: number) {
        return Super_Sales.post('/User', {
            searchTerm: searchTerm || '',
            globalFilter: globalFilter || {},
            pageNumber: pageNumber || 1,
            pageSize: pageSize || 10,
        });
    }

    getUserById(id: string) {
        return Super_Sales.get(`/User/${id}`);
    }

    updateUser(id: string, firstName: string, lastName: string, phoneNumber: string, courses?: { courseId: string; batchId: string }[]) {
        return Super_Sales.put(`/User/${id}`, { firstName, lastName, phoneNumber, courses: courses || [] });
    }

    deleteUser(id: string) {
        return Super_Sales.delete(`/User/${id}`);
    }

    updateEnrollmentStatus(enrollmentId: string, status: string, paymentMethod: string, transactionReference: string) {
        return Super_Sales.put(`/Enrollment/${enrollmentId}/status`, { status, paymentMethod, transactionReference });
    }

    getCourses() {
        return Super_Sales.get('/Course');
    }

    getCourseById(id: string) {
        return Super_Sales.get(`/Course/${id}`);
    }

    createCourse(courseName: string, courseDescription: string, courseAmount: number) {
        return Super_Sales.post('/Course', { courseName, courseDescription, courseAmount });
    }

    updateCourse(id: string, courseName: string, courseDescription: string, courseAmount: number) {
        return Super_Sales.put(`/Course/${id}`, { courseName, courseDescription, courseAmount });
    }

    deleteCourse(id: string) {
        return Super_Sales.delete(`/Course/${id}`);
    }

    getBatches(courseId: string, searchTerm?: string, globalFilter?: Record<string, string>, pageNumber?: number, pageSize?: number) {
        return Super_Sales.post('/Batch/search', {
            courseId,
            searchTerm: searchTerm || '',
            globalFilter: globalFilter || {},
            pageNumber: pageNumber || 1,
            pageSize: pageSize || 10,
        });
    }

    createBatch(title: string, courseId: string, batchFrom: string, batchTo: string) {
        return Super_Sales.post('/Batch', { title, courseId, batchFrom, batchTo });
    }

    updateBatch(id: string, title: string, courseId: string, batchFrom: string, batchTo: string) {
        return Super_Sales.put(`/Batch/${id}`, { title, courseId, batchFrom, batchTo });
    }

    deleteBatch(id: string) {
        return Super_Sales.delete(`/Batch/${id}`);
    }

    getStudyMaterials(searchTerm?: string, globalFilter?: Record<string, string>, pageNumber?: number, pageSize?: number) {
        return Super_Sales.post('/StudyMaterial/search', {
            searchTerm: searchTerm || '',
            globalFilter: globalFilter || {},
            pageNumber: pageNumber || 1,
            pageSize: pageSize || 10,
        });
    }

    createStudyMaterial(formData: FormData) {
        return Super_Sales.post('/StudyMaterial', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }

    updateStudyMaterial(id: string, formData: FormData) {
        return Super_Sales.put(`/StudyMaterial/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }

    deleteStudyMaterial(id: string) {
        return Super_Sales.delete(`/StudyMaterial/${id}`);
    }

    getVideoMaterials(searchTerm?: string, globalFilter?: Record<string, string>, pageNumber?: number, pageSize?: number) {
        return Super_Sales.post('/VideoMaterial/search', {
            searchTerm: searchTerm || '',
            globalFilter: globalFilter || {},
            pageNumber: pageNumber || 1,
            pageSize: pageSize || 10,
        });
    }

    createVideoMaterial(title: string, description: string, courseId: string, batchId: string, youtubeLink: string) {
        return Super_Sales.post('/VideoMaterial', { title, description, courseId, batchId, youtubeLink });
    }

    updateVideoMaterial(id: string, title: string, description: string, courseId: string, batchId: string, youtubeLink: string) {
        return Super_Sales.put(`/VideoMaterial/${id}`, { title, description, courseId, batchId, youtubeLink });
    }

    deleteVideoMaterial(id: string) {
        return Super_Sales.delete(`/VideoMaterial/${id}`);
    }

    getDashboardCounts() {
        return Super_Sales.get('/Dashboard/counts');
    }

    getQuizzes(searchTerm?: string, globalFilter?: Record<string, string>, pageNumber?: number, pageSize?: number) {
        return Super_Sales.post('/quiz/search', {
            searchTerm: searchTerm || '',
            globalFilter: globalFilter || {},
            pageNumber: pageNumber || 1,
            pageSize: pageSize || 10,
        });
    }

    getQuizById(id: string) {
        return Super_Sales.get(`/quiz/${id}`);
    }

    createQuiz(formData: FormData) {
        return Super_Sales.post('/quiz', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }

    updateQuiz(id: string, formData: FormData) {
        return Super_Sales.put(`/quiz/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }

    deleteQuiz(id: string) {
        return Super_Sales.delete(`/quiz/${id}`);
    }

    publishQuiz(id: string, expiresAt: string) {
        return Super_Sales.post(`/quiz/${id}/publish`, { expiresAt });
    }

    getQuizRankList(quizId: string) {
        return Super_Sales.get(`/Quiz/${quizId}/rank-list`, {});
    }
    getQuizRankListDownload(quizId: string) {
        return Super_Sales.get(`/Quiz/${quizId}/rank-list/download`, { responseType: 'blob' });
    }

    getNotifications(pageNumber?: number, pageSize?: number) {
        return Super_Sales.post('/Notification/search', {
            pageNumber: pageNumber || 1,
            pageSize: pageSize || 10,
        });
    }

    createNotification(title: string, description: string, link: string, date: string) {
        return Super_Sales.post('/Notification', { title, description, link, date });
    }

    updateNotification(id: string, title: string, description: string, link: string, date: string) {
        return Super_Sales.put(`/Notification/${id}`, { title, description, link, date });
    }

    deleteNotification(id: string) {
        return Super_Sales.delete(`/Notification/${id}`);
    }
}

export interface QuizQuestionInput {
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: string;
}

const superSalesAPI = new SuperSalesAPI();

export { superSalesAPI };
export default superSalesAPI;