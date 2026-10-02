import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../services/Store';
import { getCourses } from '../../services/LearningAction';
import type { CourseRecord } from '../Course/Constant';
import { MATERIAL_SEARCH_INPUT_FIELDS } from './Constants';
import { MATERIAL_FILTER_FIELDS } from '../../utils/filterUtils';

// Sentinel for the course dropdown's "All" option — never sent to the API as-is (translated to '' at the call site)
export const ALL_COURSES_VALUE = 'all';

export const useMaterialManagement = () => {
    const dispatch = useDispatch();
    const [searchValue, setSearchValue] = useState('');
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({});
    const [selectedCourseId, setSelectedCourseId] = useState(ALL_COURSES_VALUE);
    const activeFilterCount = Object.values(appliedFilters).filter(value => value && value.trim() !== '').length;

    const { CoursesData } = useSelector((state: RootState) => state.learning);
    const coursesArray = Array.isArray(CoursesData) ? (CoursesData as CourseRecord[]) : [];
    const courseOptions = [
        { value: ALL_COURSES_VALUE, label: 'All Course' },
        ...coursesArray.map(course => ({ value: course.id, label: course.courseName })),
    ];

    useEffect(() => {
        dispatch(getCourses() as any);
    }, [dispatch]);

    const handleSearchChange = (_name: string, value: string) => {
        setSearchValue(value);
    };

    const handleCourseChange = (value: string | string[]) => {
        const stringValue = Array.isArray(value) ? value[0] || ALL_COURSES_VALUE : value;
        setSelectedCourseId(stringValue || ALL_COURSES_VALUE);
    };

    const toggleFilterDropdown = () => {
        setIsFilterDropdownOpen(prev => !prev);
    };

    const closeFilterModal = () => {
        setIsFilterDropdownOpen(false);
    };

    const handleApplyFilters = (filters: Record<string, string>) => {
        setAppliedFilters(filters);
    };

    const handleResetFilters = () => {
        setAppliedFilters({});
    };

    return {
        searchField: MATERIAL_SEARCH_INPUT_FIELDS,
        searchValue,
        activeFilterCount,
        isFilterDropdownOpen,
        filterField: MATERIAL_FILTER_FIELDS,
        appliedFilters,
        courseOptions,
        selectedCourseId,
        handleCourseChange,
        handleSearchChange,
        toggleFilterDropdown,
        closeFilterModal,
        handleApplyFilters,
        handleResetFilters,
    };
};
