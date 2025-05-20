from flask import Flask, request, jsonify
import sqlite3

app = Flask(__name__)
DB_PATH = "stockInfo.db"

def search_stocks(keyword):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    query = """
    SELECT ticker, stock_name, 'KR_Stock' as source FROM KR_Stock
    WHERE stock_name LIKE ? OR ticker LIKE ?

    UNION
    SELECT ticker, en_stock_name AS stock_name, 'KR_EN_names' as source FROM KR_EN_names
    WHERE en_stock_name LIKE ? OR ticker LIKE ?

    UNION
    SELECT ticker, kr_stock_name AS stock_name, 'us_kr_names' as source FROM us_kr_names
    WHERE kr_stock_name LIKE ? OR ticker LIKE ?

    UNION
    SELECT ticker, stock_name, 'AMEX_Stock' as source FROM AMEX_Stock
    WHERE stock_name LIKE ? OR ticker LIKE ?

    UNION
    SELECT ticker, stock_name, 'NSDQ_Stock' as source FROM NSDQ_Stock
    WHERE stock_name LIKE ? OR ticker LIKE ?

    UNION
    SELECT ticker, stock_name, 'NYSE_Stock' as source FROM NYSE_Stock
    WHERE stock_name LIKE ? OR ticker LIKE ?

    LIMIT 20;
    """
    keyword_like = f"%{keyword}%"
    cursor.execute(query, [keyword_like] * 12)
    rows = cursor.fetchall()
    conn.close()

    return [
        {"ticker": row[0], "name": row[1], "source": row[2]}
        for row in rows
    ]

@app.route('/search')
def search():
    keyword = request.args.get("q", "").strip()
    if not keyword:
        return jsonify({"error": "Missing search query"}), 400

    results = search_stocks(keyword)
    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)
