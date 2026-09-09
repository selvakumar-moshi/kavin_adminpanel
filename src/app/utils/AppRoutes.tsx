import { createBrowserRouter, Navigate } from 'react-router-dom';
import Dashboard from '../../pages/Dashboard/Dashboard';
import Login from '../../pages/Login/Login';
import LayoutContainter from '../layouts/LayoutContainter';
import Users from '../../pages/Users/Users';
import UserDetail from '../../pages/UserDetail/UserDetail';
import Material from '../../pages/StudyMaterial/Material';
import Course from '../../pages/Course/Course';
import CourseDetail from '../../pages/Course/CourseDetail';
import Quiz from '../../pages/Quiz/Quiz';
import QuestionDetail from '../../pages/Quiz/QuestionDetail';

const ProtectedLayout = () => {
  return <LayoutContainter />;
};

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    element: <ProtectedLayout />,
    children: [
      {
        path: "/",
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "/dashboard",
        element: <Dashboard />,
      },
      {
        path: "/users",
        element: <Users />,
      },
      {
        path: "/user/:id",
        element: <UserDetail />,
      },
      {
        path: "/studymaterial",
        element: <Material />,
      },
      {
        path: "/course",
        element: <Course />,
      },
      {
        path: "/course/:id",
        element: <CourseDetail />,
      },
      // {
      //   path: "/financial",
      //   element: <FinancialYear />,
      // },
      {
        path: "/quiz",
        element: <Quiz />,
      },
      {
        path: "/quiz/create",
        element: <QuestionDetail />,
      },
      {
        path: "/quiz/:id",
        element: <QuestionDetail />,
      },
      // {
      //   path: "/industry",
      //   element: <Industry />,
      // },
    ],
  },
]);

export default router;