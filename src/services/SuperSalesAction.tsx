import { createAsyncThunk } from "@reduxjs/toolkit";
import superSalesAPI from "./SuperSalesAPI";

export const getSSLogin = createAsyncThunk<any, { email: string; password: string }>(
    "userManagement/getSSLogin",
    async ({ email, password }, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.getSSLogin(email, password);
        const token = res?.data?.data?.token;
        const user = res?.data?.data?.user;
        if (token) {
          sessionStorage.setItem("token", token);
        }
        if (user) {
          sessionStorage.setItem("user", JSON.stringify(user));
        }
        return res?.data?.data;
      } catch (error: any) {
        // Extract message from error response
        const errorMessage = error.response?.data?.message || error.message || "Login failed";
        return rejectWithValue(errorMessage);
    }
  }
);

export const getRegister = createAsyncThunk<any, { firstName: string; lastName: string; phoneNumber: string; email: string; password: string }>(
    "userManagement/getRegister",
    async ({ firstName, lastName, phoneNumber, email, password }, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.getRegister(firstName, lastName, phoneNumber, email, password);
        return res?.data?.data;
      } catch (error: any) {
        // Extract message from error response
        const errorMessage = error.response?.data?.message || error.message || "Registration failed";
        return rejectWithValue(errorMessage);
    } 
  }
);

export const getUsers = createAsyncThunk<any, { searchTerm?: string; globalFilter?: Record<string, string>; pageNumber?: number; pageSize?: number } | undefined>(
    "userManagement/getUsers",
    async (params, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.getUsers(params?.searchTerm, params?.globalFilter, params?.pageNumber, params?.pageSize);
        return res?.data?.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to fetch Users";
        return rejectWithValue(errorMessage);
    }
  }
);

export const getUserById = createAsyncThunk<any, string>(
    "userManagement/getUserById",
    async (id, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.getUserById(id);
        return res?.data?.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to fetch User details";
        return rejectWithValue(errorMessage);
    }
  }
);

export const updateUser = createAsyncThunk<any, { id: string; firstName: string; lastName: string; phoneNumber: string; courses?: { courseId: string; batchId: string }[] }>(
    "userManagement/updateUser",
    async ({ id, firstName, lastName, phoneNumber, courses }, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.updateUser(id, firstName, lastName, phoneNumber, courses);
        return res?.data?.data || res?.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to update User";
        return rejectWithValue(errorMessage);
    }
  }
);

export const deleteUser = createAsyncThunk<any, { id: string }>(
    "userManagement/deleteUser",
    async ({ id }, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.deleteUser(id);
        return res?.data?.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to delete User";
        return rejectWithValue(errorMessage);
    }
  }
);

export const updateEnrollmentStatus = createAsyncThunk<any, { enrollmentId: string; status: string; paymentMethod?: string; transactionReference?: string }>(
    "userManagement/updateEnrollmentStatus",
    async ({ enrollmentId, status, paymentMethod = '', transactionReference = '' }, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.updateEnrollmentStatus(enrollmentId, status, paymentMethod, transactionReference);
        return res?.data?.data || res?.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to update enrollment status";
        return rejectWithValue(errorMessage);
    }
  }
);

export const getCourses = createAsyncThunk<any, void>(
    "courseManagement/getCourses",
    async (_, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.getCourses();
        return res?.data?.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to fetch Courses";
        return rejectWithValue(errorMessage);
    }
  }
);

export const getCourseById = createAsyncThunk<any, string>(
    "courseManagement/getCourseById",
    async (id, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.getCourseById(id);
        return res?.data?.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to fetch Course details";
        return rejectWithValue(errorMessage);
    }
  }
);

export const createCourse = createAsyncThunk<any, { courseName: string; courseDescription: string; courseAmount: number }>(
    "courseManagement/createCourse",
    async ({ courseName, courseDescription, courseAmount }, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.createCourse(courseName, courseDescription, courseAmount);
        return res?.data?.data || res?.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to create Course";
        return rejectWithValue(errorMessage);
    }
  }
);

export const updateCourse = createAsyncThunk<any, { id: string; courseName: string; courseDescription: string; courseAmount: number }>(
    "courseManagement/updateCourse",
    async ({ id, courseName, courseDescription, courseAmount }, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.updateCourse(id, courseName, courseDescription, courseAmount);
        return res?.data?.data || res?.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to update Course";
        return rejectWithValue(errorMessage);
    }
  }
);

