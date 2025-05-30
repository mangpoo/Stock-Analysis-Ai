# 📊 MySQL DB 구조 설명 (myapp_db)

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

| 컬럼명     | 자료형       | 제약조건                          | 설명                   |
|------------|--------------|------------------------------------|------------------------|
| id         | INT          | PRIMARY KEY, AUTO_INCREMENT        | 고유 번호               |
| user_id    | INT          | FOREIGN KEY → users(id), NOT NULL | 사용자 ID (외래키)     |
| stock_code | VARCHAR(20)  |                                    | 주식 코드               |
| added_at   | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP          | 관심 종목 등록 시각     |
| 제약조건   |              | UNIQUE(user_id, stock_code)        | 중복 등록 방지          |

---

## 🕓 recent_stocks 테이블

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

| 테이블명         | 설명                           |
|------------------|--------------------------------|
| users            | 사용자 기본 정보               |
| favorite_stocks  | 관심 주식 정보                 |
| recent_stocks    | 최근 본 주식 기록              |

---

## 💡 참고

- 데이터베이스는 `utf8mb4` 문자셋과 `utf8mb4_0900_ai_ci` 정렬 방식 사용
- `AUTO_INCREMENT`는 각 테이블의 기본 키에 사용됨
