from workerClass import Worker
from multiprocessing import Process, Queue

def worker_loop(task_q: Queue):
    print("[Worker] Loading model...")
    worker = Worker()
    print("[Worker] Ready.")

    while True:
        text = task_q.get()
        if text == "__EXIT__":
            break
        print("[Worker] Summarizing...")
        result = worker.summarize(text)
        # print("[Worker] Done:", result[:100], "...")
        """ Cache 관련 구현 """
