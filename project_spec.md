# Project Specification: Secure Backend System## 

## 1. Project Overview* **Goal:** Build a secure user authentication (Sign-up/Login) and community backend system. * **Core Value:** Security-first approach, Type safety, and Scalability.  

## 2. Tech Stack* **Language:** TypeScript * **Runtime:** Node.js * **Framework:** Express.js * **ORM:** Prisma v6 * **Database:** Supabase (PostgreSQL) * **Auth:** JWT (JSON Web Token) * **Security:** bcryptjs (Password Hashing) 

## 3. Database Schema (Prisma) The following schema must be used. Note the UUID for ID and Unique constraints.  ```prisma model User { id        String   @id @default(uuid()) email     String   @unique password  String   // Encrypted string nickname  String?  @unique createdAt DateTime @default(now()) updatedAt DateTime @updatedAt }

## 4. Folder Structure (Directory Map)
The project follows this structure for maintainability:

```
src/
├── app.ts                    # Entry point (Express server setup)
├── config/
│   └── index.ts              # Environment variables & constants
├── controllers/
│   └── auth.controller.ts    # Request handlers (Business logic)
├── routes/
│   └── auth.routes.ts        # API Route definitions
├── middlewares/
│   └── index.ts              # Express middlewares (Validation, Auth check)
├── services/
│   └── auth.service.ts       # Database interactions (Prisma calls)
├── utils/
│   ├── prisma.ts             # PrismaClient singleton instance
│   └── validators.ts         # Helper functions (Email, Password validation)
└── types/
    └── auth.types.ts         # TypeScript type definitions

prisma/
├── schema.prisma             # Database schema
└── migrations/               # Database migration files
```

## 5. Functional Requirements & Logic

### 5.1. Sign Up (POST /api/auth/register)

**Input:** `email`, `password`, `nickname` (optional)

**Validation Rules (Critical):**
- **Email:** Must be a valid email format
- **Password Regex:** `^(?=.*[A-Za-z])(?=.*\d).{8,}$`
  - Must contain at least 1 letter
  - Must contain at least 1 number
  - Minimum 8 characters
  - **Special characters allowed** ✅

**Security Logic:**
- Password MUST NOT contain the email local part (ID before @)
- Password MUST NOT contain the nickname

**Uniqueness:** Check if email or nickname already exists in DB

**Action:** Hash password using bcrypt (10 rounds) and save User to DB

**Response:** 201 Created (with success message and user info)

### 5.2. Login (POST /api/auth/login)

**Input:** `email`, `password`

**Validation:**
- Find user by email
- Compare password using bcrypt.compare

**Action:** Generate JWT Access Token (24h expiration)

**Response:** 200 OK (return Token and user info excluding password)

## 6. Environment Variables (.env)

```env
PORT=3000
DATABASE_URL="postgresql://..." # Supabase connection pooling
DIRECT_URL="postgresql://..."   # Direct connection for migrations
JWT_SECRET="your-secret-key"
```

**Note:** Prisma v6 requires `DIRECT_URL` for migrations when using Supabase connection pooling.

## 7. Development Guidelines

- Use try-catch blocks in controllers for error handling
- Separate business logic (Service layer) from request handling (Controller layer)
- Strictly use TypeScript types for Request and Response bodies
- Use PrismaClient singleton pattern to prevent multiple database connections
- Follow layered architecture: Routes → Controllers → Services → Database

## 8. Runtime & Version Requirements

* **Node.js:** v22 LTS
* **TypeScript:** v5.x (Latest stable)
* **Prisma:** v6.x (v7 not compatible with current setup)

## 9. Additional Packages

| Package | Description | Required |
|---------|-------------|----------|
| `dotenv` | Load environment variables from `.env` file | ✅ Essential |
| `cors` | Enable CORS for frontend connection | ✅ Recommended |
| `morgan` | HTTP request logging for debugging | ✅ Recommended |
| `nodemon` | Auto-restart on code changes (dev) | ✅ Dev convenience |
| `ts-node` | Execute TypeScript directly | ✅ Essential |

## 10. Implementation Status

