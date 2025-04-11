# crawler.py
## 설명:
ticker 값을 입력하면 json 형태로 뉴스의 제목, 링크, 콘텐츠, 이미지url 을 반환하는 api.

## 사용방법:
front나 server 에서 ticker 값을 파라미터로 함수를 호출.

---
# app.py
## 설명:
flask 웹서버를 실행하기 위한 기본 파일.
crawler.py 만 연결되어있음, front 와 연동해야함.

## 사용방법:
form 을 통해 유저로부터 input을 입력받고 clawer.py 를 호출하여 값을 json 형태로 출력.

---
# requirements.txt
## 설명:
필요한 pip 패키지 목록들을 정리한 파일.
`pip freeze > requirements.txt` 명령어로 나온 파일.

## 사용방법:
`pip install -r requirements.txt` 명령어를 통해 필요한 패키지들을 버전에 맞게 설치.