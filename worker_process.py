from workerClass import Worker
from multiprocessing import Process, Queue
from flask import Flask, request, jsonify, render_template, Response
from flask_cors import CORS
import threading


# 로그서버
def create_flask_app(worker_id):
    worker_stream_queue = Queue()
    app = Flask(f"worker_{worker_id}")
    CORS(app)
    
    import logging
    log_setObj = logging.getLogger('werkzeug')
    log_setObj.setLevel(logging.ERROR)
    
    @app.route("/")
    def index():
        # HTML 템플릿 (인라인으로 정의)
        return render_template("index.html", worker_id=worker_id)

    @app.route('/stream')
    def stream():
        def event_stream():
            while True:
                message = worker_stream_queue.get()
                if("\n" in message):
                    message = message.replace("\n", "<br>")
                yield f"data: {message}\n\n"
        return Response(event_stream(), content_type='text/event-stream')
    
    return app, worker_stream_queue

def run_flask_server(app, port):
    app.run("0.0.0.0", port = port, debug = False)


def worker_loop(task_queue, worker_id, parent_log_queue):
    """각 워커 프로세스의 메인 루프"""
    
    # log stream 서버 생성
    app, worker_stream_queue = create_flask_app(worker_id=worker_id)
    port = 8000 + worker_id
    flask_thread = threading.Thread(target=run_flask_server, args=(app, port), daemon=True)
    flask_thread.start() # log stream 서버 스레드 시작
    

    # gemma worker 생성
    worker = Worker(worker_id=worker_id, worker_log=worker_stream_queue)
    print(f"\033[{31 + worker_id % 6}m[Worker {worker_id}]\033[0m: 준비 완료. 작업 대기 중...")

    while True:
        try:
            # 큐에서 작업 가져오기
            id = task_queue.get()
            print(f"\033[{31 + worker_id % 6}m[Worker {worker_id}]\033[0m: 새 작업 받음")

            # 테스트용 코드
            # 크롤링이 여기서 수행되고 worker.summarize()함수를 통해 요약이 시작
            # 이후 디렉터리에 저장한다.
            f = open(f"temp/{id}.txt", 'r') # for test
            txt = f.read() # for test
            f.close() # for test
            
            # 작업 처리
            result = worker.summarize(txt) # 요약
            
            #저장
            f = open(f"summarized_articles/{id}.txt", 'w')
            f.write(result)
            f.close()
            #####



        except Exception as e:
            print(f"\033[{31 + worker_id % 6}m[Worker {worker_id}]\033[0m: 오류 발생: {e}")
