import { createSlice } from "@reduxjs/toolkit";
import { getSSLogin, getRegister, deleteUser, updateUser, getUsers, getUserById, updateEnrollmentStatus, getCourses, getCourseById, createCourse, updateCourse, deleteCourse, getBatches, createBatch, updateBatch, deleteBatch, getStudyMaterials, createStudyMaterial, updateStudyMaterial, deleteStudyMaterial, getVideoMaterials, createVideoMaterial, updateVideoMaterial, deleteVideoMaterial, getDashboardCounts, getQuizzes, getQuizById, createQuiz, updateQuiz, deleteQuiz, publishQuiz, copyQuiz, getQuizRankList, getNotifications, createNotification, updateNotification, deleteNotification} from "./LearningAction";
import { initialState } from "./ILearning";

const LearningSlice = createSlice({
    name: "learning",
    initialState,
    reducers: {
        resetSSLogin: (state) => {
            state.loading = false;
            state.error = null;
            state.apiStatus.SSLoginData = { loading: false, success: false, error: null };
            state.apiStatus.RegisterData = { loading: false, success: false, error: null };
        },
        clearError: (state) => {
            state.error = null;
        },
        logout: (state) => {
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("user");
            state.isAuthenticated = false;
            state.SSLoginData = null;
            state.apiStatus.SSLoginData = { loading: false, success: false, error: null };
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(getSSLogin.pending, (state) => {
                state.loading = true;
                state.apiStatus.SSLoginData.loading = true;
                state.apiStatus.SSLoginData.success = false;
                state.apiStatus.SSLoginData.error = null;
                state.error = null;
            })
            .addCase(getSSLogin.fulfilled, (state, action) => {
                state.loading = false;
                state.SSLoginData = action.payload;
                state.isAuthenticated = true;
                state.apiStatus.SSLoginData.loading = false;
                state.apiStatus.SSLoginData.success = true;
                state.apiStatus.SSLoginData.error = null;
            })
            .addCase(getSSLogin.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string || "Failed to fetch SS Login data";
                state.isAuthenticated = false;
                state.apiStatus.SSLoginData.loading = false;
                state.apiStatus.SSLoginData.success = false;
                state.apiStatus.SSLoginData.error = action.payload as string || "Failed to fetch SS Login data";
            });
            
        builder
            .addCase(getRegister.pending, (state) => {
                state.loading = true;
                state.apiStatus.RegisterData.loading = true;
                state.apiStatus.RegisterData.success = false;
                state.apiStatus.RegisterData.error = null;
                state.error = null;
            })
            .addCase(getRegister.fulfilled, (state, action) => {
                state.loading = false;
                state.RegisterData = action.payload;
                state.apiStatus.RegisterData.loading = false;
                state.apiStatus.RegisterData.success = true;
                state.apiStatus.RegisterData.error = null;
            })
            .addCase(getRegister.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string || "Failed to fetch Register data";
                state.apiStatus.RegisterData.loading = false;
                state.apiStatus.RegisterData.success = false;
                state.apiStatus.RegisterData.error = action.payload as string || "Failed to fetch Register data";
            });

        builder
            .addCase(getUsers.pending, (state) => {
                state.loading = true;
                state.apiStatus.UsersData.loading = true;
                state.apiStatus.UsersData.success = false;
                state.apiStatus.UsersData.error = null;
                state.error = null;
            })
            .addCase(getUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string || "Failed to fetch Users data";
                state.apiStatus.UsersData.loading = false;
                state.apiStatus.UsersData.success = false;
                state.apiStatus.UsersData.error = action.payload as string || "Failed to fetch Users data";
            })
            .addCase(getUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.UsersData = action.payload;
                state.apiStatus.UsersData.loading = false;
                state.apiStatus.UsersData.success = true;
                state.apiStatus.UsersData.error = null;
            })
        builder
            .addCase(getUserById.pending, (state) => {
                state.loading = true;
                state.apiStatus.UserDetailData.loading = true;
                state.apiStatus.UserDetailData.success = false;
                state.apiStatus.UserDetailData.error = null;
                state.error = null;
            })
            .addCase(getUserById.fulfilled, (state, action) => {
                state.loading = false;
                state.UserDetailData = action.payload;
                state.apiStatus.UserDetailData.loading = false;
                state.apiStatus.UserDetailData.success = true;
                state.apiStatus.UserDetailData.error = null;
            })
            .addCase(getUserById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string || "Failed to fetch User details";
                state.apiStatus.UserDetailData.loading = false;
                state.apiStatus.UserDetailData.success = false;
                state.apiStatus.UserDetailData.error = action.payload as string || "Failed to fetch User details";
            });
        builder
            .addCase(updateUser.pending, (state) => {
                state.loading = true;
                state.apiStatus.UsersData.loading = true;
                state.apiStatus.UsersData.success = false;
                state.apiStatus.UsersData.error = null;
                state.error = null;
            })
            .addCase(updateUser.fulfilled, (state) => {
                state.loading = false;
                state.apiStatus.UsersData.loading = false;
                state.apiStatus.UsersData.success = true;
                state.apiStatus.UsersData.error = null;
            })
            .addCase(updateUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string || "Failed to update User";
                state.apiStatus.UsersData.loading = false;
                state.apiStatus.UsersData.success = false;
                state.apiStatus.UsersData.error = action.payload as string || "Failed to update User";
            });
        builder
            .addCase(deleteUser.pending, (state) => {
                state.loading = true;
                state.apiStatus.UsersData.loading = true;
                state.apiStatus.UsersData.success = false;
                state.apiStatus.UsersData.error = null;
                state.error = null;
            })
            .addCase(deleteUser.fulfilled, (state) => {
                state.loading = false;
                state.apiStatus.UsersData.loading = false;
                state.apiStatus.UsersData.success = true;
                state.apiStatus.UsersData.error = null;
            })
            .addCase(deleteUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string || "Failed to delete User";
                state.apiStatus.UsersData.loading = false;
                state.apiStatus.UsersData.success = false;
                state.apiStatus.UsersData.error = action.payload as string || "Failed to delete User";
            });

        builder
            .addCase(updateEnrollmentStatus.pending, (state) => {
                state.apiStatus.EnrollmentStatusData.loading = true;
                state.apiStatus.EnrollmentStatusData.success = false;
                state.apiStatus.EnrollmentStatusData.error = null;
            })
            .addCase(updateEnrollmentStatus.fulfilled, (state, action) => {
                state.EnrollmentStatusData = action.payload;
                state.apiStatus.EnrollmentStatusData.loading = false;
                state.apiStatus.EnrollmentStatusData.success = true;
                state.apiStatus.EnrollmentStatusData.error = null;
            })
            .addCase(updateEnrollmentStatus.rejected, (state, action) => {
                state.apiStatus.EnrollmentStatusData.loading = false;
                state.apiStatus.EnrollmentStatusData.success = false;
                state.apiStatus.EnrollmentStatusData.error = action.payload as string || "Failed to update enrollment status";
            });

        builder
            .addCase(getCourses.pending, (state) => {
                state.apiStatus.CoursesData.loading = true;
                state.apiStatus.CoursesData.success = false;
                state.apiStatus.CoursesData.error = null;
            })
            .addCase(getCourses.fulfilled, (state, action) => {
                state.CoursesData = action.payload;
                state.apiStatus.CoursesData.loading = false;
                state.apiStatus.CoursesData.success = true;
                state.apiStatus.CoursesData.error = null;
            })
            .addCase(getCourses.rejected, (state, action) => {
                state.apiStatus.CoursesData.loading = false;
                state.apiStatus.CoursesData.success = false;
                state.apiStatus.CoursesData.error = action.payload as string || "Failed to fetch Courses";
            });

        builder
            .addCase(getCourseById.pending, (state) => {
                state.apiStatus.CourseDetailData.loading = true;
                state.apiStatus.CourseDetailData.success = false;
                state.apiStatus.CourseDetailData.error = null;
            })
            .addCase(getCourseById.fulfilled, (state, action) => {
                state.CourseDetailData = action.payload;
                state.apiStatus.CourseDetailData.loading = false;
                state.apiStatus.CourseDetailData.success = true;
                state.apiStatus.CourseDetailData.error = null;
            })
            .addCase(getCourseById.rejected, (state, action) => {
                state.apiStatus.CourseDetailData.loading = false;
                state.apiStatus.CourseDetailData.success = false;
                state.apiStatus.CourseDetailData.error = action.payload as string || "Failed to fetch Course details";
            });

        builder
            .addCase(createCourse.pending, (state) => {
                state.apiStatus.CoursesData.loading = true;
                state.apiStatus.CoursesData.success = false;
                state.apiStatus.CoursesData.error = null;
            })
            .addCase(createCourse.fulfilled, (state) => {
                state.apiStatus.CoursesData.loading = false;
                state.apiStatus.CoursesData.success = true;
                state.apiStatus.CoursesData.error = null;
            })
            .addCase(createCourse.rejected, (state, action) => {
                state.apiStatus.CoursesData.loading = false;
                state.apiStatus.CoursesData.success = false;
                state.apiStatus.CoursesData.error = action.payload as string || "Failed to create Course";
            });

        builder
            .addCase(updateCourse.pending, (state) => {
                state.apiStatus.CoursesData.loading = true;
                state.apiStatus.CoursesData.success = false;
                state.apiStatus.CoursesData.error = null;
            })
            .addCase(updateCourse.fulfilled, (state) => {
                state.apiStatus.CoursesData.loading = false;
                state.apiStatus.CoursesData.success = true;
                state.apiStatus.CoursesData.error = null;
            })
            .addCase(updateCourse.rejected, (state, action) => {
                state.apiStatus.CoursesData.loading = false;
                state.apiStatus.CoursesData.success = false;
                state.apiStatus.CoursesData.error = action.payload as string || "Failed to update Course";
            });

        builder
            .addCase(deleteCourse.pending, (state) => {
                state.apiStatus.CoursesData.loading = true;
                state.apiStatus.CoursesData.success = false;
                state.apiStatus.CoursesData.error = null;
            })
            .addCase(deleteCourse.fulfilled, (state) => {
                state.apiStatus.CoursesData.loading = false;
                state.apiStatus.CoursesData.success = true;
                state.apiStatus.CoursesData.error = null;
            })
            .addCase(deleteCourse.rejected, (state, action) => {
                state.apiStatus.CoursesData.loading = false;
                state.apiStatus.CoursesData.success = false;
                state.apiStatus.CoursesData.error = action.payload as string || "Failed to delete Course";
            });

        builder
            .addCase(getBatches.pending, (state) => {
                state.apiStatus.BatchesData.loading = true;
                state.apiStatus.BatchesData.success = false;
                state.apiStatus.BatchesData.error = null;
            })
            .addCase(getBatches.fulfilled, (state, action) => {
                state.BatchesData = action.payload;
                state.apiStatus.BatchesData.loading = false;
                state.apiStatus.BatchesData.success = true;
                state.apiStatus.BatchesData.error = null;
            })
            .addCase(getBatches.rejected, (state, action) => {
                state.apiStatus.BatchesData.loading = false;
                state.apiStatus.BatchesData.success = false;
                state.apiStatus.BatchesData.error = action.payload as string || "Failed to fetch Batches";
            });

        builder
            .addCase(createBatch.pending, (state) => {
                state.apiStatus.BatchesData.loading = true;
                state.apiStatus.BatchesData.success = false;
                state.apiStatus.BatchesData.error = null;
            })
            .addCase(createBatch.fulfilled, (state) => {
                state.apiStatus.BatchesData.loading = false;
                state.apiStatus.BatchesData.success = true;
                state.apiStatus.BatchesData.error = null;
            })
            .addCase(createBatch.rejected, (state, action) => {
                state.apiStatus.BatchesData.loading = false;
                state.apiStatus.BatchesData.success = false;
                state.apiStatus.BatchesData.error = action.payload as string || "Failed to create Batch";
            });

        builder
            .addCase(updateBatch.pending, (state) => {
                state.apiStatus.BatchesData.loading = true;
                state.apiStatus.BatchesData.success = false;
                state.apiStatus.BatchesData.error = null;
            })
            .addCase(updateBatch.fulfilled, (state) => {
                state.apiStatus.BatchesData.loading = false;
                state.apiStatus.BatchesData.success = true;
                state.apiStatus.BatchesData.error = null;
            })
            .addCase(updateBatch.rejected, (state, action) => {
                state.apiStatus.BatchesData.loading = false;
                state.apiStatus.BatchesData.success = false;
                state.apiStatus.BatchesData.error = action.payload as string || "Failed to update Batch";
            });

        builder
            .addCase(deleteBatch.pending, (state) => {
                state.apiStatus.BatchesData.loading = true;
                state.apiStatus.BatchesData.success = false;
                state.apiStatus.BatchesData.error = null;
            })
            .addCase(deleteBatch.fulfilled, (state) => {
                state.apiStatus.BatchesData.loading = false;
                state.apiStatus.BatchesData.success = true;
                state.apiStatus.BatchesData.error = null;
            })
            .addCase(deleteBatch.rejected, (state, action) => {
                state.apiStatus.BatchesData.loading = false;
                state.apiStatus.BatchesData.success = false;
                state.apiStatus.BatchesData.error = action.payload as string || "Failed to delete Batch";
            });

        builder
            .addCase(getStudyMaterials.pending, (state) => {
                state.apiStatus.StudyMaterialsData.loading = true;
                state.apiStatus.StudyMaterialsData.success = false;
                state.apiStatus.StudyMaterialsData.error = null;
            })
            .addCase(getStudyMaterials.fulfilled, (state, action) => {
                state.StudyMaterialsData = action.payload;
                state.apiStatus.StudyMaterialsData.loading = false;
                state.apiStatus.StudyMaterialsData.success = true;
                state.apiStatus.StudyMaterialsData.error = null;
            })
            .addCase(getStudyMaterials.rejected, (state, action) => {
                state.apiStatus.StudyMaterialsData.loading = false;
                state.apiStatus.StudyMaterialsData.success = false;
                state.apiStatus.StudyMaterialsData.error = action.payload as string || "Failed to fetch Study Materials";
            });

        builder
            .addCase(createStudyMaterial.pending, (state) => {
                state.apiStatus.StudyMaterialsData.loading = true;
                state.apiStatus.StudyMaterialsData.success = false;
                state.apiStatus.StudyMaterialsData.error = null;
            })
            .addCase(createStudyMaterial.fulfilled, (state) => {
                state.apiStatus.StudyMaterialsData.loading = false;
                state.apiStatus.StudyMaterialsData.success = true;
                state.apiStatus.StudyMaterialsData.error = null;
            })
            .addCase(createStudyMaterial.rejected, (state, action) => {
                state.apiStatus.StudyMaterialsData.loading = false;
                state.apiStatus.StudyMaterialsData.success = false;
                state.apiStatus.StudyMaterialsData.error = action.payload as string || "Failed to create Study Material";
            });

        builder
            .addCase(updateStudyMaterial.pending, (state) => {
                state.apiStatus.StudyMaterialsData.loading = true;
                state.apiStatus.StudyMaterialsData.success = false;
                state.apiStatus.StudyMaterialsData.error = null;
            })
            .addCase(updateStudyMaterial.fulfilled, (state) => {
                state.apiStatus.StudyMaterialsData.loading = false;
                state.apiStatus.StudyMaterialsData.success = true;
                state.apiStatus.StudyMaterialsData.error = null;
            })
            .addCase(updateStudyMaterial.rejected, (state, action) => {
                state.apiStatus.StudyMaterialsData.loading = false;
                state.apiStatus.StudyMaterialsData.success = false;
                state.apiStatus.StudyMaterialsData.error = action.payload as string || "Failed to update Study Material";
            });

        builder
            .addCase(deleteStudyMaterial.pending, (state) => {
                state.apiStatus.StudyMaterialsData.loading = true;
                state.apiStatus.StudyMaterialsData.success = false;
                state.apiStatus.StudyMaterialsData.error = null;
            })
            .addCase(deleteStudyMaterial.fulfilled, (state) => {
                state.apiStatus.StudyMaterialsData.loading = false;
                state.apiStatus.StudyMaterialsData.success = true;
                state.apiStatus.StudyMaterialsData.error = null;
            })
            .addCase(deleteStudyMaterial.rejected, (state, action) => {
                state.apiStatus.StudyMaterialsData.loading = false;
                state.apiStatus.StudyMaterialsData.success = false;
                state.apiStatus.StudyMaterialsData.error = action.payload as string || "Failed to delete Study Material";
            });

        builder
            .addCase(getVideoMaterials.pending, (state) => {
                state.apiStatus.VideoMaterialsData.loading = true;
                state.apiStatus.VideoMaterialsData.success = false;
                state.apiStatus.VideoMaterialsData.error = null;
            })
            .addCase(getVideoMaterials.fulfilled, (state, action) => {
                state.VideoMaterialsData = action.payload;
                state.apiStatus.VideoMaterialsData.loading = false;
                state.apiStatus.VideoMaterialsData.success = true;
                state.apiStatus.VideoMaterialsData.error = null;
            })
            .addCase(getVideoMaterials.rejected, (state, action) => {
                state.apiStatus.VideoMaterialsData.loading = false;
                state.apiStatus.VideoMaterialsData.success = false;
                state.apiStatus.VideoMaterialsData.error = action.payload as string || "Failed to fetch Video Materials";
            });

        builder
            .addCase(createVideoMaterial.pending, (state) => {
                state.apiStatus.VideoMaterialsData.loading = true;
                state.apiStatus.VideoMaterialsData.success = false;
                state.apiStatus.VideoMaterialsData.error = null;
            })
            .addCase(createVideoMaterial.fulfilled, (state) => {
                state.apiStatus.VideoMaterialsData.loading = false;
                state.apiStatus.VideoMaterialsData.success = true;
                state.apiStatus.VideoMaterialsData.error = null;
            })
            .addCase(createVideoMaterial.rejected, (state, action) => {
                state.apiStatus.VideoMaterialsData.loading = false;
                state.apiStatus.VideoMaterialsData.success = false;
                state.apiStatus.VideoMaterialsData.error = action.payload as string || "Failed to create Video Material";
            });

        builder
            .addCase(updateVideoMaterial.pending, (state) => {
                state.apiStatus.VideoMaterialsData.loading = true;
                state.apiStatus.VideoMaterialsData.success = false;
                state.apiStatus.VideoMaterialsData.error = null;
            })
            .addCase(updateVideoMaterial.fulfilled, (state) => {
                state.apiStatus.VideoMaterialsData.loading = false;
                state.apiStatus.VideoMaterialsData.success = true;
                state.apiStatus.VideoMaterialsData.error = null;
            })
            .addCase(updateVideoMaterial.rejected, (state, action) => {
                state.apiStatus.VideoMaterialsData.loading = false;
                state.apiStatus.VideoMaterialsData.success = false;
                state.apiStatus.VideoMaterialsData.error = action.payload as string || "Failed to update Video Material";
            });

        builder
            .addCase(deleteVideoMaterial.pending, (state) => {
                state.apiStatus.VideoMaterialsData.loading = true;
                state.apiStatus.VideoMaterialsData.success = false;
                state.apiStatus.VideoMaterialsData.error = null;
            })
            .addCase(deleteVideoMaterial.fulfilled, (state) => {
                state.apiStatus.VideoMaterialsData.loading = false;
                state.apiStatus.VideoMaterialsData.success = true;
                state.apiStatus.VideoMaterialsData.error = null;
            })
            .addCase(deleteVideoMaterial.rejected, (state, action) => {
                state.apiStatus.VideoMaterialsData.loading = false;
                state.apiStatus.VideoMaterialsData.success = false;
                state.apiStatus.VideoMaterialsData.error = action.payload as string || "Failed to delete Video Material";
            });

        builder
            .addCase(getDashboardCounts.pending, (state) => {
                state.loading = true;
                state.apiStatus.DashboardCountsData.loading = true;
                state.apiStatus.DashboardCountsData.success = false;
                state.apiStatus.DashboardCountsData.error = null;
                state.error = null;
            })
            .addCase(getDashboardCounts.fulfilled, (state, action) => {
                state.loading = false;
                state.DashboardCountsData = action.payload;
                state.apiStatus.DashboardCountsData.loading = false;
                state.apiStatus.DashboardCountsData.success = true;
                state.apiStatus.DashboardCountsData.error = null;
            })
            .addCase(getDashboardCounts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string || "Failed to fetch Dashboard counts";
                state.apiStatus.DashboardCountsData.loading = false;
                state.apiStatus.DashboardCountsData.success = false;
                state.apiStatus.DashboardCountsData.error = action.payload as string || "Failed to fetch Dashboard counts";
            });

        builder
            .addCase(getQuizzes.pending, (state) => {
                state.apiStatus.QuizzesData.loading = true;
                state.apiStatus.QuizzesData.success = false;
                state.apiStatus.QuizzesData.error = null;
            })
            .addCase(getQuizzes.fulfilled, (state, action) => {
                state.QuizzesData = action.payload;
                state.apiStatus.QuizzesData.loading = false;
                state.apiStatus.QuizzesData.success = true;
                state.apiStatus.QuizzesData.error = null;
            })
            .addCase(getQuizzes.rejected, (state, action) => {
                state.apiStatus.QuizzesData.loading = false;
                state.apiStatus.QuizzesData.success = false;
                state.apiStatus.QuizzesData.error = action.payload as string || "Failed to fetch Quizzes";
            });

        builder
            .addCase(getQuizById.pending, (state) => {
                state.apiStatus.QuizDetailData.loading = true;
                state.apiStatus.QuizDetailData.success = false;
                state.apiStatus.QuizDetailData.error = null;
            })
            .addCase(getQuizById.fulfilled, (state, action) => {
                state.QuizDetailData = action.payload;
                state.apiStatus.QuizDetailData.loading = false;
                state.apiStatus.QuizDetailData.success = true;
                state.apiStatus.QuizDetailData.error = null;
            })
            .addCase(getQuizById.rejected, (state, action) => {
                state.apiStatus.QuizDetailData.loading = false;
                state.apiStatus.QuizDetailData.success = false;
                state.apiStatus.QuizDetailData.error = action.payload as string || "Failed to fetch Quiz details";
            });

        builder
            .addCase(createQuiz.pending, (state) => {
                state.apiStatus.QuizzesData.loading = true;
                state.apiStatus.QuizzesData.success = false;
                state.apiStatus.QuizzesData.error = null;
            })
            .addCase(createQuiz.fulfilled, (state) => {
                state.apiStatus.QuizzesData.loading = false;
                state.apiStatus.QuizzesData.success = true;
                state.apiStatus.QuizzesData.error = null;
            })
            .addCase(createQuiz.rejected, (state, action) => {
                state.apiStatus.QuizzesData.loading = false;
                state.apiStatus.QuizzesData.success = false;
                state.apiStatus.QuizzesData.error = action.payload as string || "Failed to create Quiz";
            });

        builder
            .addCase(updateQuiz.pending, (state) => {
                state.apiStatus.QuizzesData.loading = true;
                state.apiStatus.QuizzesData.success = false;
                state.apiStatus.QuizzesData.error = null;
            })
            .addCase(updateQuiz.fulfilled, (state) => {
                state.apiStatus.QuizzesData.loading = false;
                state.apiStatus.QuizzesData.success = true;
                state.apiStatus.QuizzesData.error = null;
            })
            .addCase(updateQuiz.rejected, (state, action) => {
                state.apiStatus.QuizzesData.loading = false;
                state.apiStatus.QuizzesData.success = false;
                state.apiStatus.QuizzesData.error = action.payload as string || "Failed to update Quiz";
            });

        builder
            .addCase(deleteQuiz.pending, (state) => {
                state.apiStatus.QuizzesData.loading = true;
                state.apiStatus.QuizzesData.success = false;
                state.apiStatus.QuizzesData.error = null;
            })
            .addCase(deleteQuiz.fulfilled, (state) => {
                state.apiStatus.QuizzesData.loading = false;
                state.apiStatus.QuizzesData.success = true;
                state.apiStatus.QuizzesData.error = null;
            })
            .addCase(deleteQuiz.rejected, (state, action) => {
                state.apiStatus.QuizzesData.loading = false;
                state.apiStatus.QuizzesData.success = false;
                state.apiStatus.QuizzesData.error = action.payload as string || "Failed to delete Quiz";
            });

        builder
            .addCase(publishQuiz.pending, (state) => {
                state.apiStatus.QuizzesData.loading = true;
                state.apiStatus.QuizzesData.success = false;
                state.apiStatus.QuizzesData.error = null;
            })
            .addCase(publishQuiz.fulfilled, (state) => {
                state.apiStatus.QuizzesData.loading = false;
                state.apiStatus.QuizzesData.success = true;
                state.apiStatus.QuizzesData.error = null;
            })
            .addCase(publishQuiz.rejected, (state, action) => {
                state.apiStatus.QuizzesData.loading = false;
                state.apiStatus.QuizzesData.success = false;
                state.apiStatus.QuizzesData.error = action.payload as string || "Failed to publish Quiz";
            });

        builder
            .addCase(copyQuiz.pending, (state) => {
                state.apiStatus.QuizzesData.loading = true;
                state.apiStatus.QuizzesData.success = false;
                state.apiStatus.QuizzesData.error = null;
            })
            .addCase(copyQuiz.fulfilled, (state) => {
                state.apiStatus.QuizzesData.loading = false;
                state.apiStatus.QuizzesData.success = true;
                state.apiStatus.QuizzesData.error = null;
            })
            .addCase(copyQuiz.rejected, (state, action) => {
                state.apiStatus.QuizzesData.loading = false;
                state.apiStatus.QuizzesData.success = false;
                state.apiStatus.QuizzesData.error = action.payload as string || "Failed to copy Quiz";
            });

        builder
            .addCase(getQuizRankList.pending, (state) => {
                state.apiStatus.QuizRankListData.loading = true;
                state.apiStatus.QuizRankListData.success = false;
                state.apiStatus.QuizRankListData.error = null;
            })
            .addCase(getQuizRankList.fulfilled, (state, action) => {
                state.QuizRankListData = action.payload;
                state.apiStatus.QuizRankListData.loading = false;
                state.apiStatus.QuizRankListData.success = true;
                state.apiStatus.QuizRankListData.error = null;
            })
            .addCase(getQuizRankList.rejected, (state, action) => {
                state.apiStatus.QuizRankListData.loading = false;
                state.apiStatus.QuizRankListData.success = false;
                state.apiStatus.QuizRankListData.error = action.payload as string || "Failed to fetch rank list";
            });

        builder
            .addCase(getNotifications.pending, (state) => {
                state.apiStatus.NotificationsData.loading = true;
                state.apiStatus.NotificationsData.success = false;
                state.apiStatus.NotificationsData.error = null;
            })
            .addCase(getNotifications.fulfilled, (state, action) => {
                state.NotificationsData = action.payload;
                state.apiStatus.NotificationsData.loading = false;
                state.apiStatus.NotificationsData.success = true;
                state.apiStatus.NotificationsData.error = null;
            })
            .addCase(getNotifications.rejected, (state, action) => {
                state.apiStatus.NotificationsData.loading = false;
                state.apiStatus.NotificationsData.success = false;
                state.apiStatus.NotificationsData.error = action.payload as string || "Failed to fetch Notifications";
            });

        builder
            .addCase(createNotification.pending, (state) => {
                state.apiStatus.NotificationsData.loading = true;
                state.apiStatus.NotificationsData.success = false;
                state.apiStatus.NotificationsData.error = null;
            })
            .addCase(createNotification.fulfilled, (state) => {
                state.apiStatus.NotificationsData.loading = false;
                state.apiStatus.NotificationsData.success = true;
                state.apiStatus.NotificationsData.error = null;
            })
            .addCase(createNotification.rejected, (state, action) => {
                state.apiStatus.NotificationsData.loading = false;
                state.apiStatus.NotificationsData.success = false;
                state.apiStatus.NotificationsData.error = action.payload as string || "Failed to create Notification";
            });

        builder
            .addCase(updateNotification.pending, (state) => {
                state.apiStatus.NotificationsData.loading = true;
                state.apiStatus.NotificationsData.success = false;
                state.apiStatus.NotificationsData.error = null;
            })
            .addCase(updateNotification.fulfilled, (state) => {
                state.apiStatus.NotificationsData.loading = false;
                state.apiStatus.NotificationsData.success = true;
                state.apiStatus.NotificationsData.error = null;
            })
            .addCase(updateNotification.rejected, (state, action) => {
                state.apiStatus.NotificationsData.loading = false;
                state.apiStatus.NotificationsData.success = false;
                state.apiStatus.NotificationsData.error = action.payload as string || "Failed to update Notification";
            });

        builder
            .addCase(deleteNotification.pending, (state) => {
                state.apiStatus.NotificationsData.loading = true;
                state.apiStatus.NotificationsData.success = false;
                state.apiStatus.NotificationsData.error = null;
            })
            .addCase(deleteNotification.fulfilled, (state) => {
                state.apiStatus.NotificationsData.loading = false;
                state.apiStatus.NotificationsData.success = true;
                state.apiStatus.NotificationsData.error = null;
            })
            .addCase(deleteNotification.rejected, (state, action) => {
                state.apiStatus.NotificationsData.loading = false;
                state.apiStatus.NotificationsData.success = false;
                state.apiStatus.NotificationsData.error = action.payload as string || "Failed to delete Notification";
            });
    },
});

export const { resetSSLogin, clearError, logout } = LearningSlice.actions;
export default LearningSlice.reducer;