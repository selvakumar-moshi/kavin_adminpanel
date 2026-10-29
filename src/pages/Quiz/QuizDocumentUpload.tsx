import { Spin } from 'antd';
import type { UploadFile } from 'antd';
import FileUploadSection from '../../components/FileUploadSection/FileUploadSection';

interface ImportIssue {
    documentNumber: number;
    reason: string;
}

export interface QuizDocumentUploadProps {
    fileList: UploadFile[];
    isImporting: boolean;
    warnings: ImportIssue[];
    /** Questions of the document that could not be read, each with the reason */
    skipped?: ImportIssue[];
    /** How many questions the document contains (shown as "x of y skipped") */
    totalFound?: number;
    onFileChange: (files: UploadFile[]) => void;
}

// "1, 2, 3, 5" -> "1-3, 5"
const formatNumbers = (numbers: number[]): string => {
    const sorted = [...numbers].sort((a, b) => a - b);
    const parts: string[] = [];
    let start = 0;
    for (let i = 1; i <= sorted.length; i++) {
        if (i === sorted.length || sorted[i] !== sorted[i - 1] + 1) {
            parts.push(i - 1 > start ? `${sorted[start]}-${sorted[i - 1]}` : String(sorted[start]));
            start = i;
        }
    }
    return parts.join(', ');
};

// Skipped questions grouped by reason, so a long document gives a few lines instead of one line per question
const groupByReason = (issues: ImportIssue[]) => {
    const groups = new Map<string, number[]>();
    issues.forEach((issue) => groups.set(issue.reason, [...(groups.get(issue.reason) ?? []), issue.documentNumber]));
    return [...groups.entries()].map(([reason, numbers]) => ({ reason, numbers }));
};

// Word document upload: the questions in it are read by /Quiz/import and filled into the questions editor
const QuizDocumentUpload = ({ fileList, isImporting, warnings, skipped = [], totalFound = 0, onFileChange }: QuizDocumentUploadProps) => (
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
        {skipped.length > 0 && (
            <div className="question-detail-form__import-skipped">
                <div className="question-detail-form__import-skipped-title">
                    {totalFound > 0 ? `${skipped.length} of ${totalFound} questions were skipped` : `${skipped.length} questions were skipped`}
                </div>
                <ul>
                    {groupByReason(skipped).map(({ reason, numbers }) => (
                        <li key={reason}>
                            <b>{reason}</b>
                            <div>Q{formatNumbers(numbers)}</div>
                        </li>
                    ))}
                </ul>
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
