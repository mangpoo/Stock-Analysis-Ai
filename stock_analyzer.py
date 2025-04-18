import os
import json
import logging
import time
from typing import Dict, Any, Optional, List
from functools import lru_cache
from dotenv import load_dotenv
import openai
import crawler

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 환경 변수 로드
load_dotenv()

# OpenAI API 키 설정
openai.api_key = os.getenv('OPENAI_API_KEY')

class StockNewsAnalyzer:
    """
    뉴스 내용을 분석하여 주가에 미칠 영향과 핵심 정보를 추출하는 클래스
    """
    
    def __init__(self, model: str = "gpt-3.5-turbo", temperature: float = 0.3, max_tokens: int = 1000, max_retries: int = 3):
        """
        초기화 메서드
        
        Args:
            model (str): 사용할 OpenAI 모델
            temperature (float): 응답의 무작위성 정도 (0.0 ~ 1.0)
            max_tokens (int): 응답의 최대 토큰 수
            max_retries (int): API 호출 실패 시 최대 재시도 횟수
        """
        if not openai.api_key:
            logger.error("OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.")
            raise ValueError("OPENAI_API_KEY 환경 변수가 필요합니다.")
        
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.max_retries = max_retries
        
        # 기본 분석 결과 템플릿
        self.default_result = {
            "summary": "",
            "impact": "neutral",
            "impact_reason": "",
            "key_points": [],
            "related_sectors": [],
            "investment_opinion": ""
        }
    
    def analyze_news(self, ticker: str, title: str, content: str) -> Dict[str, Any]:
        """
        뉴스 내용을 분석하여 주가 영향, 핵심 포인트 등을 추출
        
        Args:
            ticker (str): 종목명 또는 티커
            title (str): 뉴스 제목
            content (str): 뉴스 내용
            
        Returns:
            Dict[str, Any]: 분석 결과를 담은 딕셔너리
        """
        # 내용 유효성 검사
        if not content or len(content.strip()) < 10:
            return {"error": "분석할 충분한 뉴스 내용이 없습니다."}
        
        # 분석 프롬프트 구성
        prompt = self._create_analysis_prompt(ticker, title, content)
        
        # API 호출 및 예외 처리
        return self._call_openai_api(prompt)
    
    def _call_openai_api(self, prompt: str) -> Dict[str, Any]:
        """
        OpenAI API 호출 및 재시도 로직
        
        Args:
            prompt (str): API에 전달할 프롬프트
            
        Returns:
            Dict[str, Any]: API 응답 또는 오류 메시지
        """
        for attempt in range(self.max_retries):
            try:
                # GPT API 호출
                response = openai.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "당신은 주식 시장과 기업 분석에 전문성을 갖춘 금융 애널리스트입니다. 뉴스 기사를 분석하여 해당 기업의 주가에 미칠 영향과 핵심 정보를 추출해주세요."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=self.temperature,
                    max_tokens=self.max_tokens
                )
                
                # 응답 추출 및 파싱
                analysis_text = response.choices[0].message.content.strip()
                return self._parse_analysis_result(analysis_text)
                
            except Exception as e:
                error_message = str(e).lower()
                # 레이트 리밋 예외 처리
                if "rate limit" in error_message or "rate_limit" in error_message:
                    if attempt < self.max_retries - 1:
                        wait_time = (attempt + 1) * 2  # 지수 백오프
                        logger.warning(f"Rate limit reached. Retrying in {wait_time} seconds...")
                        time.sleep(wait_time)
                    else:
                        logger.error("Rate limit exceeded after multiple retries.")
                        return {"error": "API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요."}
                else:
                    logger.error(f"OpenAI API 오류: {str(e)}")
                    if attempt < self.max_retries - 1:
                        time.sleep(2)
                    else:
                        return {"error": f"API 오류가 발생했습니다: {str(e)}"}
        
        # 모든 시도 실패 시
        return {"error": "API 호출 실패: 최대 재시도 횟수를 초과했습니다."}
    
    @staticmethod
    def _create_analysis_prompt(ticker: str, title: str, content: str) -> str:
        """
        분석을 위한 프롬프트 생성
        
        Args:
            ticker (str): 종목명 또는 티커
            title (str): 뉴스 제목
            content (str): 뉴스 내용
            
        Returns:
            str: 분석 프롬프트
        """
        return f"""
다음 '{ticker}' 관련 뉴스를 분석하여 JSON 형식으로 결과를 제공해주세요:

종목명: {ticker}
제목: {title}

내용: 
{content}

다음 사항을 분석하여 JSON 형식으로 응답해주세요:
1. 뉴스 내용 요약 (3-4문장)
2. '{ticker}'의 주가에 미칠 영향 (positive, negative, neutral 중 하나)
3. 주가 영향 판단 이유 (반드시 '{ticker}'와의 연관성을 고려할 것)
4. 뉴스에서 언급된 핵심 포인트 (3-5개 항목)
5. 관련 산업 섹터
6. 투자 의견 ('{ticker}'에 대한 간략한 분석과 조언)

중요: 뉴스 내용이 '{ticker}'와 직접적인 관련이 없다면, 이를 명시하고 간접적인 영향이나 연관성을 분석해주세요.
또한, 뉴스가 '{ticker}'와 전혀 관련이 없다면 이를 명확히 밝히고 "not_related"를 impact 값으로 설정해주세요.

JSON 형식으로만 응답해주세요. 예시:
{{
  "summary": "뉴스 요약...",
  "impact": "positive 또는 negative 또는 neutral 또는 not_related",
  "impact_reason": "주가 영향 이유...",
  "key_points": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"],
  "related_sectors": ["산업 섹터 1", "산업 섹터 2"],
  "investment_opinion": "투자 의견..."
}}

JSON 형식만 응답하세요. 분석 결과를 JSON 이외의 형식으로 감싸지 마세요.
"""

    def _parse_analysis_result(self, analysis_text: str) -> Dict[str, Any]:
        """
        GPT의 분석 결과를 파싱하여 구조화된 데이터로 변환
        
        Args:
            analysis_text (str): GPT API 응답 텍스트
            
        Returns:
            Dict[str, Any]: 파싱된 분석 결과
        """
        try:
            # JSON 부분 추출
            json_str = self._extract_json_from_text(analysis_text)
            
            # JSON 파싱
            result = json.loads(json_str)
            
            # 결과 검증 및 기본값 병합
            return {**self.default_result, **result}
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON 파싱 오류: {str(e)}, 원본 텍스트: {analysis_text[:100]}...")
            # JSON 파싱 실패 시 텍스트 기반 파싱 시도
            return self._fallback_text_parsing(analysis_text)
            
        except Exception as e:
            logger.error(f"분석 결과 파싱 중 오류 발생: {str(e)}")
            return {**self.default_result, "summary": "분석 결과 처리 중 오류가 발생했습니다."}
    
    @staticmethod
    def _extract_json_from_text(text: str) -> str:
        """
        텍스트에서 JSON 부분만 추출
        
        Args:
            text (str): 원본 텍스트
            
        Returns:
            str: 추출된 JSON 문자열
        """
        # 코드 블록 내 JSON 추출
        if '```json' in text:
            json_parts = text.split('```json')
            if len(json_parts) > 1:
                return json_parts[1].split('```')[0].strip()
        elif '```' in text:
            json_parts = text.split('```')
            if len(json_parts) > 1:
                return json_parts[1].strip()
        
        # 코드 블록이 없는 경우 원본 텍스트 반환
        return text
    
    def _fallback_text_parsing(self, text: str) -> Dict[str, Any]:
        """
        JSON 파싱 실패 시 텍스트 기반 파싱 시도
        
        Args:
            text (str): 원본 텍스트
            
        Returns:
            Dict[str, Any]: 파싱된 결과
        """
        result = dict(self.default_result)
        
        # 섹션 매핑 정의
        section_keywords = {
            "summary": ["요약", "summary"],
            "impact": ["영향", "impact"],
            "impact_reason": ["이유", "reason"],
            "key_points": ["핵심", "key point"],
            "related_sectors": ["산업", "sector"],
            "investment_opinion": ["투자", "investment", "opinion"]
        }
        
        lines = text.split('\n')
        current_section = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # 현재 라인이 어떤 섹션에 해당하는지 확인
            detected_section = None
            for section, keywords in section_keywords.items():
                if any(keyword in line.lower() for keyword in keywords):
                    detected_section = section
                    # 라인에 내용이 포함된 경우 추출
                    if ":" in line:
                        content = line.split(":", 1)[1].strip()
                        if content:
                            if section == "impact":
                                if "positive" in line.lower():
                                    result["impact"] = "positive"
                                elif "negative" in line.lower():
                                    result["impact"] = "negative"
                                elif "not_related" in line.lower():
                                    result["impact"] = "not_related"
                                else:
                                    result["impact"] = "neutral"
                            elif section in ["key_points", "related_sectors"]:
                                continue  # 리스트 항목은 개별적으로 처리
                            else:
                                result[section] = content
                    break
            
            if detected_section:
                current_section = detected_section
                continue
            
            # 현재 섹션에 내용 추가
            if current_section:
                # 리스트 항목 식별 및 추가
                is_list_item = line.startswith(("-", "*")) or any(f"{i}." in line[:3] for i in range(1, 10))
                
                if current_section in ["key_points", "related_sectors"] and is_list_item:
                    item = line.lstrip("- *0123456789.").strip()
                    if item:
                        result[current_section].append(item)
                elif not result[current_section] and current_section not in ["key_points", "related_sectors"]:
                    result[current_section] = line
        
        return result
    
    @lru_cache(maxsize=32)
    def get_news_with_analysis(self, ticker: str) -> Dict[str, Any]:
        """
        주식 티커로 뉴스를 검색하고 분석 결과 함께 반환
        
        Args:
            ticker (str): 주식 티커 또는 회사명
            
        Returns:
            Dict[str, Any]: 뉴스 정보와 분석 결과를 포함한 딕셔너리
        """
        try:
            # 뉴스 정보 가져오기
            news_data = crawler.get_stock_news(ticker)
            
            # 뉴스 데이터 확인 및 분석
            if not news_data.get("error") and news_data.get("content"):
                analysis_result = self.analyze_news(
                    ticker,  # 종목명도 분석에 전달
                    news_data.get("title", ""), 
                    news_data.get("content", "")
                )
                
                # 분석 결과 병합
                if not analysis_result.get("error"):
                    news_data["analysis"] = analysis_result
                else:
                    news_data["analysis"] = {
                        **self.default_result,
                        "summary": "뉴스 분석 중 오류가 발생했습니다.",
                        "impact_reason": analysis_result.get("error", "알 수 없는 오류")
                    }
            else:
                # 뉴스가 없거나 내용이 부족한 경우
                news_data["analysis"] = {
                    **self.default_result,
                    "summary": "분석할 충분한 뉴스 내용이 없습니다.",
                    "impact_reason": "뉴스 내용 부족으로 분석할 수 없습니다."
                }
            
            return news_data
            
        except Exception as e:
            logger.error(f"뉴스 검색 및 분석 중 오류 발생: {str(e)}")
            return {
                "error": f"뉴스 검색 및 분석 중 오류가 발생했습니다: {str(e)}",
                "title": "",
                "link": "",
                "content": "",
                "image_url": None,
                "analysis": self.default_result
            }