### ✅ Completed
- [x] Project structure setup
- [x] Package.json configuration with all dependencies
- [x] TypeScript configuration (tsconfig.json)
- [x] Prisma schema with User model
- [x] PrismaClient singleton implementation
- [x] Express server setup with middlewares (CORS, Morgan, JSON parser)
- [x] Authentication routes (register, login)
- [x] Authentication controllers with validation
- [x] Authentication services (bcrypt, JWT)
- [x] Email and password validators
- [x] Supabase database connection
- [x] Database migration completed
- [x] Postman testing guide (POSTMAN_GUIDE.md)
- [x] Refresh token system with token rotation
- [x] Logout functionality
- [x] Password reset functionality with email
- [x] HttpOnly cookie for refresh tokens (XSS protection)
- [x] Password reset security enhancements (10-minute tokens)
- [x] Rate limiting for DDoS protection
- [x] JWT authentication middleware
- [x] Protected routes implementation
- [x] **Email verification system (6-digit codes)**
- [x] **Email-based rate limiting (3/hour)**
- [x] **Login blocking for unverified users**
- [x] **Ghost account cleanup job**

### 🔄 Available Scripts

```bash
npm run dev              # Start development server with auto-reload
npm run build            # Compile TypeScript to JavaScript
npm start                # Run production server
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run database migrations
```

### 📍 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user (Protected) |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout and revoke token |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |
| POST | `/api/auth/verify-email` | Verify email with 6-digit code |
| POST | `/api/auth/resend-verification` | Resend verification code |
| GET | `/api/auth/social/status` | Social login provider status |
| GET | `/api/auth/google` | Google OAuth login |
| GET | `/api/auth/google/callback` | Google OAuth callback |
| GET | `/api/auth/kakao` | Kakao OAuth login |
| GET | `/api/auth/kakao/callback` | Kakao OAuth callback |
| GET | `/api/posts` | Get posts (search, pagination) |
| POST | `/api/posts` | Create post (Protected) |
| GET | `/api/posts/:id` | Get post detail |
| PUT | `/api/posts/:id` | Update post (Protected) |
| DELETE | `/api/posts/:id` | Delete post (Protected) |
| GET | `/api/posts/:postId/comments` | Get comments |
| POST | `/api/posts/:postId/comments` | Create comment (Protected) |
| PUT | `/api/comments/:id` | Update comment (Protected) |
| DELETE | `/api/comments/:id` | Delete comment (Protected) |
| POST | `/api/posts/:postId/like` | Toggle like (Protected) |
| GET | `/api/posts/:postId/like/status` | Get like status (Protected) |
| POST | `/api/upload` | Upload file (Protected) |
| GET | `/api/upload` | Get uploaded files |
| DELETE | `/api/upload/:filename` | Delete file (Protected) |
| GET | `/api/profile` | Get my profile (Protected) |
| PUT | `/api/profile` | Update profile (Protected) |
| GET | `/api/profile/:id` | Get user profile |
| PUT | `/api/profile/image` | Update profile image (Protected) |
| DELETE | `/api/profile/image` | Delete profile image (Protected) |

### 🔐 Security Features

- bcrypt 비밀번호 해싱 (10 salt rounds)
- JWT Access Token (15분 만료)
- JWT Refresh Token (7일 만료)
- **HttpOnly Cookie** for refresh tokens (XSS 방어)
- **SameSite=Strict** (CSRF 방어)
- **Secure flag** (HTTPS only in production)
- **Rate Limiting** (DDoS 방어)
  - 인증 엔드포인트: 5 요청/15분
  - 일반 API: 100 요청/15분
- **Email Verification** (이메일 인증)
  - 6자리 인증 코드 (5분 만료)
  - 이메일 기반 Rate Limiting (3회/시간)
  - 로그인 차단 (미인증 시 403)
  - 트랜잭션 기반 인증 (코드 재사용 불가)
  - 유령 계정 자동 정리 (3일 후)
- 토큰 로테이션 (재사용 방지)
- 비밀번호 강도 검증 (영문+숫자+특수문자 필수)
- 이메일 형식 검증
- 중복 이메일/닉네임 방지
- 비밀번호 보안 체크 (이메일 ID, 닉네임 포함 금지)
- 이메일 열거 공격 방지
- 단일 사용 재설정 토큰 (10분 만료)

### 📝 Next Steps

