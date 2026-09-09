
import React, { useCallback, useEffect, useRef } from "react";
import { Select, Spin } from "antd";
import { LoadingOutlined, SearchOutlined } from "@ant-design/icons";

export interface DropdownOption {
  value: string;
  label: string;
  title?: string;
  disabled?: boolean;
  /** Small pill shown to the right of the label (e.g. "Purchased") without changing the searchable label text. */
  badge?: string;
}

export interface DropdownField {
  name: string;
  label: string;
  placeholder: string;
  required?: boolean;
  options: DropdownOption[];
  rules?: any[];
  onChange?: (value: string | string[]) => void;
  mode?: 'multiple' | 'tags';
  value?: string | string[];
  disabled?: boolean;
  loading?: boolean;
  showSearch?: boolean;
  filterOption?: boolean | ((input: string, option: any) => boolean);
  onSearch?: (value: string) => void;
  selectHoverTitle?: string;
  /** Shown in the dropdown when there are no options (replaces default “No data”). */
  noOptionsContent?: React.ReactNode;
   /** Custom test ID for the actual input element */
   inputTestId?: string;
}

export interface DropdownFieldProps {
  fields: DropdownField[];
  className?: string;
  values?: Record<string, string | string[]>;
  onChange?: (name: string, value: string | string[]) => void;
  /** When set, matching field names show error styling on the select (border). */
  errors?: Record<string, string>;
  "data-testid"?: string;
}

const DropdownField: React.FC<DropdownFieldProps> = ({
  fields,
  className,
  values = {},
  onChange,
  errors = {},
  "data-testid": dataTestId,
}) => {
  const fieldContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  const handleChange = (fieldName: string, value: string | string[]) => {
    onChange?.(fieldName, value);
    
    const field = fields.find(f => f.name === fieldName);
    field?.onChange?.(value);
  };

  // Default filter option function
  const defaultFilterOption = (input: string, option: any) => {
    return option?.children?.toLowerCase?.().indexOf(input.toLowerCase()) >= 0;
  };

  const applyInputTestIds = useCallback(() => {
    fields.forEach((field) => {
      const container = fieldContainerRefs.current[field.name];
      if (!container) {
        return;
      }
      const input = container.querySelector<HTMLInputElement>(
        "input.ant-select-selection-search-input"
      );
      if (input) {
        const testId = field.inputTestId || `dropdown-input-${field.name}`;
        input.setAttribute("data-testid", testId);
      }
    });
  }, [fields]);

  useEffect(() => {
    const timeoutId = setTimeout(applyInputTestIds, 0);
    return () => clearTimeout(timeoutId);
  }, [applyInputTestIds, values]);

  return (
    <div className={`dropdown-field ${className || ""}`} data-testid={dataTestId}>
      <div className={`dropdown-field__form dropdown-field__form`}>
        {fields.map((field) => {
          const hasError = Boolean(errors[field.name]);
          return (
          <div key={field.name} className="dropdown-field__field" 
          ref={(el) => {
            fieldContainerRefs.current[field.name] = el;
          }}
          data-testid={`dropdown-field-${field.name}`}>
            {field.label && (
              <label className="dropdown-field__label">
                {field.label}
                {field.required && <span className="form-fields-section__required">*</span>}
              </label>
            )}
            <Select
              placeholder={field.placeholder}
              title={field.selectHoverTitle}
              className={`dropdown-field__select${field.showSearch ? " dropdown-field__select--searchable" : ""}`}
              status={hasError ? "error" : undefined}
              prefix={
                field.showSearch ? (
                  <SearchOutlined
                    className="dropdown-field__search-prefix-icon"
                    aria-hidden
                  />
                ) : undefined
              }
              suffixIcon={
                field.loading ? (
                  <LoadingOutlined className="dropdown-field__dropdown-icon" spin />
                ) : (
                  <div className="dropdown-field__dropdown-icon">▼</div>
                )
              }
              notFoundContent={
                field.loading ? (
                  <div className="dropdown-field__dropdown-loading">
                    <Spin size="small" />
                  </div>
                ) : field.options.length === 0 && field.noOptionsContent != null ? (
                  field.noOptionsContent
                ) : undefined
              }
              mode={field.mode}
              value={
                values[field.name] !== undefined && values[field.name] !== ''
                  ? values[field.name]
                  : (field.mode === 'multiple' ? [] : undefined)
              }
              onChange={(value) => {
                handleChange(field.name, value);
              }}
              disabled={field.disabled}
              loading={field.loading}
              allowClear
              showSearch={field.showSearch}
              filterOption={field.showSearch ? (field.filterOption || defaultFilterOption) : false}
              onSearch={field.onSearch}
              optionFilterProp="children" 
            >
              {field.options.map((option) => (
                <Select.Option
                  key={option.value}
                  value={option.value}
                  title={option.title ?? ""}
                  disabled={option.disabled}
                  data-testid={`dropdown-option-${option.label}`}
                >
                  {option.badge ? (
                    <span className="dropdown-field__option">
                      <span className="dropdown-field__option-label">{option.label}</span>
                      <span className="dropdown-field__option-badge">{option.badge}</span>
                    </span>
                  ) : (
                    option.label
                  )}
                </Select.Option>
              ))}
            </Select>
          </div>
        );
        })}
      </div>
    </div>
  );
};

export default DropdownField;