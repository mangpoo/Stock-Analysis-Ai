
# 🧠 Stock Analysis AI (AWS-EC2 호스팅 관련 README)

**AI 기반 실시간 주식 정보 분석 웹서비스**

한국 및 미국 주식 데이터를 기반으로 종목 검색, 실시간 시세, 관심 종목/최근 종목 관리,  
기술적 차트(50일/200일 이동평균선), AI 분석 기능까지 제공하는 올인원 플랫폼입니다.  
AWS EC2에서 **HTTPS 프로토콜**로 호스팅되며, **GPT 기반 투자 분석기** 및 뉴스 크롤러도 포함된 고급 구성입니다.

---

## 🌐 서비스 주소

👉 [https://ddolddol2.duckdns.org](https://ddolddol2.duckdns.org)

---

## 📁 프로젝트 구조

```
Stock-Analysis-Ai/
├── backend/         # Flask 백엔드 서버 및 AI 분석기
│   ├── app.py       # 서버 진입점
│   ├── gpt_analyzer.py  # GPT 기반 AI 분석 모듈
│   ├── main_news_crawler.py  # 뉴스 크롤러
│   ├── cert.pem     # HTTPS 인증서 (Flask 자체 서버용)
│   ├── .env         # 환경변수 (DB 정보, 시크릿키 등)
│   └── requirements.txt
│
├── react/           # React 프론트엔드 (빌드 포함)
│   ├── build/       # EC2 배포용 정적 파일
│   └── src/         # 실제 프론트 소스코드
│       ├── ChartSection.jsx
│       ├── AppLayout.jsx
│       └── ...
└── .git/            # Git 버전 관리 폴더
```

---

## 🚀 주요 기능 요약

### ✅ 사용자 기능
- 구글 로그인 + JWT 토큰 기반 인증
- 관심 종목 등록/삭제
- 최근 본 종목 자동 저장
- 종목 검색 자동완성
- 한국/미국 시장별 정렬 및 페이징
- 종목별 최신 뉴스 제공

### 📈 차트 기능
- 50일, 200일 이동평균선 표시
- 거래량 표시
- 종목 로고 및 이름 표시

### 🧠 AI 분석 기능
- GPT 기반 투자 분석 (예측 가격, 투자 의견, 리스크 등)
- Flask에서 GPT 분석 결과를 실시간으로 반환
- 종목 상세 페이지 하단에 카드 형태로 표시

### 📰 뉴스 크롤링
- Python 스크립트로 주요 뉴스 자동 수집
- React에서 최신 뉴스 제목 및 링크 표시

---

## 🔐 인증 흐름

1. 사용자가 구글 로그인
2. Flask 서버에서 JWT 발급
3. React가 로컬에 JWT 저장
4. 인증 필요한 API 요청 시 `Authorization: Bearer <token>` 사용

---

## 🖥️ 로컬 개발 실행법

### 1. 백엔드 실행

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# .env 파일 작성 필수 (예: MySQL 정보, JWT_SECRET 등)
python app.py
```

### 2. 프론트엔드 실행

```bash
cd react
npm install
npm start
```

### 3. 프로덕션 배포 (빌드 + 업로드)

```bash
cd react
npm run build

# EC2로 업로드
scp -i "stockai-keypair.pem" -r build/ ubuntu@your-ec2-address:~/Stock-Analysis-Ai/react/
```

---

## ⚙️ AWS 배포 환경

| 구성 항목      | 내용                                  |
|---------------|---------------------------------------|
| EC2 인스턴스   | Ubuntu 20.04 LTS                       |
| 백엔드        | Flask + Gunicorn                       |
| 프론트엔드    | React 빌드 후 정적 파일로 서빙         |
| 인증          | JWT, Google OAuth 2.0                  |
| HTTPS         | Flask 자체 인증서(cert.pem) 사용 중     |
| DB            | MySQL (로컬 또는 AWS RDS)              |
| 도메인        | ddolddol2.duckdns.org (DuckDNS 사용)   |

> ⚠️ 현재는 Flask에서 자체 HTTPS 인증서를 사용 중이며,  
> 향후 Nginx + Let's Encrypt(Certbot)를 통한 보안 강화를 권장합니다.

> ⚠️ `.env` 파일에는 민감한 정보가 포함되므로 반드시 `.gitignore`에 추가해 Git에 포함되지 않도록 주의해야 합니다.

---

## 📂 주요 파일 설명

### `backend/app.py`
- 전체 API 라우팅 및 JWT 인증
- `/api/favorite`, `/api/recent`, `/api/search` 등 엔드포인트 제공

### `backend/gpt_analyzer.py`
- 종목에 대한 AI 분석 텍스트 생성 (OpenAI 연동 예상)

### `backend/main_news_crawler.py`
- 뉴스 크롤링 스크립트
- 최신 기사들을 `build/news/latest.json`에 저장

### `react/src/ChartSection.jsx`
- 주식 차트 및 AI 분석 결과 카드 표시

### `react/src/config.js`
- API 서버 주소 및 엔드포인트 관리

---

## 🙋 팀 정보

**6조 팀원**
- 강민준  
- 강지모  
- 김승운  
- 최혁  
- 유건우

---

## 📝 라이선스

본 프로젝트는 교육 및 포트폴리오 용도로만 사용되며,  
모든 코드 및 리소스는 팀원 소유이며 상업적 사용을 금합니다.

---

## 📢 발표 시나리오 기반 설명

### 🔍 종목 검색
- 사용자가 검색창에 '삼성' 입력 시,  
  '삼성전자', '삼성SDI' 등 관련 종목을 실시간으로 자동완성 결과로 제공합니다.
- 검색된 종목을 클릭하면 **상세 페이지로 이동**합니다.

### 🔑 로그인 및 인증
- **Google OAuth 2.0 연동**을 통해 간편하게 로그인할 수 있습니다.
- 로그인 후에는 JWT 토큰이 발급되어,  
  사용자의 인증 상태를 유지하며 보안이 보장됩니다.

### ⭐ 관심 종목 및 최근 본 종목
- 로그인한 유저는 관심 종목을 등록하거나 삭제할 수 있습니다.  
- 종목 상세 페이지에 방문하면 **최근 본 종목에 자동 기록**됩니다.
- 이 정보는 모두 **MySQL DB에 저장되어 유지**됩니다.

### 📊 메인 화면 기능
- 한국/미국 주식 시장을 선택 버튼으로 전환할 수 있습니다.
- 상승/하락 종목을 정렬하고, **페이지네이션으로 탐색**할 수 있습니다.
- 각 종목에 대한 **최신 뉴스 제목**이 함께 표시되며,  
  클릭 시 **실제 기사로 이동**할 수 있습니다.

### 📈 종목 상세 페이지
- 클릭한 종목의 차트와 분석 정보를 확인할 수 있습니다.
- 차트에는 다음과 같은 기술적 지표가 표시됩니다:
  - **50일 이동평균선 (50 SMA)**
  - **200일 이동평균선 (200 SMA)**
  - 거래량 (Volume)
- 종목명, 로고, 기본 정보도 함께 제공됩니다.

### 🤖 AI 분석 기능
- 종목에 대한 **AI 기반 분석 카드 3개**가 출력됩니다:
  1. 예측 가격  
  2. 투자 의견  
  3. 리스크 분석  
- 이 정보는 Flask에서 GPT 기반 분석기로 처리된 결과이며,  
  사용자에게 실질적인 투자 인사이트를 제공합니다.

### 🧪 기술적 디테일
- 프론트엔드는 React로 구성되어 있으며, Chart.js 기반 차트를 커스터마이징했습니다.
- 백엔드는 Flask로 구성되어 있고, JWT 기반 인증과 MySQL 연동을 구현했습니다.
- AI 분석은 별도 모듈(`gpt_analyzer.py`)을 통해 처리됩니다.
- 뉴스는 `main_news_crawler.py`로 자동 크롤링되어 저장됩니다.
- 프론트엔드 빌드는 `/react/build`에 존재하며, EC2에서 직접 서빙됩니다.

### ✅ 기대 효과
- 투자자들은 이 서비스를 통해 **정보 수집, 기술 분석, AI 예측**을  
  한 번에 경험할 수 있어 실질적인 투자 판단에 큰 도움이 됩니다.
- AWS 기반으로 구성되어 있어 **언제 어디서든 안정적으로 이용** 가능합니다.


### 🙋 호스팅 파트 담당자
 - 강지모 (Fancy_Bronze)
