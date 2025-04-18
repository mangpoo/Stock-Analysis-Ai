from flask import Flask, request, jsonify, render_template #, render_template_string
import crawler
import atexit
import os
from dotenv import load_dotenv
from stock_analyzer import StockNewsAnalyzer

# 환경 변수 로드
load_dotenv()

app = Flask(__name__)

# 주식 뉴스 분석기 초기화
stock_analyzer = StockNewsAnalyzer()


@app.route('/')
def home():
    return render_template('analyzer.html')

@app.route('/api/news')
def get_news():
    ticker = request.args.get('ticker', '')
    if not ticker:
        return jsonify({"error": "티커를 입력해주세요."}), 400
    
    try:
        # StockNewsAnalyzer를 사용하여 뉴스 정보 및 분석 결과 가져오기
        result = stock_analyzer.get_news_with_analysis(ticker)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 앱 종료 시 Selenium 드라이버 정리
atexit.register(crawler.cleanup_driver)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)