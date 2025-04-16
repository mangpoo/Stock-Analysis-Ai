from flask import Flask, jsonify, render_template
from flask_cors import CORS
import pandas as pd
import json
from pykrx import stock
import yfinance as yf

import searcher

search_obj = None
app = Flask(__name__)
CORS(app)
app.config['JSON_AS_ASCII'] = False



@app.route('/kr/<string:ticker>/<string:start_date>/<string:end_date>', methods=['GET'])
def kr(ticker, start_date, end_date):
    try:
        # pykrx 데이터 가져오기
        df = stock.get_market_ohlcv_by_date(start_date, end_date, ticker)

        # 데이터 변환
        df.reset_index(inplace=True)  # 날짜를 열로 이동
        df["날짜"] = pd.to_datetime(df["날짜"]).dt.strftime('%Y-%m-%d')  # 날짜를 문자열로 포맷
        df["등락률"] = (df["종가"].pct_change() * 100).fillna("")
        df.columns = ['date', 'open', 'high', 'low', 'close', 'volume', 'change_rate']

        # JSON 변환
        json_result = df.to_dict(orient="records")

        return jsonify(json_result)

    except Exception as e:
        return jsonify({"error": str(e)})
    



@app.route('/us/<string:ticker>/<string:start_date>/<string:end_date>', methods=['GET'])
def us(ticker, start_date, end_date):
    if('-' not in start_date):
        start_date = f"{start_date[:4]}-{start_date[4:6]}-{start_date[6:]}"
    if('-' not in end_date):
        end_date = f"{end_date[:4]}-{end_date[4:6]}-{end_date[6:]}"
    
    try:
        # yfinance 데이터를 가져오기
        df = yf.download(ticker, start=start_date, end=end_date)

        # 필요한 데이터 선택 및 포맷 변경
        df = df[['Open', 'High', 'Low', 'Close', 'Volume']]
        df.reset_index(inplace=True)
        df["Date"] = pd.to_datetime(df["Date"]).dt.strftime('%Y-%m-%d')  # 날짜 포맷
        df["Change Rate"] = (df["Close"].pct_change() * 100).fillna("")  # 등락률 계산
        df.columns = ['date', 'open', 'high', 'low', 'close', 'volume', 'change_rate']

        # JSON 변환
        json_result = df.to_dict(orient="records")
        return jsonify(json_result)

    except Exception as e:
        return jsonify({"error": str(e)})
    


@app.route('/find/<string:name>', methods=['GET'])
def find(name):
    try:
        df = search_obj.searcher(name)
        if(type(df) != pd.DataFrame):
            return jsonify({"error": "empty"})
        json_result = df.to_dict(orient="records")
        return jsonify(json_result)
    except Exception as e:
        return jsonify({"error": "empty"})


@app.route('/chart/<string:country>/<string:ticker>/<string:start_date>/<string:end_date>')
def serve_chart(country, ticker, start_date, end_date):
    stock_name = search_obj.get_name_by_ticker(country=country, ticker=ticker)
    currency = 'KRW' if country == 'kr' else 'USD'
    return render_template("chart.html", stock_name = stock_name, currency =currency)


if __name__ == '__main__':
    search_obj = searcher.Searcher()
    app.run(host = "0.0.0.0", port = 5000, debug=True)

