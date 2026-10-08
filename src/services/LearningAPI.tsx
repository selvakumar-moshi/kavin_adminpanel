import Super_Sales from "../config/Axios";

class LearningAPI {
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

    updateUser(id: string, firstName: string, lastName: string, phoneNumber: string, district: string, courses?: { courseId: string; batchId: string }[]) {
        return Super_Sales.put(`/User/${id}`, { firstName, lastName, phoneNumber, district, courses: courses || [] });
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

    getAllEnrollment(){
        return Super_Sales.get(`/Enrollment`);
    }

    getEnrollmentDownload(courseId: string) {
        return Super_Sales.get(`/Enrollment/course/${courseId}/download`, { responseType: 'blob' });
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

    createBatch(title: string, courseId: string, batchFrom: string, batchTo: string, whatsAppLink: string, telegramLink: string) {
        return Super_Sales.post('/Batch', { title, courseId, batchFrom, batchTo, whatsAppLink, telegramLink });
    }

    updateBatch(id: string, title: string, courseId: string, batchFrom: string, batchTo: string, whatsAppLink: string, telegramLink: string) {
        return Super_Sales.put(`/Batch/${id}`, { title, courseId, batchFrom, batchTo, whatsAppLink, telegramLink });
    }

    deleteBatch(id: string) {
        return Super_Sales.delete(`/Batch/${id}`);
    }

    getStudyMaterials(searchTerm?: string, courseId?: string, material?: string, globalFilter?: Record<string, string>, pageNumber?: number, pageSize?: number) {
        return Super_Sales.post('/StudyMaterial/search', {
            searchTerm: searchTerm || '',
            courseId: courseId || '',
            material: material || '',
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

    getVideoMaterials(searchTerm?: string, courseId?: string, material?: string, globalFilter?: Record<string, string>, pageNumber?: number, pageSize?: number) {
        return Super_Sales.post('/VideoMaterial/search', {
            searchTerm: searchTerm || '',
            courseId: courseId || '',
            material: material || '',
            globalFilter: globalFilter || {},
            pageNumber: pageNumber || 1,
            pageSize: pageSize || 10,
        });
    }

    createVideoMaterial(title: string, description: string, courseId: string, batchId: string, youtubeLink: string, materialToView: string) {
        return Super_Sales.post('/VideoMaterial', { title, description, courseId, batchId, youtubeLink, materialToView });
    }

    updateVideoMaterial(id: string, title: string, description: string, courseId: string, batchId: string, youtubeLink: string, materialToView: string) {
        return Super_Sales.put(`/VideoMaterial/${id}`, { title, description, courseId, batchId, youtubeLink, materialToView });
    }

    deleteVideoMaterial(id: string) {
        return Super_Sales.delete(`/VideoMaterial/${id}`);
    }

    getDashboardCounts() {
        return Super_Sales.get('/Dashboard/counts');
    }

    getQuizzes(searchTerm?: string, globalFilter?: Record<string, string>, pageNumber?: number, pageSize?: number, quizType?: string) {
        return Super_Sales.post('/quiz/search', {
            searchTerm: searchTerm || '',
            globalFilter: globalFilter || {},
            pageNumber: pageNumber || 1,
            pageSize: pageSize || 10,
            // Only sent when a tab is active (e.g. "competitive" / "school"); other callers still get every quiz
            ...(quizType ? { quizType } : {}),
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

    // School Book Revision structure: `path` is one of "subjects" | "categories" | "standard" | "parts"
    getQuizStructure(path: string, params?: Record<string, string>) {
        return Super_Sales.get(`/QuizStructure/${path}`, { params });
    }

    createQuizStructure(path: string, body: Record<string, unknown>) {
        return Super_Sales.post(`/QuizStructure/${path}`, body);
    }

    updateQuizStructure(path: string, id: string, body: Record<string, unknown>) {
        return Super_Sales.put(`/QuizStructure/${path}/${id}`, body);
    }

    deleteQuizStructure(path: string, id: string) {
        return Super_Sales.delete(`/QuizStructure/${path}/${id}`);
    }

    getFolders() {
        return Super_Sales.get('/Folder');
    }

    createFolder(name: string) {
        return Super_Sales.post('/Folder', { name });
    }

    updateFolder(id: string, name: string) {
        return Super_Sales.put(`/Folder/${id}`, { name });
    }

    deleteFolder(id: string) {
        return Super_Sales.delete(`/Folder/${id}`);
    }

    getSubFolders(folderId: string) {
        return Super_Sales.get('/SubFolder', { params: { folderId } });
    }

    createSubFolder(name: string, folderId: string) {
        return Super_Sales.post('/SubFolder', { name, folderId });
    }

    updateSubFolder(id: string, name: string, folderId: string) {
        return Super_Sales.put(`/SubFolder/${id}`, { name, folderId });
    }

    deleteSubFolder(id: string) {
        return Super_Sales.delete(`/SubFolder/${id}`);
    }

    getQuizCategories() {
        return Super_Sales.get('/Quiz/categories');
    }

    importQuiz(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        return Super_Sales.post('/Quiz/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }

    copyQuiz(quizId: string, batchId: string, title: string, quizToView: string) {
        return Super_Sales.post('/Quiz/copy', { quizId, batchId, title, quizToView });
    }

    getQuizRankList(quizId: string, batchId?: string, quizType?: string, quizToView?: string) {
        // Only the filters that apply are sent, e.g. /Quiz/{id}/rank-list?batchId=..&quizType=competitive&quizToView=Paid
        return Super_Sales.get(`/Quiz/${quizId}/rank-list`, {
            params: {
                ...(batchId ? { batchId } : {}),
                ...(quizType ? { quizType } : {}),
                ...(quizToView ? { quizToView } : {}),
            },
        });
    }
    getQuizRankListDownload(quizId: string) {
        return Super_Sales.get(`/Quiz/${quizId}/rank-list/download`, { responseType: 'blob' });
    }

    getNotifications(searchTerm?: string, globalFilter?: Record<string, string>, pageNumber?: number, pageSize?: number) {
        return Super_Sales.post('/Notification/search', {
            searchTerm: searchTerm || '',
            globalFilter: globalFilter || {},
            pageNumber: pageNumber || 1,
            pageSize: pageSize || 10,
        });
    }

    createNotification(title: string, description: string, link: string, date: string, notificationType: string) {
        return Super_Sales.post('/Notification', { title, description, link, date, notificationType });
    }

    updateNotification(id: string, title: string, description: string, link: string, date: string, notificationType: string) {
        return Super_Sales.put(`/Notification/${id}`, { title, description, link, date, notificationType });
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

const learningAPI = new LearningAPI();

export { learningAPI };
export default learningAPI;