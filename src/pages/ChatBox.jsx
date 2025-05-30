import React, { useEffect, useState } from 'react';
import MainLayout from '../components/MainLayout';

export default function ChatStatic() {
  const [reply, setReply] = useState('GPT에게 질문 중입니다...');

  useEffect(() => {
    const fetchGPT = async () => {
      const API_KEY = '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'; // 테스트용
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'user', content: '삼성전자에 대해 간단히 설명해줘.' }, // GPT에게 질문할 내용 작성
          ],
        }),
      });

      const data = await response.json();

      if (!data.choices || !data.choices[0]) {
        setReply('GPT 응답을 불러올 수 없습니다.');
        console.error('응답 오류:', data);
        return;
      }

      setReply(data.choices[0].message.content);
    };

    fetchGPT();
  }, []);

  return (
    <MainLayout>
      <div style={{ padding: '40px', maxWidth: '700px', margin: 'auto' }}>
        <h2>GPT의 대답</h2>
        <div style={{ whiteSpace: 'pre-wrap' }}>{reply}</div>
      </div>
    </MainLayout>
  );
}
