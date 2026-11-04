import { useState } from 'react';
import { Badge } from 'antd';
import TabsComponent from '../../components/Tabs/Tabs';
import PageTitle from '../../components/PageTitle';
import InputFields from '../../components/InputFields/InputFields';
import DropdownField from '../../components/DropdownField/DropdownField';
import FilterModal from '../../components/FilterModal/FilterModal';
import StudyMaterial from './StudyMaterial';
import VideoMaterial from './VideoMaterial';
import SyllabusMaterial from './SyllabusMaterial';
import { useMaterialManagement, ALL_COURSES_VALUE } from './useMaterialHooks';
import filter_Icon from '../../assets/filter_Icon.svg';
import { MATERIAL_TAB_ITEMS, SYLLABUS_MATERIAL_TAB_KEY } from './Constants';

const Material = () => {
    const [activeTab, setActiveTab] = useState('study');

    const {
        searchField,
        searchValue,
        activeFilterCount,
        isFilterDropdownOpen,
        filterField,
        appliedFilters,
        courseOptions,
        selectedCourseId,
        handleCourseChange,
        handleSearchChange,
        toggleFilterDropdown,
        closeFilterModal,
        handleApplyFilters,
        handleResetFilters,
    } = useMaterialManagement();

    // "All" is a UI-only sentinel — the API only ever sees an actual courseId or nothing
    const courseIdFilter = selectedCourseId === ALL_COURSES_VALUE ? '' : selectedCourseId;
    const isSyllabusTab = activeTab === SYLLABUS_MATERIAL_TAB_KEY;

    return (
        <div className="material-container">
            <div className="report_main">
                <PageTitle title="Materials" />
                <>
                    {activeTab === 'study' && <StudyMaterial searchTerm={searchValue} appliedFilters={appliedFilters} courseId={courseIdFilter} />}
                    {activeTab === 'video' && <VideoMaterial searchTerm={searchValue} appliedFilters={appliedFilters} courseId={courseIdFilter} />}
                    {activeTab === SYLLABUS_MATERIAL_TAB_KEY && <SyllabusMaterial searchTerm={searchValue} />}
                </>
            </div>

            <div className='report_main'>
                <TabsComponent items={MATERIAL_TAB_ITEMS} activeKey={activeTab} onChange={setActiveTab} />
                <div className="dl_filter_main">
                    {/* Syllabus material belongs to a folder, not a course, and its search has no filter fields */}
                    {!isSyllabusTab && (
                    <DropdownField
                        className="material-course-filter"
                        fields={[
                            {
                                name: 'courseId',
                                label: '',
                                placeholder: 'Select course',
                                options: courseOptions,
                            },
                        ]}
                        values={{ courseId: selectedCourseId }}
                        onChange={(_, value) => handleCourseChange(value)}
                    />
                    )}
                    <InputFields
                        fields={searchField.map(field => ({ ...field }))}
                        onChange={handleSearchChange}
                        values={{ search: searchValue }}
                    />
                    {!isSyllabusTab && (
                    <Badge count={activeFilterCount} size="small" color="#dc1132">
                        <div className="dl_filter_main__filter_icon" onClick={toggleFilterDropdown} data-testid="filter-icon">
                            <img src={filter_Icon} alt="filter" />
                        </div>
                    </Badge>
                    )}
                </div>
            </div>


            {/* Filter Modal */}
            <FilterModal
                visible={isFilterDropdownOpen}
                onClose={closeFilterModal}
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
                columns={filterField}
                initialValues={appliedFilters}
            />
        </div>
    );
};

export default Material;
