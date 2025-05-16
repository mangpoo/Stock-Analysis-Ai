from transformers import AutoTokenizer, AutoModelForCausalLM, TextStreamer
import torch
import time
import json
import re
import io
import sys
from threading import Lock

MODEL_NAME = "google/gemma-3-1b-it" # 모델
CONSOLE_PRINT = False # 콘솔 출력 여부

class CustomStreamer: 
    def __init__(self, tokenizer, id, log, console_print):
        self.id = id
        self.tokenizer = tokenizer
        self.skip_prompt = True
        self.skip_special_tokens = True
        self.log = log
        self.console_print = console_print
        
    def put(self, text_id):
        if self.skip_prompt and not hasattr(self, "_is_prompt_skipped"):
            self._is_prompt_skipped = True
            return
        
        # 토큰 디코딩
        text = self.tokenizer.decode(
            text_id, skip_special_tokens=self.skip_special_tokens
        )
        
        if text:
            if(self.console_print): print(text, end ='')
            self.log.put(text)
    
    def end(self):
        self.log.put("\n############### END ###############\n\n")
        self.log._reset()




class Worker:
    def __init__(self, worker_id, worker_log):
        self.idx = worker_id
        self.isBusy = 0
        self.model = None
        self.tokenizer = None 
        self.load_model()
        self.log = worker_log

        f = open("prompt.txt", 'r') # load prompt
        self.prompt_content = f.read()
        f.close()

        print(f"\033[{31 + self.idx % 6}m[Worker {self.idx}]\033[0m: 초기화 완료")
        
    def load_model(self):
        torch.backends.cuda.enable_mem_efficient_sdp(False)
        torch.backends.cuda.enable_flash_sdp(False)
        torch.backends.cuda.enable_math_sdp(True)
        
        print(f"\033[{31 + self.idx % 6}m[Worker {self.idx}]\033[0m: 모델 로딩 중...")
        # CUDA 설정
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        print(f"\033[{31 + self.idx % 6}m[Worker {self.idx}]\033[0m: 장치 - {self.device}")
        # 모델과 토크나이저 로드
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)       
        model = AutoModelForCausalLM.from_pretrained(
            MODEL_NAME,
            torch_dtype=torch.float16,
            low_cpu_mem_usage=True,
            device_map="auto",
        ).to(self.device)
        model.eval()

        self.model, self.tokenizer = model, tokenizer
        print(f"\033[{31 + self.idx % 6}m[Worker {self.idx}]\033[0m: 모델 로딩 완료")
    
    def get_prompt(self, text:str):
        messages = [
            {
                "role" : "user",
                "content": "{}{}".format(self.prompt_content, text)
            }
        ]
        prompt = self.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        return prompt
    
    def format_json_output(self, raw_output):
        """
        모델 출력을 정리하여 단일 JSON 객체 형태로 반환합니다.
        """
        try:
            # JSON 코드 블록 추출 시도
            json_match = re.search(r'```json\s*([\s\S]*?)\s*```', raw_output)
            if json_match:
                json_str = json_match.group(1)
            else:
                # JSON 코드 블록이 없는 경우 전체 텍스트에서 JSON 형식 찾기
                json_str = re.search(r'(\{[\s\S]*\}|\[[\s\S]*\])', raw_output).group(1)
            
            # 문자열을 JSON으로 파싱
            parsed = json.loads(json_str)
            
            # 배열인 경우 첫 번째 항목만 사용하거나 항목들을 병합
            if isinstance(parsed, list) and len(parsed) > 0:
                # 모든 항목 병합
                merged = {
                    "issue": parsed[0].get("issue", ""),
                    "impact": "",
                    "related_tickers": []
                }
                
                # impact 정보 병합
                impact_parts = []
                for item in parsed:
                    if "impact" in item and item["impact"]:
                        impact_parts.append(item["impact"])
                    elif "description" in item and item["description"]:
                        impact_parts.append(item["description"])
                
                merged["impact"] = " ".join(impact_parts)
                
                # related_tickers 병합 및 중복 제거
                all_tickers = []
                for item in parsed:
                    if "related_tickers" in item and item["related_tickers"]:
                        all_tickers.extend(item["related_tickers"])
                
                merged["related_tickers"] = list(set(all_tickers))
                return merged
            
            # 이미 단일 객체인 경우 그대로 반환
            return parsed
            
        except Exception as e:
            print(f"\033[{31 + self.idx % 6}m[Worker {self.idx}]\033[0m: JSON 파싱 오류: {e}")
            # 파싱 실패 시 기본 형식 반환
            return {
                "issue": "뉴스 요약 실패",
                "impact": "요약 과정에서 오류가 발생했습니다.",
                "related_tickers": []
            }
    
    def summarize(self, text):
        start = time.time()
        
        print(f"\033[{31 + self.idx % 6}m[Worker {self.idx}]\033[0m: 요약 작업 시작...")
        print(f"\033[{31 + self.idx % 6}m[Worker {self.idx}]\033[0m: 프롬프트 토큰화 중...")
        
        inputs = self.tokenizer(self.get_prompt(text), return_tensors="pt").to(self.device)
        prompt_length = len(inputs.input_ids[0])
        
        # CustomStreamer를 사용한 실시간 출력
        print(f"\033[{31 + self.idx % 6}m[Worker {self.idx}]\033[0m: 생성 시작 (실시간 출력)...")
        output = self.model.generate(
            **inputs,
            do_sample=True,
            temperature=0.2,
            top_k=50,
            top_p=0.95,
            max_new_tokens=512,
            streamer = CustomStreamer(self.tokenizer, self.idx, self.log, console_print=CONSOLE_PRINT) # 커스텀
        )
        
        # 최종 응답 생성
        model_response = self.tokenizer.decode(
            output[0][prompt_length:], 
            skip_special_tokens=True
        )
        
        print(f"\033[{31 + self.idx % 6}m[Worker {self.idx}]\033[0m: 응답 생성 완료, JSON 형식 처리 중...")
        
        # JSON 형식 처리
        formatted_response = self.format_json_output(model_response)
        final_json = json.dumps(formatted_response, ensure_ascii=False, indent=2)
        
        elapsed = time.time() - start
        print(f"\033[{31 + self.idx % 6}m[Worker {self.idx}]\033[0m: 처리 완료 ({elapsed:.2f}초)")
        # print(f"\033[{31 + self.idx % 6}m[Worker {self.idx}]\033[0m: 최종 JSON:")
        # print(f"{final_json.__str__()}")
        
        return final_json
    