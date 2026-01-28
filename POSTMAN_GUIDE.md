# Postman API 테스트 가이드

## 🚀 서버 실행 확인

먼저 서버가 실행 중인지 확인하세요:
```bash
npm run dev
```

서버가 `http://localhost:3000`에서 실행되어야 합니다.

---

## 📍 API 엔드포인트

### 1. Health Check (서버 동작 확인)

**GET** `http://localhost:3000/`

**응답 예시:**
```json
{
  "message": "🚀 Secure Backend System is running!",
  "status": "OK",
  "timestamp": "2026-01-26T09:20:00.000Z",
  "endpoints": {
    "register": "POST /api/auth/register",
    "login": "POST /api/auth/login",
    "me": "GET /api/auth/me (Protected)"
  }
}
```

---

### 2. 회원가입 (Register)

**POST** `http://localhost:3000/api/auth/register`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "test@example.com",
  "password": "test1234",
  "nickname": "testuser"
}
```

**성공 응답 (201 Created):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "nickname": "testuser",
    "createdAt": "2026-01-26T09:20:00.000Z"
  }
}
```

**실패 응답 예시:**

- **400 Bad Request** - 유효성 검사 실패
```json
{
  "error": "Validation Error",
  "message": "Password must be at least 8 characters with at least 1 letter and 1 number"
}
```

- **409 Conflict** - 이메일 중복
```json
{
  "error": "Conflict",
  "message": "Email already registered"
}
```

---

### 3. 로그인 (Login)

**POST** `http://localhost:3000/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "test@example.com",
  "password": "test1234"
}
```

**성공 응답 (200 OK):**
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "nickname": "testuser",
    "createdAt": "2026-01-26T09:20:00.000Z"
  }
}
```

> ⚠️ **중요**: Access Token은 15분 후 만료됩니다. Refresh Token을 사용하여 새 토큰을 받으세요.

**실패 응답 (401 Unauthorized):**
```json
{
  "error": "Authentication Failed",
  "message": "Invalid email or password"
}
```


---

### 4. 내 정보 조회 (Get Current User) 🔐

**GET** `http://localhost:3000/api/auth/me`

> ⚠️ **보호된 라우트** - JWT 토큰 필수

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <your-jwt-token>
```

**성공 응답 (200 OK):**
```json
{
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "nickname": "testuser",
    "createdAt": "2026-01-26T09:20:00.000Z",
    "updatedAt": "2026-01-26T09:20:00.000Z"
  }
}
```

**실패 응답:**

- **401 Unauthorized** - 토큰 없음
```json
{
  "error": "Authentication Required",
  "message": "No token provided"
}
```

- **401 Unauthorized** - 잘못된 토큰
```json
{
  "error": "Authentication Failed",
  "message": "Invalid or expired token"
}
```

- **401 Unauthorized** - 사용자 없음
```json
{
  "error": "Authentication Failed",
  "message": "User not found"
}
```

---

### 5. 토큰 갱신 (Refresh Token) 🔄

**POST** `http://localhost:3000/api/auth/refresh`

