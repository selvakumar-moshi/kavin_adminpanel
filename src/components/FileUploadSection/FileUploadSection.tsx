import React, { useState } from "react";
import { Upload, message } from "antd";
import type { UploadFile } from "antd";
import upload_Icon from "../../assets/upload_Icon.svg";
import { validateFileExtension, getFormattedAllowedExtensions, getAllowedExtensions } from "../../utils/fileValidationUtils";
import FileUploadDisplay from "../FileUploadDisplay/FileUploadDisplay";

export interface FileUploadSectionProps {
  label?: string;
  maxSize?: number;
  acceptedFormats?: string;
  required?: boolean;
  name?: string;
  className?: string;
  onFileChange?: (fileList: UploadFile[]) => void;
  onDeleteFile?: (fileName: string) => void;
  fileList?: UploadFile[];
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  label = "Label",
  maxSize = 25,
  acceptedFormats = "PDF, DOCX, XLSX, CSV, PPTX, JPG, PNG, TXT, HTML, TSEC, ZIP",
  className,
  onFileChange,
  onDeleteFile,
  fileList: controlledFileList,
  required,
}) => {
  const [internalFileList, setInternalFileList] = useState<UploadFile[]>([]);
  const [validationError, setValidationError] = useState<string>("");
  
  const fileList = controlledFileList !== undefined ? controlledFileList : internalFileList;

  const uploadProps = {
    beforeUpload: (file: File) => {
      setValidationError("");

      // 1. VALIDATE FILE EXTENSION FIRST
      const { isValid, extension } = validateFileExtension(file.name);
      
      if (!isValid) {
        const errorMsg = extension 
          ? `Unsupported file format. Allowed formats: ${getFormattedAllowedExtensions()}`
          : "This file has no extension. Please upload a valid file.";
        
        setValidationError(errorMsg);
        message.error("This is a file you can't upload here");
        return Upload.LIST_IGNORE;
      }

      // 2. Check file size
      const isValidSize = file.size / 1024 / 1024 < maxSize;
      if (!isValidSize) {
        const errorMsg = `File size must not exceed ${maxSize}MB!`;
        setValidationError(errorMsg);
        message.error(errorMsg);
        return Upload.LIST_IGNORE;
      }

      // Clear error if validation passes
      setValidationError("");
      return false;
    },
    onChange: (info: any) => {
      // Filter out files that are in error state
      const validFiles = info.fileList.filter((file: UploadFile) => file.status !== 'error');
      const newFileList = validFiles;
      
      if (controlledFileList === undefined) {
        setInternalFileList(newFileList);
      }
      onFileChange?.(newFileList);
    },
    fileList,
    multiple: false,
    accept: getAllowedExtensions().join(','),
  };

  const handleDeleteFile = (fileName: string) => {
    const newFileList = fileList.filter(file => file.name !== fileName);
    
    if (controlledFileList === undefined) {
      setInternalFileList(newFileList);
    }
    setValidationError("");
    
    onFileChange?.(newFileList);
    onDeleteFile?.(fileName);
  };

  return (
    <div className={`file-upload-section ${className || ""}`}>
      <div className="file-upload-section__upload-area">
        <label className="upload__label">{label}
          {required && <span className="form-fields-section__required">*</span>}
        </label>
        
        {fileList.length > 0 ? (
          <div className="file-upload-section__display-container">
            {fileList.map((file) => (
              <FileUploadDisplay
                key={file.uid || file.name}
                label=""
                fileName={file.name}
                onDelete={() => handleDeleteFile(file.name)}
              />
            ))}
          </div>
        ) : (
          <Upload.Dragger {...uploadProps} className="file-upload-section__upload">
            <div className="file-upload-section__upload-content">
              <div className="file-upload-section__upload-icon">
                <img src={upload_Icon} alt="Upload" />
                <div className="file-upload-section__upload-size">{maxSize}MB</div>
              </div>
              <div className="file-upload-section__upload-text">
                <div className="file-upload-section__upload-formats">
                  {acceptedFormats}
                </div>
              </div>
            </div>
          </Upload.Dragger>
        )}

        {/* Validation Error Message */}
        {validationError && (
          <div className="multiple-file-upload__error-message">
            {/* <div className="multiple-file-upload__error-message-title">⚠️ Upload Error</div> */}
            <div>{validationError}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploadSection;