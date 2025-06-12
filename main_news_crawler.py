import os
import urllib.request
import urllib.parse
import datetime
import json
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import re
import html

def main_news_get():
    load_dotenv()
    search_keyword = ['코스피', '관세', '실적', '기업']
    client_id = os.getenv('CLIENT_ID')
    client_secret = os.getenv('CLIENT_SECRET_KEY')
    
    all_results = []
    
    def extract_naver_news_text_and_date(link):
        try:
            headers = {'User-Agent': 'Mozilla/5.0'}
            res = requests.get(link, headers=headers, timeout=10)
            soup = BeautifulSoup(res.text, 'html.parser')
    
            # 본문 추출
            content_div = soup.select_one('article#dic_area')
            content = content_div.get_text(strip=True) if content_div else "본문 없음"
            content = html.unescape(content)
    
            # 날짜 추출
            time_tag = soup.select_one('span._ARTICLE_DATE_TIME')
            if time_tag and time_tag.has_attr('data-date-time'):
                raw_date = time_tag['data-date-time']
                date_obj = datetime.datetime.strptime(raw_date, '%Y-%m-%d %H:%M:%S')
                date_str = date_obj.strftime('%Y-%m-%d %H:%M')
            else:
                date_str = datetime.datetime.now().strftime('%Y-%m-%d %H:%M')
    
            image_url = None
            
            # ㅇ이미지 추출
            og_image = soup.select_one('meta[property="og:image"]')
            if og_image and og_image.get('content'):
                image_url = og_image.get('content')

            return content, date_str, image_url
    
        except Exception as e:
            print(f"본문 추출 실패: {e}")
            return f"본문 추출 실패: {e}", datetime.datetime.now().strftime('%Y-%m-%d %H:%M'), []
    
    # 검색어별 처리
    for keyword in search_keyword:
        try:
            print(f"키워드 '{keyword}' 검색 중...")
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
            
            found = False
            for item in response_result.get('items', []):
                if 'news.naver.com' in item['link']:
                    title = re.sub('<.*?>', '', item['title'])
                    title = html.unescape(title)  
                    link = item['link']
                    content, date, image_url = extract_naver_news_text_and_date(link)
                    
                    all_results.append({
                        'title': title,
                        'date': date,
                        'link': link,
                        'content': content[:300] + '...' if len(content) > 300 else content,
                        'image_url': image_url  
                    })
                    found = True
                    image_info = " (이미지 있음)" if image_url else " (이미지 없음)"
                    print(f"키워드 '{keyword}' 뉴스 발견: {title}{image_info}")
                    break
            
            if not found:
                print(f"키워드 '{keyword}'에 대한 네이버 뉴스를 찾을 수 없습니다.")
                
        except Exception as e:
            print(f"키워드 '{keyword}' 처리 중 오류: {e}")
    
    # 현재 날짜로 디렉토리 생성
    current_date = datetime.datetime.now().strftime('%Y%m%d')
    current_time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # 저장 경로 설정
    current_dir = os.path.dirname(os.path.abspath(__file__))
    news_base_dir = os.path.join(current_dir, '.', 'news')
    date_dir = os.path.join(news_base_dir, current_date)
    
    # 디렉토리 생성
    os.makedirs(date_dir, exist_ok=True)
    os.makedirs(news_base_dir, exist_ok=True)
    
    # 날짜별 파일 경로
    dated_json_path = os.path.join(date_dir, 'news_data.json')
    latest_json_path = os.path.join(news_base_dir, 'latest.json')
    
    # 통계 정보 생성
    total_images = sum(1 for result in all_results if result.get('image_url'))
    
    # 뉴스 정렬 함수(이미지가 없는 경우 main news 에서 표시안 되도록 정렬)
    def sort_news_for_main(news_list):
        def news_priority(news):
            image_url = news.get('image_url', '')
            
            # 1순위: 이미지가 있고 ssl로 시작하지 않는 뉴스
            if image_url and not image_url.startswith('https://ssl.'): # ssl 로 시작하는 경우 기사 본문에 이미지 없음.
                return 0
            # 2순위: 이미지가 없는 뉴스
            elif not image_url:
                return 1
            # 3순위: ssl로 시작하는 이미지 뉴스
            else:
                return 2
        
        return sorted(news_list, key=news_priority)
    all_results = sort_news_for_main(all_results)
    
    # 저장할 데이터
    news_data = {
        'date': current_date,
        'news_count': len(all_results),
        'total_images': total_images,
        'news': all_results
    }
    
    
    return news_data