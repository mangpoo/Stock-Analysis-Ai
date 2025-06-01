# Flask Backend for Stock Analysis App

이 백엔드는 Flask 프레임워크 기반으로 제작되었으며, Google 로그인을 통한 사용자 인증과 MySQL DB 저장 기능을 포함합니다.  
React 프론트엔드와 연동되어 주식 관심 목록, 최근 조회 종목을 관리하는 API를 제공합니다.  
또한 외부 SDS 서버와의 통신을 위한 프록시 기능, JWT 발급 및 인증 기능, React 빌드 결과물을 서비스하는 역할도 수행합니다.

---

## 📁 프로젝트 구성

```
app.py             # Flask 백엔드 메인 파일
schema.sql         # MySQL 테이블 생성 쿼리
.env               # SDS_SERVER_IP 및 PORT 환경변수 (선택)
```

---

## ⚙️ 주요 기능 요약

- Google 로그인 사용자 정보 DB 저장
- JWT 발급 및 사용자 인증 처리 (`/token`, `/verify`)
- 관심 종목 추가, 조회, 삭제 (`/favorite`)
- 최근 본 종목 추가 및 조회 (`/recent`)
- 외부 SDS API 프록시 처리 (`/api/<path>`)
- 정적 리액트 페이지 제공 (`/`, `/index.html`)
- SPA 지원을 위한 404 핸들링 및 라우팅
- 프론트엔드 연동을 위한 CORS 설정

---

## 📡 API 명세

### [POST] /login
- Google 로그인 사용자 정보 저장  
  필드: `sub`, `email`, `name`, `picture`

### [POST] /token
- JWT 토큰 발급  
  body: `{"email": "test@example.com"}` → 결과: `{ "token": "..." }`

### [POST] /verify
- JWT 유효성 검증  
  body: `{"token": "..."}` → 결과: 사용자 정보 또는 401 오류

---

### [POST] /favorite
- 관심 종목 등록  
  body: `{"user_id": 1, "stock_code": "005930"}`

### [GET] /favorite?user_id=1
- 관심 종목 조회

### [DELETE] /favorite
- 관심 종목 삭제  
  body: `{"user_id": 1, "stock_code": "005930"}`

---

### [POST] /recent
- 최근 본 종목 등록  
  body: `{"user_id": 1, "stock_code": "000660"}`

### [GET] /recent?user_id=1
- 최근 본 종목 조회 (최대 20개, 최신순)

---

### [GET|POST] /api/<path>
- 외부 SDS API를 프록시로 호출  
  - `.env`의 SDS_SERVER_IP 와 PORT 사용

---

### [GET] /
- 정적 React 앱 페이지 (`../react/build/index.html`) 제공

### [GET] /api/hello
- 백엔드 상태 확인용 API

---

## 🧰 사용 기술 스택

- Python 3.11
- Flask
- PyMySQL
- flask-cors
- python-dotenv
- requests
- JWT (PyJWT)

---

## 🗄️ MySQL 테이블 구조

### users
| 필드 | 타입 | 설명 |
|------|------|------|
| id | INT | PK, 자동 증가 |
| google_id | VARCHAR | Google 고유 ID |
| email | VARCHAR | 사용자 이메일 (UNIQUE) |
| name | VARCHAR | 사용자 이름 |
| profile_img | TEXT | 프로필 이미지 URL |
| created_at | TIMESTAMP | 생성일시 |

### favorite_stocks
| 필드 | 타입 | 설명 |
|------|------|------|
| id | INT | PK |
| user_id | INT | 사용자 ID (FK) |
| stock_code | VARCHAR | 종목 코드 |
| added_at | TIMESTAMP | 등록 시각 |

### recent_stocks
| 필드 | 타입 | 설명 |
|------|------|------|
| id | INT | PK |
| user_id | INT | 사용자 ID (FK) |
| stock_code | VARCHAR | 종목 코드 |
| viewed_at | TIMESTAMP | 조회 시각 |

---

## 🔌 실행 방법

```bash
# 패키지 설치
pip install flask flask-cors python-dotenv pymysql requests PyJWT

# .env 설정 예시
SDS_SERVER_IP=192.168.0.5
SDS_SERVER_PORT=5000
JWT_SECRET_KEY=your_secret_key_here

# 서버 실행
python app.py
```

---

## 🌐 배포 주소

- Backend: http://ddolddol2.duckdns.org:5000  
- Frontend: http://ddolddol2.duckdns.org

---

## 📝 비고

- React 앱은 `../react/build` 에 정적 배포됨  
- DB: myapp_db / 사용자: root / 비밀번호: 010216  
- `/api/<path>` 는 외부 SDS 서버 요청을 중계  
- 404 라우팅은 React 앱으로 리다이렉션  
- JWT는 사용자 email을 기준으로 발급되며, 모든 민감 API 보호에 활용 가능

---

## 🔒 보안 주의

- `.env`는 Git에 포함하지 말고 `.gitignore` 처리 필수  
- JWT 키는 외부 노출 금지  
- 운영 환경에서는 CORS 도메인과 프록시 대상 제한 필요
