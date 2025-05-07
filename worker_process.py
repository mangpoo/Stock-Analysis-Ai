from workerClass import Worker
from workerClass import WorkerLog
from multiprocessing import Process, Queue
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import threading


# 로그서버
def create_flask_app(worker_id, log):
    app = Flask(f"worker_{worker_id}")
    CORS(app)
    
    import logging
    log_setObj = logging.getLogger('werkzeug')
    log_setObj.setLevel(logging.ERROR)
    
    @app.route("/")
    def index():
        # HTML 템플릿 (인라인으로 정의)
        return render_template("index.html", worker_id=worker_id)
    
    @app.route('/get-logs')
    def get_logs():
        current_log = log.get()  # 현재 로그 가져오기
        return jsonify({'log': current_log})
    
    return app

def run_flask_server(app, port):
    app.run("0.0.0.0", port = port, debug = False)






def worker_loop(task_queue, worker_id):
    """각 워커 프로세스의 메인 루프"""
    
    log = WorkerLog() # 생성 문자열 저장
    
    worker = Worker(worker_id=worker_id, worker_log=log)
    print(f"\033[{31 + worker_id % 6}m[Worker {worker_id}]\033[0m: 준비 완료. 작업 대기 중...")
    
    ###
    app = create_flask_app(worker_id=worker_id,log=log)
    port = 8000 + worker_id

    flask_thread = threading.Thread(target=run_flask_server, args=(app, port), daemon=True)
    flask_thread.start()
    ###


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
            
            f = open(f"summarized_articles/{id}.txt", 'w')
            f.write(result)
            f.close()
            #####



        except Exception as e:
            print(f"\033[{31 + worker_id % 6}m[Worker {worker_id}]\033[0m: 오류 발생: {e}")
