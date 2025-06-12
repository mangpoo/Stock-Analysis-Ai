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
from datetime import timedelta, datetime
import time
from main_news_crawler import *

# ✅ 시스템 타임존을 Asia/Seoul로 설정
os.environ['TZ'] = 'Asia/Seoul'
time.tzset()

# 환경변수 로딩
load_dotenv()
SDS_SERVER = os.getenv("SDS_SERVER_IP")  # 이제 IP:PORT 형태
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")  # .env에 JWT_SECRET 추가 추천
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "010216")
MYSQL_DB = os.getenv("MYSQL_DB", "myapp_db")
CRAWLER_SERVER_HOST = os.getenv("CRAWLER_SERVER_HOST")
AI_SERVER = os.getenv("AI_SERVER")

print("✅ 서버 진입함")

# React build 경로 설정
react_build_path = os.path.join(os.path.dirname(__file__), '../react/build')
app = Flask(__name__, static_folder=react_build_path, static_url_path='')

# CORS 설정
CORS(app, origins=[
    "http://localhost:3000",
    "http://ddolddol2.duckdns.org",
    "https://ddolddol2.duckdns.org"  # ✅ HTTPS 도메인도 반드시 포함
])

# JWT 설정
app.config["JWT_SECRET_KEY"] = JWT_SECRET
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)  # ⏰ JWT 토큰 만료 시간 설정 (1시간)
app.config['JSON_AS_ASCII'] = False
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
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        db=MYSQL_DB,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )

# 🔹 RDS 연결 테스트용 API
@app.route('/db-test', methods=['GET'])
def db_test():
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) AS cnt FROM users")
            result = cursor.fetchone()
        return jsonify({
            "status": "ok",
            "message": "✅ RDS 연결 성공",
            "user_count": result["cnt"]
        }), 200
    except Exception as e:
        print("❌ RDS 연결 실패:", e)
        return jsonify({
            "status": "error",
            "message": "RDS 연결 실패",
            "error": str(e)
        }), 500
    finally:
        if 'conn' in locals():
            conn.close()

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
                return jsonify({
                    "google_id": result["google_id"],
                    "email": result["email"],
                    "name": result["name"],
                    "picture": result["profile_img"]  # 프론트에서 기대하는 key 이름에 맞춰 반환
                }), 200
            else:
                return jsonify({"status": "error", "message": "사용자 없음"}), 404
    except Exception as e:
        print("❌ 사용자 조회 오류:", e)
        return jsonify({"status": "error", "message": "DB 오류"}), 500
    finally:
        conn.close()

# 최근 본 종목 추가
@app.route('/api/recent', methods=['POST'])
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

            # 기존 최근 목록 조회
            cursor.execute("SELECT recent_list FROM recent_stocks WHERE user_id=%s", (user_id,))
            row = cursor.fetchone()
            current_list = row['recent_list'].split(',') if row and row['recent_list'] else []

            # 중복 제거 후 앞에 삽입
            if stock_code in current_list:
                current_list.remove(stock_code)
            current_list.insert(0, stock_code)

            # 최대 10개 제한
            current_list = current_list[:10]
            updated_list = ','.join(current_list)

            # 저장
            cursor.execute("REPLACE INTO recent_stocks (user_id, recent_list) VALUES (%s, %s)", (user_id, updated_list))
        conn.commit()
    except Exception as e:
        print("❌ 최근 본 종목 저장 실패:", e)
        return jsonify({"status": "error"}), 500
    finally:
        conn.close()
    return jsonify({"status": "ok"})

# 최근 본 종목 조회
@app.route('/api/recent', methods=['GET'])
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

            cursor.execute("SELECT recent_list FROM recent_stocks WHERE user_id=%s", (user_id,))
            row = cursor.fetchone()
            stock_list = row['recent_list'].split(',') if row and row['recent_list'] else []

    except Exception as e:
        print("❌ 최근 종목 조회 실패:", e)
        return jsonify({"status": "error"}), 500
    finally:
        conn.close()
    return jsonify(stock_list)

# 관심 종목 추가
@app.route('/api/favorite', methods=['POST'])
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

            cursor.execute("SELECT favorite_list FROM favorite_stocks WHERE user_id=%s", (user_id,))
            row = cursor.fetchone()
            current_list = row['favorite_list'].split(',') if row and row['favorite_list'] else []

            if stock_code not in current_list:
                current_list.append(stock_code)
                updated_list = ','.join(current_list)
                cursor.execute("REPLACE INTO favorite_stocks (user_id, favorite_list) VALUES (%s, %s)", (user_id, updated_list))

        conn.commit()
    except Exception as e:
        print("❌ 관심 종목 저장 실패:", e)
        return jsonify({"status": "error"}), 500
    finally:
        conn.close()
    return jsonify({"status": "ok"})

