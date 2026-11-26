import React, { useEffect, useRef, useState } from "react";
import { Upload, message } from "antd";
import type { UploadFile } from "antd";
import type { RcFile } from "antd/es/upload";
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
  /** Restricts this uploader to these extensions (e.g. ['.docx']); defaults to every supported type */
  allowedExtensions?: string[];
  /** Lets an image copied to the clipboard be pasted (Ctrl + V) into this uploader */
  allowPasteImage?: boolean;
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
  allowedExtensions,
  allowPasteImage,
}) => {
  const [internalFileList, setInternalFileList] = useState<UploadFile[]>([]);
  const [validationError, setValidationError] = useState<string>("");
  
  const fileList = controlledFileList !== undefined ? controlledFileList : internalFileList;

  // Checks a picked or pasted file; on failure shows why and returns false
  const validateFile = (file: File): boolean => {
    setValidationError("");

      // 1. VALIDATE FILE EXTENSION FIRST
      const { isValid: isSupported, extension } = validateFileExtension(file.name);
      const isValid = isSupported && (!allowedExtensions || allowedExtensions.includes(extension));

      if (!isValid) {
        const errorMsg = extension
          ? `Unsupported file format. Allowed formats: ${allowedExtensions ? allowedExtensions.join(', ') : getFormattedAllowedExtensions()}`
          : "This file has no extension. Please upload a valid file.";
        
        setValidationError(errorMsg);
        message.error("This is a file you can't upload here");
        return false;
      }

      // 2. Check file size
      const isValidSize = file.size / 1024 / 1024 < maxSize;
      if (!isValidSize) {
        const errorMsg = `File size must not exceed ${maxSize}MB!`;
        setValidationError(errorMsg);
        message.error(errorMsg);
        return false;
      }

      // Clear error if validation passes
      setValidationError("");
      return true;
  };

  const uploadProps = {
    beforeUpload: (file: File) => {
      if (!validateFile(file)) return Upload.LIST_IGNORE;
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
    accept: (allowedExtensions ?? getAllowedExtensions()).join(','),
  };

  // Ctrl + V of a copied image: it is taken like a picked file while nothing has been chosen yet.
  // The latest handler is kept in a ref so the listener is only added once.
  const pasteHandlerRef = useRef<(event: ClipboardEvent) => void>(() => undefined);
  pasteHandlerRef.current = (event: ClipboardEvent) => {
    if (fileList.length > 0) return;
    const image = Array.from(event.clipboardData?.files ?? []).find((file) => file.type.startsWith("image/"));
    if (!image) return; // plain text pastes (e.g. into the name box) are left alone
    event.preventDefault();
    // Keep the file's own name (a file copied from Explorer has one); only an unnamed clipboard image gets a made-up name
    const extension = image.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
    const pasted = new File([image], image.name || `pasted-image-${Date.now()}.${extension}`, { type: image.type });
    if (!validateFile(pasted)) return;
    const newFileList: UploadFile[] = [{ uid: `paste-${Date.now()}`, name: pasted.name, status: "done", originFileObj: pasted as RcFile }];
    if (controlledFileList === undefined) {
      setInternalFileList(newFileList);
    }
    onFileChange?.(newFileList);
  };

  useEffect(() => {
    if (!allowPasteImage) return;
    const listener = (event: ClipboardEvent) => pasteHandlerRef.current(event);
    document.addEventListener("paste", listener);
    return () => document.removeEventListener("paste", listener);
  }, [allowPasteImage]);

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
                {allowPasteImage && (
                  <div className="file-upload-section__upload-formats">or paste an image</div>
                )}
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