# 뉴스 요약 서버

Flask 기반 뉴스 요약 서버. 여러 개의 워커 프로세스를 사용해 텍스트 요약을 병렬로 처리합니다.

---

## 주요 기능

- `/crawler`: 요약 요청 (현재는 랜덤 ID로, 나중에는 크롤링을 위해 `/crawler/<id>` 형식으로 확장)
- `/workers/status`: 워커 상태 확인
- `/workers/restart`: 워커 재시작

---


## 프로젝트 구조

```
프로젝트 루트
├── server.py               # Flask 웹 서버 및 워커 프로세스 관리
├── worker_process.py       # 각 워커 프로세스가 하는 일 정의 (작업 루프)
├── workerClass.py          # 텍스트 요약 로직이 들어있는 클래스
├── summarized_articles/    # 요약된 결과들이 저장되는 폴더
├── temp/                   # 임시 원문 텍스트 파일들 저장 위치 - 테스트용
├── requirements.txt        # 필요한 라이브러리 목록
└── README.md               # 이 설명 파일
```

---

## 동작 설명

### 1. `server.py`: 서버 및 워커 관리의 중심

- Flask 서버의 진입점이며, 모든 HTTP 요청 처리 및 워커 프로세스 관리를 담당합니다.
- 서버 실행 시:
  - `start_worker_pool()` 함수로 `worker_process.py`의 워커들을 실행합니다.
  - 종료 시 `atexit`을 통해 모든 워커를 정리합니다.
- 주요 라우트:
  - `/crawler`: 랜덤 ID로 요약 요청
  - `/getSummary/<string:id>`: 요약된 json 요청(요약이 완료되어 저장된 경우에)
  - `/workers/status`: 워커 상태 확인
  - `/workers/restart`: 워커 재시작
  - `/monitor` : 워커 들의 상태, 실시간 스트림 및 서버 GPU 상태

    dark
    
    ![Image](https://github.com/user-attachments/assets/2b21ae50-d7c7-4b50-9327-7f82681c669b)
 
    light
    
    ![Image](https://github.com/user-attachments/assets/5545edc4-6e05-4819-a921-812f92e82bb9)

### 2. `worker_process.py`: 워커의 작업 루프 정의

- `worker_loop(task_queue, worker_id)` 함수는 워커 프로세스마다 실행되며, 큐에서 작업을 받아 처리합니다.
- 받은 ID에 대해 `temp/{id}.txt` 파일을 열어 내용을 읽고, 요약한 후 `summarized_articles/{id}.txt`로 저장합니다.
       --차후에는 크롤링을 하여 뉴스 내용을 내용을 읽고, 요약한 후 저장.
- 실제 요약 처리는 `workerClass.py`의 `Worker` 클래스를 통해 수행됩니다.

### 3. `workerClass.py`: 요약 로직 구현

- `Worker` 클래스가 정의되어 있으며, 각 워커는 이 클래스의 인스턴스를 만들어 사용합니다.
- 주로 `summarize()` 메서드 내에서 실제 텍스트 요약 알고리즘이 구현되어 있습니다.

### 4. `summarized_articles/`: 결과 저장소

- 요약이 완료된 파일들은 이 폴더에 `{id}.txt` 형식으로 저장됩니다.
- 동일 ID 요청 시 이미 요약된 경우로 처리되어 중복 요약을 방지합니다.

### 5. `temp/`: 테스트 기사 저장소 (테스트용)

- 각 ID에 해당하는 원문 텍스트 파일들이 저장되어 있는 폴더입니다.
- `worker_process.py`에서 요약 전 원문을 읽어오는 위치입니다.

---

## 기타

- 워커 수는 `app.py`의 `WORKER_COUNT` 값으로 조절할 수 있습니다.
- 워커는 서버 시작 시 자동으로 실행되며, 죽은 워커는 자동으로 감지되어 재시작됩니다.
- 서버 종료 시 모든 워커도 안전하게 종료됩니다.
