# AWS - Hosting Branch

# 📈 Stock Analysis AI Project

이 프로젝트는 React 프론트엔드와 Flask 백엔드를 기반으로 구성된 **AI 기반 주식 분석 웹 애플리케이션**입니다.  
사용자 인증(Google OAuth), 종목 검색 및 관심 목록 관리 기능을 포함하고 있으며, AWS EC2 서버에서 호스팅됩니다.

---

## 📁 프로젝트 구조

```
Stock-Analysis-Ai/
├── backend/               # Flask 백엔드
│   ├── app.py             # 메인 서버 파일 (CORS, JWT, 정적파일 처리 포함)
│   ├── db.py              # DB 연결 모듈
│   ├── .env               # 환경 변수 설정 (JWT_SECRET 등)
│   ├── requirements.txt   # Python 의존성 목록
│   └── ... 기타 API 모듈들
├── react/                 # React 프론트엔드
│   ├── src/
│   │   ├── App.js
│   │   ├── api.js         # Axios 인스턴스 설정 및 JWT 자동 전송
│   │   └── ... 컴포넌트 파일
│   ├── public/
│   ├── package.json
│   └── ...
├── .gitignore
└── README.md
```

---

## ⚙️ 기술 스택

- **Frontend:** React, Axios, Google Login
- **Backend:** Flask, Flask-JWT-Extended, PyMySQL, dotenv
- **Database:** MySQL
- **Deployment:** AWS EC2 (React는 자체 개발 서버, Flask는 정적 파일 서빙 포함)

---

## 🔐 주요 기능

- Google 로그인 및 JWT 토큰 발급
- 사용자 정보 DB 저장
- 관심 주식 추가/삭제/조회
- 최근 본 주식 관리
- JWT 자동 전송 인터셉터 적용
- CORS 허용 설정 및 배포 도메인 반영

---

## 🚀 배포 정보

- 서버 도메인: `http://ddolddol2.duckdns.org`
- 프론트엔드: React 자체 개발 서버 또는 build 후 Flask에서 정적 파일로 서빙
- 백엔드: `backend/app.py`를 `python` 명령어로 직접 실행

---

## 🧪 로컬 실행 방법

### 1. 백엔드 실행

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

**✅ Flask 주요 설정**
- `.env` 파일을 통해 JWT 시크릿 키 및 서버 포트 설정
- `flask_cors.CORS()` 사용해 `localhost:3000` 및 `ddolddol2.duckdns.org` 허용
- 정적 파일 (`../react/build`)을 직접 서빙

### 2. 프론트엔드 실행

```bash
cd react
npm install
npm start
```

**✅ React 주요 설정 (`src/api.js`)**
- `baseURL`: `http://localhost:5000` → 배포 시 `http://ddolddol2.duckdns.org`
- `withCredentials: false`
- 요청 시 `localStorage.getItem('jwt_token')`을 `Authorization: Bearer ...` 헤더에 자동 추가

---

## 📌 기타 정보

- JWT 토큰은 `localStorage`에서 자동 불러와 전송
- 프론트엔드와 백엔드는 포트 분리 후 프록시 설정 가능
- `favorite_stocks` 등 주요 DB 테이블이 사용됨

---

## 🙋‍♀️ 작성자

- 프로젝트 담당자: 강지모 (Fancy_Bronze)
