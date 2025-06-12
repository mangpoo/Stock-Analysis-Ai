# 📊 MySQL DB 구조 설명 (userdb)

이 문서는 `myapp_db` 데이터베이스의 테이블 구조를 설명합니다.  
협업자들이 DB 구조를 쉽게 이해하고 동일한 환경을 재현할 수 있도록 작성되었습니다.

---

## 🧑‍💼 users 테이블

사용자 정보를 저장하는 테이블입니다.

| 컬럼명      | 자료형         | 제약조건                | 설명              |
|-------------|----------------|--------------------------|-------------------|
| id          | INT            | PRIMARY KEY, AUTO_INCREMENT | 사용자 고유 ID     |
| google_id   | VARCHAR(255)   | UNIQUE                   | 구글 로그인 ID     |
| email       | VARCHAR(255)   | NOT NULL, UNIQUE         | 사용자 이메일      |
| name        | VARCHAR(255)   |                          | 사용자 이름        |
| profile_img | TEXT           |                          | 프로필 이미지 URL  |
| created_at  | TIMESTAMP      | DEFAULT CURRENT_TIMESTAMP | 생성 시각         |

---


## ⭐ favorite_stocks 테이블

사용자가 관심 종목으로 등록한 주식을 저장합니다.  
현재는 여러 종목을 쉼표(,)로 구분하여 `favorite_list` 문자열로 저장합니다.

| 컬럼명        | 자료형      | 제약조건                          | 설명                      |
|---------------|-------------|------------------------------------|---------------------------|
| user_id       | INT         | PRIMARY KEY, 외래키 (users.id)    | 사용자 ID                 |
| favorite_list | TEXT        |                                    | 관심 종목 목록 (CSV 형태) |



## 🕓 recent_stocks 테이블

사용자가 최근에 본 종목을 기록합니다.  
최신 순으로 최대 10개 종목이 쉼표(,)로 구분된 `recent_list`로 저장됩니다.

| 컬럼명       | 자료형      | 제약조건                          | 설명                      |
|--------------|-------------|------------------------------------|---------------------------|
| user_id      | INT         | PRIMARY KEY, 외래키 (users.id)    | 사용자 ID                 |
| recent_list  | TEXT        |                                    | 최근 본 종목 목록 (CSV 형태) |


사용자가 최근에 본 종목을 기록합니다.

| 컬럼명     | 자료형       | 제약조건                          | 설명                   |
|------------|--------------|------------------------------------|------------------------|
| id         | INT          | PRIMARY KEY, AUTO_INCREMENT        | 고유 번호               |
| user_id    | INT          | FOREIGN KEY → users(id), NOT NULL | 사용자 ID (외래키)     |
| stock_code | VARCHAR(20)  |                                    | 종목 코드               |
| viewed_at  | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP          | 조회 시각               |

---

## 🔁 외래키 관계

- `favorite_stocks.user_id` → `users.id`
- `recent_stocks.user_id` → `users.id`
- **ON DELETE CASCADE**로 설정되어 있어, 사용자가 삭제되면 해당 사용자 관련 기록도 같이 삭제됩니다.

---


## 📦 테이블 요약

| 테이블명         | 설명                                |
|------------------|-------------------------------------|
| users            | 사용자 기본 정보                    |
| favorite_stocks  | 관심 주식 목록 (CSV 문자열로 저장) |
| recent_stocks    | 최근 본 주식 목록 (CSV 문자열로 저장) |


## 🛠 변경된 DB 설계 요약 (2025.06 기준)

- `favorite_stocks` 및 `recent_stocks`는 더 이상 `stock_code`를 개별 행으로 저장하지 않고, **`favorite_list`, `recent_list` 필드에 CSV 문자열** 형태로 저장합니다.
- API에서도 이 구조에 따라 REPLACE INTO를 활용해 한 번에 목록 전체를 갱신합니다.


## 💡 참고

