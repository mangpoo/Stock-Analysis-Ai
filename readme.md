# 📦 Stock Analysis 웹사이트 호스팅 구성 안내

이 문서는 Stock Analysis 프로젝트의 **전체 호스팅 구성**, 도메인 설정, SSL 인증서 적용 방식, 배포 방법 등을 정리합니다.  
AWS 기반으로 백엔드와 프론트엔드를 통합 배포하고 있으며, RDS 및 외부 서버와의 연동도 포함되어 있습니다.

---

## 🏗️ 전체 호스팅 구조

```
[사용자 브라우저]
        │
        ▼
[https://ddolddol2.duckdns.org] ← 커스텀 도메인 + SSL
        │
        ├── [프론트엔드: React build 정적 파일]
        │     ⤷ Flask의 static 폴더에서 서빙
        │
        └── [백엔드: Flask API 서버 (app.py)]
              ⤷ JWT 인증 / 종목 데이터 처리 / GPT 분석
              ⤷ MySQL RDS 연동
              ⤷ 외부 뉴스 크롤러 및 GPT 서버 프록시
              ⤷ GPT 주가 분석 모듈 (`gpt_analyzer.py`)
```

---

## 🧰 사용된 인프라 구성

| 구성 요소 | 설명 |
|-----------|------|
| EC2 인스턴스 | Ubuntu 22.04, Flask + React 배포 서버 |
| RDS (MySQL) | 사용자 정보 및 종목 정보 저장 |
| DuckDNS | 동적 IP를 위한 도메인 (`ddolddol2.duckdns.org`) |
| Certbot (Let's Encrypt) | HTTPS 인증서 자동 갱신 |
| Flask | 443 포트에서 직접 HTTPS 서비스 (`ssl_context`) |
| UFW | 443 포트만 외부 개방 (보안 강화) |

---

## 🤖 GPT 기반 분석 모듈

- 파일: `gpt_analyzer.py` (또는 비슷한 이름)
- 의존: `openai` 패키지 + `.env` 내 `OPENAI_API_KEY`
- 주요 기능:
  - `analyze_comprehensive`: 주가 데이터 + 뉴스 기반 통합 분석
  - `analyze_price_only`: 주가 데이터만을 기반으로 한 기술적 분석
- 사용 모델: `gpt-4o-mini` (OpenAI)

---

## 🔐 HTTPS 설정

- `cert.pem`, `privkey.pem`은 `/etc/letsencrypt/live/...` 경로에서 발급됨
- Flask는 아래처럼 HTTPS로 직접 실행됨:
```python
app.run(host='0.0.0.0', port=443, ssl_context=('cert.pem', 'privkey.pem'))
```
- cron 또는 Certbot 자동 갱신 설정을 통해 인증서 갱신 유지

---

## 🚀 배포 방식 요약

### 백엔드 (Flask)
- `app.py`를 EC2에서 실행 (가상환경 사용 권장)
- `requirements.txt` 설치 후 `python app.py`

### 프론트엔드 (React)
- 로컬에서 `npm run build`
- EC2에 `/react/build` 폴더를 SCP로 업로드:
```bash
scp -i stockai-keypair.pem -r ./build ubuntu@<EC2-IP>:~/Stock-Analysis-Ai/react
```

### SSL 및 도메인
- DuckDNS 도메인 설정 후
- Certbot을 이용해 `cert.pem`, `privkey.pem` 획득
- Flask에서 직접 HTTPS로 실행

---

## 🧪 테스트 포인트

- ✅ JWT 인증 후 모든 민감 API 접근 테스트
- ✅ `/api/hello`, `/api/recent`, `/api/favorite` 등 정상 응답 여부
- ✅ React 라우팅 테스트 (`/stock/:ticker`)
- ✅ HTTPS 인증 오류 없는지 확인 (브라우저 padlock 🔒 체크)
- ✅ GPT 분석 응답 수신 정상 여부 (`/api/analyze`, `/api/analyze-price`)

---

## 📌 비고

- 프론트와 백엔드 모두 **같은 EC2 서버에서 실행**됨
- 도메인은 `ddolddol2.duckdns.org` 로 통일
- EC2 서버 접근 시 SSH 키(`stockai-keypair.pem`) 필요

---

**작성자: 강지모 (Fancy-Bronze)**
