import { RouterProvider } from 'react-router-dom';
import router from './utils/AppRoutes';

function App() {
  return <RouterProvider router={router} />;
}

export default App;