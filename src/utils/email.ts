/**
 * Email Utility
 * Handles sending emails using Nodemailer
 */

import nodemailer from 'nodemailer';
import config from '../config';

/**
 * Create email transporter
 * Uses Gmail SMTP by default, can be configured for other services
 */
const createTransporter = () => {
    return nodemailer.createTransport({
        host: config.emailHost,
        port: config.emailPort,
        secure: false, // true for 465, false for other ports
        auth: {
            user: config.emailUser,
            pass: config.emailPassword,
        },
    });
};

/**
 * Send password reset email
 * @param email - Recipient email address
 * @param resetToken - Password reset token
 */
export const sendPasswordResetEmail = async (
    email: string,
    resetToken: string
): Promise<void> => {
    const transporter = createTransporter();

    // Create reset link
    const resetLink = `${config.frontendUrl}/reset-password?token=${resetToken}`;

    // Email template
    const mailOptions = {
        from: config.emailFrom,
        to: email,
        subject: 'Password Reset Request',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header {
                        background-color: #4CAF50;
                        color: white;
                        padding: 20px;
                        text-align: center;
                        border-radius: 5px 5px 0 0;
                    }
                    .content {
                        background-color: #f9f9f9;
                        padding: 30px;
                        border-radius: 0 0 5px 5px;
                    }
                    .button {
                        display: inline-block;
                        padding: 12px 24px;
                        background-color: #4CAF50;
                        color: white;
                        text-decoration: none;
                        border-radius: 5px;
                        margin: 20px 0;
                    }
                    .footer {
                        margin-top: 20px;
                        font-size: 12px;
                        color: #666;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Password Reset Request</h1>
                    </div>
                    <div class="content">
                        <p>Hello,</p>
                        <p>We received a request to reset your password. Click the button below to reset it:</p>
                        <p style="text-align: center;">
                            <a href="${resetLink}" class="button">Reset Password</a>
                        </p>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #4CAF50;">${resetLink}</p>
                        <p><strong>This link will expire in 1 hour.</strong></p>
                        <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `
Password Reset Request

We received a request to reset your password. Click the link below to reset it:

${resetLink}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Password reset email sent to ${email}`);
    } catch (error) {
        console.error('❌ Error sending password reset email:', error);
        throw new Error('Failed to send password reset email');
    }
};

/**
 * Test email configuration
 * Useful for verifying SMTP settings
 */
export const testEmailConnection = async (): Promise<boolean> => {
    try {
        const transporter = createTransporter();
        await transporter.verify();
        console.log('✅ Email server connection verified');
        return true;
    } catch (error) {
        console.error('❌ Email server connection failed:', error);
        return false;
    }
};


/**
 * Send email verification email with 6-digit code
 */
export const sendVerificationEmail = async (
    email: string,
    code: string
): Promise<void> => {
    const transporter = createTransporter();

    const mailOptions = {
        from: config.emailFrom,
        to: email,
        subject: '이메일 인증 코드',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #4CAF50; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="color: white; margin: 0;">이메일 인증</h1>
                </div>
                
                <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
                    <h2 style="color: #333;">회원가입을 완료하세요</h2>
                    <p style="color: #666; line-height: 1.6;">
                        회원가입을 완료하려면 아래 6자리 인증 코드를 입력해주세요.
                    </p>
                    
                    <div style="background-color: #f0f0f0; padding: 30px; text-align: center; margin: 30px 0; border-radius: 8px;">
                        <h1 style="color: #4CAF50; font-size: 48px; letter-spacing: 10px; margin: 0; font-family: 'Courier New', monospace;">
                            ${code}
                        </h1>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    
                    <p style="color: #999; font-size: 12px; line-height: 1.6;">
                        <strong>⏰ 중요:</strong><br>
                        • 이 코드는 <strong>5분 후</strong> 만료됩니다<br>
                        • 본인이 요청하지 않았다면 이 이메일을 무시하세요<br>
                        • 보안을 위해 이 코드를 타인과 공유하지 마세요
                    </p>
                </div>
            </div>
        `,
        text: `
이메일 인증 코드

회원가입을 완료하려면 아래 6자리 인증 코드를 입력해주세요:

${code}

⏰ 이 코드는 5분 후 만료됩니다.
본인이 요청하지 않았다면 이 이메일을 무시하세요.
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Verification code sent to ${email}`);
    } catch (error) {
        console.error('❌ Error sending verification email:', error);
        throw new Error('Failed to send verification email');
    }
};
