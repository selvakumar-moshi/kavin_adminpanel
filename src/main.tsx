import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import App from "./app/App";
import { Store } from './services/Store';
import 'antd/dist/reset.css';
import './index.css';
import './styles/Login.scss';
import './styles/Reports.scss';
import './styles/Sidebar.scss';
import './styles/Header.scss';
import './styles/Footer.scss';
import './styles/Button.scss';
import './styles/Table.scss';
import './styles/ActionIcons.scss';
import './styles/PopupModal.scss';
import './styles/InputFields.scss';
import './styles/DropdownField.scss';
import './styles/FileUploadDisplay.scss';
import './styles/FileUploadSection.scss';
import './styles/PageTitle.scss';
import './styles/Loader.scss';
import './styles/ToastMessages.scss';
import './styles/Industry.scss';
import './styles/user.scss';
import './styles/FilterModal.scss';
import './styles/Breadcrumbs.scss';
import './styles/Course.scss';
import './styles/Tabs.scss';
import './styles/DateFieldsSection.scss';
import './styles/StudyMaterial.scss';
import './styles/ColumnSearchModal.scss';
import './styles/Quiz.scss';
import './styles/StatusBadge.scss';
import './styles/Dashboard.scss';
import './styles/NoDataFound.scss';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <Provider store={Store}>
      <ConfigProvider>
        <App />
      </ConfigProvider>
    </Provider>
);