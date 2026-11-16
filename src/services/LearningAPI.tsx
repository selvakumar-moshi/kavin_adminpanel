import Super_Sales from "../config/Axios";

export interface SyllabusWisePayload {
    title: string;
    description: string;
    amount: number;
    folderId: string;
}

export interface LiveClassPayload {
    title: string;
    description: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
}

class LearningAPI {
    getSSLogin(email: string, password: string) {
        return Super_Sales.post(`/Auth/login`, { email, password });
    }

    getRegister(firstName: string, lastName: string, phoneNumber: string, email: string, password: string, district?: string, confirmPassword?: string) {
        return Super_Sales.post(`/Auth/register`, { firstName, lastName, email, phoneNumber, district, password, confirmPassword });
    }

    resetUserPassword(id: string) {
        return Super_Sales.post(`/User/${id}/reset-password`);
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

    updateSyllabusWisePaymentStatus(paymentId: string, paymentStatus: string) {
        return Super_Sales.put(`/SyllabusWise/payments/${paymentId}/status`, { paymentStatus });
    }

    // `courseType` ("All" / "Paid" / "Free") is only sent when given; other callers still get every course
    getCourses(courseType?: string) {
        return Super_Sales.get('/Course', { params: courseType ? { courseType } : undefined });
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

    getQuestionPaper(searchTerm?: string, courseId?: string, globalFilter?: Record<string, string>, pageNumber?: number, pageSize?: number) {
        return Super_Sales.post('/QuestionPaper/search', {
            searchTerm: searchTerm || '',
            courseId: courseId || '',
            globalFilter: globalFilter || {},
            pageNumber: pageNumber || 1,
            pageSize: pageSize || 10,
        });
    }

    createQuestionPaper(formData: FormData) {
        return Super_Sales.post('/QuestionPaper', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }

    updateQuestionPaper(id: string, formData: FormData) {
        return Super_Sales.put(`/QuestionPaper/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }

    deleteQuestionPaper(id: string) {
        return Super_Sales.delete(`/QuestionPaper/${id}`);
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

    getQuizzes(searchTerm?: string, globalFilter?: Record<string, string>, pageNumber?: number, pageSize?: number, quizType?: string, quizToView?: string) {
        return Super_Sales.post('/quiz/search', {
            searchTerm: searchTerm || '',
            globalFilter: globalFilter || {},
            pageNumber: pageNumber || 1,
            pageSize: pageSize || 10,
            // Only sent when a tab is active (e.g. "competitive" / "school"); other callers still get every quiz
            ...(quizType ? { quizType } : {}),
            ...(quizToView ? { quizToView } : {}),
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

    // Detaches the uploaded document from the quiz (multipart, like the rest of this endpoint)
    removeQuizSourceFile(id: string) {
        const formData = new FormData();
        formData.append('removeSourceFile', 'true');
        return this.updateQuiz(id, formData);
    }

    deleteQuiz(id: string) {
        return Super_Sales.delete(`/quiz/${id}`);
    }

    publishQuiz(id: string, expiresAt: string) {
        return Super_Sales.post(`/quiz/${id}/publish`, { expiresAt });
    }

    getFolders() {
        return Super_Sales.get('/Folder');
    }

    createFolder(name: string, subFolders: { name: string; subFolders: unknown[] }[] = []) {
        return Super_Sales.post('/Folder', { name, subFolders });
    }

    updateFolder(id: string, name: string, subFolders: { name: string; subFolders: unknown[] }[] = []) {
        return Super_Sales.put(`/Folder/${id}`, { name, subFolders });
    }

    deleteFolder(id: string) {
        return Super_Sales.delete(`/Folder/${id}`);
    }

    getSubFolders(folderId: string) {
        return Super_Sales.get('/SubFolder', { params: { folderId } });
    }

    createSubFolder(name: string, folderId: string, subFolders: { name: string; subFolders: unknown[] }[] = []) {
        return Super_Sales.post('/SubFolder', { name, folderId, subFolders });
    }

    updateSubFolder(id: string, name: string, folderId: string, subFolders: { name: string; subFolders: unknown[] }[] = []) {
        return Super_Sales.put(`/SubFolder/${id}`, { name, folderId, subFolders });
    }

    deleteSubFolder(id: string) {
        return Super_Sales.delete(`/SubFolder/${id}`);
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

    copyQuiz(quizId: string, courseId: string, batchId: string, title: string, quizToView: string) {
        return Super_Sales.post('/Quiz/copy', { quizId, courseId, batchId, title, quizToView });
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

    // Sent as multipart form data: title, description, link, startDate, endDate, notificationType and the optional file
    createNotification(formData: FormData) {
        return Super_Sales.post('/Notification', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }

    updateNotification(id: string, formData: FormData) {
        return Super_Sales.put(`/Notification/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }

    searchSyllabusMaterials(searchTerm?: string, folderId?: string, subFolderId?: string, pageNumber?: number, pageSize?: number) {
        return Super_Sales.post('/SyllabusMaterial/search', {
            searchTerm: searchTerm || '',
            folderId: folderId || '',
            subFolderId: subFolderId || '',
            pageNumber: pageNumber || 1,
            pageSize: pageSize || 10,
        });
    }

    // Sent as multipart form data: title, description, folderId, subFolderId and the PDF as `file`
    createSyllabusMaterial(formData: FormData) {
        return Super_Sales.post('/SyllabusMaterial', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }

    updateSyllabusMaterial(id: string, formData: FormData) {
        return Super_Sales.put(`/SyllabusMaterial/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }

    deleteSyllabusMaterial(id: string) {
        return Super_Sales.delete(`/SyllabusMaterial/${id}`);
    }

    getSyllabusWiseList() {
        return Super_Sales.get('/SyllabusWise');
    }

    getSyllabusWiseById(id: string) {
        return Super_Sales.get(`/SyllabusWise/${id}`);
    }

    createSyllabusWise(payload: SyllabusWisePayload) {
        return Super_Sales.post('/SyllabusWise', payload);
    }

    updateSyllabusWise(id: string, payload: SyllabusWisePayload) {
        return Super_Sales.put(`/SyllabusWise/${id}`, payload);
    }

    deleteSyllabusWise(id: string) {
        return Super_Sales.delete(`/SyllabusWise/${id}`);
    }

    getLiveClasses() {
        return Super_Sales.get('/LiveClasses');
    }

    getLiveClassById(id: string) {
        return Super_Sales.get(`/LiveClasses/${id}`);
    }

    createLiveClass(payload: LiveClassPayload) {
        return Super_Sales.post('/LiveClasses', payload);
    }

    updateLiveClass(id: string, payload: LiveClassPayload) {
        return Super_Sales.put(`/LiveClasses/${id}`, payload);
    }

    deleteLiveClass(id: string) {
        return Super_Sales.delete(`/LiveClasses/${id}`);
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