export const deleteCourse = createAsyncThunk<any, { id: string }>(
    "courseManagement/deleteCourse",
    async ({ id }, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.deleteCourse(id);
        return res?.data?.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to delete Course";
        return rejectWithValue(errorMessage);
    }
  }
);

export const getBatches = createAsyncThunk<any, { courseId: string; searchTerm?: string; globalFilter?: Record<string, string>; pageNumber?: number; pageSize?: number }>(
    "courseManagement/getBatches",
    async (params, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.getBatches(params.courseId, params.searchTerm, params.globalFilter, params.pageNumber, params.pageSize);
        return res?.data?.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to fetch Batches";
        return rejectWithValue(errorMessage);
    }
  }
);

export const createBatch = createAsyncThunk<any, { title: string; courseId: string; batchFrom: string; batchTo: string }>(
    "courseManagement/createBatch",
    async ({ title, courseId, batchFrom, batchTo }, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.createBatch(title, courseId, batchFrom, batchTo);
        return res?.data?.data || res?.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to create Batch";
        return rejectWithValue(errorMessage);
    }
  }
);

export const updateBatch = createAsyncThunk<any, { id: string; title: string; courseId: string; batchFrom: string; batchTo: string }>(
    "courseManagement/updateBatch",
    async ({ id, title, courseId, batchFrom, batchTo }, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.updateBatch(id, title, courseId, batchFrom, batchTo);
        return res?.data?.data || res?.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to update Batch";
        return rejectWithValue(errorMessage);
    }
  }
);

export const deleteBatch = createAsyncThunk<any, { id: string }>(
    "courseManagement/deleteBatch",
    async ({ id }, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.deleteBatch(id);
        return res?.data?.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to delete Batch";
        return rejectWithValue(errorMessage);
    }
  }
);

export const getStudyMaterials = createAsyncThunk<any, { searchTerm?: string; globalFilter?: Record<string, string>; pageNumber?: number; pageSize?: number } | undefined>(
    "courseManagement/getStudyMaterials",
    async (params, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.getStudyMaterials(params?.searchTerm, params?.globalFilter, params?.pageNumber, params?.pageSize);
        return res?.data?.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to fetch Study Materials";
        return rejectWithValue(errorMessage);
    }
  }
);

export const createStudyMaterial = createAsyncThunk<any, FormData>(
    "courseManagement/createStudyMaterial",
    async (formData, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.createStudyMaterial(formData);
        return res?.data?.data || res?.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to create Study Material";
        return rejectWithValue(errorMessage);
    }
  }
);

export const updateStudyMaterial = createAsyncThunk<any, { id: string; formData: FormData }>(
    "courseManagement/updateStudyMaterial",
    async ({ id, formData }, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.updateStudyMaterial(id, formData);
        return res?.data?.data || res?.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to update Study Material";
        return rejectWithValue(errorMessage);
    }
  }
);

export const deleteStudyMaterial = createAsyncThunk<any, { id: string }>(
    "courseManagement/deleteStudyMaterial",
    async ({ id }, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.deleteStudyMaterial(id);
        return res?.data?.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to delete Study Material";
        return rejectWithValue(errorMessage);
    }
  }
);

export const getVideoMaterials = createAsyncThunk<any, { searchTerm?: string; globalFilter?: Record<string, string>; pageNumber?: number; pageSize?: number } | undefined>(
    "courseManagement/getVideoMaterials",
    async (params, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.getVideoMaterials(params?.searchTerm, params?.globalFilter, params?.pageNumber, params?.pageSize);
        return res?.data?.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to fetch Video Materials";
        return rejectWithValue(errorMessage);
    }
  }
);

export const createVideoMaterial = createAsyncThunk<any, { title: string; description: string; courseId: string; batchId: string; youtubeLink: string }>(
    "courseManagement/createVideoMaterial",
    async ({ title, description, courseId, batchId, youtubeLink }, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.createVideoMaterial(title, description, courseId, batchId, youtubeLink);
        return res?.data?.data || res?.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to create Video Material";
        return rejectWithValue(errorMessage);
    }
  }
);

export const updateVideoMaterial = createAsyncThunk<any, { id: string; title: string; description: string; courseId: string; batchId: string; youtubeLink: string }>(
    "courseManagement/updateVideoMaterial",
    async ({ id, title, description, courseId, batchId, youtubeLink }, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.updateVideoMaterial(id, title, description, courseId, batchId, youtubeLink);
        return res?.data?.data || res?.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to update Video Material";
        return rejectWithValue(errorMessage);
    }
  }
);

