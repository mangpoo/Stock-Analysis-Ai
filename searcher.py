import sqlite3
import re
import pandas as pd
from flask import jsonify
import datetime as dt

class Searcher:
    def __init__(self):
        self.conn = sqlite3.connect("stockInfo.db", check_same_thread=False)  
        print("Searcher Ready")

    def __check_with_korean(self, input_string : str):
        if re.search("[가-힣]", input_string):
            return True
        else:
            return False

    def searcher(self, input_string : str):
        print(input_string)
        if(self.__check_with_korean(input_string)): # only korean
            return self.__kr_search(input_string=input_string)
        else:
            return self.__en_search(input_string=input_string) # with English



    def __kr_search(self, input_string : str):
        cur = self.conn.cursor()
        cur.execute(f"""select ticker, stock_name, market_Type
                        from kr_stock
                        where stock_name like '%{input_string}%';""")
        data = cur.fetchall()
        if(len(data) == 0): return None


        df = pd.DataFrame(data)
        df.columns = ['ticker', 'stock_name', 'market_type']
        return df


    def __en_search(self, input_string : str):
        cur = self.conn.cursor()
        cur.execute(f"""select kr_en_names.ticker, en_stock_name, market_type 
                        from kr_en_names, kr_stock 
                        where en_stock_name like '%{input_string}%' and kr_stock.ticker = kr_en_names.ticker;""")
        kr = cur.fetchall()

        us = list()
        for market_type in ["amex", "nsdq", "nyse"]:
            cur.execute(f"""select ticker, stock_name, market_type
                            from {market_type}_stock
                            where stock_name like '%{input_string}%';""")
            us.append(cur.fetchall())
        
        result = kr + us[0] + us[1] + us[2]
        if(len(result) == 0): return None


        df = pd.DataFrame(result)
        df.columns = ['ticker', 'stock_name', 'market_type']
        return df
    
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