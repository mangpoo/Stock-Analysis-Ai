from flask import Flask, jsonify, send_from_directory, request, Response
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token,
    jwt_required, get_jwt_identity
)
import requests
import pymysql
import os
from dotenv import load_dotenv
from datetime import timedelta

# 환경변수 로딩
load_dotenv()
SDS_SERVER_IP = os.getenv("SDS_SERVER_IP")
SDS_SERVER_PORT = os.getenv("SDS_SERVER_PORT")
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")  # .env에 JWT_SECRET 추가 추천

print("✅ 서버 진입함")

# React build 경로 설정
react_build_path = os.path.join(os.path.dirname(__file__), '../react/build')
app = Flask(__name__, static_folder=react_build_path, static_url_path='')

# CORS 설정
CORS(app, origins=["http://localhost:3000", "http://ddolddol2.duckdns.org"])

# JWT 설정
app.config["JWT_SECRET_KEY"] = JWT_SECRET
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)  # ⏰ JWT 토큰 만료 시간 설정 (1시간)
jwt = JWTManager(app)

# ⏳ 만료된 JWT에 대한 응답 처리
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({
        "status": "expired",
        "message": "로그인 세션이 만료되었습니다. 다시 로그인해주세요."
    }), 401

# MySQL 연결 함수
def get_connection():
    return pymysql.connect(
        host='localhost',
        port=3306,
        user='root',
        password='010216',
        db='myapp_db',
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )

# 로그인 및 JWT 토큰 발급
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    print("✅ 로그인 정보 수신:", data)

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            sql = """
                INSERT INTO users (google_id, email, name, profile_img)
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE name=%s, profile_img=%s
            """
            cursor.execute(sql, (
                data['sub'],
                data['email'],
                data['name'],
                data['picture'],
                data['name'],
                data['picture']
            ))
        conn.commit()
    except Exception as e:
        print("❌ DB 저장 오류:", e)
        return jsonify({"status": "error", "message": "DB 오류"}), 500
    finally:
        conn.close()

    access_token = create_access_token(
        identity=data['sub'],
        expires_delta=timedelta(hours=1)  # ⏰ 이 토큰은 1시간 뒤 만료
    )
    return jsonify({
        "status": "ok",
        "message": "사용자 정보 저장 및 토큰 발급 완료",
        "token": access_token
    }), 200

# 🔹 [추가] 로그인 유지 확인용 API
@app.route('/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_google_id = get_jwt_identity()

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            sql = "SELECT id, google_id, email, name, profile_img FROM users WHERE google_id=%s"
            cursor.execute(sql, (user_google_id,))
            result = cursor.fetchone()
            if result:
                return jsonify(result), 200
            else:
                return jsonify({"status": "error", "message": "사용자 없음"}), 404
    except Exception as e:
        print("❌ 사용자 조회 오류:", e)
        return jsonify({"status": "error", "message": "DB 오류"}), 500
    finally:
        conn.close()

# 최근 본 종목 추가
@app.route('/recent', methods=['POST'])
@jwt_required()
def add_recent_stock():
    data = request.get_json()
    user_google_id = get_jwt_identity()
    stock_code = data['stock_code']

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM users WHERE google_id=%s", (user_google_id,))
            result = cursor.fetchone()
            if not result:
                return jsonify({"status": "error", "message": "사용자 없음"}), 404
            user_id = result['id']
            sql = "INSERT INTO recent_stocks (user_id, stock_code) VALUES (%s, %s)"
            cursor.execute(sql, (user_id, stock_code))
        conn.commit()
    except Exception as e:
        print("❌ 최근 본 종목 저장 실패:", e)
        return jsonify({"status": "error"}), 500
    finally:
        conn.close()
    return jsonify({"status": "ok"})

# 최근 본 종목 조회
@app.route('/recent', methods=['GET'])
@jwt_required()
def get_recent_stocks():
    user_google_id = get_jwt_identity()

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM users WHERE google_id=%s", (user_google_id,))
            result = cursor.fetchone()
            if not result:
                return jsonify({"status": "error", "message": "사용자 없음"}), 404
            user_id = result['id']
            sql = "SELECT stock_code, viewed_at FROM recent_stocks WHERE user_id=%s ORDER BY viewed_at DESC LIMIT 20"
            cursor.execute(sql, (user_id,))
            rows = cursor.fetchall()
    except Exception as e:
        print("❌ 최근 종목 조회 실패:", e)
        return jsonify({"status": "error"}), 500
    finally:
        conn.close()
    return jsonify(rows)

# 관심 종목 추가
@app.route('/favorite', methods=['POST'])
@jwt_required()
def add_favorite_stock():
    data = request.get_json()
    user_google_id = get_jwt_identity()
    stock_code = data['stock_code']

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM users WHERE google_id=%s", (user_google_id,))
            result = cursor.fetchone()
            if not result:
                return jsonify({"status": "error", "message": "사용자 없음"}), 404
            user_id = result['id']
            sql = "INSERT IGNORE INTO favorite_stocks (user_id, stock_code) VALUES (%s, %s)"
            cursor.execute(sql, (user_id, stock_code))
        conn.commit()
    except Exception as e:
        print("❌ 관심 종목 저장 실패:", e)
        return jsonify({"status": "error"}), 500
    finally:
        conn.close()
    return jsonify({"status": "ok"})

# 관심 종목 삭제
@app.route('/favorite', methods=['DELETE'])
@jwt_required()
def delete_favorite_stock():
    data = request.get_json()
    user_google_id = get_jwt_identity()
    stock_code = data['stock_code']

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM users WHERE google_id=%s", (user_google_id,))
            result = cursor.fetchone()
            if not result:
                return jsonify({"status": "error", "message": "사용자 없음"}), 404
            user_id = result['id']
            sql = "DELETE FROM favorite_stocks WHERE user_id=%s AND stock_code=%s"
            cursor.execute(sql, (user_id, stock_code))
        conn.commit()
    except Exception as e:
        print("❌ 관심 종목 삭제 실패:", e)
        return jsonify({"status": "error"}), 500
    finally:
        conn.close()
    return jsonify({"status": "ok"})

# 관심 종목 조회
@app.route('/favorite', methods=['GET'])
@jwt_required()
def get_favorite_stocks():
    user_google_id = get_jwt_identity()

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM users WHERE google_id=%s", (user_google_id,))
            result = cursor.fetchone()
            if not result:
                return jsonify({"status": "error", "message": "사용자 없음"}), 404
            user_id = result['id']
            sql = "SELECT stock_code, added_at FROM favorite_stocks WHERE user_id=%s ORDER BY added_at DESC"
            cursor.execute(sql, (user_id,))
            rows = cursor.fetchall()
    except Exception as e:
        print("❌ 관심 종목 조회 실패:", e)
        return jsonify({"status": "error"}), 500
    finally:
        conn.close()
    return jsonify(rows)

# 기본 라우트 및 정적 리소스
@app.route('/api/hello')
def hello():
    return jsonify({'message': 'Hello from Flask in backend folder!'})

@app.route('/')
def serve_react():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/<path:path>', methods=['GET', 'POST'])
def proxy(path):
    url = f"http://{SDS_SERVER_IP}:{SDS_SERVER_PORT}/{path}"
    if request.method == "GET":
        resp = requests.get(url, params=request.args)
    else:
        resp = requests.post(url, json=request.get_json())
    return Response(
        resp.content,
        status=resp.status_code,
        content_type=resp.headers.get("Content-Type", "application/json")
    )

@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    print("✅ Flask 실행 직전")
    app.run(host='0.0.0.0', port=5000)