- 데이터베이스는 `utf8mb4` 문자셋과 `utf8mb4_0900_ai_ci` 정렬 방식 사용
- `AUTO_INCREMENT`는 각 테이블의 기본 키에 사용됨
---

# 🌐 Flask API 명세

Flask 서버에서 제공하는 종목 관련 API 명세입니다. JWT 인증이 필요하며, 모든 요청은 HTTPS를 통해 처리됩니다.

## 🔐 공통 요청 헤더

```
Authorization: Bearer <JWT토큰>
Content-Type: application/json
```

---

## ✅ API 목록

| 번호 | 기능 설명             | HTTP 메서드 | 엔드포인트   | 요청 바디 예시 |
|------|----------------------|-------------|--------------|----------------|
| 1-1  | 최근 본 종목 추가     | POST        | `/recent`    | `{ "stock_code": "005930" }` |
| 2-1  | 관심 종목 추가        | POST        | `/favorite`  | `{ "stock_code": "035720" }` |
| 2-2  | 관심 종목 삭제        | DELETE      | `/favorite`  | `{ "stock_code": "035720" }` |
| 3-1  | 최근 본 종목 조회     | GET         | `/recent`    | (요청 바디 없음) |
| 3-2  | 관심 종목 조회        | GET         | `/favorite`  | (요청 바디 없음) |

---


## 📦 요청 예시 (curl)

### 1-1. 최근 본 종목 추가
```bash
curl -X POST https://ddolddol2.duckdns.org/api/recent \
-H "Authorization: Bearer <JWT토큰>" \
-H "Content-Type: application/json" \
-d '{"stock_code": "005930"}'
```

### 2-1. 관심 종목 추가
```bash
curl -X POST https://ddolddol2.duckdns.org/api/favorite \
-H "Authorization: Bearer <JWT토큰>" \
-H "Content-Type: application/json" \
-d '{"stock_code": "035720"}'
```

### 2-2. 관심 종목 삭제
```bash
curl -X DELETE https://ddolddol2.duckdns.org/api/favorite \
-H "Authorization: Bearer <JWT토큰>" \
-H "Content-Type: application/json" \
-d '{"stock_code": "035720"}'
```

### 2-3. 관심 종목 여부 확인
```bash
curl -X GET "https://ddolddol2.duckdns.org/api/favorite/check?stock_code=035720" \
-H "Authorization: Bearer <JWT토큰>"
```

### 3-1. 최근 본 종목 조회
```bash
curl -X GET https://ddolddol2.duckdns.org/api/recent \
-H "Authorization: Bearer <JWT토큰>"
```

### 3-2. 관심 종목 조회
```bash
curl -X GET https://ddolddol2.duckdns.org/api/favorite \
-H "Authorization: Bearer <JWT토큰>"
```

### 1-1. 최근 본 종목 추가
```bash
curl -X POST https://ddolddol2.duckdns.org/api/recent \
-H "Authorization: Bearer <JWT토큰>" \
-H "Content-Type: application/json" \
-d '{"stock_code": "005930"}'
```

### 2-1. 관심 종목 추가
```bash
curl -X POST https://ddolddol2.duckdns.org/api/favorite \
-H "Authorization: Bearer <JWT토큰>" \
-H "Content-Type: application/json" \
-d '{"stock_code": "035720"}'
```

### 2-2. 관심 종목 삭제
```bash
curl -X DELETE https://ddolddol2.duckdns.org/favorite \
-H "Authorization: Bearer <JWT토큰>" \
-H "Content-Type: application/json" \
-d '{"stock_code": "035720"}'
```

### 3-1. 최근 본 종목 조회
```bash
curl -X GET https://ddolddol2.duckdns.org/recent \
-H "Authorization: Bearer <JWT토큰>"
```

### 3-2. 관심 종목 조회
```bash
curl -X GET https://ddolddol2.duckdns.org/favorite \
-H "Authorization: Bearer <JWT토큰>"
```
