import PageTitle from '../../components/PageTitle';
import FolderTab from '../../components/FolderStructure/FolderStructure';

// Sidebar page: manage the folder structure (folders, sub folders and the nested sub folders inside them)
const DataStructure = () => (
    <div className="quiz-container">
        <div className="report_main">
            <PageTitle title="Data Structure" />
        </div>

        <FolderTab />
    </div>
);

export default DataStructure;
