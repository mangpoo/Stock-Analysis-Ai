from flask import Flask, jsonify, request, send_from_directory
import requests
import os
import subprocess
import threading
from dotenv import load_dotenv
from datetime import datetime, timedelta

# 환경변수 로딩
load_dotenv()
SDS_SERVER_IP = os.getenv("SDS_SERVER_IP")
CRAWLER_SERVER_HOST = os.getenv("CRAWLER_SERVER_HOST")

app = Flask(__name__)

# CORS 헤더 추가
@app.after_request
def after_request(response):
   response.headers.add('Access-Control-Allow-Origin', '*')
   response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
   response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
   return response

# 리액트 정적 파일 서빙
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
   if path != "" and os.path.exists(os.path.join('build', path)):
       return send_from_directory('build', path)
   else:
       return send_from_directory('build', 'index.html')

# 주가 히스토리 데이터 가져오기
def get_stock_history(country, ticker, days=90):
   try:
       end_date = datetime.now()
       start_date = end_date - timedelta(days=days)
       
       from_date = start_date.strftime('%Y%m%d')
       to_date = end_date.strftime('%Y%m%d')
       
       url = f"http://{CRAWLER_SERVER_HOST}/{country}/{ticker}/{from_date}/{to_date}"
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
   try:
       url = f"http://{SDS_SERVER_IP}:5000/crawler/{ticker}"
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
               summary_response = requests.get(news_url, timeout=20)
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
@app.route('/api/analyze/<string:country>/<string:ticker>', methods=['GET'])
def analyze_stock(country, ticker):
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
           "news": news_data
       }
       
       print(f"데이터 수집 완료: 주가 {len(price_history)}일, 뉴스 {len(news_data)}개")
       
       result = analyzer.analyze_comprehensive(stock_data)
       
       return jsonify({
           "status": "success",
           "analysis": result
       }), 200

   except Exception as e:
       print(f"통합 분석 오류: {e}")
       return jsonify({
           "status": "error",
           "analysis": f"분석 중 오류가 발생했습니다: {str(e)}"
       }), 500

# GPT 주가 분석 API
@app.route('/api/analyze-price/<string:country>/<string:ticker>', methods=['GET'])
def analyze_price_only(country, ticker):
   try:
       from gpt_analyzer import StockGPTAnalyzer
       analyzer = StockGPTAnalyzer()
       
       print(f"{country}/{ticker} 주가 분석 시작")
       
       price_history = get_stock_history(country, ticker, days=90)
       
       stock_data = {
           "stock_code": ticker,
           "country": country.upper(),
           "price_history": price_history
       }
       
       print(f"주가 데이터 {len(price_history)}일 수집 완료")
       
       result = analyzer.analyze_price_only(stock_data)
       
       return jsonify({
           "status": "success",
           "analysis": result
       }), 200

   except Exception as e:
       print(f"주가 분석 오류: {e}")
       return jsonify({
           "status": "error",
           "analysis": f"분석 중 오류가 발생했습니다: {str(e)}"
       }), 500

def build_react():
   """리액트 프로젝트 빌드"""
   print("리액트 프로젝트 빌드 중...")
   try:
       subprocess.run(['npm', 'run', 'build'], check=True, cwd='.')
       print("리액트 빌드 완료")
   except subprocess.CalledProcessError as e:
       print(f"리액트 빌드 실패: {e}")
   except FileNotFoundError:
       print("npm이 설치되지 않았습니다. Node.js를 설치해주세요.")

def start_react_dev():
   """리액트 개발 서버 시작 (별도 스레드)"""
   def run_react():
       try:
           subprocess.run(['npm', 'start'], cwd='.')
       except Exception as e:
           print(f"리액트 개발 서버 시작 실패: {e}")
   
   react_thread = threading.Thread(target=run_react, daemon=True)
   react_thread.start()
   print("리액트 개발 서버 시작됨 (포트 3000)")

if __name__ == '__main__':
   import sys
   
   if len(sys.argv) > 1 and sys.argv[1] == 'dev':
       # 개발 모드: 리액트 개발 서버 실행
       print("개발 모드로 시작")
       start_react_dev()
       app.run(host='0.0.0.0', port=5001, debug=True)
   else:
       # 프로덕션 모드: 리액트 빌드 후 정적 파일 서빙
       print("프로덕션 모드로 시작")
       if not os.path.exists('build'):
           build_react()
       
       print("GPT 주식 분석 서버 시작")
       print(f"크롤러 서버: {CRAWLER_SERVER_HOST}")
       print(f"SDS 서버: {SDS_SERVER_IP}")
       app.run(host='0.0.0.0', port=5001, debug=False)