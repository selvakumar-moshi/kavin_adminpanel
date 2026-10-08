import { Spin } from 'antd';
import type { UploadFile } from 'antd';
import FileUploadSection from '../../components/FileUploadSection/FileUploadSection';

export interface QuizDocumentUploadProps {
    fileList: UploadFile[];
    isImporting: boolean;
    warnings: { documentNumber: number; reason: string }[];
    onFileChange: (files: UploadFile[]) => void;
}

// Word document upload: the questions in it are read by /Quiz/import and filled into the questions editor
const QuizDocumentUpload = ({ fileList, isImporting, warnings, onFileChange }: QuizDocumentUploadProps) => (
    <>
        <FileUploadSection
            label="Word File"
            acceptedFormats="DOCX"
            allowedExtensions={['.docx']}
            maxSize={10}
            fileList={fileList}
            onFileChange={onFileChange}
        />
        {isImporting && (
            <div className="question-detail-form__importing">
                <Spin size="small" /> Reading questions from the file...
            </div>
        )}
        {warnings.length > 0 && (
            <ul className="question-detail-form__import-warnings">
                {warnings.map((warning) => (
                    <li key={`${warning.documentNumber}-${warning.reason}`}>
                        <b>Q{warning.documentNumber}:</b> {warning.reason}
                    </li>
                ))}
            </ul>
        )}
    </>
);

export default QuizDocumentUpload;
