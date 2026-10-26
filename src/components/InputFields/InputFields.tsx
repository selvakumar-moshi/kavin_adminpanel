import React from "react";
import { Input } from "antd";

export interface InputField {
  name: string;
  label: string;
  placeholder: string;
  required?: boolean;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea';
  rules?: any[];
  search?: boolean;
  prefix?: React.ReactNode;
  maxLength?: number;
  onBlur?: () => void;
  disabled?: boolean;
  status?: "error" | "success" | "warning" | "info" | "default";
  visibilityToggle?: boolean;
  /** Keeps a plain text field as a normal single-line input (by default text fields wrap onto the next line). */
  singleLine?: boolean;
  /** Small helper text shown under the input (e.g. "eg: https://..."). */
  hint?: string;
}

export interface InputFieldsProps {
  fields: InputField[];
  className?: string;
  onChange?: (name: string, value: string) => void;
  values?: Record<string, string>;
  errors?: Record<string, string>;
  disabled?: boolean;
}

interface CommonInputProps {
  placeholder: string;
  status: "error" | undefined;
  className: string;
  prefix?: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  disabled: boolean;
  readOnly: boolean;
  'data-testid': string;
}

// Plain text fields wrap; search boxes, prefixed inputs and email / number / password stay single-line
const isWrappingTextField = (field: InputField) =>
  (field.type === undefined || field.type === 'text') && !field.search && !field.prefix && !field.singleLine;

const renderFieldControl = (
  field: InputField,
  isTextareaField: boolean,
  isPasswordField: boolean,
  commonInputProps: CommonInputProps,
  onValueChange: (value: string) => void
) => {
  if (isTextareaField) {
    // Textareas have no length limit
    const { prefix: _prefix, ...textareaProps } = commonInputProps;
    return <Input.TextArea {...textareaProps} rows={4} />;
  }
  if (isPasswordField) {
    return (
      <Input.Password
        {...commonInputProps}
        visibilityToggle={field.visibilityToggle !== false}
      />
    );
  }
  if (isWrappingTextField(field)) {
    // A single-line value that wraps onto the next line (the box grows downwards) instead of scrolling sideways
    const { prefix: _prefix, ...textareaProps } = commonInputProps;
    return (
      <Input.TextArea
        {...textareaProps}
        className={`${textareaProps.className} form-fields-section__input--wrap`}
        autoSize={{ minRows: 1 }}
        maxLength={field.maxLength}
        onPressEnter={(event) => event.preventDefault()}
        onChange={(event) => onValueChange(event.target.value.split(/\s*\n+\s*/).join(' '))}
      />
    );
  }
  return <Input {...commonInputProps} type={field.type || 'text'} maxLength={field.maxLength} />;
};

const InputFields: React.FC<InputFieldsProps> = ({
  fields,
  className,
  onChange,
  values = {},
  errors = {},
  disabled = false,
}) => {

    return (
      <div className={`form-fields-section ${className || ""}`}>
        <div className="form-fields-section__form">
          {fields.map((field) => {
            const hasError =
            Boolean(errors[field.name]) || field.status === "error";
            const isPasswordField = field.type === 'password';
            const isTextareaField = field.type === 'textarea';
            const isFieldLocked = Boolean(field.disabled);
            const isGloballyDisabled = disabled;
            const inputClassName = !field.search ? "form-fields-section__input" : "form-fields-section__input2";
            const combinedClassName = [
              inputClassName,
              hasError ? 'form-fields-section__input--error' : '',
              isFieldLocked ? 'form-fields-section__input--readonly' : '',
            ].filter(Boolean).join(' ');

            const commonInputProps = {
              placeholder: field.placeholder,
              status: hasError ? "error" as const : undefined,
              className: combinedClassName,
              prefix: field.prefix,
              value: values[field.name] || '',
              onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange?.(field.name, e.target.value),
              disabled: isGloballyDisabled,
              readOnly: isFieldLocked && !isGloballyDisabled,
              'data-testid': `input-${field.name}`,
            };

            return (
              <div
                key={field.name}
                className={`form-fields-section__field ${isFieldLocked ? ' form-fields-section__field--locked' : ''}`}
              >
                  <div className="ant-row ant-form-item">
                    <div className="ant-form-item-label">
                      <label className={field.required ? "ant-form-item-required" : ""}>
                        {field.label}
                        {field.required && <span className="form-fields-section__required">*</span>}
                      </label>
                    </div>
                    <div className="ant-form-item-control">
                      {renderFieldControl(field, isTextareaField, isPasswordField, commonInputProps, (value) => onChange?.(field.name, value))}
                      {field.hint && !errors[field.name] && (
                        <div className="ant-form-item-extra form-fields-section__hint">{field.hint}</div>
                      )}
                      {errors[field.name] && (
                        <div className="form-fields-section__error-message">
                          {errors[field.name]}
                        </div>
                      )}
                    </div>
                  </div>
              </div>
            );
          })}
        </div>
      </div>
    );

};

export default InputFields;