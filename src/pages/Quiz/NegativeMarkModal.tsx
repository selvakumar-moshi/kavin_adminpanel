import { useState, useEffect } from 'react';
import PopupModal from '../../components/PopupModal/PopupModal';
import InputFields from '../../components/InputFields/InputFields';
import { NEGATIVE_MARK_FIELDS } from './Constant';

interface NegativeMarkModalProps {
    open: boolean;
    negativeMark: string;
    wrongAnswersPerDeduction: string;
    /** The mark set on the quiz's questions; shown, never edited here */
    markPerQuestion: string;
    onSubmit: (values: { negativeMark: string; wrongAnswersPerDeduction: string }) => void;
    onClose: () => void;
}

// Both fields are optional; when filled, the negative mark is a number of 0 or more and the count a whole number of 1 or more
const validate = (name: string, raw: string): string => {
    const value = raw.trim();
    if (!value) return '';
    if (name === 'negativeMark' && !/^\d+(\.\d+)?$/.test(value)) return 'Enter a number of 0 or more';
    if (name === 'wrongAnswersPerDeduction' && !/^[1-9]\d*$/.test(value)) return 'Enter a whole number of 1 or more';
    return '';
};

const NegativeMarkModal = ({ open, negativeMark, wrongAnswersPerDeduction, markPerQuestion, onSubmit, onClose }: NegativeMarkModalProps) => {
    const [values, setValues] = useState({ negativeMark, wrongAnswersPerDeduction });
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Each opening starts from what the quiz currently holds, so a cancelled edit is dropped
    useEffect(() => {
        if (open) {
            setValues({ negativeMark, wrongAnswersPerDeduction });
            setErrors({});
        }
    }, [open, negativeMark, wrongAnswersPerDeduction]);

    const handleChange = (name: string, value: string) => {
        if (name === 'markPerQuestion') return;
        setValues((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => {
            const next = { ...prev };
            const error = validate(name, value);
            if (error) next[name] = error;
            else delete next[name];
            return next;
        });
    };

    const handleSubmit = () => {
        const nextErrors: Record<string, string> = {};
        (['negativeMark', 'wrongAnswersPerDeduction'] as const).forEach((name) => {
            const error = validate(name, values[name]);
            if (error) nextErrors[name] = error;
        });
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;
        onSubmit({
            negativeMark: values.negativeMark.trim(),
            wrongAnswersPerDeduction: values.wrongAnswersPerDeduction.trim(),
        });
    };

    return (
        <PopupModal
            open={open}
            onClose={onClose}
            onSubmit={handleSubmit}
            title="Negative Mark"
            subtitle=""
            primaryButtonText="Submit"
            secondaryButtonText="Cancel"
            showFooter={true}
            contentHeight="auto"
            minHeight={300}
        >
            <div style={{ padding: '0 8px' }}>
                <InputFields
                    fields={NEGATIVE_MARK_FIELDS.map((field) => ({ ...field, disabled: field.name === 'markPerQuestion' }))}
                    values={{ ...values, markPerQuestion }}
                    errors={errors}
                    onChange={handleChange}
                />
            </div>
        </PopupModal>
    );
};

export default NegativeMarkModal;
