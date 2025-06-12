# 📦 Flask Backend for Stock Analysis App

이 백엔드는 Flask 프레임워크 기반으로 제작된 주식 분석 웹사이트 백엔드입니다.  
Google 로그인, JWT 인증, RDS 연동, 종목 데이터 API, 뉴스 요약, 통합 분석 기능을 제공합니다.

---

## 📁 주요 파일 구성

| 파일명 | 설명 |
|--------|------|
| app.py | Flask 애플리케이션 메인 코드 |
| .env | 비밀 설정 (DB 접속, API 키 등) |
| schema.sql | MySQL 테이블 생성 쿼리 |
| requirements.txt | 필요한 Python 패키지 목록 |

---

## 🚀 기능 요약

- ✅ Google OAuth 로그인 및 JWT 인증
- ✅ 사용자 정보 MySQL 저장 및 중복 시 업데이트
- ✅ JWT 인증 상태 유지 확인 API 제공
- ✅ 관심 종목 추가 / 삭제 / 조회 / 찜 여부 확인 API
- ✅ 최근 본 종목 추가 / 조회 API (최대 10개, 중복 제거)
- ✅ 주가 히스토리 + 뉴스 크롤링 + GPT 통합 분석 API
- ✅ 가격 분석만 제공하는 별도 API
- ✅ 메인 뉴스 캐시 API
- ✅ Flask에서 React build 정적 파일 서비스
- ✅ SDS 서버 및 AI 서버 프록시 기능
- ✅ 404 핸들링 및 SPA 대응

---

## 🔗 주요 API 명세

| 기능 | 메서드 | 엔드포인트 |
|------|--------|------------|
| 🔐 로그인 | POST | `/login` |
| 사용자 정보 확인 | GET | `/auth/me` |
| 관심 종목 추가 | POST | `/api/favorite` |
| 관심 종목 삭제 | DELETE | `/api/favorite` |
| 관심 종목 조회 | GET | `/api/favorite` |
| 관심 종목 여부 확인 | GET | `/api/favorite/check?stock_code=005930` |
| 최근 본 종목 추가 | POST | `/api/recent` |
| 최근 본 종목 조회 | GET | `/api/recent` |
| 통합 분석 | GET | `/api/analyze/<country>/<ticker>/<stock_name>` |
| 가격 분석만 | GET | `/api/analyze-price/<country>/<ticker>/<stock_name>` |
| 메인 뉴스 캐시 | GET | `/api/get_main_news` |
| 헬스 체크 | GET | `/api/hello` |
| React 페이지 제공 | GET | `/` |
| 외부 API 프록시 | GET/POST | `/api/<path>` |
| 뉴스 요약 프록시 | GET/POST | `/ai/<path>` |

---

## 🗄️ DB 테이블 요약

**users**
- id (PK), google_id, email, name, profile_img, created_at

**favorite_stocks**
- user_id (PK, FK), favorite_list (CSV 문자열)

**recent_stocks**
- user_id (PK, FK), recent_list (CSV 문자열)

---

## 📎 비고

- React 앱은 `../react/build`에서 서빙됨
- JWT 인증은 모든 민감 API에 적용됨
- `.env`는 Git에 포함시키지 않도록 주의할 것

---

**담당 개발자: 강지모**
