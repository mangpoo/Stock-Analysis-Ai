# stock_json_server

주식 종목 검색 및 가격 데이터를 JSON 또는 차트 형식으로 제공하는 간단한 Flask 기반 API 서버입니다.

## 실행 방법

```bash
python server.py
```

서버는 기본적으로 `http://localhost:5000`에서 실행됩니다.

---

## API 설명

### 1. 주식 검색 (JSON 반환)

```
GET /find/문자열
```

예시  
```
http://localhost:5000/find/삼성  
http://localhost:5000/find/Samsung
```

한국어 또는 영어 종목명을 검색하면 관련 주식 정보를 JSON으로 반환합니다.

---
### 2. 주식 로고, 국가 이미지

```
GET /logo/<country>/
GET /logo/<country>/<ticker>
```

예시  
```
http://localhost:5000/logo/kr
http://localhost:5000/logo/us

http://localhost:5000/logo/kr/005930  
http://localhost:5000/logo/us/INTC
```

해당 티커의 이미지를 반환합니다.
만일 이미지가 없는 경우 해당 국가의 기본 이미지를 반환합니다.(현재 미국 주식 로고만 존재)
티커의 입력이 없으면 해당 국가의 기본 이미지를 반환합니다.

---

### 3. 주가 데이터 조회 (JSON 반환)

```
GET /<country>/<ticker>/<fromDate>/<toDate>
```

- `country`: kr 또는 us  
- `fromDate`, `toDate`: YYYYMMDD 형식

예시  
```
http://localhost:5000/kr/005930/20230101/20241231  
http://localhost:5000/us/AAPL/20230101/20241231
```

지정한 기간의 일별 주가 데이터를 JSON으로 반환합니다.

---

### 4. 주가 차트 (HTML 시각화)

```
GET /chart/<country>/<ticker>/<fromDate>/<toDate>
```

예시  
```
http://localhost:5000/chart/kr/005930/20230101/20241231  
http://localhost:5000/chart/us/GOOGL/20220101/20240101
```

캔들차트와 이동평균선(50일, 200일)이 포함된 HTML 차트를 반환합니다. iFrame 삽입이 가능합니다.

---

## 주요 파일 구조

- `server.py`: 서버 실행 파일
- `searcher.py`: 주식 검색 및 DB 쿼리 처리
- `stockInfo.db`: 로컬 SQLite 주식 데이터베이스
- `templates/chart.html`: HTML 차트 페이지
- `tester.html`: iframe 적용 테스터

---