# 관심 종목 삭제
@app.route('/api/favorite', methods=['DELETE'])
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

            cursor.execute("SELECT favorite_list FROM favorite_stocks WHERE user_id=%s", (user_id,))
            row = cursor.fetchone()
            current_list = row['favorite_list'].split(',') if row and row['favorite_list'] else []

            if stock_code in current_list:
                current_list.remove(stock_code)
                updated_list = ','.join(current_list)
                cursor.execute("REPLACE INTO favorite_stocks (user_id, favorite_list) VALUES (%s, %s)", (user_id, updated_list))

        conn.commit()
    except Exception as e:
        print("❌ 관심 종목 삭제 실패:", e)
        return jsonify({"status": "error"}), 500
    finally:
        conn.close()
    return jsonify({"status": "ok"})

# 관심 종목 조회
@app.route('/api/favorite', methods=['GET'])
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

            cursor.execute("SELECT favorite_list FROM favorite_stocks WHERE user_id=%s", (user_id,))
            row = cursor.fetchone()
            stock_list = row['favorite_list'].split(',') if row and row['favorite_list'] else []

    except Exception as e:
        print("❌ 관심 종목 조회 실패:", e)
        return jsonify({"status": "error"}), 500
    finally:
        conn.close()
    return jsonify(stock_list)



#관심 종목 확인 API ( 별 버튼 용도)
@app.route('/api/favorite/check', methods=['GET'])
@jwt_required()
def check_favorite_stock():
    user_google_id = get_jwt_identity()
    stock_code = request.args.get('stock_code')

    if not stock_code:
        return jsonify({"status": "error", "message": "종목 코드 누락"}), 400

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM users WHERE google_id=%s", (user_google_id,))
            result = cursor.fetchone()
            if not result:
                return jsonify({"status": "error", "message": "사용자 없음"}), 404
            user_id = result['id']

            cursor.execute("SELECT favorite_list FROM favorite_stocks WHERE user_id=%s", (user_id,))
            row = cursor.fetchone()
            favorite_list = row['favorite_list'].split(',') if row and row['favorite_list'] else []

            return jsonify({
                "status": "ok",
                "is_favorite": stock_code in favorite_list
            }), 200

    except Exception as e:
        print("❌ 찜 여부 확인 실패:", e)
        return jsonify({"status": "error", "message": "DB 오류"}), 500
    finally:
        conn.close()




# 기본 라우트 및 정적 리소스
@app.route('/api/hello')
def hello():
    return jsonify({'message': 'Hello from Flask in backend folder!'})

@app.route('/')
def serve_react():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/<path:path>', methods=['GET', 'POST'])
def proxy(path):
    url = f"http://{SDS_SERVER}/{path}"
    if request.method == "GET":
        resp = requests.get(url, params=request.args)
    else:
        resp = requests.post(url, json=request.get_json())
    return Response(
        resp.content,
        status=resp.status_code,
        content_type=resp.headers.get("Content-Type", "application/json")
    )

#뉴스 요약용도의 프록시
@app.route('/ai/<path:path>', methods=['GET', 'POST'])
def proxy_ai(path):
    url = f"http://minjun0410.iptime.org:5000/{path}"
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


#
# anal* field
#
GREETING = "안녕하세요! 똘똘한 주식 분석 인공지능 똘똘이에요. 😊\n\n"

# 주가 히스토리 데이터 가져오기
def get_stock_history(country, ticker, days=90):
    """지정한 기간의 주가 데이터 가져오기"""
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        from_date = start_date.strftime('%Y%m%d')
        to_date = end_date.strftime('%Y%m%d')

        url = f"https://ddolddol2.duckdns.org/api/{country}/{ticker}/{from_date}/{to_date}"
        print(f"주가 히스토리 요청: {url}")

        response = requests.get(url, timeout=15)
        if response.status_code == 200:
            data = response.json()
            print(f"주가 데이터 {len(data)}개 수신")
            return data
        else:
            print(f"주가 데이터 요청 실패: {response.status_code}")
            return []
    except Exception as e:
        print(f"주가 히스토리 가져오기 실패: {e}")
        return []

