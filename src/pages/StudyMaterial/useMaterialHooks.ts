import { useState } from 'react';
import { MATERIAL_SEARCH_INPUT_FIELDS } from './Constants';
import { MATERIAL_FILTER_FIELDS } from '../../utils/filterUtils';

export const useMaterialManagement = () => {
    const [searchValue, setSearchValue] = useState('');
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({});
    const activeFilterCount = Object.values(appliedFilters).filter(value => value && value.trim() !== '').length;

    const handleSearchChange = (_name: string, value: string) => {
        setSearchValue(value);
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
        handleSearchChange,
        toggleFilterDropdown,
        closeFilterModal,
        handleApplyFilters,
        handleResetFilters,
    };
};