- [x] Add email verification
- [x] Implement refresh token
- [x] Add password reset functionality
- [x] Create protected routes with JWT middleware
- [x] Add rate limiting
- [x] Fix refresh token rotation functions (rotateRefreshToken, revokeRefreshToken)
- [x] Test email verification system (SMTP configured, full flow tested)
- [x] Additional security tests (Rate Limiting, Logout, Token Revocation)
- [x] API documentation (Swagger/OpenAPI) - 33 endpoints fully documented
- [x] Community features (posts, comments, likes) - 11 endpoints
- [x] Post search & sorting (keyword, likes/date)
- [x] File upload (multer, JPEG/PNG/GIF/WebP, max 5MB)
- [x] Docker deployment ready (Dockerfile, docker-compose.yml)
- [x] Redis caching service (graceful degradation)
- [x] User profile (bio, profileImage, nickname update)
- [x] Social login (Google OAuth, Kakao OAuth)

---

## 11. Next Steps Priority

### 🎯 Priority 1: JWT 인증 미들웨어 구현 (Protected Routes)

**목적:** 로그인한 사용자만 접근 가능한 보호된 라우트 생성

**구현 내용:**
- JWT 토큰 검증 미들웨어 개발 (`src/middlewares/auth.middleware.ts`)
- Authorization Header에서 Bearer 토큰 추출
- 토큰 유효성 검증 및 사용자 정보 추출
- Request 객체에 사용자 정보 첨부
- 보호된 테스트 라우트 생성 (예: `/api/auth/me`)

**이유:**
- 현재 로그인 기능은 있지만 실제로 보호된 리소스에 접근하는 기능이 없음
- 다른 기능들(프로필 조회, 게시판 등)을 구현하기 전에 필수적
- 인증 시스템의 핵심 완성 단계

---

### 🔄 Priority 2: Refresh Token 구현

**목적:** Access Token 만료 시 재발급 메커니즘 제공

**구현 내용:**
- Refresh Token 생성 및 저장 (DB 또는 Redis)
- Access Token 재발급 API (`POST /api/auth/refresh`)
- Refresh Token 만료 처리 (7일 또는 30일)
- 로그아웃 시 Refresh Token 무효화

**이유:**
- 보안 강화 (짧은 Access Token 수명 유지 가능)
- 사용자 경험 개선 (자동 재로그인)

---

### 🔐 Priority 3: 비밀번호 재설정 기능

**목적:** 사용자가 비밀번호를 잊었을 때 재설정 가능하도록 지원

**구현 내용:**
- 비밀번호 재설정 요청 API (`POST /api/auth/forgot-password`)
- 재설정 토큰 생성 및 이메일 발송
- 비밀번호 재설정 API (`POST /api/auth/reset-password`)
- 토큰 만료 처리 (1시간)

**이유:**
- 필수 사용자 기능
- 보안 정책 준수

---

### ✉️ Priority 4: 이메일 인증

**목적:** 회원가입 시 이메일 소유권 확인

**구현 내용:**
- 이메일 인증 토큰 생성
- 인증 이메일 발송 (Nodemailer 또는 SendGrid)
- 이메일 인증 API (`GET /api/auth/verify-email/:token`)
- User 모델에 `emailVerified` 필드 추가

**이유:**
- 스팸 계정 방지
- 실제 사용자 확인
- 비밀번호 재설정 등 이메일 기반 기능의 전제조건

---

### 🛡️ Priority 5: Rate Limiting

**목적:** API 남용 및 브루트포스 공격 방지

**구현 내용:**
- `express-rate-limit` 패키지 설치
- 로그인/회원가입 엔드포인트에 Rate Limiter 적용
- IP 기반 요청 제한 (예: 5분에 5회)
- 에러 메시지 커스터마이징

**이유:**
- 보안 강화
- 서버 리소스 보호
- DDoS 공격 완화

---

### 📚 Priority 6: API 문서화 (Swagger/OpenAPI)

**목적:** API 명세 자동화 및 개발자 경험 개선

**구현 내용:**
- `swagger-jsdoc`, `swagger-ui-express` 설치
- JSDoc 주석으로 API 명세 작성
- Swagger UI 엔드포인트 생성 (`/api-docs`)
- Request/Response 스키마 정의

**이유:**
- 프론트엔드 개발자와의 협업 용이
- API 테스트 간편화
- 프로젝트 문서화