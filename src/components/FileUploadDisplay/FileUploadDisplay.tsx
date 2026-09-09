
import React from "react";
import Delete_icon from "../../assets/DeleteIcon.svg";

export interface FileUploadDisplayProps {
  label: string;
  fileName: string;
  onDelete: () => void;
  className?: string;
  required?: boolean;
}

const FileUploadDisplay: React.FC<FileUploadDisplayProps> = ({
  label,
  fileName,
  onDelete,
  className,
  required = false,
}) => {

  return (
    <div className={`file-upload-display ${className || ""}`}>
      {label && (
        <div className="file-upload-display__field">
          <label className="file-upload-display__label">
            {label}
            {required && <span className="form-fields-section__required">*</span>}
          </label>
        </div>
      )}
      <div className="file-upload-display__container">
        <div className="file-upload-display__file-info">
          <div className="file-upload-display__file-name">{fileName}</div>
          <div className="file-upload-display__dropdown-icon">
            <button
              type="button"
              className="file-upload-display__delete-btn"
              onClick={onDelete}
              aria-label="Delete file"
            >
              <img src={Delete_icon} alt="Delete Icon" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploadDisplay;