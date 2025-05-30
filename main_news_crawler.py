import os
import urllib.request
import urllib.parse
import datetime
import json
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import re

# 환경 변수 로드
load_dotenv()

# 검색 키워드와 인증 정보
search_keyword = ['코스피', '관세', '실적', '기업']
client_id = os.getenv('CLIENT_ID')
client_secret = os.getenv('CLIENT_SECRET_KEY')

# 전체 결과를 담을 리스트
all_results = []

# 본문 + 날짜 추출 함수
def extract_naver_news_text_and_date(link):
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        res = requests.get(link, headers=headers, timeout=5)
        soup = BeautifulSoup(res.text, 'html.parser')

        # 본문
        content_div = soup.select_one('article#dic_area')
        content = content_div.get_text(strip=True) if content_div else "본문 없음"

        # 날짜
        time_tag = soup.select_one('span._ARTICLE_DATE_TIME')
        if time_tag and time_tag.has_attr('data-date-time'):
            raw_date = time_tag['data-date-time']
            date_obj = datetime.datetime.strptime(raw_date, '%Y-%m-%d %H:%M:%S')
            date_str = date_obj.strftime('%Y%m%d%H%M')
        else:
            date_str = '날짜 없음'

        return content, date_str
    except Exception as e:
        return f"본문 추출 실패: {e}", "날짜 오류"

# 검색어별 처리
for keyword in search_keyword:
    encText = urllib.parse.quote(keyword)
    url = f"https://openapi.naver.com/v1/search/news.json?query={encText}&start=1&display=100&sort=date"
    
    request = urllib.request.Request(url)
    request.add_header("X-Naver-Client-Id", client_id)
    request.add_header("X-Naver-Client-Secret", client_secret)
    
    response = urllib.request.urlopen(request)
    rescode = response.getcode()
    if rescode != 200:
        print(f"API 요청 실패 - 키워드: {keyword}, 코드: {rescode}")
        continue
    
    response_body = response.read()
    response_result = json.loads(response_body.decode('utf-8'))
    
    # 해당 키워드의 첫 번째 네이버 뉴스 찾기
    for item in response_result.get('items', []):
        if 'news.naver.com' in item['link']:
            title = re.sub('<.*?>', '', item['title'])
            link = item['link']
            content, date = extract_naver_news_text_and_date(link)
            
            all_results.append({
                'title': title,
                'date': date,
                'link': link,
                'content': content
            })
            break

# JSON 출력
print(json.dumps(all_results, ensure_ascii=False, indent=4))
