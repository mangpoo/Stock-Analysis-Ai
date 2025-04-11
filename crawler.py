# -*- coding: utf-8 -*-
import httpx
import random
import time
import logging
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.common.exceptions import TimeoutException
from functools import lru_cache
import asyncio

# 간단한 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# User agent rotation list
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.2 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:108.0) Gecko/20100101 Firefox/108.0"
]

def get_random_user_agent():
    return random.choice(USER_AGENTS)

# 드라이버 인스턴스 캐싱
@lru_cache(maxsize=1)
def get_selenium_driver():
    """Create and cache a Selenium driver"""
    chrome_options = Options()
    chrome_options.add_argument("--headless=new") 
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument(f"--user-agent={get_random_user_agent()}")
    chrome_options.add_argument("--disable-extensions")
    chrome_options.add_argument("--disable-browser-side-navigation")
    
    
    # 더 적극적인 리소스 최적화
    chrome_options.add_argument("--disable-javascript")  # 자바스크립트 비활성화 (필요하면 활성화)
    chrome_options.add_argument("--disk-cache-size=1")
    chrome_options.add_argument("--media-cache-size=1")
    chrome_options.add_argument("--disable-application-cache")
    chrome_options.add_argument("--disable-notifications")
    # 빠른 시작 옵션
    chrome_options.add_argument("--disable-popup-blocking")
    chrome_options.add_argument("--disable-web-security")
    
    prefs = {
        "profile.managed_default_content_settings.images": 1,  # 2(차단) -> 1(허용)으로 변경
        "profile.default_content_setting_values.notifications": 2,  # 알림 차단
        "profile.managed_default_content_settings.stylesheets": 2,  # CSS 차단
        "profile.managed_default_content_settings.cookies": 2,  # 쿠키 차단
        "profile.managed_default_content_settings.javascript": 2,  # 자바스크립트 차단
        "profile.managed_default_content_settings.plugins": 2,  # 플러그인 차단
        "profile.managed_default_content_settings.popups": 2,  # 팝업 차단
        "profile.managed_default_content_settings.geolocation": 2,  # 위치 접근 차단
        "profile.managed_default_content_settings.media_stream": 2,  # 미디어 차단
    }
    chrome_options.add_experimental_option("prefs", prefs)
    
    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        # 타임아웃 단축 (45초 → 15초)
        driver.set_page_load_timeout(15)
        return driver
    except Exception as e:
        logger.error(f"Failed to setup Selenium driver: {e}")
        return None

async def get_with_httpx(url, headers, timeout=10.0):
    """비동기 HTTPX 요청 함수"""
    async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=timeout) as client:
        response = await client.get(url)
        return response

async def get_news_meta_async(search_url):
    """비동기 방식으로 뉴스 메타데이터 가져오기"""
    headers = {
        "User-Agent": get_random_user_agent(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Referer": "https://kr.investing.com/",
        "Cache-Control": "no-cache"
    }
    
    try:
        response = await get_with_httpx(search_url, headers)
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, "html.parser")
            news_item = soup.select_one("div.articleItem")
            
            if news_item:
                title_element = news_item.select_one("div.textDiv a.title")
                if title_element:
                    title = title_element.text.strip()
                    link = title_element.get("href")
                    if not link.startswith('http'):
                        link = "https://kr.investing.com" + link
                        
                    return {
                        "title": title,
                        "link": link,
                        "method": "httpx"
                    }
        
        logger.warning(f"Async HTTPX request failed")
        return None
        
    except Exception as e:
        logger.error(f"Async HTTPX error: {e}")
        return None

def get_news_meta_with_httpx(search_url):
    """동기 방식으로 뉴스 메타데이터 가져오기"""
    return asyncio.run(get_news_meta_async(search_url))

