# 📂 로그인 기능 개발 (`login` 브랜치)

## 🔧 작업 개요
React 프론트엔드와 Flask 백엔드 간 **Google OAuth 로그인 기능**을 연동하고, **사용자 정보를 MySQL DB에 저장**하는 기능을 구현했습니다.


## 🧩 주요 기능 요약

- **React 프론트:**
  - Google 로그인 버튼을 통해 사용자 인증
  - 로그인 성공 시 Google 사용자 정보 획득 및 백엔드에 전달

- **Flask 백엔드:**
  - Google 사용자 정보 수신 후 MySQL DB에 저장
  - CORS 설정 및 JWT 토큰 발급 가능 구조 고려

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

3. 로그인 후 DB에 사용자 정보가 저장되었는지 확인:  
   ```sql
   SELECT * FROM users;
   ```

