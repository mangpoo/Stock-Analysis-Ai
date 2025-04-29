import socket
from _thread import *
from collections import deque
import time

SOCKET_HOST = "127.0.0.1"
SOCKET_PORT = 6666

class SummarizeServer:
    def __init__(self):
        self.host = SOCKET_HOST
        self.port = SOCKET_PORT
        self.client_sockets = list() # 클라이언트와의 연결 저장
        self.q = deque(list()) # task 저장 q

    def run(self):
        print('>> Server Start with ip :', SOCKET_HOST)
        server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server_socket.bind((SOCKET_HOST, SOCKET_PORT))
        server_socket.listen()

        start_new_thread(self.confirmWorkersThreadFunc, ()) 

        try:
            while True:
                print('>> Wait')
                client_socket, addr = server_socket.accept()
                self.client_sockets.append(client_socket)
                start_new_thread(self.client_threaded, (client_socket, addr))
                print("socket client cnt(socket) : ", len(self.client_sockets))

        except Exception as e:
            print('error : ', e)

        finally:
            server_socket.close()

    def client_threaded(self, client_socket, addr): # receive
        print('>> Connected by :', addr[0], ':', addr[1])
   
        ## process until client disconnect ##

        while True:    
            try:
                ## send client if data recieved(echo) ##
                data = client_socket.recv(1024)

                if not data:
                    print('>> Disconnected by ' + addr[0], ':', addr[1])
                    break

                decoded_data = data.decode()
                # 0 == notBusy, 1 == Busy ##############
                if(decoded_data == "0"):
                    if(self.q):
                        # client_socket.send((self.q.popleft() + "#####").encode())
                        text = self.q.popleft()
                        for i in range(0, len(text), 100):
                            chunk = text[i:i+100]
                            if i + 50 >= len(text):
                                chunk += "#####"
                            client_socket.send(chunk.encode("utf-8"))
                    else:
                        print("q is Empty")

                print("received -> " + decoded_data)
            
            except ConnectionResetError as e:
                print('>> Disconnected by ' + addr[0], ':', addr[1])
                break
        

        if client_socket in self.client_sockets:
            self.client_sockets.remove(client_socket)
            print('remove client list : ', len(self.client_sockets))

        client_socket.close()
    


    def confirmWorkersThreadFunc(self): # worker가 작업 가능 상태인지 확인
        while(True):
            for worker_socket in self.client_sockets:
                worker_socket.send("#?#?".encode("utf-8")) # ask busy
            time.sleep(2)



if __name__ == "__main__":
    server = SummarizeServer()
    f = open("1.txt",'r')
    txt = f.read()
    f.close()
    for i in range(20):
        server.q.append(txt)
    server.run()