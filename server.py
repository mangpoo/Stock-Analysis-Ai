import time
import os
import signal
import subprocess
from multiprocessing import Queue, Process
from flask import Flask, jsonify, request, Response, render_template, render_template_string
from flask_cors import CORS
import random
import atexit
import json
from _thread import *
from worker_process import worker_loop
from workerClass import *
from ansi2html import Ansi2HTMLConverter

SUMARTICLE_PATH = "summarized_articles/" # 요약 기사 저장소
FORCED_SUMMARIZING = True # 캐쉬 혹은 저장 여부 상관 없이 요약 시도 - 테스트용
WORKER_COUNT = 3  # 워커 프로세스 수를 여기에 설정



# import logging # flask log off
# log_setObj = logging.getLogger('werkzeug')
# log_setObj.setLevel(logging.ERROR)


log_queue = Queue() # for /stream
class StreamInterceptor:
    def __init__(self, original):
        self.original = original

    def write(self, message):
        if message.strip():  # 빈 줄 제외
            log_queue.put(message)
        self.original.write(message)  # 콘솔에도 그대로 출력

    def flush(self):
        self.original.flush()

sys.stdout = StreamInterceptor(sys.stdout)
sys.stderr = StreamInterceptor(sys.stderr)
conv = Ansi2HTMLConverter(inline=True) # ansi to html 컨버터 -- 색상표현을 위함





app = Flask("__name__") # 메인 flask 서버
CORS(app)

# 작업 큐
task_q = Queue() # id가 들어가고 worker_loop에서 처리됨
worker_processes = [] # 워커 프로세스 목록

already_summarized_id_list = list() # 이미 요약된 id 저장
if("summarized_articles" not in os.listdir()): os.mkdir("summarized_articles") # sum_articles 디렉터리 생성

def already_summarized_id_list_checker_thread():
    # already_summarized_id_list <- 현재 작업중인 id를 가진 캐쉬
    # 이를 작업이 완료된 id가 있는 경우 제거하여 업데이트
    while(True):
        lst = os.listdir(SUMARTICLE_PATH)
        updated = False
        try:
            for id in already_summarized_id_list:
                if(f"{id}.txt" in lst):
                    already_summarized_id_list.remove(id)
                    updated = True
                    break
        except Exception as e:
            # print("cache update Exception")
            continue

        if(updated): print(f"===== cache updated {already_summarized_id_list} =====")
        time.sleep(0.2)


# 워커 종료 함수
def terminate_workers():
    print("종료 중... 모든 워커 프로세스를 정리합니다.")
    for p in worker_processes:
        if p.is_alive():
            print(f"워커 프로세스 {p.pid} 종료 중...")
            p.terminate()
            p.join(timeout=1)
    print("모든 워커 종료됨")

# 워커 풀 시작 함수
def start_worker_pool():
    global worker_processes
    
    # 이미 실행 중인 워커 프로세스가 있으면 종료
    if worker_processes:
        terminate_workers()
        worker_processes = []
        
    # 지정된 수의 워커 프로세스 시작
    for i in range(WORKER_COUNT):
        print(f"워커 프로세스 #{i+1} 시작 중...")
        p = Process(target=worker_loop, args=(task_q, i, log_queue))  # 워커 ID 전달
        p.daemon = True  # 메인 프로세스 종료 시 함께 종료되도록 설정
        p.start()
        worker_processes.append(p)
        print(f"워커 프로세스 #{i+1} 시작됨 (PID: {p.pid})")
    
    print(f"총 {len(worker_processes)}개의 워커 프로세스가 실행 중입니다.")

# 워커 상태 확인 함수
def check_workers_health():
    global worker_processes
    
    # 죽은 워커 프로세스 확인 및 재시작
    for i, p in enumerate(worker_processes):
        if not p.is_alive():
            print(f"워커 프로세스 #{i+1} (PID: {p.pid})가 죽었습니다. 재시작합니다.")
            new_p = Process(target=worker_loop, args=(task_q, i))  # 워커 ID 전달
            new_p.daemon = True
            new_p.start()
            worker_processes[i] = new_p
            print(f"워커 프로세스 #{i+1} 재시작됨 (새 PID: {new_p.pid})")
    
    return len([p for p in worker_processes if p.is_alive()])

    
### FLASK