> 💡 Access Token이 만료되었을 때 Refresh Token을 사용하여 새 토큰을 받습니다.

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**성공 응답 (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

> ⚠️ **토큰 로테이션**: 보안을 위해 이전 Refresh Token은 자동으로 무효화되고 새 토큰이 발급됩니다.

**실패 응답:**

- **400 Bad Request** - Refresh Token 누락
```json
{
  "error": "Validation Error",
  "message": "Refresh token is required"
}
```

- **401 Unauthorized** - 잘못된/만료된 토큰
```json
{
  "error": "Invalid Token",
  "message": "Refresh token not found or expired"
}
```

---

### 6. 로그아웃 (Logout) 🚪

**POST** `http://localhost:3000/api/auth/logout`

> 🔒 Refresh Token을 무효화하여 로그아웃합니다.

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**성공 응답 (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

**실패 응답:**

- **400 Bad Request** - Refresh Token 누락
```json
{
  "error": "Validation Error",
  "message": "Refresh token is required"
}
```

---

### 7. 비밀번호 찾기 (Forgot Password) 📧

**POST** `http://localhost:3000/api/auth/forgot-password`

> 💡 비밀번호를 잊어버린 경우 이메일로 재설정 링크를 받습니다.

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "test@example.com"
}
```

**성공 응답 (200 OK):**
```json
{
  "message": "If an account exists with this email, a password reset link has been sent"
}
```

> ⚠️ **보안**: 이메일 존재 여부를 노출하지 않기 위해 항상 동일한 메시지를 반환합니다.

**실패 응답:**

- **400 Bad Request** - 이메일 누락
```json
{
  "error": "Validation Error",
  "message": "Email is required"
}
```

---

### 8. 비밀번호 재설정 (Reset Password) 🔑

**POST** `http://localhost:3000/api/auth/reset-password`

> 🔒 이메일로 받은 토큰을 사용하여 새 비밀번호를 설정합니다.

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecure123!"
}
```

**성공 응답 (200 OK):**
```json
{
  "message": "Password has been reset successfully"
}
```

**실패 응답:**

- **400 Bad Request** - 필수 필드 누락
```json
{
  "error": "Validation Error",
  "message": "Token and new password are required"
}
```

- **400 Bad Request** - 약한 비밀번호
```json
{
  "error": "Validation Error",
  "message": "Password must be at least 8 characters with at least 1 letter and 1 number"
}
```

- **401 Unauthorized** - 잘못된/만료된 토큰
```json
{
  "error": "Invalid Token",
  "message": "Password reset token is invalid or has expired"
}
```

> ⏰ **토큰 만료**: 재설정 토큰은 1시간 후 자동으로 만료됩니다.

---

## 🧪 테스트 시나리오

### 시나리오 1: 정상 회원가입 → 로그인 → 내 정보 조회

1. **회원가입** - 새 사용자 등록
2. **로그인** - 등록한 계정으로 로그인
3. **JWT 토큰 확인** - 응답에서 token 값 확인
4. **내 정보 조회** - 토큰을 사용하여 `/api/auth/me` 호출

### 시나리오 2: 유효성 검사 테스트

**잘못된 이메일 형식:**
```json
{
  "email": "invalid-email",
  "password": "test1234"
}
```

**약한 비밀번호 (숫자만):**
```json
{
  "email": "test@example.com",
  "password": "12345678"
}
```

**비밀번호에 이메일 ID 포함:**
```json
{
  "email": "test@example.com",
  "password": "test1234"
}
```
→ 거부되어야 함 (보안 규칙)

**비밀번호에 닉네임 포함:**
```json
{
  "email": "test@example.com",
  "password": "testuser123",
  "nickname": "testuser"
}
```
→ 거부되어야 함 (보안 규칙)

### 시나리오 3: 중복 확인

1. 동일한 이메일로 두 번 회원가입 시도
2. 동일한 닉네임으로 두 번 회원가입 시도

### 시나리오 4: JWT 인증 테스트 ✨

**테스트 1: 토큰 없이 접근**
- `/api/auth/me`에 Authorization 헤더 없이 요청
- 예상 결과: 401 Unauthorized

**테스트 2: 잘못된 토큰으로 접근**
- Authorization: `Bearer invalid-token-123`
- 예상 결과: 401 Unauthorized

**테스트 3: 유효한 토큰으로 접근**
- 로그인 후 받은 토큰 사용
- Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- 예상 결과: 200 OK with user info

---

### 시나리오 5: Refresh Token 시스템 테스트 🔄

**테스트 1: 로그인 후 두 토큰 확인**
- 로그인 후 응답에 `accessToken`과 `refreshToken` 모두 포함되는지 확인
- 예상 결과: 200 OK with both tokens

**테스트 2: Refresh Token으로 새 토큰 받기**
- `/api/auth/refresh`에 refreshToken 전송
- 예상 결과: 200 OK with new accessToken and refreshToken

**테스트 3: 토큰 로테이션 확인**
- 이전 refreshToken을 다시 사용 시도
- 예상 결과: 401 Unauthorized (토큰이 이미 무효화됨)

**테스트 4: 로그아웃 후 토큰 무효화 확인**
- `/api/auth/logout`으로 로그아웃
- 로그아웃한 refreshToken으로 refresh 시도
- 예상 결과: 401 Unauthorized

**테스트 5: Access Token 만료 후 갱신**
- Access Token으로 보호된 라우트 접근 (15분 후)
- 예상 결과: 401 Unauthorized
- Refresh Token으로 새 Access Token 받기
- 새 Access Token으로 다시 접근
- 예상 결과: 200 OK

---

### 시나리오 6: 비밀번호 재설정 플로우 🔑

**테스트 1: 비밀번호 찾기 요청**
- `/api/auth/forgot-password`에 이메일 전송
- 예상 결과: 200 OK (이메일 존재 여부와 관계없이 동일한 응답)
- 이메일 설정이 되어있다면: 재설정 링크가 포함된 이메일 수신

**테스트 2: 유효한 토큰으로 비밀번호 재설정**
- 이메일에서 받은 토큰 사용
- `/api/auth/reset-password`에 토큰과 새 비밀번호 전송
- 예상 결과: 200 OK
- 새 비밀번호로 로그인 가능 확인

**테스트 3: 잘못된 토큰으로 재설정 시도**
- 존재하지 않는 토큰 사용
- 예상 결과: 401 Unauthorized

**테스트 4: 만료된 토큰으로 재설정 시도**
- 1시간 이상 지난 토큰 사용
- 예상 결과: 401 Unauthorized

**테스트 5: 약한 비밀번호로 재설정 시도**
- 비밀번호 규칙을 만족하지 않는 비밀번호 사용
- 예상 결과: 400 Bad Request

---

## 📧 이메일 설정 (선택사항)

비밀번호 재설정 이메일을 실제로 전송하려면 `.env` 파일에 이메일 설정이 필요합니다:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourapp.com
FRONTEND_URL=http://localhost:3001
```

