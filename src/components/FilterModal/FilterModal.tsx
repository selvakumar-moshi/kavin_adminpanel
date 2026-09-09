import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import InputFields, { type InputField } from '../InputFields/InputFields';
import DateFieldsSection, { type DateField } from '../DateFieldsSection/DateFieldsSection';

export interface FilterField {
  name: string;
  label: string;
  placeholder: string;
  type?: 'text' | 'date';
  required?: boolean;
  displayOrder?: number;
}

interface FilterProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Record<string, any>) => void;
  onReset: () => void;
  columns: Array<{ 
    key: string; 
    title: string; 
    searchType?: string;
    displayOrder?: number;
  }>;
  initialValues?: Record<string, any>;
}

const FilterModal: React.FC<FilterProps> = ({
  visible,
  onClose,
  onApply,
  onReset,
  columns,
  initialValues = {}
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [hasValues, setHasValues] = useState(false);

  const hasNonEmptyFilterValue = (values: Record<string, any>) =>
    Object.values(values).some((val) => {
      if (val === null || val === undefined) return false;
      if (typeof val === 'string') return val.trim() !== '';
      if (typeof val === 'object' && val !== null) return true;
      return false;
    });

  const hasAppliedFilters = useMemo(
    () => hasNonEmptyFilterValue(initialValues),
    [initialValues]
  );

  // Sort columns by displayOrder
  const sortedColumns = useMemo(() => {
    return [...columns].sort((a, b) => {
      // If both have displayOrder, sort by it
      if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
        return a.displayOrder - b.displayOrder;
      }
      // If only one has displayOrder, prioritize the one with displayOrder
      if (a.displayOrder !== undefined) return -1;
      if (b.displayOrder !== undefined) return 1;
      // If neither has displayOrder, maintain original order
      return 0;
    });
  }, [columns]);

  // Initialize form values when modal becomes visible
  useEffect(() => {
    if (visible) {
      const initialFormValues: Record<string, any> = {};
      sortedColumns.forEach(field => {
        initialFormValues[field.key] = initialValues[field.key] !== undefined 
          ? initialValues[field.key] 
          : (field.searchType === 'date' ? null : '');
      });
      setFormValues(initialFormValues);
      
      setHasValues(hasNonEmptyFilterValue(initialFormValues));
    }
  }, [sortedColumns, visible, initialValues]);

  // Close dropdown when clicking outside
  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
  //       onClose();
  //     }
  //   };

  //   if (visible) {
  //     document.addEventListener('mousedown', handleClickOutside);
  //   }

  //   return () => {
  //     document.removeEventListener('mousedown', handleClickOutside);
  //   };
  // }, [visible, onClose]);

  const handleInputChange = (name: string, value: string) => {
    const newValues = {
      ...formValues,
      [name]: value
    };
    
    setFormValues(newValues);
    checkHasValues(newValues);
  };

  const handleDateChange = (name: string, date: any) => {
    const newValues = {
      ...formValues,
      [name]: date
    };
    
    setFormValues(newValues);
    checkHasValues(newValues);
  };

  const checkHasValues = (values: Record<string, any>) => {
    setHasValues(hasNonEmptyFilterValue(values));
  };

  const handleApply = () => {
    const formattedValues: Record<string, any> = {};
    
    Object.entries(formValues).forEach(([key, value]) => {
      if (value) {
        if (value && typeof value === 'object' && 'format' in value) {
          formattedValues[key] = value.format('YYYY-MM-DD');
        } else {
          formattedValues[key] = value;
        }
      }
    });
    
    onApply(formattedValues);
    onClose();
  };

  const handleReset = () => {
    const resetValues: Record<string, any> = {};
    sortedColumns.forEach(field => {
      resetValues[field.key] = field.searchType === 'date' ? null : '';
    });
    setFormValues(resetValues);
    setHasValues(false);
    onReset();
  };

  // Generate all fields in the correct order
  const renderFieldsInOrder = () => {
    return sortedColumns.map((field) => {
      if (field.searchType === 'date') {
        // Render date field
        const dateFieldConfig: DateField = {
          name: field.key,
          label: field.title,
          placeholder: `Select ${field.title}`,
          disabled: false,
        };
        
        return (
          <DateFieldsSection
            key={field.key}
            fields={[dateFieldConfig]}
            className="filter-modal-date-fields"
            onChange={handleDateChange}
            values={formValues}
          />
        );
      } else {
        // Render text field
        const inputField: InputField = {
          name: field.key,
          label: field.title,
          placeholder: `Enter ${field.title}`,
          type: 'text' as const,
          rules: [],
        };
        
        return (
          <InputFields 
            key={field.key}
            fields={[inputField]}
            className="filter-modal-input-fields"
            onChange={handleInputChange}
            values={formValues}
          />
        );
      }
    });
  };

  const canApplyOrClear = hasValues || hasAppliedFilters;

  if (!visible) return null;

  return (
    <div className="filter-modal" ref={dropdownRef}>
      <div className="filter-modal__header">
        <button type="button" className="filter-modal__close" onClick={onClose} aria-label="Close" data-testid="filter-modal-close">
          <CloseOutlined />
        </button>
      </div>
      <div className="filter-modal__content">
        <div className="filter-modal__fields">
          {renderFieldsInOrder()}
        </div>

        <div className="filter-modal__actions">
          <Button 
            onClick={handleReset} 
            size="small" 
            className="filter-modal__reset-btn"
            disabled={!canApplyOrClear}
          > 
            Clear All 
          </Button>
          <Button 
            onClick={handleApply} 
            type="primary" 
            size="small" 
            className='filter-modal__search-btn'
            disabled={!canApplyOrClear}
          > 
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;