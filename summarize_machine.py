import time
import os
import signal
from _thread import *
from multiprocessing import Queue, Process
from worker_process import worker_loop
from flask import Flask, jsonify
from flask_cors import CORS
import random
import atexit

app = Flask("__name__")
CORS(app)
task_q = Queue()
worker_processes = []
WORKER_COUNT = 2  # 원하는 워커 프로세스 수를 여기에 설정

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
        p = Process(target=worker_loop, args=(task_q,))
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
            new_p = Process(target=worker_loop, args=(task_q,))
            new_p.daemon = True
            new_p.start()
            worker_processes[i] = new_p
            print(f"워커 프로세스 #{i+1} 재시작됨 (새 PID: {new_p.pid})")
    
    return len([p for p in worker_processes if p.is_alive()])

@app.route("/crawler", methods=['GET'])
def test():
    # 워커 상태 확인
    active_workers = check_workers_health()
    if active_workers < WORKER_COUNT:
        print(f"경고: {WORKER_COUNT}개 중 {active_workers}개의 워커만 활성화되어 있습니다.")
    
    idx = random.randint(1, 5)
    print("===== start =====", idx)
    f = open(f"temp/{idx}.txt", 'r')
    txt = f.read()
    task_q.put(txt)
    return jsonify({"status": "started"})

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