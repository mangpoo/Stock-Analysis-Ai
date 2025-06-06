import openai
import os
from dotenv import load_dotenv
from datetime import datetime
import logging

load_dotenv()

class StockGPTAnalyzer:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY가 환경변수에 설정되지 않았습니다.")
        
        self.client = openai.OpenAI(api_key=self.api_key)
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

    def analyze_stock(self, stock_data):
        try:
            prompt = self._create_analysis_prompt(stock_data)
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "당신은 전문적인 주식 분석가입니다. 주어진 데이터를 바탕으로 객관적이고 신중한 분석을 제공해주세요."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                max_tokens=2000,
                temperature=0.3
            )
            
            analysis_result = response.choices[0].message.content
            
            return {
                "status": "success",
                "analysis": analysis_result,
                "timestamp": datetime.now().isoformat(),
                "token_usage": response.usage.total_tokens
            }
            
        except Exception as e:
            self.logger.error(f"GPT 분석 오류: {str(e)}")
            return {
                "status": "error",
                "message": f"분석 중 오류가 발생했습니다: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }

    def _create_analysis_prompt(self, stock_data):
        prompt = f"""
다음 주식에 대한 상세 분석을 해주세요:

기본 정보:
- 회사명: {stock_data.get('company_name', 'N/A')}
- 종목코드: {stock_data.get('stock_code', 'N/A')}
- 시장: {stock_data.get('country', 'N/A')}

"""
        
        price_history = stock_data.get('price_history', [])
        if price_history:
            prompt += f"최근 주가 동향 ({len(price_history)}일):\n"
            for i, day_data in enumerate(price_history[-10:], 1):
                prompt += f"{i}. {day_data.get('date', 'N/A')}: "
                prompt += f"시가 {day_data.get('open', 'N/A')}, "
                prompt += f"고가 {day_data.get('high', 'N/A')}, "
                prompt += f"저가 {day_data.get('low', 'N/A')}, "
                prompt += f"종가 {day_data.get('close', 'N/A')}, "
                prompt += f"거래량 {day_data.get('volume', 'N/A')}\n"

        news_list = stock_data.get('news', [])
        if news_list:
            prompt += f"\n최근 뉴스 ({len(news_list)}개):\n"
            for i, news in enumerate(news_list, 1):
                prompt += f"{i}. [{news.get('date', 'N/A')}] {news.get('title', 'N/A')}\n"
                if news.get('summary'):
                    prompt += f"   요약: {news.get('summary', 'N/A')}\n"

        prompt += """
분석 요청:
1. 기술적 분석 - 주가 흐름과 추세, 거래량 패턴
2. 뉴스 영향 분석 - 호재/악재 구분, 주가 영향도
3. 종합 투자 관점 - 현재 주가 수준, 단기/중기 전망, 리스크 요소
4. 결론 및 요약

주의: 이는 투자 권유가 아닌 정보 제공 목적입니다.
"""
        
        return prompt

try:
    gpt_analyzer = StockGPTAnalyzer()
    print("GPT 분석기 초기화 완료")
except Exception as e:
    print(f"GPT 분석기 초기화 실패: {e}")
    gpt_analyzer = None