# 뉴스 데이터 가져오기 (5개)
def get_news_data(ticker):
    """뉴스 요약 데이터 5개 가져오기"""
    try:
        url = f"https://ddolddol2.duckdns.org/ai/crawler/{ticker}"
        print(f"뉴스 요청: {url}")

        news_response = requests.get(url, timeout=30)
        if news_response.status_code != 200:
            print(f"뉴스 크롤링 요청 실패: {news_response.status_code}")
            return []

        news_data = news_response.json()
        if not isinstance(news_data, dict) or 'success' not in news_data:
            print("뉴스 데이터 형식 오류")
            return []

        news_summaries = []
        for i, news_url in enumerate(news_data['success'][:5], 1):
            try:
                print(f"뉴스 {i}/5 요약 가져오는 중...")
                summary_response = requests.get(AI_SERVER + news_url, timeout=20)
                if summary_response.status_code == 200:
                    summary_data = summary_response.json()
                    news_summaries.append({
                        'title': summary_data.get('title', ''),
                        'summary': summary_data.get('summary', ''),
                        'date': summary_data.get('date', '')
                    })
                    print(f"뉴스 {i} 수신 완료")
                else:
                    print(f"뉴스 {i} 요약 실패: {summary_response.status_code}")
            except Exception as e:
                print(f"뉴스 {i} 처리 오류: {e}")
                continue

        print(f"총 {len(news_summaries)}개 뉴스 수집 완료")
        return news_summaries

    except Exception as e:
        print(f"뉴스 데이터 가져오기 실패: {e}")
        return []

    # GPT 통합 분석 API
@app.route('/api/analyze/<string:country>/<string:ticker>/<string:stock_name>', methods=['GET'])
def analyze_stock(country, ticker, stock_name):
    """주식 종합 분석 API"""
    try:
        from gpt_analyzer import StockGPTAnalyzer
        analyzer = StockGPTAnalyzer()

        print(f"{country}/{ticker} 통합 분석 시작")

        price_history = get_stock_history(country, ticker, days=90)
        news_data = get_news_data(ticker)

        stock_data = {
            "stock_code": ticker,
            "country": country.upper(),
            "price_history": price_history,
            "stock_name": stock_name,
            "news": news_data
        }

        print(f"데이터 수집 완료: 주가 {len(price_history)}일, 뉴스 {len(news_data)}개")

        result = analyzer.analyze_comprehensive(stock_data)

        return jsonify({
            "status": "success",
            "analysis": GREETING + result
        }), 200

    except Exception as e:
        print(f"통합 분석 오류: {e}")
        return jsonify({
            "status": "error",
            "analysis": f"분석 중 오류가 발생했습니다: {str(e)}"
        }), 500

# GPT 주가 분석 API
@app.route('/api/analyze-price/<string:country>/<string:ticker>/<string:stock_name>', methods=['GET'])
def analyze_price_only(country, ticker, stock_name):
    """주가만 분석하는 API"""
    try:
        from gpt_analyzer import StockGPTAnalyzer
        analyzer = StockGPTAnalyzer()

        print(f"{country}/{ticker} 주가 분석 시작")

        price_history = get_stock_history(country, ticker, days=90)

        stock_data = {
            "stock_code": ticker,
            "country": country.upper(),
            "stock_name": stock_name,
            "price_history": price_history
        }

        print(f"주가 데이터 {len(price_history)}일 수집 완료")

        result = analyzer.analyze_price_only(stock_data)

        return jsonify({
            "status": "success",
            "analysis": GREETING + result
        }), 200

    except Exception as e:
        print(f"주가 분석 오류: {e}")
        return jsonify({
            "status": "error",
            "analysis": f"분석 중 오류가 발생했습니다: {str(e)}"
        }), 500


MAIN_NEWS_TICK = 300

main_news_cache = {
    "last_updated_time" : time.time(),
    "data" : None
}

@app.route('/api/get_main_news', methods = ['GET'])
def get_main_news():
    time_out = (time.time() - main_news_cache['last_updated_time']) > MAIN_NEWS_TICK

    if(not time_out and main_news_cache['data'] != None):
        return jsonify(main_news_cache['data'])

    else:
        main_news_cache['last_updated_time'] = time.time()
        main_news_cache['data'] = main_news_get()
        return jsonify(main_news_cache['data'])




# ✅ HTTPS로 Flask 실행
if __name__ == '__main__':
    print("✅ Flask 실행 직전")
    app.run(host='0.0.0.0', port=443, ssl_context=('cert.pem', 'privkey.pem'))