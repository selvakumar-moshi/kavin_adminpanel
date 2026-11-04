import { useState } from 'react';
import superSalesAPI from '../../services/LearningAPI';

export interface ResetPasswordTarget {
    userId: string;
    name: string;
}

// The temporary password sits in `data` of the response; the top level is checked too in case the API returns it there
const readTemporaryPassword = (res: any): string => res?.data?.data?.temporaryPassword ?? res?.data?.temporaryPassword ?? '';

// Reset-password flow shared by the Users table and the User Detail page: confirm -> call the API -> show the
// temporary password so the admin can give it to the student
export const useResetPassword = (showError: (message: string) => void) => {
    const [target, setTarget] = useState<ResetPasswordTarget | null>(null);
    const [isResetting, setIsResetting] = useState(false);
    // Kept with the user's name so the result dialog can say whose password it is
    const [result, setResult] = useState<{ name: string; temporaryPassword: string } | null>(null);

    const openConfirm = (user: ResetPasswordTarget) => setTarget(user);
    const closeConfirm = () => setTarget(null);
    const closeResult = () => setResult(null);

    const confirmReset = async () => {
        if (!target) return;

        setIsResetting(true);
        try {
            const res = await superSalesAPI.resetUserPassword(target.userId);
            const temporaryPassword = readTemporaryPassword(res);
            if (!temporaryPassword) {
                showError(res?.data?.message || 'The password was reset, but no temporary password was returned');
            } else {
                setResult({ name: target.name, temporaryPassword });
            }
            setTarget(null);
        } catch (error: any) {
            showError(error?.response?.data?.message || error?.message || 'Failed to reset the password');
        } finally {
            setIsResetting(false);
        }
    };

    return { target, isResetting, result, openConfirm, closeConfirm, confirmReset, closeResult };
};
