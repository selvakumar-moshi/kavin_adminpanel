import { useState } from 'react';
import { CheckOutlined, CopyOutlined } from '@ant-design/icons';
import PopupModal from '../../components/PopupModal/PopupModal';
import type { useResetPassword } from './useResetPassword';

interface ResetPasswordModalsProps {
    reset: ReturnType<typeof useResetPassword>;
}

// Confirmation before a student's password is reset, then the temporary password to hand over
const ResetPasswordModals = ({ reset }: ResetPasswordModalsProps) => {
    const { target, isResetting, result, closeConfirm, confirmReset, closeResult } = reset;
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!result) return;
        try {
            await navigator.clipboard.writeText(result.temporaryPassword);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard blocked: the password is still on screen to copy by hand
        }
    };

    return (
        <>
            <PopupModal
                open={Boolean(target)}
                onClose={closeConfirm}
                onSubmit={confirmReset}
                title="Reset Password"
                subtitle=""
                primaryButtonText="Reset"
                secondaryButtonText="Cancel"
                showFooter={true}
                primaryButtonLoading={isResetting}
                primaryButtonDisabled={isResetting}
                contentHeight="auto"
                minHeight={100}
            >
                <div className="popup-modal__content-content-text">
                    Are you sure you want to reset the password for <b>"{target?.name}"</b>? A temporary password will be generated.
                </div>
            </PopupModal>

            <PopupModal
                open={Boolean(result)}
                onClose={closeResult}
                onSubmit={closeResult}
                title="Temporary Password"
                subtitle=""
                primaryButtonText="Done"
                secondaryButtonText=""
                showFooter={true}
                contentHeight="auto"
                minHeight={100}
            >
                <div className="popup-modal__content-content-text">
                    Share this temporary password with <b>"{result?.name}"</b>. They can use it to log in and set a new password.
                </div>
                <div className="reset-password__result">
                    <span className="reset-password__value" data-testid="temporary-password">{result?.temporaryPassword}</span>
                    <button type="button" className="reset-password__copy" onClick={handleCopy} aria-label="Copy temporary password">
                        {copied ? <CheckOutlined /> : <CopyOutlined />} {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>
            </PopupModal>
        </>
    );
};

export default ResetPasswordModals;
