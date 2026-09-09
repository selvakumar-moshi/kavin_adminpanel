import React, { useCallback, useEffect, useRef } from 'react';
import { Checkbox as AntCheckbox } from 'antd';

export interface CheckboxProps {
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  count?: number;
  className?: string;
  required?: boolean;
  hasError?: boolean;
  "data-testid"?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked = false,
  onChange,
  disabled = false,
  count,
  className = '',
  required = false,
  // hasError = false,
  "data-testid": dataTestId,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const applyInputTestId = useCallback(() => {
    if (!dataTestId || !wrapperRef.current) {
      return;
    }
    const input = wrapperRef.current.querySelector<HTMLInputElement>(
      'input.ant-checkbox-input'
    );
    if (input) {
      input.dataset.testid = `checkbox-input-${dataTestId}`;
    }
  }, [dataTestId]);

  useEffect(() => {
    const timeoutId = setTimeout(applyInputTestId, 0);
    return () => clearTimeout(timeoutId);
  }, [applyInputTestId, checked, disabled]);

  return (
    <div ref={wrapperRef} className={`checkbox-wrapper ${className}`} data-testid={dataTestId}>
      <AntCheckbox
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        disabled={disabled}
      >
        <span className={`checkbox-label ${required ? 'required-field' : ''}`}>
          {label}
          {required && <span className="form-fields-section__required">*</span>}
        </span>
        {count !== undefined && (
          <span className="checkbox-count">({count})</span>
        )}
      </AntCheckbox>
    </div>
  );
};

export default Checkbox;