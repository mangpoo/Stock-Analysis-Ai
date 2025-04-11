from flask import Flask, request, jsonify, render_template_string
import crawler
import atexit

app = Flask(__name__)

HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>주식 뉴스 크롤러</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    <h1>crawler module test</h1>
    <form id="searchForm">
        <label for="ticker">티커 입력:</label>
        <input type="text" id="ticker" name="ticker" placeholder="예: 삼성전자, 005930" required>
        <button type="submit">검색</button>
    </form>
    
    <div id="loading" style="display:none;">검색 중...</div>
    <div id="result"></div>
    
    <script>
        document.getElementById('searchForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const ticker = document.getElementById('ticker').value.trim();
            if (!ticker) return;
            
            const loadingDiv = document.getElementById('loading');
            const resultDiv = document.getElementById('result');
            
            loadingDiv.style.display = 'block';
            resultDiv.innerHTML = '';
            
            fetch('/api/news?ticker=' + encodeURIComponent(ticker))
                .then(response => response.json())
                .then(data => {
                    loadingDiv.style.display = 'none';
                    resultDiv.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
                })
                .catch(error => {
                    loadingDiv.style.display = 'none';
                    resultDiv.innerHTML = '<div style="color:red">오류: ' + error + '</div>';
                });
        });
    </script>
</body>
</html>
"""

@app.route('/')
def home():
    return render_template_string(HTML_TEMPLATE)

@app.route('/api/news')
def get_news():
    ticker = request.args.get('ticker', '')
    if not ticker:
        return jsonify({"error": "티커를 입력해주세요."}), 400
    
    try:
        result = crawler.get_stock_news(ticker)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 앱 종료 시 Selenium 드라이버 정리
atexit.register(crawler.cleanup_driver)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)