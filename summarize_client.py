import socket
from multiprocessing import Queue, Process
import time
from _thread import *
from worker_process import worker_loop  # 위의 파일로 분리한 경우

SOCKET_HOST = '127.0.0.1'
PORT = 6666

class WorkerClient:
    def __init__(self, task_q):
        self.client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.client_socket.connect((SOCKET_HOST, PORT))
        self.task_q = task_q
        self.isBusy = 0
        print("##WorkerClient Ready##")

    def run(self):
        self.recv_data()

    def recv_data(self):
        buffer = b""

        while True:
            chunk = self.client_socket.recv(1024)
            if not chunk:
                break

            buffer += chunk
            try:
                decoded_data = buffer.decode("utf-8")
                if '#?#?' in decoded_data:
                    buffer = b""
                    self.client_socket.send(f"{self.isBusy}".encode())

                elif "#####" in decoded_data:
                    message = decoded_data.split("#####")[0]
                    print("received news:", message[:30], "...")
                    buffer = b""
                    self.task_q.put(message)
                    start_new_thread(self.setBusy, ()) # set Busy

            except UnicodeDecodeError:
                continue
    
    def setBusy(self):
        self.isBusy = 1
        time.sleep(3)
        self.isBusy = 0

if __name__ == "__main__":
    from multiprocessing import set_start_method
    set_start_method("spawn", force=True)

    task_q = Queue()
    p = Process(target=worker_loop, args=(task_q,))
    p.start()

    time.sleep(1)
    wClient = WorkerClient(task_q)
    wClient.run()
    task_q.put("__EXIT__")
    p.join()
