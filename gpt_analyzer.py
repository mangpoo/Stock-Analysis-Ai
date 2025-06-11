import openai
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

class StockGPTAnalyzer:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY가 환경변수에 설정되지 않았습니다.")
        
        self.client = openai.OpenAI(api_key=self.api_key)

    def analyze_comprehensive(self, stock_data):
        """주가 + 뉴스 통합 분석"""
        try:
            prompt = self._create_comprehensive_prompt(stock_data)
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "당신은 전문적인 주식 분석가입니다. 주가 데이터와 뉴스를 종합하여 객관적이고 신중한 분석을 제공해주세요."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                max_tokens=2000,
                temperature=0.3
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            raise Exception(f"GPT 통합 분석 오류: {str(e)}")

    def analyze_price_only(self, stock_data):
        """주가만 분석"""
        try:
            prompt = self._create_price_prompt(stock_data)
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "당신은 주가 기술적 분석 전문가입니다. 주가 데이터를 바탕으로 간결하고 실용적인 분석을 제공해주세요."
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                max_tokens=1000,
                temperature=0.3
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            raise Exception(f"GPT 주가 분석 오류: {str(e)}")

    def _create_comprehensive_prompt(self, stock_data):
        """통합 분석용 프롬프트 생성"""
        prompt = f"""
다음 주식에 대해 1000자 내외로 분석해주세요:

기본 정보:
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

아래 형식으로 답변해주세요:

1. 기술적 분석:
{주가 흐름과 추세, 거래량 패턴 등}

2. 뉴스 영향 분석:
{호재/악재 구분, 주가 영향도 등}

3. 종합 투자 관점:
{현재 주가 수준, 단기/중기 전망, 리스크 요소 등}

4. 결론 및 요약:
{핵심 포인트 정리}

5. 주의: 이는 투자 권유가 아닌 정보 제공 목적입니다.
"""
        
        return prompt

    def _create_price_prompt(self, stock_data):
        """주가 분석용 프롬프트 생성"""
        price_history = stock_data.get('price_history', [])
        
        prompt = f"""
다음 주가 데이터를 분석하여 아래 형식으로 답변해주세요:

종목: {stock_data.get('stock_code', 'N/A')}
최근 90일 주가 데이터:
"""
        
        for day_data in price_history[-20:]:
            prompt += f"{day_data.get('date')}: 시가 {day_data.get('open')}, 고가 {day_data.get('high')}, 저가 {day_data.get('low')}, 종가 {day_data.get('close')}, 거래량 {day_data.get('volume')}\n"
        
        current_price = price_history[-1].get('close') if price_history else 0
        prev_price = price_history[-2].get('close') if len(price_history) > 1 else current_price
        change_rate = ((current_price - prev_price) / prev_price * 100) if prev_price != 0 else 0
        
        prompt += f"""

현재가: {current_price}
전일 대비: {change_rate:.2f}%

아래 형식으로 정확히 답변해주세요:

{stock_data.get('stock_code')}의 가격은 {current_price}원이에요. 변동폭은 {change_rate:+.2f}%이에요. 위 차트에서의 1차 지지선은 [지지선1]원이고, 2차 지지선은 [지지선2]원이에요. 1차 저항선은 [저항선1]원이고, 2차 저항선은 [저항선2]원이에요. [최근 추세 분석 내용]. 앞으로의 매매 전략을 신중히 고려해보세요.
"""
        
        return prompt
