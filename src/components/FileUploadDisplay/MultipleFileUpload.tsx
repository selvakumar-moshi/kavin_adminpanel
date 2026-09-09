
import React, { useState, useEffect, useRef } from "react";
import { Upload, message, Button } from "antd";
import type { UploadFile, UploadProps } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { validateFileExtension, getFormattedAllowedExtensions, getAllowedExtensions } from "../../utils/fileValidationUtils";
import FileUploadDisplay from "./FileUploadDisplay";
import upload_Icon from "../../assets/upload_Icon.svg";

const { Dragger } = Upload;

export interface MultipleFileUploadProps {
  label: string;
  maxFiles: number;
  maxSize: number;
  acceptedFormats: string;
  required: boolean;
  onFileChange: (fileList: any[]) => void;
  onDeleteFile: (fileName?: string) => void;
  uploadedFiles: { name: string; file: File; size?: number }[];
  className?: string;
}

const MultipleFileUpload: React.FC<MultipleFileUploadProps> = ({
  label,
  maxFiles,
  maxSize,
  acceptedFormats,
  required,
  onFileChange,
  onDeleteFile,
  uploadedFiles = [],
  className = "",
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [validationError, setValidationError] = useState<string>("");
  const [totalSize, setTotalSize] = useState<number>(0);
  const [individualFileSizeErrors, setIndividualFileSizeErrors] = useState<
    Record<string, string>
  >({});

  // Ref for hidden native file input (used by Add More button)
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate total size whenever uploadedFiles changes
  useEffect(() => {
    const newTotalSize = uploadedFiles.reduce((sum, file) => {
      return sum + (file.size || file.file?.size || 0);
    }, 0);
    setTotalSize(newTotalSize);
  }, [uploadedFiles]);

  // Derived values
  const remainingSpaceMB = maxSize - totalSize / (1024 * 1024);
  const canAddMore = uploadedFiles.length < maxFiles && remainingSpaceMB > 0;

  // Dragger is only shown when no files have been uploaded yet (initial state)
  const showUploadArea = canAddMore && uploadedFiles.length === 0;

  // Format bytes to MB with 2 decimal places
  // const formatBytesToMB = (bytes: number): string => {
  //   return (bytes / (1024 * 1024)).toFixed(2);
  // };

  const beforeUpload: UploadProps["beforeUpload"] = (file, currentFileList) => {
    setValidationError("");
    setIndividualFileSizeErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[file.name];
      return newErrors;
    });

    // 1. Validate file extension
    const { isValid, extension } = validateFileExtension(file.name);
    if (!isValid) {
      const errorMsg = extension
        ? `Unsupported file format. Allowed formats: ${getFormattedAllowedExtensions()}`
        : "File has no extension";
      setValidationError(errorMsg);
      message.error("This is a file you can't upload here");
      return Upload.LIST_IGNORE;
    }

    // 2. Check total file count
    const totalFiles = uploadedFiles.length + currentFileList.length;
    if (totalFiles > maxFiles) {
      const errorMsg = `You can only upload up to ${maxFiles} files. You have ${uploadedFiles.length} already.`;
      setValidationError(errorMsg);
      message.error(errorMsg);
      return Upload.LIST_IGNORE;
    }

    // 3. Check total size limit (maxSize = combined budget in MB)
    const fileSizeInMB = file.size / (1024 * 1024);
    const newTotalSizeInMB = (totalSize + file.size) / (1024 * 1024);
    if (newTotalSizeInMB > maxSize) {
      const remainingMB = remainingSpaceMB.toFixed(2);
      const errorMsg =
        fileSizeInMB > maxSize
          ? `File size must not exceed ${maxSize}MB`
          : `Cannot add "${file.name}" (${fileSizeInMB.toFixed(2)}MB). Remaining: ${remainingMB}MB.`;
      setValidationError(errorMsg);
      message.error(errorMsg);
      setIndividualFileSizeErrors((prev) => ({
        ...prev,
        [file.name]:
          fileSizeInMB > maxSize
            ? `File size must not exceed ${maxSize}MB`
            : `File is ${fileSizeInMB.toFixed(2)}MB. Only ${remainingMB}MB remaining.`,
      }));
      return Upload.LIST_IGNORE;
    }

    return false;
  };

  const handleUploadChange: UploadProps["onChange"] = ({ fileList: newFileList }) => {
    const validFiles = newFileList.filter((file) => file.status !== "error");
    setFileList(validFiles);

    const uploadedFilesData = validFiles
      .filter((file) => file.originFileObj || file instanceof File)
      .map((file) => ({
        name: file.name,
        file: file.originFileObj || file,
        size: (file.originFileObj || (file as any)).size,
      }));

    onFileChange(uploadedFilesData);
    setFileList([]);
  };

  const handleAddMoreClick = () => {
    setValidationError("");
    fileInputRef.current?.click();
  };

  const handleNativeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (selectedFiles.length === 0) return;

    const newUploadedFiles: { name: string; file: File; size: number }[] = [];

    for (const file of selectedFiles) {
      // 1. Validate extension
      const { isValid, extension } = validateFileExtension(file.name);
      if (!isValid) {
        const errorMsg = extension
          ? `Unsupported file format. Allowed formats: ${getFormattedAllowedExtensions()}`
          : "File has no extension";
        setValidationError(errorMsg);
        message.error("This is a file you can't upload here");
        continue;
      }

      // 2. Validate file count
      if (uploadedFiles.length + newUploadedFiles.length >= maxFiles) {
        const errorMsg = `You can only upload up to ${maxFiles} files.`;
        setValidationError(errorMsg);
        message.error(errorMsg);
        break;
      }

      // 3. Validate size
      const currentTotal =
        totalSize + newUploadedFiles.reduce((s, f) => s + f.size, 0);
      const newTotalSizeInMB = (currentTotal + file.size) / (1024 * 1024);
      if (newTotalSizeInMB > maxSize) {
        const fileSizeInMB = file.size / (1024 * 1024);
        const remainingMB = (
          maxSize -
          currentTotal / (1024 * 1024)
        ).toFixed(2);
        const errorMsg =
          fileSizeInMB > maxSize
            ? `File size must not exceed ${maxSize}MB`
            : `Cannot add "${file.name}" (${fileSizeInMB.toFixed(2)}MB). Remaining: ${remainingMB}MB.`;
        setValidationError(errorMsg);
        message.error(errorMsg);
        continue;
      }

      newUploadedFiles.push({ name: file.name, file, size: file.size });
    }

    if (newUploadedFiles.length > 0) {
      // Merge with already uploaded files and notify parent
      onFileChange([...uploadedFiles, ...newUploadedFiles]);
    }

    // Reset input so the same file can be re-selected if needed
    e.target.value = "";
  };

  const handleDelete = (fileName: string) => {
    setFileList((prev) => prev.filter((file) => file.name !== fileName));
    setValidationError("");
    setIndividualFileSizeErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fileName];
      return newErrors;
    });
    onDeleteFile(fileName);
  };

  const usedPercentage = (totalSize / (maxSize * 1024 * 1024)) * 100;

  return (
    <div className={`multiple-file-upload ${className}`}>

      {/* Label + stats row */}
      <div className="multiple-file-upload__label-container">
        <label className="multiple-file-upload__label">
          {label}
          {required && (
            <span className="form-fields-section__required">*</span>
          )}
        </label>
      </div>

      {/* Progress bar + Add More button */}
      {uploadedFiles.length > 0 && (
        <div className="multiple-file-upload__progress-container">
          <div className="multiple-file-upload__progress-bar">
            <div
              className="multiple-file-upload__progress-fill"
              style={{ width: `${Math.min(usedPercentage, 100)}%` }}
            />
          </div>

          {/* Add More button — visible as long as capacity remains */}
          {canAddMore && (
            <div className="multiple-file-upload__remaining">
              <Button
                type="default"
                icon={<PlusOutlined />}
                onClick={handleAddMoreClick}
                className="popup-modal__button popup-modal__button--secondary"
              >
                Add
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Hidden native file input triggered by Add More button */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={getAllowedExtensions().join(",")}
        style={{ display: "none" }}
        onChange={handleNativeFileChange}
      />

      {/* Uploaded files list */}
      {uploadedFiles.length > 0 && (
        <div className="multiple-file-upload__files-list">
          {uploadedFiles.map((file, index) => {
            const hasError = individualFileSizeErrors[file.name];
            return (
              <div key={index} className="multiple-file-upload__file-item">
                <FileUploadDisplay
                  label=""
                  fileName={file.name}
                  onDelete={() => handleDelete(file.name)}
                />
                {hasError && (
                  <div className="multiple-file-upload__file-info">
                    <span className="multiple-file-upload__file-error">
                      {hasError}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dragger — shown only when no files uploaded yet (initial state) */}
      {showUploadArea && (
        <Dragger
          multiple
          fileList={fileList}
          beforeUpload={beforeUpload}
          onChange={handleUploadChange}
          showUploadList={false}
          accept={getAllowedExtensions().join(",")}
          className="file-upload-section__dragger"
        >
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
        </Dragger>
      )}

      {/* Max files reached message */}
      {uploadedFiles.length >= maxFiles && (
        <div className="multiple-file-upload__error-message">
          You have reached the maximum limit of {maxFiles} files.
        </div>
      )}

      {/* No space remaining message */}
      {remainingSpaceMB <= 0 && uploadedFiles.length < maxFiles && (
        <div className="multiple-file-upload__error-message">
          No space remaining. Please delete some files to add more.
        </div>
      )}

      {/* Validation error */}
      {validationError && (
        <div className="multiple-file-upload__error-message">
          <div>{validationError}</div>
        </div>
      )}
    </div>
  );
};

export default MultipleFileUpload;