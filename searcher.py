import sqlite3
import re
import pandas as pd
from flask import jsonify

class Searcher:
    def __init__(self):
        self.conn = sqlite3.connect("stockInfo.db", check_same_thread=False)  
        self.cur = self.conn.cursor()
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
        self.cur.execute(f"""select ticker, stock_name, market_Type
                        from kr_stock
                        where stock_name like '%{input_string}%';""")
        data = self.cur.fetchall()
        if(len(data) == 0): return None


        df = pd.DataFrame(data)
        df.columns = ['ticker', 'stock_name', 'market_type']
        return df



    def __en_search(self, input_string : str):
        self.cur.execute(f"""select kr_en_names.ticker, en_stock_name, market_type 
                        from kr_en_names, kr_stock 
                        where en_stock_name like '%{input_string}%' and kr_stock.ticker = kr_en_names.ticker;""")
        kr = self.cur.fetchall()

        us = list()
        for market_type in ["amex", "nsdq", "nyse"]:
            self.cur.execute(f"""select ticker, stock_name, market_type
                            from {market_type}_stock
                            where stock_name like '%{input_string}%';""")
            us.append(self.cur.fetchall())
        
        result = kr + us[0] + us[1] + us[2]
        if(len(result) == 0): return None


        df = pd.DataFrame(result)
        df.columns = ['ticker', 'stock_name', 'market_type']
        return df
    
    def get_name_by_ticker(self, country, ticker):
        stock_name = None

        if(country == "us"):
            ticker = ticker.upper()
            for market_type in ["amex", "nsdq", "nyse"]:
                self.cur.execute(f"""select stock_name from {market_type}_stock where ticker = '{ticker}';""")
                temp = self.cur.fetchall()
                if(len(temp) != 0):
                    stock_name = temp[0][0]
                    break        
        elif(country == 'kr'):
            self.cur.execute(f"""select stock_name from kr_stock where ticker = '{ticker}';""")
            temp = self.cur.fetchall()
            if(len(temp) != 0):
                stock_name = temp[0][0]
        
        return stock_name


        
        
# s = Searcher()
# print(s.searcher(input()))
# print(s.get_name_by_ticker("us", "intc"))
# print(s.get_name_by_ticker("kr", "005930"))
