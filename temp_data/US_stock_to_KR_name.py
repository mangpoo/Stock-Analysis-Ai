import subprocess
import json
import pandas as pd

df = pd.read_csv("NYSE_tickers.csv")
print(df.values[0][0])

dct = dict()

for _ticker in df.values:
    ticker = _ticker[0]
    url = f"https://api.stock.naver.com/stock/{ticker}.K/basic"

    try:
        result = subprocess.run(
            ["curl", "-X", "GET", url],
            capture_output=True,
            text=True
            )
        print(result.stdout)
        tmp = json.loads(result.stdout)
        loaded_name = tmp['stockName']

        dct[ticker] = loaded_name
    
    except Exception as e:
        print(e, ticker)


result_str = ""
for ticker, stock_name in dct.items():
    result_str += f"{ticker},{stock_name}\n"

f = open("NYSE_tickers_edited.csv", 'w')
f.write(result_str)
f.close()