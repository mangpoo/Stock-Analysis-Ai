# 📈 AI 기반 주식 분석 대시보드 [똘똘이]

AI를 활용하여 복잡한 주식 정보를 시각화하고, 투자 결정에 도움을 주는 웹 기반 대시보드입니다.


사용자는 국내/해외 주식을 검색하고, 실시간 차트와 함께 AI가 요약한 최신 뉴스, 기술적 분석 리포트를 받아볼 수 있습니다.



# ✨ 주요 기능 (Features)

🔍 통합 검색: 국내 (KR) 및 미국 (US) 주식 정보를 실시간으로 검색합니다.

📊 차트: 사용자가 원하는 기간의 주가 정보를 담은 동적 차트를 제공하며, 50일/200일 이동평균선을 시각화합니다.

🤖 AI 차트 분석: 차트의 주요 패턴과 기술적 지표를 AI가 분석하여 매수/매도 전략 수립에 필요한 인사이트를 제공합니다.

📰 AI 뉴스 요약: 선택한 종목의 최신 뉴스를 크롤링하고, AI가 핵심 이슈와 시장 영향을 요약하여 제공합니다.

💡 AI 통합 분석: 차트, 뉴스 등 다양한 데이터를 종합적으로 분석하여 최종 투자 결정을 위한 리포트를 생성합니다.

👤 사용자 기능: 구글 계정을 통한 소셜 로그인을 지원하며, 관심 종목을 등록하고 관리하는 '찜하기' 기능과 최근 본 기능을 제공합니다.

⚡ 실시간 뉴스 피드: 메인 화면에서 주요 경제 뉴스를 실시간으로 확인할 수 있습니다.



# 🛠️ 기술 스택 (Tech Stack)

Frontend: React.js

State Management: React Hooks (useState, useEffect)

Backend: Python(pykrx, yfinance, Flask, Huggingface.transformer), AWS_EC2, AWS_RDS, Naver_Article_api, OpenApi_GPT

Database: MySQL(AWS_RDS)

Authentication: Google OAuth 2.0, JWT (JSON Web Token)

Deployment: AWS

