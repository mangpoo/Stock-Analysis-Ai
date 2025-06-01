import os
import urllib.request
import urllib.parse
import datetime
import json
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import re

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
news_base_dir = os.path.join(current_dir, '..', 'Stock-Analysis-Ai', 'public', 'news')
date_dir = os.path.join(news_base_dir, current_date)

# 디렉토리 생성
os.makedirs(date_dir, exist_ok=True)
os.makedirs(news_base_dir, exist_ok=True)

# 날짜별 파일 경로
dated_json_path = os.path.join(date_dir, 'news_data.json')
latest_json_path = os.path.join(news_base_dir, 'latest.json')

# 통계 정보 생성
total_images = sum(1 for result in all_results if result.get('image_url'))

# 저장할 데이터
news_data = {
    'date': current_date,
    'last_updated': current_time,
    'news_count': len(all_results),
    'total_images': total_images,
    'news': all_results
}

# 최신 데이터 참조 정보
latest_data = {
    'current_date': current_date,
    'last_updated': current_time,
    'news_count': len(all_results),
    'total_images': total_images,
    'data_path': f'/news/{current_date}/news_data.json'
}

try:
    with open(dated_json_path, 'w', encoding='utf-8') as f:
        json.dump(news_data, f, ensure_ascii=False, indent=2)
    print(f"날짜별 뉴스 데이터 저장: {dated_json_path}")
    
    # 2. 최신 데이터 참조 파일 생성
    with open(latest_json_path, 'w', encoding='utf-8') as f:
        json.dump(latest_data, f, ensure_ascii=False, indent=2)
    print(f"최신 데이터 참조 파일 저장: {latest_json_path}")
    
    print(f"총 {len(all_results)}개 뉴스, {total_images}개 이미지 저장")
    print(f"저장 위치: news/{current_date}/")
    
except Exception as e:
    print(f"파일 저장 실패: {e}")

# 기존 날짜 폴더 정리 (7일 이상 된 폴더 삭제)
def cleanup_old_folders():
    try:
        cutoff_date = datetime.datetime.now() - datetime.timedelta(days=7)
        cutoff_str = cutoff_date.strftime('%Y%m%d')
        
        for folder_name in os.listdir(news_base_dir):
            folder_path = os.path.join(news_base_dir, folder_name)
            
            # 날짜 형식의 폴더만 확인 (YYYYMMDD)
            if (os.path.isdir(folder_path) and 
                len(folder_name) == 8 and 
                folder_name.isdigit() and 
                folder_name < cutoff_str):
                
                import shutil
                shutil.rmtree(folder_path)
                print(f"오래된 폴더 삭제: {folder_name}")
                
    except Exception as e:
        print(f"폴더 정리 중 오류: {e}")

# 정리 실행
cleanup_old_folders()