export const deleteVideoMaterial = createAsyncThunk<any, { id: string }>(
    "courseManagement/deleteVideoMaterial",
    async ({ id }, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.deleteVideoMaterial(id);
        return res?.data?.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to delete Video Material";
        return rejectWithValue(errorMessage);
    }
  }
);

export const getDashboardCounts = createAsyncThunk<any, void>(
  "userManagement/getDashboardCounts",
  async (_, { rejectWithValue }) => {
      try {
          const res = await superSalesAPI.getDashboardCounts();
          return res?.data?.data;
      } catch (error: any) {
          const errorMessage = error.response?.data?.message || error.message || "Failed to fetch Dashboard counts";
          return rejectWithValue(errorMessage);
      }
  }
);

export const getQuizzes = createAsyncThunk<any, { searchTerm?: string; globalFilter?: Record<string, string>; pageNumber?: number; pageSize?: number } | undefined>(
    "quizManagement/getQuizzes",
    async (params, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.getQuizzes(params?.searchTerm, params?.globalFilter, params?.pageNumber, params?.pageSize);
        return res?.data?.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to fetch Quizzes";
        return rejectWithValue(errorMessage);
    }
  }
);

export const getQuizById = createAsyncThunk<any, string>(
    "quizManagement/getQuizById",
    async (id, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.getQuizById(id);
        return res?.data?.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to fetch Quiz details";
        return rejectWithValue(errorMessage);
    }
  }
);

export const createQuiz = createAsyncThunk<any, FormData>(
    "quizManagement/createQuiz",
    async (formData, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.createQuiz(formData);
        return res?.data?.data || res?.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to create Quiz";
        return rejectWithValue(errorMessage);
    }
  }
);

export const updateQuiz = createAsyncThunk<any, { id: string; formData: FormData }>(
    "quizManagement/updateQuiz",
    async ({ id, formData }, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.updateQuiz(id, formData);
        return res?.data?.data || res?.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to update Quiz";
        return rejectWithValue(errorMessage);
    }
  }
);

export const deleteQuiz = createAsyncThunk<any, { id: string }>(
    "quizManagement/deleteQuiz",
    async ({ id }, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.deleteQuiz(id);
        return res?.data?.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to delete Quiz";
        return rejectWithValue(errorMessage);
    }
  }
);

export const publishQuiz = createAsyncThunk<any, { id: string; expiresAt: string }>(
    "quizManagement/publishQuiz",
    async ({ id, expiresAt }, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.publishQuiz(id, expiresAt);
        return res?.data?.data || res?.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to publish Quiz";
        return rejectWithValue(errorMessage);
    }
  }
);

export const getQuizRankList = createAsyncThunk<any, { quizId: string }>(
    "quizManagement/getQuizRankList",
    async (params, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.getQuizRankList(params.quizId);
        return res?.data?.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to fetch rank list";
        return rejectWithValue(errorMessage);
    }
  }
);

export const getNotifications = createAsyncThunk<any, { pageNumber?: number; pageSize?: number }>(
    "notificationManagement/getNotifications",
    async ({ pageNumber, pageSize }, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.getNotifications(pageNumber, pageSize);
        return res?.data?.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to fetch Notifications";
        return rejectWithValue(errorMessage);
    }
  }
);

export const createNotification = createAsyncThunk<any, { title: string; description: string; link: string; date: string }>(
    "notificationManagement/createNotification",
    async ({ title, description, link, date }, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.createNotification(title, description, link, date);
        return res?.data?.data || res?.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to create Notification";
        return rejectWithValue(errorMessage);
    }
  }
);

export const updateNotification = createAsyncThunk<any, { id: string; title: string; description: string; link: string; date: string }>(
    "notificationManagement/updateNotification",
    async ({ id, title, description, link, date }, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.updateNotification(id, title, description, link, date);
        return res?.data?.data || res?.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to update Notification";
        return rejectWithValue(errorMessage);
    }
  }
);

export const deleteNotification = createAsyncThunk<any, { id: string }>(
    "notificationManagement/deleteNotification",
    async ({ id }, { rejectWithValue }) => {
      try {
        const res = await superSalesAPI.deleteNotification(id);
        return res?.data?.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to delete Notification";
        return rejectWithValue(errorMessage);
    }
  }
);