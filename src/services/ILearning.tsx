export interface IinitialState {
    SSLoginData: any;
    RegisterData: any;
    UsersData: any;
    UserDetailData: any;
    EnrollmentStatusData: any;
    CoursesData: any;
    CourseDetailData: any;
    BatchesData: any;
    StudyMaterialsData: any;
    VideoMaterialsData: any;
    DashboardCountsData: any;
    QuizzesData: any;
    QuizDetailData: any;
    QuizRankListData: any;
    NotificationsData: any;
    loading: boolean;
    error: string | null;
    isAuthenticated: boolean;
    apiStatus: {
        [key: string]: {
            loading: boolean;
            success: boolean;
            error: string | null;
        }
    };
}

const storedToken = sessionStorage.getItem("token");
const storedUser = (() => {
    try {
        const raw = sessionStorage.getItem("user");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
})();

export const initialState: IinitialState = {
    SSLoginData: storedToken && storedUser ? { token: storedToken, user: storedUser } : [],
    RegisterData: [],
    UsersData: [],
    UserDetailData: null,
    EnrollmentStatusData: null,
    CoursesData: [],
    CourseDetailData: null,
    BatchesData: [],
    StudyMaterialsData: [],
    VideoMaterialsData: [],
    DashboardCountsData: null,
    QuizzesData: [],
    QuizDetailData: null,
    QuizRankListData: [],
    NotificationsData: [],
    loading: false,
    error: null,
    isAuthenticated: Boolean(storedToken && storedUser),
    apiStatus: {
        SSLoginData: { loading: false, success: false, error: null },
        RegisterData: { loading: false, success: false, error: null },
        UsersData: { loading: false, success: false, error: null },
        UserDetailData: { loading: false, success: false, error: null },
        EnrollmentStatusData: { loading: false, success: false, error: null },
        CoursesData: { loading: false, success: false, error: null },
        CourseDetailData: { loading: false, success: false, error: null },
        BatchesData: { loading: false, success: false, error: null },
        StudyMaterialsData: { loading: false, success: false, error: null },
        VideoMaterialsData: { loading: false, success: false, error: null },
        DashboardCountsData: { loading: false, success: false, error: null },
        QuizzesData: { loading: false, success: false, error: null },
        QuizDetailData: { loading: false, success: false, error: null },
        QuizRankListData: { loading: false, success: false, error: null },
        NotificationsData: { loading: false, success: false, error: null },
    },
}