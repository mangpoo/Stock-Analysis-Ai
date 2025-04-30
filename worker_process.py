from workerClass import Worker
from multiprocessing import Process, Queue

def worker_loop(task_queue, worker_id=0):
    """각 워커 프로세스의 메인 루프"""
    worker = Worker(worker_id)
    print(f"\033[{31 + worker_id % 6}m[Worker {worker_id}]\033[0m: 준비 완료. 작업 대기 중...")
    
    while True:
        try:
            # 큐에서 작업 가져오기
            task = task_queue.get()
            print(f"\033[{31 + worker_id % 6}m[Worker {worker_id}]\033[0m: 새 작업 받음")
            
            # 테스트용 코드
            # 크롤링이 여기서 수행되고 worker.summarize()함수를 통해 요약이 시작
            # 이후 디렉터리에 저장한다.
            f = open(f"temp/{task}.txt", 'r')
            txt = f.read()
            f.close()
            
            # 작업 처리
            result = worker.summarize(txt)
            
            f = open(f"summarized_articles/{task}.txt", 'w')
            f.write(result)
            f.close()
            #####


        except Exception as e:
            print(f"\033[{31 + worker_id % 6}m[Worker {worker_id}]\033[0m: 오류 발생: {e}")
