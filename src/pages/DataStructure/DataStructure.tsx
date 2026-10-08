import { useRef, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import Button from '../../components/Button/Button';
import PageTitle from '../../components/PageTitle';
import TabsComponent from '../../components/Tabs/Tabs';
import BookTab, { type BookTabHandle } from '../../components/BooksStructure/BooksStructure';
import FolderTab from '../../components/FolderStructure/FolderStructure';
import { SCHOOL_BOOK_TAB_ITEMS, DEFAULT_SCHOOL_BOOK_TAB } from './Constant';

// Sidebar page: a title with the Add Subject button, and the Book / Folder tabs. Each tab's screen is its own component.
const SchoolBookRevision = () => {
    const [activeTab, setActiveTab] = useState(DEFAULT_SCHOOL_BOOK_TAB);
    const bookTabRef = useRef<BookTabHandle>(null);

    return (
        <div className="quiz-container">
            <div className="report_main">
                <PageTitle title="Data Structure" />
            </div>

            <div className="report_main">
                <TabsComponent items={SCHOOL_BOOK_TAB_ITEMS} activeKey={activeTab} onChange={setActiveTab} />
                {activeTab === 'book' && (
                    <Button icon={<PlusOutlined />} variant="primary" className="page-title__button" onClick={() => bookTabRef.current?.openAddSubject()}>
                        Add Subject
                    </Button>
                )}
            </div>

            {activeTab === 'book' && <BookTab ref={bookTabRef} />}
            {activeTab === 'folder' && <FolderTab />}
        </div>
    );
};

export default SchoolBookRevision;
