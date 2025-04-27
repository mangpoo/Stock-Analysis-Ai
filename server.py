from flask import Flask, jsonify
from worker import *

WORKER_COUNT = 2


app = Flask(__name__)
workers = list()

@app.route("/test", methods = ['GET'])
def test():
    f = open("1.txt", 'r')
    result = workers[0].summarize(f.read())
    f.close()

    return result


if __name__ == '__main__':
    for i in range(WORKER_COUNT):
        workers.append(Worker(i))
    
    app.run(host = '0.0.0.0', port = 5000, debug=True, threaded = True)