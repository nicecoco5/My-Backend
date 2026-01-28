import config from '../config';

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate password strength
 * Requirements: 
 * - At least 8 characters
 * - At least 1 letter (A-Z or a-z)
 * - At least 1 number (0-9)
 * - At least 1 special character (@$!%*#?&)
 */
export const isValidPassword = (password: string): boolean => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
};

/**
 * Extract local part from email (part before @)
 */
export const getEmailLocalPart = (email: string): string => {
    return email.split('@')[0] || '';
};

/**
 * Check if password contains forbidden strings
 * Password should NOT contain email local part or nickname
 */
export const isPasswordSecure = (
    password: string,
    email: string,
    nickname?: string
): { isSecure: boolean; reason?: string } => {
    const emailLocalPart = getEmailLocalPart(email).toLowerCase();
    const lowerPassword = password.toLowerCase();

    // Check if password contains email local part
    if (emailLocalPart.length > 0 && lowerPassword.includes(emailLocalPart)) {
        return {
            isSecure: false,
            reason: 'Password must not contain your email ID',
        };
    }

    // Check if password contains nickname
    if (nickname && lowerPassword.includes(nickname.toLowerCase())) {
        return {
            isSecure: false,
            reason: 'Password must not contain your nickname',
        };
    }

    return { isSecure: true };
};
