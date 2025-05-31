# Flask Backend for Stock Analysis App

이 백엔드는 Flask 프레임워크 기반으로 제작되었으며, Google 로그인을 통한 사용자 인증과 MySQL DB 저장 기능을 포함합니다.  
React 프론트엔드와 연동되어 주식 관심 목록, 최근 조회 종목을 관리하는 API를 제공합니다.

---

## 📁 프로젝트 구성

app.py             # Flask 백엔드 메인 파일
schema.sql         # MySQL 테이블 생성 쿼리
.env               # SDS_SERVER_IP 및 PORT 환경변수 (선택)

---

## ⚙️ 주요 기능 요약

- Google 로그인 사용자 정보 DB 저장
- 관심 종목 추가, 조회, 삭제 (`/favorite`)
- 최근 본 종목 추가 및 조회 (`/recent`)
- 프론트엔드 연동을 위한 CORS 설정
- 외부 API 프록시 지원

---

## 📡 API 명세

### [POST] /login
- Google 로그인 사용자 정보 저장  
  필드: `sub`, `email`, `name`, `picture`

### [POST] /favorite
- 관심 종목 등록  
  body: `{"user_id": 1, "stock_code": "005930"}`

### [GET] /favorite?user_id=1
- 관심 종목 조회

### [DELETE] /favorite
- 관심 종목 삭제  
  body: `{"user_id": 1, "stock_code": "005930"}`

### [POST] /recent
- 최근 본 종목 등록  
  body: `{"user_id": 1, "stock_code": "000660"}`

### [GET] /recent?user_id=1
- 최근 본 종목 조회

### [GET] /api/hello
- 기본 API 테스트용

---

## 🧰 사용 기술 스택

- Python 3.11
- Flask
- PyMySQL
- flask-cors
- dotenv
- MySQL 8.x

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