#### worker process & crawling 시작점
# task_q에 id를 넣고 작업을 요청한 자에게 현 상태를 json 형태로 return한다.
def worker_process_start(id, active_workers):
    try:
        print(f"===== work_id : {id} -- started =====") 
        already_summarized_id_list.append(id) # id 추가
        task_q.put(id)
        return jsonify({"status": "started", "active_workers": active_workers, "file": f"temp/{id}.txt"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

# 크롤링 및 요약을 요청하는 라우트
@app.route("/crawler", methods=['GET'])
def crawlingAndSave():
    # 워커 상태 확인
    active_workers = check_workers_health()
    if active_workers < WORKER_COUNT:
        print(f"경고: {WORKER_COUNT}개 중 {active_workers}개의 워커만 활성화되어 있습니다.")
    
    id = random.randint(1, 5)

    if(not FORCED_SUMMARIZING): # 테스트중이 아니면
        if(f"{id}.txt" in os.listdir("summarized_articles")): # 디렉터리에 저장된 요약이 있는 경우
            return jsonify({"status" : "already_exist"})
        elif(id in already_summarized_id_list): # 이미 서버가 동작한 이후 요약한 id인 경우(아마 요약중일때)
            return jsonify({"status" : "may be summarizing..."})
        else: # 디렉터리에 저장된 요약이 없다면 크롤링 및 요약을 시도한다.
            return worker_process_start(id, active_workers)
        

    else: # 테스트는 반드시 요약시도
        return worker_process_start(id, active_workers)
### //


# 저장소에 저장된 요약된 기사를 요청하는 라우트
@app.route("/getSummary/<string:id>", methods=['GET'])
def getSummary(id):
    sumFile = f"{id}.txt"
    
    if(sumFile in os.listdir(SUMARTICLE_PATH)):
        f = open(SUMARTICLE_PATH + sumFile)
        json_txt = f.read()
        f.close()
        dct = json.loads(json_txt)
        return jsonify(dct)
    elif(id in already_summarized_id_list):
        return jsonify({"status" : "may be summarizing"})
    else:
        return jsonify({"status" : "Unknown Id, plz use crawling"})


# 각 worker의 상태를 리턴
@app.route("/workers/status", methods=['GET'])
def worker_status():
    active_workers = check_workers_health()
    return jsonify({
        "total_workers": WORKER_COUNT,
        "active_workers": active_workers,
        "worker_pids": [p.pid for p in worker_processes if p.is_alive()]
    })


# worker 강제 재시작하는 라우트 get 요청시 worker가 초기화 된다.
@app.route("/workers/restart", methods=['GET'])
def restart_workers():
    start_worker_pool()
    return jsonify({"status": "success", "message": f"{WORKER_COUNT}개의 워커 프로세스가 재시작되었습니다."})



@app.route("/gpu/status")
def gpu_status():
    try:
        output = subprocess.check_output(["rocm-smi"], text=True)
        lines = output.splitlines()

        # 본문 데이터 줄만 추출 (표의 헤더 아래에 있는 라인)
        data_lines = [line for line in lines if line.strip().startswith("0")]  # GPU ID가 0부터 시작

        cols = data_lines[0].split()

        parsed = []
        parsed.append({
            "Device": cols[0],
            "Temp": cols[4],
            "Power": cols[5],
            "SCLK": cols[9],
            "MCLK": cols[10],
            "Fan": cols[11],
            "VRAM%": cols[14],
            "GPU%": cols[-1]
        })

        return jsonify(parsed)

    except Exception as e:
        return jsonify({"error": str(e)})

###
@app.route('/')
def index():
    return render_template_string("""
    <html>
    <head><title>실시간 로그 보기</title></head>
    <body>
        <h2>실시간 로그</h2>
        <div id="log" style="white-space: pre-wrap; font-family: monospace;"></div>
        <script>
            const evtSource = new EventSource("/stream");
            evtSource.onmessage = e => {
                document.getElementById("log").innerHTML += e.data + "<br>";
            };
        </script>
    </body>
    </html>
    """)

@app.route('/stream')
def stream():
    def event_stream():
        while True:
            message = log_queue.get()
            converted_message = conv.convert(message, full=False)
            yield f"data: {converted_message.strip()}\n\n"
    return Response(event_stream(), content_type='text/event-stream')
###

@app.route("/monitor", methods = ['GET'])
def monitor():
    base_port = 8000
    iframe_count = WORKER_COUNT
    ports = [base_port + i for i in range(iframe_count)]
    return render_template("monitor.html", ports = ports)

if __name__ == "__main__":
    #캐쉬 관리 스레드 시작
    start_new_thread(already_summarized_id_list_checker_thread, ())
    # 프로그램 종료 시 워커 프로세스 정리를 위한 핸들러 등록
    atexit.register(terminate_workers)

    # 워커 풀 시작
    if os.environ.get("FLASK_WORKERS_STARTED") != "true":
        os.environ["FLASK_WORKERS_STARTED"] = "true"
        start_worker_pool()
    
    try:
        # 디버그 모드에서는 리로더를 비활성화하여 워커 프로세스 중복 시작 방지
        app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)
    except KeyboardInterrupt:
        print("서버가 중단되었습니다.")
        terminate_workers()