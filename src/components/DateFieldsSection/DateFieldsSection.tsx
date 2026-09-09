import React from "react";
import { DatePicker } from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import dayjs from 'dayjs';

export interface DateField {
  name: string;
  label: string;
  placeholder: string;
  required?: boolean;
  rules?: any[];
  disabled?: boolean;
  disablePastDates?: boolean;
  allowPastDates?: boolean;
}

export interface DateFieldsSectionProps {
  fields: DateField[];
  className?: string;
  showTime?: boolean;
  format?: string;
  values?: Record<string, any>;
  onChange?: (name: string, value: any) => void;
  disabled?: boolean;
  /** When set, matching keys show error styling on the date picker (border). */
  errors?: Record<string, string>;
}

const DateFieldsSection: React.FC<DateFieldsSectionProps> = ({
  fields,
  className,
  showTime = false,
  format = 'YYYY-MM-DD',
  values = {},
  onChange,
  disabled = false,
  errors = {},
}) => {
  const handleDateChange = (name: string, date: any) => {
    onChange?.(name, date);
  };

  // Helper function to convert string date to dayjs object
  const getDateValue = (fieldName: string) => {
    const value = values[fieldName];
    if (!value) return null;
    
    // If it's already a dayjs object, return it
    if (dayjs.isDayjs(value)) return value;
    
    // If it's a string, convert to dayjs
    if (typeof value === 'string') {
      const date = dayjs(value);
      return date.isValid() ? date : null;
    }
    
    // If it's a Date object, convert to dayjs
    if (value instanceof Date) {
      return dayjs(value);
    }
    
    return null;
  };

  return (
    <div className={`date-fields-section ${className || ""}`}>
      <div className="date-fields-section__form">
        <div className="date-fields-section__fields-container">
          {fields.map((field) => {
            const hasError = Boolean(errors[field.name]);
            return (
              <div
                key={field.name}
                className="date-fields-section__field"
              >
                {field.label && (
                  <label className="date-fields-section__label">
                    {field.label}
                    {field.required && <span className="date-fields-section__required">*</span>}
                  </label>
                )}
                <DatePicker
                  data-testid={`date-picker-${field.name}`}
                  placeholder={field.placeholder}
                  className="date-fields-section__date-picker"
                  status={hasError ? "error" : undefined}
                  suffixIcon={<CalendarOutlined />}
                  showTime={showTime}
                  format={format}
                  value={getDateValue(field.name)}
                  onChange={(date) => handleDateChange(field.name, date)}
                  disabled={disabled || field.disabled}
                  disabledDate={(current) => {
                    if (!current) return false;
                    
                    // If disablePastDates is true, disable all past dates
                    if (field.disablePastDates === true) {
                      return current < dayjs().startOf("day");
                    }
                    
                    // If allowPastDates is explicitly true, don't disable any dates
                    if (field.allowPastDates === true) {
                      return false; // Allow all dates (past, present, future)
                    }
                    
                    // Default behavior - allow future dates only
                    return current < dayjs().startOf("day");
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DateFieldsSection;