import { isValidEmail, isValidPassword, isPasswordSecure } from '../validators';

describe('Validator Utils', () => {

    // Email Validation Tests
    describe('isValidEmail', () => {
        it('should return true for valid emails', () => {
            expect(isValidEmail('test@example.com')).toBe(true);
            expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
        });

        it('should return false for invalid emails', () => {
            expect(isValidEmail('invalid-email')).toBe(false);
            expect(isValidEmail('test@')).toBe(false);
            expect(isValidEmail('@domain.com')).toBe(false);
            expect(isValidEmail('test@domain')).toBe(false); // In validators.ts strictly requires .something
        });
    });

    // Password Format Validation Tests
    describe('isValidPassword', () => {
        it('should return true for strong passwords', () => {
            expect(isValidPassword('StrongPass1!')).toBe(true);
            expect(isValidPassword('P@ssw0rd123')).toBe(true);
        });

        it('should return false for passwords shorter than 8 chars', () => {
            expect(isValidPassword('Pass1!')).toBe(false);
        });

        it('should return false for passwords without numbers', () => {
            expect(isValidPassword('Password!')).toBe(false);
        });

        it('should return false for passwords without special characters', () => {
            expect(isValidPassword('Password123')).toBe(false);
        });
    });

    // Password Security Logic Tests (No User Data in Password)
    describe('isPasswordSecure', () => {
        it('should fail if password contains email local part', () => {
            const result = isPasswordSecure('MyEmail123!', 'myemail@example.com');
            expect(result.isSecure).toBe(false);
            expect(result.reason).toContain('email ID');
        });

        it('should fail if password contains nickname', () => {
            const result = isPasswordSecure('SuperNick1!', 'user@example.com', 'SuperNick');
            expect(result.isSecure).toBe(false);
            expect(result.reason).toContain('nickname');
        });

        it('should pass if password only shares partial substring but not full ID/Nickname', () => {
            // "Super" is part of "SuperNick", but not the full nickname "SuperNick"
            const result = isPasswordSecure('SuperPass1!', 'user@example.com', 'SuperNick');
            expect(result.isSecure).toBe(true);
        });
    });
});
