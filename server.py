import time
import os
import signal
from multiprocessing import Queue, Process
from flask import Flask, jsonify, request, Response
from flask_cors import CORS
import random
import atexit
import json
from worker_process import worker_loop

app = Flask("__name__")
CORS(app)

# 작업 큐
task_q = Queue()
# 워커 프로세스 목록
worker_processes = []

already_summarized_id_list = list() # 이미 요약된 id 저장
if("summarized_articles" not in os.listdir()):
    os.mkdir("summarized_articles")
SUMARTICLE_PATH = "summarized_articles/"


# 워커 수
WORKER_COUNT = 3  # 원하는 워커 프로세스 수를 여기에 설정

# 모든 워커 프로세스를 종료하는 함수
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
        p = Process(target=worker_loop, args=(task_q, i))  # 워커 ID 전달
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

@app.route("/crawler", methods=['GET'])
def crawlingAndSave():
    # 워커 상태 확인
    active_workers = check_workers_health()
    if active_workers < WORKER_COUNT:
        print(f"경고: {WORKER_COUNT}개 중 {active_workers}개의 워커만 활성화되어 있습니다.")
    
    id = random.randint(1, 5)
    if(f"{id}.txt" in os.listdir("summarized_articles")): # 디렉터리에 저장된 요약이 있는 경우
        return jsonify({"status" : "already_exist"})
    
    elif(id in already_summarized_id_list): # 이미 서버가 동작한 이후 요약한 id인 경우(아마 요약중일때)
        return jsonify({"status" : "may be summarizing..."})
        
    else: # 디렉터리에 저장된 요약이 없다면 크롤링 및 요약을 시도한다.
        try:
            print("===== start =====", id) 
            already_summarized_id_list.append(id) # id 추가
            task_q.put(id)
            return jsonify({"status": "started", "active_workers": active_workers, "file": f"temp/{id}.txt"})
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)})

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

@app.route("/workers/status", methods=['GET'])
def worker_status():
    active_workers = check_workers_health()
    return jsonify({
        "total_workers": WORKER_COUNT,
        "active_workers": active_workers,
        "worker_pids": [p.pid for p in worker_processes if p.is_alive()]
    })

@app.route("/workers/restart", methods=['GET'])
def restart_workers():
    start_worker_pool()
    return jsonify({"status": "success", "message": f"{WORKER_COUNT}개의 워커 프로세스가 재시작되었습니다."})

if __name__ == "__main__":
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