> 💡 **Gmail 사용 시**: 2단계 인증을 활성화하고 앱 비밀번호를 생성해야 합니다.

---

## 📝 Postman Collection 설정 팁

### Environment Variables 설정

1. Postman에서 Environment 생성
2. 변수 추가:
   - `base_url`: `http://localhost:3000`
   - `accessToken`: (로그인 후 자동 저장)
   - `refreshToken`: (로그인 후 자동 저장)

### Request 설정

**회원가입/로그인 요청:**
- URL: `{{base_url}}/api/auth/register`
- Method: POST
- Headers: `Content-Type: application/json`
- Body: raw (JSON)

**보호된 라우트 요청 (내 정보 조회):**
- URL: `{{base_url}}/api/auth/me`
- Method: GET
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer {{accessToken}}`

**Refresh Token 요청:**
- URL: `{{base_url}}/api/auth/refresh`
- Method: POST
- Headers: `Content-Type: application/json`
- Body: `{ "refreshToken": "{{refreshToken}}" }`

**로그인 후 토큰 자동 저장 (Tests 탭):**
```javascript
if (pm.response.code === 200) {
  const response = pm.response.json();
  pm.environment.set("accessToken", response.accessToken);
  pm.environment.set("refreshToken", response.refreshToken);
}
```

**Refresh 후 토큰 자동 저장 (Tests 탭):**
```javascript
if (pm.response.code === 200) {
  const response = pm.response.json();
  pm.environment.set("accessToken", response.accessToken);
  pm.environment.set("refreshToken", response.refreshToken);
}
```

---

## ✅ 체크리스트

- [ ] 서버가 정상 실행되는가?
- [ ] Health Check 엔드포인트가 응답하는가?
- [ ] 회원가입이 성공하는가?
- [ ] 중복 이메일이 거부되는가?
- [ ] 비밀번호 유효성 검사가 작동하는가?
- [ ] 로그인이 성공하고 두 개의 토큰을 받는가?
- [ ] 잘못된 비밀번호가 거부되는가?
- [ ] 토큰 없이 보호된 라우트 접근 시 거부되는가?
- [ ] 잘못된 토큰으로 보호된 라우트 접근 시 거부되는가?
- [ ] 유효한 토큰으로 내 정보 조회가 성공하는가?
- [ ] Refresh Token으로 새 토큰을 받을 수 있는가?
- [ ] 이전 Refresh Token이 무효화되는가? (토큰 로테이션)
- [ ] 로그아웃 후 Refresh Token이 무효화되는가?
