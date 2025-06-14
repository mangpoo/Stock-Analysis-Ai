# 📦 Flask Backend for Stock Analysis App

이 백엔드는 Flask 프레임워크 기반으로 제작된 주식 분석 웹사이트 백엔드입니다.  
Google 로그인, JWT 인증, MySQL RDS 연동, 종목 데이터 API, 뉴스 요약, GPT 기반 통합 분석 기능을 제공합니다.

---

## 📁 주요 파일 구성

| 파일/폴더명 | 설명 |
|-------------|------|
| `app.py` | Flask 백엔드의 메인 진입점, 라우팅 및 DB 연동 관리 |
| `gpt_analyzer.py` | OpenAI GPT API 호출로 주식 분석 수행 |
| `main_news_crawler.py` | 뉴스 크롤링 및 저장 처리 (`news/YYYYMMDD/` 폴더에 저장) |
| `news/` | 날짜별 뉴스 결과 저장 폴더 (크롤링된 JSON 형식) |
| `backup/` | 주요 코드 백업 폴더 (`.backup` 파일 포함) |
| `cert.pem` | HTTPS를 위한 인증서 파일 |
| `.env` | 환경변수 파일 (DB 정보, API 키, 비밀 키 등) |
| `requirements.txt` | 필요한 Python 패키지 목록 |

---

## 🚀 기능 요약

- ✅ Google OAuth 로그인 및 JWT 인증 처리  
- ✅ 사용자 정보 MySQL 저장 및 중복 시 갱신  
- ✅ JWT 기반 사용자 인증 확인 API (`/auth/me`)  
- ✅ 관심 종목: 추가 / 삭제 / 전체 조회 / 특정 종목 찜 여부 확인  
- ✅ 최근 본 종목: 최대 10개까지 기록, 중복 제거, 순서 유지  
- ✅ 주가 데이터 + 뉴스 + GPT 요약 통합 분석 API (`/api/analyze/...`)  
- ✅ 가격 분석 전용 API (`/api/analyze-price/...`)  
- ✅ 메인 뉴스 캐시 제공 API (`/api/get_main_news`)  
- ✅ React 정적 페이지 (`/`) 서빙 (build 폴더)  
- ✅ SDS 서버 및 AI 분석기 서버로의 요청을 백엔드에서 프록시 처리  
- ✅ SPA를 위한 404 라우팅 처리 및 CORS 구성 완료  

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
| 통합 분석 (GPT 포함) | GET | `/api/analyze/<country>/<ticker>/<stock_name>` |
| 가격 분석만 | GET | `/api/analyze-price/<country>/<ticker>/<stock_name>` |
| 메인 뉴스 캐시 | GET | `/api/get_main_news` |
| 헬스 체크 | GET | `/api/hello` |
| React 페이지 제공 | GET | `/` |
| 외부 API 프록시 | GET/POST | `/api/<path>` |
| 뉴스 요약 프록시 | GET/POST | `/ai/<path>` |

---

## 🗄️ DB 테이블 요약

### `users`
- `id` (PK), `google_id`, `email`, `name`, `profile_img`, `created_at`

### `favorite_stocks`
- `user_id` (PK, FK), `favorite_list` (문자열로 저장된 종목 코드 목록, 쉼표로 구분)

### `recent_stocks`
- `user_id` (PK, FK), `stock_code`, `added_at`  
> 💡 최근 테이블은 CSV 문자열이 아닌, 개별 행으로 저장됨

---

## 📌 비고

- React 앱은 `../react/build`에서 정적으로 제공됨  
- JWT 토큰은 모든 민감 API 호출 시 `Authorization: Bearer <token>`으로 필요  
- `.env`는 Git에 절대 포함시키지 말 것 (보안 이슈 주의)

---

**담당 개발자: 강지모**
