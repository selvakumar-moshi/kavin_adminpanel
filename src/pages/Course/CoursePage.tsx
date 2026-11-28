import { useState } from 'react';
import TabsComponent from '../../components/Tabs/Tabs';
import SyllabusWise from '../../components/SyllabusWise/SyllabusWise';
import Course from './Course';
import { COURSE_PAGE_TABS, COURSE_TAB_KEY, SYLLABUS_WISE_TAB_KEY } from './Constant';

// The Courses page: its courses, and the Syllabus Wise plans
const CoursePage = () => {
    const [activeTab, setActiveTab] = useState(COURSE_TAB_KEY);

    const pageTitle = COURSE_PAGE_TABS.find((tab) => tab.key === activeTab)?.title ?? '';
    const tabs = <TabsComponent items={COURSE_PAGE_TABS} activeKey={activeTab} onChange={setActiveTab} />;

    if (activeTab === SYLLABUS_WISE_TAB_KEY) return <SyllabusWise pageTitle={pageTitle} tabs={tabs} />;
    return <Course tabs={tabs} />;
};

export default CoursePage;