def get_news_meta_with_selenium(search_url):
    """Fallback to Selenium if httpx fails with streamlined approach"""
    driver = get_selenium_driver()
    if not driver:
        return {"error": "Selenium 드라이버를 초기화할 수 없습니다."}
    
    try:
        # 특정 DOM 요소를 기다리지 않고 페이지 로드 중단 옵션 사용
        driver.execute_script("window.stop = function() { return true; };")
        driver.get(search_url)
        
        # 짧은 고정 지연 후 바로 데이터 추출 시도 (대기 시간 절약)
        time.sleep(2)
        
        try:
            # 명시적 대기 없이 바로 요소 찾기 시도
            news_items = driver.find_elements(By.CSS_SELECTOR, "div.articleItem")
            if news_items:
                title_element = news_items[0].find_element(By.CSS_SELECTOR, "div.textDiv a.title")
                title = title_element.text.strip()
                link = title_element.get_attribute("href")
                
                return {
                    "title": title,
                    "link": link,
                    "method": "selenium-fast"
                }
            else:
                # 요소를 찾지 못한 경우 JavaScript로 직접 데이터 추출 시도
                result = driver.execute_script("""
                    const articleItem = document.querySelector('div.articleItem');
                    if (!articleItem) return null;
                    
                    const titleElement = articleItem.querySelector('div.textDiv a.title');
                    if (!titleElement) return null;
                    
                    return {
                        title: titleElement.textContent.trim(),
                        link: titleElement.href
                    };
                """)
                
                if result:
                    return {
                        "title": result['title'],
                        "link": result['link'],
                        "method": "selenium-js"
                    }
                
                return {"error": "뉴스 항목을 찾을 수 없습니다."}
        
        except Exception as element_error:
            logger.error(f"Element find error: {element_error}")
            return {"error": str(element_error)}
    
    except Exception as e:
        logger.error(f"Selenium error: {e}")
        return {"error": str(e)}
    
    finally:
        # 불필요해진 드라이버는 닫지 않고 캐시에 유지 (재사용) <- genius :w

        pass

async def get_news_content_async(news_url):
    """비동기 방식으로 뉴스 내용과 이미지 가져오기"""
    headers = {
        "User-Agent": get_random_user_agent(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "no-cache"
    }
    
    try:
        response = await get_with_httpx(news_url, headers)
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, "html.parser")
            
            # 이미지 URL 추출 - 첫 번째 이미지만 가져오기
            image_url = None
            img_tags = soup.select("img.h-full.w-full.object-contain")
            if not img_tags:  # 다른 이미지 선택자도 시도
                img_tags = soup.select("div.WYSIWYG.articlePage img")
            if not img_tags:  # 또 다른 이미지 선택자 시도
                img_tags = soup.select("div.articlePage img")
                
            if img_tags:
                # 첫 번째 이미지만 처리
                src = img_tags[0].get("src")
                if src and (src.startswith("http") or src.startswith("//")):
                    # 상대 경로 URL을 절대 경로로 변환
                    if src.startswith("//"):
                        image_url = "https:" + src
                    else:
                        image_url = src
            
            # 투자닷컴의 주요 기사 본문 선택자
            article_container = soup.select_one("div.WYSIWYG.articlePage")
            
            content_text = ""
            if article_container:
                paragraphs = article_container.find_all("p")
                if paragraphs:
                    content = []
                    for p in paragraphs:
                        text = p.text.strip()
                        if text:  # Skip empty paragraphs
                            content.append(text)
                    
                    if content:
                        content_text = "\n\n".join(content)
            
            # 백업 방법: 모든 p 태그 추출 후 20자 이상인 것만 선택
            if not content_text:
                all_paragraphs = soup.find_all("p")
                if all_paragraphs:
                    content = []
                    for p in all_paragraphs:
                        text = p.text.strip()
                        if len(text) > 20:  # 의미 있는 단락만 포함
                            content.append(text)
                    
                    if content:
                        content_text = "\n\n".join(content)
            
            return {
                "content": content_text if content_text else None,
                "image_url": image_url
            }
        
        return {"content": None, "image_url": None}
        
    except Exception as e:
        logger.error(f"Async HTTPX content error: {e}")
        return {"content": None, "image_url": None}

def get_news_content_with_httpx(news_url):
    """동기 방식으로 뉴스 내용과 이미지 가져오기"""
    return asyncio.run(get_news_content_async(news_url))

