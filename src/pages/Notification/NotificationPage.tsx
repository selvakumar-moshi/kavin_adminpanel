import { useState } from 'react';
import TabsComponent from '../../components/Tabs/Tabs';
import Notification from './Notification';
import SyllabusWise from '../../components/SyllabusWise/SyllabusWise';
import { NOTIFICATION_PAGE_TABS, NOTIFICATION_TAB_KEY, SYLLABUS_WISE_TAB_KEY } from './Constant';

const NotificationPage = () => {
    const [activeTab, setActiveTab] = useState(NOTIFICATION_TAB_KEY);

    const pageTitle = NOTIFICATION_PAGE_TABS.find((tab) => tab.key === activeTab)?.title ?? '';
    const tabs = <TabsComponent items={NOTIFICATION_PAGE_TABS} activeKey={activeTab} onChange={setActiveTab} />;

    return activeTab === SYLLABUS_WISE_TAB_KEY
        ? <SyllabusWise pageTitle={pageTitle} tabs={tabs} />
        : <Notification pageTitle={pageTitle} tabs={tabs} />;
};

export default NotificationPage;
