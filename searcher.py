import sqlite3
import re
import pandas as pd
from flask import jsonify
import datetime as dt

class Searcher:
    def __init__(self):
        self.conn = sqlite3.connect("stockInfo.db", check_same_thread=False)  
        self.search_query = """
        SELECT ticker, stock_name, 'KR_Stock' as source FROM KR_Stock
        WHERE stock_name LIKE ? OR ticker LIKE ?

        UNION ALL
        SELECT ticker, en_stock_name AS stock_name, 'KR_EN_names' as source FROM KR_EN_names
        WHERE en_stock_name LIKE ? OR ticker LIKE ?

        UNION ALL
        SELECT ticker, kr_stock_name AS stock_name, 'us_kr_names' as source FROM us_kr_names
        WHERE kr_stock_name LIKE ? OR ticker LIKE ?

        UNION ALL
        SELECT ticker, stock_name, 'AMEX_Stock' as source FROM AMEX_Stock
        WHERE stock_name LIKE ? OR ticker LIKE ?

        UNION ALL
        SELECT ticker, stock_name, 'NSDQ_Stock' as source FROM NSDQ_Stock
        WHERE stock_name LIKE ? OR ticker LIKE ?

        UNION ALL
        SELECT ticker, stock_name, 'NYSE_Stock' as source FROM NYSE_Stock
        WHERE stock_name LIKE ? OR ticker LIKE ?

        LIMIT 100;
        """
        print("Searcher Ready")

    def search_stocks(self, keyword):
        cur = self.conn.cursor()

        keyword_like = f"%{keyword}%"
        cur.execute(self.search_query, [keyword_like] * 12)
        rows = cur.fetchall()

        # 우선순위: 실제 거래소 테이블 우선
        priority = {
            'NSDQ_Stock': 1,
            'NYSE_Stock': 2,
            'AMEX_Stock': 3,
            'KR_Stock': 4,
            'KR_EN_names': 5,
            'us_kr_names': 6
        }

        seen = {}
        for ticker, name, source in rows:
            if ticker not in seen or priority[source] < priority[seen[ticker]["source"]]:
                seen[ticker] = {"ticker": ticker, "name": name, "source": source}

        return list(seen.values())


    def get_name_by_ticker(self, country, ticker):
        stock_name = None
        cur = self.conn.cursor()

        if(country == "us"):
            ticker = ticker.upper()
            for market_type in ["amex", "nsdq", "nyse"]:
                cur.execute(f"""select stock_name from {market_type}_stock where ticker = '{ticker}';""")
                temp = cur.fetchall()
                if(len(temp) != 0):
                    stock_name = temp[0][0]
                    break        
        elif(country == 'kr'):
            cur.execute(f"""select stock_name from kr_stock where ticker = '{ticker}';""")
            temp = cur.fetchall()
            if(len(temp) != 0):
                stock_name = temp[0][0]
        
        return stock_name
    
    

    def kr_get_recommend_stocks(self) -> pd.DataFrame:
        cur = self.conn.cursor()
        
        cur.execute("""select ticker, stock_name, market_capitalization from kr_stock order by market_capitalization desc limit 110;""")
        df = pd.DataFrame(cur.fetchall())
        df.reset_index(inplace=True)
        df.drop("index", axis = 1, inplace=True)
        df.columns = ['ticker', 'stock_name','market_capitalization']

        return df



    def us_get_recommend_stocks(self) -> pd.DataFrame:
        cur = self.conn.cursor()

        table_results = list()

        for market_type in ["amex", "nsdq", "nyse"]:
            cur.execute(f"""select ticker, stock_name, market_capitalization from {market_type}_stock order by market_capitalization desc limit 50;""")
            table_results += cur.fetchall()
        
        df = pd.DataFrame(table_results)
        df.columns = ['ticker', 'stock_name', 'market_capitalization']
        
        df.sort_values(by = ["market_capitalization"], axis = 0, ascending=False, inplace=True)
        df.reset_index(inplace=True)
        df.drop("index", axis = 1, inplace=True)
        return df.head(110)




    ##############################
    def tester(self, cmd):
        cur = self.conn.cursor()
        cur.execute(cmd)
        print(cur.fetchall())
    ##############################


        
        
# s = Searcher()
# print(s.kr_get_recommend_stocks())
# print(s.us_get_recommend_stocks())