def get_news_content_with_selenium(news_url):
    """빠른 Selenium 방식으로 뉴스 내용과 이미지 가져오기"""
    driver = get_selenium_driver()
    if not driver:
        return {"content": "Selenium 드라이버를 초기화할 수 없습니다.", "image_url": None}
    
    try:
        # 페이지 완전 로드 대기 중단하고 부분 내용만 가져오도록 설정
        driver.execute_script("window.stop = function() { return true; };")
        
        # 타임아웃 시간 줄이기 (커스텀 스크립트 타임아웃)
        driver.execute_script("window.setTimeout=function(f,t){return setTimeout(f,Math.min(t,5000));};")
        
        driver.get(news_url)
        
        # 고정 지연 후 바로 콘텐츠 추출
        time.sleep(5)
        
        # 간소화된 JavaScript로 콘텐츠와 이미지 직접 추출
        result = driver.execute_script("""
            // 투자닷컴 본문 내용을 추출하는 가장 빠른 방법
            const paragraphs = [];
            let imageUrl = null;
            
            // 주요 콘텐츠 영역 선택자
            const contentArea = document.querySelector('div.WYSIWYG.articlePage');
            
            // 이미지 추출 - 첫 번째 이미지만 가져오기
            let imgTags = document.querySelectorAll('img.h-full.w-full.object-contain');
            if (imgTags.length === 0) {
                imgTags = document.querySelectorAll('div.WYSIWYG.articlePage img');
            }
            if (imgTags.length === 0) {
                imgTags = document.querySelectorAll('div.articlePage img');
            }
            
            if (imgTags.length > 0) {
                const src = imgTags[0].getAttribute('src');
                if (src && (src.startsWith('http') || src.startsWith('//'))) {
                    // 상대 경로 URL을 절대 경로로 변환
                    if (src.startsWith('//')) {
                        imageUrl = 'https:' + src;
                    } else {
                        imageUrl = src;
                    }
                }
            }
            
            if (contentArea) {
                // p 태그 추출
                const pElements = contentArea.querySelectorAll('p');
                for (const p of pElements) {
                    const text = p.textContent.trim();
                    if (text.length > 0) {
                        paragraphs.push(text);
                    }
                }
            } else {
                // 선택자를 찾지 못한 경우 전체 문서에서 의미 있는 p 태그 추출
                const allParagraphs = document.querySelectorAll('p');
                for (const p of allParagraphs) {
                    const text = p.textContent.trim();
                    if (text.length > 20) {
                        paragraphs.push(text);
                    }
                }
            }
            
            // 결과 반환
            return {
                content: paragraphs.length > 0 ? paragraphs.join('\\n\\n') : null,
                image_url: imageUrl
            };
        """)
        
        if result:
            return result
        return {"content": "content 추출 오류", "image_url": None}
        
    except TimeoutException:
        return {"content": "content 페이지 로딩 시간 초과", "image_url": None}
        
    except Exception as e:
        logger.error(f"Selenium content error: {e}")
        return {"content": f"오류 발생: {str(e)}", "image_url": None}
    
    finally:
        # 불필요해진 드라이버는 닫지 않고 캐시에 유지 (재사용)
        pass

def get_news_meta(search_url):
    """뉴스 메타데이터 가져오기"""
    result = get_news_meta_with_httpx(search_url)
    if result:
        return result
    
    # HTTPX 실패 시 Selenium으로 한 번만 시도
    return get_news_meta_with_selenium(search_url)

def get_news_content(news_url):
    """뉴스 내용과 이미지 가져오기"""
    content = get_news_content_with_httpx(news_url)
    if content and (content.get("content") or content.get("images")):
        return content
    
    # HTTPX 실패 시 Selenium으로 한 번만 시도
    return get_news_content_with_selenium(news_url)

def get_stock_news(ticker):
    """주어진 ticker에 대한 뉴스 가져오기 (JSON 형식)"""
    search_url = f"https://kr.investing.com/search/?q={ticker}&tab=news"
    
    # 뉴스 메타데이터(제목, 링크) 가져오기
    news_meta = get_news_meta(search_url)
    
    # 반환할 JSON 구조 생성
    result = {
        "title": "",
        "link": "",
        "content": "",
        "image_url": None  # 단일 이미지 URL 필드로 변경
    }
    
    if news_meta:
        if "title" in news_meta and "link" in news_meta:
            result["title"] = news_meta["title"]
            result["link"] = news_meta["link"]
            
            # 링크가 있으면 뉴스 내용과 이미지 가져오기
            content_data = get_news_content(news_meta["link"])
            
            if isinstance(content_data, dict):
                result["content"] = content_data.get("content", "본문을 가져올 수 없습니다.")
                result["image_url"] = content_data.get("image_url")
            else:
                # 이전 코드와의 호환성을 위한 처리
                result["content"] = content_data if content_data else "본문을 가져올 수 없습니다."
        elif "error" in news_meta:
            result["error"] = news_meta["error"]
    else:
        result["error"] = "뉴스를 찾을 수 없습니다."
    
    return result

# 드라이버 해제 함수
def cleanup_driver():
    """드라이버 캐시 비우기"""
    get_selenium_driver.cache_clear()