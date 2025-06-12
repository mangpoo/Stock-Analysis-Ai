# 🔐 사용자 로그인 기능 설명서 (Google OAuth + JWT 기반)

이 문서는 Stock Analysis 웹사이트의 **사용자 로그인 및 인증 시스템**을 상세히 설명합니다.  
우리 시스템은 Google OAuth 2.0 기반 로그인과 JWT(JSON Web Token) 기반 인증 구조를 사용하여,  
신뢰성과 보안성을 갖춘 사용자 인증을 구현하고 있습니다.

---

## 🌐 로그인 시스템 개요

- **OAuth 2.0 인증**: Google 계정으로 로그인하여 사용자를 식별하고, Google의 인증 서버로부터 access_token을 발급받습니다.
- **Flask 백엔드 처리**:
  - 클라이언트에서 전달된 사용자 정보를 기반으로 사용자 DB에 등록 또는 갱신
  - 자체 JWT 토큰을 생성하여 클라이언트에 반환
- **JWT 인증**:
  - 이후의 모든 인증 요청에는 이 JWT 토큰이 포함되어야 하며, 토큰을 통해 사용자를 식별합니다.
- **JWT 보안 설정**:
  - 1시간의 유효시간 설정
  - 토큰 만료 시 자동 메시지 응답 처리

---

## ✅ 전체 로그인 흐름 단계

1. React 프론트엔드에서 Google OAuth 로그인 실행
2. Google에서 access_token 및 사용자 정보(`sub`, `email`, `name`, `picture`) 수신
3. 해당 사용자 정보를 Flask 백엔드의 `/login` 엔드포인트로 전달
4. 백엔드는 사용자 정보를 MySQL DB에 저장하거나, 이미 등록된 경우 `name`, `profile_img` 갱신
5. JWT 토큰을 생성하여 응답으로 반환 (`expires_in=1시간`)
6. 프론트엔드는 JWT 토큰을 localStorage에 저장하고, 이후 모든 요청에 Authorization 헤더로 첨부
7. 인증이 필요한 모든 API는 `@jwt_required()` 데코레이터로 보호됨

---

## 📦 관련 API 상세 명세

### 🔐 [POST] `/login`
- Google OAuth로 받은 사용자 정보를 전달하면 서버에서 JWT 발급
- 사용자는 DB에 저장되며, 기존 사용자일 경우 업데이트

**요청 바디 예시**:
```json
{
  "sub": "110447585646777341226",
  "email": "user@example.com",
  "name": "홍길동",
  "picture": "https://example.com/photo.jpg"
}
```

**응답 예시**:
```json
{
  "status": "ok",
  "message": "사용자 정보 저장 및 토큰 발급 완료",
  "token": "<JWT 토큰>"
}
```

---

### 🧾 [GET] `/auth/me`
- JWT 토큰을 이용해 현재 로그인한 사용자 정보 확인
- 모든 인증 API와 마찬가지로 Authorization 헤더 필요

**요청 헤더 예시**:
```
Authorization: Bearer <JWT 토큰>
```

**응답 예시**:
```json
{
  "google_id": "110447585646777341226",
  "email": "user@example.com",
  "name": "홍길동",
  "picture": "https://example.com/photo.jpg"
}
```

---

## 🗄️ 사용자 테이블 구조 (MySQL)

사용자 정보는 다음과 같이 `users` 테이블에 저장됩니다.

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | INT | PK, AUTO_INCREMENT |
| google_id | VARCHAR(255) | Google 고유 사용자 ID (UNIQUE) |
| email | VARCHAR(255) | 사용자 이메일 주소 (UNIQUE) |
| name | VARCHAR(255) | 사용자 이름 |
| profile_img | TEXT | 프로필 이미지 URL |
| created_at | TIMESTAMP | 사용자 최초 등록 시간 |

> 동일한 `google_id`가 이미 존재하면 `name`, `profile_img`만 업데이트됩니다.

---

## 🔒 보안 및 인증 정책

- JWT는 1시간 동안 유효하며, 이후 자동 만료 처리됩니다.
- JWT 만료 시 다음과 같은 메시지 응답:
```json
{
  "status": "expired",
  "message": "로그인 세션이 만료되었습니다. 다시 로그인해주세요."
}
```
- `.env` 파일에는 `JWT_SECRET`, DB 비밀번호 등 중요한 정보가 포함됩니다.
- `.env`는 반드시 `.gitignore`에 추가하고, `.env.example`만 문서화합니다.

---

## 📌 기타 유의사항

- 프론트엔드에서는 JWT를 `localStorage`에 안전하게 저장 후 모든 요청에 포함해야 합니다.
- JWT를 통한 인증은 `/favorite`, `/recent`, `/analyze` 등 모든 민감 API에 필수입니다.
- 로그인하지 않은 사용자는 관련 API에 접근할 수 없습니다.

---

**작성자: 강지모 (Fancy-Bronze)**
