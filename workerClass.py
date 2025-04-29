from transformers import AutoTokenizer, AutoModelForCausalLM, TextStreamer
import torch
import time

MODEL_NAME = "google/gemma-3-1b-it"

class Worker:
    def __init__(self):
        self.idx = 0
        self.isBusy = 0
        self.model = None
        self.tokenizer = None 
        self.streamer = None

        self.load_model()
        f = open("prompt.txt", 'r')
        self.prompt_content = f.read()
        f.close()

    def load_model(self):
        torch.backends.cuda.enable_mem_efficient_sdp(False)
        torch.backends.cuda.enable_flash_sdp(False)
        torch.backends.cuda.enable_math_sdp(True)
        
        print(self.idx, "model loading...")

        # CUDA 설정
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        print(self.idx, "device", self.device)

        # 모델과 토크나이저 로드
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)       
        model = AutoModelForCausalLM.from_pretrained(
            MODEL_NAME,
            torch_dtype=torch.float16,
            low_cpu_mem_usage=True,
            device_map="auto",
        ).to(self.device)
        model.eval()

        # 스트리머 준비 (타자치듯 출력)
        streamer = TextStreamer(tokenizer, skip_prompt=True, skip_special_tokens=True)

        self.model, self.tokenizer, self.streamer =  model, tokenizer, streamer

    def get_prompt(self, text:str):
        messages = [
            {
                "role" : "user",
                "content": "{}{}".format(self.prompt_content,text)
            }
        ]
        prompt = self.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        return prompt

    def summarize(self, text):
        print("in worker")
        start = time.time()

        inputs = self.tokenizer(self.get_prompt(text), return_tensors="pt").to(self.device)
        prompt_length = len(inputs.input_ids[0])

        print("in worker2")

        output = self.model.generate(
            **inputs,
            do_sample=True,
            temperature=0.2,
            top_k=50,
            top_p=0.95,
            max_new_tokens=512,
            streamer=self.streamer,
        )

        print("in worker3")

        model_response = self.tokenizer.decode(
            output[0][prompt_length:], 
            skip_special_tokens=True
        )

        print(time.time() - start, "SEC")
        return model_response
        

# worker = Worker()
# f = open("1.txt", 'r')
# result = worker.summarize(f.read())

# print(result, type(result))
# f.close()