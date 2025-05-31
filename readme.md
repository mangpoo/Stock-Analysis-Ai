# 📂 로그인 기능 개발 (`login` 브랜치)

## 🔧 작업 개요
React 프론트엔드와 Flask 백엔드 간 **Google OAuth 로그인 기능**을 연동하고, **사용자 정보를 MySQL DB에 저장**한 뒤, **JWT 토큰을 발급**하여 로그인 세션을 유지하는 기능을 구현했습니다.

---

## 🧩 주요 기능 요약

- **React 프론트:**
  - Google 로그인 버튼으로 사용자 인증
  - 로그인 성공 시 Google 사용자 정보를 Flask 서버로 전송
  - 받은 JWT 토큰을 로컬 스토리지에 저장하여 세션 유지

- **Flask 백엔드:**
  - Google 사용자 정보를 받아 DB(`users` 테이블)에 저장 또는 조회
  - 로그인 성공 시 **JWT 토큰 생성** 후 응답으로 전달
  - 이후 요청 시 JWT를 검사하여 인증 처리
  - CORS 설정 완료 (React 연동)

- **MySQL DB 구조:**

  - **데이터베이스명:** `myapp_db`
  - **테이블명:** `users`

    | 컬럼명        | 타입              | 설명             |
    |---------------|-------------------|------------------|
    | id            | INT, PK, AUTO     | 내부 고유 ID     |
    | google_id     | VARCHAR(255)      | Google 고유 ID   |
    | email         | VARCHAR(255)      | 사용자 이메일    |
    | name          | VARCHAR(255)      | 사용자 이름      |
    | profile_img   | TEXT              | 프로필 이미지 URL|
    | created_at    | DATETIME          | 생성 시간        |

---

## 🔐 JWT 발급 구조

- 사용자가 로그인하면 서버는 사용자 고유 식별자(예: `user_id`)를 기반으로 JWT를 생성
- 생성된 JWT는 클라이언트로 전달되어 로컬에 저장됨
- 이후 API 요청 시 `Authorization: Bearer <token>` 헤더를 통해 사용자 인증

---

## ✅ 연동 테스트 방법

1. Flask 서버 실행:  
   ```bash
   cd server
   flask run
   ```

2. React 클라이언트 실행:  
   ```bash
   cd client
   npm start
   ```

3. 로그인 후 브라우저 개발자 도구에서 **JWT 토큰 확인**:  
   - Application → LocalStorage → `token` 키 확인

4. 서버 보호 라우터 테스트 (예시):
   ```bash
   curl -H "Authorization: Bearer <발급받은_JWT>" http://localhost:5000/protected
   ```

5. DB 저장 여부 확인:
   ```sql
   SELECT * FROM users;
   ```

