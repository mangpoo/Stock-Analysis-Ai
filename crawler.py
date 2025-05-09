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
def crawling(stock_key_word:str, article_cnt:int) -> list:
    load_dotenv()
# 검색 키워드와 인증 정보
    search_keyword = stock_key_word
    client_id = "EkLgi5TM5MAklKXFqwqD"  # 보통은 .env로 이동
    client_secret = os.getenv('CLIENT_SECRET_KEY')

    # 검색어 인코딩
    encText = urllib.parse.quote(search_keyword)

    # 네이버 뉴스 API URL (최신순, 30개)
    url = f"https://openapi.naver.com/v1/search/news.json?query={encText}&start=1&display=30&sort=date"

    # 요청 객체 및 헤더 설정
    request = urllib.request.Request(url)
    request.add_header("X-Naver-Client-Id", client_id)
    request.add_header("X-Naver-Client-Secret", client_secret)

    # 요청 및 응답 처리
    response = urllib.request.urlopen(request)
    rescode = response.getcode()
    if rescode != 200:
        raise Exception(f"API 요청 실패: 코드 {rescode}")

    response_body = response.read()
    response_result = json.loads(response_body.decode('utf-8'))

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
                raw_date = time_tag['data-date-time']  # '2025-05-09 14:25:11'
                date_obj = datetime.datetime.strptime(raw_date, '%Y-%m-%d %H:%M:%S')
                date_str = date_obj.strftime('%Y%m%d%H%M')
            else:
                date_str = '날짜 없음'

            return content, date_str
        except Exception as e:
            return f"본문 추출 실패: {e}", "날짜 오류"

    # 뉴스 필터링 및 결과 구성
    filtered_results = []

    for item in response_result.get('items', []):
        if 'news.naver.com' in item['link']:
            title = re.sub('<.*?>', '', item['title'])  # HTML 태그 제거
            link = item['link']
            content, date = extract_naver_news_text_and_date(link)

            filtered_results.append({
                'title': title,
                'date': date,
                'link': link,
                'content': content
            })

            if len(filtered_results) == article_cnt:
                break

    return filtered_results


print(crawling("005930", 1))