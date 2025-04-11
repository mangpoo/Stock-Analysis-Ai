import React from 'react';
import './NewsSection.css';

export default function NewsSection() {
  return (
    <div className="news-section">
      <h2>주요 뉴스</h2>
      <div className="news-container">
        {[...Array(20)].map((_, idx) => (
          <div key={idx} className="news-item">
            <h3>뉴스 제목 {idx + 1}</h3>
            <p>뉴스 요약 내용...</p>
          </div>
        ))}
      </div>
    </div>
  );
}
