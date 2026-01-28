/**
 * Swagger JSDoc annotations for remaining auth endpoints
 * This file contains all the JSDoc comments to be added to auth.controller.ts
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 로그인
 *     description: 이메일과 비밀번호로 로그인하고 JWT 토큰을 발급받습니다
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: 인증 실패 (잘못된 이메일 또는 비밀번호)
 *       403:
 *         description: 이메일 미인증
 *       429:
 *         description: 너무 많은 요청
 *       500:
 *         description: 서버 에러
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: 내 정보 조회
 *     description: 현재 로그인한 사용자의 정보를 조회합니다
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: 인증 실패 (토큰 없음 또는 무효)
 *       500:
 *         description: 서버 에러
 */

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: 토큰 갱신
 *     description: Refresh Token을 사용하여 새로운 Access Token을 발급받습니다
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: 토큰 갱신 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Refresh Token 없음
 *       401:
 *         description: 유효하지 않은 Refresh Token
 *       500:
 *         description: 서버 에러
 */

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: 로그아웃
 *     description: 현재 세션을 종료하고 Refresh Token을 무효화합니다
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: 로그아웃 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 *       400:
 *         description: Refresh Token 없음
 *       500:
 *         description: 서버 에러
 */

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: 이메일 인증
 *     description: 6자리 인증 코드로 이메일을 인증합니다
 *     tags: [Email Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               code:
 *                 type: string
 *                 pattern: '^\d{6}$'
 *                 example: "123456"
 *                 description: 6자리 인증 코드
 *     responses:
 *       200:
 *         description: 이메일 인증 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email verified successfully
 *       400:
 *         description: 잘못된 요청 (코드 형식 오류)
 *       401:
 *         description: 유효하지 않거나 만료된 코드
 *       500:
 *         description: 서버 에러
 */

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: 인증 코드 재발송
 *     description: 새로운 6자리 인증 코드를 이메일로 재발송합니다
 *     tags: [Email Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: 인증 코드 재발송 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Verification code has been sent
 *       400:
 *         description: 이미 인증된 계정
 *       429:
 *         description: 너무 많은 요청 (Rate Limiting)
 *       500:
 *         description: 서버 에러
 */

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: 비밀번호 찾기
 *     description: 비밀번호 재설정 링크를 이메일로 발송합니다
 *     tags: [Password Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: 비밀번호 재설정 이메일 발송 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset email sent
 *       400:
 *         description: 잘못된 요청
 *       429:
 *         description: 너무 많은 요청
 *       500:
 *         description: 서버 에러
 */

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: 비밀번호 재설정
 *     description: 재설정 토큰을 사용하여 새 비밀번호를 설정합니다
 *     tags: [Password Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 example: abc123def456...
 *                 description: 비밀번호 재설정 토큰
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: NewSecurePass123!
 *                 description: 새 비밀번호 (최소 8자, 영문+숫자 필수)
 *     responses:
 *       200:
 *         description: 비밀번호 재설정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset successful
 *       400:
 *         description: 잘못된 요청 (토큰 또는 비밀번호 형식 오류)
 *       401:
 *         description: 유효하지 않거나 만료된 토큰
 *       500:
 *         description: 서버 에러
 */
